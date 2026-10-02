"use client";

import React, { useState } from "react";
import Navbar from "@/components/structural/Navbar";
import Footer from "@/components/structural/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Message sent! We'll get back to you shortly.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="bg-white dark:bg-[#090909] font-sans text-gray-900 dark:text-[#c1cfc1] min-h-screen flex flex-col selection:bg-purple-500 dark:selection:bg-[#a855f7] selection:text-white transition-colors duration-300">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row w-11/12 max-w-7xl mx-auto py-24 md:py-32 gap-16 lg:gap-24">
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="border-b border-gray-300 dark:border-[#3b353c] pb-8 mb-12">
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-[#c1cfc1] tracking-tighter uppercase mb-6">
              Get In
              <br />
              Touch
            </h1>
            <p className="text-gray-600 dark:text-[#82717b] text-xl md:text-2xl font-light">
              Have questions about our simulator? Encountered an issue? Our
              support team is available 24/7.
            </p>
          </div>
          <div className="space-y-0 border-t border-gray-300 dark:border-[#3b353c]">
            <div className="flex items-center gap-6 py-8 border-b border-gray-300 dark:border-[#3b353c]">
              <div className="text-purple-500 dark:text-[#a855f7] font-black text-xl shrink-0">
                EMAIL
              </div>
              <div className="text-lg md:text-2xl text-gray-900 dark:text-white font-black tracking-tighter uppercase">
                support.kryptofunding@tajinder.in
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="p-8 md:p-12 border border-gray-300 dark:border-[#3b353c] bg-gray-50 dark:bg-transparent rounded-md">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter uppercase">
              Send a Message
            </h2>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
                  Name
                </Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-purple-500 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#a855f7]"
                  placeholder="JOHN DOE"
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter text-gray-900 dark:text-white focus-visible:border-purple-500 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#a855f7]"
                  placeholder="Email"
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
                  Message
                </Label>
                <Textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter uppercase text-gray-900 dark:text-white focus-visible:border-purple-500 focus-visible:ring-0 placeholder:text-gray-400 dark:border-[#3b353c] dark:placeholder:text-[#3b353c] dark:focus-visible:border-[#a855f7] resize-none"
                  placeholder="HOW CAN WE HELP?"
                />
              </div>
              <Button
                type="submit"
                className="h-auto w-full rounded-md bg-amber-400 px-12 py-5 text-sm font-black uppercase tracking-[0.1em] text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1] mt-4"
              >
                Send Message →
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
