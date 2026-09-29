import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500/40 border border-transparent',
  secondary:
    'bg-[#004AAD] hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500/40 border border-transparent',
  outline:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300 focus:ring-slate-400/30',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent focus:ring-slate-300/40',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500/40 border border-transparent',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs rounded-xl gap-1.5',
  md: 'h-10 sm:h-11 px-4 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-sm sm:text-base rounded-2xl gap-2.5',
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 cursor-pointer select-none active:scale-[0.98] focus:outline-hidden focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

export default ActionButton;
