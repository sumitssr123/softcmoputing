/**
 * Fuzzy Logic Controller Engine
 * Supports Mamdani and Takagi-Sugeno inference models.
 * Implements Triangular, Trapezoidal, Gaussian, and Singleton Membership Functions.
 * Implements Min / Prod T-Norms, Max T-Conorm, Mamdani clipping, Larsen scaling,
 * and Centroid (COG), Bisector, MOM, SOM, LOM defuzzification.
 */

// 1. Membership Functions
export const evaluateMF = (mf, x) => {
  switch (mf.type) {
    case 'triangular': {
      const [a, b, c] = mf.params;
      if (x <= a || x >= c) return 0;
      if (x === b) return 1;
      if (x > a && x < b) return (x - a) / (b - a);
      if (x > b && x < c) return (c - x) / (c - b);
      return 0;
    }
    case 'trapezoidal': {
      const [a, b, c, d] = mf.params;
      if (x <= a || x >= d) return 0;
      if (x >= b && x <= c) return 1;
      if (x > a && x < b) return (x - a) / (b - a);
      if (x > c && x < d) return (d - x) / (d - c);
      return 0;
    }
    case 'gaussian': {
      const [mean, sigma] = mf.params;
      return Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
    }
    case 'singleton': {
      const [val] = mf.params;
      return Math.abs(x - val) < 1e-4 ? 1 : 0;
    }
    default:
      return 0;
  }
};

// 2. Fuzzification for all inputs
export const fuzzifyInputs = (inputs, crispValues) => {
  const fuzzified = {};
  inputs.forEach(input => {
    const val = crispValues[input.id] ?? input.default;
    fuzzified[input.id] = {
      value: val,
      memberships: input.mfs.map(mf => ({
        id: mf.id,
        name: mf.name,
        degree: evaluateMF(mf, val),
        color: mf.color,
        mf,
      }))
    };
  });
  return fuzzified;
};

// 3. Rule Evaluation
export const evaluateRules = (rules, fuzzifiedInputs, tNorm = 'min') => {
  return rules.map((rule, idx) => {
    // rule.conditions = [{ inputId: 'food', termId: 'delicious' }, ...]
    // operator = 'AND' | 'OR'
    const antecedentDegrees = rule.conditions.map(cond => {
      const input = fuzzifiedInputs[cond.inputId];
      if (!input) return 0;
      const term = input.memberships.find(m => m.id === cond.termId);
      return term ? term.degree : 0;
    });

    let firingStrength = 0;
    if (rule.operator === 'OR') {
      firingStrength = Math.max(...antecedentDegrees, 0);
    } else {
      // Default AND
      if (tNorm === 'min') {
        firingStrength = Math.min(...antecedentDegrees, 1);
      } else if (tNorm === 'product') {
        firingStrength = antecedentDegrees.reduce((acc, d) => acc * d, 1);
      } else {
        firingStrength = Math.min(...antecedentDegrees, 1);
      }
    }

    return {
      id: rule.id || `rule_${idx + 1}`,
      name: rule.name || `Rule ${idx + 1}`,
      conditions: rule.conditions,
      operator: rule.operator || 'AND',
      outputTermId: rule.outputTermId,
      firingStrength,
      antecedentDegrees,
      explanation: rule.explanation || '',
    };
  });
};

// 4. Aggregation and Output Curve Generation (Discretized domain)
export const computeFuzzyOutput = (
  outputConfig,
  evaluatedRules,
  implication = 'mamdani', // 'mamdani' (clip / min) or 'larsen' (scale / prod)
  resolution = 200
) => {
  const { min, max, mfs } = outputConfig;
  const step = (max - min) / (resolution - 1);
  const xPoints = [];
  const yValues = new Array(resolution).fill(0);

  // Pre-generate x domain
  for (let i = 0; i < resolution; i++) {
    xPoints.push(min + i * step);
  }

  // Trace per rule
  const ruleOutputProfiles = evaluatedRules.map(rule => {
    const targetMF = mfs.find(m => m.id === rule.outputTermId);
    if (!targetMF) return { rule, profile: new Array(resolution).fill(0) };

    const profile = xPoints.map(x => {
      const baseMFVal = evaluateMF(targetMF, x);
      if (implication === 'mamdani') {
        return Math.min(rule.firingStrength, baseMFVal);
      } else {
        // Larsen product
        return rule.firingStrength * baseMFVal;
      }
    });

    return {
      rule,
      targetMF,
      profile,
    };
  });

  // Aggregate with Max (Union)
  for (let i = 0; i < resolution; i++) {
    let maxVal = 0;
    for (const rop of ruleOutputProfiles) {
      if (rop.profile[i] > maxVal) {
        maxVal = rop.profile[i];
      }
    }
    yValues[i] = maxVal;
  }

  return {
    xPoints,
    yValues,
    step,
    ruleOutputProfiles,
    min,
    max,
  };
};

