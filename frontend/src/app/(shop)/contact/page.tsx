import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh]">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
          Contact Support
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
          We are here to help! Reach out to us for any top-up issues, payment queries, or general
          support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary-500 transition-colors">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                Call Us Anytime
              </p>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                +880 1700 000000
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary-500 transition-colors">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mail size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                Email Support
              </p>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                support@xoxoshop.com
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary-500 transition-colors">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
                Our Office
              </p>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                Dhaka, Bangladesh
              </h3>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            Send us a message
          </h2>
          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Subject (Order ID)
              </label>
              <input
                type="text"
                placeholder="e.g. Order #12345 hasn&apos;t arrived"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="How can we help you?"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
