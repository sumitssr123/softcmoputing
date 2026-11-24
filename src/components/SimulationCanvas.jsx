import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Gauge, ShieldCheck, Flame } from 'lucide-react';
import { runFuzzyPipeline } from '../engine/fuzzyEngine';

export const SimulationCanvas = ({
  problem,
  crispInputs,
  setCrispInputs,
  pipelineResult,
}) => {
  const canvasRef = useRef(null);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const simStateRef = useRef({});

  // Initialize or reset dynamic simulation state depending on problem
  useEffect(() => {
    if (problem.id === 'braking') {
      simStateRef.current = {
        carX: 50,
        obstacleX: 420,
        currentSpeedKmH: crispInputs.speed || 75,
        targetSpeedKmH: crispInputs.speed || 75,
        brakeForce: pipelineResult.finalCrispOutput || 0,
        stopped: false,
        collided: false,
      };
    } else if (problem.id === 'pendulum') {
      simStateRef.current = {
        cartX: 250,
        cartV: 0,
        angleRad: ((crispInputs.angle || 8.5) * Math.PI) / 180,
        angleVRad: ((crispInputs.angularVelocity || -15) * Math.PI) / 180,
      };
    }
  }, [problem.id]);

  // Main interactive render & physics loop
  useEffect(() => {
    let animId = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (problem.id === 'braking') {
        renderBrakingSimulation(ctx, canvas, dt, isSimRunning);
      } else if (problem.id === 'pendulum') {
        renderPendulumSimulation(ctx, canvas, dt, isSimRunning);
      } else {
        renderDefaultSimulation(ctx, canvas);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [problem.id, isSimRunning, crispInputs, pipelineResult]);

  // 1. Autonomous Braking Simulation Renderer
  const renderBrakingSimulation = (ctx, canvas, dt, isRunning) => {
    const s = simStateRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // Road background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Highway asphalt
    const roadY = h * 0.55;
    const roadHeight = 70;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, roadY, w, roadHeight);

    // Road borders
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, roadY, w, roadHeight);

    // Road center dashes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 12]);
    ctx.beginPath();
    ctx.moveTo(0, roadY + roadHeight / 2);
    ctx.lineTo(w, roadY + roadHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Physics step if running
    if (isRunning && !s.stopped && !s.collided) {
      // Current distance in meters (scaled: 3.5 px per meter)
      const currentDistM = Math.max(0, (s.obstacleX - (s.carX + 60)) / 3.5);
      
      // Query Fuzzy Controller in real-time
      const res = runFuzzyPipeline(problem, {
        speed: s.currentSpeedKmH,
        distance: currentDistM,
      });
      const brakePressure = res.finalCrispOutput; // 0 to 100%
      s.brakeForce = brakePressure;

      // Deceleration: a = (brakePressure / 100) * 9.8 m/s^2 (max ~1g)
      const decelMps2 = (brakePressure / 100) * 8.5;
      const speedMps = (s.currentSpeedKmH * 1000) / 3600;
      const newSpeedMps = Math.max(0, speedMps - decelMps2 * dt);
      s.currentSpeedKmH = (newSpeedMps * 3600) / 1000;

      // Update position
      s.carX += newSpeedMps * dt * 4.5;

      // Update parent inputs so charts react in real-time!
      setCrispInputs({
        speed: parseFloat(s.currentSpeedKmH.toFixed(1)),
        distance: parseFloat(currentDistM.toFixed(1)),
      });

      if (s.currentSpeedKmH <= 0.1) {
        s.stopped = true;
        s.currentSpeedKmH = 0;
      }
      if (s.carX + 60 >= s.obstacleX) {
        s.collided = true;
        s.stopped = true;
        s.currentSpeedKmH = 0;
      }
    }

    // Draw Obstacle (Static Red Hazard Vehicle / Wall)
    const obstY = roadY + 12;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(s.obstacleX, obstY, 45, 45);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.strokeRect(s.obstacleX, obstY, 45, 45);
    // Hazard stripes on obstacle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('HAZARD', s.obstacleX + 3, obstY + 26);

    // Radar scan cone from car to obstacle
    const radarStartX = s.carX + 60;
    const radarStartY = roadY + 35;
    const radarGradient = ctx.createRadialGradient(
      radarStartX, radarStartY, 10,
      radarStartX, radarStartY, Math.max(20, s.obstacleX - radarStartX)
    );
    radarGradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    radarGradient.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
    ctx.fillStyle = radarGradient;
    ctx.beginPath();
    ctx.moveTo(radarStartX, radarStartY);
    ctx.lineTo(s.obstacleX, obstY - 5);
    ctx.lineTo(s.obstacleX, obstY + 50);
    ctx.closePath();
    ctx.fill();

    // Draw Autonomous Car (Cyan/Blue futuristic vehicle)
    const carY = roadY + 14;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(s.carX, carY, 60, 42, 6);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(s.carX + 32, carY + 6, 18, 30, 3);
    ctx.fill();

    // Headlights beam
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.moveTo(s.carX + 60, carY + 8);
    ctx.lineTo(s.carX + 110, carY);
    ctx.lineTo(s.carX + 110, carY + 42);
    ctx.lineTo(s.carX + 60, carY + 34);
    ctx.closePath();
    ctx.fill();

    // Brake lights if braking > 15%
    if (pipelineResult.finalCrispOutput > 15 || s.brakeForce > 15) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(s.carX - 2, carY + 4, 4, 10);
      ctx.fillRect(s.carX - 2, carY + 28, 4, 10);
      ctx.shadowBlur = 0; // reset
    }

    // Telemetry HUD overlay on top
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(15, 12, 280, 50);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(15, 12, 280, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`SPEED: ${(s.currentSpeedKmH || crispInputs.speed).toFixed(1)} km/h`, 25, 28);
    ctx.fillText(`DISTANCE: ${(Math.max(0, (s.obstacleX - (s.carX + 60)) / 3.5)).toFixed(1)} m`, 25, 42);
    
    ctx.fillStyle = pipelineResult.finalCrispOutput > 50 ? '#ef4444' : '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`BRAKE CLAMP: ${pipelineResult.finalCrispOutput.toFixed(1)}%`, 140, 28);

    if (s.collided) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('COLLISION OCCURRED!', w / 2 - 80, roadY - 15);
    } else if (s.stopped) {
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SAFE STOP ACHIEVED', w / 2 - 70, roadY - 15);
    }
  };

  // 2. Inverted Pendulum Simulation Renderer
  const renderPendulumSimulation = (ctx, canvas, dt, isRunning) => {
    const s = simStateRef.current;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Track line
    const trackY = h * 0.72;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, trackY);
    ctx.lineTo(w - 40, trackY);
    ctx.stroke();

    // Physics step if running
    if (isRunning) {
      // Angle in degrees
      const angleDeg = (s.angleRad * 180) / Math.PI;
      const angleVDeg = (s.angleVRad * 180) / Math.PI;

      // Query Fuzzy Controller for Cart Force
      const res = runFuzzyPipeline(problem, {
        angle: angleDeg,
        angularVelocity: angleVDeg,
      });
      const motorForce = res.finalCrispOutput; // -50N to +50N

      // Non-linear inverted pendulum physics model
      const g = 9.81;
      const M = 1.0; // cart mass kg
      const m = 0.15; // pole mass kg
      const l = 0.6; // half pole length m
      const F = motorForce;

      const sinA = Math.sin(s.angleRad);
      const cosA = Math.cos(s.angleRad);

      const temp = (F + m * l * s.angleVRad * s.angleVRad * sinA) / (M + m);
      const thetaAcc = (g * sinA - cosA * temp) / (l * (4.0 / 3.0 - (m * cosA * cosA) / (M + m)));
      const cartAcc = temp - (m * l * thetaAcc * cosA) / (M + m);

      // Integrate
      s.angleVRad += thetaAcc * dt;
      s.angleRad += s.angleVRad * dt;
      s.cartV += cartAcc * dt;
      s.cartX += s.cartV * dt * 25; // scaled

      // Constrain cart to track
      if (s.cartX < 80) { s.cartX = 80; s.cartV = 0; }
      if (s.cartX > w - 80) { s.cartX = w - 80; s.cartV = 0; }

      // Update parent inputs
      setCrispInputs({
        angle: parseFloat(((s.angleRad * 180) / Math.PI).toFixed(1)),
        angularVelocity: parseFloat(((s.angleVRad * 180) / Math.PI).toFixed(1)),
      });
    }

    // Draw Cart
    const cartWidth = 60;
    const cartHeight = 30;
    const cartX = isRunning ? s.cartX : w / 2;
    const cartY = trackY - cartHeight;

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cartX - cartWidth / 2, cartY, cartWidth, cartHeight);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cartX - cartWidth / 2, cartY, cartWidth, cartHeight);

    // Cart Wheels
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(cartX - 18, trackY, 6, 0, Math.PI * 2);
    ctx.arc(cartX + 18, trackY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pivot Point
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cartX, cartY + 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pendulum Pole
    const currentAngleRad = isRunning
      ? s.angleRad
      : ((crispInputs.angle || 0) * Math.PI) / 180;
    const poleLength = 95;
    const poleEndX = cartX + poleLength * Math.sin(currentAngleRad);
    const poleEndY = (cartY + 6) - poleLength * Math.cos(currentAngleRad);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cartX, cartY + 6);
    ctx.lineTo(poleEndX, poleEndY);
    ctx.stroke();

    // Pendulum tip bob
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(poleEndX, poleEndY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Force vector arrow
    const force = pipelineResult.finalCrispOutput;
    if (Math.abs(force) > 1) {
      const arrowLen = (force / 50) * 40;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cartX, cartY + cartHeight / 2);
      ctx.lineTo(cartX + arrowLen, cartY + cartHeight / 2);
      ctx.stroke();
    }
  };

  // 3. Generic Simulation for other problems
  const renderDefaultSimulation = (ctx, canvas) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Decorative graphical gauge
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 20, 70, Math.PI, 2 * Math.PI);
    ctx.stroke();

    const outputVal = pipelineResult.finalCrispOutput;
    const minO = problem.output.min;
    const maxO = problem.output.max;
    const ratio = Math.max(0, Math.min(1, (outputVal - minO) / (maxO - minO)));

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 20, 70, Math.PI, Math.PI + ratio * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${outputVal.toFixed(2)} ${problem.output.unit}`, w / 2, h / 2 + 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${problem.output.name}`, w / 2, h / 2 + 35);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span>Interactive Real-World Plant Simulation</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical closed-loop execution. Watch fuzzy outputs control real continuous plant dynamics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSimRunning(!isSimRunning)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              isSimRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isSimRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Dynamic Loop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Dynamic Loop</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsSimRunning(false);
              if (problem.id === 'braking') {
                simStateRef.current = {
                  carX: 50,
                  obstacleX: 420,
                  currentSpeedKmH: 75,
                  targetSpeedKmH: 75,
                  brakeForce: 0,
                  stopped: false,
                  collided: false,
                };
                setCrispInputs({ speed: 75, distance: 32 });
              } else if (problem.id === 'pendulum') {
                simStateRef.current = {
                  cartX: 250,
                  cartV: 0,
                  angleRad: (8.5 * Math.PI) / 180,
                  angleVRad: (-15 * Math.PI) / 180,
                };
                setCrispInputs({ angle: 8.5, angularVelocity: -15 });
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulation Viewport */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={210}
          className="w-full h-auto block select-none"
        />
      </div>
    </div>
  );
};
