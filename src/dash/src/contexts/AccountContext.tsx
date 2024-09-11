import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Principal } from "@dfinity/principal";
import { balanceOf } from "../api/ledger";
import { getSubaccount } from "../api/account";
import { getUser } from "../api/users";
import { useInternetIdentity } from "../hooks/use-internet-identity";
import { useNavigate } from "react-router-dom";

interface AccountContextType {
  account: Principal | null;
  icpAccount: string | null;
  balance: bigint;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const BALANCE_REFRESH_INTERVAL = 10000; // 10 seconds

export const AccountProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Principal | null>(null);
  const [icpAccount, setIcpAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const latestBalanceRef = useRef<bigint>(BigInt(0));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!icpAccount) return;

    try {
      const result = await balanceOf(icpAccount);
      if (result.e8s !== latestBalanceRef.current) {
        latestBalanceRef.current = result.e8s;
        setBalance(result.e8s);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      // Don't set error state here to avoid unnecessary re-renders
    }
  }, [icpAccount]);

  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    await fetchBalance();
    setIsLoading(false);
  }, [fetchBalance]);

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      if (identity) {
        try {
          const user = await getUser(identity.getPrincipal());
          if (user && isMounted) {
            setAccount(user.accounts[0]);
          } else if (!user && isMounted) {
            navigate("/new-profile/create");
          } else if (isMounted) {
            navigate("/new-account/create");
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
          if (isMounted) {
            setError("Failed to fetch user account");
          }
        }
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [identity, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchIcpAccount = async () => {
      if (account) {
        try {
          const icpAccountQuery = await getSubaccount(account, "ICP");
          if ("Ok" in icpAccountQuery) {
            setIcpAccount(icpAccountQuery.Ok);
          } else if ("Err" in icpAccountQuery) {
            // @ts-ignore: Ignore the TypeScript error for now
            throw new Error(icpAccountQuery.Err.message);
          } else {
            throw new Error("Unexpected response from getSubaccount");
          }
        } catch (err) {
          console.error("Failed to get ICP subaccount:", err);
          if (isMounted) {
            setError("Failed to get ICP subaccount");
          }
        }
      }
    };
    fetchIcpAccount();
    return () => {
      isMounted = false;
    };
  }, [account]);

  useEffect(() => {
    fetchBalance();
    timerRef.current = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchBalance]);

  useEffect(() => {
    if (account && icpAccount) {
      setIsLoading(false);
    }
  }, [account, icpAccount]);

  const value = useMemo(
    () => ({ account, icpAccount, balance, isLoading, error, refreshBalance }),
    [account, icpAccount, balance, isLoading, error, refreshBalance]
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};
