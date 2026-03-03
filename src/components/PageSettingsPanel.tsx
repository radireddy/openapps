import React, { useState, useEffect } from 'react';
import { AppPage } from '../types';
import { fontSizePresets, fontWeightPresets } from './properties/schemas/typographyPresets';

interface PageSettingsPanelProps {
  page: AppPage;
  onUpdatePage: (pageId: string, updates: Partial<AppPage>) => void;
  isMainPage: boolean;
}

const fieldClass = "w-full px-2.5 py-1.5 text-xs bg-ed-bg border border-ed-border rounded-md text-ed-text placeholder:text-ed-text-tertiary focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent transition-colors";
const labelClass = "block text-[11px] font-medium text-ed-text-secondary mb-1";
const sectionClass = "text-[11px] font-semibold text-ed-text-secondary uppercase tracking-wider mb-2";

export const PageSettingsPanel: React.FC<PageSettingsPanelProps> = ({ page, onUpdatePage, isMainPage }) => {
  const [name, setName] = useState(page.name);
  const [title, setTitle] = useState(page.metadata?.title || '');
  const [description, setDescription] = useState(page.metadata?.description || '');
  const [ogImage, setOgImage] = useState(page.metadata?.ogImage || '');
  const [favicon, setFavicon] = useState(page.metadata?.favicon || '');
  const [textColor, setTextColor] = useState(page.textColor || '');
  const [textFontSize, setTextFontSize] = useState(page.textFontSize || '');
  const [textFontWeight, setTextFontWeight] = useState(page.textFontWeight || '');
  const [textFontFamily, setTextFontFamily] = useState(page.textFontFamily || '');

  // Sync local state when page prop changes (e.g., switching pages)
  useEffect(() => {
    setName(page.name);
    setTitle(page.metadata?.title || '');
    setDescription(page.metadata?.description || '');
    setOgImage(page.metadata?.ogImage || '');
    setFavicon(page.metadata?.favicon || '');
    setTextColor(page.textColor || '');
    setTextFontSize(page.textFontSize || '');
    setTextFontWeight(page.textFontWeight || '');
    setTextFontFamily(page.textFontFamily || '');
  }, [page.id, page.name, page.metadata, page.textColor, page.textFontSize, page.textFontWeight, page.textFontFamily]);

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== page.name) {
      onUpdatePage(page.id, { name: trimmed });
    }
  };

  const handleMetadataBlur = (field: 'title' | 'description' | 'ogImage' | 'favicon', value: string) => {
    const currentValue = page.metadata?.[field] || '';
    if (value !== currentValue) {
      onUpdatePage(page.id, {
        metadata: { ...page.metadata, [field]: value || undefined },
      });
    }
  };

  const handleTextStyleBlur = (field: 'textColor' | 'textFontSize' | 'textFontWeight' | 'textFontFamily', value: string) => {
    const currentValue = (page as any)[field] || '';
    if (value !== currentValue) {
      onUpdatePage(page.id, { [field]: value || undefined });
    }
  };

  return (
    <div className="p-3.5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ed-accent/20 to-ed-accent/5 text-ed-accent flex items-center justify-center ring-1 ring-ed-accent/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ed-text truncate">{page.name || 'Page Settings'}</h3>
          <span className="inline-flex items-center gap-1 mt-0.5 bg-ed-accent-muted/50 text-ed-text-tertiary text-[10px] px-1.5 py-0.5 rounded font-mono truncate max-w-[160px] border border-ed-accent/15">
            {page.id}
          </span>
        </div>
        {isMainPage && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ed-accent/15 text-ed-accent">
            Main Page
          </span>
        )}
      </div>

      {/* Page Settings Section */}
      <div>
        <h4 className={sectionClass}>Page Settings</h4>
        <div>
          <label htmlFor="page-name" className={labelClass}>Page Name</label>
          <input
            id="page-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className={fieldClass}
            aria-label="Page Name"
          />
        </div>
      </div>

      {/* SEO & Metadata Section */}
      <div>
        <h4 className={sectionClass}>SEO & Metadata</h4>
        <div className="space-y-3">
          <div>
            <label htmlFor="page-title" className={labelClass}>Page Title</label>
            <input
              id="page-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleMetadataBlur('title', title)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className={fieldClass}
              placeholder="e.g. My App - Home"
              aria-label="Page Title"
            />
          </div>
          <div>
            <label htmlFor="page-description" className={labelClass}>Meta Description</label>
            <textarea
              id="page-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleMetadataBlur('description', description)}
              className={`${fieldClass} resize-y min-h-[60px]`}
              placeholder="Brief description for search engines"
              aria-label="Meta Description"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="page-og-image" className={labelClass}>OG Image URL</label>
            <input
              id="page-og-image"
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              onBlur={() => handleMetadataBlur('ogImage', ogImage)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className={fieldClass}
              placeholder="https://example.com/og-image.png"
              aria-label="OG Image URL"
            />
          </div>
          <div>
            <label htmlFor="page-favicon" className={labelClass}>Favicon URL</label>
            <input
              id="page-favicon"
              type="text"
              value={favicon}
              onChange={(e) => setFavicon(e.target.value)}
              onBlur={() => handleMetadataBlur('favicon', favicon)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className={fieldClass}
              placeholder="https://example.com/favicon.ico"
              aria-label="Favicon URL"
            />
          </div>
        </div>
      </div>

      {/* Text Defaults Section */}
      <div>
        <h4 className={sectionClass}>Text Defaults</h4>
        <p className="text-[10px] text-ed-text-tertiary mb-3">
          Inherited by all child components that don't set their own values
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="page-text-color" className={labelClass}>Text Color</label>
            <div className="flex gap-2">
              <input
                id="page-text-color-picker"
                type="color"
                value={textColor || '#000000'}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  handleTextStyleBlur('textColor', e.target.value);
                }}
                className="w-8 h-8 rounded border border-ed-border cursor-pointer bg-transparent p-0.5"
                aria-label="Text Color Picker"
              />
              <input
                id="page-text-color"
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                onBlur={() => handleTextStyleBlur('textColor', textColor)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className={`${fieldClass} flex-1`}
                placeholder="e.g. #333333 or {{theme.colors.text}}"
                aria-label="Text Color"
              />
            </div>
          </div>
          <div>
            <label htmlFor="page-text-font-size" className={labelClass}>Text Font Size</label>
            <select
              id="page-text-font-size"
              value={textFontSize}
              onChange={(e) => {
                setTextFontSize(e.target.value);
                handleTextStyleBlur('textFontSize', e.target.value);
              }}
              className={fieldClass}
              aria-label="Text Font Size"
            >
              <option value="">Default</option>
              {fontSizePresets.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="page-text-font-weight" className={labelClass}>Text Font Weight</label>
            <select
              id="page-text-font-weight"
              value={textFontWeight}
              onChange={(e) => {
                setTextFontWeight(e.target.value);
                handleTextStyleBlur('textFontWeight', e.target.value);
              }}
              className={fieldClass}
              aria-label="Text Font Weight"
            >
              <option value="">Default</option>
              {fontWeightPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="page-text-font-family" className={labelClass}>Text Font Family</label>
            <input
              id="page-text-font-family"
              type="text"
              value={textFontFamily}
              onChange={(e) => setTextFontFamily(e.target.value)}
              onBlur={() => handleTextStyleBlur('textFontFamily', textFontFamily)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className={fieldClass}
              placeholder="e.g. Inter, sans-serif"
              aria-label="Text Font Family"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
