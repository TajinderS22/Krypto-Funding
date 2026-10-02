"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  LogOut,
  BarChart3,
  Activity,
  DollarSign,
  Calendar,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import AuthPromptModal from "@/components/app/AuthPromptModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  );
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
    setFormData({
      title: "",
      description: "",
      price: "",
      value: "0",
      steps: "1",
      drawdown: "10",
      target: "10",
    });
  };

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
    }
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
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create challenge",
      );
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
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update challenge",
      );
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
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete challenge",
      );
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
    } catch {}
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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white font-sans selection:bg-purple-500/30 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-amber-400 rounded-full animate-spin h-16 w-16"></div>
          <Activity className="h-6 w-6 text-amber-400 animate-pulse" />
        </div>
      </div>
    );
  }

  const formField = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col">
      <Label className="text-xs font-black text-purple-500 dark:text-[#a855f7] uppercase tracking-widest mb-2">
        {label}
      </Label>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#050304] text-gray-900 dark:text-white pb-24 font-sans selection:bg-purple-500/30">
      <div className="relative overflow-hidden bg-white dark:bg-[#090909] border-b border-gray-300 dark:border-[#3b353c] pt-12 pb-16 px-6 lg:px-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-400/10 dark:bg-amber-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-2">
            <Badge className="bg-purple-500 text-white hover:bg-purple-500 dark:bg-[#a855f7] text-xs font-bold tracking-widest uppercase px-3 py-1">
              <Shield className="w-3 h-3" /> Admin Panel
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-gray-900 dark:text-white">
              Challenge{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-400 dark:from-[#a855f7] dark:to-[#fbbf24]">
                Manager
              </span>
            </h1>
            <p className="text-gray-500 dark:text-[#82717b] text-lg max-w-xl font-light">
              Create, edit, and manage trading challenges for the platform.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-400">
                Total Challenges
              </span>
              <span className="text-3xl font-black">{challenges.length}</span>
            </div>
            <div className="w-px bg-gray-300 dark:bg-[#3b353c] h-12 self-center"></div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="h-auto rounded-md bg-purple-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
            >
              <Plus /> Create
            </Button>
            <button
              onClick={handleLogout}
              className="h-12 w-12 rounded-md bg-gray-100 dark:bg-[#3b353c]/30 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors duration-300"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-8 relative z-20">
        {challenges.length === 0 ? (
          <div className="w-full bg-white dark:bg-[#090909] border border-dashed border-gray-300 dark:border-[#3b353c] rounded-md p-12 text-center flex flex-col items-center justify-center mt-12">
            <div className="w-20 h-20 bg-gray-50 dark:bg-[#3b353c]/10 rounded-md flex items-center justify-center mb-6">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
              No Challenges Yet
            </h3>
            <p className="text-gray-500 dark:text-[#82717b] max-w-md mb-8">
              Create your first trading challenge to get started.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="h-auto rounded-md bg-purple-500 px-8 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
            >
              Create Challenge
            </Button>
          </div>
        ) : (
          <div className="py-12 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-500 dark:text-[#a855f7]" />{" "}
                All Challenges
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {challenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="group relative rounded-md border-gray-300 py-0 overflow-hidden shadow-sm hover:border-purple-500/50 hover:shadow-xl dark:border-[#3b353c] dark:hover:border-[#a855f7]/50"
                >
                  <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-amber-400/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                  <CardContent className="p-0">
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 lg:p-8">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-black tracking-tighter">
                            {challenge.title}
                          </h3>
                          <span className="text-xl font-black text-amber-400 dark:text-[#fbbf24]">
                            ${challenge.price}
                          </span>
                        </div>
                        {challenge.description && (
                          <p className="text-gray-500 dark:text-[#82717b] text-sm line-clamp-2 max-w-xl">
                            {challenge.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400 font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{" "}
                            {formatDate(challenge.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />{" "}
                            {challenge.steps ?? 1}-Step
                          </span>
                          <span className="flex items-center gap-1">
                            DD: {challenge.drawdown ?? "-"}%
                          </span>
                          <span className="flex items-center gap-1">
                            Tgt: {challenge.target ?? "-"}%
                          </span>
                          <span className="flex items-center gap-1">
                            ID: {challenge.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => openEditModal(challenge)}
                          variant="outline"
                          className="h-auto rounded-md border-gray-300 px-5 py-3 text-xs font-black uppercase tracking-widest hover:border-amber-400 hover:bg-amber-50 dark:border-[#3b353c] dark:hover:border-[#fbbf24] dark:hover:bg-[#fbbf24]/10"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </Button>
                        {deleteConfirm === challenge.id ? (
                          <div className="flex gap-2 items-center">
                            <Button
                              onClick={() => handleDelete(challenge.id)}
                              className="h-auto rounded-md bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700"
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirm(null)}
                              variant="ghost"
                              size="icon"
                              className="h-auto rounded-md px-3 py-3"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setDeleteConfirm(challenge.id)}
                            variant="outline"
                            className="h-auto rounded-md border-red-300 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-600 hover:border-red-500 hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent
          className="border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#090909] p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row justify-between items-center border-b border-gray-300 dark:border-[#3b353c] px-8 py-5">
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                Create Challenge
              </DialogTitle>
              <DialogDescription className="text-xs font-bold tracking-widest text-gray-500 dark:text-[#82717b] mt-1">
                Set up a new trading evaluation
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-md">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleCreate} className="px-8 py-6 space-y-8">
            {formField(
              "Title",
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
                placeholder="Challenge Name"
              />,
            )}
            {formField(
              "Description",
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base font-medium focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7] resize-none"
                placeholder="Describe the challenge rules and objectives..."
              />,
            )}
            {formField(
              "Price ($)",
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
                placeholder="99.99"
              />,
            )}
            {formField(
              "Value ($)",
              <Input
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
                placeholder="100000"
              />,
            )}
            {formField(
              "Steps",
              <select
                value={formData.steps}
                onChange={(e) =>
                  setFormData({ ...formData, steps: e.target.value })
                }
                className="w-full bg-transparent text-xl text-gray-900 dark:text-white font-black tracking-tighter border-0 border-b border-gray-300 py-2 focus:outline-none focus-visible:border-purple-500 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              >
                <option value="1">1-Step</option>
                <option value="2">2-Step</option>
              </select>,
            )}
            {formField(
              "Drawdown (%)",
              <select
                value={formData.drawdown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    drawdown: e.target.value,
                    target: e.target.value,
                  })
                }
                className="w-full bg-transparent text-xl text-gray-900 dark:text-white font-black tracking-tighter border-0 border-b border-gray-300 py-2 focus:outline-none focus-visible:border-purple-500 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              >
                <option value="6">6%</option>
                <option value="8">8%</option>
                <option value="10">10%</option>
                <option value="12">12%</option>
              </select>,
            )}
            {formField(
              "Target (%)",
              <Input
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
                placeholder="10"
              />,
            )}
            <Button
              type="submit"
              className="h-auto w-full rounded-md bg-purple-500 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-purple-600 dark:bg-[#a855f7] dark:hover:bg-[#c084fc]"
            >
              <DollarSign className="w-5 h-5" /> Create Challenge
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setEditingChallenge(null);
            resetForm();
          }
        }}
      >
        <DialogContent
          className="border-gray-300 dark:border-[#3b353c] bg-white dark:bg-[#090909] p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogHeader className="flex flex-row justify-between items-center border-b border-gray-300 dark:border-[#3b353c] px-8 py-5">
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                Edit Challenge
              </DialogTitle>
              <DialogDescription className="text-xs font-bold tracking-widest text-gray-500 dark:text-[#82717b] mt-1">
                Update evaluation parameters
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-md">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleEdit} className="px-8 py-6 space-y-8">
            {formField(
              "Title",
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              />,
            )}
            {formField(
              "Description",
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-base font-medium focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7] resize-none"
              />,
            )}
            {formField(
              "Price ($)",
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              />,
            )}
            {formField(
              "Value ($)",
              <Input
                type="number"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              />,
            )}
            {formField(
              "Steps",
              <select
                value={formData.steps}
                onChange={(e) =>
                  setFormData({ ...formData, steps: e.target.value })
                }
                className="w-full bg-transparent text-xl text-gray-900 dark:text-white font-black tracking-tighter border-0 border-b border-gray-300 py-2 focus:outline-none focus-visible:border-purple-500 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              >
                <option value="1">1-Step</option>
                <option value="2">2-Step</option>
              </select>,
            )}
            {formField(
              "Drawdown (%)",
              <select
                value={formData.drawdown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    drawdown: e.target.value,
                    target: e.target.value,
                  })
                }
                className="w-full bg-transparent text-xl text-gray-900 dark:text-white font-black tracking-tighter border-0 border-b border-gray-300 py-2 focus:outline-none focus-visible:border-purple-500 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              >
                <option value="6">6%</option>
                <option value="8">8%</option>
                <option value="10">10%</option>
                <option value="12">12%</option>
              </select>,
            )}
            {formField(
              "Target (%)",
              <Input
                type="number"
                value={formData.target}
                onChange={(e) =>
                  setFormData({ ...formData, target: e.target.value })
                }
                className="h-auto rounded-md border-0 border-b border-gray-300 bg-transparent px-0 py-2 text-xl font-black tracking-tighter focus-visible:border-purple-500 focus-visible:ring-0 dark:border-[#3b353c] dark:focus-visible:border-[#a855f7]"
              />,
            )}
            <Button
              type="submit"
              className="h-auto w-full rounded-md bg-amber-400 py-5 text-sm font-black uppercase tracking-widest text-white hover:bg-gray-900 dark:bg-[#fbbf24] dark:text-[#090909] dark:hover:bg-[#c1cfc1]"
            >
              <Pencil className="w-5 h-5" /> Update Challenge
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
