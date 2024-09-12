import { Button } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "../../contexts/AccountContext";
import { useInternetIdentity } from "../../hooks/use-internet-identity";

const Home: React.FC = () => {
  const { account, error } = useAccount();
  const { login } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      navigate("/dashboard");
    }
  }, [account, navigate]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-12">
      <h1 className="text-2xl font-bold m-0 bg-gray-700 text-white p-4">
        Secure Multi-Signature Smart Accounts
      </h1>
      <p className="mt-4">
        Keygate provides practical applications of cryptography for secure
        management of on-chain assets. Our multi-signature smart accounts offer
        enhanced security for both retail and enterprise users on the Internet
        Computer Protocol (ICP) blockchain.
      </p>
      <div className="grid grid-cols-2 grid-rows-2 gap-4 mt-8">
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Smart Account Management</h2>
          <p>
            Create and manage multi-signature smart accounts with customizable
            settings. Configure the required number of signatories and set
            user-defined spending limits for enhanced security.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Role-Based Access Control</h2>
          <p>
            Share smart accounts with multiple users and assign different roles
            such as viewer, initiator, or approver. Ensure proper access control
            and collaborative management of funds.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Multi-Party Transactions</h2>
          <p>
            Initiate, approve, and execute transactions with multiple
            signatories. Transactions require consensus from the predefined
            number of approvers before execution on the ICP blockchain.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Token Support</h2>
          <p>
            Manage $ICP and ICRC-1,2,3,4 tokens securely within your smart
            accounts. Keep track of balances and execute transactions across
            supported token types.
          </p>
        </div>
        <div className="col-span-2 bg-gray-700 text-white p-4 flex justify-center items-center">
          <Button type="primary" onClick={login} size="large">
            Login with Internet Identity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
