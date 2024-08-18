import { useInternetIdentity } from "../../hooks/use-internet-identity";
import { Layout, Button, Progress, Card } from "antd";

const { Sider, Content } = Layout;

const Dashboard = () => {
  const { identity } = useInternetIdentity();

  return (
    <Layout style={{ minHeight: "80vh" }}>
      <Sider width={326} theme="dark">
        <div className="p-4">{/* Logo or wallet info */}</div>
        <Button type="primary" style={{ width: "90%", margin: "0 5%" }}>
          New transaction
        </Button>
      </Sider>
      <Layout className="bg-gray-800">
        <Content style={{ margin: "24px 16px" }} className="text-white p-4">
          <div>
            <p className="text-lg">Total asset value</p>
            <div className="text-5xl font-semibold">0 ICP</div>
          </div>
          <div className="flex flex-row space-x-8 mt-8">
            <div>
              <Progress percent={50} type="circle" />
            </div>
            <div className="leading-none">
              <p className="text-2xl">Activate your Smart Account</p>
              <p>
                1 of 2 steps completed. Finish the next steps to start using all
                Safe Account features:
              </p>
            </div>
          </div>
          <div className="flex flex-row space-x-12 mt-12 w-full">
            <Card title="Add native assets" bordered={false} className="w-1/3">
              <p>Receive ICP to start interacting with your account.</p>
              <div
                className="font-bold break-all"
                style={{ fontFamily: "monospace" }}
              >
                89e1ce873416e42c72257315354771122c4116e0d23c0e8073a0697908bda121
              </div>
            </Card>
            <Card title="Create your first transaction" bordered={false}>
              <p>Simply send funds or add a new signer to the account.</p>
              <Button type="primary">Create transaction</Button>
            </Card>
            <Card title="Safe Account is ready!" bordered={false}>
              <p>
                Continue to improve your account security and unlock more
                features.
              </p>
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