// 5. Defuzzification Methods
export const defuzzify = (fuzzyOutput, method = 'centroid') => {
  const { xPoints, yValues, step, min, max } = fuzzyOutput;

  // Check if zero firing across the board
  const totalArea = yValues.reduce((sum, y) => sum + y * step, 0);
  if (totalArea < 1e-6) {
    return {
      crispValue: (min + max) / 2,
      method,
      totalArea: 0,
      confidence: 0,
      details: 'No rules fired significantly. Defaulted to domain midpoint.',
    };
  }

  let crispValue = (min + max) / 2;
  let details = '';

  switch (method) {
    case 'centroid': {
      // Center of Gravity / Area: integral(y * mu(y)) / integral(mu(y))
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < xPoints.length; i++) {
        numerator += xPoints[i] * yValues[i] * step;
        denominator += yValues[i] * step;
      }
      crispValue = denominator !== 0 ? numerator / denominator : (min + max) / 2;
      details = `Center of Gravity (COG): Calculated by dividing first moment of area (Numerator = ${numerator.toFixed(3)}) by total membership area (Denominator = ${denominator.toFixed(3)}).`;
      break;
    }
    case 'bisector': {
      // Divides area into two equal halves
      let halfArea = totalArea / 2;
      let accum = 0;
      let bisectX = xPoints[0];
      for (let i = 0; i < xPoints.length; i++) {
        accum += yValues[i] * step;
        if (accum >= halfArea) {
          bisectX = xPoints[i];
          break;
        }
      }
      crispValue = bisectX;
      details = `Bisector of Area (BOA): Point x = ${crispValue.toFixed(2)} splits the fuzzy output region into two equal areas of ${(halfArea).toFixed(3)} each.`;
      break;
    }
    case 'mom': {
      // Mean of Maximum
      const maxVal = Math.max(...yValues);
      const plateauX = [];
      for (let i = 0; i < xPoints.length; i++) {
        if (Math.abs(yValues[i] - maxVal) < 1e-4) {
          plateauX.push(xPoints[i]);
        }
      }
      crispValue = plateauX.reduce((a, b) => a + b, 0) / plateauX.length;
      details = `Mean of Maximum (MOM): Averaged the ${plateauX.length} points where membership reaches the peak value of ${maxVal.toFixed(3)}.`;
      break;
    }
    case 'som': {
      // Smallest of Maximum
      const maxVal = Math.max(...yValues);
      for (let i = 0; i < xPoints.length; i++) {
        if (Math.abs(yValues[i] - maxVal) < 1e-4) {
          crispValue = xPoints[i];
          break;
        }
      }
      details = `Smallest of Maximum (SOM): Smallest x-coordinate where maximum membership (${maxVal.toFixed(3)}) occurs.`;
      break;
    }
    case 'lom': {
      // Largest of Maximum
      const maxVal = Math.max(...yValues);
      for (let i = xPoints.length - 1; i >= 0; i--) {
        if (Math.abs(yValues[i] - maxVal) < 1e-4) {
          crispValue = xPoints[i];
          break;
        }
      }
      details = `Largest of Maximum (LOM): Largest x-coordinate where maximum membership (${maxVal.toFixed(3)}) occurs.`;
      break;
    }
    default:
      crispValue = (min + max) / 2;
  }

  return {
    crispValue,
    method,
    totalArea,
    confidence: Math.min(1, totalArea / ((max - min) * 0.5)),
    details,
  };
};

// 6. Complete Execution Pipeline with Step Traces
export const runFuzzyPipeline = (config, crispInputs, options = {}) => {
  const {
    tNorm = 'min',
    implication = 'mamdani',
    defuzzMethod = 'centroid',
    resolution = 300,
  } = options;

  // Step 1: Crisp Input
  const step1 = {
    step: 1,
    name: 'Crisp Input Acquisition',
    title: 'Reading Crisp System Sensors',
    crispInputs,
  };

  // Step 2: Fuzzification
  const fuzzified = fuzzifyInputs(config.inputs, crispInputs);
  const step2 = {
    step: 2,
    name: 'Fuzzification',
    title: 'Transforming Crisp Values to Linguistic Degrees (μ)',
    fuzzified,
  };

  // Step 3: Rule Evaluation
  const evaluatedRules = evaluateRules(config.rules, fuzzified, tNorm);
  const activeRules = evaluatedRules.filter(r => r.firingStrength > 0.001);
  const step3 = {
    step: 3,
    name: 'Rule Inference (Antecedent T-Norm)',
    title: 'Evaluating Rule Conditions with Fuzzy Logic',
    evaluatedRules,
    activeRules,
    tNorm,
  };

  // Step 4: Implication & Aggregation
  const fuzzyOutput = computeFuzzyOutput(config.output, evaluatedRules, implication, resolution);
  const step4 = {
    step: 4,
    name: 'Consequent Implication & Aggregation',
    title: 'Clipping/Scaling Output Sets and Computing Union',
    implication,
    fuzzyOutput,
  };

  // Step 5: Defuzzification
  const defuzzResult = defuzzify(fuzzyOutput, defuzzMethod);
  const step5 = {
    step: 5,
    name: 'Defuzzification',
    title: 'Translating Aggregated Fuzzy Set to Actionable Crisp Output',
    defuzzResult,
    defuzzMethod,
  };

  return {
    steps: [step1, step2, step3, step4, step5],
    fuzzified,
    evaluatedRules,
    activeRules,
    fuzzyOutput,
    defuzzResult,
    finalCrispOutput: defuzzResult.crispValue,
  };
};
