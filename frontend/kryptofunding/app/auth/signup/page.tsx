"use client";
import React, { useState } from 'react';
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import Link from 'next/link';
import axios from 'axios';
import { Backend_Url } from '@/Utils/constants';

export default function SignUp() {
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [errors, setErrors] = useState<{ firstname?: string; lastname?: string; email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { firstname?: string; lastname?: string; email?: string; password?: string } = {};
    if (!formData.firstname.trim()) newErrors.firstname = "First name is required.";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required.";
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) newErrors.email = "Please enter a valid email address.";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (validate()) {

      console.log("Here")
      const result = await axios.post(Backend_Url + '/user/auth/signup', {
        user: formData
      })
      console.log(result)
    }
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-amber-500 dark:selection:bg-[#e7c965] selection:text-white dark:selection:text-[#090909] transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 my-12">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row-reverse border border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#050304]">

          <div className="hidden lg:flex flex-col justify-center p-16 w-1/2 border-l border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent relative">
            <h2 className="text-7xl font-black text-gray-900 dark:text-[#c1cfc1] mb-6 tracking-tighter uppercase relative z-10 text-right">
              Begin Your<br />Training
            </h2>
            <p className="text-gray-600 dark:text-[#82717b] text-xl font-light relative z-10 border-r-4 border-purple-600 dark:border-[#8254ee] pr-6 text-right leading-relaxed">
              Create an account to access our risk-free simulator platform and hone your trading edge.
            </p>
          </div>

          <div className="w-full lg:w-1/2 p-8 md:p-16 lg:p-24 bg-white dark:bg-[#090909] relative z-10">
            <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter uppercase">Create Account</h3>
            <p className="text-gray-600 dark:text-[#82717b] mb-10 text-sm uppercase tracking-widest font-bold">Join the premier trading simulator today.</p>

            <form className="space-y-10" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2 flex-1">
                  <label className="block text-xs font-black text-amber-500 dark:text-[#e7c965]  tracking-widest mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter "
                    placeholder="JOHN"
                  />
                  {errors.firstname && <p className="text-red-500 text-xs mt-2 font-bold">{errors.firstname}</p>}
                </div>
                <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2 flex-1">
                  <label className="block text-xs font-black text-amber-500 dark:text-[#e7c965]  tracking-widest mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter "
                    placeholder="DOE"
                  />
                  {errors.lastname && <p className="text-red-500 text-xs mt-2 font-bold">{errors.lastname}</p>}
                </div>
              </div>

              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-amber-500 dark:text-[#e7c965] uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter "
                  placeholder="Email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-2 font-bold">{errors.email}</p>}
              </div>

              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-amber-500 dark:text-[#e7c965] uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter "
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-2 font-bold">{errors.password}</p>}
              </div>

              <button type="submit" className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/50 dark:ring-[#e7c965]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-amber-500 dark:hover:ring-[#e7c965] transition-all duration-500 inline-flex items-center justify-center w-full mt-4">
                <div className="absolute inset-0 w-0 bg-amber-500 dark:bg-gradient-to-r dark:from-[#e7c965] dark:to-[#b3a473] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                <span className="relative font-black tracking-[0.1em] uppercase flex items-center gap-4">
                  <span>Create Account</span> <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                </span>
              </button>
            </form>

            <p className="mt-12 text-center text-sm font-bold tracking-widest uppercase text-gray-600 dark:text-[#82717b]">
              Already have an account? <Link href="/auth/signin" className="text-purple-600 dark:text-[#8254ee] hover:text-gray-900 dark:hover:text-white transition-colors border-b border-purple-600/30 dark:border-[#8254ee]/30 hover:border-gray-900 dark:hover:border-white pb-1 ml-2">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
