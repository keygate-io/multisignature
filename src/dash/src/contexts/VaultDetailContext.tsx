import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { DEFAULT_SUBACCOUNT } from "../util/constants";
import { useParams } from "react-router-dom";
import { useInternetIdentity } from "../hooks/use-internet-identity";
import { balanceOf } from "../api/ledger";

interface VaultDetail {
  id: Principal;
  name: string;
}

interface VaultDetailContextType {
  vaultName: string;
  vaultCanisterId: Principal;
  nativeAccountId: string;
  nativeBalance: bigint | null;
  isLoading: boolean;
  error: string | null;
  refreshVaultDetail: () => Promise<void>;
}

const VaultDetailContext = createContext<VaultDetailContextType | undefined>(
  undefined
);

interface VaultDetailProviderProps {
  children: ReactNode;
}

export const VaultDetailProvider: React.FC<VaultDetailProviderProps> = ({
  children,
}) => {
  const [vaultDetail, setVaultDetail] = useState<VaultDetail | null>(null);
  const [nativeAccountId, setNativeAccountId] = useState<string | null>(null);
  const [nativeBalance, setNativeBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { identity } = useInternetIdentity();
  const { vaultId } = useParams<{ vaultId: string }>();

  useEffect(() => {
    const interval = setInterval(() => {
      fetchVaultDetail();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchVaultDetail();
  }, [vaultId]);

  useEffect(() => {
    if (vaultDetail) {
      const nativeAccountId = AccountIdentifier.fromPrincipal({
        principal: vaultDetail.id,
        subAccount: DEFAULT_SUBACCOUNT,
      });

      setNativeAccountId(nativeAccountId.toHex());
    }
  }, [vaultDetail]);

  useEffect(() => {
    if (!identity) {
      return;
    }

    if (!vaultId) {
      return;
    }

    const accountId = AccountIdentifier.fromPrincipal({
      principal: Principal.fromText(vaultId),
      subAccount: DEFAULT_SUBACCOUNT,
    });

    async function fetchNativeBalance() {
      const balance = await balanceOf(accountId.toUint8Array());
      setNativeBalance(balance.e8s);
    }

    fetchNativeBalance();
  }, [vaultId, identity]);

  const fetchVaultDetail = async () => {
    try {
      if (!vaultId) {
        setError("Vault ID is required");
        return;
      }

      const mockVaultDetail: VaultDetail = {
        id: Principal.fromText(vaultId),
        name: `Funding`,
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

  const value: VaultDetailContextType = useMemo(
    () => ({
      vaultName: vaultDetail?.name ?? "",
      vaultCanisterId: vaultDetail?.id ?? Principal.anonymous(),
      nativeAccountId: nativeAccountId ?? "",
      nativeBalance: nativeBalance ?? 0n,
      isLoading,
      error,
      refreshVaultDetail,
    }),
    [vaultDetail, isLoading, error, nativeBalance]
  );

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
