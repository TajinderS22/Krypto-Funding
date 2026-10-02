import React from "react";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-400 dark:selection:bg-[#fbbf24] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-5xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-purple-500 dark:from-[#fbbf24] dark:to-[#a855f7] tracking-tighter uppercase mb-6">
            Terms of Service
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light max-w-3xl leading-relaxed">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-16">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">
              01. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              By accessing and using Krypto Funding ("the Platform"), you agree
              to be bound by these Terms of Service. If you do not agree with
              any part of these terms, you must not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">
              02. Educational & Simulation Nature
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              The Platform provides simulated trading environments strictly for
              educational and training purposes. NO REAL MONEY IS TRADED. Users
              do not trade on live markets. The metrics and performance
              displayed on the Platform are purely hypothetical and simulated.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">
              03. User Accounts & Practice Fees
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              To access the simulation environment, users must pay a
              non-refundable "Practice Fee". This fee grants access to the
              simulated software and data feeds. It is not an investment, a
              deposit, or a real-money trading account balance.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">
              04. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We are not liable for any losses or damages arising from your use
              of the Platform. Trading in real financial markets carries a high
              level of risk, and performance in a simulated environment does not
              guarantee future results in live trading.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">
              05. Termination
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We reserve the right to terminate or suspend access to our service
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
