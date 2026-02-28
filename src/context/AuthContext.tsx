import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {performGoogleSignIn} from '../services/googleAuth';
import {performAppleSignIn, isAppleSignInAvailable} from '../services/appleAuth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    // TODO: Replace with AsyncStorage/Keychain token check
    const checkSession = async () => {
      try {
        // const token = await AsyncStorage.getItem('@auth_token');
        // if (token) { const userData = await api.get('/me'); setUser(userData); }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    // TODO: Replace with real API call
    // const { data } = await api.post('/auth/signin', { email, password });
    // await AsyncStorage.setItem('@auth_token', data.token);
    setUser({
      id: '1',
      email,
      name: email.split('@')[0],
    });
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, _password: string) => {
      // TODO: Replace with real API call
      setUser({id: '2', email, name});
    },
    [],
  );

  const signOut = useCallback(async () => {
    // TODO: Clear token, call sign-out endpoint
    setUser(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await performGoogleSignIn();
    const userInfo = (result as any).data ?? result;
    setUser({
      id: userInfo?.user?.id ?? 'google-user',
      email: userInfo?.user?.email ?? '',
      name: userInfo?.user?.name ?? userInfo?.user?.email?.split('@')[0] ?? 'User',
      photoUrl: userInfo?.user?.photo ?? undefined,
    });
  }, []);

  const signInWithApple = useCallback(async () => {
    if (!isAppleSignInAvailable()) {
      throw new Error('Apple Sign In is not available on this device');
    }
    const result = await performAppleSignIn();
    const fullName = [result.fullName?.givenName, result.fullName?.familyName]
      .filter(Boolean)
      .join(' ');
    setUser({
      id: result.user,
      email: result.email ?? '',
      name: fullName || result.email?.split('@')[0] || 'User',
    });
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    // TODO: Replace with real API call
    // await api.post('/auth/forgot-password', { email });
    console.log('Password reset email sent to:', email);
  }, []);

  const resetPassword = useCallback(
    async (email: string, _newPassword: string) => {
      // TODO: Replace with real API call
      // await api.post('/auth/reset-password', { email, newPassword });
      console.log('Password reset for:', email);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        sendPasswordReset,
        resetPassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
