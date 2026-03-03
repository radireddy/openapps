import { AppDefinition } from '../../../types';
import {
  addPageToState,
  updatePageInState,
  deletePageFromState,
  reorderPageInState,
} from '../pageOperations';

const makeState = (pages = [
  { id: 'page_1', name: 'Home' },
  { id: 'page_2', name: 'About' },
]): AppDefinition => ({
  id: 'app_1',
  name: 'Test App',
  createdAt: '',
  lastModifiedAt: '',
  pages,
  mainPageId: 'page_1',
  components: [
    { id: 'comp_1', type: 'LABEL' as any, pageId: 'page_1', props: { text: 'Hello' } as any },
    { id: 'comp_2', type: 'BUTTON' as any, pageId: 'page_2', props: { text: 'Click' } as any },
  ],
  dataStore: {},
  variables: [],
  theme: {} as any,
});

describe('pageOperations', () => {
  describe('addPageToState', () => {
    test('adds a new page to the pages array', () => {
      const state = makeState();
      const newPage = { id: 'page_3', name: 'Contact' };
      const result = addPageToState(state, newPage);
      expect(result).not.toBeNull();
      expect(result!.pages).toHaveLength(3);
      expect(result!.pages[2]).toEqual(newPage);
    });

    test('returns null if page with same id already exists', () => {
      const state = makeState();
      const duplicate = { id: 'page_1', name: 'Duplicate' };
      const result = addPageToState(state, duplicate);
      expect(result).toBeNull();
    });
  });

  describe('updatePageInState', () => {
    test('updates page name', () => {
      const state = makeState();
      const result = updatePageInState(state, 'page_1', { name: 'Dashboard' });
      expect(result.pages[0].name).toBe('Dashboard');
      expect(result.pages[1].name).toBe('About');
    });

    test('updates page metadata', () => {
      const state = makeState();
      const result = updatePageInState(state, 'page_1', {
        metadata: { title: 'Home Page', description: 'Welcome' },
      });
      expect(result.pages[0].metadata?.title).toBe('Home Page');
      expect(result.pages[0].metadata?.description).toBe('Welcome');
    });

    test('returns state unchanged if page not found', () => {
      const state = makeState();
      const result = updatePageInState(state, 'page_nonexistent', { name: 'X' });
      expect(result).toBe(state);
    });
  });

  describe('deletePageFromState', () => {
    test('removes page and its components', () => {
      const state = makeState();
      const result = deletePageFromState(state, 'page_2');
      expect(result).not.toBeNull();
      expect(result!.pages).toHaveLength(1);
      expect(result!.pages[0].id).toBe('page_1');
      expect(result!.components).toHaveLength(1);
      expect(result!.components[0].id).toBe('comp_1');
    });

    test('returns null if trying to delete mainPageId', () => {
      const state = makeState();
      const result = deletePageFromState(state, 'page_1');
      expect(result).toBeNull();
    });

    test('returns null if page not found', () => {
      const state = makeState();
      const result = deletePageFromState(state, 'page_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('reorderPageInState', () => {
    test('moves page down (swap with next)', () => {
      const state = makeState();
      const result = reorderPageInState(state, 'page_1', 'down');
      expect(result.pages[0].id).toBe('page_2');
      expect(result.pages[1].id).toBe('page_1');
    });

    test('moves page up (swap with previous)', () => {
      const state = makeState();
      const result = reorderPageInState(state, 'page_2', 'up');
      expect(result.pages[0].id).toBe('page_2');
      expect(result.pages[1].id).toBe('page_1');
    });

    test('returns state unchanged if page is already first and moving up', () => {
      const state = makeState();
      const result = reorderPageInState(state, 'page_1', 'up');
      expect(result).toBe(state);
    });

    test('returns state unchanged if page is already last and moving down', () => {
      const state = makeState();
      const result = reorderPageInState(state, 'page_2', 'down');
      expect(result).toBe(state);
    });
  });
});
