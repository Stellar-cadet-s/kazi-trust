import { HTMLAttributes, forwardRef } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'verified' | 'pending' | 'active';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'info', className = '', children, ...props }, ref) => {
    const variants = {
      success: 'bg-gradient-to-r from-[#006B3F] to-[#00A8E8] text-white shadow-lg',
      warning: 'bg-gradient-to-r from-[#FFB81C] to-[#FF8C00] text-white shadow-lg',
      error: 'bg-gradient-to-r from-[#BB0000] to-[#FF0000] text-white shadow-lg',
      info: 'bg-gradient-to-r from-[#00A8E8] to-[#7B3FF2] text-white shadow-lg',
      verified: 'bg-gradient-to-r from-[#7B3FF2] to-[#00A8E8] text-white shadow-lg',
      pending: 'bg-gradient-to-r from-[#FFB81C] to-[#FF8C00] text-white shadow-lg',
      active: 'bg-gradient-to-r from-[#006B3F] to-[#00A8E8] text-white shadow-lg animate-pulse'
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-110 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
