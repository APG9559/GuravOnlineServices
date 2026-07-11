const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = data ? JSON.parse(data) : {};
        } catch (e) {
          json = { raw: data };
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function verify() {
  console.log('Testing Water Supply API Endpoints...\n');

  // 1. Login to get token
  console.log('Step 1: Logging in as admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@gurav.org', password: 'Admin@1234' });

  if (loginRes.statusCode !== 201 && loginRes.statusCode !== 200) {
    console.error('❌ Login failed with status:', loginRes.statusCode, loginRes.data);
    return;
  }

  const token = loginRes.data.accessToken || loginRes.data.token || (loginRes.data.data && loginRes.data.data.accessToken);
  if (!token) {
    console.error('❌ Could not retrieve token from login response:', loginRes.data);
    return;
  }
  console.log('✅ Logged in successfully. Token acquired.\n');

  // 2. Fetch records
  console.log('Step 2: Fetching water supply records...');
  const recordsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/water-supply/records',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (recordsRes.statusCode !== 200) {
    console.error('❌ Fetching records failed with status:', recordsRes.statusCode, recordsRes.data);
    return;
  }

  let records = [];
  if (Array.isArray(recordsRes.data)) {
    records = recordsRes.data;
  } else if (recordsRes.data.records && Array.isArray(recordsRes.data.records)) {
    records = recordsRes.data.records;
  } else if (recordsRes.data.data && Array.isArray(recordsRes.data.data)) {
    records = recordsRes.data.data;
  } else if (recordsRes.data.data && recordsRes.data.data.records && Array.isArray(recordsRes.data.data.records)) {
    records = recordsRes.data.data.records;
  }

  console.log(`✅ Retrieved ${records.length} records.`);
  if (records.length === 0) {
    console.log('⚠️ No records found in database to test view/edit. Creating a dummy connection and service record first...');
    
    // Create a connection & record
    const dummyRecordRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/water-supply/records',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {
      serviceType: 'NewConnection',
      customerName: 'Verification Test Customer',
      phone: '9876543210',
      connectionAddress: '123 Test Street, Verification City',
      applicationTokenNo: 'TOK-VERIFY-123',
      applicationDate: '2026-07-11',
      dateOfService: '2026-07-11',
      officialFee: 1000,
      serviceFee: 200,
      protocolFee: 50,
      amountCharged: 1250,
      plumberName: 'Plumber Bob',
      plumberPhone: '9999988888',
      remarks: 'Automated verification test record'
    });

    if (dummyRecordRes.statusCode !== 201 && dummyRecordRes.statusCode !== 200) {
      console.error('❌ Creating dummy record failed:', dummyRecordRes.statusCode, dummyRecordRes.data);
      return;
    }
    console.log('✅ Dummy record created.');
    
    // Refetch
    const refetchRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/water-supply/records',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (refetchRes.data && refetchRes.data.records) {
      records = refetchRes.data.records;
    } else {
      records = Array.isArray(refetchRes.data) ? refetchRes.data : [];
    }
  }

  const record = records[0];
  console.log('\n--- First Record Details (Before Update) ---');
  console.log('ID:', record.id);
  console.log('Service Type:', record.serviceType);
  console.log('Flattened fields checked:');
  console.log('  customerName:', record.customerName);
  console.log('  phone:', record.phone);
  console.log('  connectionAddress:', record.connectionAddress);
  console.log('  address:', record.address);
  console.log('  plumberName:', record.plumberName);
  console.log('  plumberPhone:', record.plumberPhone);
  console.log('-------------------------------------------\n');

  if (!record.customerName || !record.connectionAddress) {
    console.warn('⚠️ Warning: Flattened fields customerName or connectionAddress are unexpectedly missing.');
  } else {
    console.log('✅ Flattened output verification: SUCCESS.');
  }

  // 3. Test UpdateRecord
  console.log(`Step 3: Updating record ${record.id} via PUT request...`);
  const updatedPlumberName = 'Verification Plumber ' + Math.floor(Math.random() * 1000);
  const updatedAddress = 'Updated Address ' + Math.floor(Math.random() * 1000);
  
  const updatePayload = {
    officialFee: Number(record.officialFee || 0),
    serviceFee: Number(record.serviceFee || 0),
    amountCharged: Number(record.amountCharged || 0),
    dateOfService: record.dateOfService,
    applicationDate: record.applicationDate,
    plumberName: updatedPlumberName,
    connectionAddress: updatedAddress,
  };

  const updateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/water-supply/records/${record.id}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, updatePayload);

  if (updateRes.statusCode !== 200) {
    console.error('❌ Updating record failed with status:', updateRes.statusCode, updateRes.data);
    return;
  }
  console.log('✅ Update request completed successfully.');

  // 4. Verify updated record
  console.log('Step 4: Fetching record details to verify persistent updates...');
  const detailRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/water-supply/records/${record.id}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (detailRes.statusCode !== 200) {
    console.error('❌ Fetching updated record details failed:', detailRes.statusCode, detailRes.data);
    return;
  }

  const updatedRecord = detailRes.data.data || detailRes.data;
  console.log('\n--- Updated Record Details (After Update) ---');
  console.log('ID:', updatedRecord.id);
  console.log('Updated Connection Address:', updatedRecord.connectionAddress);
  console.log('Updated Plumber Name:', updatedRecord.plumberName);
  console.log('Nested details.plumberName:', updatedRecord.details?.plumberName);
  console.log('Nested connection.connectionAddress:', updatedRecord.connection?.connectionAddress);
  console.log('--------------------------------------------\n');

  if (
    updatedRecord.connectionAddress === updatedAddress &&
    updatedRecord.plumberName === updatedPlumberName &&
    updatedRecord.details?.plumberName === updatedPlumberName &&
    updatedRecord.connection?.connectionAddress === updatedAddress
  ) {
    console.log('🎉 End-to-end API Verification: SUCCESS! Both database and flattened responses were updated correctly.');
  } else {
    console.error('❌ Verification check failed! Properties did not match updated values.');
  }
}

verify().catch(console.error);
