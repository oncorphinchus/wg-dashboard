import { useEffect, useState } from 'react';
import type { ServerConfig, ServerStatus as ServerStatusType } from '@/types/wireguard';
import { Button } from '@/components/ui/button';
import { formatBytes, formatDate } from '@/lib/utils';

interface ServerStatusProps {
  server: ServerConfig;
}

export function ServerStatus({ server }: ServerStatusProps) {
  const [status, setStatus] = useState<ServerStatusType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    try {
      setLoading(true);
      setError(null);

      // Use the Next.js API route instead of the direct backend URL
      const response = await fetch(`/api/servers/${server.id}/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch server status');
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error(`Error fetching status for server ${server.id}:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [server.id]);

  if (loading) {
    return <div className="text-center p-4">Loading server status...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error: {error}
        <Button variant="outline" className="mt-2" onClick={fetchStatus}>
          Retry
        </Button>
      </div>
    );
  }

  if (!status) {
    return <div className="text-center p-4">No status available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-2">Interface Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Name:</div>
          <div>{status.status.name}</div>
          <div className="text-muted-foreground">Public Key:</div>
          <div className="font-mono text-xs break-all">{status.status.publicKey}</div>
          <div className="text-muted-foreground">Listen Port:</div>
          <div>{status.status.listenPort}</div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Peers</h3>
        <div className="space-y-4">
          {status.status.peers?.map((peer) => (
            <div key={peer.publicKey} className="border-t pt-4 first:border-t-0 first:pt-0">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Public Key:</div>
                <div className="font-mono text-xs break-all">{peer.publicKey}</div>
                {peer.endpoint && (
                  <>
                    <div className="text-muted-foreground">Endpoint:</div>
                    <div>{peer.endpoint}</div>
                  </>
                )}
                <div className="text-muted-foreground">Allowed IPs:</div>
                <div>{peer.allowedIps.join(', ')}</div>
                <div className="text-muted-foreground">Latest Handshake:</div>
                <div>
                  {peer.latestHandshake ? formatDate(new Date(peer.latestHandshake)) : 'Never'}
                </div>
                <div className="text-muted-foreground">Transfer:</div>
                <div>
                  ↓ {formatBytes(peer.transferRx)} ↑ {formatBytes(peer.transferTx)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 