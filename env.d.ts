/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth client ID of the REMSFAL backend (Google web client), used as serverClientId for native login */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
}
