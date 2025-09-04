// Using built-in fetch in Node.js 18+

async function testAPI() {
  try {
    console.log('Testing GET /api/budgets...');
    const response = await fetch('http://localhost:8080/api/budgets');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    // Test creating a budget
    console.log('\nTesting POST /api/budgets...');
    const createResponse = await fetch('http://localhost:8080/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Medicine Budget',
        budgetType: 'category',
        scope: {
          categories: ['Medicine', 'Health'],
        },
        amount: 5000,
        period: 'monthly',
        description: 'Budget for medical expenses'
      })
    });
    
    const createData = await createResponse.json();
    console.log('Create Status:', createResponse.status);
    console.log('Create Data:', JSON.stringify(createData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
