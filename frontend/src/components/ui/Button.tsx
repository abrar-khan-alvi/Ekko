import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline';
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Button = ({ children, variant = 'primary', className, ...props }: ButtonProps) => {
  const baseStyles = "w-full py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center";
  const variants = {
    primary: "bg-[#4355FF] text-white hover:bg-[#3644CC] shadow-sm hover:shadow-md",
    outline: "border-2 border-[#4355FF] text-[#4355FF] hover:bg-[#4355FF]/5"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
