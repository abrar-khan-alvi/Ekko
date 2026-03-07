import { Download, Rocket } from 'lucide-react';

const invoices = [
  { id: "INV-2026-001", date: "Feb 01, 2026", amount: "$99.00", status: "Paid" },
  { id: "INV-2026-002", date: "Jan 01, 2026", amount: "$99.00", status: "Paid" },
  { id: "INV-2025-012", date: "Dec 01, 2025", amount: "$99.00", status: "Paid" },
];

export default function Billing() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your payment methods and view your billing history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Card */}
        <div className="lg:col-span-2 bg-[#4355FF] rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                  PRO PLAN
                </span>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-blue-100">/month</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Rocket size={24} />
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-blue-100 text-sm">
                Next billing date: <span className="font-semibold text-white">March 01, 2026</span>
              </p>

              <div className="flex gap-4">
                <button className="px-6 py-2.5 bg-white text-[#4355FF] rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors">
                  Upgrade Plan
                </button>
                <button className="px-6 py-2.5 bg-[#4355FF] border border-white/30 text-white rounded-lg font-medium text-sm hover:bg-white/10 transition-colors">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Method</h3>
          
          <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-[#4355FF] rounded text-white flex items-center justify-center text-[10px] font-bold tracking-wider">
                VISA
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">•••••• 424452</p>
                <p className="text-xs text-gray-500">Expires 12/28</p>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            Update Card
          </button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Invoice ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Amount</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.id}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{invoice.amount}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-medium">
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#4355FF] hover:text-[#3644CC]">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing 1 to 4 of 154 customers</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs disabled:opacity-50">
              &lt;
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4355FF] text-white text-xs font-medium">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
