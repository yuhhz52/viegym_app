import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  getMyMessagesAPI,
  getConversationAPI,
  sendMessageAPI,
  markAsReadAPI,
  deleteConversationAPI,
  type ChatMessageResponse,
} from "@/api/chatApi";
import { wsService } from "@/services/websocket";

interface ConversationUser {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function UserMessages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ConversationUser | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserRef = useRef<ConversationUser | null>(null);

  useEffect(() => {
    fetchConversations();
    
    // Connect WebSocket
    if (user?.id) {
      wsService.connect(user.id);
      
      // Listen for new messages
      const unsubscribe = wsService.onMessage((message) => {
        console.log('New message received via WebSocket:', message);
        
        // Update messages if this conversation is open
        setMessages(prev => {
          // Use ref to get latest selectedUser
          const currentSelected = selectedUserRef.current;
          if (currentSelected && 
              (message.senderId === currentSelected.id || message.receiverId === currentSelected.id)) {
            // Avoid duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev;
            
            // Mark as read if we're the receiver
            if (message.receiverId === user.id) {
              markAsReadAPI(message.id).catch(console.error);
            }
            
            return [...prev, message];
          }
          return prev;
        });
        
        // Update conversation list
        setConversations(prev => {
          const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
          const partnerName = message.senderId === user.id ? message.receiverName : message.senderName;
          
          const existing = prev.find(c => c.id === partnerId);
          if (existing) {
            return prev.map(c => 
              c.id === partnerId 
                ? {
                    ...c,
                    lastMessage: message.content,
                    lastMessageTime: message.sentAt,
                    unreadCount: message.receiverId === user.id && selectedUserRef.current?.id !== partnerId
                      ? c.unreadCount + 1 
                      : c.unreadCount
                  }
                : c
            ).sort((a, b) => {
              const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
              const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
              return timeB - timeA;
            });
          } else {
            return [{
              id: partnerId,
              name: partnerName,
              lastMessage: message.content,
              lastMessageTime: message.sentAt,
              unreadCount: message.receiverId === user.id ? 1 : 0,
            }, ...prev];
          }
        });
      });
      
      return () => {
        unsubscribe();
        wsService.disconnect();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchConversation(selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const allMessages = await getMyMessagesAPI();
      
      // Group messages by conversation partner
      const conversationMap = new Map<string, ConversationUser>();
      
      allMessages.forEach((msg) => {
        const partnerId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
        const partnerName = msg.senderId === user?.id ? msg.receiverName : msg.senderName;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            name: partnerName,
            lastMessage: msg.content,
            lastMessageTime: msg.sentAt,
            unreadCount: 0,
          });
        }
        
        const conv = conversationMap.get(partnerId)!;
        
        // Update last message if this one is newer
        if (!conv.lastMessageTime || new Date(msg.sentAt) > new Date(conv.lastMessageTime)) {
          conv.lastMessage = msg.content;
          conv.lastMessageTime = msg.sentAt;
        }
        
        // Count unread messages
        if (msg.receiverId === user?.id && !msg.isRead) {
          conv.unreadCount++;
        }
      });
      
      const convArray = Array.from(conversationMap.values());
      // Sort by last message time
      convArray.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
      
      // Check if URL has userId query param (from booking page)
      const urlUserId = searchParams.get("userId");
      const urlUserName = searchParams.get("userName");
      
      if (urlUserId && urlUserName) {
        // Add or select this user
        const existing = convArray.find(c => c.id === urlUserId);
        if (existing) {
          setConversations(convArray);
          setSelectedUser(existing);
        } else {
          // Add new conversation
          const newConv: ConversationUser = {
            id: urlUserId,
            name: urlUserName,
            unreadCount: 0,
          };
          setConversations([newConv, ...convArray]);
          setSelectedUser(newConv);
        }
      } else {
        setConversations(convArray);
        if (convArray.length > 0 && !selectedUser) {
          setSelectedUser(convArray[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (userId: string) => {
    try {
      const data = await getConversationAPI(userId);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadMessages = data.filter(
        (msg) => msg.receiverId === user?.id && !msg.isRead
      );
      for (const msg of unreadMessages) {
        await markAsReadAPI(msg.id);
      }
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === userId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      toast.error("Không thể tải tin nhắn");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !newMessage.trim()) return;

    setSending(true);
    try {
      const sentMessage = await sendMessageAPI({
        receiverId: selectedUser.id,
        content: newMessage.trim(),
      });
      setMessages([...messages, sentMessage]);
      setNewMessage("");
      
      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(conv =>
          conv.id === selectedUser.id
            ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: sentMessage.sentAt }
            : conv
        );
        // Re-sort by time
        return updated.sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDeleteConversation = async (userId: string, userName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa cuộc trò chuyện với ${userName}?`)) {
      return;
    }

    try {
      await deleteConversationAPI(userId);
      setConversations(prev => prev.filter(c => c.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
      toast.success("Đã xóa cuộc trò chuyện");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Không thể xóa cuộc trò chuyện");
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-gray-700 p-6 shadow-sm">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent mb-2">
            Tin nhắn
          </h1>
          <p className="text-blue-600 dark:text-blue-400">
            Trò chuyện với huấn luyện viên
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
          {/* Conversations List */}
          <Card className="col-span-4 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-blue-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800">
              <h2 className="font-semibold text-blue-900 dark:text-blue-100">Cuộc trò chuyện ({conversations.length})</h2>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 text-blue-300 dark:text-blue-700" />
                    <p className="text-blue-500 dark:text-blue-400 text-sm">Chưa có tin nhắn nào</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <button
                        onClick={() => setSelectedUser(conv)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                          selectedUser?.id === conv.id
                            ? "bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 shadow-sm scale-[0.98]"
                            : "hover:bg-blue-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            selectedUser?.id === conv.id
                              ? "bg-gradient-to-br from-blue-600 to-blue-700"
                              : "bg-gradient-to-br from-blue-400 to-blue-500"
                          }`}>
                            {conv.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium text-sm text-blue-900 dark:text-blue-100 truncate">{conv.name}</div>
                              {conv.unreadCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-xs text-blue-500 dark:text-blue-400 truncate">{conv.lastMessage}</p>
                            )}
                            {conv.lastMessageTime && (
                              <p className="text-xs text-blue-400 dark:text-blue-500 mt-1">
                                {new Date(conv.lastMessageTime).toLocaleString("vi-VN", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id, conv.name);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa cuộc trò chuyện"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
        </Card>

          {/* Chat Area */}
          <Card className="col-span-8 flex flex-col bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-blue-200 dark:border-gray-700 p-5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">{selectedUser.name}</h3>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6 bg-blue-50 dark:bg-gray-900">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <MessageCircle className="w-20 h-20 mx-auto mb-4 text-blue-300 dark:text-blue-700" />
                        <p className="text-blue-500 dark:text-blue-400 font-medium">Chưa có tin nhắn nào</p>
                        <p className="text-sm text-blue-400 dark:text-blue-500 mt-1">Gửi tin nhắn đầu tiên để bắt đầu trò chuyện</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] min-w-[100px] rounded-2xl px-4 py-3 shadow-sm ${
                                isMe
                                  ? "bg-gradient-to-br from-blue-700 to-blue-800 text-white"
                                  : "bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 text-blue-900 dark:text-blue-100"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  isMe ? "text-blue-300" : "text-blue-500 dark:text-blue-400"
                                }`}
                              >
                                {new Date(msg.sentAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="border-t border-blue-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                  <div className="flex gap-3 items-end">
                    <textarea
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      disabled={sending}
                      rows={1}
                      className="flex-1 resize-none border border-blue-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-blue-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 rounded-lg px-4 py-2.5 text-sm text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 max-h-32 overflow-y-auto"
                      style={{
                        minHeight: '42px',
                        height: 'auto',
                      }}
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 px-6 shrink-0"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1.5">Enter để gửi, Shift+Enter để xuống dòng</p>
                </form>
            </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-gray-900">
                <div className="text-center">
                  <MessageCircle className="w-24 h-24 mx-auto mb-6 text-blue-300 dark:text-blue-700" />
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Chọn một cuộc trò chuyện</p>
                  <p className="text-sm text-blue-400 dark:text-blue-500 mt-1">để bắt đầu</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
