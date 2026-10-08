import { AnalogClock } from "@/components/AnalogClock";
import { supabase } from "@/lib/supabase";
import { daysTogether } from "@/lib/time";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Button,
  Platform,
  Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [coupleCode,setCoupleCode] = useState<string>("");
  const [pairLoad,setPairLoad] = useState(false);
  const [now, setNow] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<Date>(new Date());
  const [showPicker,setShowPicker] = useState(false);

  async function load_profile(){
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return; //anon

      // load my profile
      const { data: me, error } = await supabase
        .from("users").select("*").eq("id",user.id).single();
      if (error || !me) {
        console.log("load profile failed:", error?.message);
        return;
      }
      setProfile(me);

      if (!me.couple_id) return;
      // load pair code
      const { data:couple, error:couple_error} = await supabase
        .from("couples").select("*").eq("id",me.couple_id).single();
      if (couple_error) console.log(couple_error);
      if (couple && couple.pair_code) setPairCode(couple.pair_code);
      if (couple) setStartDate(couple.start_date);

      // load partner info
      const { data:p, error:partnerError} = await supabase
        .from("users").select("*").eq("couple_id",me.couple_id)
        .neq("id",me.id).maybeSingle();
      if (partnerError) console.log(partnerError.message);
      setPartner(p);

  }
  async function pairCouple(){
    setPairLoad(true);
    const { error } = await supabase.rpc("join_couple",{ code: coupleCode });
    if (error) console.log(error);
    else {
      await load_profile();
    }
    setPairLoad(false);
  }
  async function createCouple(){
    const { error } = await supabase.rpc("create_couple");
    if (error) console.log(error);
    else await load_profile();
  }
  async function signOut(){
    await supabase.auth.signOut();   // deletes the saved session
    router.replace("/");              // back to the login screen
  }
  async function saveStartdate(){
    const day = Intl.DateTimeFormat("en-CA", { timeZone:profile.timezone }).format(picked);
    if (!profile){
      console.log(profile);
      return;
    }
    const { error:dateError } = await supabase
      .from("couples").update({start_date:day}).eq("id", profile.couple_id);
    if ( dateError ) {console.log(dateError.message); return;}
    setStartDate(day);
  }

  useEffect(()=>{
    load_profile();
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  },[]);
  if (!profile) return <Text>Loading...</Text>

  // paired: me and my partner side by side
  if (partner) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.cell}><View style={styles.avatar}/></View>
          <View style={styles.middle}/>
          <View style={styles.cell}><View style={styles.avatar}/></View>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.name]}>{profile.name}</Text>
          <Text style={[styles.middle, styles.heart]}>❤️</Text>
          <Text style={[styles.cell, styles.name]}>{partner.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.timezone]}>{profile.timezone}</Text>
          <View style={styles.middle}/>
          <Text style={[styles.cell, styles.timezone]}>{partner.timezone}</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}><AnalogClock timeZone={profile.timezone} now={now} /></View>
          <View style={styles.middle}/>
          <View style={styles.cell}><AnalogClock timeZone={partner.timezone} now={now} /></View>
        </View>

        { !startDate ? (
          <View style={styles.dateCard}>
            <Text style={styles.dateQuestion}>When did you start dating?</Text>
            { Platform.OS === "ios" ? (
              <DateTimePicker
                value={picked}
                mode="date"
                display="compact"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  if (date) setPicked(date);
                }}
              />
            ) : 
            (
              <>
                <Pressable onPress={() => setShowPicker(true)}>
                  <Text>{picked.toLocaleDateString()}</Text>
                </Pressable>
                {showPicker && <DateTimePicker
                  value={picked}
                  mode="date"
                  display="compact"
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    setShowPicker(false);
                    if (event.type === "set" && date) setPicked(date);
                  }}
                />}
              </>
            )}
            <Pressable
              onPress={() => {saveStartdate()}}
              style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        ):(
          <View style={styles.dateCard}>
            <Text style={styles.dayNumber}>{daysTogether(startDate, profile.timezone, now)}</Text>
            <Text style={styles.dayLabel}>days together</Text>
            <Text style={styles.sinceText}>since {startDate}</Text>
          </View>) }

        <Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable>
      </View>
    );
  }

  // not paired, or waiting for the partner to join
  return (
    <View style={styles.container}>
      <View style={styles.avatar}/>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.timezone}>{profile.timezone}</Text>
      {!profile.couple_id && <Button title="Start a Relationship" onPress={createCouple}/>}
      {
        !profile.couple_id &&
        <TextInput
          style={styles.input}
          placeholder="Pair Code"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          value={coupleCode}
          onChangeText={setCoupleCode}
        />
      }
      {
        !profile.couple_id &&
        <Pressable
          onPress={pairCouple}
          disabled={pairLoad}
          style={{
            backgroundColor:"#333",
            borderRadius: 12,
            alignItems: "center",
            justifyContent:"center",
            width:144,
            height:48
          }}
        >
          {pairLoad ? <ActivityIndicator color="white"/> : <Text style={{color:"white"}}>Pair</Text>}
        </Pressable>
      }
      {profile.couple_id && pairCode && (
        <Text>Pair Code: {pairCode} — send it to your partner</Text>
      )}

      <Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    gap: 18,
    paddingVertical:50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cell: {
    width: 140,
    alignItems: "center",
    textAlign: "center",
  },
  middle: {
    width: 40,
    textAlign: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
  },
  heart: {
    fontSize: 22,
  },
  timezone: {
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: '#000',
    backgroundColor: '#fff',
    width: 145,
    height: 44,
  },
  avatar:{
    backgroundColor: "#333",
    width:75,
    height:75,
    borderRadius:8,

  },
  dateCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    minWidth: 260,
  },
  dateQuestion: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  saveText: {
    color: "white",
    fontWeight: "600",
  },
  dayNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  dayLabel: {
    fontSize: 16,
    color: "#333",
  },
  signOut: {
    color: "#999",
    fontSize: 14,
    marginTop: 8,
  },
  sinceText: {
    fontSize: 12,
    color: "#999",
  },
});
