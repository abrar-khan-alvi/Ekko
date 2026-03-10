import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  className?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const Input = ({ label, icon, onIconClick, className, error, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          className={`w-full px-4 py-3 rounded-md border transition-all text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
              : 'border-gray-200 focus:ring-[#4355FF]/20 focus:border-[#4355FF]'
          } ${className || ''}`}
          {...props}
        />
        {icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {icon}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};
