import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// One screen for both kinds of moment: /new-moment?kind=photo or /new-moment?kind=letter
export default function NewMoment() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const isLetter = kind === "letter";

  const [me, setMe] = useState<{ id: string; couple_id: string } | null>(null);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // who am I, and which couple do I post to?
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("users").select("id, couple_id").eq("id", user.id).single();
      if (error || !data) { setError(error?.message ?? "Couldn't load your profile."); return; }
      setMe(data);
    }
    load();
  }, []);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled) return;            // user backed out — not an error
    setAsset(result.assets[0]);
  }

  const canSave = !!me?.couple_id && !pending && (isLetter ? text.trim() !== "" : asset !== null);

  async function save() {
    if (!me?.couple_id || !canSave) return;
    setPending(true);
    setError(null);

    try {
      if (isLetter) {
        const { error } = await supabase.from("moments").insert({
          couple_id: me.couple_id, author_id: me.id, kind: "letter", body: text.trim(),
        });
        if (error) throw error;
      } else {
        // 1. read the local file into bytes (React Native uploads an ArrayBuffer, not a File)
        const bytes = await fetch(asset!.uri).then((res) => res.arrayBuffer());
        const contentType = asset!.mimeType ?? "image/jpeg";
        const ext = contentType.split("/")[1] ?? "jpg";
        // 2. upload into OUR couple's folder — the storage policy checks this first folder
        const path = `${me.couple_id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, bytes, { contentType });
        if (uploadError) throw uploadError;
        // 3. record it on the timeline; if that fails, remove the orphaned file
        const { error: insertError } = await supabase.from("moments").insert({
          couple_id: me.couple_id, author_id: me.id, kind: "photo",
          storage_path: path, body: text.trim() || null,
        });
        if (insertError) {
          await supabase.storage.from("photos").remove([path]);
          throw insertError;
        }
      }
      router.back();                        // back to Home, which reloads the timeline
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      {!isLetter && (
        <Pressable onPress={pickPhoto} style={styles.photoBox}>
          {asset
            ? <Image source={{ uri: asset.uri }} style={styles.photo} />
            : <Text style={styles.photoHint}>Tap to choose a photo</Text>}
        </Pressable>
      )}

      <TextInput
        style={[styles.input, isLetter && styles.letterInput]}
        placeholder={isLetter ? "Write your letter…" : "Add a caption (optional)"}
        placeholderTextColor="#999"
        multiline
        value={text}
        onChangeText={setText}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        onPress={save}
        disabled={!canSave}
        style={({ pressed }) => [styles.button, (!canSave || pressed) && { opacity: 0.5 }]}
      >
        {pending ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isLetter ? "Send letter" : "Share photo"}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, backgroundColor: "white" },
  photoBox: {
    height: 300, borderRadius: 16, borderWidth: 1, borderColor: "#e5e5e5",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoHint: { color: "#999" },
  input: {
    borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 12,
    padding: 12, fontSize: 16, minHeight: 60, textAlignVertical: "top",
  },
  letterInput: { minHeight: 260 },
  error: { color: "crimson" },
  button: { backgroundColor: "#333", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
});
