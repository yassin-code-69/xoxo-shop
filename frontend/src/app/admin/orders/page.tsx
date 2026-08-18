export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Orders Management</h1>
        <button className="bg-primary-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex gap-4">
          <input
            type="text"
            placeholder="Search orders..."
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 w-64"
          />
          <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
            <option>All Status</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-sm text-slate-500">
                <th className="p-4 font-medium border-b border-slate-200">Order ID</th>
                <th className="p-4 font-medium border-b border-slate-200">Date</th>
                <th className="p-4 font-medium border-b border-slate-200">Customer Info</th>
                <th className="p-4 font-medium border-b border-slate-200">Game UID</th>
                <th className="p-4 font-medium border-b border-slate-200">Item</th>
                <th className="p-4 font-medium border-b border-slate-200">Status</th>
                <th className="p-4 font-medium border-b border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-800 font-medium">#ORD-{2000 + i}</td>
                  <td className="p-4 text-slate-500">Aug {10 + i}, 2026</td>
                  <td className="p-4 text-slate-600">user{i}@example.com</td>
                  <td className="p-4 text-slate-800 font-mono">10293{i}847</td>
                  <td className="p-4 text-slate-600">UID TOPUP BD</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                      Pending
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:underline font-medium text-xs mr-3">
                      Complete
                    </button>
                    <button className="text-red-600 hover:underline font-medium text-xs">
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
