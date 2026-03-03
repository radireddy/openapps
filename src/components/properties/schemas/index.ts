/**
 * Property schemas for all components
 * Import and register all schemas here
 * 
 * All components are now migrated to the metadata-driven system.
 * Properties are rendered using PropertyTabs with smart layouts.
 */

import { registerPropertySchema } from '../registry';
import { dividerSchema } from './divider';
import { inputSchema } from './input';
import { labelSchema } from './label';
import { buttonSchema } from './button';
import { textareaSchema } from './textarea';
import { selectSchema } from './select';
import { checkboxSchema } from './checkbox';
import { radioGroupSchema } from './radioGroup';
import { switchSchema } from './switch';
import { imageSchema } from './image';
import { tableSchema } from './table';
import { containerSchema } from './container';
import { listSchema } from './list';
import { datePickerSchema } from './datePicker';
import { timePickerSchema } from './timePicker';
import { sliderSchema } from './slider';
import { fileUploadSchema } from './fileUpload';
import { ratingSchema } from './rating';
import { progressSchema } from './progress';
import { formSchema } from './form';
import { modalSchema } from './modal';
import { tabsSchema } from './tabs';
import { accordionSchema } from './accordion';
import { customWidgetSchema } from './customWidget';

// Register all schemas
// Components using metadata-driven system will use PropertyTabs with smart layout to preserve original UX with efficient layouts
export function registerAllPropertySchemas(): void {
  // Schemas are available - when registered, components use metadata backend with tabs and smart layouts
  registerPropertySchema(dividerSchema);
  registerPropertySchema(inputSchema);
  registerPropertySchema(labelSchema);
  registerPropertySchema(buttonSchema);
  registerPropertySchema(textareaSchema);
  registerPropertySchema(selectSchema);
  registerPropertySchema(checkboxSchema);
  registerPropertySchema(radioGroupSchema);
  registerPropertySchema(switchSchema);
  registerPropertySchema(imageSchema);
  registerPropertySchema(tableSchema);
  registerPropertySchema(containerSchema);
  registerPropertySchema(listSchema);
  registerPropertySchema(datePickerSchema);
  registerPropertySchema(timePickerSchema);
  registerPropertySchema(sliderSchema);
  registerPropertySchema(fileUploadSchema);
  registerPropertySchema(ratingSchema);
  registerPropertySchema(progressSchema);
  registerPropertySchema(formSchema);
  registerPropertySchema(modalSchema);
  registerPropertySchema(tabsSchema);
  registerPropertySchema(accordionSchema);
  registerPropertySchema(customWidgetSchema);
}
