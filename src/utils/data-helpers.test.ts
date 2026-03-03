import { describe, it, expect } from '@jest/globals';
import { get, set } from '@/utils/data-helpers';

describe('data-helpers', () => {
  const obj = {
    a: 1,
    b: {
      c: 2,
      d: {
        e: 'hello',
      },
    },
    f: null,
  };

  describe('get', () => {
    it('should get a top-level property', () => {
      expect(get(obj, 'a')).toBe(1);
    });

    it('should get a nested property', () => {
      expect(get(obj, 'b.c')).toBe(2);
    });

    it('should get a deeply nested property', () => {
      expect(get(obj, 'b.d.e')).toBe('hello');
    });

    it('should return undefined for a non-existent path', () => {
      expect(get(obj, 'x.y.z')).toBeUndefined();
    });

    it('should return the default value for a non-existent path', () => {
      expect(get(obj, 'x.y.z', 'default')).toBe('default');
    });

    it('should return undefined for a path that goes through null', () => {
      expect(get(obj, 'f.g')).toBeUndefined();
    });

    it('should return undefined for an empty path', () => {
      expect(get(obj, '')).toBeUndefined(); // as per implementation
    });
  });

  describe('set', () => {
    it('should set a top-level property', () => {
      const newObj = set(obj, 'a', 100);
      expect(newObj.a).toBe(100);
      expect(obj.a).toBe(1); // Immutability check
    });

    it('should set a nested property', () => {
      const newObj = set(obj, 'b.c', 200);
      expect(newObj.b.c).toBe(200);
      expect(obj.b.c).toBe(2); // Immutability check
      expect(newObj.b).not.toBe(obj.b); // Check that path was cloned
    });

    it('should create nested properties if they do not exist', () => {
      const newObj = set(obj, 'x.y.z', 'new value');
      expect(newObj.x.y.z).toBe('new value');
    });

    it('should return a new object instance', () => {
      const newObj = set(obj, 'a', 1);
      expect(newObj).not.toBe(obj);
    });

    it('should handle setting a property on a null path', () => {
        const newObj = set(obj, 'f.g', 'new value');
        expect(newObj.f.g).toBe('new value');
    });
  });
});