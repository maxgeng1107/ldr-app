import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  useEffect(()=>{
    async function load_profile(){
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("users").select("*").eq("id",user.id).single();
      if (error) console.log(error);
      setProfile(data);
      const { data:couple, error:couple_error} = await supabase.from("couples").select("*").eq("id",data.couple_id).single();
      if (couple_error) console.log(couple_error);
      if (couple && couple.pair_code) setPairCode(couple.pair_code);
    }
    load_profile();
  },[]);
  if (!profile) return <Text>Loading...</Text>
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{profile.name}</Text>
      <Text>{profile.timezone}</Text>
      {!pairCode && <Button title="Start a Relationship" onPress={()=>{
        async function create_couple(){
          const { data, error } = await supabase.rpc("create_couple");
          setPairCode(data);
        }
        create_couple();
      }}/>}
      {pairCode && <Text>Pair Code: {pairCode}</Text>}
    </View>
  );
}