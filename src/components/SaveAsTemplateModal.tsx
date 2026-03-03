import React, { useState, useRef, useEffect } from 'react';
import { AppTemplate, AppDefinition } from '../types';
import { generateThumbnail } from '@/utils/generateThumbnail';

interface SaveAsTemplateModalProps {
  appName: string;
  onClose: () => void;
  onSave: (templateData: Omit<AppTemplate, 'id' | 'appDefinition'>) => void;
  initialDescription?: string;
  initialImageUrl?: string;
  appDefinition?: AppDefinition;
}

const DEFAULT_IMAGE_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMCIgeTE9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNGY0NmU1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTFiYmY4Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjI0MCIgaGVpZ2h0PSIxMzUiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSIxMjAiIHk9Ijc1IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIyMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIj5BcHA+PC90ZXh0Pjwvc3ZnPg==';


export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({ appName, onClose, onSave, initialDescription, initialImageUrl, appDefinition }) => {
  const isEditMode = initialDescription !== undefined || initialImageUrl !== undefined;
  const [name, setName] = useState(isEditMode ? appName : `${appName} Template`);
  const [description, setDescription] = useState(initialDescription || '');
  const [imageUrl, setImageUrl] = useState(initialImageUrl || DEFAULT_IMAGE_URL);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate thumbnail on mount when appDefinition is available and no custom image set
  useEffect(() => {
    if (appDefinition && !initialImageUrl) {
      handleAutoGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoGenerate = async () => {
    if (!appDefinition || isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await generateThumbnail(appDefinition);
      if (result) {
        setImageUrl(result);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 480;
        const MAX_HEIGHT = 270;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setImageUrl(canvas.toDataURL('image/jpeg', 0.7));
        }
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim(), description, imageUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--ed-overlay)] ed-glass animate-ed-fade-in z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-ed-bg rounded-lg shadow-ed-modal animate-ed-scale-in w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-ed-text mb-4">{isEditMode ? 'Edit Template' : 'Save as Template'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ed-text-secondary mb-1">Template Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent" autoFocus />
            </div>
            <div>
              <label htmlFor="template-description" className="block text-sm font-medium text-ed-text-secondary mb-1">Description</label>
              <textarea id="template-description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-ed-bg-secondary border border-ed-border rounded-md p-2 text-sm text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent" rows={3}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-ed-text-secondary mb-1">Thumbnail</label>
              <div className="flex items-center gap-3">
                <div className="relative w-32 h-20 flex-shrink-0">
                  <img src={imageUrl} alt="Template thumbnail" className="w-full h-full object-cover rounded-md border border-ed-border" />
                  {isGenerating && (
                    <div className="absolute inset-0 bg-ed-bg/70 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-ed-accent animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-semibold text-ed-text-secondary bg-ed-bg-tertiary rounded-md hover:bg-ed-bg-surface">
                    Upload Image
                  </button>
                  {appDefinition && (
                    <button
                      onClick={handleAutoGenerate}
                      disabled={isGenerating}
                      className="px-3 py-1.5 text-sm font-semibold text-ed-accent bg-ed-accent/10 rounded-md hover:bg-ed-accent/20 disabled:opacity-50"
                    >
                      {isGenerating ? 'Generating...' : 'Auto-Generate'}
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-ed-bg-secondary border-t border-ed-border rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-ed-text-secondary bg-ed-bg border border-ed-border rounded-md hover:bg-ed-bg-tertiary">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 text-sm font-semibold text-ed-text-inverse bg-ed-accent rounded-md hover:bg-ed-accent-hover disabled:bg-ed-text-tertiary">{isEditMode ? 'Update Template' : 'Save Template'}</button>
        </div>
      </div>
    </div>
  );
};
