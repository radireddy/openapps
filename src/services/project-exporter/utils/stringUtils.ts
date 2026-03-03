
/**
 * Converts a string to camelCase.
 * @example toCamelCase("Background Color") -> "backgroundColor"
 */
export const toCamelCase = (str: string) => {
	// If the string contains separators, treat it as phrase and convert.
	if (/[^a-zA-Z0-9]/.test(str)) {
		return str
			.toLowerCase()
			.replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => (chr ? chr.toUpperCase() : ''))
			.replace(/^./, (c) => c.toLowerCase());
	}
	// Otherwise assume it's already in camelCase or single identifier — just lowercase first char.
	return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Converts a string to PascalCase (UpperCamelCase).
 * Used for React component names.
 * @example toPascalCase("my page") -> "MyPage"
 */
export const toPascalCase = (str: string) => {
	const camel = toCamelCase(str);
	return camel.charAt(0).toUpperCase() + camel.slice(1);
};

/**
 * Removes non-alphanumeric characters from a string.
 * Useful for sanitizing user-provided names for use as identifiers.
 * @example sanitizeName("My App (Final)") -> "MyAppFinal"
 */
export const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '');
