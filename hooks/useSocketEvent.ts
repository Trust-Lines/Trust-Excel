import { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * Subscribe to a Socket.IO event. Handler is called whenever the event fires.
 * Automatically cleans up on unmount.
 */
export function useSocketEvent(event: string, handler: (data: any) => void) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const listener = (data: any) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
