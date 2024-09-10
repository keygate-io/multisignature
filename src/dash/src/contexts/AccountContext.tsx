import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
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
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const BALANCE_REFRESH_INTERVAL = 2000; // 2 seconds

export const AccountProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Principal | null>(null);
  const [icpAccount, setIcpAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (identity) {
        try {
          const user = await getUser(identity.getPrincipal());
          if (user) {
            console.log("User found:", user);
            setAccount(user.accounts[0]);
          } else {
            navigate("/new-account");
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
          setError("Failed to fetch user account");
        }
      }
    };

    fetchUser();
  }, [identity, navigate]);

  useEffect(() => {
    const fetchIcpAccount = async () => {
      if (account) {
        try {
          const icpAccountQuery = await getSubaccount(account, "ICP");
          if ("Ok" in icpAccountQuery) {
            setIcpAccount(icpAccountQuery.Ok);
          } else {
            throw new Error(icpAccountQuery.Err.message);
          }
        } catch (err) {
          setError("Failed to get ICP subaccount");
          console.error("Failed to get ICP subaccount:", err);
        }
      }
    };
    fetchIcpAccount();
  }, [account]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!icpAccount) return;

      setIsLoading(true);
      try {
        const result = await balanceOf(icpAccount);
        setBalance(result.e8s);
        setError(null);
      } catch (err) {
        setError("Failed to fetch balance");
        console.error("Failed to fetch balance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const intervalId = setInterval(fetchBalance, BALANCE_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [icpAccount]);

  const value = useMemo(
    () => ({ account, icpAccount, balance, isLoading, error }),
    [account, icpAccount, balance, isLoading, error]
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
