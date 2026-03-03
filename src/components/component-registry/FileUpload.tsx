import React, { useState, useRef, useCallback } from 'react';
import { ComponentType, FileUploadProps, ComponentPlugin, InputActionType } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { commonInputStylingProps } from '../../constants';
import { handleChangeEvent } from './event-handlers';
import { useFormField } from './useFormField';
import FormFieldWrapper from './FormFieldWrapper';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/** Format file size for display */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const FileUploadRenderer: React.FC<{
  component: { id: string; props: FileUploadProps };
  mode: 'edit' | 'preview';
  dataStore: Record<string, any>;
  onUpdateDataStore?: (key: string, value: any) => void;
  evaluationScope: Record<string, any>;
  actions?: any;
}> = ({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions }) => {
  const p = component.props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const maxFileSize = p.maxFileSize || 10 * 1024 * 1024; // 10MB default
  const maxFiles = p.maxFiles || 5;
  const accept = p.accept || '';

  const validateUpload = useCallback((value: any): string => {
    // Value will be the files array info
    return uploadError || '';
  }, [uploadError]);

  const {
    isDisabledInPreview, isReadOnly, isRequired,
    currentValue, setLocalValue,
    validationError, validateOnChange, forceValidate,
    sizeVariant, finalOpacity, helpText, labelText, boxShadowValue,
    pointerEventsStyle,
  } = useFormField({ component, mode, dataStore, onUpdateDataStore, evaluationScope, actions, validate: validateUpload });

  const borderRadius = useJavaScriptRenderer(p.borderRadius, evaluationScope, '8px');
  const borderWidth = useJavaScriptRenderer(p.borderWidth, evaluationScope, '2px');
  const borderColor = useJavaScriptRenderer(p.borderColor, evaluationScope, '#e5e7eb');
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#6b7280');
  const backgroundColor = useJavaScriptRenderer(p.backgroundColor, evaluationScope, '#fafafa');
  const fontSize = useJavaScriptRenderer(p.fontSize, evaluationScope, undefined);

  const themeColors = evaluationScope?.theme?.colors;
  const themeTextColor = themeColors?.text;
  const primaryColor = themeColors?.primary || '#4f46e5';

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const matchesAny = acceptedTypes.some(type => {
        if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
        if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', '/'));
        return file.type === type;
      });
      if (!matchesAny) return `${file.name} is not an accepted file type`;
    }
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles || isReadOnly || isDisabledInPreview) return;
    setUploadError('');

    const fileArray = Array.from(newFiles);
    const totalFiles = p.multiple ? files.length + fileArray.length : fileArray.length;

    if (p.multiple && totalFiles > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) { setUploadError(err); return; }
    }

    const newFileInfos = fileArray.map(f => ({ name: f.name, size: f.size, type: f.type }));
    const updatedFiles = p.multiple ? [...files, ...newFileInfos] : newFileInfos;
    setFiles(updatedFiles);
    setLocalValue(updatedFiles.length > 0 ? JSON.stringify(updatedFiles.map(f => f.name)) : '');
    if (onUpdateDataStore) onUpdateDataStore(component.id, updatedFiles);
    validateOnChange(updatedFiles.length > 0 ? 'has-files' : '');

    handleChangeEvent(p, { mode, evaluationScope, actions, onUpdateDataStore }, { target: { value: updatedFiles } } as any);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setUploadError('');
    setLocalValue(updatedFiles.length > 0 ? JSON.stringify(updatedFiles.map(f => f.name)) : '');
    if (onUpdateDataStore) onUpdateDataStore(component.id, updatedFiles);
    // Force validate when all files removed (like clearing), otherwise normal onChange
    if (updatedFiles.length === 0) {
      forceValidate('');
    } else {
      validateOnChange('has-files');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (mode === 'preview') handleFiles(e.dataTransfer.files);
  };

  const dropZoneStyle: React.CSSProperties = {
    borderRadius,
    borderWidth,
    borderColor: isDragOver ? primaryColor : borderColor,
    borderStyle: 'dashed',
    backgroundColor: isDragOver ? `${primaryColor}08` : backgroundColor,
    color,
    opacity: finalOpacity,
    boxShadow: boxShadowValue || undefined,
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    cursor: isDisabledInPreview ? 'not-allowed' : 'pointer',
    transition: 'border-color 0.2s, background-color 0.2s',
    boxSizing: 'border-box', padding: '16px',
    ...pointerEventsStyle,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FormFieldWrapper
        componentId={component.id} mode={mode}
        label={labelText ? String(labelText) : undefined}
        required={isRequired}
        helpText={helpText ? String(helpText) : undefined}
        errorMessage={validationError || uploadError || undefined}
        textColor={themeTextColor} errorColor={themeColors?.error}
      >
        <div
          style={dropZoneStyle}
          onDragOver={mode === 'preview' ? handleDragOver : undefined}
          onDragLeave={mode === 'preview' ? handleDragLeave : undefined}
          onDrop={mode === 'preview' ? handleDrop : undefined}
          onClick={() => { if (mode === 'preview' && !isReadOnly && !isDisabledInPreview) fileInputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          aria-label={p.accessibilityLabel || 'File upload area'}
          aria-disabled={isDisabledInPreview}
          data-testid="file-upload-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={p.multiple || false}
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
            disabled={isDisabledInPreview}
            aria-hidden="true"
          />

          {files.length === 0 ? (
            <>
              {/* Upload icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? primaryColor : (themeTextColor ? `${themeTextColor}60` : '#9ca3af')} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: fontSize || '13px', color: themeTextColor ? `${themeTextColor}99` : '#6b7280', textAlign: 'center' }}>
                {p.placeholder || 'Drag & drop files here, or click to browse'}
              </span>
              {accept && (
                <span style={{ fontSize: '11px', color: themeTextColor ? `${themeTextColor}60` : '#9ca3af', marginTop: '4px' }}>
                  Accepted: {accept}
                </span>
              )}
            </>
          ) : (
            <div style={{ width: '100%', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
              {files.map((file, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', marginBottom: '4px',
                  backgroundColor: themeColors?.background || '#f3f4f6',
                  borderRadius: '4px', fontSize: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span style={{ color: themeTextColor || '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ color: themeTextColor ? `${themeTextColor}60` : '#9ca3af', flexShrink: 0 }}>({formatFileSize(file.size)})</span>
                  </div>
                  {mode === 'preview' && !isReadOnly && (
                    <button type="button" onClick={() => handleRemoveFile(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColors?.error || '#dc2626', padding: '2px', flexShrink: 0 }}
                      aria-label={`Remove ${file.name}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              ))}
              {p.multiple && files.length < maxFiles && mode === 'preview' && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '12px', color: primaryColor, background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
                  + Add more files
                </button>
              )}
            </div>
          )}
        </div>
      </FormFieldWrapper>
    </div>
  );
};

export const FileUploadPlugin: ComponentPlugin = {
  type: ComponentType.FILE_UPLOAD,
  paletteConfig: {
    label: 'File Upload',
    icon: React.createElement('svg', { style: iconStyle, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
      React.createElement('path', { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement('polyline', { points: '17 8 12 3 7 8', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement('line', { x1: '12', y1: '3', x2: '12', y2: '15', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round' }),
    ),
    defaultProps: {
      ...commonInputStylingProps,
      label: '',
      placeholder: 'Drag & drop files here, or click to browse',
      accept: '',
      multiple: false,
      maxFileSize: 10485760, // 10MB
      maxFiles: 5,
      borderStyle: 'dashed' as const,
      borderWidth: '2px',
      borderRadius: '8px',
      backgroundColor: '{{theme.colors.background}}',
      width: '100%',
      height: 'auto',
      disabled: false,
      required: false,
      validationTiming: 'onBlur',
      readOnly: false,
      size: 'md',
      helpText: '',
      onChangeActionType: 'none' as InputActionType,
    },
  },
  renderer: FileUploadRenderer,
  properties: () => null,
};
