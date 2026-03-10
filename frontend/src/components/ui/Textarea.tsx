import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export const Textarea = ({ label, className, error, ...props }: TextareaProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <textarea
          className={`w-full px-4 py-3 rounded-md border transition-all text-gray-800 placeholder:text-gray-400 min-h-[100px] resize-y focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
              : 'border-gray-200 focus:ring-[#4355FF]/20 focus:border-[#4355FF]'
          } ${className || ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};
