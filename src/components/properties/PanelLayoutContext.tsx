import { createContext, useContext } from 'react';

interface PanelLayoutContextValue {
  /** True when panel width <= 300px — use stacked labels */
  isNarrow: boolean;
}

export const PanelLayoutContext = createContext<PanelLayoutContextValue>({
  isNarrow: false,
});

export const usePanelLayout = () => useContext(PanelLayoutContext);
