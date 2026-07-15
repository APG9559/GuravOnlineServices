import { api } from './client';
import { AuthUser } from '@/types';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    }),
  me: () => api.get<AuthUser>('/auth/me'),
  resetPassword: (password: string) =>
    api.post<{ success: boolean }>('/auth/reset-password', { password }),
  updateProfile: (data: { name?: string; signature?: string; avatar?: string }) =>
    api.put<AuthUser>('/auth/profile', data),
  getPasskeyRegisterOptions: () =>
    api.get<{ options: PublicKeyCredentialCreationOptionsJSON; sessionId: string }>('/auth/passkey/register-options'),
  verifyPasskeyRegister: (sessionId: string, credential: RegistrationResponseJSON) =>
    api.post<{ success: boolean }>('/auth/passkey/register-verify', {
      sessionId,
      credential,
    }),
  getPasskeyLoginOptions: () =>
    api.get<{ options: PublicKeyCredentialRequestOptionsJSON; sessionId: string }>('/auth/passkey/login-options'),
  verifyPasskeyLogin: (sessionId: string, credential: AuthenticationResponseJSON) =>
    api.post<{ accessToken: string; user: AuthUser }>('/auth/passkey/login-verify', {
      sessionId,
      credential,
    }),
};
