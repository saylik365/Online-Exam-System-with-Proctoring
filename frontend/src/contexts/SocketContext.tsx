'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useToast } from '@/components/ui/use-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connect = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user._id) {
      console.error('No token or user data found');
      return;
    }

    const newSocket = io('http://localhost:5000', {
      auth: {
        token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      // Authenticate the socket connection
      newSocket.emit('authenticate', {
        userId: user._id,
        role: user.role,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('cheating_warning', (data) => {
      toast({
        title: 'Warning: Cheating Detected',
        description: data.details,
        variant: 'destructive',
      });
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}; 