"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { XCircle, Send, Users, RefreshCw, CheckCircle2, Clock } from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    "/FF/B1.jpg",
    "/FF/B2.jpg",
    "/FF/B3.jpg",
    "/FF/B4.jpg",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

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

      {/* Hero Banner Slider */}
      <div className="w-full mt-1 flex flex-col items-center">
        <div className="w-full rounded bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] relative border border-slate-100 overflow-hidden">
          <div className="w-full h-[180px] sm:h-[240px] md:h-[320px] lg:h-[380px] bg-slate-50 relative flex items-center justify-center overflow-hidden">
            <div 
              className="flex w-full h-full transition-transform duration-500 ease-out" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0">
                  <img src={slide} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "w-4 bg-slate-600" : "w-2 bg-slate-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
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
      <div className="mt-4 md:mt-8">
        <h2 className="text-center text-[#1e3a8a] text-xl font-bold mb-4 md:mb-8 uppercase">Special Offer</h2>
        <div className="flex flex-col items-center w-max group cursor-pointer">
          <div className="w-[100px] h-[100px] md:w-[110px] md:h-[110px] rounded-xl overflow-hidden relative shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 bg-[#150a2b] border border-purple-900/30">
            {/* Top Left Badge */}
            <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm z-20">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            
            {/* Full Card Image (Replace src with your actual graphic) */}
            <img 
              src="/FF/0.jpg" 
              alt="Special Offer" 
              className="w-full h-full object-cover relative z-10" 
            />
          </div>
          <span className="text-[#1e3a8a] font-bold text-[10px] mt-3 uppercase tracking-wider group-hover:text-purple-700 transition-colors">COMING SOON</span>
        </div>
      </div>

      {/* Topup Section */}
      <div className="mt-4 md:mt-12 px-1 md:px-0">
        <h2 className="text-center text-[#1e3a8a] text-xl font-bold mb-4 md:mb-8">TOPUP</h2>
        <div className="grid grid-cols-3 md:flex md:flex-wrap justify-items-center md:justify-start gap-x-2 gap-y-6 md:gap-x-16 md:gap-y-12">
          {[
            { name: 'FF LIKES', img: '/FF/1.jpg', href: '/ff-likes' },
            { name: 'UID TOPUP (BD)', img: '/FF/2.jpg', href: '/uid-topup' },
            { name: 'WEEKLY/MONTHLY', img: '/FF/3.jpg', href: '/weekly-monthly' },
            { name: 'WEEKLY LITE', img: '/FF/4.jpg', href: '/weekly-lite' },
            { name: 'LEVEL UP PASS', img: '/FF/5.jpg', href: '/level-up-pass' },
            { name: 'INDONESIA SERVER', img: '/FF/6.jpg', href: '/indonesia-server' },
          ].map((item, idx) => {
            const cardContent = (
              <div className="flex flex-col items-center w-[90px] md:w-[100px] group cursor-pointer">
                <div className="w-[90px] h-[90px] md:w-[100px] md:h-[100px] rounded-xl bg-[#150a2b] shadow-md relative overflow-hidden border border-purple-900/30 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 flex items-center justify-center">
                  {/* Top Right Badge */}
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm z-20">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Full Card Image */}
                  <img 
                    src={item.img} 
                    alt={item.name} 
                    className="w-full h-full object-cover relative z-10" 
                  />
                </div>
                <span className="text-[#1e3a8a] font-bold text-[9px] md:text-[10px] mt-3 text-center uppercase tracking-wider">{item.name}</span>
              </div>
            );

            return item.href !== '#' ? (
              <Link href={item.href} key={idx}>
                {cardContent}
              </Link>
            ) : (
              <div key={idx}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="mt-6 md:mt-16 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-24 h-24 bg-pink-100 rounded-br-[100px] opacity-50 -z-10"></div>
        <div className="p-5 border-b border-slate-50 flex justify-between items-start relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center border border-pink-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <div className="pt-0.5">
              <h2 className="text-xl font-black text-[#0b132b] tracking-tight">Recent Orders</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 bg-[#00d084] rounded-full"></span>
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
            { name: 'Mehedi', product: '200 FF LIKE- প্রতিদিন ১ আইডিতে ১বার - ৳30', status: 'Pending', avatarType: 'icon', color: 'bg-[#f0f4ff] text-[#6366f1]' },
            { name: 'SK TAHMID', product: '115 Diamond - ৳79', status: 'Done', avatarType: 'text', avatar: 'SK', color: 'bg-[#004d40] text-white' },
            { name: 'Rm Ridoy', product: '5060 Diamond - ৳3220', status: 'Done', avatarType: 'text', avatar: 'Rm', color: 'bg-[#f06292] text-white' },
            { name: 'Altaf Vai', product: '3X Weekly Lite - ৳135', status: 'Done', avatarType: 'text', avatar: 'A', color: 'bg-[#455a64] text-white' },
            { name: 'Md Ariyan', product: 'WEEKLY - ৳158', status: 'Done', avatarType: 'text', avatar: 'Md', color: 'bg-[#5c6bc0] text-white' },
            { name: 'Siyam Ahmmad', product: 'WEEKLY - ৳158', status: 'Done', avatarType: 'img', src: 'https://cdn-icons-png.flaticon.com/512/3176/3176294.png' },
            { name: 'MD JAHID', product: 'WEEKLY - ৳158', status: 'Done', avatarType: 'img', src: 'https://i.pravatar.cc/150?u=jahid' },
            { name: 'Sk Anik', product: '2X WEEKLY - ৳316', status: 'Done', avatarType: 'img', src: 'https://i.pravatar.cc/150?u=anik' },
            { name: 'MD Bijoy', product: 'WEEKLY - ৳158', status: 'Done', avatarType: 'img', src: 'https://i.pravatar.cc/150?u=bijoy' },
            { name: 'nirob Chowdhury', product: '355 Diamond - ৳237', status: 'Done', avatarType: 'text', avatar: 'n', color: 'bg-[#78909c] text-white' },
          ].map((order, idx) => (
            <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3.5">
                {order.avatarType === 'img' ? (
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    <img src={order.src} alt={order.name} className="w-full h-full object-cover" />
                  </div>
                ) : order.avatarType === 'icon' ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${order.color}`}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] shrink-0 ${order.color}`}>
                    {order.avatar}
                  </div>
                )}
                <div className="flex flex-col">
                  <h4 className="font-bold text-[13px] text-[#0b132b] leading-none mb-1.5">{order.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-none">{order.product}</p>
                </div>
              </div>
              <div>
                {order.status === 'Pending' ? (
                  <div className="bg-[#eff6ff] text-[#3b82f6] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#3b82f6] flex items-center justify-center text-white"><Clock size={10} strokeWidth={3} /></div> {order.status}
                  </div>
                ) : (
                  <div className="bg-[#e6f9f0] text-[#00d084] px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#00d084] flex items-center justify-center text-white"><CheckCircle2 size={11} strokeWidth={3} /></div> {order.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download App */}
      <div className="mt-16 mb-8 flex flex-col items-center text-center">
        <h2 className="text-black text-lg md:text-xl font-black mb-6 uppercase tracking-wider">DOWNLOAD OUR MOBILE APP</h2>
        <a href="#" className="hover:scale-105 transition-transform cursor-pointer inline-block">
          <img src="/FF/google-play.nDtcExnl.png" alt="Get it on Google Play" className="w-[220px] md:w-[280px] object-contain drop-shadow-xl" />
        </a>
      </div>

    </div>
  );
}
