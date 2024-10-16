import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Principal } from "@dfinity/principal";
import { getVaults } from "../api/account";

interface VaultDetail {
  id: Principal;
  name: string;
  balance: bigint;
}

interface VaultDetailContextType {
  vault: VaultDetail | null;
  isLoading: boolean;
  error: string | null;
  refreshVaultDetail: () => Promise<void>;
}

const VaultDetailContext = createContext<VaultDetailContextType | undefined>(
  undefined
);

interface VaultDetailProviderProps {
  children: ReactNode;
  vaultId: Principal;
}

export const VaultDetailProvider: React.FC<VaultDetailProviderProps> = ({
  children,
  vaultId,
}) => {
  const [vaultDetail, setVaultDetail] = useState<VaultDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVaultDetail();
  }, [vaultId]);

  const fetchVaultDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is where you'd call your API to get vault details
      // For now, we'll use mock data
      const mockVaultDetail: VaultDetail = {
        id: vaultId,
        name: `Vault ${vaultId.toString()}`,
        balance: BigInt(1000000), // Example balance
      };
      setVaultDetail(mockVaultDetail);
    } catch (err) {
      setError("Failed to fetch vault details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshVaultDetail = async () => {
    await fetchVaultDetail();
  };

  const value: VaultDetailContextType = {
    vault: vaultDetail,
    isLoading,
    error,
    refreshVaultDetail,
  };

  return (
    <VaultDetailContext.Provider value={value}>
      {children}
    </VaultDetailContext.Provider>
  );
};

export const useVaultDetail = (): VaultDetailContextType => {
  const context = useContext(VaultDetailContext);
  if (!context) {
    throw new Error("useVaultDetail must be used within a VaultDetailProvider");
  }
  return context;
};
