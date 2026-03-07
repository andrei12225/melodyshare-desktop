import { ReactNode } from "react";
import { supabase } from "../supabase/client.ts";
import { Session } from "@supabase/supabase-js";
import LoginButton from "./LoginButton.tsx";
import { RiHomeFill, RiBarChartFill, RiHeartFill, RiLogoutBoxFill, RiMusic2Fill, RiCompassDiscoverFill } from "react-icons/ri";
import { FaSpotify } from "react-icons/fa";

interface SidebarProps {
  session: Session | null;
}

function Sidebar({ session }: SidebarProps) {
  return (
    <aside className="w-64 bg-black h-screen flex flex-col p-6 fixed left-0 top-0">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-white mb-8">
          <FaSpotify className="text-4xl text-spotify-green" />
          <span className="text-2xl font-bold tracking-tight">MelodyShare</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <SidebarLink icon={<RiHomeFill />} text="Home" active />
        <SidebarLink icon={<RiBarChartFill />} text="Stats" disabled />
        <SidebarLink icon={<RiHeartFill />} text="Liked Songs" disabled />
        <SidebarLink icon={<RiCompassDiscoverFill />} text="Discover" disabled />
      </nav>

      <div className="mt-auto pt-6 border-t border-zinc-800">
        {session ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors py-2 w-full"
          >
            <RiLogoutBoxFill className="text-xl" />
            <span>Sign Out</span>
          </button>
        ) : (
          <LoginButton />
        )}
      </div>
    </aside>
  );
}

function SidebarLink({ icon, text, active = false, disabled = false }: { icon: ReactNode; text: string; active?: boolean; disabled?: boolean }) {
  const baseClasses = "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200";
  const activeClasses = "bg-zinc-900 text-white";
  const inactiveClasses = "text-zinc-400 hover:text-white hover:bg-zinc-900";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <div className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : "cursor-pointer"}`}>
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-8 mb-8">
      <div className="absolute inset-0 bg-[url('/wave.svg')] opacity-5 bg-cover bg-center" />
      <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6">
          <FaSpotify className="text-7xl text-spotify-green animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">MelodyShare</h1>
        <p className="text-xl text-zinc-300 mb-8">Your personal Spotify listening stats</p>
        <div className="flex items-center gap-2 text-zinc-400 mb-6">
          <span>Connect with</span>
          <span className="text-spotify-green font-semibold">Spotify</span>
          <span>to get started</span>
        </div>
        <LoginButton />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="bg-zinc-900/50 hover:bg-zinc-800/50 rounded-xl p-6 transition-all duration-300 cursor-pointer group">
      <div className="text-spotify-green text-3xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">What's Inside</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={<RiBarChartFill />}
          title="Listening Stats"
          description="View your top tracks, artists, and genres over time"
        />
        <FeatureCard
          icon={<RiHeartFill />}
          title="Liked Songs"
          description="Browse and manage your saved tracks"
        />
        <FeatureCard
          icon={<RiCompassDiscoverFill />}
          title="Discover"
          description="Find new music based on your listening habits"
        />
      </div>
    </div>
  );
}

function DashboardPlaceholder() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center">
          <RiMusic2Fill className="text-3xl text-black" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">Welcome back</p>
          <h1 className="text-3xl font-bold text-white">Your Stats</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Top Artist" value="-" />
        <StatCard label="Top Track" value="-" />
        <StatCard label="Total Minutes" value="-" />
        <StatCard label="Songs Liked" value="-" />
      </div>

      <div className="bg-zinc-900/50 rounded-xl p-6">
        <p className="text-zinc-400 text-center">
          Your listening data will appear here once connected to Spotify.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-xl font-bold truncate">{value}</p>
    </div>
  );
}

export default function MainPage({ session }: { session: Session | null }) {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar session={session} />
      
      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {!session ? (
            <>
              <HeroSection />
              <FeaturesSection />
            </>
          ) : (
            <DashboardPlaceholder />
          )}
        </div>
      </main>
    </div>
  );
}
