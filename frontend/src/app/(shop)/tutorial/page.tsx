import { Play, Info } from "lucide-react";

export default function TutorialPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
          How to Top Up
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
          Follow these simple steps to safely and securely top up your favorite games.
        </p>
      </div>

      {/* Video Section */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative aspect-video w-full max-w-4xl mx-auto mb-16 border border-slate-800 group cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80"
          alt="Tutorial Video Thumbnail"
          className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-primary-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(147,51,234,0.5)] group-hover:scale-110 transition-transform duration-300">
            <Play size={32} className="ml-2" fill="currentColor" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
          <h3 className="text-white font-bold text-xl">Official TopUp Guide (Bangla)</h3>
          <p className="text-slate-300 text-sm">Duration: 2:45</p>
        </div>
      </div>

      {/* Step by Step */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            step: "1",
            title: "Select Package",
            desc: "Choose your game and select the diamond package you want to purchase.",
          },
          {
            step: "2",
            title: "Enter Player ID",
            desc: "Provide your exact in-game Player ID. Double check for typos!",
          },
          {
            step: "3",
            title: "Checkout",
            desc: "Complete the payment using bKash, Nagad or Rocket. Delivery is instant.",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center text-xl font-black mb-6 relative z-10">
              {item.step}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 relative z-10">
              {item.title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex items-start gap-4 max-w-3xl mx-auto">
        <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Important Notice</h4>
          <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
            Please make sure your Player ID is 100% correct. Transactions to incorrect IDs cannot be
            reversed or refunded as per our policy.
          </p>
        </div>
      </div>
    </div>
  );
}
