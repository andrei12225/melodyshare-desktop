export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  genres: string[];
  popularity: number;
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  images: { url: string; width: number; height: number }[];
  product: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  items?: { total: number };
  tracks?: { total: number } | number;
}

async function fetchSpotifyApi<T>(accessToken: string, endpoint: string, params: Record<string, string> = {}, retries: number = 3): Promise<T> {
  const url = new URL(`https://api.spotify.com/v1${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, 3 - retries) * 1000;
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchSpotifyApi<T>(accessToken, endpoint, params, retries - 1);
    }
    throw new Error(`Spotify API rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function getSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  return fetchSpotifyApi(accessToken, "/me");
}

export async function getTopTracks(accessToken: string, timeRange: string = "medium_term", limit: number = 10): Promise<{ items: SpotifyTrack[] }> {
  return fetchSpotifyApi(accessToken, "/me/top/tracks", { time_range: timeRange, limit: limit.toString() });
}

const AUDIODB_API_KEY = "123";

async function fetchAudioDB(artistName: string): Promise<string | null> {
  try {
    const url = `https://www.theaudiodb.com/api/v1/json/${AUDIODB_API_KEY}/search.php?s=${encodeURIComponent(artistName)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    return data.artists?.[0]?.strGenre || null;
  } catch {
    return null;
  }
}

export async function getTopArtists(accessToken: string, timeRange: string = "medium_term", limit: number = 10): Promise<{ items: SpotifyArtist[] }> {
  const topArtists = await fetchSpotifyApi<{ items: SpotifyArtist[] }>(accessToken, "/me/top/artists", { time_range: timeRange, limit: limit.toString() });
  
  if (topArtists.items.length === 0) {
    return topArtists;
  }
  
  try {
    const fullArtists: SpotifyArtist[] = [];
    
    for (const artist of topArtists.items) {
      const genre = await fetchAudioDB(artist.name);
      fullArtists.push({
        ...artist,
        genres: genre ? [genre] : []
      } as SpotifyArtist);
    }
    
    return { items: fullArtists };
  } catch (e) {
    console.error("Failed to fetch artist details:", e);
    return topArtists;
  }
}

export async function getRecentlyPlayed(accessToken: string, limit: number = 50): Promise<{ items: { played_at: string; track: SpotifyTrack }[] }> {
  return fetchSpotifyApi(accessToken, "/me/player/recently-played", { limit: limit.toString() });
}

export async function getLikedSongs(accessToken: string, limit: number = 50): Promise<{ items: SpotifyTrack[]; total: number }> {
  return fetchSpotifyApi(accessToken, "/me/tracks", { limit: limit.toString() });
}

export async function getUserPlaylists(accessToken: string, limit: number = 20): Promise<{ items: SpotifyPlaylist[] }> {
  return fetchSpotifyApi(accessToken, "/me/playlists", { limit: limit.toString() });
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getTimeRangeLabel(timeRange: string): string {
  switch (timeRange) {
    case "short_term":
      return "Last 4 Weeks";
    case "medium_term":
      return "Last 6 Months";
    case "long_term":
      return "All Time";
    default:
      return "Last 6 Months";
  }
}
