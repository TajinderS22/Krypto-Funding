import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function AboutPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-500 dark:selection:bg-[#e7c965] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase mb-6">
            About Krypto
          </h1>
          <p className="text-xl md:text-3xl text-gray-600 dark:text-[#82717b] font-light max-w-4xl leading-relaxed">
            We built the exact tool we wished we had when we were starting out: a risk-free, highly analytical simulation environment.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase">Our Mission</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl leading-relaxed mb-12">
              The prop firm industry is full of hidden rules, predatory time limits, and unrealistic expectations. 
              We founded Krypto Funding to provide an entirely different approach: a dedicated simulator platform 
              built solely to train, test, and temper your trading psychology. 
            </p>
          </div>
          <div className="w-full lg:w-1/2">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase">Built by Traders</h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl leading-relaxed mb-12">
              We are a team of veteran algorithmic and discretionary traders. We know that hitting consistent profitability 
              isn't about finding a magic indicator; it's about discipline.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-gray-300 dark:border-[#3b353c] mt-16 pt-16">
          <div className="border-b md:border-b-0 md:border-r border-gray-300 dark:border-[#3b353c] pb-8 md:pb-0 md:pr-12">
            <div className="text-6xl font-black text-amber-500 dark:text-[#e7c965] mb-4 tracking-tighter">10k+</div>
            <div className="text-gray-600 dark:text-[#82717b] text-sm uppercase tracking-widest font-black">Simulations Run</div>
          </div>
          <div className="py-8 md:py-0 md:px-12 border-b md:border-b-0 md:border-r border-gray-300 dark:border-[#3b353c]">
            <div className="text-6xl font-black text-purple-600 dark:text-[#8254ee] mb-4 tracking-tighter">100+</div>
            <div className="text-gray-600 dark:text-[#82717b] text-sm uppercase tracking-widest font-black">Assets Available</div>
          </div>
          <div className="pt-8 md:pt-0 md:pl-12">
            <div className="text-6xl font-black text-gray-900 dark:text-[#c1cfc1] mb-4 tracking-tighter">24/7</div>
            <div className="text-gray-600 dark:text-[#82717b] text-sm uppercase tracking-widest font-black">Server Uptime</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
