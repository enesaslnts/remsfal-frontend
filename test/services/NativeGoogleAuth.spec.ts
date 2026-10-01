import { describe, it, expect, vi, afterEach } from 'vitest';
import { nativeGoogleAuthService } from '@/services/NativeGoogleAuth';

describe('NativeGoogleAuthService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects with UNIMPLEMENTED on the web platform', async () => {
    await expect(nativeGoogleAuthService.signIn('any-client-id')).rejects.toMatchObject({
      code: 'UNIMPLEMENTED',
    });
  });

  it('returns the configured server client id', () => {
    vi.stubEnv('VITE_GOOGLE_WEB_CLIENT_ID', 'web-client-id.apps.googleusercontent.com');
    expect(nativeGoogleAuthService.getServerClientId()).toBe('web-client-id.apps.googleusercontent.com');
  });

  it('returns an empty string if no server client id is configured', () => {
    vi.stubEnv('VITE_GOOGLE_WEB_CLIENT_ID', undefined);
    expect(nativeGoogleAuthService.getServerClientId()).toBe('');
  });
});
