import { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, Server } from 'lucide-react';

const HEALTH_URL = (import.meta.env.VITE_AUTH_URL ?? 'http://127.0.0.1:8090/api') + '/health';
const POLL_INTERVAL = 15_000;

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

export function useServerStatus() {
  const [isDown, setIsDown] = useState(false);
  const [checking, setChecking] = useState(false);

  const ping = useCallback(async () => {
    const ok = await checkHealth();
    setIsDown(!ok);
  }, []);

  useEffect(() => {
    ping();
    const id = setInterval(ping, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [ping]);

  const retry = useCallback(async () => {
    setChecking(true);
    await ping();
    setChecking(false);
  }, [ping]);

  return { isDown, checking, retry };
}

export default function ServerDownPage({ onRetry, checking }: { onRetry: () => void; checking: boolean }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6">
        <Server size={36} className="text-orange-500" />
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">Server Unreachable</h1>
      <p className="text-gray-500 text-sm max-w-xs mb-8">
        We can't connect to the Dealio server right now. This is usually temporary — please try again in a moment.
      </p>

      <button
        onClick={onRetry}
        disabled={checking}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60 transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
      >
        <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
        {checking ? 'Checking…' : 'Try again'}
      </button>

      <div className="mt-10 flex items-center gap-2 text-xs text-gray-400">
        <WifiOff size={13} />
        <span>Retrying automatically every 15 seconds</span>
      </div>
    </div>
  );
}
