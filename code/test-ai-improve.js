/**
 * Test AI Improve API
 * 
 * Run this to test if AI Improve is working:
 * node test-ai-improve.js
 */

const testData = {
  section: 'summary',
  currentContent: {
    summary: 'Software engineer with experience in web development',
    experience: [
      {
        id: 'test-1',
        company: 'Tech Corp',
        position: 'Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2020-01',
        endDate: 'Present',
        achievements: [
          'Led team of 5 developers',
          'Increased performance by 40%',
        ],
      },
    ],
    skills: {
      technical: ['React', 'TypeScript', 'Node.js'],
      soft: ['Leadership', 'Communication'],
    },
    experienceHighlights: {
      totalYears: 4,
      keyRoles: ['Software Engineer'],
      keyAchievements: ['Led team of 5 developers'],
      industries: ['Tech Corp'],
    },
  },
};

async function testAIImprove() {
  console.log('🧪 Testing AI Improve API...\n');
  console.log('Request data:', JSON.stringify(testData, null, 2));
  console.log('\n---\n');

  try {
    const response = await fetch('http://localhost:3000/api/ai/improve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'dev-user-id',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('\nResponse Data:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! AI Improve is working!');
      if (data.improvedContent?.improvedSummary) {
        console.log('\nImproved Summary:');
        console.log(data.improvedContent.improvedSummary);
      }
    } else {
      console.log('\n❌ ERROR! Check the error message above.');
      if (data.error) {
        console.log('Error Code:', data.error.code);
        console.log('Error Message:', data.error.message);
      }
    }
  } catch (error) {
    console.error('\n❌ FAILED! Network or connection error:');
    console.error(error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Dev server is running (npm run dev)');
    console.log('   2. Server is on http://localhost:3000');
    console.log('   3. No firewall blocking the connection');
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or install node-fetch');
  console.log('   Run: npm install node-fetch');
  console.log('   Or use the browser console method instead');
  process.exit(1);
}

testAIImprove();
