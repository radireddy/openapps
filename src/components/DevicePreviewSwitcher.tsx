import React from 'react';
import { DeviceKey } from '@/hooks/useDevicePreview';

interface DevicePreviewSwitcherProps {
  activeDevice: DeviceKey;
  onSetDevice: (device: DeviceKey) => void;
}

const devices: { key: DeviceKey; label: string; width: string; icon: React.ReactNode }[] = [
  {
    key: 'mobile',
    label: 'Mobile',
    width: '375px',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2} />
        <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'tablet',
    label: 'Tablet',
    width: '768px',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={2} />
        <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'desktop',
    label: 'Desktop',
    width: '1280px',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth={2} />
        <line x1="8" y1="21" x2="16" y2="21" strokeWidth={2} strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'fullWidth',
    label: 'Full',
    width: 'Auto',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
  },
];

export const DevicePreviewSwitcher: React.FC<DevicePreviewSwitcherProps> = ({
  activeDevice,
  onSetDevice,
}) => {
  return (
    <div className="flex items-center gap-0.5 bg-ed-bg-tertiary rounded-md p-0.5" data-testid="device-preview-switcher">
      {devices.map(({ key, label, width, icon }) => (
        <button
          key={key}
          onClick={() => onSetDevice(key)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${
            activeDevice === key
              ? 'bg-ed-bg text-ed-accent-text shadow-ed-sm'
              : 'text-ed-text-secondary hover:text-ed-text hover:bg-ed-bg-hover'
          }`}
          title={`${label} (${width})`}
          aria-label={`${label} viewport (${width})`}
          data-testid={`device-${key}`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};
