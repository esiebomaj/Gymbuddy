import appleAuth from '@invertase/react-native-apple-authentication';
import {Platform} from 'react-native';

/**
 * Apple Sign In — requires "Sign In with Apple" capability in Xcode.
 * This is already set up in GymBuddy.entitlements.
 * Only available on iOS 13+.
 */
export const isAppleSignInAvailable = (): boolean => {
  return Platform.OS === 'ios' && appleAuth.isSupported;
};

export const performAppleSignIn = async () => {
  if (!isAppleSignInAvailable()) {
    throw new Error('Apple Sign In is not available on this device');
  }

  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  const credentialState = await appleAuth.getCredentialStateForUser(
    appleAuthRequestResponse.user,
  );

  if (credentialState === appleAuth.State.AUTHORIZED) {
    return appleAuthRequestResponse;
  }

  throw new Error('Apple Sign In authorization was not granted');
};
