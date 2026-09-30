import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack 
      screenOptions = {{
        headerStyle: {backgroundColor: "#fce4ec"},
        headerTintColor: "#333",
      }}>
        <Stack.Screen name="index" options={{headerShown:false}}/>
        <Stack.Screen name="home" options={{title:"Home"}}/>
        <Stack.Screen name="call-time" options={{title:"Call Time Match"}}/>
    </Stack>
  );
}