import { ComponentType } from '../../../types';
import { ComponentPropertySchema, PropertyMetadata, PropertyGroup } from '../metadata';
import { commonTabs, commonGroups, createPropertySchema, DEFAULT_GROUP_ORDER, formValidationProperties, formAccessibilityProperties, formStateProperties, formGroups } from '../registry';
import { EventsGroupRenderer } from './input-events-renderer';

const fileUploadProperties: PropertyMetadata[] = [
  {
    id: 'label', label: 'Label', type: 'expression', defaultValue: '',
    supportsExpression: true, group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: -1,
    applicableTo: [ComponentType.FILE_UPLOAD],
    placeholder: 'e.g. Upload Documents',
  },
  {
    id: 'placeholder', label: 'Placeholder', type: 'string', defaultValue: 'Drag & drop files here, or click to browse',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.FILE_UPLOAD],
  },
  {
    id: 'accept', label: 'Accepted Types', type: 'string', defaultValue: '',
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.FILE_UPLOAD],
    tooltip: 'Comma-separated file types (e.g., .jpg,.png,.pdf or image/*)',
    placeholder: 'e.g. .jpg,.png,.pdf',
  },
  {
    id: 'multiple', label: 'Multiple Files', type: 'boolean', defaultValue: false,
    group: 'Basic', tab: 'General',
    tabOrder: 0, groupOrder: 0, propertyOrder: 2,
    applicableTo: [ComponentType.FILE_UPLOAD],
  },
  {
    id: 'maxFileSize', label: 'Max File Size (bytes)', type: 'number', defaultValue: 10485760,
    group: 'Validation', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Validation'], propertyOrder: 3,
    applicableTo: [ComponentType.FILE_UPLOAD],
    tooltip: 'Maximum size per file in bytes (default 10MB)',
  },
  {
    id: 'maxFiles', label: 'Max Files', type: 'number', defaultValue: 5,
    group: 'Validation', tab: 'General',
    tabOrder: 0, groupOrder: DEFAULT_GROUP_ORDER['Validation'], propertyOrder: 4,
    applicableTo: [ComponentType.FILE_UPLOAD],
    tooltip: 'Maximum number of files when multiple is enabled',
    visibleIf: (props) => (props as any).multiple === true,
  },
  // Styling
  {
    id: 'backgroundColor', label: 'Background', type: 'color', defaultValue: '#fafafa',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 0,
    applicableTo: [ComponentType.FILE_UPLOAD],
  },
  {
    id: 'color', label: 'Text Color', type: 'color', defaultValue: '#6b7280',
    supportsExpression: true, group: 'Styling', tab: 'Styles',
    tabOrder: 1, groupOrder: 0, propertyOrder: 1,
    applicableTo: [ComponentType.FILE_UPLOAD],
  },
  ...formValidationProperties.map(p => ({ ...p, applicableTo: [ComponentType.FILE_UPLOAD] as ComponentType[] })),
  ...formAccessibilityProperties.map(p => ({ ...p, applicableTo: [ComponentType.FILE_UPLOAD] as ComponentType[] })),
  ...formStateProperties.map(p => ({ ...p, applicableTo: [ComponentType.FILE_UPLOAD] as ComponentType[] })),
];

const fileUploadGroups: PropertyGroup[] = [
  ...formGroups,
  { id: 'Events', label: 'Events', tab: 'Events', collapsible: true, defaultCollapsed: false, customGroupRenderer: EventsGroupRenderer },
];

export const fileUploadSchema: ComponentPropertySchema = createPropertySchema(
  ComponentType.FILE_UPLOAD,
  fileUploadProperties,
  commonTabs,
  [...commonGroups, ...fileUploadGroups]
);
