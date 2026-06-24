import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import UniquePlanSelector from "@/components/home/UniquePlanSelector";

export default function SimulationsPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-500 dark:selection:bg-[#e7c965] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 w-full mx-auto flex flex-col">
        <div className="w-11/12 max-w-5xl mx-auto text-center pt-32 pb-8 transition-colors duration-300">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase mb-6 drop-shadow-sm">
            Simulations
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-[#82717b] font-light leading-relaxed mx-auto max-w-3xl">
            Choose your proving ground. Train with strict, industry-standard constraints and 
            <span className="font-bold text-gray-900 dark:text-white"> fully customizable drawdowns</span> to match your trading style.
          </p>
        </div>

        <div className="w-full transition-colors duration-300 mt-0">
          <UniquePlanSelector />
        </div>

      </div>
      <Footer />
    </div>
  );
}
