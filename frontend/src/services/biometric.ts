import { Capacitor } from '@capacitor/core';

const SERVER = 'guravonlineservices.duckdns.org';
const BIOMETRIC_KEY = 'gurav_auth_token';

// Lazy-load the native biometric plugin — only available in Capacitor native
async function getNativeBiometric() {
  const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
  return NativeBiometric;
}

export const biometricService = {
  /**
   * Returns true if the device supports native biometric auth
   * (fingerprint / face ID / device PIN fallback) AND we are on a native platform.
   */
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const NativeBiometric = await getNativeBiometric();
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch {
      return false;
    }
  },

  /**
   * Checks if a previously saved token exists in the secure keystore.
   */
  async hasSavedToken(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const NativeBiometric = await getNativeBiometric();
      const creds = await NativeBiometric.getCredentials({ server: SERVER });
      return !!creds?.password;
    } catch {
      return false;
    }
  },

  /**
   * Saves a JWT token encrypted in the Android Keystore / iOS Keychain.
   * Call this AFTER a successful email/password login.
   */
  async saveToken(token: string): Promise<void> {
    const NativeBiometric = await getNativeBiometric();
    await NativeBiometric.setCredentials({
      username: BIOMETRIC_KEY,
      password: token,
      server: SERVER,
    });
  },

  /**
   * Shows the native fingerprint/face ID dialog.
   * On success, retrieves and returns the encrypted JWT from the Keystore.
   * Returns null if user cancels or biometric fails.
   */
  async getTokenWithBiometric(): Promise<string | null> {
    try {
      const NativeBiometric = await getNativeBiometric();
      // Trigger the native OS biometric prompt
      await NativeBiometric.verifyIdentity({
        reason: 'Log in to Gurav Online Services',
        title: 'Fingerprint Login',
        subtitle: 'Use your fingerprint to sign in',
        description: 'Touch the fingerprint sensor to continue',
        useFallback: true, // allows device PIN/pattern if fingerprint fails
        maxAttempts: 3,
      });
      // If verifyIdentity resolves without throwing, biometric was verified
      const creds = await NativeBiometric.getCredentials({ server: SERVER });
      return creds?.password ?? null;
    } catch {
      // User cancelled, or too many failed attempts
      return null;
    }
  },

  /**
   * Deletes the saved token from Keystore.
   * Call this on logout.
   */
  async deleteToken(): Promise<void> {
    try {
      const NativeBiometric = await getNativeBiometric();
      await NativeBiometric.deleteCredentials({ server: SERVER });
    } catch {
      // Ignore — may not exist
    }
  },
};
