export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Admin Settings</h1>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Site Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notice Bar Text</label>
              <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6b46c1]" rows={2}>১৮ বছরের নিচে কেউ অর্ডার করবেন না! বাবা/মা বা ফ্যামিলির টাকা চুরি করে অর্ডার করলে তার বিরুদ্ধে আইনগত ব্যবস্থা নেওয়া হবে!</textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Telegram Link</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6b46c1]" defaultValue="https://t.me/support" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Group Link</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6b46c1]" defaultValue="https://t.me/group" />
            </div>
            <button className="bg-[#6b46c1] hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
