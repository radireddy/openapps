

import React from 'react';
import { ComponentType, DividerProps, ComponentPlugin } from '../../types';
import { useJavaScriptRenderer } from '../../property-renderers/useJavaScriptRenderer';
import { useDisplayStyle } from './useDisplayStyle';
const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const DividerRenderer: React.FC<{
  component: { props: DividerProps };
  evaluationScope: Record<string, any>;
}> = ({ component, evaluationScope }) => {
  const p = component.props;
  const color = useJavaScriptRenderer(p.color, evaluationScope, '#d1d5db');
  const { finalOpacity, boxShadowValue } = useDisplayStyle(p, evaluationScope);
  return <div style={{ backgroundColor: color, opacity: finalOpacity, boxShadow: boxShadowValue || undefined }} className="w-full h-full"></div>;
};

export const DividerPlugin: ComponentPlugin = {
  type: ComponentType.DIVIDER,
  paletteConfig: {
    label: 'Divider',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 12H20", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })),
    defaultProps: {
      width: '100%',
      height: 2,
      color: '{{theme.colors.border}}',
      opacity: 1,
      boxShadow: '',
    },
  },
  renderer: DividerRenderer,
  properties: () => null,
};