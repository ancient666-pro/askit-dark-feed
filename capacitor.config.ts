
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ancient.askit',
  appName: 'AskIt',
  webDir: 'dist',
  server: {
    url: 'https://2178aed1-a3e7-47ff-a5b8-abc2065128cd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
