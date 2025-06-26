// Import the extractJsonFromResponse function directly
import { extractJsonFromResponse } from './server/ai-service.ts';

// Test cases representing different Claude AI response formats
const testCases = [
  {
    name: "Plain JSON",
    input: `{ "name": "John Doe", "email": "john@example.com", "confidence": 0.95 }`,
  },
  {
    name: "JSON in markdown code block (```json)",
    input: `Here is the extracted lead information:

\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Corp",
  "phone": "555-123-4567",
  "confidence": 0.92
}
\`\`\`

I hope this helps!`,
  },
  {
    name: "JSON with text before and after",
    input: `Based on my analysis of the email, here's the lead information:

{
  "name": "Jane Smith",
  "email": "jane@example.org",
  "company": "Tech Solutions",
  "interests": ["software", "AI", "automation"],
  "confidence": 0.88
}

Would you like me to analyze more emails?`,
  },
  {
    name: "JSON with explicit backticks",
    input: `The lead data is: \`{"name":"Robert Johnson","email":"robert@example.net","confidence":0.79}\``,
  }
];

// Run the tests
async function runTests() {
  console.log("Testing JSON extraction function with various Claude AI response formats\n");
  
  for (const test of testCases) {
    console.log(`\nTest: ${test.name}`);
    console.log(`Input: ${test.input.substring(0, 50)}...`);
    
    try {
      const result = extractJsonFromResponse(test.input);
      console.log("Parsed result:", result);
      console.log("✅ SUCCESS: Successfully extracted JSON");
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
}

// Run the tests
runTests();