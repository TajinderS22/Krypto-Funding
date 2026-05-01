import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-500 dark:selection:bg-[#e7c965] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-5xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-[#c1cfc1] tracking-tighter uppercase mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light max-w-3xl leading-relaxed">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="space-y-16">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">01. Data Collection</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We collect information you provide directly to us when you create an account, participate in our simulations, request customer support, or otherwise communicate with us. This includes your name, email address, and performance metrics within our platform.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">02. Use of Information</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We use the information we collect to operate and improve the Platform, monitor and analyze trends regarding usage, and personalize the services. We do not sell your personal data to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">03. Data Security</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We implement commercially reasonable technical and organizational measures to protect your personal data against unauthorized access. However, no internet transmission is completely secure.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter uppercase">04. Cookies</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              We use cookies and similar tracking technologies to track the activity on our Platform and hold certain information, ensuring a seamless user experience during your trading simulations.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
