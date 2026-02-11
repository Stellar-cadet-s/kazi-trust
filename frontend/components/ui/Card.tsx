import { HTMLAttributes, forwardRef, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  gradient?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, hover = false, gradient = false, ...props }, ref) => {
    const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer' : '';
    const gradientBorder = gradient ? 'bg-gradient-to-r from-[#7B3FF2] via-[#00A8E8] to-[#006B3F] p-[2px]' : '';
    
    return (
      <div
        ref={ref}
        className={`${gradientBorder} rounded-2xl transition-all duration-300`}
        {...props}
      >
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${hoverStyles} ${className}`}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
