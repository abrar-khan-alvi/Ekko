import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Briefcase, FileText, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../../utils/api';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 18 } }
};

export default function CustomerDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                const data = await apiFetch(`/users/${id}/`);
                setCustomer(data);
            } catch (err: any) {
                console.error("Failed to fetch customer details", err);
                setError("Failed to load customer details. They might not exist or you lack permissions.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCustomer();
        }
    }, [id]);

    const handleTogglePaid = async () => {
        if (!customer) return;
        setUpdateLoading(true);
        try {
            const updatedData = await apiFetch(`/users/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_paid: !customer.is_paid })
            });
            setCustomer({ ...customer, is_paid: updatedData.is_paid });
        } catch (err) {
            console.error("Failed to update subscription status", err);
            alert("Failed to update subscription status.");
        } finally {
            setUpdateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-3xl mb-8 relative">
                    <div className="absolute -bottom-12 left-8 w-32 h-32 bg-gray-300 rounded-2xl border-4 border-white"></div>
                </div>
                <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <div className="h-64 bg-gray-200 rounded-3xl"></div>
                        <div className="h-80 bg-gray-200 rounded-3xl"></div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="h-[500px] bg-gray-200 rounded-3xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-red-50 border-2 border-red-100 rounded-3xl max-w-lg mx-auto mt-10"
            >
                <div className="w-20 h-20 bg-red-500 text-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 rotate-3">
                    <XCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-red-600 font-medium mb-8 px-6">{error || "Customer not found."}</p>
                <button
                    onClick={() => navigate('/dashboard/customers')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                    <ArrowLeft size={20} />
                    Back to Customers
                </button>
            </motion.div>
        );
    }

    const getStatus = () => {
        if (!customer.is_verified) return { label: 'Unverified', bg: 'bg-[#FFE2A4]', text: 'text-yellow-900', border: 'border-yellow-400' };
        if (!customer.is_active) return { label: 'Inactive', bg: 'bg-[#FFB4B4]', text: 'text-red-900', border: 'border-red-400' };
        return { label: 'Active', bg: 'bg-[#A8F3AD]', text: 'text-green-900', border: 'border-green-400' };
    };

    const status = getStatus();
    const initials = customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase();

    return (
        <div className="w-full h-full pb-10">

            {/* Nav & Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-8"
            >
                <button
                    onClick={() => navigate('/dashboard/customers')}
                    className="p-3 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
                    <p className="text-gray-500 font-medium mt-0.5">Manage user information and business profile</p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">

                    {/* User Identity Box */}
                    <motion.div variants={itemVariants} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-24 bg-[#4355FF]/5"></div>

                        <div className="relative inline-block mb-4 mt-4">
                            <div className="w-24 h-24 bg-[#4355FF] text-white rounded-full shadow-lg flex items-center justify-center text-4xl font-bold">
                                {initials}
                            </div>
                            {customer.is_superuser && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1.5 rounded-full border-2 border-white" title="Super Admin">
                                    <CheckCircle2 size={16} className="text-yellow-900" />
                                </div>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 truncate mb-1">{customer.full_name || 'No Name Set'}</h2>
                        <p className="text-gray-500 font-medium text-sm mb-6">{customer.is_superuser ? 'Super Administrator' : 'Platform Member'}</p>

                        <div className="flex justify-center gap-2">
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold ${status.bg} ${status.text}`}>
                                {status.label}
                            </span>
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-bold ${customer.is_paid
                                ? 'bg-[#4355FF]/10 text-[#4355FF]'
                                : 'bg-gray-100 text-gray-600'}`}>
                                {customer.is_paid ? 'PRO TIER' : 'FREE TIER'}
                            </span>
                        </div>
                    </motion.div>

                    {/* Admin Actions */}
                    <motion.div variants={itemVariants} className="bg-white border border-[#4355FF]/20 rounded-2xl p-6 shadow-sm shadow-[#4355FF]/5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-[#4355FF]/10 rounded-xl"><CreditCard size={20} className="text-[#4355FF]" /></div>
                            <h3 className="font-bold text-gray-900">Billing Control</h3>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Current State</p>
                                    <p className={`text-sm font-bold ${customer.is_paid ? 'text-[#4355FF]' : 'text-gray-700'}`}>
                                        {customer.is_paid ? 'Active Paid Subscription' : 'No Active Subscriptions'}
                                    </p>
                                </div>
                                <div className={`p-2 rounded-xl ${customer.is_paid ? 'bg-[#4355FF]/10 text-[#4355FF]' : 'bg-gray-200 text-gray-500'}`}>
                                    {customer.is_paid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                </div>
                            </div>

                            <button
                                onClick={handleTogglePaid}
                                disabled={updateLoading}
                                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all ${customer.is_paid
                                    ? 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                                    : 'bg-[#4355FF] text-white shadow-md shadow-[#4355FF]/20 hover:bg-[#3644CC]'
                                    }`}
                            >
                                {updateLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {customer.is_paid ? 'Revoke PRO Status' : 'Upgrade to PRO'}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Contact Info */}
                    <motion.div variants={itemVariants} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider text-gray-400">Contact Details</h3>
                        <div className="space-y-4">
                            {[
                                { icon: Mail, label: 'Email', value: customer.email },
                                { icon: Phone, label: 'Phone', value: customer.phone_number || 'Not provided' },
                                { icon: MapPin, label: 'Location', value: customer.address || 'No address on file' },
                                { icon: Calendar, label: 'Joined', value: new Date(customer.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                        <item.icon size={18} className="text-gray-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400 mb-0.5">{item.label}</p>
                                        <p className={`text-sm font-medium truncate ${!item.value.includes('Not ') && !item.value.includes('No ') ? 'text-gray-900' : 'text-gray-400 italic'}`} title={item.value}>
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Business Profile */}
                <motion.div variants={itemVariants} className="xl:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                            <div className="p-3 bg-[#4355FF]/10 rounded-2xl text-[#4355FF]">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Business Profile</h3>
                                <p className="text-gray-500 text-sm font-medium mt-1">Operational details and service configuration.</p>
                            </div>
                        </div>

                        {customer.business_profile ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <div className="space-y-6">
                                    {/* Business Name */}
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#4355FF]"></span>
                                            Company Name
                                        </p>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-h-[5rem] flex items-center">
                                            <p className="text-gray-900 font-medium text-lg leading-snug">
                                                {customer.business_profile.business_name || <span className="text-gray-400 italic">Not set</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Business Hours */}
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#4355FF]"></span>
                                            Operating Hours
                                        </p>
                                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-h-[6rem]">
                                            <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                                                {customer.business_profile.business_hours || <span className="text-gray-400 italic">Not configured</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Services */}
                                    <div className="h-full flex flex-col">
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#4355FF]"></span>
                                            Services List
                                        </p>
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex-1 min-h-[150px]">
                                            <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                                                {customer.business_profile.services_offered || <span className="text-gray-400 italic">No services listed</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Policies spanning both columns */}
                                <div className="md:col-span-2 mt-2">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#4355FF]"></span>
                                        Booking Policies
                                    </p>
                                    <div className="bg-[#4355FF]/5 rounded-2xl p-6 border border-[#4355FF]/10">
                                        <p className="text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
                                            {customer.business_profile.booking_policies || <span className="text-gray-500 italic">No specific policies defined.</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="w-20 h-20 bg-white shadow-sm rounded-2xl border border-gray-100 flex items-center justify-center mb-6"
                                >
                                    <FileText className="w-10 h-10 text-gray-300" />
                                </motion.div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Setup Incomplete</h4>
                                <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
                                    This member hasn't configured their business profile yet. Data will populate here once they complete onboarding.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
