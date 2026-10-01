import { defineStore } from 'pinia';
// NOTE: imports the service module directly, not the `@/features/common/users` barrel —
// this store is loaded eagerly at app boot (see main.ts), and the barrel also re-exports
// route-level view components, which would otherwise stay in their own lazy chunks.
import { userService, type UserJson } from '@/features/common/users/services/UserService';
import i18n from '@/i18n/i18n';
import { nativeGoogleAuthService } from '@/services/NativeGoogleAuth';

export type User = UserJson;

export const useUserSessionStore = defineStore('user-session', {
  state: () => ({ user: null as User | null, sessionInitialized: false }),

  actions: {
    async refreshSessionState() {
      try {
        const user = await userService.getUser();
        this.user = user;
        console.log('Active user session:', user);
        if (user?.locale) {
          i18n.global.locale.value = user.locale;
        }
      } catch (error: unknown) {
        console.log('Invalid user session:', error);
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status: number } }).response?.status === 401
        ) {
          this.user = null;
        }
      } finally {
        this.sessionInitialized = true;
      }
    },

    /**
     * Exchanges a Google ID token (obtained natively) for a REMSFAL session.
     * The backend verifies the token (signature, issuer, expiry, audience, verified email)
     * and sets the session cookies (204 No Content).
     */
    async loginWithToken(idToken: string) {
      const params = new URLSearchParams();
      params.append('app_id', 'google');
      params.append('app_token', idToken);

      try {
        const response = await fetch('/api/v1/authentication/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          credentials: 'include',
          body: params,
        });

        if (!response.ok) {
          throw new Error(`Token login failed with status ${response.status}`);
        }

        await this.refreshSessionState();
      } catch (error: unknown) {
        console.error('Token-based login failed:', error);
        throw error;
      }
    },

    /**
     * Native Google login (Capacitor app): asks the operating system for a Google ID token
     * and exchanges it at the backend. Returns true if a session was established.
     */
    async loginWithNativeGoogle(): Promise<boolean> {
      const serverClientId = nativeGoogleAuthService.getServerClientId();
      if (!serverClientId) {
        console.error('Native Google login not configured: VITE_GOOGLE_WEB_CLIENT_ID is missing');
        return false;
      }
      try {
        const { idToken } = await nativeGoogleAuthService.signIn(serverClientId);
        await this.loginWithToken(idToken);
        return true;
      } catch (error: unknown) {
        console.error('Native Google login failed:', error);
        return false;
      }
    },
  },
});
