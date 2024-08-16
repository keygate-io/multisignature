import { useState } from "react";
import { Button } from "antd";

const CreateAccount = () => {
  const [accountName, setAccountName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("Sepolia");

  return (
    <div className="bg-gray-800 text-white max-h-screen w-full flex flex-col">
      <header className="p-4 flex justify-between items-center bg-gray-800">
        <h1 className="text-xl font-bold">Smart Account</h1>
        <div className="flex items-center space-x-2">
          <div className="bg-purple-600 rounded-full w-6 h-6"></div>
          <span className="text-gray-400">1.52502 ICP</span>
        </div>
      </header>

      <main className="flex-grow flex justify-center">
        <div className="max-w-xl w-full">
          <h2 className="text-2xl font-bold mb-6">Create new Smart Account</h2>
          <div className="bg-gray-700 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-4">
              1. Select network and name of your Smart Account
            </h3>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-gray-600 p-2 rounded text-white"
              />
            </div>
            <div className="mb-4">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full bg-gray-600 p-2 rounded text-white"
              >
                <option value="Sepolia">ICP</option>
              </select>
            </div>
            <p className="text-sm text-gray-400">
              By continuing, you agree to our{" "}
              <a href="#" className="text-blue-400">
                terms of use
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-400">
                privacy policy
              </a>
              .
            </p>
          </div>
          <div className="flex justify-between flex-row-reverse">
            <Button type="primary">Next</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateAccount;
