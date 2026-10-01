import { describe, it, expect } from 'vitest';
import { isNativePlatform, isDevMode, shouldUseNativeLogin } from '@/helper/platform';

describe('Platform Helper', () => {
  describe('isNativePlatform', () => {
    it('should return false when running in web/test environment', () => {
      // In test environment (jsdom), we're always on web platform
      const result = isNativePlatform();
      expect(result).toBe(false);
    });

    it('should return a boolean value', () => {
      const result = isNativePlatform();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isDevMode', () => {
    it('should return true in test/development environment', () => {
      // DEV is true during vitest run
      const result = isDevMode();
      expect(result).toBe(true);
    });

    it('should return a boolean value', () => {
      const result = isDevMode();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('shouldUseNativeLogin', () => {
    it('should return false when on web platform (test environment)', () => {
      // In test environment (web), the normal Google redirect login is used
      const result = shouldUseNativeLogin();
      expect(result).toBe(false);
    });

    it('should only return true on native platforms', () => {
      const result = shouldUseNativeLogin();
      expect(result).toBe(isNativePlatform());
    });
  });
});
