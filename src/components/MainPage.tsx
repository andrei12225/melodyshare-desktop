import { ReactNode, useEffect, useState } from "react";
import { supabase } from "../supabase/client.ts";
import { Session } from "@supabase/supabase-js";
import LoginButton from "./LoginButton.tsx";
import { RiHomeFill, RiBarChartFill, RiHeartFill, RiLogoutBoxFill, RiMusic2Fill, RiCompassDiscoverFill, RiLoader4Line, RiTimeLine } from "react-icons/ri";
import { FaSpotify } from "react-icons/fa";
import { getSpotifyProfile, getTopTracks, getTopArtists, getLikedSongs, getRecentlyPlayed, getUserPlaylists, formatDuration, getTimeRangeLabel, SpotifyProfile, SpotifyTrack, SpotifyArtist } from "../spotify/api.ts";

type Page = "home" | "stats";

interface SidebarProps {
  session: Session | null;
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

function Sidebar({ session, currentPage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-black h-screen flex flex-col p-6 fixed left-0 top-0">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-white mb-8">
          <FaSpotify className="text-4xl text-spotify-green" />
          <span className="text-2xl font-bold tracking-tight">MelodyShare</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <SidebarLink 
          icon={<RiHomeFill />} 
          text="Home" 
          active={currentPage === "home"} 
          onClick={() => onPageChange("home")}
        />
        <SidebarLink 
          icon={<RiBarChartFill />} 
          text="Stats" 
          active={currentPage === "stats"} 
          onClick={() => onPageChange("stats")}
          disabled={!session}
        />
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

function SidebarLink({ icon, text, active = false, disabled = false, onClick }: { icon: ReactNode; text: string; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  const baseClasses = "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200";
  const activeClasses = "bg-zinc-900 text-white";
  const inactiveClasses = "text-zinc-400 hover:text-white hover:bg-zinc-900";
  const disabledClasses = "opacity-50 cursor-not-allowed";

  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : "cursor-pointer"}`}
    >
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

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <RiLoader4Line className="text-4xl text-spotify-green animate-spin mb-4" />
      <p className="text-zinc-400">Loading...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-red-900/20 border border-red-900 rounded-xl p-6 text-center">
      <p className="text-red-400">{message}</p>
    </div>
  );
}

function TrackRow({ track, index, showPlayedAt }: { track: SpotifyTrack; index: number; showPlayedAt?: string }) {
  const albumImage = track.album?.images?.[0]?.url || "https://via.placeholder.com/64";
  const artistNames = track.artists?.map((a) => a.name).join(", ") || "Unknown Artist";

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors group">
      <span className="text-zinc-500 w-6 text-center">{index + 1}</span>
      <img src={albumImage} alt={track.album?.name || "Album"} className="w-12 h-12 rounded" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{track.name}</p>
        <p className="text-zinc-400 text-sm truncate">{artistNames}</p>
      </div>
      {showPlayedAt && (
        <span className="text-zinc-500 text-sm">{showPlayedAt}</span>
      )}
      <span className="text-zinc-500 text-sm">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}

function ArtistCard({ artist, index }: { artist: SpotifyArtist; index: number }) {
  const artistImage = artist.images?.[0]?.url || "https://via.placeholder.com/150";

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg transition-colors">
      <span className="text-zinc-500 w-6 text-center">{index + 1}</span>
      <img src={artistImage} alt={artist.name} className="w-14 h-14 rounded-full" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{artist.name}</p>
        {artist.genres?.[0] && (
          <p className="text-zinc-400 text-sm truncate">{artist.genres[0]}</p>
        )}
      </div>
    </div>
  );
}

function HomeDashboard({ accessToken }: { accessToken: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [likedSongsCount, setLikedSongsCount] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<string>("medium_term");

  useEffect(() => {
    if (!accessToken) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [profileData, tracksData, artistsData, likedData] = await Promise.all([
          getSpotifyProfile(accessToken),
          getTopTracks(accessToken, timeRange, 10),
          getTopArtists(accessToken, timeRange, 10),
          getLikedSongs(accessToken, 1),
        ]);
        setProfile(profileData);
        setTopTracks(tracksData.items);
        setTopArtists(artistsData.items);
        setLikedSongsCount(likedData.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [accessToken, timeRange]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const profileImage = profile?.images?.[0]?.url;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {profileImage ? (
          <img src={profileImage} alt={profile?.display_name} className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center">
            <RiMusic2Fill className="text-3xl text-black" />
          </div>
        )}
        <div>
          <p className="text-zinc-400 text-sm">Welcome back</p>
          <h1 className="text-3xl font-bold text-white">{profile?.display_name || "Spotify User"}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Top Artist</p>
          <p className="text-white text-xl font-bold truncate">{topArtists[0]?.name || "-"}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Top Track</p>
          <p className="text-white text-xl font-bold truncate">{topTracks[0]?.name || "-"}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Liked Songs</p>
          <p className="text-white text-xl font-bold">{likedSongsCount.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Time Range</p>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-700 text-white text-xl font-bold cursor-pointer rounded px-2 py-1 focus:outline-none"
          >
            <option value="short_term">4 Weeks</option>
            <option value="medium_term">6 Months</option>
            <option value="long_term">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartFill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Tracks</h2>
            <span className="text-zinc-500 text-sm">({getTimeRangeLabel(timeRange)})</span>
          </div>
          <div className="space-y-1">
            {topTracks.map((track, index) => (
              <TrackRow key={track.id} track={track} index={index} />
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiMusic2Fill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Artists</h2>
            <span className="text-zinc-500 text-sm">({getTimeRangeLabel(timeRange)})</span>
          </div>
          <div className="space-y-1">
            {topArtists.map((artist, index) => (
              <ArtistCard key={artist.id} artist={artist} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsDashboard({ accessToken }: { accessToken: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTracks, setRecentTracks] = useState<{ played_at: string; track: SpotifyTrack }[]>([]);
  const [playlists, setPlaylists] = useState<{ items: { id: string; name: string; images: { url: string }[]; items?: { total: number }; tracks?: { total: number } | number | null }[] }>({ items: [] });
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [recentData, playlistsData, artistsData] = await Promise.all([
          getRecentlyPlayed(accessToken, 50),
          getUserPlaylists(accessToken, 20),
          getTopArtists(accessToken, "medium_term", 10),
        ]);
        setRecentTracks(recentData.items);
        setPlaylists(playlistsData);
        setTopArtists(artistsData.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [accessToken]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const formatPlayedAt = (playedAt: string) => {
    const date = new Date(playedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalPlaylistTracks = playlists.items.reduce((acc, p) => {
    const tracks = p.items?.total || (typeof p.tracks === 'number' ? p.tracks : p.tracks?.total || 0);
    return acc + tracks;
  }, 0);

  const genreCounts: Record<string, number> = {};
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  const genreData = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count], _, arr) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
      count,
      percentage: Math.round((count / arr.reduce((s, [, c]) => s + c, 0)) * 100)
    }));

  const getColor = (index: number) => {
    const colors = [
      '#1DB954', // spotify green
      '#1ed760', // bright green
      '#b3b3b3', // light gray
      '#535353', // dark gray
      '#ffffff', // white
      '#ff6b6b', // coral red
    ];
    return colors[index % 6];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center">
          <RiBarChartFill className="text-3xl text-black" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">Your</p>
          <h1 className="text-3xl font-bold text-white">Stats</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Playlists</p>
          <p className="text-white text-xl font-bold">{playlists.items.length}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Tracks</p>
          <p className="text-white text-xl font-bold">{totalPlaylistTracks.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-800/50 rounded-lg p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Recently Played</p>
          <p className="text-white text-xl font-bold">{recentTracks.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiTimeLine className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Recently Played</h2>
          </div>
          <div className="space-y-1">
            {recentTracks.slice(0, 10).map((item, index) => (
              <TrackRow 
                key={`${item.track.id}-${item.played_at}`} 
                track={item.track} 
                index={index}
                showPlayedAt={formatPlayedAt(item.played_at)}
              />
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <RiBarChartFill className="text-spotify-green" />
            <h2 className="text-xl font-bold text-white">Top Genres</h2>
          </div>
          {genreData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const displayGenres = genreData.slice(0, 6);
                    let currentAngle = 0;
                    return displayGenres.map((genre, i) => {
                      const sliceAngle = (genre.count / displayGenres.reduce((s, g) => s + g.count, 0)) * 100;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + sliceAngle;
                      const startRad = (startAngle / 100) * 2 * Math.PI;
                      const endRad = (endAngle / 100) * 2 * Math.PI;
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      const largeArc = sliceAngle > 50 ? 1 : 0;
                      currentAngle = endAngle;
                      return (
                        <path
                          key={genre.name}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          className="stroke-black stroke-[0.5]"
                          style={{ 
                            fill: getColor(i),
                            animation: `pieSlice 0.4s ease-out ${i * 0.15}s both`
                          }}
                        />
                      );
                    });
                  })()}
                  <circle cx="50" cy="50" r="25" className="fill-black" />
                </svg>
              </div>
              <div className="mt-4 w-full">
                {genreData.slice(0, 6).map((genre, i) => (
                  <div key={genre.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(i) }} />
                      <span className="text-zinc-300 text-sm truncate max-w-[150px]">{genre.name}</span>
                    </div>
                    <span className="text-zinc-500 text-sm">{genre.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-center py-8">No genre data available</p>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <RiHeartFill className="text-spotify-green" />
          <h2 className="text-xl font-bold text-white">Your Playlists</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.items.map((playlist) => (
            <div key={playlist.id} className="bg-zinc-800/30 rounded-lg p-3 hover:bg-zinc-800/50 transition-colors">
              {playlist.images?.[0]?.url ? (
                <img src={playlist.images[0].url} alt={playlist.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full aspect-square bg-zinc-700 rounded-lg mb-2 flex items-center justify-center">
                  <RiMusic2Fill className="text-3xl text-zinc-500" />
                </div>
              )}
              <p className="text-white text-sm font-medium truncate">{playlist.name}</p>
              <p className="text-zinc-500 text-xs">{playlist.items?.total || (typeof playlist.tracks === 'number' ? playlist.tracks : playlist.tracks?.total || 0)} tracks</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MainPageProps {
  session: Session | null;
  spotifyToken?: string | null;
}

export default function MainPage({ session, spotifyToken }: MainPageProps) {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const accessToken = session?.provider_token || spotifyToken;

  return (
    <div className="min-h-screen bg-black">
      <Sidebar session={session} currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {!session ? (
            <>
              <HeroSection />
              <FeaturesSection />
            </>
          ) : !accessToken ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-zinc-400 mb-4">Loading your session...</p>
              <p className="text-zinc-500 text-sm">If this persists, try logging out and logging back in.</p>
            </div>
          ) : currentPage === "home" ? (
            <HomeDashboard accessToken={accessToken} />
          ) : (
            <StatsDashboard accessToken={accessToken} />
          )}
        </div>
      </main>
    </div>
  );
}
