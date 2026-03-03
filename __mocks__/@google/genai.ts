import { jest } from '@jest/globals';

// FIX: Add a generic type to the mock function to avoid 'never' parameter types in tests.
export const mockGenerateContent = jest.fn<(_: any) => Promise<{ text: string }>>();

export class GoogleGenAI {
  constructor(config: any) {}

  public models = {
    generateContent: mockGenerateContent,
  };
}

export const Type = {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
};
