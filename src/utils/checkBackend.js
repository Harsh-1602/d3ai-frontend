/**
 * Simple script to check if the backend server is accessible.
 * Run this with Node.js to verify the backend connection.
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/diseases/suggest/test',
  method: 'GET',
};

console.log('Trying to connect to backend server...');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Backend connection error:');
  console.error(error.message);
  console.log('\nMake sure the backend server is running on port 8000!');
  console.log('You can start it with: cd d3ai-backend && python run.py');
});

req.end(); 