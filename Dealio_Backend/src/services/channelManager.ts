import { Response } from 'express';

export interface ChannelEvent {
  type: 'new_project' | 'connected' | 'city_changed';
  title: string;
  message: string;
  projectId?: number;
  city: string;
  timestamp: string;
}

class ChannelManager {
  // city (lowercase) → Map<userId, SSE Response>
  private channels = new Map<string, Map<number, Response>>();

  subscribe(city: string, userId: number, res: Response): void {
    const key = city.toLowerCase().trim();
    if (!this.channels.has(key)) this.channels.set(key, new Map());
    this.channels.get(key)!.set(userId, res);
    console.log(`[Channel] user:${userId} → "${key}" (${this.channels.get(key)!.size} subscribers)`);
  }

  unsubscribe(city: string, userId: number): void {
    const key = city.toLowerCase().trim();
    const ch = this.channels.get(key);
    if (!ch) return;
    ch.delete(userId);
    if (ch.size === 0) this.channels.delete(key);
    console.log(`[Channel] user:${userId} left "${key}"`);
  }

  // Publish an event to every subscriber of a city channel.
  // Returns the number of live connections that received the event.
  publish(city: string, event: ChannelEvent): number {
    const key = city.toLowerCase().trim();
    const ch = this.channels.get(key);
    if (!ch || ch.size === 0) return 0;

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    const dead: number[] = [];

    ch.forEach((res, uid) => {
      try {
        res.write(payload);
      } catch {
        dead.push(uid);
      }
    });

    dead.forEach(uid => ch.delete(uid));
    console.log(`[Channel] published to "${key}": ${ch.size} delivered, ${dead.length} dropped`);
    return ch.size;
  }

  // Diagnostic snapshot: city → subscriber count
  stats(): Record<string, number> {
    const out: Record<string, number> = {};
    this.channels.forEach((ch, city) => { out[city] = ch.size; });
    return out;
  }
}

// Singleton — one instance shared across all requests in the process
export const channelManager = new ChannelManager();