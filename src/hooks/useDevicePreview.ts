import { useState, useCallback } from 'react';
import { BreakpointKey } from '@/types';
import { DEVICE_PRESETS, getBreakpointForWidth } from '@/responsive';

export type DeviceKey = 'mobile' | 'tablet' | 'desktop' | 'fullWidth';

export interface DevicePreviewState {
  /** Currently selected device preset */
  activeDevice: DeviceKey;
  /** Preview width in px (null = full width) */
  previewWidth: number | null;
  /** Active breakpoint based on preview width */
  activeBreakpoint: BreakpointKey;
  /** Set the active device preset */
  setDevice: (device: DeviceKey) => void;
}

export function useDevicePreview(): DevicePreviewState {
  const [activeDevice, setActiveDevice] = useState<DeviceKey>('fullWidth');

  const preset = DEVICE_PRESETS[activeDevice];
  const previewWidth = preset?.width ?? null;
  // Full width (null) edits base props (mobile), not a responsive override
  const activeBreakpoint = previewWidth
    ? getBreakpointForWidth(previewWidth)
    : 'mobile' as BreakpointKey;

  const setDevice = useCallback((device: DeviceKey) => {
    setActiveDevice(device);
  }, []);

  return {
    activeDevice,
    previewWidth,
    activeBreakpoint,
    setDevice,
  };
}
