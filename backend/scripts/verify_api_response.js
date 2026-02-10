

const API_URL = 'https://api-maheshwari-motors.koyeb.app/api/v1';

async function verifyApi() {
  console.log('--- Starting API Verification ---');
  
  const uniqueId = Date.now();
  const userData = {
    username: `testuser_${uniqueId}`,
    email: `test_${uniqueId}@example.com`,
    password: 'password123',
    type: 'admin' // Trying admin type
  };

  let token = null;
  let itemId = null;

  try {
    // 1. Register User
    console.log(`1. Registering user: ${userData.username}`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (!regRes.ok) {
        const err = await regRes.text();
        throw new Error(`Register failed: ${regRes.status} ${err}`);
    }
    
    const regData = await regRes.json();
    console.log('   Register result:', regData.message);
    token = regData.data.token;

    if (!token) throw new Error('No token received after registration');

    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. Create Item
    console.log('2. Creating Item...');
    const itemData = {
      item_name: `Test Item ${uniqueId}`,
      amount: 150.50,
      threshold: 10,
      gst_stock: 5,
      nongst_stock: 5,
      gst_rate: 18,
      hsn_code: '1234'
    };
    
    const createRes = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(itemData)
    });
    
    if (!createRes.ok) {
         const err = await createRes.text();
         throw new Error(`Create Item failed: ${createRes.status} ${err}`);
    }
    
    const createData = await createRes.json();
    const createdItem = createData.data;
    itemId = createdItem._id;
    console.log('   Item ID:', itemId);
    console.log('   Created Item Data:', JSON.stringify(createdItem, null, 2));

    // 3. Fetch Items (Get All)
    console.log('3. Fetching All Items...');
    const getAllRes = await fetch(`${API_URL}/items`, { headers });
    
    if (!getAllRes.ok) {
        const err = await getAllRes.text();
         throw new Error(`Get All Items failed: ${getAllRes.status} ${err}`);
    }
    
    const getAllData = await getAllRes.json();
    const items = getAllData.data.data; // Pagination structure
    
    // 4. Verify Structure
    console.log('4. Verifying Item Structure...');
    const fetchedItem = items.find(i => i._id === itemId);
    if (!fetchedItem) {
        console.error('   Error: Created item not found in list!');
    } else {
        console.log('   Found Item:', JSON.stringify(fetchedItem, null, 2));
        
        const expectedKeys = ['item_name', 'amount', 'gst_stock', 'nongst_stock', 'physical_stock'];
        const missingKeys = expectedKeys.filter(k => fetchedItem[k] === undefined);
        
        if (missingKeys.length > 0) {
            console.error('   ❌ Structure Mismatch! Missing keys:', missingKeys);
        } else {
            console.log('   ✅ Structure Verified: All expected keys present.');
        }
        
        // Check amount value
        if (fetchedItem.amount !== itemData.amount) {
             console.warn(`   ⚠️ Amount mismatch: expected ${itemData.amount}, got ${fetchedItem.amount}`);
        }
    }

    // 5. Cleanup
    if (itemId) {
        console.log('5. Cleanup: Deleting Item...');
        await fetch(`${API_URL}/items/${itemId}`, { 
            method: 'DELETE',
            headers 
        });
        console.log('   Item deleted.');
    }

  } catch (error) {
    console.error('❌ Error in verification:', error.message);
  }
}

verifyApi();
