export interface WireguardPeer {
  publicKey: string;
  presharedKey?: string;
  endpoint?: string;
  allowedIps: string[];
  latestHandshake?: Date;
  transferRx: number;
  transferTx: number;
  persistentKeepalive?: number;
}

export interface WireguardInterface {
  name: string;
  publicKey: string;
  privateKey: string;
  listenPort: number;
  peers: WireguardPeer[];
}

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  username: string;
  interfaceName: string;
} 