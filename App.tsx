import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import ChatScreen from './mobile-app/src/screens/ChatScreen';
import ChatHistoryScreen from './mobile-app/src/screens/ChatHistoryScreen';
import KnowledgeScreen from './mobile-app/src/screens/KnowledgeScreen';
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
            headerStyle: {backgroundColor: '#0d1117'},
            headerTintColor: '#e6edf3',
            headerTitleStyle: {fontWeight: '600'},
            contentStyle: {backgroundColor: '#0d1117'},
            headerShadowVisible: false,
          }}>
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{title: 'LocalAI Assistant'}}
          />
          <Stack.Screen
            name="ChatHistory"
            component={ChatHistoryScreen}
            options={{title: 'Chat History'}}
          />
          <Stack.Screen
            name="Knowledge"
            component={KnowledgeScreen}
            options={{title: 'Project Memory'}}
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
