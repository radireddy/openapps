import React, { useContext } from 'react';
import { AppPage } from '@/types';

export interface InheritedStyles {
  textColor?: string;
  textFontSize?: string;
  textFontWeight?: string;
  textFontFamily?: string;
}

const InheritedStylesContext = React.createContext<InheritedStyles>({});

export const InheritedStylesProvider = InheritedStylesContext.Provider;

export function useInheritedStyles(): InheritedStyles {
  return useContext(InheritedStylesContext);
}

/**
 * Merge parent inherited styles with current component's overrides.
 * Only non-empty values override the parent.
 */
export function mergeInheritedStyles(
  parent: InheritedStyles,
  overrides: Partial<InheritedStyles>
): InheritedStyles {
  return {
    textColor: overrides.textColor || parent.textColor,
    textFontSize: overrides.textFontSize || parent.textFontSize,
    textFontWeight: overrides.textFontWeight || parent.textFontWeight,
    textFontFamily: overrides.textFontFamily || parent.textFontFamily,
  };
}

/**
 * Build the page-level InheritedStyles object from page text properties.
 * Used by Canvas and Preview to establish the top-level style context.
 */
export function buildPageInheritedStyles(page?: AppPage): InheritedStyles {
  return {
    textColor: page?.textColor || undefined,
    textFontSize: page?.textFontSize || undefined,
    textFontWeight: page?.textFontWeight || undefined,
    textFontFamily: page?.textFontFamily || undefined,
  };
}
