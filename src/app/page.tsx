import { XCircle, Send, Users, RefreshCw, CheckCircle2, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-6 py-6 px-4">
      {/* Notice Bar */}
      <div className="bg-[#7148c4] rounded flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm relative overflow-hidden">
        <div className="p-3.5 flex flex-col z-10 w-full pr-10 text-white">
          <h3 className="font-bold text-sm mb-0.5">Notice:</h3>
          <p className="text-[11px] font-medium text-white/90">১৮ বছরের নিচে কেউ অর্ডার করবেন না! বাবা/মা বা ফ্যামিলির টাকা চুরি করে অর্ডার করলে তার বিরুদ্ধে আইনগত ব্যবস্থা নেওয়া হবে!</p>
        </div>
        <button className="text-white/80 hover:text-white absolute right-3 top-4 md:top-auto z-10">
          <XCircle size={18} />
        </button>
      </div>

      {/* Hero Banner */}
      <div className="w-full rounded bg-white mt-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] relative border border-slate-100 overflow-hidden">
        {/* Placeholder for the banner image to match exactly */}
        <div className="w-full h-[140px] md:h-[260px] bg-slate-50 relative flex items-center justify-center">
            <img src="https://placehold.co/1200x400/eeeeee/cccccc?text=Banner+Image" alt="Banner" className="w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <span className="font-bold text-xl">Banner Image</span>
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <button className="bg-[#7148c4] hover:bg-[#5f39a8] text-white rounded-md p-3 md:p-4 flex items-center gap-3 transition-colors shadow-sm">
          <div className="bg-white rounded-full p-2 text-[#7148c4]">
            <Send size={18} className="ml-0.5" />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[9px] uppercase font-bold text-white/70">Support</span>
            <span className="font-bold text-sm leading-none mt-0.5">Telegram</span>
          </div>
        </button>
        <button className="bg-[#7148c4] hover:bg-[#5f39a8] text-white rounded-md p-3 md:p-4 flex items-center gap-3 transition-colors shadow-sm">
          <div className="bg-white rounded-full p-2 text-[#7148c4]">
            <Users size={18} />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[9px] uppercase font-bold text-white/70">Group</span>
            <span className="font-bold text-sm leading-none mt-0.5">Join Group</span>
          </div>
        </button>
      </div>

      {/* Special Offer */}
      <div className="mt-8">
        <h2 className="text-center text-[#1e3a8a] text-xl font-bold mb-8">SPECIAL OFFER</h2>
        <div className="flex flex-col items-center w-max">
          <div className="w-[100px] h-[100px] rounded-lg overflow-hidden relative shadow-md">
            <div className="absolute inset-0 bg-gradient-to-b from-[#140b2e] to-[#0a0517]"></div>
            <div className="absolute inset-0 flex flex-col p-1.5 gap-1.5 z-10">
                <div className="bg-blue-600 rounded flex flex-col items-center justify-center py-1">
                    <span className="text-[9px] font-bold text-white">১৪৫ টাকা</span>
                    <span className="text-[10px] font-black text-white">WEEKLY</span>
                </div>
                <div className="bg-orange-500 rounded flex flex-col items-center justify-center py-1">
                    <span className="text-[9px] font-bold text-white">৭২৫ টাকা</span>
                    <span className="text-[10px] font-black text-white">MONTHLY</span>
                </div>
            </div>
          </div>
          <span className="text-[#1e3a8a] font-bold text-[10px] mt-3 uppercase tracking-wider">COMING SOON</span>
        </div>
      </div>

      {/* Topup Section */}
      <div className="mt-12">
        <h2 className="text-center text-[#1e3a8a] text-xl font-bold mb-8">TOPUP</h2>
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
          {[
            { name: 'FF LIKES', bg: 'from-[#31115e] to-[#14062b]' },
            { name: 'UID TOPUP (BD)', bg: 'from-[#3a1372] to-[#16052c]' },
            { name: 'WEEKLY/MONTHLY', bg: 'from-[#220d4f] to-[#0d041e]' },
            { name: 'WEEKLY LITE', bg: 'from-[#1a1c5e] to-[#090a2a]' },
            { name: 'LEVEL UP PASS', bg: 'from-[#35105a] to-[#130522]' },
            { name: 'INDONESIA SERVER', bg: 'from-[#42115e] to-[#180424]' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center w-[90px]">
              <div className={`w-[90px] h-[90px] rounded-xl bg-gradient-to-b ${item.bg} flex items-center justify-center text-white shadow-md relative overflow-hidden`}>
                <div className="absolute top-1 right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="font-bold text-center text-sm z-10 px-1 leading-tight">
                    {/* Placeholder content inside cards */}
                    <div className="w-10 h-10 border border-white/20 rounded opacity-50"></div>
                </div>
              </div>
              <span className="text-[#1e3a8a] font-bold text-[10px] mt-3 text-center uppercase tracking-wider">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="mt-16 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-24 h-24 bg-pink-100 rounded-br-[100px] opacity-50 -z-10"></div>
        <div className="p-5 border-b border-slate-50 flex justify-between items-start relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center border border-pink-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <div className="pt-0.5">
              <h2 className="text-xl font-black text-[#0b132b] tracking-tight">Recent Orders</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-[#00d084] rounded-full"></span>
                <span className="text-[#00d084] font-bold text-xs tracking-wider">Live</span>
                <svg className="w-5 h-3 text-[#00d084]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
              </div>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Thick gradient line separator */}
        <div className="h-[3px] w-16 bg-gradient-to-r from-pink-500 to-pink-200 ml-5 -mt-[1px]"></div>

        <div className="divide-y divide-slate-100">
          {[
            { name: 'sujon Islam', product: '200 FF LIKE- প্রতিদিন ১ আইডিতে ১বার - ৳30', status: 'Pending', color: 'bg-slate-500' },
            { name: 'Shakil Ahmed', product: 'MONTHLY - ৳790', status: 'Done', color: 'bg-teal-500' },
            { name: 'SHOVO GAMER', product: 'MONTHLY - ৳790', status: 'Done', img: true },
            { name: 'DJ MIX 9X9', product: '355 Diamond - ৳237', status: 'Done', img: true },
            { name: 'DJ MIX 9X9', product: '1240 Diamond - ৳800', status: 'Done', img: true },
            { name: 'Monika Rosario', product: 'WEEKLY - ৳158', status: 'Done', color: 'bg-purple-500' },
            { name: 'Apurba Hrishi', product: 'MONTHLY - ৳790', status: 'Done', img: true },
            { name: 'Jaki usai 5112', product: 'Level Up Package - Level 30 - ৳105', status: 'Done', img: true },
            { name: 'Jannat Apu', product: '25 Diamond - ৳22', status: 'Done', color: 'bg-teal-600' },
            { name: 'Md Rifat', product: '50 Diamond - ৳36', status: 'Done', img: true },
          ].map((order, idx) => (
            <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3.5">
                {order.img ? (
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <img src={`https://i.pravatar.cc/150?u=${idx}`} alt={order.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 ${order.color}`}>
                    {order.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <h4 className="font-bold text-[13px] text-slate-800 leading-none mb-1">{order.name}</h4>
                  <p className="text-[11px] text-slate-500">{order.product}</p>
                </div>
              </div>
              <div>
                {order.status === 'Pending' ? (
                  <div className="bg-blue-50 text-blue-500 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-white"><Clock size={9} strokeWidth={3} /></div> {order.status}
                  </div>
                ) : (
                  <div className="bg-[#e6f9f0] text-[#00d084] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#00d084] flex items-center justify-center text-white"><CheckCircle2 size={10} strokeWidth={3} /></div> {order.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download App */}
      <div className="mt-16 mb-4 flex flex-col items-center text-center">
        <h2 className="text-black text-sm font-black mb-4 uppercase tracking-wide">DOWNLOAD OUR MOBILE APP</h2>
        <div className="bg-black rounded-lg py-2 px-4 inline-flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform w-[180px] justify-center shadow-lg">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM14.81 10.88L5.54 5.53L14 12L5.54 18.47L14.81 13.12C15.17 12.91 15.17 12.59 14.81 12.38V10.88ZM15.8 13.68L20.16 11.16C20.9 10.73 20.9 10.02 20.16 9.59L15.8 7.07L14.47 8.4L18.06 10.46L14.47 12.52L15.8 13.68Z"/></svg>
          <div className="flex flex-col items-start leading-[1.1]">
            <span className="text-[10px] text-white">GET IT ON</span>
            <span className="text-[17px] font-semibold text-white">Google Play</span>
          </div>
        </div>
      </div>

    </div>
  );
}
