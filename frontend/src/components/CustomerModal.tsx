import React, { useState } from 'react';
import { User, Upload } from 'lucide-react';

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    initialData?: any;
}

export const CustomerModal = ({ isOpen, onClose, mode, initialData }: CustomerModalProps) => {
    if (!isOpen) return null;

    const isEdit = mode === 'edit';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-[22px] font-bold text-gray-900 mb-1">
                            {isEdit ? "Edit Profile Information" : "Add New Customer"}
                        </h2>
                    </div>

                    {/* Form */}
                    <form className="space-y-5">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50 relative overflow-hidden group">
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <span className="text-[10px] text-gray-500 font-medium">Upload</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                                <input
                                    type="text"
                                    defaultValue={initialData?.firstName || ""}
                                    placeholder="e.g. jason"
                                    className="w-full px-4 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    defaultValue={initialData?.lastName || ""}
                                    placeholder="e.g. morly"
                                    className="w-full px-4 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    defaultValue={initialData?.email || ""}
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] text-sm transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                                <input
                                    type="tel"
                                    defaultValue={initialData?.phone || ""}
                                    placeholder="+123456789"
                                    className="w-full px-4 py-2.5 bg-[#F9FAFB] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional details</label>
                            <textarea
                                rows={3}
                                placeholder="Type something..."
                                className="w-full px-4 py-3 bg-[#F9FAFB] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] text-sm resize-none transition-all"
                            ></textarea>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white rounded-xl hover:bg-gray-100 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-6 py-2.5 text-sm font-medium text-white bg-[#3041F5] rounded-xl hover:bg-[#2838DD] focus:outline-none shadow-md shadow-[#3041F5]/20"
                            >
                                {isEdit ? "Update profile" : "Add Customer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
