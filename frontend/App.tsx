import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          '#00723F',
    secondary:        '#DD971A',
    background:       '#FFFFFF',
    surface:          '#FFFFFF',
    onPrimary:        '#FFFFFF',
    onSecondary:      '#FFFFFF',
    outline:          '#00723F',
  },
};
import LoginScreen    from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TasksScreen    from './screens/Tasks.Screen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Tasks"    component={TasksScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
