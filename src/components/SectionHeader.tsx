import React from 'react';
import { InfoTooltip } from './InfoTooltip';

export interface SectionHeaderProps {
  icon?: React.ReactNode;
  iconVariant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate' | 'default';
  title: React.ReactNode;
  info?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

const ICON_BG_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  blue: 'bg-blue-50 text-[#004AAD] border-blue-200/80',
  purple: 'bg-purple-50 text-[#5E17EB] border-purple-200/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  default: 'bg-emerald-50 text-[#2e7d32] border-emerald-200/80',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  iconVariant = 'default',
  title,
  info,
  badges,
  actions,
  className = '',
  titleClassName = '',
  as: Component = 'h3',
}) => {
  const iconStyle = ICON_BG_STYLES[iconVariant] || ICON_BG_STYLES.default;
  const defaultTitleClass =
    Component === 'h1'
      ? 'text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display'
      : Component === 'h2'
      ? 'text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-display'
      : 'text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-display';

  return (
    <div
      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={`p-2.5 sm:p-3 rounded-2xl border shadow-xs shrink-0 flex items-center justify-center ${iconStyle}`}
          >
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Component
              className={`${defaultTitleClass} ${titleClassName} flex items-center`}
            >
              <span>{title}</span>
              {info && <InfoTooltip text={info} />}
            </Component>
            {badges}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
