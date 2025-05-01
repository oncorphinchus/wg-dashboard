import fs from 'fs/promises';
import path from 'path';
import { ServerConfig } from '../types/wireguard';

const CONFIG_FILE = path.join(__dirname, '../config/servers.json');

export class ServerConfigService {
  private servers: ServerConfig[] = [];

  async loadServers(): Promise<void> {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      this.servers = config.servers;
    } catch (err) {
      throw new Error(`Failed to load server configuration: ${(err as Error).message}`);
    }
  }

  async getServer(id: string): Promise<ServerConfig | undefined> {
    if (this.servers.length === 0) {
      await this.loadServers();
    }
    return this.servers.find(server => server.id === id);
  }

  async getAllServers(): Promise<ServerConfig[]> {
    if (this.servers.length === 0) {
      await this.loadServers();
    }
    return this.servers;
  }
}

export const serverConfigService = new ServerConfigService(); 