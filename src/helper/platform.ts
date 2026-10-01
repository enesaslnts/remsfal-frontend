import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native app (iOS/Android via Capacitor)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if the app is running in development mode (Vite dev server)
 */
export function isDevMode(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if the native Google login should be used.
 * Returns true ONLY if running as native app (Capacitor):
 * the Google ID token is obtained from the operating system and exchanged
 * at POST /api/v1/authentication/token.
 * Web always uses the normal Google redirect authentication.
 */
export function shouldUseNativeLogin(): boolean {
  return isNativePlatform();
}
