import { Stack } from "expo-router";
export default function RootLayout() {
  return (
    <Stack 
      screenOptions = {{
        headerStyle: {backgroundColor: "#fce4ec"},
        headerTintColor: "#333",
      }}>
        <Stack.Screen name="index" options={{headerShown:false}}/>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="new-moment" options={{ presentation: "modal", title: "New moment" }} />
    </Stack>
  );
}