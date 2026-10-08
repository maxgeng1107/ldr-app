import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    {
        auth: {
            storage: AsyncStorage,      // save the session on disk → survives app restarts
            persistSession: true,
            autoRefreshToken: true,     // renew the access token before it expires
            detectSessionInUrl: false,  // a browser-only feature
        },
    },
);

// JavaScript is paused in the background, so only run the token refresh timer while the app is open
AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
});
