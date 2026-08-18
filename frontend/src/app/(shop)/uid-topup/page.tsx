
import { Zap, Info, ShieldCheck } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 relative z-10">
          <img
            src="/FF/2.jpg"
            alt="UID Topup (BD)"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-500/20 text-green-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Active
            </span>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
              <Zap size={12} fill="currentColor" /> Instant Delivery
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
            UID Topup (BD)
          </h1>
          <p className="text-purple-200 text-sm max-w-lg">
            Get your top-up instantly through our automated system. 100% safe, secure, and
            officially authorized by the game developers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Select Recharge */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                1
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Select Package</h2>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: "115 Diamonds", price: "79" },
                { name: "240 Diamonds", price: "158" },
                { name: "355 Diamonds", price: "237" },
                { name: "480 Diamonds", price: "316" },
              ].map((pkg, i) => (
                <button
                  key={i}
                  className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group focus:border-purple-600 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-600/20 outline-none"
                >
                  <span className="font-black text-sm text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-focus:text-purple-700 uppercase mb-2 text-center">
                    {pkg.name}
                  </span>
                  <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full text-center group-hover:border-purple-200 dark:group-hover:border-purple-800">
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-black">
                      BDT {pkg.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Account Info & Options */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                2
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Player Details</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  Player ID / UID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your Player ID"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                </div>
              </div>
              <button className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2">
                <ShieldCheck size={18} /> Verify ID Name
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                3
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                Payment & Checkout
              </h2>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">
                    Login Required
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-400">
                    Please login to your account to complete this purchase securely.
                  </span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider">
                Login to Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
