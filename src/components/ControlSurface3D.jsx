import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Box, RotateCw, ZoomIn, ZoomOut, Sliders } from 'lucide-react';
import { runFuzzyPipeline } from '../engine/fuzzyEngine';

export const ControlSurface3D = ({ problem, currentCrispInputs }) => {
  const canvasRef = useRef(null);

  // Rotation angles & zoom for 3D projection
  const [rotX, setRotX] = useState(0.6); // pitch
  const [rotY, setRotY] = useState(-0.7); // yaw
  const [zoom, setZoom] = useState(1.0);
  const [wireframe, setWireframe] = useState(false);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const input1 = problem.inputs[0];
  const input2 = problem.inputs[1];
  const output = problem.output;

  // Compute 20x20 grid of surface points
  const gridResolution = 20;
  const surfaceData = useMemo(() => {
    if (!input1 || !input2) return null;

    const xStep = (input1.max - input1.min) / (gridResolution - 1);
    const yStep = (input2.max - input2.min) / (gridResolution - 1);

    const grid = [];
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < gridResolution; i++) {
      const row = [];
      const xVal = input1.min + i * xStep;
      for (let j = 0; j < gridResolution; j++) {
        const yVal = input2.min + j * yStep;
        const res = runFuzzyPipeline(problem, {
          [input1.id]: xVal,
          [input2.id]: yVal,
        });
        const zVal = res.finalCrispOutput;
        if (zVal < minZ) minZ = zVal;
        if (zVal > maxZ) maxZ = zVal;

        // Normalized coords [-1, 1]
        const normX = ((xVal - input1.min) / (input1.max - input1.min)) * 2 - 1;
        const normY = ((yVal - input2.min) / (input2.max - input2.min)) * 2 - 1;
        row.push({ x: normX, y: normY, z: zVal, realX: xVal, realY: yVal });
      }
      grid.push(row);
    }

    return { grid, minZ, maxZ };
  }, [problem, input1, input2]);

  // Current operating point
  const currentZ = useMemo(() => {
    if (!input1 || !input2) return 0;
    const res = runFuzzyPipeline(problem, currentCrispInputs);
    return res.finalCrispOutput;
  }, [problem, currentCrispInputs, input1, input2]);

  // 3D Rendering on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !surfaceData) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 3D rotation & projection math
    const project = (x, y, zNorm) => {
      // Scale height
      const zHeight = -zNorm * 1.2;

      // Rotate around Y axis (yaw)
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY + y * sinY;
      const y1 = -x * sinY + y * cosY;

      // Rotate around X axis (pitch)
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = y1 * cosX - zHeight * sinX;
      const z2 = y1 * sinX + zHeight * cosX;

      // Perspective projection
      const cameraDist = 3.5 / zoom;
      const fov = 380;
      const scale = fov / (cameraDist + y2);

      return {
        px: width / 2 + x1 * scale,
        py: height / 2 + z2 * scale + 20,
        depth: y2,
      };
    };

    const { grid, minZ, maxZ } = surfaceData;
    const zRange = Math.max(0.001, maxZ - minZ);

    // Build mesh quads
    const quads = [];
    for (let i = 0; i < gridResolution - 1; i++) {
      for (let j = 0; j < gridResolution - 1; j++) {
        const p00 = grid[i][j];
        const p10 = grid[i + 1][j];
        const p11 = grid[i + 1][j + 1];
        const p01 = grid[i][j + 1];

        const zNorm00 = (p00.z - minZ) / zRange;
        const zNorm10 = (p10.z - minZ) / zRange;
        const zNorm11 = (p11.z - minZ) / zRange;
        const zNorm01 = (p01.z - minZ) / zRange;

        const proj00 = project(p00.x, p00.y, zNorm00);
        const proj10 = project(p10.x, p10.y, zNorm10);
        const proj11 = project(p11.x, p11.y, zNorm11);
        const proj01 = project(p01.x, p01.y, zNorm01);

        const avgDepth = (proj00.depth + proj10.depth + proj11.depth + proj01.depth) / 4;
        const avgZNorm = (zNorm00 + zNorm10 + zNorm11 + zNorm01) / 4;

        quads.push({
          pts: [proj00, proj10, proj11, proj01],
          avgDepth,
          avgZNorm,
        });
      }
    }

    // Painter's algorithm: sort back-to-front
    quads.sort((a, b) => b.avgDepth - a.avgDepth);

    // Render Quads
    quads.forEach((quad) => {
      ctx.beginPath();
      ctx.moveTo(quad.pts[0].px, quad.pts[0].py);
      for (let k = 1; k < 4; k++) {
        ctx.lineTo(quad.pts[k].px, quad.pts[k].py);
      }
      ctx.closePath();

      // Smooth color gradient (Blue -> Cyan -> Emerald -> Amber -> Crimson)
      const hue = (1 - quad.avgZNorm) * 220; // 220 (blue) to 0 (red)
      ctx.fillStyle = `hsla(${hue}, 85%, 45%, 0.85)`;
      ctx.fill();

      ctx.strokeStyle = wireframe ? 'rgba(255, 255, 255, 0.4)' : `hsla(${hue}, 85%, 35%, 0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Render Current Operating Point Beacon
    if (input1 && input2) {
      const curX = ((currentCrispInputs[input1.id] - input1.min) / (input1.max - input1.min)) * 2 - 1;
      const curY = ((currentCrispInputs[input2.id] - input2.min) / (input2.max - input2.min)) * 2 - 1;
      const curZNorm = (currentZ - minZ) / zRange;

      const marker = project(curX, curY, curZNorm);

      // Glowing pulsating sphere
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(marker.px, marker.py, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `Operating Point: ${currentZ.toFixed(2)} ${output.unit}`,
        marker.px + 12,
        marker.py - 10
      );
    }
  }, [surfaceData, rotX, rotY, zoom, wireframe, currentCrispInputs, currentZ, input1, input2, output]);

  // Mouse drag handlers for rotating 3D surface
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + dx * 0.008);
    setRotX((prev) => Math.max(-1.2, Math.min(1.2, prev + dy * 0.008)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-bold text-sm tracking-wide text-slate-200 uppercase flex items-center space-x-2">
            <Box className="w-4 h-4 text-sky-400" />
            <span>3D Control Surface Manifold: Z = f(X, Y)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full non-linear control mapping between <strong>{input1?.name}</strong> (X-axis), <strong>{input2?.name}</strong> (Y-axis), and <strong>{output?.name}</strong> (Z-height).
          </p>
        </div>

        {/* 3D Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
              wireframe ? 'bg-sky-500/20 border-sky-400 text-sky-200' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Wireframe
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setRotX(0.6);
              setRotY(-0.7);
              setZoom(1.0);
            }}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Reset Perspective"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={700}
          height={380}
          className="w-full h-auto block"
        />

        {/* Floating Rotation Hint */}
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 backdrop-blur pointer-events-none">
          Click &amp; drag to rotate 3D view
        </div>

        {/* Elevation Legend */}
        <div className="absolute top-3 left-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800 backdrop-blur text-[10px] font-mono">
          <span className="text-slate-400 block mb-1">Elevation (Z):</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-blue-400">Low</span>
            <div className="w-20 h-2 rounded bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-red-500" />
            <span className="text-red-400">High</span>
          </div>
        </div>
      </div>
    </div>
  );
};
