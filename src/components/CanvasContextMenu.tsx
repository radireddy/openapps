import React, { useEffect, useRef } from 'react';
import { typography } from '@/constants';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onSaveAsPreset: () => void;
  onClose: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x, y, onSaveAsPreset, onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-ed-bg border border-ed-border rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onSaveAsPreset(); onClose(); }}
        className={`w-full text-left px-3 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover flex items-center gap-2`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save as Preset
      </button>
    </div>
  );
};
