import { useState, useEffect } from 'react';
import { Search, Loader2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const StatusBadge = ({ is_verified, is_active }: { is_verified: boolean, is_active: boolean }) => {
  if (!is_verified) {
    return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-100">Unverified</span>;
  }
  if (!is_active) {
    return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-100">Inactive</span>;
  }
  return <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-100">Active</span>;
};

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await apiFetch('/users/');
        setCustomers(data);
      } catch (err: any) {
        console.error("Failed to fetch customers", err);
        setError("Failed to load customers. Only administrators can view this page.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchString = `${customer.full_name} ${customer.email}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-1">Manage all registered users and view their details.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#4355FF]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-600 font-medium">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Contact</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Role</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#4355FF]/10 text-[#4355FF] flex items-center justify-center font-bold">
                            {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{customer.full_name || 'No Name'}</span>
                            <span className="text-xs text-gray-500">Joined {new Date(customer.date_joined).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.phone_number || 'No Phone'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {customer.is_superuser ? (
                          <span className="font-medium text-[#4355FF]">Super Admin</span>
                        ) : (
                          'Member'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge is_verified={customer.is_verified} is_active={customer.is_active} />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${customer.is_paid ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                            {customer.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                          className="flex items-center justify-end gap-1 text-[#4355FF] hover:text-[#3644CC] font-medium text-sm transition-colors ml-auto"
                        >
                          <Eye size={16} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No customers found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {filteredCustomers.length} customer(s)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
