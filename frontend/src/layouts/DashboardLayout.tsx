import {
  LayoutGrid,
  MessageSquare,
  Users,
  Calendar,
  BarChart2,
  UserCog,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Star
} from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { LogoutModal } from '../components/LogoutModal';
import { apiFetch } from '../utils/api';

interface UserProfile {
  full_name: string;
  email: string;
  is_superuser: boolean;
  is_paid: boolean;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch('/user/');
        setUser(data);
      } catch (err: any) {
        console.error("Failed to fetch user profile", err);
        if (err.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          navigate('/');
        }
      }
    };
    fetchUser();
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      category: "MAIN MENU",
      items: [
        { icon: LayoutGrid, label: "Overview", path: "/dashboard", adminOnly: false },
        { icon: MessageSquare, label: "Conversations", path: "/dashboard/conversations", adminOnly: false },
        { icon: Users, label: "Customers", path: "/dashboard/customers", adminOnly: true },
        { icon: Calendar, label: "Appointments", path: "/dashboard/appointments", adminOnly: false },
      ]
    },
    {
      category: "AGGREGATED INTELLIGENCE",
      items: [
        { icon: BarChart2, label: "Analytics", path: "/dashboard/analytics", adminOnly: true },
      ]
    },
    {
      category: "SYSTEM",
      items: [
        { icon: UserCog, label: "User & Roles", path: "/dashboard/users", adminOnly: true },
        { icon: Star, label: "Reviews", path: "/dashboard/reviews", adminOnly: false },
        { icon: Bell, label: "Notifications", path: "/dashboard/notifications", adminOnly: false },
        { icon: Settings, label: "Settings", path: "/dashboard/settings", adminOnly: false },
      ]
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => !item.adminOnly || user?.is_superuser)
  })).filter(section => section.items.length > 0);

  const confirmLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#F0F2F5] border-r border-[#E5E7EB] flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="p-8 pb-4 flex justify-between items-center">
          <Logo />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 mt-4 space-y-8 custom-scrollbar">
          {filteredMenuItems.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-[11px] font-bold text-[#8B98AD] uppercase tracking-wider mb-2 px-4 select-none">
                {section.category}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/dashboard"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                        ? "bg-[#3041F5] text-white shadow-md shadow-[#3041F5]/20"
                        : "text-[#6B7280] hover:bg-[#E5E7EB] hover:text-gray-900"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 mt-auto mb-2 border-t border-[#E5E7EB] pt-6">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-[72px] bg-[#F0F2F5] flex items-center justify-between px-6 lg:px-10 shrink-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-3 ml-auto cursor-pointer hover:bg-white/50 p-1.5 rounded-full transition-colors">
            <div className="text-right hidden sm:block mr-1">
              <div className="flex items-center justify-end gap-2 leading-tight">
                {user?.is_paid && (
                  <span className="bg-[#4355FF] text-[9px] text-white px-1.5 py-0.5 rounded-md font-black tracking-tighter uppercase">PRO</span>
                )}
                <p className="text-[13px] font-bold text-gray-900">
                  {user?.full_name || 'Loading...'}
                </p>
              </div>
              <p className="text-[11px] text-[#6B7280] font-medium uppercase text-right">
                {user?.is_superuser ? 'Super Admin' : 'Member'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#3041F5] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-10 pt-2 lg:pt-4 overflow-x-hidden overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full h-full">
            <Outlet context={{ user }} />
          </div>
        </div>
      </main>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
