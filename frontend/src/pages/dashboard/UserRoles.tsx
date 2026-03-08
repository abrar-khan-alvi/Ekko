import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
  last_login: string | null;
}

const getRole = (user: User) => {
  if (user.is_superuser) return "Super Admin";
  if (user.is_staff) return "Support";
  return "Business Owner";
};

const getStatus = (user: User) => user.is_active ? "Active" : "Inactive";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    Active: "bg-green-50 text-green-800 border-green-100",
    Inactive: "bg-red-50 text-red-800 border-red-100"
  };
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function UserRoles() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("Viewer");
  const [editStatus, setEditStatus] = useState("Active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiFetch('/users/');
      const usersList = Array.isArray(data) ? data : (data.results || []);
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    if (user.is_superuser) setEditRole("Super Admin");
    else if (user.is_staff) setEditRole("Support");
    else setEditRole("Viewer");
    
    setEditStatus(user.is_active ? "Active" : "Inactive");
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const is_superuser = editRole === "Super Admin";
      const is_staff = editRole === "Super Admin" || editRole === "Support";
      const is_active = editStatus === "Active";

      await apiFetch(`/users/${editingUser.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_superuser,
          is_staff,
          is_active
        })
      });
      // Refresh list
      await fetchUsers();
      closeEditModal();
    } catch (err) {
      console.error("Failed to update user", err);
      alert("Failed to update user. Note: only Super Admins can update roles.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.full_name}?`)) {
      try {
        await apiFetch(`/users/${user.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ is_active: false })
        });
        fetchUsers();
      } catch (err) {
        console.error("Failed to deactivate user", err);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    getRole(u).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User & Roles</h1>
        <p className="text-gray-500 mt-1">Manage system users, support staff, and business owners.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search users by name, email, or role..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3041F5]/20 focus:border-[#3041F5] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading users...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3041F5]/10 text-[#3041F5] flex items-center justify-center font-bold relative shrink-0">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      {user.is_superuser && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 block">{user.full_name || 'No Name'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
                    user.is_superuser ? 'bg-blue-50 text-blue-700' :
                    user.is_staff ? 'bg-purple-50 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getRole(user)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={getStatus(user)} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-2 text-gray-500 hover:text-[#3041F5] hover:bg-[#3041F5]/10 rounded-lg transition-colors border border-transparent hover:border-[#3041F5]/20"
                      title="Edit role and status"
                    >
                      <Edit size={18} strokeWidth={2} />
                    </button>
                    {user.is_active && (
                      <button 
                        onClick={() => deactivateUser(user)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Deactivate user"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {!loading && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Showing {filteredUsers.length} users</span>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Edit User Access</h3>
              <button 
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="p-5 md:p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl space-y-1">
                <p className="font-bold text-gray-900">{editingUser.full_name || editingUser.email}</p>
                <p className="text-sm font-medium text-gray-500">{editingUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <select 
                  value={editRole} 
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3041F5]/20 focus:border-[#3041F5] transition-all"
                >
                  <option value="Super Admin">Super Admin (Full Access)</option>
                  <option value="Support">Support (View Customers)</option>
                  <option value="Viewer">Business Owner (Own Dashboard Only)</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {editRole === "Super Admin" ? "Has full access to all admin features and settings." : 
                   editRole === "Support" ? "Can view customers and activity, but cannot change core settings." : 
                   "Standard user account. Cannot access this admin dashboard."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select 
                  value={editStatus} 
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3041F5]/20 focus:border-[#3041F5] transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 md:p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end items-center">
              <button 
                onClick={closeEditModal}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 bg-white border border-gray-200 rounded-xl transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={saveUserChanges}
                disabled={saving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#3041F5] hover:bg-[#3041F5]/90 rounded-xl shadow-md shadow-[#3041F5]/20 hover:shadow-lg hover:shadow-[#3041F5]/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
