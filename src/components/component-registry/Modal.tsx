/**
 * Modal Component
 *
 * Portal-based dialog in preview mode; inline frame in edit mode.
 * Supports focus trap, backdrop click, Escape key, and body scroll lock.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { ComponentType, ModalProps, ComponentRendererProps } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { safeEval } from '../../expressions/engine';
import { buildBorderStyles, buildSpacingStyles } from './common';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const SIZE_MAP: Record<string, string> = {
  sm: '400px',
  md: '560px',
  lg: '720px',
  xl: '960px',
  fullscreen: '100vw',
};

const ModalRenderer: React.FC<ComponentRendererProps> = ({
  component,
  children,
  mode,
  actions,
  evaluationScope,
}) => {
  const p = component.props as ModalProps;
  const scope = evaluationScope || {};

  const isOpenRaw: any = useJavaScriptRenderer(p.isOpen, scope, '');
  const isOpen = isOpenRaw === true || isOpenRaw === 'true';
  const title = useJavaScriptRenderer(p.title, scope, '');
  const showCloseButton = p.showCloseButton !== false;
  const closeOnBackdrop = p.closeOnBackdrop !== false;
  const closeOnEsc = p.closeOnEsc !== false;
  const backdrop = p.backdrop || 'dark';
  const size = p.size || 'md';
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, scope, '#ffffff');
  const borderRadius = useJavaScriptRenderer(p.borderRadius, scope, '8px');
  const padding = useJavaScriptRenderer(p.padding, scope, '24px');

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleClose = useCallback(() => {
    if (mode !== 'preview' || !p.onClose) return;
    try {
      const closeScope = { ...scope, actions };
      const expr = p.onClose.startsWith('{{') && p.onClose.endsWith('}}')
        ? p.onClose.substring(2, p.onClose.length - 2).trim()
        : p.onClose;
      safeEval(expr, closeScope);
    } catch (error) {
      console.error('Error executing modal onClose:', error);
    }
  }, [mode, p.onClose, scope, actions]);

  // Escape key handler
  useEffect(() => {
    if (mode !== 'preview' || !isOpen || !closeOnEsc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mode, isOpen, closeOnEsc, handleClose]);

  // Body scroll lock and focus management
  useEffect(() => {
    if (mode !== 'preview' || !isOpen) return;
    previousActiveElement.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    requestAnimationFrame(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      }
    });

    return () => {
      document.body.style.overflow = '';
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [mode, isOpen]);

  // Focus trap
  useEffect(() => {
    if (mode !== 'preview' || !isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mode, isOpen]);

  const maxWidth = SIZE_MAP[size] || SIZE_MAP.md;

  // ─── Edit mode: inline frame ────────────────────────────────
  if (mode === 'edit') {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100%',
          border: '2px dashed #94a3b8',
          borderRadius: typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`,
          backgroundColor: typeof backgroundColor === 'string' ? backgroundColor : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
        data-testid={`modal-edit-${component.id}`}
      >
        {/* Modal header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            borderRadius: `${typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`} ${typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`} 0 0`,
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            {title || 'Modal'}
          </span>
          {showCloseButton && (
            <span style={{ fontSize: '16px', color: '#94a3b8', cursor: 'default' }} aria-hidden="true">&times;</span>
          )}
        </div>
        {/* Modal body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: typeof padding === 'string' ? padding : `${padding}px`,
            gap: '12px',
            alignItems: 'stretch',
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  // ─── Preview mode: portal ───────────────────────────────────
  if (!isOpen) return null;

  const backdropColor = backdrop === 'dark'
    ? 'rgba(0,0,0,0.5)'
    : backdrop === 'light'
      ? 'rgba(0,0,0,0.15)'
      : 'transparent';

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: size === 'fullscreen' ? 'stretch' : 'center',
        justifyContent: 'center',
        backgroundColor: backdropColor,
        animation: 'modalFadeIn 0.2s ease-out',
      }}
      onClick={closeOnBackdrop ? handleClose : undefined}
      data-testid={`modal-backdrop-${component.id}`}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`modal-title-${component.id}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: typeof backgroundColor === 'string' ? backgroundColor : '#ffffff',
          borderRadius: size === 'fullscreen' ? '0' : (typeof borderRadius === 'string' ? borderRadius : `${borderRadius}px`),
          width: size === 'fullscreen' ? '100%' : '90%',
          maxWidth,
          maxHeight: size === 'fullscreen' ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'modalSlideIn 0.2s ease-out',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0,
            }}
          >
            <h2
              id={`modal-title-${component.id}`}
              style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            )}
          </div>
        )}
        {/* Body */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: typeof padding === 'string' ? padding : `${padding}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'stretch',
          }}
        >
          {children}
          {React.Children.toArray(children).length === 0 && (
            <div style={{
              border: '1px dashed #d1d5db',
              borderRadius: '4px',
              padding: '12px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '12px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              Empty container
            </div>
          )}
        </div>
      </div>

      {/* CSS animations injected via style tag */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export const ModalPlugin = {
  type: ComponentType.MODAL,
  isContainer: true,
  paletteConfig: {
    label: 'Modal',
    icon: React.createElement('svg', {
      style: iconStyle,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg',
    },
      React.createElement('rect', {
        x: '2', y: '4', width: '20', height: '16', rx: '2',
        stroke: 'currentColor', strokeWidth: '2',
      }),
      React.createElement('line', {
        x1: '2', y1: '8', x2: '22', y2: '8',
        stroke: 'currentColor', strokeWidth: '1.5',
      }),
      React.createElement('line', {
        x1: '18', y1: '5.5', x2: '20', y2: '7.5',
        stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round',
      }),
      React.createElement('line', {
        x1: '20', y1: '5.5', x2: '18', y2: '7.5',
        stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round',
      }),
    ),
    defaultProps: {
      width: '100%',
      height: 'auto',
      minHeight: 100,
      backgroundColor: '#ffffff',
      borderWidth: '0',
      borderColor: '{{theme.colors.border}}',
      borderRadius: '8px',
      padding: '24px',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: '12px',
      isOpen: '{{false}}',
      title: 'Modal Title',
      size: 'md',
      showCloseButton: true,
      closeOnBackdrop: true,
      closeOnEsc: true,
      onClose: '',
      onOpen: '',
      backdrop: 'dark',
    },
  },
  renderer: ModalRenderer,
  properties: () => null,
};
