import React, {useState} from 'react';
import {
  Alert,
  Button,
  NativeModules,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

const {ScreenTimeManager} = NativeModules;

function App(): React.JSX.Element {
  const [status, setStatus] = useState('Not authorized');
  const [appCount, setAppCount] = useState(0);

  const requestAuth = async () => {
    try {
      const result = await ScreenTimeManager.requestAuthorization();
      setStatus(result);
    } catch (e: any) {
      Alert.alert('Auth Error', e.message);
    }
  };

  const pickApps = async () => {
    try {
      const count = await ScreenTimeManager.showAppPicker();
      setAppCount(count);
    } catch (e: any) {
      Alert.alert('Picker Error', e.message);
    }
  };

  const lock = async () => {
    try {
      const result = await ScreenTimeManager.lockApps();
      Alert.alert('Locked', result);
    } catch (e: any) {
      Alert.alert('Lock Error', e.message);
    }
  };

  const unlock = async () => {
    try {
      const result = await ScreenTimeManager.unlockApps();
      Alert.alert('Unlocked', result);
    } catch (e: any) {
      Alert.alert('Unlock Error', e.message);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'pink'}}>
      <Text style={{fontSize: 24, fontWeight: 'bold', textAlign: 'center'}}>
        GymBuddy
      </Text>
      <Text style={{textAlign: 'center', marginVertical: 10}}>
        Status: {status}
      </Text>
      <Text style={{textAlign: 'center', marginBottom: 20}}>
        Apps selected: {appCount}
      </Text>

      <View style={{gap: 12}}>
        <Button title="Request Authorization (parental controls)" onPress={requestAuth} />
        <Button title="Select Apps to Lock" onPress={pickApps} />
        <Button title="Lock Selected Apps" onPress={lock} />
        <Button
          title="Simulate Gym Check-In (Unlock)"
          onPress={unlock}
          color="green"
        />
      </View>
    </SafeAreaView>
  );
}

export default App;
