import { supabase } from "../supabase/client";
import { FaSpotify } from "react-icons/fa";

export default function LoginButton() {
  const handleLogin = async () => {
    // Use custom protocol if running in Tauri, otherwise use current origin
    const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;
    const redirectTo = isTauri ? 'melodyshare://login' : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        scopes: 'user-read-email user-library-read playlist-read-private user-top-read user-read-recently-played',
        redirectTo: redirectTo,
        queryParams: {
          prompt: 'consent'
        }
      },
    });

    if (error) {
        console.error("Login failed:", error.message);
        alert("Login failed: " + error.message);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold px-6 py-3 rounded-full flex items-center gap-3 transition-all duration-200 hover:scale-105"
    >
      <FaSpotify className="text-xl" />
      <span>Connect with Spotify</span>
    </button>
  );
}
