import { useEffect } from "react";
import { useAccount } from "../../contexts/AccountContext";
import { getSubaccount } from "../../api/account";

export const useIcpAccount = () => {
  const { account, setIcpAccount } = useAccount();

  useEffect(() => {
    const fetchIcpAccount = async () => {
      if (account) {
        const icpAccountQuery = await getSubaccount(account, "ICP");
        if ("Ok" in icpAccountQuery) {
          setIcpAccount(icpAccountQuery.Ok);
        } else {
          console.error(
            "Failed to get ICP subaccount:",
            icpAccountQuery.Err.message
          );
        }
      }
    };
    fetchIcpAccount();
  }, [account, setIcpAccount]);
};
