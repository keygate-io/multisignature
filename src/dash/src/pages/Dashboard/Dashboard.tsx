import { useInternetIdentity } from "../../hooks/use-internet-identity";

const Dashboard = () => {
  const { identity } = useInternetIdentity();

  return (
    <div className="flex justify-center items-center w-full">
      <h1>Dashboard</h1>
    </div>
  );
};

export default Dashboard;
