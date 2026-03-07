import "./App.css";
import {useEffect, useState} from "react";
import {supabase} from "./supabase/client.ts";
import {Session} from "@supabase/supabase-js";
import SplashScreen from "./components/SplashScreen.tsx";
import MainPage from "./components/MainPage.tsx";

function App() {
    const returningFromLogin = window.location.href.includes("access_token=");
    const [showSplash, setShowSplash] = useState<Boolean>(!returningFromLogin);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data : {session} }) => {
            setSession(session);
        });

        const {
            data: {subscription}
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => { subscription.unsubscribe(); }
    }, []);

    useEffect(() => {
        if (!returningFromLogin) {
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 2000);

            return () => {
                clearTimeout(timer);
            }
        }
    }, []);

    if (showSplash) return <SplashScreen />;
    if (!showSplash) return (
        <MainPage session={session}/>
    )
}

export default App;
