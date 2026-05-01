"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50 pt-5">
      <nav className={`max-w-7xl flex items-center justify-between rounded-xl px-6 mx-auto bg-white/70 dark:bg-[#090909]/70 ring-1 ring-purple-600/30 dark:ring-[#8254ee]/30 hover:shadow-lg dark:hover:shadow-[#8254ee]/10 backdrop-blur-xl transition-all duration-500 ease-in-out ${isScrolled ? 'w-[95%] lg:w-7/12 py-2 ring-amber-500/40 dark:ring-[#e7c965]/40 shadow-lg shadow-amber-500/10 dark:shadow-[#e7c965]/10' : 'w-[90%] py-5'}`}>
        <div>
          <Link href="/">
            <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-purple-600 dark:from-[#e7c965] dark:to-[#8254ee] tracking-tighter uppercase cursor-pointer">
              Krypto
            </p>
          </Link>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/simulations" className="text-xs font-bold text-gray-600 dark:text-[#82717b] hover:text-amber-600 dark:hover:text-[#e7c965] transition-colors uppercase tracking-widest">Simulations</Link>
          <Link href="/metrics-analytics" className="text-xs font-bold text-gray-600 dark:text-[#82717b] hover:text-amber-600 dark:hover:text-[#e7c965] transition-colors uppercase tracking-widest">Metrics</Link>
          <Link href="/trading-rules" className="text-xs font-bold text-gray-600 dark:text-[#82717b] hover:text-amber-600 dark:hover:text-[#e7c965] transition-colors uppercase tracking-widest">Rules</Link>
          <Link href="/about" className="text-xs font-bold text-gray-600 dark:text-[#82717b] hover:text-amber-600 dark:hover:text-[#e7c965] transition-colors uppercase tracking-widest">About</Link>
        </div>

        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-[#3b353c]/50 transition-colors text-gray-600 dark:text-[#c1cfc1]"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <Link href="/auth/signin" className="text-xs font-bold text-gray-800 dark:text-[#c1cfc1] hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest">
            Sign In
          </Link>
          <Link href="/auth/signup" className="px-6 py-2 bg-purple-600 dark:bg-[#8254ee] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-amber-500 dark:hover:bg-[#e7c965] hover:text-black dark:hover:text-[#090909] transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] dark:shadow-[0_0_15px_rgba(130,84,238,0.3)]">
            Sign Up
          </Link>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;