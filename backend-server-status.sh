#!/bin/bash

# Script to add server status endpoint to the backend
# Run this on your DigitalOcean droplet

# Navigate to backend directory
cd /root/wg-dashboard/wg-dashboard-backend

# Create server status route
cat > src/routes/serverStatus.ts << 'EOF'
import { Router } from 'express';
import { serverConfigService } from '../services/serverConfig';

const router = Router();

// Get status for a specific server by ID
router.get('/:id/status', async (req, res) => {
  try {
    const serverId = req.params.id;
    console.log(`Fetching status for server ID: ${serverId}`);
    
    // Get the server config
    const server = await serverConfigService.getServer(serverId);
    
    if (!server) {
      console.log(`Server with ID ${serverId} not found`);
      return res.status(404).json({ error: `Server with ID ${serverId} not found` });
    }
    
    // For now, return a mock status since we don't have the actual SSH connection
    // This will be replaced with actual server status in production
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
    
    console.log(`Returning status for server ${serverId}`);
    return res.json(mockStatus);
  } catch (error) {
    console.error(`Error fetching status for server:`, error);
    return res.status(500).json({ error: 'Failed to fetch server status' });
  }
});

export default router;
EOF

# Update app.ts to include this route
echo 'Updating app.ts to include server status route...'
sed -i '/import serversListRouter/a import serverStatusRouter from '\''./routes/serverStatus'\'';' src/app.ts
sed -i '/app.use('\''\/servers-list'\''/a app.use('\''\/servers'\'', serverStatusRouter);' src/app.ts

# Rebuild and restart
echo 'Rebuilding and restarting...'
npm run build
pm2 restart wg-backend

echo 'Done! You can test with:'
echo "curl -v -H \"Authorization: Bearer \$API_KEY\" http://localhost:3000/servers/server-1/status" 