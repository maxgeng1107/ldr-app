import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

function ErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email first — check your inbox.";
    case "weak_password":
      return "Use a longer password (at least 6 characters).";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return fallback ?? "Something went wrong. Please try again.";
  }
}
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInMode, setsignInMode] = useState(true);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const canSubmit = email.trim() != "" && password.length >= 6 && !pending;
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(){
    setPending(true);
    setError(null);
    const { error } = signInMode
      ? await supabase.auth.signInWithPassword({email:email.trim(),password})
      : await supabase.auth.signUp({
        email:email.trim(),password,
        options: {
          data: { name: name.trim(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
        }
      });
    setPending(false);
    if (error){
      setError(ErrorMessage(error.code, error.message));
      return;
    }
    router.replace("/home");
    
  }
  return (
    <View style={styles.container}>
      {
        !signInMode && 
        <View style={{flexDirection:"row", alignItems:"center",gap:37}}>
          <Text>Name: </Text>
          <TextInput 
            style={styles.input}
            placeholder="First Name Last Name"
            placeholderTextColor="#999"
            autoCorrect={false}
            onChangeText={setName}
          />
      </View>
      }
      <View style={{flexDirection:"row", alignItems:"center",gap:37}}>
        <Text>Email: </Text>
        <TextInput 
          style={styles.input}
          placeholder="Type in your Email"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={{flexDirection:"row", alignItems:"center",gap:10}}>
        <Text>Password: </Text>
        <TextInput 
          style={styles.input}
          placeholder="Type in your Password"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
          value={password}
          onChangeText={setPassword}
        />
      </View>
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={{
          backgroundColor:"#333",
          marginTop:48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent:"center",
          width:144,
          height:48
        }}
      >
        {pending ? <ActivityIndicator /> : signInMode ? <Text style={{color:"white"}}>Sign In</Text> : <Text style={{color:"white"}}> Sign Up</Text>}
      </Pressable>
      <Pressable
        onPress={()=>setsignInMode(!signInMode)}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        hitSlop={8}
      >
        {!signInMode && <Text style={{fontSize:12,fontWeight: "100", color: "black"}}>New to here? Sign in here!!</Text>}
        {signInMode && <Text style={{fontSize:12,fontWeight: "100", color: "black"}}>Have An Account? Sign up here!!</Text>}
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 18
  },
  input: {
    borderWidth: 1,          
    borderColor: '#ccc',
    borderRadius: 8,        
    paddingHorizontal: 12,   
    paddingVertical: 10,
    fontSize: 12,
    color: '#000',           
    backgroundColor: '#fff',
    width: 250,
    height: 44,
  },
});
