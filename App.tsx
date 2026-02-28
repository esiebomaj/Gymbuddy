import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {LockProvider} from './src/context/LockContext';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LockProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </LockProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
