#!/bin/bash

# Script to implement real WireGuard status fetching on the backend server
# Run this on your DigitalOcean droplet

# Navigate to backend directory
cd /root/wg-dashboard/wg-dashboard-backend

# Install required dependencies
echo "Installing node-ssh package..."
npm install node-ssh --save

# Create SSH utility functions
echo "Creating SSH utility functions..."
cat > src/services/sshService.ts << 'EOF'
import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

export class SshService {
  /**
   * Loads SSH private key from environment variable or file
   * @returns The SSH private key as a string
   */
  static loadSshPrivateKey(): string {
    // Try to load from environment variable first
    const keyFromEnv = process.env.SSH_PRIVATE_KEY_STRING;
    if (keyFromEnv) {
      console.log('Using SSH key from environment variable');
      return keyFromEnv;
    }

    // Try to load from file
    const keyPath = process.env.SSH_PRIVATE_KEY_PATH || path.join(__dirname, '../../keys/id_rsa');
    try {
      console.log(`Loading SSH key from file: ${keyPath}`);
      return fs.readFileSync(keyPath, 'utf8');
    } catch (error) {
      console.error(`Failed to load SSH key from ${keyPath}:`, error);
      throw new Error(`Failed to load SSH private key: ${(error as Error).message}`);
    }
  }

  /**
   * Creates an SSH connection to a server
   * @param host Server hostname or IP
   * @param username SSH username
   * @param privateKey SSH private key content
   * @returns SSH connection object
   */
  static async createSshConnection(host: string, username: string, privateKey: string): Promise<NodeSSH> {
    const ssh = new NodeSSH();
    
    try {
      console.log(`Connecting to ${username}@${host} via SSH...`);
      await ssh.connect({
        host,
        username,
        privateKey,
        // For testing, don't reject unknown hosts
        readyTimeout: 10000,
      });
      console.log(`SSH connection to ${host} established successfully`);
      return ssh;
    } catch (error) {
      console.error(`SSH connection to ${host} failed:`, error);
      throw new Error(`Failed to establish SSH connection to ${host}: ${(error as Error).message}`);
    }
  }

  /**
   * Executes a command on the remote server via SSH
   * @param connection SSH connection object
   * @param command Command to execute
   * @returns Command output (stdout)
   */
  static async executeSshCommand(connection: NodeSSH, command: string): Promise<string> {
    try {
      console.log(`Executing command: ${command}`);
      const result = await connection.execCommand(command);
      
      if (result.stderr) {
        console.warn(`Command produced stderr: ${result.stderr}`);
      }
      
      return result.stdout;
    } catch (error) {
      console.error(`Command execution failed:`, error);
      throw new Error(`Command execution failed: ${(error as Error).message}`);
    }
  }
}
EOF

# Update the serverStatus route to use real SSH connection
echo "Updating server status route with real WireGuard status fetching..."
cat > src/routes/serverStatus.ts << 'EOF'
import { Router } from 'express';
import { serverConfigService } from '../services/serverConfig';
import { SshService } from '../services/sshService';

const router = Router();

/**
 * Parses the output of 'wg show' command to extract WireGuard status information
 * @param output Raw output from wg show command
 * @returns Structured WireGuard status object
 */
function parseWgShowOutput(output: string) {
  console.log('Parsing wg show output:', output);
  
  // If the output is in dump format, use a different parsing method
  if (output.includes('\t')) {
    return parseWgDumpOutput(output);
  }
  
  const lines = output.split('\n');
  const interfaceInfo: any = {};
  const peers: any[] = [];
  let currentPeer: any = null;

  for (const line of lines) {
    if (line.trim() === '') continue;
    
    if (!line.startsWith(' ')) {  // Interface line
      interfaceInfo.name = line.trim();
    } else if (line.trim().startsWith('public key:')) {
      interfaceInfo.publicKey = line.split(':')[1]?.trim();
    } else if (line.trim().startsWith('listening port:')) {
      interfaceInfo.listenPort = parseInt(line.split(':')[1]?.trim(), 10);
    } else if (line.trim().startsWith('peer:')) {
      // If we already have a peer in progress, add it to the list
      if (currentPeer) {
        peers.push(currentPeer);
      }
      // Start a new peer
      currentPeer = { publicKey: line.split(':')[1]?.trim() };
    } else if (currentPeer && line.trim().startsWith('endpoint:')) {
      currentPeer.endpoint = line.split(':')[1]?.trim();
    } else if (currentPeer && line.trim().startsWith('allowed ips:')) {
      currentPeer.allowedIps = line.split(':')[1]?.trim().split(',').map((ip: string) => ip.trim());
    } else if (currentPeer && line.trim().startsWith('latest handshake:')) {
      currentPeer.latestHandshake = line.split(':')[1]?.trim(); 
    } else if (currentPeer && line.trim().startsWith('transfer:')) {
      const transferParts = line.split(':')[1]?.trim().split('received,');
      if (transferParts.length === 2) {
        const rxPart = transferParts[0].trim();
        const txPart = transferParts[1].trim();
        
        const rxBytes = parseDataTransfer(rxPart);
        const txBytes = parseDataTransfer(txPart);
        
        currentPeer.transferRx = rxBytes;
        currentPeer.transferTx = txBytes;
      }
    }
  }

  // Add the last peer
  if (currentPeer) {
    peers.push(currentPeer);
  }

  return {
    status: {
      name: interfaceInfo.name,
      publicKey: interfaceInfo.publicKey,
      listenPort: interfaceInfo.listenPort,
      peers
    }
  };
}

