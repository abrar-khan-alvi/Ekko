import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Briefcase, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';

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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#4355FF]" />
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error || "Customer not found."}</p>
                <button
                    onClick={() => navigate('/dashboard/customers')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mx-auto"
                >
                    <ArrowLeft size={18} />
                    Back to Customers
                </button>
            </div>
        );
    }

    const getStatus = () => {
        if (!customer.is_verified) return { label: 'Unverified', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
        if (!customer.is_active) return { label: 'Inactive', color: 'bg-red-50 text-red-700 border-red-100' };
        return { label: 'Active', color: 'bg-green-50 text-green-700 border-green-100' };
    };

    const status = getStatus();

    return (
        <div className="max-w-4xl space-y-6 pb-10">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/dashboard/customers')}
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
                    <p className="text-gray-500 mt-1">View detailed information and profile data.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Basic Info & Contact */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-[#4355FF]/10 text-[#4355FF] rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                            {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : customer.email.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{customer.full_name || 'No Name Provided'}</h2>
                        <p className="text-gray-500 text-sm mb-4">{customer.is_superuser ? 'Super Admin' : 'Member'}</p>
                        <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                {status.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${customer.is_paid ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                {customer.is_paid ? 'Paid' : 'Unpaid'}
                            </span>
                        </div>
                    </div>

                    {/* Admin Controls */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-t-4 border-t-[#4355FF]">
                        <h3 className="font-bold text-gray-900 mb-4">Admin Controls</h3>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Subscription Status</p>
                                    <p className="text-xs text-gray-500">Verify user as Paid/Unpaid</p>
                                </div>
                                {customer.is_paid ? (
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                            </div>

                            <button
                                onClick={handleTogglePaid}
                                disabled={updateLoading}
                                className={`w-full mt-2 py-2 px-4 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${customer.is_paid
                                        ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                        : 'bg-[#4355FF] text-white shadow-md shadow-[#4355FF]/20 hover:bg-[#3644CC]'
                                    }`}
                            >
                                {updateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {customer.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                            </button>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div className="overflow-hidden">
                                    <p className="text-xs text-gray-500 font-medium">Email</p>
                                    <p className="text-sm text-gray-900 truncate" title={customer.email}>{customer.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Phone</p>
                                    <p className="text-sm text-gray-900">{customer.phone_number || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Address</p>
                                    <p className="text-sm text-gray-900 whitespace-pre-line">{customer.address || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Date Joined</p>
                                    <p className="text-sm text-gray-900">
                                        {new Date(customer.date_joined).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Business Profile */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-[#4355FF]" />
                            Business Profile
                        </h3>

                        {customer.business_profile ? (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Business Name</p>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {customer.business_profile.business_name || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        Business Hours
                                    </p>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {customer.business_profile.business_hours || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        Services Offered
                                    </p>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                                        {customer.business_profile.services_offered || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                                        Booking Policies
                                    </p>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                                        {customer.business_profile.booking_policies || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium">No Business Profile Found</p>
                                <p className="text-sm text-gray-400 mt-1">This user hasn't set up their business details yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
