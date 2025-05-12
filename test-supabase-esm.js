import https from 'https';
import { promises as dns } from 'dns';

console.log('Supabase connection test (Node.js)');

// First test DNS resolution
console.log('\nTesting DNS resolution...');
try {
  const { address, family } = await dns.lookup('qhucduandrbnfcjdnkxr.supabase.co');
  console.log(`✓ Domain resolves to ${address} (IPv${family})`);
} catch (err) {
  console.error('DNS lookup failed:', err.message);
}

// Test HTTPS connection
console.log('\nTesting HTTPS connection...');
testHttps();

function testHttps() {
  const options = {
    hostname: 'qhucduandrbnfcjdnkxr.supabase.co',
    port: 443,
    path: '/',
    method: 'GET',
    timeout: 5000 // 5 seconds timeout
  };

  const req = https.request(options, (res) => {
    console.log(`✓ HTTPS connection established - Status Code: ${res.statusCode}`);
    console.log('✓ Response headers:', res.headers);
    
    // Don't need to read body, just testing connection
    res.resume();
    
    // Test the REST API endpoint
    testApiEndpoint();
  });

  req.on('error', (e) => {
    console.error('HTTPS connection failed:', e.message);
    
    // Try alternative endpoint to see if HTTPS works at all
    console.log('\nTesting connection to supabase.com as a fallback...');
    const fallbackOptions = {
      hostname: 'supabase.com',
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000
    };
    
    const fallbackReq = https.request(fallbackOptions, (res) => {
      console.log(`✓ Fallback connection works - Status: ${res.statusCode}`);
      res.resume();
    });
    
    fallbackReq.on('error', (fallbackErr) => {
      console.error('Fallback connection also failed:', fallbackErr.message);
    });
    
    fallbackReq.end();
  });

  req.on('timeout', () => {
    console.error('HTTPS connection timeout');
    req.destroy();
  });

  req.end();
}

function testApiEndpoint() {
  console.log('\nTesting REST API endpoint...');
  const apiOptions = {
    hostname: 'qhucduandrbnfcjdnkxr.supabase.co',
    port: 443,
    path: '/rest/v1/tasks?count=exact',
    method: 'GET',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWNkdW5hZHJibmZjamRua3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDk1NzksImV4cCI6MjA2MjQ4NTU3OX0.iEYMfvZ_wpz1GnoReZEqEsA-asoRwn3THxc4HyJClDc',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWNkdW5hZHJibmZjamRua3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDk1NzksImV4cCI6MjA2MjQ4NTU3OX0.iEYMfvZ_wpz1GnoReZEqEsA-asoRwn3THxc4HyJClDc'
    },
    timeout: 5000
  };

  const apiReq = https.request(apiOptions, (res) => {
    console.log(`✓ API endpoint connection - Status Code: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('API response data:', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
      console.log('\nTest complete');
    });
  });

  apiReq.on('error', (e) => {
    console.error('API endpoint connection failed:', e.message);
    console.log('\nTest complete with errors');
  });

  apiReq.on('timeout', () => {
    console.error('API endpoint connection timeout');
    apiReq.destroy();
  });

  apiReq.end();
}