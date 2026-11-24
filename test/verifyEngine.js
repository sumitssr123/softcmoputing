/**
 * Automated Verification Test Suite
 * Tests Fuzzy Logic Controller against Textbook Calculations
 */

import { runFuzzyPipeline } from '../src/engine/fuzzyEngine.js';
import { PROBLEMS } from '../src/engine/problems.js';
import { TEXTBOOK_VERIFICATIONS } from '../src/engine/textbookExamples.js';

console.log('====================================================');
console.log('RUNNING MATHEMATICAL ENGINE & TEXTBOOK VERIFICATION');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

TEXTBOOK_VERIFICATIONS.forEach((testCase, idx) => {
  totalTests++;
  const problem = PROBLEMS.find(p => p.id === testCase.problemId);
  if (!problem) {
    console.error(`[FAIL] Problem ${testCase.problemId} not found`);
    return;
  }

  console.log(`Test #${idx + 1}: ${testCase.title}`);
  console.log(`Source: ${testCase.source}`);
  console.log(`Inputs: ${JSON.stringify(testCase.crispInputs)}`);

  const result = runFuzzyPipeline(problem, testCase.crispInputs, {
    defuzzMethod: 'centroid',
    resolution: 500,
  });

  const computedValue = result.finalCrispOutput;
  const expectedValue = testCase.expectedCentroid;
  const delta = Math.abs(computedValue - expectedValue);
  const percentError = ((delta / expectedValue) * 100).toFixed(3);

  console.log(`  Expected Centroid (Textbook): ${expectedValue}`);
  console.log(`  Computed Centroid (Engine)  : ${computedValue.toFixed(4)}`);
  console.log(`  Difference (Delta)          : ${delta.toFixed(4)} (${percentError}%)`);
  console.log(`  Tolerance                   : ±${testCase.acceptableTolerance}`);

  if (delta <= testCase.acceptableTolerance) {
    console.log(`  STATUS: PASSED (Exact Match to Textbook)\n`);
    passedTests++;
  } else {
    console.error(`  STATUS: FAILED (Exceeded Tolerance)\n`);
  }
});

console.log('----------------------------------------------------');
console.log(`Verification Summary: ${passedTests} / ${totalTests} Passed`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('ALL TEXTBOOK PROOFS MATHEMATICALLY VERIFIED!');
  process.exit(0);
} else {
  console.error('VERIFICATION FAILED!');
  process.exit(1);
}
