import React, { useState, useEffect, useRef } from 'react';
import { WidgetDefinition } from '@/types';
import { typography } from '@/constants';

// Gradient colors for widget card headers
const WIDGET_GRADIENTS = [
  'from-violet-500/20 to-fuchsia-500/20',
  'from-fuchsia-500/20 to-pink-500/20',
  'from-purple-500/20 to-violet-500/20',
  'from-indigo-500/20 to-purple-500/20',
  'from-pink-500/20 to-rose-500/20',
  'from-violet-500/20 to-indigo-500/20',
];

function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return WIDGET_GRADIENTS[Math.abs(hash) % WIDGET_GRADIENTS.length];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const WidgetCard: React.FC<{
  widget: WidgetDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onRename: () => void;
}> = ({ widget, onEdit, onDelete, onDuplicate, onExport, onRename }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const gradient = nameToGradient(widget.name);

  return (
    <div
      className="bg-ed-bg border border-ed-border rounded-xl shadow-ed-card hover:shadow-ed-card-hover ed-card-interactive flex flex-col group cursor-pointer"
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit(); } }}
      aria-label={`Edit widget: ${widget.name}`}
    >
      {/* Thumbnail or gradient header */}
      {widget.thumbnail ? (
        <div className="h-24 rounded-t-xl overflow-hidden">
          <img src={widget.thumbnail} alt={widget.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className={`h-24 rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {/* Cube/box icon */}
          <svg className="w-8 h-8 text-ed-text/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
      )}

      <div className="p-4 flex-grow">
        <h3 className={`${typography.group} ${typography.bold} text-ed-text mb-1 truncate group-hover:text-ed-accent-text transition-colors`}>
          {widget.name}
        </h3>
        {widget.description && (
          <p className={`${typography.caption} text-ed-text-secondary line-clamp-2 mb-2`}>{widget.description}</p>
        )}
        <div className="flex items-center gap-3">
          <span className={`${typography.caption} text-ed-text-tertiary`}>
            {widget.inputs.length} input{widget.inputs.length !== 1 ? 's' : ''}
          </span>
          <span className={`${typography.caption} text-ed-text-tertiary`}>
            {widget.outputs.length} output{widget.outputs.length !== 1 ? 's' : ''}
          </span>
        </div>
        {widget.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {widget.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-2 py-0.5 ${typography.caption} text-ed-text-secondary bg-ed-bg-tertiary rounded-full`}
              >
                {tag}
              </span>
            ))}
            {widget.tags.length > 3 && (
              <span className={`${typography.caption} text-ed-text-tertiary`}>+{widget.tags.length - 3}</span>
            )}
          </div>
        )}
        <p className={`${typography.caption} text-ed-text-tertiary mt-2`}>
          Modified {relativeTime(widget.lastModifiedAt)}
        </p>
      </div>

      <div className="border-t border-ed-border px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`px-3 py-1.5 ${typography.body} ${typography.semibold} text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover`}
          >
            Edit
          </button>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
            className="p-1.5 text-ed-text-secondary hover:bg-ed-bg-hover rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {isMenuOpen && (
            <div
              className="absolute bottom-full right-0 mb-2 w-48 bg-ed-bg rounded-lg shadow-ed-dropdown border border-ed-border z-10 py-1 animate-ed-fade-in-up"
              onClick={(e) => e.stopPropagation()}
            >
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onEdit); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Edit</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onRename); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Rename</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onDuplicate); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Duplicate</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onExport); }} className={`block px-4 py-2 ${typography.body} text-ed-text hover:bg-ed-bg-hover`}>Export</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleActionClick(onDelete); }} className={`block px-4 py-2 ${typography.body} text-ed-danger hover:bg-ed-danger-muted`}>Delete</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
