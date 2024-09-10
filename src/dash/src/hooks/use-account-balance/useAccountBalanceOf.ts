import { useEffect, useState } from "react";
import { balanceOf } from "../../api/ledger";

export const useAccountBalanceOf = (
  icpAccount: string | null,
  refreshInterval = 2000
) => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));

  useEffect(() => {
    const fetchBalance = async () => {
      if (!icpAccount) return;

      try {
        const result = await balanceOf(icpAccount);
        setBalance(result.e8s);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    };

    fetchBalance();
    const intervalId = setInterval(fetchBalance, refreshInterval);

    return () => clearInterval(intervalId);
  }, [icpAccount, refreshInterval]);

  return balance;
};
