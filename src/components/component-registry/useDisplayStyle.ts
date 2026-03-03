import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { coerceToBoolean, parseOpacity } from './form-utils';

/**
 * Shared hook for evaluating common display style properties.
 * Used by display components (Button, Label, Image, Table, Divider)
 * to avoid duplicating useJavaScriptRenderer calls for border, opacity,
 * and shadow properties.
 */
export interface DisplayStyleProps {
  borderRadius?: any;
  borderWidth?: any;
  borderColor?: any;
  borderStyle?: string;
  opacity?: any;
  boxShadow?: any;
  disabled?: any;
}

export interface DisplayStyleResult {
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  finalOpacity: number;
  boxShadowValue: string;
  isDisabled: boolean;
  /** Pre-built border + opacity + shadow style properties */
  borderShadowStyle: {
    borderRadius: string;
    borderWidth: string;
    borderColor: string;
    opacity: number;
    boxShadow: string | undefined;
  };
}

export function useDisplayStyle(
  props: DisplayStyleProps,
  evaluationScope: Record<string, any>,
  defaults?: {
    borderRadius?: string;
    borderWidth?: string;
    borderColor?: string;
  }
): DisplayStyleResult {
  const borderRadius = useJavaScriptRenderer(
    props.borderRadius, evaluationScope, defaults?.borderRadius ?? '4px'
  );
  const borderWidth = useJavaScriptRenderer(
    props.borderWidth, evaluationScope, defaults?.borderWidth ?? '1px'
  );
  const borderColor = useJavaScriptRenderer(
    props.borderColor, evaluationScope, defaults?.borderColor ?? '#e5e7eb'
  );
  const opacityValue = useJavaScriptRenderer(props.opacity, evaluationScope, 1);
  const boxShadowValue = useJavaScriptRenderer(props.boxShadow, evaluationScope, '');

  const disabledValue = useJavaScriptRenderer(props.disabled, evaluationScope, false);
  const isDisabled = coerceToBoolean(disabledValue);
  const finalOpacity = parseOpacity(opacityValue, isDisabled);

  return {
    borderRadius: String(borderRadius),
    borderWidth: String(borderWidth),
    borderColor: String(borderColor),
    finalOpacity,
    boxShadowValue: String(boxShadowValue || ''),
    isDisabled,
    borderShadowStyle: {
      borderRadius: String(borderRadius),
      borderWidth: String(borderWidth),
      borderColor: String(borderColor),
      opacity: finalOpacity,
      boxShadow: boxShadowValue ? String(boxShadowValue) : undefined,
    },
  };
}
