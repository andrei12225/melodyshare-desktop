import { useState, useEffect } from "react";
import { RiCloseLine, RiSearchLine, RiMusic2Fill, RiSendPlaneFill } from "react-icons/ri";
import { searchTracks, SpotifyTrack } from "../spotify/api";

interface SongSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (track: SpotifyTrack) => void;
  accessToken: string | undefined;
}

export default function SongSearchModal({ isOpen, onClose, onSelect, accessToken }: SongSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim() && accessToken) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, accessToken]);

  const performSearch = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await searchTracks(accessToken, query);
      setResults(data.tracks?.items || []);
    } catch (error) {
      console.error("Error searching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <RiSearchLine className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none flex-1 text-lg"
            autoFocus
          />
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <RiCloseLine size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
                <RiLoader4Line className="animate-spin text-2xl mr-2" /> Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
              <RiMusic2Fill size={32} className="opacity-50" />
              <p>Type to search songs</p>
            </div>
          ) : (
            results.map((track) => (
              <div 
                key={track.id}
                className="flex items-center gap-3 p-3 hover:bg-zinc-800/50 rounded-lg group transition-colors cursor-pointer"
                onClick={() => {
                  onSelect(track);
                  onClose();
                }}
              >
                <img 
                  src={track.album.images[2]?.url || track.album.images[0]?.url} 
                  alt={track.name} 
                  className="w-12 h-12 rounded object-cover bg-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  <p className="text-zinc-400 text-xs truncate">
                    {track.artists.map(a => a.name).join(", ")}
                  </p>
                </div>
                <button
                  className="bg-spotify-green text-black p-2 rounded-full hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                  title="Send Song"
                >
                  <RiSendPlaneFill />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper needed for the loader icon if not imported
import { RiLoader4Line } from "react-icons/ri";
