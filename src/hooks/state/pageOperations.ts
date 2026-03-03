import { AppDefinition, AppPage } from '../../types';

/** Add a page to app definition. Returns null if a page with the same id already exists. */
export function addPageToState(state: AppDefinition, page: AppPage): AppDefinition | null {
  if (state.pages.some(p => p.id === page.id)) return null;
  return { ...state, pages: [...state.pages, page] };
}

/** Update a page in app definition. Returns state unchanged if page not found. */
export function updatePageInState(state: AppDefinition, pageId: string, updates: Partial<AppPage>): AppDefinition {
  const index = state.pages.findIndex(p => p.id === pageId);
  if (index === -1) return state;
  return {
    ...state,
    pages: state.pages.map(p => p.id === pageId ? { ...p, ...updates } : p),
  };
}

/** Delete a page and all its components. Returns null if page is mainPageId or not found. */
export function deletePageFromState(state: AppDefinition, pageId: string): AppDefinition | null {
  if (pageId === state.mainPageId) return null;
  if (!state.pages.some(p => p.id === pageId)) return null;
  return {
    ...state,
    pages: state.pages.filter(p => p.id !== pageId),
    components: state.components.filter(c => c.pageId !== pageId),
  };
}

/** Reorder a page up or down. Returns state unchanged if move is not possible. */
export function reorderPageInState(state: AppDefinition, pageId: string, direction: 'up' | 'down'): AppDefinition {
  const index = state.pages.findIndex(p => p.id === pageId);
  if (index === -1) return state;
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= state.pages.length) return state;
  const newPages = [...state.pages];
  [newPages[index], newPages[swapIndex]] = [newPages[swapIndex], newPages[index]];
  return { ...state, pages: newPages };
}
