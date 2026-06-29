import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gurav.app',
  appName: 'Gurav Online Services',
  webDir: 'dist',

  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    CapacitorPasskey: {
      origin: 'http://192.168.1.7:3000',
      autoShim: true,
      domains: ['localhost', '192.168.1.7'],
    },
  },
};

export default config;
