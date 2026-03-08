import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase/client";
import { Session } from "@supabase/supabase-js";
import { Database } from "../lib/database.types";
import { RiChat3Fill, RiSendPlaneFill, RiUser3Fill } from "react-icons/ri";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export default function ChatPage({ session }: { session: Session }) {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

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
            filter: `sender_id=eq.${selectedFriend.id}`, // Listen for messages FROM the friend
          },
          (payload) => {
             // Only add if it's for me (implicit by subscription filter usually, but filter above is sender specific)
             // We also need to check if receiver is me, but filter supports limited syntax.
             // Easier to just listen to all inserts involving these two users if possible, or just listen to all 'messages' where receiver_id is me.
             // Better: Listen to `receiver_id=eq.${session.user.id}` and filter in callback.
             const newMsg = payload.new as Message;
             if (newMsg.sender_id === selectedFriend.id) {
               setMessages((prev) => [...prev, newMsg]);
             }
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

  return (
    <div className="h-[calc(100vh-100px)] flex gap-4">
      {/* Sidebar: Friends List */}
      <div className="w-1/3 bg-zinc-900/50 rounded-xl p-4 flex flex-col">
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
                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center relative">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt={friend.username || "User"} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <RiUser3Fill className="text-zinc-400" />
                  )}
                  {/* Online status indicator could go here */}
                </div>
                <div>
                  <p className="text-white font-medium truncate">{friend.full_name || friend.username}</p>
                  <p className="text-zinc-500 text-xs truncate">@{friend.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-zinc-900/50 rounded-xl flex flex-col overflow-hidden">
        {selectedFriend ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                {selectedFriend.avatar_url ? (
                  <img src={selectedFriend.avatar_url} alt={selectedFriend.username || "User"} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <RiUser3Fill className="text-zinc-400 text-sm" />
                )}
              </div>
              <h2 className="text-white font-bold">{selectedFriend.full_name || selectedFriend.username}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === session.user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${isMe ? 'bg-spotify-green text-black' : 'bg-zinc-800 text-white'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-black/60' : 'text-zinc-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex gap-2">
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
