import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import WineLibrary from './src/screens/WineLibrary';
import WineDetails from './src/screens/WineDetails';
import CreateWineEntry from './src/screens/CreateWineEntry';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Library" component={WineLibrary} />
        <Stack.Screen name="WineDetails" component={WineDetails} />
        <Stack.Screen name="CreateWine" component={CreateWineEntry} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}