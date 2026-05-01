import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function MetricsAnalyticsPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-11/12 max-w-7xl mx-auto py-24 md:py-32">
        <div className="border-b border-gray-300 dark:border-[#3b353c] pb-12 mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase mb-6">
            Metrics &<br/>Analytics
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light max-w-3xl leading-relaxed">
            Trading isn't about guessing; it's about data. Dissect your psychology with institutional-grade tools.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="w-full lg:w-1/2">
            <div className="space-y-0 border-t border-gray-300 dark:border-[#3b353c]">
              <div className="py-10 border-b border-gray-300 dark:border-[#3b353c]">
                <h3 className="text-amber-500 dark:text-[#e7c965] font-black text-2xl md:text-3xl uppercase tracking-tighter mb-4">01. Win/Loss Distribution</h3>
                <p className="text-gray-600 dark:text-[#82717b] text-lg font-light leading-relaxed">Visualize your accuracy across different assets and sessions to find your true edge.</p>
              </div>
              <div className="py-10 border-b border-gray-300 dark:border-[#3b353c]">
                <h3 className="text-amber-500 dark:text-[#e7c965] font-black text-2xl md:text-3xl uppercase tracking-tighter mb-4">02. Drawdown mapping</h3>
                <p className="text-gray-600 dark:text-[#82717b] text-lg font-light leading-relaxed">Track how deep into the red you go before hitting take profits, ensuring your risk parameters are solid.</p>
              </div>
              <div className="py-10 border-b border-gray-300 dark:border-[#3b353c]">
                <h3 className="text-amber-500 dark:text-[#e7c965] font-black text-2xl md:text-3xl uppercase tracking-tighter mb-4">03. Journaling integration</h3>
                <p className="text-gray-600 dark:text-[#82717b] text-lg font-light leading-relaxed">Every simulated trade is recorded and analyzed to pinpoint exact emotional triggers and mistakes.</p>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2">
            <div className="border border-gray-300 dark:border-[#3b353c] p-8 md:p-12 bg-gray-50 dark:bg-transparent h-full flex flex-col justify-between">
              <div className="flex gap-4 mb-16">
                <div className="flex-1 border-b-4 border-amber-500 dark:border-[#e7c965] pb-4">
                  <div className="text-gray-500 dark:text-[#82717b] text-xs font-black uppercase tracking-widest mb-2">Win Rate</div>
                  <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">68.4%</div>
                </div>
                <div className="flex-1 border-b-4 border-purple-600 dark:border-[#8254ee] pb-4">
                  <div className="text-gray-500 dark:text-[#82717b] text-xs font-black uppercase tracking-widest mb-2">Profit Factor</div>
                  <div className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">2.14</div>
                </div>
              </div>
              
              <div className="h-64 w-full border-b border-gray-300 dark:border-[#3b353c] flex items-end px-2 gap-2 md:gap-4 pb-0">
                {[40, 70, 45, 90, 60, 30, 80, 100, 50, 75, 85].map((height, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-purple-600 to-amber-500 dark:from-[#8254ee] dark:to-[#e7c965] opacity-80 transition-all hover:opacity-100" style={{ height: `${height}%` }}></div>
                ))}
              </div>
              <div className="mt-4 text-xs font-black text-gray-400 dark:text-[#3b353c] uppercase tracking-widest text-right">Performance Over Time</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
