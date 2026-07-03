import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gurav.app",
  appName: "Gurav Online Services",
  webDir: "dist",

  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorPasskey: {
      origin: "https://guravonlineservices.duckdns.org",
      autoShim: true,
      domains: ["localhost", "guravonlineservices.duckdns.org"],
    },
  },
};

export default config;
