import {computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useUserSessionStore} from '@/stores/UserSession';
import {shouldUseNativeLogin} from '@/helper/platform';
import {useAppToast} from '@/composables/useAppToast';

export function useTopbarUserActions(): {
    t: ReturnType<typeof useI18n>['t'];
    sessionStore: ReturnType<typeof useUserSessionStore>;
    onAccountSettingsClick: () => void;
    logout: () => void;
    login: () => void;
    loginNative: () => Promise<void>;
    useNativeLogin: import("vue").ComputedRef<boolean>;
    } {
  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const sessionStore = useUserSessionStore();
  const appToast = useAppToast();

  const onAccountSettingsClick = () => {
    if (route.path.startsWith('/contractor')) {
      router.push('/contractor/account-data');
    } else if (route.path.startsWith('/tenant')) {
      router.push('/tenant/account-data');
    } else {
      router.push('/manager/account-data');
    }
  };

  const logout = () => {
    globalThis.location.pathname = '/api/v1/authentication/logout';
  };

  const login = () => {
    const redirect = route.query.redirect as string | undefined;
    const target = redirect || route.fullPath;
    globalThis.location.href = `/api/v1/authentication/login?route=${encodeURIComponent(target)}`;
  };

  const loginNative = async () => {
    const result = await sessionStore.loginWithNativeGoogle();
    if (result === 'CANCELLED') {
      // deliberate user action - no message
      return;
    }
    if (result !== 'SUCCESS') {
      appToast.error(t(`nativeLogin.error.${result}`));
      return;
    }
    // force: the app usually is already on '/', a plain push would be a no-op.
    // Forcing the navigation runs the router guards, which send logged-in users
    // to their role-specific start page (same behaviour as after the web login).
    const redirect = route.query.redirect as string | undefined;
    router.push({ path: redirect || '/', force: true });
  };

  const useNativeLogin = computed(() => shouldUseNativeLogin());

  return {
    t,
    sessionStore,
    onAccountSettingsClick,
    logout,
    login,
    loginNative,
    useNativeLogin,
  };
}
