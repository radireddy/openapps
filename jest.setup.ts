// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill APIs missing from jsdom
global.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
} as any;

if (typeof Element.prototype.scrollIntoView !== 'function') {
	Element.prototype.scrollIntoView = jest.fn();
}

// Mock the theme module so components using ThemeToggle/useEditorTheme
// work in tests without requiring a ThemeProvider wrapper.
jest.mock('@/theme', () => ({
	ThemeProvider: ({ children }: { children: any }) => children,
	ThemeToggle: () => null,
	useEditorTheme: () => ({
		theme: 'dark',
		setTheme: jest.fn(),
		availableThemes: [
			{ id: 'dark', label: 'Dark', icon: 'moon' },
			{ id: 'light', label: 'Light', icon: 'sun' },
		],
	}),
	EDITOR_THEMES: [
		{ id: 'dark', label: 'Dark', icon: 'moon' },
		{ id: 'light', label: 'Light', icon: 'sun' },
	],
	DEFAULT_THEME: 'dark',
	THEME_STORAGE_KEY: 'procode-editor-theme',
}));

// Ensure tests run with a clean localStorage and no leaked mocks
beforeEach(() => {
	try {
		localStorage.clear();
	} catch (e) {
		// Some environments may not have localStorage; ignore
	}
	jest.clearAllMocks();
});
