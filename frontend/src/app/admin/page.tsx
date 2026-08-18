import { ShoppingCart, Users, DollarSign, Activity } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "৳ 45,231",
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Orders",
      value: "+2350",
      icon: ShoppingCart,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Active Users",
      value: "+12,234",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Conversion Rate",
      value: "4.3%",
      icon: Activity,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-slate-800">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-2">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Recent Orders (Mock Data)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-sm text-slate-500">
                <th className="p-4 font-medium border-b border-slate-200">Order ID</th>
                <th className="p-4 font-medium border-b border-slate-200">Customer</th>
                <th className="p-4 font-medium border-b border-slate-200">Product</th>
                <th className="p-4 font-medium border-b border-slate-200">Status</th>
                <th className="p-4 font-medium border-b border-slate-200">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 text-slate-800 font-medium">#ORD-{1000 + i}</td>
                  <td className="p-4 text-slate-600">Customer {i}</td>
                  <td className="p-4 text-slate-600">WEEKLY T-UP</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Completed
                    </span>
                  </td>
                  <td className="p-4 text-slate-800 font-medium">৳ 158</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
