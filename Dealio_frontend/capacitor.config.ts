import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dealio.app',
  appName: 'Dealio',
  webDir: 'dist',
  android: {
    path: '../Dealio_android',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#0A7E8C',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0A7E8C',
    },
  },
  server: {
    androidScheme: 'http',
    cleartext: true,    // allows http for local backend
  },
};

export default config;