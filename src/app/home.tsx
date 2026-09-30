import { me, partner } from "@/data/mock";
import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <View style={{flexDirection:"row"}}>
        <View style={styles.label}>
          <Text>{me.name}</Text>
          <Text>{me.timezone}</Text>
          <Text>7:45AM</Text>
        </View>
        <View style={styles.label}>
          <Text>{partner.name}r</Text>
          <Text>{partner.timezone}</Text>
          <Text>3:45PM</Text>
        </View>
      </View>
      <Button title="Call TIme" onPress={()=>router.push("/call-time")}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    alignItems: "center",
    padding: 15,
    margin: 20,
    justifyContent: "center",
  }
});
