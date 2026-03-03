import { AppComponent, ComponentType, InputProps, SelectProps, TextareaProps, CheckboxProps, RadioGroupProps, SwitchProps, LabelProps, ButtonProps, ImageProps, TableProps, DividerProps, ContainerProps, ListProps } from '@/types';

/**
 * Maps ComponentType enum values to their specific props interface.
 */
export type ComponentPropsMap = {
  [ComponentType.INPUT]: InputProps;
  [ComponentType.SELECT]: SelectProps;
  [ComponentType.TEXTAREA]: TextareaProps;
  [ComponentType.CHECKBOX]: CheckboxProps;
  [ComponentType.RADIO_GROUP]: RadioGroupProps;
  [ComponentType.SWITCH]: SwitchProps;
  [ComponentType.LABEL]: LabelProps;
  [ComponentType.BUTTON]: ButtonProps;
  [ComponentType.IMAGE]: ImageProps;
  [ComponentType.TABLE]: TableProps;
  [ComponentType.DIVIDER]: DividerProps;
  [ComponentType.CONTAINER]: ContainerProps;
  [ComponentType.LIST]: ListProps;
};

/**
 * Type guard: checks whether `component.type` matches `expectedType`.
 * Narrows `component.props` to the corresponding props interface.
 */
export function isComponentType<T extends keyof ComponentPropsMap>(
  component: AppComponent,
  expectedType: T
): component is AppComponent & { props: ComponentPropsMap[T] } {
  return component.type === expectedType;
}

/**
 * Returns `component.props` cast to the props interface for `expectedType`.
 * Throws if the component type doesn't match.
 */
export function getTypedProps<T extends keyof ComponentPropsMap>(
  component: AppComponent,
  expectedType: T
): ComponentPropsMap[T] {
  if (component.type !== expectedType) {
    throw new Error(
      `Expected component type "${expectedType}" but got "${component.type}"`
    );
  }
  return component.props as ComponentPropsMap[T];
}
