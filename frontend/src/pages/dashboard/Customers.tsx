import { useState, useEffect } from 'react';
import { Search, Loader2, Eye, CheckCircle, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const getStatus = (customer: any) => {
  if (!customer.is_verified) return 'Pending';
  if (customer.is_active) return 'Active';
  return 'Suspended';
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'Pending') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-yellow-50 text-yellow-700 border-yellow-100">Pending</span>;
  }
  if (status === 'Suspended') {
    return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-red-50 text-red-700 border-red-100">Suspended</span>;
  }
  return <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-green-50 text-green-700 border-green-100">Active</span>;
};

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch('/users/');
      const usersList = Array.isArray(data) ? data : (data.results || []);
      // Filter out superusers from being displayed as regular customers
      setCustomers(usersList.filter((u: any) => !u.is_superuser));
    } catch (err: any) {
      console.error("Failed to fetch customers", err);
      setError("Failed to load customers. Only administrators can view this page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleCustomerStatus = async (customerId: number, currentStatus: string) => {
    // If pending, they need to verify email first ideally, but admin can force activate
    const willBeActive = currentStatus !== 'Active';
    const confirmMessage = willBeActive 
      ? `Are you sure you want to ACTIVATE this business account?`
      : `Are you sure you want to SUSPEND this business account? They will no longer be able to log in.`;
      
    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(customerId);
    try {
      await apiFetch(`/users/${customerId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: willBeActive })
      });
      await fetchCustomers();
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchString = `
      ${customer.full_name || ''} 
      ${customer.email || ''} 
      ${customer.business_profile?.business_name || ''}
    `.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers (Businesses)</h1>
        <p className="text-gray-500 mt-1">Manage Ekko's paying business owners.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by business, owner name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3041F5]/20 focus:border-[#3041F5] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#3041F5]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-600 font-medium bg-red-50">
            {error}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner / Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => {
                    const status = getStatus(customer);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 block">
                            {customer.business_profile?.business_name || 'No Business Name'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-full bg-[#3041F5]/10 text-[#3041F5] flex items-center justify-center font-bold text-sm">
                              {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 block text-sm">{customer.full_name || 'No Name'}</span>
                              <span className="text-xs text-gray-500">{customer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(customer.date_joined).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/dashboard/customers/${customer.id}`)}
                              className="p-2 text-gray-500 hover:text-[#3041F5] hover:bg-[#3041F5]/10 rounded-lg transition-colors border border-transparent hover:border-[#3041F5]/20"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            
                            {updatingId === customer.id ? (
                               <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-2" />
                            ) : status === 'Active' ? (
                              <button
                                onClick={() => toggleCustomerStatus(customer.id, status)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Suspend Account"
                              >
                                <Ban size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleCustomerStatus(customer.id, status)}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                title="Activate Account"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                        No businesses found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Showing {filteredCustomers.length} business(es)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
