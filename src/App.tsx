import "./App.css";
import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabase/client.ts";
import { Session } from "@supabase/supabase-js";
import SplashScreen from "./components/SplashScreen.tsx";
import MainPage from "./components/MainPage.tsx";

function App() {
    const [returningFromLogin, setReturningFromLogin] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const spotifyTokenRef = useRef<string | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            const hash = window.location.hash;
            const searchParams = new URLSearchParams(window.location.search);
            const error = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");
            
            if (error) {
                console.error("Auth error:", error, errorDescription);
                setLoading(false);
                setShowSplash(false);
                window.location.search = "";
                return;
            }
            
            if ((hash && hash.includes("access_token")) || searchParams.has("access_token")) {
                setReturningFromLogin(true);
                setShowSplash(false);
                
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error("Session error:", sessionError);
                }
                
                if (session) {
                    setSession(session);
                    if (session.provider_token) {
                        spotifyTokenRef.current = session.provider_token;
                        setAccessToken(session.provider_token);
                    }
                } else {
                    setLoading(false);
                    setTimeout(() => {
                        window.location.hash = "";
                        window.location.search = "";
                    }, 100);
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session?.provider_token) {
                spotifyTokenRef.current = session.provider_token;
                setAccessToken(session.provider_token);
            }
            setLoading(false);
        };

        handleAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            
            if (event === "SIGNED_IN" && session?.provider_token) {
                if (!spotifyTokenRef.current) {
                    spotifyTokenRef.current = session.provider_token;
                    setAccessToken(session.provider_token);
                }
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!returningFromLogin && !loading) {
            const timer = setTimeout(() => {
                setShowSplash(false);
            }, 2000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [returningFromLogin, loading]);

    if (showSplash) return <SplashScreen />;
    return <MainPage session={session} spotifyToken={spotifyTokenRef.current || accessToken} />;
}

export default App;
