import { Request, Response } from 'express';
import { serverConfigService } from '../services/serverConfig';
import { loadSshPrivateKey, createSshConnection, executeSshCommand } from '../utils/ssh';
import { parseWgShow } from '../utils/wireguard';

export async function getServerStatus(req: Request, res: Response): Promise<void> {
  try {
    const { serverId } = req.params;
    const server = await serverConfigService.getServer(serverId);

    if (!server) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }

    const privateKey = await loadSshPrivateKey();
    const sshClient = await createSshConnection(server.host, server.username, privateKey);

    try {
      const { stdout } = await executeSshCommand(sshClient, `sudo wg show ${server.interfaceName}`);
      const status = parseWgShow(stdout);

      res.json({
        id: server.id,
        name: server.name,
        status,
      });
    } finally {
      sshClient.end();
    }
  } catch (err) {
    console.error('Error fetching server status:', err);
    res.status(500).json({ error: `Failed to fetch server status: ${(err as Error).message}` });
  }
}

export async function listServers(req: Request, res: Response): Promise<void> {
  try {
    const servers = await serverConfigService.getAllServers();
    res.json(servers);
  } catch (err) {
    console.error('Error listing servers:', err);
    res.status(500).json({ error: `Failed to list servers: ${(err as Error).message}` });
  }
} 