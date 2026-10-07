import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/auth';

/**
 * Real-time updates over Supabase Realtime (Broadcast).
 *
 * Replaces the old Socket.IO connection but keeps the same API
 * (`socket.on/off`, `joinRooms`, `leaveRooms`, `isConnected`, `userId`), so
 * pages and `useSocketEvent` didn't have to change.
 *
 * The backend publishes `{ event, data, excludeUserId? }` envelopes to the
 * channel `${channelPrefix}:${room}`; the prefix is only given out by the
 * authenticated GET /api/realtime/config.
 */

type Listener = (data: any) => void;

/** Minimal socket-like event emitter (what useSocketEvent relies on). */
export class RealtimeEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return this;
  }

  off(event: string, listener?: Listener) {
    if (!listener) this.listeners.delete(event);
    else this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((l) => {
      try {
        l(data);
      } catch (err) {
        console.error(`[Realtime] handler for "${event}" failed`, err);
      }
    });
  }
}

interface RealtimeConfig {
  enabled: boolean;
  url: string;
  key: string;
  channelPrefix: string;
  allRoom: string;
}

interface SocketContextType {
  socket: RealtimeEmitter | null;
  isConnected: boolean;
  userId: string | null;
  joinRooms: (rooms: string[]) => void;
  leaveRooms: (rooms: string[]) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Module-level state to survive React StrictMode double-mount
let _emitter: RealtimeEmitter | null = null;
let _client: SupabaseClient | null = null;
let _config: RealtimeConfig | null = null;
let _myUserId: string | null = null;
let _onStatus: ((connected: boolean) => void) | null = null;
const _desiredRooms = new Set<string>();
const _channels = new Map<string, RealtimeChannel>();

function dispatch(payload: any) {
  if (!payload || typeof payload.event !== 'string' || !_emitter) return;
  // Server asked to skip the user who made the change (they already have fresh data)
  if (payload.excludeUserId && payload.excludeUserId === _myUserId) return;
  _emitter.emit(payload.event, payload.data);
}

function subscribeRoom(room: string) {
  if (!_client || !_config || _channels.has(room)) return;
  const channel = _client
    .channel(`${_config.channelPrefix}:${room}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'message' }, ({ payload }) => dispatch(payload))
    .subscribe((status) => {
      if (room !== _config?.allRoom) return;
      if (status === 'SUBSCRIBED') _onStatus?.(true);
      else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') _onStatus?.(false);
    });
  _channels.set(room, channel);
}

function unsubscribeRoom(room: string) {
  const channel = _channels.get(room);
  if (!channel) return;
  _channels.delete(room);
  _client?.removeChannel(channel);
}

function teardown() {
  _channels.forEach((ch) => _client?.removeChannel(ch));
  _channels.clear();
  _client?.realtime.disconnect();
  _client = null;
  _config = null;
}

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState<RealtimeEmitter | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  _myUserId = user?.id || null;

  useEffect(() => {
    if (!isAuthenticated) {
      teardown();
      _desiredRooms.clear();
      _emitter = null;
      setSocket(null);
      setIsConnected(false);
      return;
    }

    if (!_emitter) _emitter = new RealtimeEmitter();
    setSocket(_emitter);
    _onStatus = setIsConnected;

    // Already connected (StrictMode re-mount)
    if (_client) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/realtime/config');
        if (!res.ok) throw new Error(`config ${res.status}`);
        const cfg: RealtimeConfig = await res.json();
        if (cancelled || _client) return;
        if (!cfg.enabled) {
          console.warn('[Realtime] disabled on server');
          return;
        }
        _config = cfg;
        _client = createClient(cfg.url, cfg.key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 20 } },
        });
        subscribeRoom(cfg.allRoom);
        _desiredRooms.forEach(subscribeRoom);
      } catch (err: any) {
        console.warn('[Realtime] connection setup failed:', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
      // Don't disconnect on StrictMode re-mount; real logout is handled above
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on actual unmount (when whole app unmounts)
  useEffect(() => {
    return () => {
      teardown();
      _desiredRooms.clear();
    };
  }, []);

  const joinRooms = useCallback((rooms: string[]) => {
    rooms.forEach((r) => {
      _desiredRooms.add(r);
      subscribeRoom(r);
    });
  }, []);

  const leaveRooms = useCallback((rooms: string[]) => {
    rooms.forEach((r) => {
      _desiredRooms.delete(r);
      unsubscribeRoom(r);
    });
  }, []);

  const value = useMemo<SocketContextType>(() => ({
    socket,
    isConnected,
    userId: user?.id || null,
    joinRooms,
    leaveRooms,
  }), [socket, isConnected, user?.id, joinRooms, leaveRooms]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
