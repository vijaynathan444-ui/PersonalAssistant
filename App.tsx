import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import ChatScreen from './mobile-app/src/screens/ChatScreen';
import SettingsScreen from './mobile-app/src/screens/SettingsScreen';
import {RootStackParamList} from './mobile-app/src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Chat"
          screenOptions={{
            headerStyle: {backgroundColor: '#1a1a2e'},
            headerTintColor: '#ffffff',
            headerTitleStyle: {fontWeight: 'bold'},
            contentStyle: {backgroundColor: '#16213e'},
          }}>
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{title: 'LocalAI Assistant'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
