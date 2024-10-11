import React from "react";
import { Shield, Lock, Zap, Globe, Users, Wallet } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <a
            href="/"
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
          >
            <img
              src="/keygate-logo.svg"
              alt="DFINITY logo"
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
              <button className="bg-white text-black px-8 py-3 rounded-full transition-opacity border-none hover:cursor-pointer rounded-md">
                Launch dApp
              </button>
              <a
                href="https://www.notion.so/Technical-Architecture-10e834c1223d808c9359d6d720fd747a"
                className="inline-block"
              >
                <button className="bg-sky-800 text-white px-8 py-3 rounded-md hover:bg-blue transition-colors hover:cursor-pointer border-none">
                  Documentation
                </button>
              </a>
            </div>
            <img
              src="hosted_onchain.png"
              alt="Internet Computer Logo"
              className="h-32 mt-8 pointer-events-none"
            />
          </div>
        </section>

        <section id="features" className="py-32 bg-opacity-50">
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

        <section id="get-started" className="py-40">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-5xl tracking-tighter font-semibold mb-6">
              Ready to Secure Your Digital Assets?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join our early adopters program and be among the first to
              experience the future of multisignature wallets.
            </p>
            <form
              className="max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow px-5 py-2 bg-transparent text-white border-b-none focus:outline-none focus:ring-2 hover:outline-none focus:ring-gray-700 rounded-md border-[1px] !shadow-none"
                />
                <button
                  type="submit"
                  className="text-black text-white px-3 rounded-md py-2 hover:opacity-90 transition-opacity border-none"
                >
                  Join Waitlist
                </button>
              </div>
            </form>
          </div>
        </section>
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
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-gray-700 bg-opacity-30 p-6 rounded-none md:rounded-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

export default App;
