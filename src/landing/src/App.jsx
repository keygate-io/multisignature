import React from "react";
import { Shield, Lock, Globe, Users, Wallet, ArrowRight } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      <div
        style={{
          backgroundImage: `url("dots.svg")`,
          backgroundRepeat: true,
        }}
      >
        <header className="container mx-auto px-4 py-6">
          <nav className="flex justify-between items-center">
            <a
              href="/"
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
            >
              <img
                src="/keygate-logo.svg"
                alt="Keygate logo"
                className="h-8 mr-2"
              />
            </a>
            <div className="space-x-6">
              <a
                href="#features"
                className="transition-colors no-underline text-white"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="transition-colors no-underline text-white"
              >
                How It Works
              </a>
              <a
                href="#get-started"
                className="transition-colors no-underline text-white"
              >
                Get Started
              </a>
            </div>
          </nav>
        </header>

        <main>
          <section className="py-20 text-center">
            <div className="container mx-auto px-4 flex items-center flex-col">
              <h1 className="text-3xl font-bold tracking-tighter mb-8 sm:text-4xl md:text-5xl lg:text-6xl/none  drop-shadow-lg">
                Secure your $ICP and ICRCs using
                <div>a decentralized multisignature wallet.</div>
              </h1>
              <p className="text-xl text-gray-400 mb-10 my-0 max-w-2xl mx-auto">
                Keygate Vault is the <b>first fully decentralized</b>{" "}
                multisignature wallet for ICP, ckETH, ckBTC, and more.
              </p>
              <div className="space-x-4">
                <a
                  href="https://salx4-eyaaa-aaaak-qlomq-cai.icp0.io/"
                  className="inline-block"
                  target="_blank"
                >
                  <button
                    className="
                    bg-gradient-to-r from-blue-500 to-blue-600 
                    text-white
                    px-8 py-3 
                    rounded-full 
                    transition-all duration-300 
                    hover:opacity-90 hover:shadow-lg
                    border-none
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
                    hover:cursor-pointer
                  "
                  >
                    Launch dApp
                  </button>
                </a>
                <a
                  href="https://www.notion.so/Technical-Architecture-10e834c1223d808c9359d6d720fd747a"
                  className="inline-block no-underline"
                  target="_blank"
                >
                  <div className="ml-2 flex flex-row items-center space-x-0">
                    <button className="text-white px-2 py-3 border-none bg-transparent font-medium text-md hover:underline  underline-offset-4 hover:cursor-pointer">
                      Read the Documentation
                    </button>
                    <ArrowRight className="text-white" />
                  </div>
                </a>
              </div>
              <img
                src="hosted_onchain.png"
                alt="Internet Computer Logo"
                className="h-32 mt-8 pointer-events-none"
              />
            </div>
          </section>

          <section id="features" className="py-32 bg-opacity-70">
            <div className="container mx-auto">
              <h2 className="text-5xl font-semibold text-center mb-12">
                Key Features
              </h2>
              <div className="flex flex-wrap justify-center gap-4 md:gap-10">
                <FeatureCard
                  icon={<Lock className="w-12 h-12" />}
                  title="Multisignature"
                  description="Implement m-of-n signature schemes for enhanced security and reduced risk."
                />
                <FeatureCard
                  icon={<Globe className="w-12 h-12" />}
                  title="ICP and ICRC support"
                  description="Manage assets like ICP and ICRCs, with support for ckETH, ckBTC, and more."
                />
                <FeatureCard
                  icon={<Users className="w-12 h-12" />}
                  title="Identity-based Access"
                  description="Control access using Internet Identity for enhanced security and user management."
                />
                <FeatureCard
                  icon={<Wallet className="w-12 h-12" />}
                  title="Asset Visualization"
                  description="Get clear insights into your digital assets with comprehensive statistics."
                />
                <FeatureCard
                  icon={<Shield className="w-12 h-12" />}
                  title="Decentralized & Verifiable"
                  description="All of our systems, including user interfaces, are deployed on decentralized infrastructure. Fully verifiable."
                />
              </div>
            </div>
          </section>

          <GetStartedSection />
        </main>

        <footer className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Keygate. All rights reserved.
              </p>
              <nav className="flex space-x-4 mt-4 md:mt-0">
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Contact
                </a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div
      className="
      bg-gradient-to-r from-0% from-[#1e2a4a] to-95% to-[#0f172a]
      p-6 rounded-xl
    "
    >
      <div className="mb-4 text-white">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

const GetStartedSection = () => (
  <section id="get-started" className="py-40">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-5xl tracking-tighter font-semibold mb-6">
        Ready to Secure Your Digital Assets?
      </h2>
      <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
        Join our early adopters program and be among the first to experience the
        future of multisignature wallets.
      </p>
      <div className="flex justify-center space-x-4 flex-col space-y-6">
        <a
          href="https://discord.gg/kRvpMEzJ"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-gray-300"
        >
          <img
            src="discord-logo-white.svg"
            className="h-24 bg-[#5865F2] p-8 rounded-xl"
          />
        </a>
        <div>Join us on Discord</div>
      </div>
    </div>
  </section>
);

export default App;
