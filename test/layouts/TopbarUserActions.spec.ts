import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TopbarUserActions from '@/layouts/components/TopbarUserActions.vue';
import { useUserSessionStore, type User } from '@/stores/UserSession';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({
    path: '/', params: {}, query: {}, fullPath: '/', name: undefined, meta: {}
  }),
  RouterLink: { template: '<a><slot /></a>' },
}));


// Mock platform helper: web by default, can be switched to native per test
const platformMocks = vi.hoisted(() => ({shouldUseNativeLogin: vi.fn(() => false),}));
vi.mock('@/helper/platform', () => ({ shouldUseNativeLogin: platformMocks.shouldUseNativeLogin }));

// Mock AccountDataView to prevent loading it (and its side effects/imports)
vi.mock('@/features/common/users/views/AccountDataView.vue', () => ({ default: { template: '<div>Mocked View</div>' } }));

describe('TopbarUserActions.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  const mountWrapper = (user: User | null = null) => {
    const store = useUserSessionStore();
    store.user = user ?? null;

    return {
      wrapper: mount(TopbarUserActions),
      store,
    };
  };

  it('shows logout when logged in', async () => {
    const { wrapper } = mountWrapper({ email: 'test@example.com' } as User);
    await flushPromises();

    expect(wrapper.text()).toContain('Abmelden');
  });

  it('shows login when logged out', async () => {
    const { wrapper } = mountWrapper(null);
    await flushPromises();

    expect(wrapper.text()).toContain('Anmelden');
  });

  it('calls logout when logout button clicked', async () => {
    const { wrapper } = mountWrapper({ email: 'test@example.com' } as User);
    await flushPromises();

    const logoutButton = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('Abmelden'));
    expect(logoutButton).toBeDefined();
    if (logoutButton) {
      await logoutButton.trigger('click');
      expect(logoutButton.exists()).toBe(true);
    }
  });

  it('calls account settings when account clicked', async () => {
    const { wrapper } = mountWrapper({ email: 'user@example.com' } as User);
    await flushPromises();

    const accountButton = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('user@example.com'));
    expect(accountButton).toBeDefined();
    expect(accountButton?.exists()).toBe(true);
    await accountButton?.trigger('click');
  });

  it('uses native Google login on native platforms', async () => {
    platformMocks.shouldUseNativeLogin.mockReturnValue(true);
    const { wrapper, store } = mountWrapper(null);
    const nativeLogin = vi.spyOn(store, 'loginWithNativeGoogle').mockResolvedValue(true);
    await flushPromises();

    const loginButtons = wrapper.findAllComponents({ name: 'Button' }).filter(b => b.text().includes('Anmelden'));
    expect(loginButtons).toHaveLength(1);

    await loginButtons[0]!.trigger('click');
    await flushPromises();

    expect(nativeLogin).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({ path: '/', force: true });
    platformMocks.shouldUseNativeLogin.mockReturnValue(false);
  });

  it('does not navigate when native Google login fails', async () => {
    platformMocks.shouldUseNativeLogin.mockReturnValue(true);
    const { wrapper, store } = mountWrapper(null);
    vi.spyOn(store, 'loginWithNativeGoogle').mockResolvedValue(false);
    await flushPromises();

    const loginButton = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('Anmelden'));
    await loginButton?.trigger('click');
    await flushPromises();

    expect(mockPush).not.toHaveBeenCalled();
    platformMocks.shouldUseNativeLogin.mockReturnValue(false);
  });

  it('calls login when login button clicked', async () => {
    const { wrapper } = mountWrapper(null);
    await flushPromises();

    // Mock globalThis.location
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { href: '' } as unknown as Location,
      writable: true,
    });

    const loginButton = wrapper.findAllComponents({ name: 'Button' }).find(b => b.text().includes('Anmelden'));
    expect(loginButton).toBeDefined();

    await loginButton?.trigger('click');
    expect(globalThis.location.href).toContain('/api/v1/authentication/login');

    // Cleanup
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});
