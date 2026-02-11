import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'kenya' | 'stellar';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', isLoading = false, className = '', children, disabled, ...props }, ref) => {
    const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl';
    
    const variants = {
      primary: 'bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] text-white hover:from-[#6B2FE2] hover:to-[#0098D8]',
      secondary: 'bg-gradient-to-r from-[#006B3F] to-[#00A8E8] text-white hover:from-[#005B2F] hover:to-[#0098D8]',
      outline: 'border-2 border-[#7B3FF2] text-[#7B3FF2] hover:bg-[#7B3FF2] hover:text-white',
      kenya: 'bg-gradient-to-r from-[#BB0000] via-[#000000] to-[#006B3F] text-white',
      stellar: 'bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#FFB81C] text-white'
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'cursor-wait' : ''}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
