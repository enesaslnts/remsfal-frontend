<script setup lang="ts">
import Button from 'primevue/button';
import { useTopbarUserActions } from '@/layouts/composables/useTopbarUserActions';

const {
  t,
  sessionStore,
  onAccountSettingsClick,
  logout,
  login,
  loginNative,
  useNativeLogin,
} = useTopbarUserActions();
</script>

<template>
  <Button
    v-if="sessionStore.user != null"
    class="layout-topbar-action"
    @click="onAccountSettingsClick()"
  >
    <i class="pi pi-user" />
    <span>{{ sessionStore.user.email }}</span>
  </Button>
  <Button v-if="sessionStore.user != null" class="layout-topbar-action" @click="logout()">
    <i class="pi pi-sign-out" />
    <span>{{ t('toolbar.logout') }}</span>
  </Button>
  <Button
    v-if="sessionStore.user == null && !useNativeLogin"
    class="layout-topbar-action"
    @click="login()"
  >
    <i class="pi pi-sign-in" />
    <span>{{ t('toolbar.login') }}</span>
  </Button>
  <Button
    v-if="sessionStore.user == null && useNativeLogin"
    class="layout-topbar-action"
    @click="loginNative()"
  >
    <i class="pi pi-google" />
    <span>{{ t('toolbar.login') }}</span>
  </Button>
</template>