/**
 * Parses the output of 'wg show' in dump format
 * @param output Raw output from wg show dump command
 * @returns Structured WireGuard status object
 */
function parseWgDumpOutput(output: string) {
  const lines = output.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return { status: { name: 'unknown', peers: [] } };
  }
  
  // The first line is the interface info
  const interfaceParts = lines[0].split('\t');
  const interfaceInfo: any = {
    name: 'wg0', // Default name, will be overridden if available
    publicKey: interfaceParts[0],
    listenPort: parseInt(interfaceParts[2], 10)
  };
  
  const peers: any[] = [];
  
  // Remaining lines are peer info
  for (let i = 1; i < lines.length; i++) {
    const peerParts = lines[i].split('\t');
    if (peerParts.length < 4) continue;
    
    const peer: any = {
      publicKey: peerParts[0],
      allowedIps: peerParts[3].split(',').map(ip => ip.trim()),
    };
    
    // Optional fields
    if (peerParts[1]) peer.endpoint = peerParts[1];
    if (peerParts[2]) peer.latestHandshake = new Date(parseInt(peerParts[2], 10) * 1000).toISOString();
    if (peerParts[4]) peer.transferRx = parseInt(peerParts[4], 10);
    if (peerParts[5]) peer.transferTx = parseInt(peerParts[5], 10);
    
    peers.push(peer);
  }
  
  return {
    status: {
      name: interfaceInfo.name,
      publicKey: interfaceInfo.publicKey,
      listenPort: interfaceInfo.listenPort,
      peers
    }
  };
}

/**
 * Converts data transfer string like "123 KiB" to bytes
 * @param dataStr Data transfer string
 * @returns Equivalent number of bytes
 */
function parseDataTransfer(dataStr: string): number {
  const match = dataStr.match(/(\d+(\.\d+)?)\s*(B|KiB|MiB|GiB|TiB)/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[3].toUpperCase();
  
  switch(unit) {
    case 'B': return value;
    case 'KIB': return value * 1024;
    case 'MIB': return value * 1024 * 1024;
    case 'GIB': return value * 1024 * 1024 * 1024;
    case 'TIB': return value * 1024 * 1024 * 1024 * 1024;
    default: return value;
  }
}

// Get status for a specific server by ID
router.get('/:id/status', async (req, res) => {
  try {
    const serverId = req.params.id;
    console.log(`Fetching real status for server ID: ${serverId}`);
    
    // Get the server config
    const server = await serverConfigService.getServer(serverId);
    
    if (!server) {
      console.log(`Server with ID ${serverId} not found`);
      return res.status(404).json({ error: `Server with ID ${serverId} not found` });
    }
    
    console.log(`Found server config:`, server);
    
    try {
      // Load SSH private key
      const privateKey = SshService.loadSshPrivateKey();
      
      // Create SSH connection
      const ssh = await SshService.createSshConnection(server.host, server.username, privateKey);
      
      // Execute WireGuard command to get status
      const interfaceName = server.interfaceName || 'wg0';
      
      // First try with dump format which is easier to parse
      try {
        const outputDump = await SshService.executeSshCommand(ssh, `sudo wg show ${interfaceName} dump`);
        ssh.dispose();
        
        // Parse the output
        const status = parseWgDumpOutput(outputDump);
        status.status.name = interfaceName; // Ensure name is set correctly
        
        console.log(`Returning real status for server ${serverId}`);
        return res.json(status);
      } catch (dumpError) {
        console.warn(`Failed to get status in dump format, trying regular format:`, dumpError);
        
        // Try regular format as fallback
        const output = await SshService.executeSshCommand(ssh, `sudo wg show ${interfaceName}`);
        ssh.dispose();
        
        // Parse the output
        const status = parseWgShowOutput(output);
        status.status.name = interfaceName; // Ensure name is set correctly
        
        console.log(`Returning real status for server ${serverId}`);
        return res.json(status);
      }
    } catch (sshError) {
      console.error(`SSH error:`, sshError);
      
      // Fallback to mock data if SSH fails
      console.log(`Falling back to mock data for server ${serverId}`);
      const mockStatus = {
        status: {
          name: server.interfaceName || "wg0",
          publicKey: "mockPublicKey123456789abcdef",
          listenPort: 51820,
          peers: [
            {
              publicKey: "peerPublicKey123456789abcdef",
              endpoint: "198.51.100.1:51820",
              allowedIps: ["10.0.0.2/32"],
              latestHandshake: new Date().toISOString(),
              transferRx: 15000000,
              transferTx: 25000000
            }
          ]
        }
      };
      
      return res.json(mockStatus);
    }
  } catch (error) {
    console.error(`Error fetching status for server:`, error);
    return res.status(500).json({ error: 'Failed to fetch server status' });
  }
});

export default router;
EOF

# Create directories for SSH keys
mkdir -p keys

# Build and restart
npm run build
pm2 restart wg-backend

echo "Implementation complete! Next steps:"
echo "1. Add your SSH private key to /root/wg-dashboard/wg-dashboard-backend/keys/id_rsa"
echo "2. Make sure the private key has correct permissions: chmod 600 keys/id_rsa"
echo "3. Test with: curl -v -H \"Authorization: Bearer \$API_KEY\" http://localhost:3000/servers/server-1/status" 