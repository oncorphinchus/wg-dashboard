import { WireguardInterface, WireguardPeer } from '../types/wireguard';

/**
 * Parse the output of 'wg show <interface> dump' command
 */
export function parseWgShowDump(output: string): WireguardInterface {
  const lines = output.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty WireGuard show output');
  }

  // First line contains interface information
  const [interfacePubKey, privatePubKey, listenPort] = lines[0].split('\t');
  
  const wgInterface: WireguardInterface = {
    name: 'wg0', // This will be overridden by the actual interface name
    publicKey: interfacePubKey,
    privateKey: privatePubKey,
    listenPort: parseInt(listenPort, 10),
    peers: [],
  };

  // Remaining lines contain peer information
  for (let i = 1; i < lines.length; i++) {
    const [
      publicKey,
      presharedKey,
      endpoint,
      allowedIps,
      latestHandshakeStr,
      transferRxStr,
      transferTxStr,
      persistentKeepaliveStr,
    ] = lines[i].split('\t');

    const peer: WireguardPeer = {
      publicKey,
      presharedKey: presharedKey || undefined,
      endpoint: endpoint || undefined,
      allowedIps: allowedIps ? allowedIps.split(',') : [],
      latestHandshake: latestHandshakeStr ? new Date(parseInt(latestHandshakeStr, 10) * 1000) : undefined,
      transferRx: parseInt(transferRxStr, 10),
      transferTx: parseInt(transferTxStr, 10),
      persistentKeepalive: persistentKeepaliveStr ? parseInt(persistentKeepaliveStr, 10) : undefined,
    };

    wgInterface.peers.push(peer);
  }

  return wgInterface;
}

/**
 * Parse the output of 'wg show <interface>' command
 */
export function parseWgShow(output: string): Partial<WireguardInterface> {
  const lines = output.trim().split('\n');
  let currentSection: 'interface' | 'peer' = 'interface';
  const result: Partial<WireguardInterface> & { peers: WireguardPeer[] } = { peers: [] };
  let currentPeer: Partial<WireguardPeer> = {};

  for (const line of lines) {
    if (line.startsWith('interface:')) {
      currentSection = 'interface';
      result.name = line.split(':')[1].trim();
      continue;
    }

    if (line.startsWith('peer:')) {
      if (Object.keys(currentPeer).length > 0) {
        result.peers.push(currentPeer as WireguardPeer);
      }
      currentSection = 'peer';
      currentPeer = {
        publicKey: line.split(':')[1].trim(),
      };
      continue;
    }

    const [key, value] = line.trim().split(':').map(s => s.trim());
    if (!key || !value) continue;

    if (currentSection === 'interface') {
      switch (key.toLowerCase()) {
        case 'public key':
          result.publicKey = value;
          break;
        case 'private key':
          result.privateKey = value;
          break;
        case 'listening port':
          result.listenPort = parseInt(value, 10);
          break;
      }
    } else if (currentSection === 'peer') {
      switch (key.toLowerCase()) {
        case 'endpoint':
          currentPeer.endpoint = value;
          break;
        case 'allowed ips':
          currentPeer.allowedIps = value.split(',').map(ip => ip.trim());
          break;
        case 'latest handshake':
          currentPeer.latestHandshake = new Date(value);
          break;
        case 'transfer':
          const [rx, tx] = value.split(',').map(v => {
            const bytes = v.trim().split(' ')[0];
            return parseInt(bytes, 10);
          });
          currentPeer.transferRx = rx;
          currentPeer.transferTx = tx;
          break;
      }
    }
  }

  if (Object.keys(currentPeer).length > 0) {
    result.peers.push(currentPeer as WireguardPeer);
  }

  return result;
} 