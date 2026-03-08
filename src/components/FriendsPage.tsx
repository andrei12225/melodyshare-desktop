import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { Session } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";
import { RiUserAddFill, RiUserReceivedFill, RiCheckFill, RiCloseFill, RiSearchLine, RiUser3Fill, RiUserUnfollowFill } from "react-icons/ri";
import ConfirmationModal from "./ConfirmationModal";
import Avatar from "./Avatar";

type Profile = Database['public']['Tables']['profiles']['Row'];


export default function FriendsPage({ session }: { session: Session }) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<(Database['public']['Tables']['friendships']['Row'] & { sender: Profile })[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Profile | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "info" } | null>(null);

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertState({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchTerm}%`)
        .neq('id', session.user.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsAndRequests();

    // Subscribe to realtime changes for friendships
    const channel = supabase
      .channel('friendships_page_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          // Removing specific filter to ensure we catch all events, then filtering client-side
        },
        (payload) => {
           const newRecord = payload.new as any;
           const oldRecord = payload.old as any;
           const myId = session.user.id;

           // Check if the change involves the current user
           const involvesMe = 
             (newRecord && (newRecord.user_id === myId || newRecord.friend_id === myId)) ||
             (oldRecord && (oldRecord.user_id === myId || oldRecord.friend_id === myId));

           if (involvesMe) {
             fetchFriendsAndRequests();
           }
        }
      )
      .subscribe();

    // Polling fallback (every 5 seconds) to ensure UI stays in sync if realtime fails
    // Pass true for background fetch to avoid loading spinner
    const interval = setInterval(() => fetchFriendsAndRequests(true), 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [session.user.id]);

  const fetchFriendsAndRequests = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // Fetch friends (accepted friendships where user is sender or receiver)
      const { data: acceptedData, error: acceptedError } = await supabase
        .from('friendships' as any)
        .select(`
          *,
          sender:profiles!user_id(*),
          receiver:profiles!friend_id(*)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      if (acceptedError) throw acceptedError;

      const friendsList = (acceptedData as any[]).map(f => 
        f.user_id === session.user.id ? f.receiver : f.sender
      ) as Profile[]; // Cast because joined profiles might be arrays or single objects depending on relationship definition, but usually single. Assuming single here. 
      // Actually with supabase-js v2 types, relations can be tricky. Let's assume correct data structure.

      // Fetch incoming requests (pending friendships where user is receiver)
      const { data: requestsData, error: requestsError } = await supabase
        .from('friendships' as any)
        .select(`
          *,
          sender:profiles!user_id(*)
        `)
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // Filter out duplicates if any (though DB constraints should prevent this)
      const uniqueFriends = Array.from(new Map(friendsList.map(item => [item.id, item])).values());

      setFriends(uniqueFriends);
      setIncomingRequests((requestsData as any) || []); // Cast to fix type inference if needed
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled by useEffect on searchTerm change
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      // Check if request already exists
      const { data: existing } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`and(user_id.eq.${session.user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${session.user.id})`)
        .maybeSingle();

      if (existing) {
        showAlert("Request Exists", "Friendship or request already exists!", "info");
        return;
      }

      const { error } = await (supabase
        .from('friendships' as any) as any)
        .insert({
          user_id: session.user.id,
          friend_id: userId,
          status: 'pending'
        });

      if (error) throw error;
      showAlert("Success", "Friend request sent!", "success");
      setSearchResults([]); // Clear search to avoid spamming
      setSearchTerm("");
    } catch (error) {
      console.error("Error sending friend request:", error);
      showAlert("Error", "Failed to send request.", "error");
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await (supabase
        .from('friendships' as any) as any)
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      // Manually refresh to ensure UI updates even if Realtime fails
      fetchFriendsAndRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    try {
      const { error } = await (supabase
        .from('friendships' as any) as any)
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      // Manually refresh to ensure UI updates even if Realtime fails
      fetchFriendsAndRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleRemoveFriendClick = (friend: Profile) => {
    setFriendToRemove(friend);
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    
    try {
      const { error } = await supabase
        .from('friendships' as any)
        .delete()
        .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendToRemove.id}),and(user_id.eq.${friendToRemove.id},friend_id.eq.${session.user.id})`);

      if (error) throw error;
      
      // Manually update local state to reflect removal immediately
      setFriends(prev => prev.filter(f => f.id !== friendToRemove.id));
      fetchFriendsAndRequests(); // Full refresh to be safe
    } catch (error) {
      console.error("Error removing friend:", error);
      showAlert("Error", "Failed to remove friend", "error");
    } finally {
      setFriendToRemove(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <ConfirmationModal
        isOpen={!!friendToRemove}
        onClose={() => setFriendToRemove(null)}
        onConfirm={confirmRemoveFriend}
        title="Remove Friend"
        message={`Are you sure you want to remove ${friendToRemove?.full_name || friendToRemove?.username} from your friends list? This action cannot be undone.`}
        confirmText="Remove"
        confirmColor="red"
      />

      {/* Alert Modal */}
      <ConfirmationModal
        isOpen={!!alertState?.isOpen}
        onClose={() => setAlertState(null)}
        title={alertState?.title || ""}
        message={alertState?.message || ""}
        confirmText="OK"
        cancelText={null}
        confirmColor={alertState?.type === "error" ? "red" : "green"}
      />

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center">
          <RiUser3Fill className="text-3xl text-black" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm">Your</p>
          <h1 className="text-3xl font-bold text-white">Friends</h1>
        </div>
      </div>

      {/* Friend Requests Section */}
      {incomingRequests.length > 0 && (
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUserReceivedFill className="text-spotify-green" />
            Friend Requests
          </h2>
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar url={request.sender.avatar_url} alt={request.sender.username || "User"} size="md" />
                  <div>
                    <p className="text-white font-medium">{request.sender.full_name || request.sender.username}</p>
                    <p className="text-zinc-500 text-xs">@{request.sender.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => acceptRequest(request.id)}
                    className="p-2 bg-spotify-green text-black rounded-full hover:scale-105 transition-transform"
                    title="Accept"
                  >
                    <RiCheckFill />
                  </button>
                  <button 
                    onClick={() => rejectRequest(request.id)}
                    className="p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500/30 transition-colors"
                    title="Reject"
                  >
                    <RiCloseFill />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Friends List */}
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUser3Fill className="text-spotify-green" />
            Your Friends ({friends.length})
          </h2>
          {loading ? (
             <p className="text-zinc-500">Loading friends...</p>
          ) : friends.length === 0 ? (
            <p className="text-zinc-500">No friends yet. Add some!</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Avatar url={friend.avatar_url} alt={friend.username || "User"} size="md" />
                    <div>
                      <p className="text-white font-medium">{friend.full_name || friend.username}</p>
                      <p className="text-zinc-500 text-xs">@{friend.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriendClick(friend)}
                    className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Friend"
                  >
                    <RiUserUnfollowFill />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Friend */}
        <div className="bg-zinc-900/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RiUserAddFill className="text-spotify-green" />
            Add Friend
          </h2>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-spotify-green transition-colors"
              />
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
            {/* Removed Search button as it's now live search */}
          </form>

          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar url={user.avatar_url} alt={user.username || "User"} size="sm" />
                  <p className="text-white text-sm font-medium">{user.username}</p>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="text-xs bg-spotify-green text-black px-3 py-1 rounded-full hover:scale-105 transition-transform"
                >
                  Add
                </button>
              </div>
            ))}
            {searchResults.length === 0 && searchTerm && !searchLoading && (
              <p className="text-zinc-500 text-center text-sm">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
