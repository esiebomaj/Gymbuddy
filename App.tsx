import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {LockProvider} from './src/context/LockContext';
import {ThemeProvider} from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean; error: string}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, error: ''};
  }
  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error: error.message};
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.title}>Something went wrong</Text>
          <Text style={eb.msg}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0B0F', padding: 24},
  title: {color: '#FF4C6A', fontSize: 18, fontWeight: '700', marginBottom: 12},
  msg: {color: '#A0A0BC', fontSize: 13, textAlign: 'center'},
});

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <LockProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </LockProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

export default App;
