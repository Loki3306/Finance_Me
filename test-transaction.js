import fetch from 'node-fetch';

async function testTransaction() {
  try {
    const response = await fetch('http://localhost:8080/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 100,
        type: 'expense',
        accountId: 'test_account_123',
        category: 'Healthcare',
        description: 'Test transaction',
        date: '2025-08-31'
      })
    });

    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testTransaction();
