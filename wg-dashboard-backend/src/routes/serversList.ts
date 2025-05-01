import { Router } from 'express';
import { serverConfigService } from '../services/serverConfig';

const router = Router();

// Simple endpoint to just return the server list
router.get('/', async (req, res) => {
  try {
    const servers = await serverConfigService.getAllServers();
    res.json(servers);
  } catch (error) {
    console.error('Error fetching servers list:', error);
    res.status(500).json({ error: 'Failed to fetch servers list' });
  }
});

export default router; 