import { ComponentType, ComponentPlugin } from '../../types';
import { ButtonPlugin } from './Button';
import { CheckboxPlugin } from './Checkbox';
import { ContainerPlugin } from './Container';
import { DividerPlugin } from './Divider';
import { ImagePlugin } from './Image';
import { InputPlugin } from './Input';
import { LabelPlugin } from './Label';
import { RadioGroupPlugin } from './RadioGroup';
import { SelectPlugin } from './Select';
import { SwitchPlugin } from './Switch';
import { TablePlugin } from './Table';
import { TextareaPlugin } from './Textarea';
import { ListPlugin } from './List';
import { DatePickerPlugin } from './DatePicker';
import { TimePickerPlugin } from './TimePicker';
import { SliderPlugin } from './Slider';
import { FileUploadPlugin } from './FileUpload';
import { RatingPlugin } from './Rating';
import { ProgressPlugin } from './Progress';
import { FormPlugin } from './Form';
import { ModalPlugin } from './Modal';
import { TabsPlugin } from './Tabs';
import { AccordionPlugin } from './Accordion';
import { CustomWidgetPlugin } from './CustomWidget';
import React from 'react';

export const componentRegistry: Record<ComponentType, ComponentPlugin> = {
    [ComponentType.TABLE]: TablePlugin,
    [ComponentType.LABEL]: LabelPlugin,
    [ComponentType.INPUT]: InputPlugin,
    [ComponentType.BUTTON]: ButtonPlugin,
    [ComponentType.IMAGE]: ImagePlugin,
    [ComponentType.TEXTAREA]: TextareaPlugin,
    [ComponentType.SELECT]: SelectPlugin,
    [ComponentType.CHECKBOX]: CheckboxPlugin,
    [ComponentType.DIVIDER]: DividerPlugin,
    [ComponentType.RADIO_GROUP]: RadioGroupPlugin,
    [ComponentType.SWITCH]: SwitchPlugin,
    [ComponentType.CONTAINER]: ContainerPlugin,
    [ComponentType.LIST]: ListPlugin,
    [ComponentType.DATE_PICKER]: DatePickerPlugin,
    [ComponentType.TIME_PICKER]: TimePickerPlugin,
    [ComponentType.SLIDER]: SliderPlugin,
    [ComponentType.FILE_UPLOAD]: FileUploadPlugin,
    [ComponentType.RATING]: RatingPlugin,
    [ComponentType.PROGRESS]: ProgressPlugin,
    [ComponentType.FORM]: FormPlugin,
    [ComponentType.MODAL]: ModalPlugin,
    [ComponentType.TABS]: TabsPlugin,
    [ComponentType.ACCORDION]: AccordionPlugin,
    [ComponentType.CUSTOM_WIDGET]: CustomWidgetPlugin,
};