import { Text, View, StyleSheet } from "react-native";
import { Slot, overlapSlots } from "@/data/mock";

export default function CallTime() {
  return (
    <View style={styles.container}>
      {overlapSlots.map((slot) => 
        <Text key={slot.start}> {slot.start} → {slot.end} </Text>)}
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
