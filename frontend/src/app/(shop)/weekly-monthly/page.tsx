import Link from "next/link";
import { Zap, Info } from "lucide-react";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md">
          <img src="/FF/3.jpg" alt="WEEKLY/MONTHLY" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[#0b132b] mb-2">WEEKLY/MONTHLY</h1>
          <div className="bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1 w-max border border-orange-100">
            <Zap size={14} fill="currentColor" /> ২ সেকেন্ডে টপআপ
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column - Select Recharge */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#6b46c1] text-white flex items-center justify-center font-bold text-sm">1</div>
              <h2 className="font-bold text-[#0b132b]">Select Recharge</h2>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'WEEKLY', price: '158' },{ name: 'MONTHLY', price: '790' },
              ].map((pkg, i) => (
                <button key={i} className="border border-slate-200 rounded-lg py-3 flex flex-col items-center hover:border-[#6b46c1] hover:shadow-md transition-all group focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1]">
                  <span className="font-bold text-xs text-[#1e3a8a] group-hover:text-[#6b46c1] group-focus:text-[#6b46c1] uppercase">{pkg.name}</span>
                  <span className="text-[10px] text-[#6b46c1] font-bold mt-1">BDT {pkg.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Account Info & Options */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#6b46c1] text-white flex items-center justify-center font-bold text-sm">2</div>
              <h2 className="font-bold text-[#0b132b]">Account Info</h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <label className="text-sm font-bold text-slate-700">এখানে গেমের আইডি কোড দিন</label>
              <input type="text" placeholder="এখানে গেমের আইডি কোড দিন" className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1]" />
              <button className="w-full bg-[#6b46c1] hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-2 shadow-sm">
                আপনার গেম আইডির নাম চেক করুন
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#6b46c1] text-white flex items-center justify-center font-bold text-sm">3</div>
              <h2 className="font-bold text-[#0b132b]">Select one option</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button className="border border-red-500 rounded-lg overflow-hidden relative group bg-white shadow-[0_0_0_1px_rgba(239,68,68,1)]">
                  <div className="absolute top-0 left-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-br-lg z-10"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  <div className="h-14 flex items-center justify-center bg-white p-2">
                    <img src="/FF/p1.png" alt="Wallet Pay" className="h-full object-contain" />
                  </div>
                  <div className="bg-slate-100 border-t border-slate-200 text-[10px] font-bold text-left px-2 py-1.5 text-slate-500">Wallet Pay</div>
                </button>
              </div>
              
              <button className="w-full bg-[#6b46c1] hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
