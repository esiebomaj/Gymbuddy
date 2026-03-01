import appleAuth from '@invertase/react-native-apple-authentication';
import {Platform} from 'react-native';

export const isAppleSignInAvailable = (): boolean => {
  return Platform.OS === 'ios' && appleAuth.isSupported;
};

export const performAppleSignIn = async () => {
  if (!isAppleSignInAvailable()) {
    throw new Error('Apple Sign In is not available on this device');
  }

  const response = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  const credentialState = await appleAuth.getCredentialStateForUser(
    response.user,
  );

  if (credentialState !== appleAuth.State.AUTHORIZED) {
    throw new Error('Apple Sign In authorization was not granted');
  }

  if (!response.identityToken) {
    throw new Error('Apple Sign In failed — no identity token returned.');
  }

  return response;
};
