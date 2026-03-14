export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Proof: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Apps: undefined;
};

export type RootStackParamList = {
  Intro: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};
