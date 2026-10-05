import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  const [now,setNow] = useState(new Date());
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
      const id = setInterval(() => setNow(new Date()),1000);
      return () => clearInterval(id);
    },[]
  );
  useEffect(() => {
    async function load(){
      const { data : { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (error) console.log(error.message);
      else setProfile(data)
    }
    load();
  },[])
  if (!profile) return <Text>Loading...</Text>
  return (
    <View style={styles.container}>
      
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
