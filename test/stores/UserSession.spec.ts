import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserSessionStore, type User } from '@/stores/UserSession';
import { apiClient } from '@/services/ApiClient';
import { nativeGoogleAuthService } from '@/services/NativeGoogleAuth';


describe('UserSession Store', () => {
  let store: ReturnType<typeof useUserSessionStore>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useUserSessionStore();
    // Save original fetch
    originalFetch = globalThis.fetch;
    // Mock fetch for login tests
    globalThis.fetch = vi.fn();

    // Mock apiClient.get
    vi.spyOn(apiClient, 'get');
  });


  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      expect(store.user).toBeNull();
    });

    it('should have sessionInitialized as false initially', () => {
      expect(store.sessionInitialized).toBe(false);
    });
  });

  describe('refreshSessionState', () => {
    it('should update user on successful fetch', async () => {
      const mockUser = { email: 'test@example.com' };
      vi.mocked(apiClient.get).mockResolvedValue(mockUser);

      await store.refreshSessionState();

      expect(store.user).toEqual(mockUser);
    });

    it('should set sessionInitialized to true on successful fetch', async () => {
      const mockUser = { email: 'test@example.com' };
      vi.mocked(apiClient.get).mockResolvedValue(mockUser);

      await store.refreshSessionState();

      expect(store.sessionInitialized).toBe(true);
    });

    it('should set user to null on 401 error', async () => {
      // Simulate 401 error structure
      const error401 = { response: { status: 401 } };
      vi.mocked(apiClient.get).mockRejectedValue(error401);

      // Set user initially to something
      store.user = { email: 'old@example.com' } as User;

      await store.refreshSessionState();

      expect(store.user).toBeNull();
    });

    it('should set sessionInitialized to true even on 401 error', async () => {
      const error401 = { response: { status: 401 } };
      vi.mocked(apiClient.get).mockRejectedValue(error401);

      await store.refreshSessionState();

      expect(store.sessionInitialized).toBe(true);
    });

    it('should log error but keep user for other errors', async () => {
      const error500 = { response: { status: 500 } };
      vi.mocked(apiClient.get).mockRejectedValue(error500);
      const consoleSpy = vi.spyOn(console, 'log');

      store.user = { email: 'existing@example.com' } as User;

      await store.refreshSessionState();

      expect(store.user).not.toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid user session:', error500);
    });

    it('should set sessionInitialized to true even on non-401 errors', async () => {
      const error500 = { response: { status: 500 } };
      vi.mocked(apiClient.get).mockRejectedValue(error500);

      await store.refreshSessionState();

      expect(store.sessionInitialized).toBe(true);
    });
  });

  describe('loginWithToken', () => {
    it('should call authentication endpoint with token', async () => {
      const testToken = 'test-jwt-token-12345';

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await store.loginWithToken(testToken);

      expect(globalThis.fetch).toHaveBeenCalledWith('/api/v1/authentication/token', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
      }));
    });

    it('should send app_id=google and the ID token as app_token', async () => {
      const testToken = 'test-jwt-token-12345';

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      await store.loginWithToken(testToken);

      const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]!;
      const body = callArgs[1]?.body as URLSearchParams;
      expect(body.get('app_id')).toBe('google');
      expect(body.get('app_token')).toBe(testToken);
      expect(body.get('token')).toBeNull();
    });

    it('should throw error on failed token login with status 401', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(store.loginWithToken('invalid-token')).rejects.toThrow(
        'Token login failed with status 401'
      );
    });

    it('should throw error on failed token login with status 500', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(store.loginWithToken('test-token')).rejects.toThrow(
        'Token login failed with status 500'
      );
    });

    it('should throw error on network failure', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'));

      await expect(store.loginWithToken('test-token')).rejects.toThrow();
    });

    it('should throw error on connection refused', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Connection refused'));

      await expect(store.loginWithToken('test-token')).rejects.toThrow('Connection refused');
    });
  });

  describe('loginWithNativeGoogle', () => {
    const CLIENT_ID = 'web-client-id.apps.googleusercontent.com';
    let signIn: MockInstance<typeof nativeGoogleAuthService.signIn>;

    beforeEach(() => {
      vi.spyOn(nativeGoogleAuthService, 'getServerClientId').mockReturnValue(CLIENT_ID);
      signIn = vi.spyOn(nativeGoogleAuthService, 'signIn');
    });

    it('should request the ID token for the server client id and exchange it', async () => {
      signIn.mockResolvedValue({ idToken: 'native-id-token' });
      vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, status: 204 } as Response);

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('SUCCESS');
      expect(signIn).toHaveBeenCalledWith(CLIENT_ID);
      const body = vi.mocked(globalThis.fetch).mock.calls[0]![1]?.body as URLSearchParams;
      expect(body.get('app_id')).toBe('google');
      expect(body.get('app_token')).toBe('native-id-token');
    });

    it('should return CANCELLED if the user cancels the native dialog', async () => {
      signIn.mockRejectedValue(Object.assign(new Error('Sign-in cancelled by user'), { code: 'CANCELLED' }));

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('CANCELLED');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should return NO_ACCOUNT if no Google account is available on the device', async () => {
      signIn.mockRejectedValue(
        Object.assign(new Error('No Google account available on this device'), { code: 'NO_CREDENTIAL' }),
      );

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('NO_ACCOUNT');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should return FAILED for other native errors', async () => {
      signIn.mockRejectedValue(new Error('Google sign-in failed'));

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('FAILED');
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('should return BACKEND_ERROR if the backend rejects the token', async () => {
      signIn.mockResolvedValue({ idToken: 'foreign-token' });
      vi.mocked(globalThis.fetch).mockResolvedValue({ ok: false, status: 401 } as Response);

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('BACKEND_ERROR');
    });

    it('should return NOT_CONFIGURED if no server client id is configured', async () => {
      vi.mocked(nativeGoogleAuthService.getServerClientId).mockReturnValue('');

      const result = await store.loginWithNativeGoogle();

      expect(result).toBe('NOT_CONFIGURED');
      expect(signIn).not.toHaveBeenCalled();
    });
  });
});
