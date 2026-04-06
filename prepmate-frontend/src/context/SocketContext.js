import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [liveScores, setLiveScores]   = useState([]);

  useEffect(() => {
    if (!user) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('prepmate_token') },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { userId: user._id, name: user.name });
    });

    socket.on('online_count',   (count) => setOnlineCount(count));
    socket.on('leaderboard_update', (scores) => setLiveScores(scores));

    return () => socket.disconnect();
  }, [user]);

  const emitQuizComplete = (data) => {
    socketRef.current?.emit('quiz_complete', data);
  };

  return (
    <SocketContext.Provider value={{ onlineCount, liveScores, emitQuizComplete }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
