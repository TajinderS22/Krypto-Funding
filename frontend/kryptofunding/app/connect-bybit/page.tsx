"use client";

import React, { useState } from "react";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConnectBybitPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Create Account",
      description:
        "Before connecting to our simulator, you need an active Bybit account. Creating one is free and takes only a few minutes.",
      details: [
        "Go to the official Bybit website. Always verify the URL is exactly bybit.com.",
        "Click 'Sign Up' and enter your email address and a strong password.",
        "Complete the email verification process using the OTP sent to your inbox.",
        "Complete basic Level 1 Identity Verification (KYC) to ensure full access to API creation features.",
      ],
    },
    {
      title: "Demo Trading",
      description:
        "Krypto Funding strictly uses Bybit's Demo Trading environment. We simulate real market conditions without risking actual capital.",
      details: [
        "Log in to your newly created Bybit account.",
        "In the top navigation menu, hover over the 'Derivatives' tab.",
        "Select 'Demo Trading' from the dropdown menu.",
        "Click 'Start Trading' to initialize your virtual balance. Verify you see 'Demo' in the interface.",
      ],
    },
    {
      title: "Navigate to API",
      description:
        "Generate the specific keys needed to securely link your demo account to the Krypto Funding platform.",
      details: [
        "Ensure you are still in the Demo Trading environment. This is critical.",
        "Hover over your profile icon (avatar) in the top right corner of the dashboard.",
        "Select 'API' or 'API Management' from the dropdown menu.",
        "Click the solid 'Create New Key' button located on the right side of the screen.",
      ],
    },
    {
      title: "Set Permissions",
      description:
        "Configure precise permissions allowing our simulator to read trades and sync your virtual balance.",
      details: [
        "Key Type: Select 'System-generated API Keys'.",
        "Usage & Name: Select 'API Transaction' and enter a clear name like 'KryptoFunding Demo'.",
        "Permissions: Select 'Read-Write'.",
        "Contract/Derivatives: Check ONLY 'Orders' and 'Positions'. Do not enable any withdrawal or transfer features.",
      ],
    },
    {
      title: "Copy Keys",
      description:
        "Securely save your generated API Key and Secret. These act as your public identifier and private password.",
      details: [
        "Click 'Submit' and complete the required security verification (Google Authenticator or Email OTP).",
        "Your API Key will be displayed. This is your public identifier.",
        "Your API Secret will be displayed. WARNING: This is shown only ONCE.",
        "Immediately copy both and temporarily store them in a secure location until connected.",
      ],
    },
    {
      title: "Connect & Start",
      description:
        "Link your demo account to our simulator and begin your risk-free practice environment.",
      details: [
        "Return to the Krypto Funding platform and log in to your account.",
        "Navigate to your Dashboard and locate the 'Connections' or 'Settings' panel.",
        "Paste your API Key and API Secret into their respective fields.",
        "Click 'Connect'. Your virtual balance will sync, and you are ready to trade.",
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-500 dark:selection:bg-[#a855f7] selection:text-white overflow-hidden relative transition-colors duration-300">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/5 dark:bg-[#a855f7]/5 blur-[150px] rounded-md pointer-events-none transition-all duration-1000 ease-in-out"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-400/5 dark:bg-[#fbbf24]/5 blur-[120px] rounded-md pointer-events-none transition-all duration-1000 ease-in-out"></div>
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32 relative z-10">
        <div className="mb-20 md:mb-32 flex flex-col md:flex-row justify-between items-end border-b border-gray-300 dark:border-[#3b353c] pb-8 transition-colors duration-300">
          <div>
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-400 dark:from-[#a855f7] dark:to-[#fbbf24] tracking-tighter uppercase mb-4 drop-shadow-sm transition-colors duration-300">
              Connect API
            </h1>
            <p className="text-gray-500 dark:text-[#82717b] text-xl md:text-2xl font-light transition-colors duration-300">
              Link your demo account. Train with real constraints.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-8 md:mt-0 h-auto rounded-md px-8 py-3 text-sm font-bold uppercase tracking-widest border-gray-300 hover:bg-gray-100 dark:border-[#3b353c] dark:text-[#82717b] dark:hover:bg-[#3b353c]/20 dark:hover:text-[#c1cfc1]"
          >
            <Link href="/faq">Back to FAQ</Link>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="flex flex-col border-l border-gray-300 dark:border-[#3b353c] transition-colors duration-300">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`text-left pl-8 py-6 relative transition-all duration-500 group border-b border-gray-200 dark:border-[#3b353c]/30 last:border-0 ${isActive ? "bg-gray-100 dark:bg-[#3b353c]/10" : "hover:bg-gray-50 dark:hover:bg-[#3b353c]/5"}`}
                  >
                    {isActive && (
                      <div className="absolute left-[-1px] top-0 w-[2px] h-full bg-gradient-to-b from-purple-500 to-amber-400 dark:from-[#a855f7] dark:to-[#fbbf24] z-10"></div>
                    )}
                    <span
                      className={`block text-xs font-black uppercase tracking-[0.2em] mb-2 transition-colors duration-300 ${isActive ? "text-purple-500 dark:text-[#a855f7]" : "text-gray-400 dark:text-[#82717b]"}`}
                    >
                      Step 0{idx + 1}
                    </span>
                    <span
                      className={`block text-2xl md:text-3xl font-black uppercase tracking-tighter transition-colors duration-300 ${isActive ? "text-gray-900 dark:text-[#c1cfc1]" : "text-gray-400 dark:text-[#3b353c] group-hover:text-gray-600 dark:group-hover:text-[#82717b]"}`}
                    >
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full lg:w-2/3 flex flex-col justify-center min-h-[500px]">
            <div
              className="animate-in fade-in slide-in-from-right-8 duration-700"
              key={activeStep}
            >
              <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-baseline gap-4 transition-colors duration-300">
                <span className="text-purple-500 dark:text-[#a855f7]">
                  0{activeStep + 1}.
                </span>{" "}
                {steps[activeStep].title}
              </h2>
              <div className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light mb-16 leading-relaxed max-w-3xl transition-colors duration-300">
                {steps[activeStep].description}
              </div>

              <div className="space-y-0 border-t border-gray-300 dark:border-[#3b353c] transition-colors duration-300">
                {steps[activeStep].details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="py-8 border-b border-gray-300 dark:border-[#3b353c] flex flex-col md:flex-row gap-6 md:gap-12 hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors px-4 -mx-4 rounded-md"
                  >
                    <div className="text-purple-500 dark:text-[#a855f7] font-black text-xl shrink-0 opacity-50">
                      0{idx + 1}
                    </div>
                    <div className="text-gray-800 dark:text-[#c1cfc1] text-lg leading-relaxed transition-colors duration-300">
                      {detail}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 flex flex-col sm:flex-row gap-6">
                {activeStep < steps.length - 1 ? (
                  <Button
                    onClick={() => setActiveStep((prev) => prev + 1)}
                    className="h-auto rounded-md bg-purple-500 px-10 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
                  >
                    Next Step →
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="h-auto rounded-md bg-amber-400 px-10 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
                  >
                    <Link href="/auth/signup">Go to Dashboard →</Link>
                  </Button>
                )}
                {activeStep > 0 && (
                  <Button
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    variant="outline"
                    className="h-auto rounded-md border-gray-300 px-8 py-5 text-sm font-bold uppercase tracking-[0.1em] text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:border-[#3b353c] dark:text-[#82717b] dark:hover:text-[#c1cfc1] dark:hover:bg-[#3b353c]/20"
                  >
                    Previous
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
