import { useEffect, useState } from 'react';
import { ServerConfig } from '@/types/wireguard';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getServers } from '@/lib/serverApi';

interface ServerListProps {
  onServerSelect: (server: ServerConfig) => void;
  selectedServerId?: string;
}

export function ServerList({ onServerSelect, selectedServerId }: ServerListProps) {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServers() {
      try {
        const data = await getServers();
        setServers(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchServers();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Loading servers...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error: {error}
        <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (servers.length === 0) {
    return <div className="text-center p-4">No servers configured</div>;
  }

  return (
    <div className="space-y-2">
      {servers.map((server) => (
        <Button
          key={server.id}
          variant={server.id === selectedServerId ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => onServerSelect(server)}
        >
          <div className="flex flex-col items-start">
            <span className="font-medium">{server.name}</span>
            <span className="text-xs text-muted-foreground">{server.host}</span>
          </div>
        </Button>
      ))}
    </div>
  );
} 