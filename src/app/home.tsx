import { me, partner } from "@/data/mock";
import { formatTime } from "@/lib/time";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const [now,setNow] = useState(new Date());
  useEffect(() => {
      const id = setInterval(() => setNow(new Date()),1000);
      return () => clearInterval(id);
    },[]
  );
  return (
    <View style={styles.container}>
      <View style={{flexDirection:"row"}}>
        <View style={styles.label}>
          <Text>{me.name}</Text>
          <Text>{me.timezone}</Text>
          <Text>{formatTime(me.timezone, now)}</Text>
        </View>
        <View style={styles.label}>
          <Text>{partner.name}</Text>
          <Text>{partner.timezone}</Text>
          <Text>{formatTime(partner.timezone, now)}</Text>
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
