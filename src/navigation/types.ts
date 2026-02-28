export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: { name: string; email: string; password: string };
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
  Auth: undefined;
  Main: undefined;
};
