import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const Textarea = ({ label, className, ...props }: TextareaProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <textarea
          className={`w-full px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all text-gray-800 placeholder:text-gray-400 min-h-[100px] resize-y ${className || ''}`}
          {...props}
        />
      </div>
    </div>
  );
};
