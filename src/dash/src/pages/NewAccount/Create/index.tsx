import { useEffect, useState } from "react";
import { Button, message, Progress } from "antd";
import { useInternetIdentity } from "../../../hooks/use-internet-identity";
import { getUser } from "../../../api/users";
import { useNavigate } from "react-router-dom";
import { registration } from "../../../../../declarations/registration";
import { createSubaccount, deployAccount } from "../../../api/account";

interface Step1Props {
  accountName: string;
  setAccountName: (name: string) => void;
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
}

const Step1 = ({
  accountName,
  setAccountName,
  selectedNetwork,
  setSelectedNetwork,
}: Step1Props) => (
  <div className="bg-gray-700 rounded-lg p-6 mb-4">
    <h3 className="text-lg font-semibold mb-4">
      1. Select network and name for the account
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
  </div>
);

interface Signer {
  name: string;
  principalId: string;
}

interface Step2Props {
  signers: Signer[];
  setSigners: (signers: Signer[]) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
}

const Step2 = ({
  signers,
  setSigners,
  threshold,
  setThreshold,
}: Step2Props) => {
  const addSigner = () => {
    setSigners([...signers, { name: "", principalId: "" }]);
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index][field] = value;
    setSigners(newSigners);
  };

  return (
    <div className="bg-gray-700 rounded-lg p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">
        2. Signers and confirmations
      </h3>
      <p className="text-sm text-gray-300 mb-4">
        Set the signer wallets of your Smart Account and how many need to
        confirm to execute a valid transaction.
      </p>
      {signers.map((signer, index) => (
        <div key={index} className="mb-4 flex space-x-2">
          <input
            type="text"
            placeholder="Signer name"
            value={signer.name}
            onChange={(e) => updateSigner(index, "name", e.target.value)}
            className="flex-1 bg-gray-600 p-2 rounded text-white"
          />
          <input
            type="text"
            placeholder="Principal ID"
            value={signer.principalId}
            onChange={(e) => updateSigner(index, "principalId", e.target.value)}
            className="flex-1 bg-gray-600 p-2 rounded text-white"
          />
        </div>
      ))}
      <Button
        onClick={addSigner}
        className="mb-4"
        style={{ backgroundColor: "#2d3748", color: "white" }}
      >
        + Add new signer
      </Button>
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Threshold</h4>
        <p className="text-sm text-gray-300 mb-2">
          Any transaction requires the confirmation of:
        </p>
        <div className="flex items-center">
          <select
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="bg-gray-600 p-2 rounded text-white mr-2"
          >
            {signers.map((_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <span>out of {signers.length} signer(s)</span>
        </div>
      </div>
    </div>
  );
};

interface ReviewProps {
  accountName: string;
  selectedNetwork: string;
  signers: Signer[];
  threshold: number;
}

const Review = ({
  accountName,
  selectedNetwork,
  signers,
  threshold,
}: ReviewProps) => (
  <div className="bg-gray-700 rounded-lg p-6 mb-4">
    <h3 className="text-lg font-semibold mb-4">3. Review</h3>
    <p className="text-sm text-gray-300 mb-4">
      You're about to create a new Smart Account and will have to confirm the
      transaction with your connected wallet.
    </p>
    <div className="mb-4">
      <p>
        <strong>Network:</strong> {selectedNetwork}
      </p>
      <p>
        <strong>Name:</strong> {accountName}
      </p>
      <p>
        <strong>Signers:</strong>
      </p>
      {signers.map((signer, index) => (
        <div key={index}>
          {signer.name} - {signer.principalId}
        </div>
      ))}
      <p>
        <strong>Threshold:</strong> {threshold} out of {signers.length}{" "}
        signer(s)
      </p>
    </div>
  </div>
);

const CreateAccount = () => {
  const [step, setStep] = useState(1);
  const [accountName, setAccountName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("ICP");
  const [signers, setSigners] = useState<Signer[]>([
    { name: "Signer 1", principalId: "" },
  ]);
  const [threshold, setThreshold] = useState(1);
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      messageApi.open({
        type: "loading",
        content: "Creating smart account..",
        duration: 0,
      });

      deployAccount(identity!.getPrincipal()).then(async (id) => {
        const subaccount_id = await createSubaccount(id, "ICP");

        console.log(`Account id: ${JSON.stringify(subaccount_id)}`);
        messageApi.destroy();
        navigate("/dashboard");
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    async function loadUser() {
      if (!identity) {
        if (isInitializing) {
          return;
        }

        navigate("/");
        return;
      }

      const profile = await getUser(identity.getPrincipal());
      const defaultName = "Signer 1";

      setSigners([
        {
          name: profile
            ? `${profile.first_name} ${profile.last_name}`
            : defaultName || defaultName,
          principalId: identity.getPrincipal().toText(),
        },
      ]);
    }

    loadUser();
  }, [identity]);

  return (
    <div className="bg-gray-800 text-white max-h-screen w-full flex flex-col">
      {contextHolder}
      <main className="mt-20 flex-grow flex justify-center">
        <div className="max-w-xl w-full">
          <h2 className="text-2xl font-bold mb-6">Create new Smart Account</h2>
          <Progress
            percent={step * 33}
            strokeColor="#4ade80"
            className="mb-6"
          />
          {step === 1 ? (
            <Step1
              accountName={accountName}
              setAccountName={setAccountName}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
            />
          ) : step === 2 ? (
            <Step2
              signers={signers}
              setSigners={setSigners}
              threshold={threshold}
              setThreshold={setThreshold}
            />
          ) : (
            <Review
              accountName={accountName}
              selectedNetwork={selectedNetwork}
              signers={signers}
              threshold={threshold}
            />
          )}
          <div className="flex justify-between">
            {step > 1 && (
              <Button onClick={prevStep} className="bg-gray-600 text-white">
                ← Back
              </Button>
            )}
            <Button
              type="primary"
              onClick={nextStep}
              className="bg-green-400 text-black"
            >
              {step < 3 ? "Next" : "Create"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateAccount;
