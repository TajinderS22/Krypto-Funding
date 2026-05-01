import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function TradingRulesPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase mb-6">
            Trading Rules
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light max-w-3xl leading-relaxed">
            Our simulation platform strictly enforces standard risk management protocols to prepare you for actual market conditions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-gray-300 dark:border-[#3b353c]">
          
          <div className="p-10 md:p-16 border-b md:border-b-0 md:border-r border-gray-300 dark:border-[#3b353c] hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors group">
            <div className="text-amber-500 dark:text-[#e7c965] text-xl font-black mb-4 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">Rule 01</div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Daily Drawdown</h3>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              Your daily drawdown is calculated based on the initial balance of your account at 00:00 UTC. If your floating equity drops below this daily threshold (4% for 1-Step, 5% for 2-Step), your simulation is terminated.
            </p>
          </div>
          
          <div className="p-10 md:p-16 border-b border-gray-300 dark:border-[#3b353c] hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors group">
            <div className="text-amber-500 dark:text-[#e7c965] text-xl font-black mb-4 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">Rule 02</div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Overall Drawdown</h3>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              Your overall drawdown is static, calculated from the initial starting balance of your account. You must not drop below this absolute limit at any point, including floating PnL.
            </p>
          </div>

          <div className="p-10 md:p-16 border-b md:border-b-0 md:border-r border-gray-300 dark:border-[#3b353c] hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors group">
            <div className="text-purple-600 dark:text-[#8254ee] text-xl font-black mb-4 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">Rule 03</div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">News Trading</h3>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              Trading during high-impact macroeconomic news releases is permitted in our simulation environment to help you practice real-world volatility, though severe slippage may be simulated.
            </p>
          </div>

          <div className="p-10 md:p-16 hover:bg-gray-50 dark:hover:bg-[#3b353c]/5 transition-colors group">
            <div className="text-purple-600 dark:text-[#8254ee] text-xl font-black mb-4 tracking-widest uppercase opacity-50 group-hover:opacity-100 transition-opacity">Rule 04</div>
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tighter">Weekend Holding</h3>
            <p className="text-gray-600 dark:text-[#82717b] text-lg leading-relaxed font-light">
              You are free to hold trades over the weekend. However, be aware that crypto markets remain open, and forex/indices will simulate weekend gap risks.
            </p>
          </div>
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
