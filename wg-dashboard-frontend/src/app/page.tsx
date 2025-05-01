'use client';

import { useEffect, useState } from 'react';
import type { ServerConfig } from '@/types/wireguard';
import { ServerList } from '@/components/ServerList';
import { ServerStatus } from '@/components/ServerStatus';

export default function Home() {
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null);
  const [health, setHealth] = useState<'loading' | 'healthy' | 'error'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        setHealth(data.status === 'ok' ? 'healthy' : 'error');
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth('error');
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">WireGuard Dashboard</h1>
      
      <div className="flex items-center gap-2 mb-4">
        <div 
          className={`w-3 h-3 rounded-full ${
            health === 'healthy' ? 'bg-green-500' :
            health === 'error' ? 'bg-red-500' :
            'bg-yellow-500'
          }`}
        />
        <span className="text-sm text-gray-600">
          {health === 'healthy' ? 'System Healthy' :
           health === 'error' ? 'System Error' :
           'Checking Status...'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Server cards will go here */}
      </div>

      <main className="flex min-h-screen">
        <div className="w-64 border-r p-4 bg-muted/10">
          <h2 className="text-lg font-semibold mb-4">Servers</h2>
          <ServerList
            onServerSelect={setSelectedServer}
            selectedServerId={selectedServer?.id}
          />
        </div>

        <div className="flex-1 p-6">
          {selectedServer ? (
            <>
              <h1 className="text-2xl font-bold mb-6">{selectedServer.name}</h1>
              <ServerStatus server={selectedServer} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>Select a server to view its status</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 