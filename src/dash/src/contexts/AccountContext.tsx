import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Principal } from "@dfinity/principal";
import { balanceOf } from "../api/ledger";
import { getSubaccount } from "../api/account";
import { getUser, getUserVaults } from "../api/users";
import { useInternetIdentity } from "../hooks/use-internet-identity";
import { useNavigate } from "react-router-dom";

interface AccountContextType {
  vaultCanisterId: Principal | undefined;
  vaultName: string | undefined;
  icpSubaccount: string | undefined;
  icpBalance: bigint;
  isLoading: boolean;
  error: string;
  refreshBalance: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const BALANCE_REFRESH_INTERVAL = 10000; // 10 seconds

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({
  children,
}) => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [vaultCanisterId, setVaultCanisterId] = useState<Principal | undefined>(
    undefined
  );
  const [icpSubaccount, setIcpSubaccount] = useState<string | undefined>(
    undefined
  );
  const [vaultName, setVaultName] = useState<string | undefined>(undefined);
  const [icpBalance, setIcpBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const setupAccount = async (): Promise<void> => {
      if (!identity) {
        navigate("/");
        return;
      }

      try {
        const user = await getUser(identity.getPrincipal());
        const vaults = await getUserVaults(identity.getPrincipal());

        if (user && vaults.length > 0) {
          console.log("vaults", vaults);
          setVaultCanisterId(vaults[0][1]);
          console.log("vaults[0][0]", vaults[0][0]);
          setVaultName(vaults[0][0]);
        } else if (user && vaults.length === 0) {
          navigate("/new-account/create");
        } else {
          navigate("/new-profile/create");
        }
      } catch (err) {
        setError("Failed to fetch user account");
      }
    };

    setupAccount();
  }, [identity, navigate]);

  useEffect(() => {
    const fetchIcpAccount = async (): Promise<void> => {
      if (!vaultCanisterId) return;

      try {
        const result = await getSubaccount(vaultCanisterId, "ICP");
        if ("Ok" in result) {
          setIcpSubaccount(result.Ok);
        } else {
          throw new Error("Failed to get ICP subaccount");
        }
      } catch (err) {
        setError("Failed to get ICP subaccount");
      }
    };

    fetchIcpAccount();
  }, [vaultCanisterId]);

  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      if (!icpSubaccount) return;

      try {
        const result = await balanceOf(icpSubaccount);
        setIcpBalance(result.e8s);
        setError("");
      } catch (err) {
        setError("Failed to fetch balance");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const intervalId = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [icpSubaccount]);

  const refreshBalance = async (): Promise<void> => {
    setIsLoading(true);
    if (icpSubaccount) {
      try {
        const result = await balanceOf(icpSubaccount);
        setIcpBalance(result.e8s);
        setError("");
      } catch (err) {
        setError("Failed to fetch balance");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value: AccountContextType = {
    vaultCanisterId,
    icpSubaccount,
    icpBalance,
    isLoading,
    vaultName,
    error,
    refreshBalance,
  };

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};
