import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Principal } from "@dfinity/principal";
import { balanceOf } from "../api/ledger";
import { useInternetIdentity } from "../hooks/use-internet-identity";
import { useNavigate } from "react-router-dom";
import { getSubaccount, getVaults } from "../api/account";

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
        const vaults = await getVaults(identity);

        if (vaults.length > 0) {
          setVaultCanisterId(vaults[0]);
          setVaultName("Funding");
        } else if (vaults.length === 0) {
          navigate("/new-account/create");
        } else {
          navigate("/new-profile/create");
        }
      } catch (err) {
        // TODO: Make getUser return an Option instead of throwing an error if user does not exist
        // setError("Failed to fetch user account");
        navigate("/new-account/create");
        console.log(err);
      }
    };

    setupAccount();
  }, [identity, navigate]);

  useEffect(() => {
    const fetchIcpAccount = async (): Promise<void> => {
      if (!vaultCanisterId) return;

      try {
        const result = await getSubaccount(
          vaultCanisterId,
          "icp:native",
          identity!
        );

        if (!result) {
          throw new Error("Failed to get ICP subaccount");
        }

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
