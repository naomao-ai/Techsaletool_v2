import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string; // e.g. 'max-w-sm'
  defaultPos?: { x: number, y: number };
}

export default function DraggableModal({ isOpen, onClose, title, children, icon, className = 'max-w-sm', defaultPos }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
       // Just opened
       if (defaultPos) {
           setPos({ x: defaultPos.x, y: defaultPos.y });
       } else {
           setPos({ x: 0, y: 0 });
       }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, defaultPos?.x, defaultPos?.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { x: pos.x, y: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPos({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none flex z-[100] animate-fade-slide-up ${defaultPos ? 'items-start justify-start' : 'items-center justify-center'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-surface-lowest/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      {/* Draggable window */}
      <div 
        className={`bg-brand-surface border border-brand-outline-variant rounded-2xl w-full flex flex-col shadow-2xl relative pointer-events-auto ${className}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        <div 
          className="flex justify-between items-center px-6 pt-5 pb-3 cursor-move select-none border-b border-brand-outline-variant"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="flex items-center gap-2 text-sm font-bold text-brand-on-surface">
             {icon}
             <span>{title}</span>
          </div>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={onClose} className="text-brand-outline hover:text-brand-on-surface cursor-pointer p-1 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
