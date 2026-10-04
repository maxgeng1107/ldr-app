import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type Hello = { id: number; message: string}

export default function dbTest(){
    const [rows,setRows] = useState<Hello[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [errMsg,setErrMsg] = useState<string | null>(null);
    useEffect(() => {
        async function load(){
            const {data, error} = await supabase.from("hello").select("*");
            if (error) setErrMsg(error.message);
            else setRows(data);
            setLoading(false);
        }
        load();
    }, []);
    return(
        <View>
            {loading && <Text>Data is loading</Text>}
            {errMsg && <Text>{errMsg}</Text>}
            {!loading && rows.map((row) => 
                <Text key={row.id}> {row.id}: {row.message}</Text>)}
        </View>
    );
}