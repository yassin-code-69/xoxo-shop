import Link from "next/link";
import { Zap, Info } from "lucide-react";

export default function UidTopup() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md">
          <img src="/FF/2.jpg" alt="UID TOPUP (BD)" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-[#0b132b] mb-2">UID TOPUP (BD)</h1>
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
              {/* Packages */}
              {[
                { name: 'WEEKLY', price: '158' },
                { name: 'MONTHLY', price: '790' },
                { name: '25 Diamond', price: '22' },
                { name: '50 Diamond', price: '36' },
                { name: '115 Diamond', price: '79' },
                { name: '240 Diamond', price: '158' },
                { name: '355 Diamond', price: '237' },
                { name: '480 Diamond', price: '316' },
                { name: '610 Diamond', price: '400' },
                { name: '850 Diamond', price: '558' },
                { name: '1240 Diamond', price: '800' },
                { name: '2530 Diamond', price: '1610' },
                { name: '5060 Diamond', price: '3220' },
                { name: '10120 Diamond', price: '6440' },
              ].map((pkg, i) => (
                <button key={i} className="border border-slate-200 rounded-lg py-3 flex flex-col items-center hover:border-[#6b46c1] hover:shadow-md transition-all group focus:border-[#6b46c1] focus:ring-1 focus:ring-[#6b46c1]">
                  <span className="font-bold text-xs text-[#1e3a8a] group-hover:text-[#6b46c1] group-focus:text-[#6b46c1] uppercase">{pkg.name}</span>
                  <span className="text-[10px] text-[#6b46c1] font-bold mt-1">BDT {pkg.price}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <Link href="#" className="text-[#00d084] text-sm font-bold flex items-center gap-1 hover:underline w-max">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> কিভাবে অর্ডার করবেন? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
              </Link>
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
                <button className="border border-slate-200 rounded-lg overflow-hidden relative group opacity-60 hover:opacity-100 transition-opacity">
                  <div className="h-14 flex items-center justify-center bg-white p-2">
                    <img src="/FF/p2.png" alt="Instant Pay" className="h-full object-contain" />
                  </div>
                  <div className="bg-slate-100 border-t border-slate-200 text-[10px] font-bold text-left px-2 py-1.5 text-slate-500">Instant Pay</div>
                </button>
              </div>
              
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-500 mb-5 font-medium">
                <p className="flex items-center gap-1.5"><Info size={14} /> প্রোডাক্ট কিনতে আপনার প্রয়োজন ০ টাকা।</p>
                <p className="flex items-center gap-1.5 text-orange-500"><Info size={14} /> Please Login To Purchase</p>
              </div>
              
              <button className="w-full bg-[#6b46c1] hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="mt-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-2">
          <div className="text-[#6b46c1]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
          <h2 className="font-bold text-[#0b132b] text-sm">Rules & Conditions</h2>
        </div>
        <div className="p-6">
          <ul className="space-y-6 text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5 text-[10px]">◉</span> শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5 text-[10px]">◉</span> Player ID ভুল দিয়ে Diamond না পেলে Offer TopUp কর্তৃপক্ষ দায়ী নয়
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5 text-[10px]">◉</span> Order কমপ্লিট হওয়ার পরেও আইডিতে ডায়মন্ড না গেলে চেক করার জন্য ID Pass দিতে হবে
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5 text-[10px]">◉</span> অর্ডার Cancel হলে কি কারণে তা Cancel হয়েছে তা অর্ডার হিস্টরিতে দেওয়া থাকে অনুগ্রহ পূর্বক দেখে পুনরায় সঠিক তথ্য দিয়ে অর্ডার করবেন।
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
