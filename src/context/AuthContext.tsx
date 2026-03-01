import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {supabase} from '../lib/supabase';
import {Session, User} from '@supabase/supabase-js';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID} from '@env';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
});
import {performAppleSignIn, isAppleSignInAvailable} from '../services/appleAuth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const mapSupabaseUser = (user: User): AuthUser => ({
  id: user.id,
  email: user.email ?? '',
  name:
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    '',
  photoUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const handleSession = (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      setUser(mapSupabaseUser(s.user));
      setNeedsOnboarding(s.user.user_metadata?.onboarded !== true);
    } else {
      setUser(null);
      setNeedsOnboarding(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session: s}}) => {
      handleSession(s);
      setIsLoading(false);
    });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const {error} = await supabase.auth.signInWithPassword({email, password});
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const {error} = await supabase.auth.signUp({
        email,
        password,
        options: {data: {full_name: name}},
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new Error('Google sign-in failed — no ID token returned.');
    }

    const {error} = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    const {error} = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }, []);


  const signInWithApple = useCallback(async () => {
    if (!isAppleSignInAvailable()) {
      throw new Error('Apple Sign In is not available on this device');
    }

    const result = await performAppleSignIn();

    const {error} = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: result.identityToken!,
      nonce: result.nonce!,
    });
    if (error) {
      throw new Error(error.message);
    }

    const fullName = [result.fullName?.givenName, result.fullName?.familyName]
      .filter(Boolean)
      .join(' ');

    if (fullName) {
      await supabase.auth.updateUser({
        data: {full_name: fullName},
      });
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const {error} = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    const {error} = await supabase.auth.updateUser({
      data: {onboarded: true},
    });
    if (error) {
      throw new Error(error.message);
    }
    setNeedsOnboarding(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        needsOnboarding,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut,
        sendPasswordReset,
        completeOnboarding,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
