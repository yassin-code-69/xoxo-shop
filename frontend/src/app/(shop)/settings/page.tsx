"use client";

import { useState, useEffect } from "react";
import { User, Bell, Shield, Wallet, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { updateMyProfile } from "../../../lib/api/endpoints";

export default function SettingsPage() {
  const { profile, refreshProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      await updateMyProfile({ full_name: fullName.trim(), phone: phone.trim() });
      await refreshProfile();
      setNotification({ type: "success", text: "Your profile has been updated successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
        <User className="mx-auto text-purple-600 mb-3" size={40} />
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Login Required</h2>
        <p className="text-xs text-slate-500 mb-6">
          Please log in to manage your account and view profile details.
        </p>
        <a
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs inline-block"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-[70vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Account Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Manage your personal profile and account credentials
        </p>
      </div>

      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
          <div className="flex flex-col p-2 space-y-1">
            <button className="flex items-center gap-3 px-4 py-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 font-bold rounded-2xl text-xs text-left">
              <User size={16} /> Profile Information
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              Profile Information
            </h2>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-xl font-black border border-purple-200 dark:border-purple-800">
                {fullName
                  ? fullName.charAt(0).toUpperCase()
                  : profile?.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                  {profile?.email}
                </h4>
                <span className="text-[11px] font-bold uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900">
                  Role: {profile?.roles?.join(", ") || "CUSTOMER"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
