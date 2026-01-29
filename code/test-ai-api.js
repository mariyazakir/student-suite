// Quick test script to verify AI API is working
// Run: node test-ai-api.js

const testSummary = async () => {
  const response = await fetch('http://localhost:3000/api/ai/improve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'dev-user-id',
    },
    body: JSON.stringify({
      section: 'summary',
      currentContent: {
        summary: 'Test summary',
        experienceSummary: '',
        totalYears: 5,
        keyRoles: [],
        keyAchievements: [],
        industries: [],
      },
    }),
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
};

testSummary().catch(console.error);
