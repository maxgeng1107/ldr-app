import { Text, View, StyleSheet, Button } from "react-native";
import { router } from "expo-router";
export default function Login() {
  return (
    <View style={styles.container}>
      <Text>Login Screen</Text>
      <Button title = "Login" onPress = {() => router.replace("/home")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
