import { Tabs } from "expo-router/js-tabs";
export default function RootLayout() {
  return (
    <Tabs>
        <Tabs.Screen name="home" options={{title:"Home"}}/>
        <Tabs.Screen name="profile" options={{title:"Profile"}}/>
    </Tabs>
  );
}
