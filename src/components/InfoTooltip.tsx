import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export interface InfoTooltipProps {
  text: React.ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
  position?: 'top' | 'bottom' | 'auto';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  title,
  className = '',
  iconClassName = 'w-3.5 h-3.5 text-slate-400 hover:text-[#004AAD] transition-colors',
  position = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: true,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 260; // Approximate default max-width
    const gap = 8;

    let placeAbove = true;
    if (position === 'bottom') {
      placeAbove = false;
    } else if (position === 'top') {
      placeAbove = true;
    } else {
      // auto: if near top of viewport (< 90px), place below
      placeAbove = rect.top >= 90;
    }

    // Horizontal centering relative to trigger
    let left = rect.left + rect.width / 2;
    // Keep inside viewport with margin
    const margin = 12;
    const halfWidth = tooltipWidth / 2;
    if (left - halfWidth < margin) {
      left = margin + halfWidth;
    } else if (left + halfWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - halfWidth;
    }

    const top = placeAbove ? rect.top - gap : rect.bottom + gap;

    setCoords({ top, left, placeAbove });
  };

  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  // Close on outside click or scroll or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const rawText = typeof text === 'string' ? text : 'Mais informações explicativas';

  return (
    <span className={`inline-flex items-center align-middle relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label={rawText}
        title={rawText}
        className="inline-flex items-center justify-center p-0.5 ml-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-400 hover:text-[#004AAD] transition-all cursor-pointer select-none"
      >
        <Info className={iconClassName} />
      </button>

      {isOpen &&
        createPortal(
          <div
            id={tooltipId}
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.placeAbove
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, 0)',
              zIndex: 99999,
            }}
            className="w-max max-w-[280px] sm:max-w-xs bg-slate-900/95 backdrop-blur-xs text-slate-100 text-xs px-3 py-2 rounded-xl shadow-2xl border border-slate-700/80 pointer-events-auto leading-relaxed select-text font-normal normal-case tracking-normal animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="font-bold text-emerald-400 mb-1 text-[11px] tracking-wide uppercase">
                {title}
              </div>
            )}
            <div className="text-slate-200 text-[11px] sm:text-xs font-normal">
              {text}
            </div>
            {/* Arrow indicator */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                [coords.placeAbove ? 'bottom' : 'top']: '-4px',
              }}
              className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700/80 rotate-45"
            />
          </div>,
          document.body
        )}
    </span>
  );
};

export default InfoTooltip;
