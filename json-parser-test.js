/**
 * Extracts JSON object from Claude's response text, handling various formats
 * including JSON embedded in markdown code blocks
 */
function extractJsonFromResponse(response) {
  // If the response is already a valid JSON, return it
  try {
    // Try parsing directly first
    return JSON.parse(response);
  } catch (e) {
    // Not a direct JSON string, continue with extraction
  }

  // Look for JSON in markdown code blocks (```json ... ```)
  const markdownJsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const markdownMatch = response.match(markdownJsonRegex);
  
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1]);
    } catch (e) {
      console.error('Error parsing JSON from markdown block:', e);
      // Continue to other methods if this fails
    }
  }
  
  // Look for JSON in backtick quotes (`{...}`)
  const backtickJsonRegex = /`({[\s\S]*?})`/;
  const backtickMatch = response.match(backtickJsonRegex);
  
  if (backtickMatch && backtickMatch[1]) {
    try {
      return JSON.parse(backtickMatch[1]);
    } catch (e) {
      console.error('Error parsing JSON from backticks:', e);
      // Continue to other methods if this fails
    }
  }
  
  // Look for JSON objects in the text (as a last resort)
  const jsonRegex = /({[\s\S]*?})/;
  const jsonMatch = response.match(jsonRegex);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('Error parsing JSON from general text:', e);
      throw new Error('Unable to extract valid JSON from the response');
    }
  }
  
  throw new Error('No JSON found in the response');
}

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
function runTests() {
  console.log("Testing JSON extraction function with various Claude AI response formats\n");
  
  let passCount = 0;
  let failCount = 0;
  
  for (const test of testCases) {
    console.log(`\nTest: ${test.name}`);
    console.log(`Input: ${test.input.substring(0, 50)}...`);
    
    try {
      const result = extractJsonFromResponse(test.input);
      console.log("Parsed result:", result);
      console.log("✅ SUCCESS: Successfully extracted JSON");
      passCount++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\nTest summary: ${passCount} passed, ${failCount} failed`);
}

// Run the tests
runTests();