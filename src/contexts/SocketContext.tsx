import { createContext, useContext, useRef, ReactNode } from "react";
import { Socket } from "socket.io-client";

interface SocketContextType {
  socket: React.MutableRefObject<Socket | null>;
}

const SocketContext = createContext<SocketContextType>({
  socket: { current: null },
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const socket = useRef<Socket | null>(null);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
