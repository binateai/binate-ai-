/**
 * Test script for the JSON parsing helper function
 */
import { extractJsonFromResponse } from './server/ai-service.js';

// Test cases for different response formats that Claude might return
const testCases = [
  {
    name: "Plain JSON response",
    input: `{ "name": "John Doe", "email": "john@example.com", "confidence": 0.95 }`,
    expectSuccess: true
  },
  {
    name: "JSON in markdown code block (```json)",
    input: "Here is the extracted information:\n\n```json\n{ \"name\": \"John Doe\", \"email\": \"john@example.com\", \"confidence\": 0.95 }\n```\n\nI hope this helps!",
    expectSuccess: true
  },
  {
    name: "JSON in backtick code block (`)",
    input: "The lead information is: `{ \"name\": \"John Doe\", \"email\": \"john@example.com\", \"confidence\": 0.95 }`",
    expectSuccess: true
  },
  {
    name: "JSON with additional text before and after",
    input: "Based on my analysis, here's the information:\n\n{ \"name\": \"John Doe\", \"email\": \"john@example.com\", \"confidence\": 0.95 }\n\nPlease let me know if you need anything else.",
    expectSuccess: true
  },
  {
    name: "Multiple JSON objects (should extract first valid one)",
    input: "Here are two objects:\n\n{ \"name\": \"John Doe\", \"email\": \"john@example.com\", \"confidence\": 0.95 }\n\nAnd another one:\n\n{ \"name\": \"Jane Smith\", \"email\": \"jane@example.com\", \"confidence\": 0.88 }",
    expectSuccess: true
  },
  {
    name: "Malformed JSON (missing quote)",
    input: "{ \"name\": John Doe\", \"email\": \"john@example.com\", \"confidence\": 0.95 }",
    expectSuccess: false
  }
];

// Run the tests
async function runTests() {
  console.log("Testing JSON extraction function with various response formats...\n");
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of testCases) {
    console.log(`Test case: ${test.name}`);
    try {
      const result = extractJsonFromResponse(test.input);
      console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
      
      if (test.expectSuccess) {
        console.log('  ✅ PASS: Successfully extracted JSON as expected');
        passCount++;
      } else {
        console.log('  ❌ FAIL: Expected failure but got success');
        failCount++;
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      
      if (!test.expectSuccess) {
        console.log('  ✅ PASS: Failed to extract JSON as expected');
        passCount++;
      } else {
        console.log('  ❌ FAIL: Expected success but got failure');
        failCount++;
      }
    }
    console.log();
  }
  
  console.log(`Test summary: ${passCount} passed, ${failCount} failed`);
}

runTests();