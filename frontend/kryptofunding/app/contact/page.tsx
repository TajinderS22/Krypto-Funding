import React from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";

export default function ContactPage() {
  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row w-11/12 max-w-7xl mx-auto py-24 md:py-32 gap-16 lg:gap-24">
        
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="border-b border-gray-300 dark:border-[#3b353c] pb-8 mb-12">
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-[#c1cfc1] tracking-tighter uppercase mb-6">
              Get In<br/>Touch
            </h1>
            <p className="text-gray-600 dark:text-[#82717b] text-xl md:text-2xl font-light">
              Have questions about our simulator? Encountered an issue? Our support team is available 24/7.
            </p>
          </div>
          
          <div className="space-y-0 border-t border-gray-300 dark:border-[#3b353c]">
            <div className="flex items-center gap-6 py-8 border-b border-gray-300 dark:border-[#3b353c]">
              <div className="text-purple-600 dark:text-[#8254ee] font-black text-xl shrink-0">EMAIL</div>
              <div className="text-lg md:text-2xl text-gray-900 dark:text-white font-black tracking-tighter uppercase">
                support.kryptofunding@tajinder.in
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="p-8 md:p-12 border border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase">Send a Message</h2>
            <form className="space-y-8">
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Name</label>
                <input type="text" className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter" placeholder="JOHN DOE" />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Email</label>
                <input type="email" className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter " placeholder="Email" />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Message</label>
                <textarea rows={4} className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter uppercase resize-none" placeholder="HOW CAN WE HELP?"></textarea>
              </div>
              <button type="submit" className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/50 dark:ring-[#e7c965]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-amber-500 dark:hover:ring-[#e7c965] transition-all duration-500 inline-flex items-center justify-center w-full mt-4">
                <div className="absolute inset-0 w-0 bg-amber-500 dark:bg-gradient-to-r dark:from-[#e7c965] dark:to-[#b3a473] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                <span className="relative font-black tracking-[0.1em] uppercase flex items-center gap-4">
                  <span>Send Message</span> <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                </span>
              </button>
            </form>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
