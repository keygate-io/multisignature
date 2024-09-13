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
  account: Principal | undefined;
  icpAccount: string | undefined;
  balance: bigint;
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
  const [account, setAccount] = useState<Principal | undefined>(undefined);
  const [icpAccount, setIcpAccount] = useState<string | undefined>(undefined);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const setupAccount = async (): Promise<void> => {
      if (!identity) {
        if (!window.location.href.includes("/")) {
          navigate("/");
        }
        return;
      }

      try {
        const user = await getUser(identity.getPrincipal());
        const vaults = await getUserVaults(identity.getPrincipal());

        if (user && vaults.length > 0) {
          setAccount(vaults[0][1]);
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
      if (!account) return;

      try {
        const result = await getSubaccount(account, "ICP");
        if ("Ok" in result) {
          setIcpAccount(result.Ok);
        } else {
          throw new Error("Failed to get ICP subaccount");
        }
      } catch (err) {
        setError("Failed to get ICP subaccount");
      }
    };

    fetchIcpAccount();
  }, [account]);

  useEffect(() => {
    const fetchBalance = async (): Promise<void> => {
      if (!icpAccount) return;

      try {
        const result = await balanceOf(icpAccount);
        setBalance(result.e8s);
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
  }, [icpAccount]);

  const refreshBalance = async (): Promise<void> => {
    setIsLoading(true);
    if (icpAccount) {
      try {
        const result = await balanceOf(icpAccount);
        setBalance(result.e8s);
        setError("");
      } catch (err) {
        setError("Failed to fetch balance");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value: AccountContextType = {
    account,
    icpAccount,
    balance,
    isLoading,
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
