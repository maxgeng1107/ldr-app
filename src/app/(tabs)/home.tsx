import { supabase } from "@/lib/supabase";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

type Moment = {
  id: string;
  author_id: string;
  kind: "photo" | "letter";
  storage_path: string | null;
  body: string | null;
  created_at: string;
};

export default function Home() {
  const [me, setMe] = useState<{ id: string; couple_id: string | null } | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});   // user id → name
  const [moments, setMoments] = useState<Moment[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({}); // storage path → signed URL
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile, error } = await supabase.from("users").select("id, couple_id").eq("id", user.id).single();
    if (error || !profile) { console.log(error?.message); setLoading(false); return; }
    setMe(profile);
    if (!profile.couple_id) { setLoading(false); return; }

    // both members' names, to label who posted what
    const { data: members } = await supabase.from("users").select("id, name").eq("couple_id", profile.couple_id);
    setNames(Object.fromEntries((members ?? []).map((m) => [m.id, m.name])));

    // the timeline: newest first
    const { data: rows, error: momentsError } = await supabase
      .from("moments").select("*").eq("couple_id", profile.couple_id).order("created_at", { ascending: false });
    if (momentsError) { console.log(momentsError.message); setLoading(false); return; }
    setMoments(rows ?? []);

    // private photos need short-lived signed URLs — ask for all of them in one request
    const paths = (rows ?? []).filter((r) => r.storage_path).map((r) => r.storage_path as string);
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from("photos").createSignedUrls(paths, 60 * 60);
      setPhotoUrls(Object.fromEntries((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl])));
    }
    setLoading(false);
  }

  // reload every time Home comes into view — e.g. after posting a moment
  useFocusEffect(useCallback(() => { load(); }, []));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return <Text style={styles.center}>Loading…</Text>;
  if (!me?.couple_id) return <Text style={styles.center}>Pair with your partner on the Profile tab first.</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push("/new-moment?kind=photo")}>
          <Text style={styles.actionText}>＋ Photo</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => router.push("/new-moment?kind=letter")}>
          <Text style={styles.actionText}>✉︎ Letter</Text>
        </Pressable>
      </View>

      <FlatList
        data={moments}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={<Text style={styles.empty}>Your timeline is empty. Share the first moment.</Text>}
        renderItem={({ item }) => {
          const mine = item.author_id === me.id;
          return (
            <View style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}>
              <View style={styles.dot} />
              <View style={styles.card}>
                <Text style={styles.meta}>
                  {names[item.author_id] ?? "Someone"} · {new Date(item.created_at).toLocaleDateString()}
                </Text>
                {item.kind === "photo" && item.storage_path && photoUrls[item.storage_path] && (
                  <Image source={{ uri: photoUrls[item.storage_path] }} style={styles.photo} />
                )}
                {item.body && (
                  <Text style={item.kind === "letter" ? styles.letter : styles.caption}>{item.body}</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  center: { flex: 1, textAlign: "center", marginTop: 80, color: "#666" },
  actions: { flexDirection: "row", gap: 12, padding: 16, justifyContent: "center" },
  actionButton: { backgroundColor: "#333", borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 },
  actionText: { color: "white", fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  // each card hangs off a dot: mine on the right, my partner's on the left (the "tree")
  row: { flexDirection: "row", alignItems: "flex-start", marginVertical: 10 },
  rowLeft: { paddingRight: "20%" },
  rowRight: { paddingLeft: "20%", flexDirection: "row-reverse" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#333", marginTop: 14, marginHorizontal: 8 },
  card: { flex: 1, borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 14, padding: 12, gap: 8 },
  meta: { fontSize: 12, color: "#999" },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  caption: { fontSize: 15 },
  letter: { fontSize: 15, lineHeight: 22, fontStyle: "italic" },
});
