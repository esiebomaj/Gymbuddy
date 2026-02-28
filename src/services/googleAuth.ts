import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Configure Google Sign-In
 * TODO: Replace 'YOUR_WEB_CLIENT_ID' with your actual client ID from
 * Google Cloud Console (https://console.cloud.google.com) or Firebase.
 * Also update ios/GymBuddy/Info.plist CFBundleURLSchemes with your
 * reversed iOS client ID (e.g. com.googleusercontent.apps.YOUR_IOS_CLIENT_ID)
 */
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  // iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  // offlineAccess: true,
  // scopes: ['profile', 'email'],
});

export const performGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
    }
    throw new Error(error.message ?? 'Google sign in failed');
  }
};

export const performGoogleSignOut = async () => {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.error('Google sign out error:', error);
  }
};

export const isGoogleSignedIn = async (): Promise<boolean> => {
  try {
    return await GoogleSignin.hasPreviousSignIn();
  } catch {
    return false;
  }
};
