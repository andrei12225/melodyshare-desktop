import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase/client";
import { Session } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";
import { RiChat3Fill, RiSendPlaneFill, RiMusic2Fill, RiDeleteBinLine, RiArrowLeftLine } from "react-icons/ri";
import { FaSpotify } from "react-icons/fa";
import Avatar from "./Avatar";
import SongSearchModal from "./SongSearchModal";
import ConfirmationModal from "./ConfirmationModal";
import { SpotifyTrack } from "../spotify/api";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

const SONG_PREFIX = "SONG_SHARE::";

export default function ChatPage({ session, accessToken }: { session: Session; accessToken?: string }) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, [session.user.id]);

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend.id);
      
      const channel = supabase
        .channel(`chat:${selectedFriend.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${selectedFriend.id}`, // Listen for new messages FROM the friend
          },
          (payload) => {
             const newMsg = payload.new as Message;
             if (newMsg.sender_id === selectedFriend.id) {
               setMessages((prev) => [...prev, newMsg]);
             }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            // No filter here because DELETE payload only contains ID (no sender_id),
            // so filtering by sender_id would cause us to miss the event.
          },
          (payload) => {
             const deletedMsgId = payload.old.id;
             // Only removes if the ID exists in our current list
             setMessages((prev) => prev.filter((msg) => msg.id !== deletedMsgId));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedFriend, session.user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      // Reuse logic from FriendsPage roughly, or make a shared hook. duplicating for speed now.
      const { data: acceptedData } = await supabase
        .from('friendships')
        .select(`
          *,
          sender:profiles!user_id(*),
          receiver:profiles!friend_id(*)
        `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

      if (acceptedData) {
        const friendsList = acceptedData.map((f: any) => 
          f.user_id === session.user.id ? f.receiver : f.sender
        );
        const uniqueFriends = Array.from(new Map(friendsList.map((item: any) => [item.id, item])).values()) as Profile[];
        setFriends(uniqueFriends);
      }
    } catch (error) {
      console.error("Error fetching friends for chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (friendId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    const msgContent = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    try {
      const { data, error } = await (supabase
        .from('messages') as any)
        .insert({
          sender_id: session.user.id,
          receiver_id: selectedFriend.id,
          content: msgContent,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
      setNewMessage(msgContent); // Restore on failure
    }
  };

  const handleSendSong = async (track: SpotifyTrack) => {
    if (!selectedFriend) return;

    const songData = {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      image: track.album.images[0]?.url,
      uri: `https://open.spotify.com/track/${track.id}`
    };

    const msgContent = `${SONG_PREFIX}${JSON.stringify(songData)}`;
    
    try {
      const { data, error } = await (supabase
        .from('messages') as any)
        .insert({
          sender_id: session.user.id,
          receiver_id: selectedFriend.id,
          content: msgContent,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error("Error sending song:", error);
      alert("Failed to send song");
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    const messageId = messageToDelete;
    setMessageToDelete(null); // Close modal

    // Optimistic update
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    try {
      const { error, count } = await supabase
        .from('messages')
        .delete({ count: 'exact' })
        .eq('id', messageId);

      if (error) throw error;
      
      // If count is 0, it means the row wasn't deleted (likely RLS policy)
      if (count === 0) {
          throw new Error("Message could not be deleted. Check RLS policies.");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. You may not have permission.");
      // Revert optimistic update by refetching
      if (selectedFriend) fetchMessages(selectedFriend.id);
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4">
      <SongSearchModal 
        isOpen={isSongModalOpen} 
        onClose={() => setIsSongModalOpen(false)} 
        onSelect={handleSendSong}
        accessToken={accessToken}
      />
      
      <ConfirmationModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />

      {/* Sidebar: Friends List */}
      <div className={`
        w-full md:w-1/3 bg-zinc-900/50 rounded-xl p-4 flex flex-col h-full
        ${selectedFriend ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="flex items-center gap-2 mb-4">
          <RiChat3Fill className="text-spotify-green text-xl" />
          <h2 className="text-xl font-bold text-white">Chats</h2>
        </div>
        
        {loading ? (
          <p className="text-zinc-500 text-sm">Loading contacts...</p>
        ) : friends.length === 0 ? (
          <p className="text-zinc-500 text-sm">No friends yet. Add some in the Friends tab!</p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {friends.map((friend) => (
              <div 
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedFriend?.id === friend.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
              >
                <div className="relative">
                  <Avatar url={friend.avatar_url} alt={friend.username || "User"} size="md" />
                  {/* Online status indicator could go here */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{friend.full_name || friend.username}</p>
                  <p className="text-zinc-500 text-xs truncate">@{friend.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className={`
        flex-1 bg-zinc-900/50 rounded-xl flex-col overflow-hidden h-full
        ${selectedFriend ? 'flex' : 'hidden md:flex'}
      `}>
        {selectedFriend ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <button 
                onClick={() => setSelectedFriend(null)}
                className="md:hidden text-zinc-400 hover:text-white mr-2"
              >
                <RiArrowLeftLine size={24} />
              </button>
              <Avatar url={selectedFriend.avatar_url} alt={selectedFriend.username || "User"} size="sm" />
              <h2 className="text-white font-bold">{selectedFriend.full_name || selectedFriend.username}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id;
                
                const isSong = msg.content.startsWith(SONG_PREFIX);
                let songData = null;
                if (isSong) {
                    try {
                        songData = JSON.parse(msg.content.substring(SONG_PREFIX.length));
                    } catch (e) {}
                }

                return (
                  <div key={msg.id} className={`group flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} items-center`}>
                    {isMe && (
                      <button
                        onClick={() => setMessageToDelete(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity p-2 cursor-pointer"
                        title="Delete message"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    )}
                    {!isMe && (
                      <div className="flex-shrink-0 self-end">
                         <Avatar url={selectedFriend.avatar_url} size="xs" />
                      </div>
                    )}
                    
                    {songData ? (
                        // Song Card
                        <div className={`max-w-[300px] w-full p-3 rounded-2xl ${isMe ? 'bg-spotify-green text-black rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
                            <div className="flex gap-3 items-center mb-2">
                                <img src={songData.image} alt={songData.name} className="w-16 h-16 rounded shadow-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate text-sm">{songData.name}</p>
                                    <p className={`text-xs truncate ${isMe ? 'text-black/70' : 'text-zinc-400'}`}>{songData.artist}</p>
                                </div>
                            </div>
                            <a 
                                href={songData.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`flex items-center justify-center gap-2 w-full py-2 rounded-full text-xs font-bold transition-colors ${
                                    isMe 
                                    ? 'bg-black/10 hover:bg-black/20 text-black' 
                                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                                }`}
                            >
                                <FaSpotify /> Play on Spotify
                            </a>
                             <p className={`text-[10px] mt-2 text-right ${isMe ? 'text-black/60' : 'text-zinc-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </p>
                        </div>
                    ) : (
                        // Text Message
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${isMe ? 'bg-spotify-green text-black rounded-br-none' : 'bg-zinc-800 text-white rounded-bl-none'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-zinc-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsSongModalOpen(true)}
                    className="w-10 h-10 bg-zinc-800 text-zinc-400 hover:text-spotify-green rounded-full flex items-center justify-center transition-colors"
                    title="Share Song"
                >
                    <RiMusic2Fill size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-spotify-green focus:outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  <RiSendPlaneFill />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <RiChat3Fill className="text-4xl mb-4 opacity-50" />
            <p>Select a friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
