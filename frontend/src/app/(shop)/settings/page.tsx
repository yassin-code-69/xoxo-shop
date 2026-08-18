import { User, Bell, Shield, Wallet, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-h-[70vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          Account Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Manage your profile, security, and preferences
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
          <div className="flex flex-col p-2">
            <button className="flex items-center gap-3 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold rounded-xl text-sm text-left">
              <User size={18} /> Profile Information
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-xl text-sm text-left transition-colors">
              <Shield size={18} /> Security
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-xl text-sm text-left transition-colors">
              <Wallet size={18} /> Payment Methods
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-xl text-sm text-left transition-colors">
              <Bell size={18} /> Notifications
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              Profile Information
            </h2>

            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-2xl font-black border-2 border-primary-200 dark:border-primary-800">
                JD
              </div>
              <div>
                <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-lg text-sm transition-colors mb-2">
                  Change Avatar
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, GIF or PNG. Max size of 800K
                </p>
              </div>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Doe"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="john.doe@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue="+880 1234 567890"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </form>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center gap-2">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
