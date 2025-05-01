// This script reads and validates the server configuration file
// Run with: node scripts/check-server-config.js

const fs = require('fs');
const path = require('path');

// Path to the servers.json file (relative to the project root)
const serversConfigPath = path.resolve(__dirname, '../wg-dashboard-backend/src/config/servers.json');

function validateServerConfig(config) {
  const issues = [];
  
  if (!Array.isArray(config)) {
    return ['Configuration must be an array of server objects'];
  }
  
  if (config.length === 0) {
    issues.push('Warning: No servers defined in configuration');
  }
  
  config.forEach((server, index) => {
    if (!server.id) issues.push(`Server #${index + 1}: Missing 'id' field`);
    if (!server.name) issues.push(`Server #${index + 1}: Missing 'name' field`);
    if (!server.host) issues.push(`Server #${index + 1}: Missing 'host' field`);
    if (!server.port) issues.push(`Server #${index + 1}: Missing 'port' field`);
    if (!server.username) issues.push(`Server #${index + 1}: Missing 'username' field`);
    if (!server.privateKeyPath) issues.push(`Server #${index + 1}: Missing 'privateKeyPath' field`);
    
    // Check if the private key file exists
    if (server.privateKeyPath) {
      const keyPath = path.resolve(__dirname, '../wg-dashboard-backend', server.privateKeyPath);
      if (!fs.existsSync(keyPath)) {
        issues.push(`Server #${index + 1}: Private key file not found at '${server.privateKeyPath}'`);
      }
    }
  });
  
  return issues;
}

try {
  // Check if the configuration file exists
  if (!fs.existsSync(serversConfigPath)) {
    console.error('Error: servers.json file not found at', serversConfigPath);
    process.exit(1);
  }
  
  // Read and parse the configuration file
  const configRaw = fs.readFileSync(serversConfigPath, 'utf8');
  const config = JSON.parse(configRaw);
  
  console.log('Servers configuration:');
  console.log(JSON.stringify(config, null, 2));
  
  // Validate the configuration
  const issues = validateServerConfig(config);
  
  if (issues.length > 0) {
    console.log('\nConfiguration issues found:');
    issues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('\nConfiguration looks valid!');
  }
  
  // Summary
  console.log(`\nTotal servers configured: ${config.length}`);
  config.forEach(server => {
    console.log(`- ${server.name} (${server.host}:${server.port})`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 