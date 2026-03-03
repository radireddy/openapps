import { ComponentType } from '@/types';
import { ComponentPropertySchema } from '../metadata';

export const customWidgetSchema: ComponentPropertySchema = {
  componentType: ComponentType.CUSTOM_WIDGET,
  properties: [
    {
      id: 'widgetDefinitionId',
      label: 'Widget',
      type: 'string',
      tab: 'General',
      group: 'Widget',
      tabOrder: 1,
      groupOrder: 1,
      propertyOrder: 1,
      tooltip: 'The widget definition this instance references',
      applicableTo: [ComponentType.CUSTOM_WIDGET],
    },
    {
      id: 'inputBindings',
      label: 'Input Bindings',
      type: 'json',
      tab: 'General',
      group: 'Data',
      tabOrder: 1,
      groupOrder: 2,
      propertyOrder: 1,
      tooltip: 'Map widget inputs to expressions',
      applicableTo: [ComponentType.CUSTOM_WIDGET],
    },
  ],
};
