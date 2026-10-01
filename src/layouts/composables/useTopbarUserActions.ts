import {computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useUserSessionStore} from '@/stores/UserSession';
import {shouldUseNativeLogin} from '@/helper/platform';

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
    const success = await sessionStore.loginWithNativeGoogle();
    if (success) {
      const redirect = route.query.redirect as string | undefined;
      router.push(redirect || '/');
    }
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
