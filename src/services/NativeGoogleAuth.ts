import { registerPlugin } from '@capacitor/core';

/**
 * Result of a native Google sign-in. The idToken is a Google-signed JWT whose
 * audience (aud) is the server client ID (= REMSFAL web client ID).
 */
export interface NativeGoogleSignInResult {
  idToken: string;
  email?: string;
  displayName?: string;
}

/**
 * Bridge to the native "NativeGoogleAuth" Capacitor plugin.
 * Android: Credential Manager / Google Identity Services (NativeGoogleAuthPlugin.java).
 * iOS: Google Sign-In SDK (planned).
 */
export interface NativeGoogleAuthPlugin {
  signIn(options: { serverClientId: string }): Promise<NativeGoogleSignInResult>;
}

const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPlugin>('NativeGoogleAuth');

class NativeGoogleAuthService {
  /**
   * Asks the operating system for a Google ID token issued for the given server client ID.
   * Rejects with code 'UNIMPLEMENTED' on the web platform.
   */
  signIn(serverClientId: string): Promise<NativeGoogleSignInResult> {
    return NativeGoogleAuth.signIn({ serverClientId });
  }

  /**
   * OAuth client ID of the REMSFAL backend (web client). The native app requests the
   * ID token for this client so that the backend only has to accept a single audience.
   */
  getServerClientId(): string {
    return import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '';
  }
}

export const nativeGoogleAuthService = new NativeGoogleAuthService();
