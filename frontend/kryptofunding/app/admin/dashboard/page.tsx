"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, LogOut, BarChart3,
  Activity, DollarSign, Calendar, Shield, X,
  DollarSignIcon
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import AuthPromptModal from "@/components/app/AuthPromptModal";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  creator_id: number;
  steps: number | null;
  drawdown: number | null;
  target: number | null;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    value: "",
    steps: "1",
    drawdown: "10",
    target: "10",
  });

  const fetchChallenges = async () => {
    try {
      const res = await api.get("/admin/challenges");
      setChallenges(res.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setShowAuthModal(true);
        return;
      }
      console.error("Failed to fetch challenges", error);
      toast.error("Failed to load challenges");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/admin/challenges");
        if (!mounted) return;
        setChallenges(res.data);
      } catch (error: any) {
        if (error?.response?.status === 401) {
          if (mounted) setShowAuthModal(true);
          return;
        }
        console.error("Failed to fetch challenges", error);
        toast.error("Failed to load challenges");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setFormData({ title: "", description: "", price: "", value: "0", steps: "1", drawdown: "10", target: "10" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error("Title and price are required");
      return;
    }
    try {
      await api.post("/admin/create/challenge", formData);
      toast.success("Challenge created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchChallenges();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setShowAuthModal(true);
        return;
      }
      toast.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) || "Failed to create challenge");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;
    try {
      await api.put(`/admin/challenge/${editingChallenge.id}`, formData);
      toast.success("Challenge updated!");
      setShowEditModal(false);
      setEditingChallenge(null);
      resetForm();
      fetchChallenges();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setShowAuthModal(true);
        return;
      }
      toast.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) || "Failed to update challenge");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/challenge/${id}`);
      toast.success("Challenge deleted");
      setDeleteConfirm(null);
      fetchChallenges();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setShowAuthModal(true);
        return;
      }
      toast.error(((err as { response?: { data?: { message?: string } } })?.response?.data?.message) || "Failed to delete challenge");
    }
  };

  const openEditModal = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      price: challenge.price || "",
      value: formData.value,
      steps: String(challenge.steps ?? 1),
      drawdown: String(challenge.drawdown ?? 10),
      target: String(challenge.target ?? 10),
    });
    setShowEditModal(true);
  };

  const handleLogout = async () => {
    try {
      await api.post("/admin/auth/logout");
    } catch {
    }
    router.push("/admin/auth/signin");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white font-sans selection:bg-purple-600/30 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-500 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-600/30">
      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/5 pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold tracking-widest uppercase mb-4">
              <Shield className="w-3 h-3" /> Admin Panel
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">
              Challenge <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-amber-500 dark:from-[#8254ee] dark:to-[#e7c965]">Manager</span>
            </h1>
            <p className="text-gray-500 dark:text-[#82717b] text-lg max-w-xl font-light">
              Create, edit, and manage trading challenges for the platform.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Total Challenges</span>
              <span className="text-3xl font-black">{challenges.length}</span>
            </div>
            <div className="w-px bg-gray-200 dark:bg-white/10 h-12 self-center"></div>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="group relative px-6 py-3 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black transition-all duration-500 flex items-center gap-2"
            >
              <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-gradient-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10 font-bold uppercase tracking-widest text-sm">Create</span>
            </button>
            <button
              onClick={handleLogout}
              className="h-12 w-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors duration-300"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-8 relative z-20">
        {challenges.length === 0 ? (
          <div className="w-full bg-white dark:bg-[#0c0c0c] border border-dashed border-gray-300 dark:border-white/10 rounded-lg p-12 text-center flex flex-col items-center justify-center mt-12">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-black mb-2">No Challenges Yet</h3>
            <p className="text-gray-500 max-w-md mb-8">Create your first trading challenge to get started.</p>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="px-8 py-3 bg-purple-600 text-white font-bold uppercase tracking-widest rounded-full hover:bg-purple-700 transition-colors"
            >
              Create Challenge
            </button>
          </div>
        ) : (
          <div className="py-12 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" /> All Challenges
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="group relative bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-6 lg:p-8 hover:border-purple-500/50 dark:hover:border-[#8254ee]/50 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_40px_rgba(130,84,238,0.1)]"
                >
                  <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-black tracking-tight">{challenge.title}</h3>
                        <span className="text-xl font-bold text-amber-500">${challenge.price}</span>
                      </div>
                      {challenge.description && (
                        <p className="text-gray-500 dark:text-[#82717b] text-sm line-clamp-2 max-w-xl">{challenge.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(challenge.created_at)}</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {challenge.steps ?? 1}-Step</span>
                        <span className="flex items-center gap-1">DD: {challenge.drawdown ?? '-'}%</span>
                        <span className="flex items-center gap-1">Tgt: {challenge.target ?? '-'}%</span>
                        <span className="flex items-center gap-1">ID: {challenge.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEditModal(challenge)}
                        className="group/edit relative px-6 py-3 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/30 dark:ring-[#e7c965]/30 text-gray-900 dark:text-white hover:text-black hover:ring-amber-500 transition-all duration-500 flex items-center gap-2"
                      >
                        <div className="absolute inset-0 w-0 bg-amber-500 transition-all duration-300 ease-in-out group-hover/edit:w-full rounded-r-full"></div>
                        <Pencil className="w-4 h-4 relative z-10" />
                        <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Edit</span>
                      </button>
                      {deleteConfirm === challenge.id ? (
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => handleDelete(challenge.id)}
                            className="px-6 py-3 bg-red-600 text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="h-12 w-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(challenge.id)}
                          className="group/del relative px-6 py-3 bg-transparent overflow-hidden rounded-full ring-2 ring-red-500/30 text-gray-900 dark:text-white hover:text-white hover:ring-red-500 transition-all duration-500 flex items-center gap-2"
                        >
                          <div className="absolute inset-0 w-0 bg-red-600 transition-all duration-300 ease-in-out group-hover/del:w-full rounded-r-full"></div>
                          <Trash2 className="w-4 h-4 relative z-10" />
                          <span className="relative z-10 font-bold uppercase tracking-widest text-xs">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black tracking-tighter uppercase">Create Challenge</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="h-12 w-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-10">
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                  placeholder="Challenge Name"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent text-base text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-medium resize-none"
                  placeholder="Describe the challenge rules and objectives..."
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                  placeholder="99.99"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Value ($)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                  placeholder="100 K"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Steps</label>
                <select
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none font-black tracking-tighter"
                >
                  <option value="1">1-Step</option>
                  <option value="2">2-Step</option>
                </select>
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Drawdown (%)</label>
                <select
                  value={formData.drawdown}
                  onChange={(e) => setFormData({ ...formData, drawdown: e.target.value, target: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none font-black tracking-tighter"
                >
                  <option value="6">6%</option>
                  <option value="8">8%</option>
                  <option value="10">10%</option>
                  <option value="12">12%</option>
                </select>
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Target (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                  placeholder="10"
                />
              </div>
              <button
                type="submit"
                className="group relative w-full px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-purple-600/50 dark:ring-[#8254ee]/50 text-gray-900 dark:text-white hover:text-white dark:hover:text-black hover:ring-purple-600 dark:hover:ring-[#8254ee] transition-all duration-500 inline-flex items-center justify-center gap-4 mt-4"
              >
                <div className="absolute inset-0 w-0 bg-purple-600 dark:bg-gradient-to-r dark:from-[#8254ee] dark:to-[#966bfe] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                <DollarSignIcon className="w-5 h-5 relative z-10" />
                <span className="relative z-10 font-black tracking-widest uppercase">Create Challenge</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/5 rounded-lg p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black tracking-tighter uppercase">Edit Challenge</h3>
              <button onClick={() => { setShowEditModal(false); setEditingChallenge(null); resetForm(); }} className="h-12 w-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-10">
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent text-base text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-medium resize-none"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                />
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Steps</label>
                <select
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none font-black tracking-tighter"
                >
                  <option value="1">1-Step</option>
                  <option value="2">2-Step</option>
                </select>
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Drawdown (%)</label>
                <select
                  value={formData.drawdown}
                  onChange={(e) => setFormData({ ...formData, drawdown: e.target.value, target: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none font-black tracking-tighter"
                >
                  <option value="6">6%</option>
                  <option value="8">8%</option>
                  <option value="10">10%</option>
                  <option value="12">12%</option>
                </select>
              </div>
              <div className="flex flex-col border-b border-gray-300 dark:border-[#3b353c] pb-2">
                <label className="block text-xs font-black text-purple-600 dark:text-[#8254ee] uppercase tracking-widest mb-2">Target (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full bg-transparent text-xl text-gray-900 dark:text-white focus:outline-none placeholder-gray-400 dark:placeholder-[#3b353c] font-black tracking-tighter"
                />
              </div>
              <button
                type="submit"
                className="group relative w-full px-12 py-5 bg-transparent overflow-hidden rounded-full ring-2 ring-amber-500/50 dark:ring-[#e7c965]/50 text-gray-900 dark:text-white hover:text-black hover:ring-amber-500 dark:hover:ring-[#e7c965] transition-all duration-500 inline-flex items-center justify-center gap-4 mt-4"
              >
                <div className="absolute inset-0 w-0 bg-amber-500 dark:bg-gradient-to-r dark:from-[#e7c965] dark:to-[#b3a473] transition-all duration-300 ease-in-out group-hover:w-full rounded-r-full"></div>
                <Pencil className="w-5 h-5 relative z-10" />
                <span className="relative z-10 font-black tracking-widest uppercase">Update Challenge</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
