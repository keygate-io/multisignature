import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface ConnectionContextType {
    isConnected: boolean;
    setIsConnected: (status: boolean) => void;
}

interface ConnectionProviderProps {
    children: ReactNode;
}


export const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);


export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);

    return (
        <ConnectionContext.Provider value={{ isConnected, setIsConnected }}>
            {children}
        </ConnectionContext.Provider>
    )
}

export const useConnection = () => {
    return useContext(ConnectionContext)
}

