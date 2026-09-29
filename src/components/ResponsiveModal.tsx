import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-2xl', 'max-w-lg', 'max-w-xl'
  showCloseButton?: boolean;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  showCloseButton = true
}: ResponsiveModalProps) {
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Mobile touch handlers for dragging down to dismiss (like iOS gallery in WhatsApp)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 90) {
      onClose();
    }
    setDragY(0);
    touchStartY.current = null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center pointer-events-auto">
          {/* Backdrop with dark blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container: Bottom sheet on mobile, centered dialog on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_e, info: PanInfo) => {
              if (info.offset.y > 80 || info.velocity.y > 250) {
                onClose();
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              transition: dragY === 0 ? 'transform 0.2s ease-out' : 'none'
            }}
            className={`relative z-10 w-full ${maxWidth} bg-white rounded-t-[32px] md:rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] md:m-4`}
          >
            {/* Mobile Drag Handle Indicator (WhatsApp iOS style) */}
            <div className="w-full flex flex-col items-center pt-2.5 pb-1 md:hidden cursor-grab active:cursor-grabbing select-none">
              <div className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
              <span className="text-[10px] text-slate-400 font-medium mt-1">Arraste para baixo para fechar</span>
            </div>

            {/* Header */}
            {(title || icon || showCloseButton) && (
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                  )}
                  <div>
                    {typeof title === 'string' ? (
                      <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center">
                        <span>{title}</span>
                        {subtitle && <InfoTooltip text={subtitle} />}
                      </h3>
                    ) : (
                      <div className="flex items-center">
                        {title}
                        {subtitle && <InfoTooltip text={subtitle} />}
                      </div>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Fechar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
