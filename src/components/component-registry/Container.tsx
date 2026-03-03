/**
 * Container Component
 * 
 * A non-directional, grouping-only container that uses absolute positioning for children.
 * No flex, no grid, no directional alignment - just a bounding box for grouping.
 * 
 * This component is built using the base container utilities, making it easy to
 * extend for new container-based components.
 */

import React from 'react';
import { ComponentType, ContainerProps } from '../../types';
import { createContainerComponent } from './container-factory';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

/**
 * Container Plugin
 * Built using the container factory for consistency and extensibility
 */
export const ContainerPlugin = createContainerComponent({
  type: ComponentType.CONTAINER,
  label: 'Container',
  icon: React.createElement('svg', { 
    style: iconStyle, 
    viewBox: "0 0 24 24", 
    fill: "none", 
    xmlns: "http://www.w3.org/2000/svg" 
  }, 
    React.createElement('rect', { 
      x: "3", 
      y: "3", 
      width: "18", 
      height: "18", 
      rx: "2", 
      stroke: "currentColor", 
      strokeWidth: "2", 
      strokeLinejoin: "round" 
    }),
    React.createElement('rect', { 
      x: "6", 
      y: "6", 
      width: "12", 
      height: "12", 
      rx: "1", 
      stroke: "currentColor", 
      strokeWidth: "1.5", 
      strokeLinejoin: "round",
      strokeDasharray: "2 2"
    })
  ),
  defaultProps: {
    width: '100%',
    height: 'auto',
    minHeight: '60px',
    backgroundColor: 'transparent',
    borderWidth: '0px',
    borderColor: 'transparent',
    borderRadius: '{{theme.radius.default}}',
    padding: '{{theme.spacing.sm}}',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: '12px',
  } as any,
});

// Export the renderer for direct use if needed
import { BaseContainerRenderer } from './base-container';
export { BaseContainerRenderer as ContainerRenderer };

