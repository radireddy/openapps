import { DropdownOption } from '../metadata';

/**
 * Typography scale preset options for fontSize dropdowns.
 * Uses theme tokens so values stay in sync with the theme.
 */
export const fontSizePresets: DropdownOption[] = [
  { value: '{{theme.typography.fontSizeXxxl}}', label: 'Heading 1 (30px)' },
  { value: '{{theme.typography.fontSizeXxl}}', label: 'Heading 2 (24px)' },
  { value: '{{theme.typography.fontSizeXl}}', label: 'Heading 3 (20px)' },
  { value: '{{theme.typography.fontSizeLg}}', label: 'Body Large (16px)' },
  { value: '{{theme.typography.fontSizeMd}}', label: 'Body (14px)' },
  { value: '{{theme.typography.fontSizeSm}}', label: 'Caption (12px)' },
  { value: '{{theme.typography.fontSizeXs}}', label: 'Small (10px)' },
];

/**
 * Font weight preset options for fontWeight dropdowns.
 * Uses theme tokens so values stay in sync with the theme.
 */
export const fontWeightPresets: DropdownOption[] = [
  { value: '{{theme.typography.fontWeightLight}}', label: 'Light (300)' },
  { value: '{{theme.typography.fontWeightNormal}}', label: 'Normal (400)' },
  { value: '{{theme.typography.fontWeightMedium}}', label: 'Medium (500)' },
  { value: '{{theme.typography.fontWeightSemibold}}', label: 'Semi Bold (600)' },
  { value: '{{theme.typography.fontWeightBold}}', label: 'Bold (700)' },
];
