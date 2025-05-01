// This script tests the connection to the backend API
// Run with: node scripts/test-backend-connection.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Disable SSL certificate validation (only for testing!)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configure these values to match your environment
const API_URL = 'https://backend.freediddy.de';
const API_KEY = 'your-api-key-here'; // Replace with your actual API key

// Helper function to make HTTPS requests with proper headers
async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(`${API_URL}${endpoint}`, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
  });
}

async function runTests() {
  console.log('Testing backend API connection...');
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResult = await makeRequest('/health');
    console.log(`Status code: ${healthResult.statusCode}`);
    console.log('Response:', JSON.stringify(healthResult.data, null, 2));
    
    // Test servers endpoint
    console.log('\n2. Testing servers endpoint...');
    const serversResult = await makeRequest('/servers');
    console.log(`Status code: ${serversResult.statusCode}`);
    console.log('Response:', JSON.stringify(serversResult.data, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

runTests(); 