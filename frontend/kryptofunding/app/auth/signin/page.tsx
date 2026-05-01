"use client";
import React, { useState } from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from 'next/link';

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    let newErrors: { email?: string; password?: string } = {};
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log("Sign in successful", formData);
    }
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-600 dark:selection:bg-[#8254ee] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row border border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#050304]">
          
          <div className="hidden lg:flex flex-col justify-center p-16 w-1/2 border-r border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent relative">
            <h2 className="text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-6 tracking-tighter uppercase relative z-10">
              Welcome<br/>Back
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl font-light relative z-10 border-l-4 border-amber-500 dark:border-[#e7c965] pl-6 leading-relaxed">
              Access your dashboard to review your simulator metrics and continue your journey.
            </p>
          </div>
          
          <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10">
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">Sign In</h3>
            <p className="text-gray-600 dark:text-[#82717b] mb-12 text-sm uppercase tracking-widest font-bold">Log in to your account.</p>
            
            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter " 
                  placeholder="Email" 
                />
                {errors.email && <p className="text-red-500 text-xs mt-2 font-bold">{errors.email}</p>}
              </div>
              
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest">Password</label>
                  <a href="#" className="text-xs font-bold text-amber-500 dark:text-[#e7c965] hover:text-gray-900 dark:hover:text-white transition-colors">Forgot Password?</a>
                </div>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter uppercase" 
                  placeholder="••••••••" 
                />
                {errors.password && <p className="text-red-500 text-xs mt-2 font-bold">{errors.password}</p>}
              </div>
              
              <button type="submit" className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-purple-600 dark:hover:ring-[#8254ee] transition-all duration-500 inline-flex items-center justify-center w-full mt-4">
                <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-gradient-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                <span className="relative font-black tracking-[0.1em] uppercase flex items-center gap-4">
                  <span>Sign In</span> <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                </span>
              </button>
            </form>
            
            <p className="mt-12 text-center text-sm font-bold tracking-widest uppercase text-gray-600 dark:text-[#82717b]">
              Don't have an account? <Link href="/auth/signup" className="text-amber-500 dark:text-[#e7c965] hover:text-gray-900 dark:hover:text-white transition-colors border-b border-amber-500/30 dark:border-[#e7c965]/30 hover:border-gray-900 dark:hover:border-white pb-1 ml-2">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
