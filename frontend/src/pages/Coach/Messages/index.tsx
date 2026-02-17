import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  getConversationAPI,
  sendMessageAPI,
  markAsReadAPI,
  deleteConversationAPI,
  getMyMessagesAPI,
  type ChatMessageResponse,
} from "@/api/chatApi";
import { wsService } from "@/services/websocket";

interface ConversationClient {
  id: string;
  fullName: string;
  email: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export default function CoachMessages() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ConversationClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<ConversationClient | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedClientRef = useRef<ConversationClient | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = wsService.onMessage((message) => {
        console.log('[Coach] New message received via WebSocket:', message);
        
        // Add client to list if not exists (when user sends first message)
        
        // Update conversation list
        setClients(prev => {
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
                    unreadCount: message.receiverId === user.id && selectedClientRef.current?.id !== partnerId
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
              fullName: partnerName,
              email: '',
              lastMessage: message.content,
              lastMessageTime: message.sentAt,
              unreadCount: message.receiverId === user.id ? 1 : 0,
            }, ...prev];
          }
        });
        
        // Update messages if this conversation is open
        setMessages(prev => {
          // Use ref to get latest selectedClient
          const currentSelected = selectedClientRef.current;
          if (currentSelected && 
              (message.senderId === currentSelected.id || message.receiverId === currentSelected.id)) {
            console.log('[Coach] Adding message to current conversation');
            
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
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    selectedClientRef.current = selectedClient;
  }, [selectedClient]);

  useEffect(() => {
    if (selectedClient) {
      fetchConversation(selectedClient.id);
    }
  }, [selectedClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const allMessages = await getMyMessagesAPI();
      
      // Group messages by conversation partner
      const conversationMap = new Map<string, ConversationClient>();
      
      allMessages.forEach((msg) => {
        const partnerId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
        const partnerName = msg.senderId === user?.id ? msg.receiverName : msg.senderName;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: partnerId,
            fullName: partnerName,
            email: '', // Email not needed in chat UI
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
      
      setClients(convArray);
      if (convArray.length > 0 && !selectedClient) {
        setSelectedClient(convArray[0]);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (clientId: string) => {
    try {
      const data = await getConversationAPI(clientId);
      setMessages(data);
      
      // Mark unread messages as read
      const unreadMessages = data.filter(
        (msg) => msg.receiverId === user?.id && !msg.isRead
      );
      for (const msg of unreadMessages) {
        await markAsReadAPI(msg.id);
      }
      
      // Update unread count in conversation list
      setClients(prev => 
        prev.map(client => 
          client.id === clientId ? { ...client, unreadCount: 0 } : client
        )
      );
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      toast.error("Không thể tải tin nhắn");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !newMessage.trim()) return;

    setSending(true);
    try {
      const sentMessage = await sendMessageAPI({
        receiverId: selectedClient.id,
        content: newMessage.trim(),
      });
      setMessages([...messages, sentMessage]);
      setNewMessage("");
      
      // Update conversation list
      setClients(prev => {
        const updated = prev.map(client =>
          client.id === selectedClient.id
            ? { ...client, lastMessage: newMessage.trim(), lastMessageTime: sentMessage.sentAt }
            : client
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

  const handleDeleteConversation = async (clientId: string, clientName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa cuộc trò chuyện với ${clientName}?`)) {
      return;
    }

    try {
      await deleteConversationAPI(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
            Tin nhắn
          </h1>
          <p className="text-slate-600">
            Trò chuyện với học viên của bạn
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
          {/* Clients List */}
          <Card className="col-span-4 bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="font-semibold text-slate-900">Danh sách học viên ({clients.length})</h2>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-2 space-y-1">
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Chưa có học viên nào</p>
                  </div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="relative group">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                          selectedClient?.id === client.id
                            ? "bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm scale-[0.98]"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            selectedClient?.id === client.id
                              ? "bg-gradient-to-br from-slate-600 to-slate-700"
                              : "bg-gradient-to-br from-slate-400 to-slate-500"
                          }`}>
                            {client.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-900 truncate">{client.fullName}</div>
                            <div className="text-xs text-slate-500 truncate">{client.email}</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(client.id, client.fullName);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <Card className="col-span-8 flex flex-col bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {selectedClient ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-slate-200 p-5 bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold text-lg">
                      {selectedClient.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">{selectedClient.fullName}</h3>
                      <p className="text-sm text-slate-600">{selectedClient.email}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6 bg-slate-50">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-16">
                        <MessageCircle className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500 font-medium">Chưa có tin nhắn nào</p>
                        <p className="text-sm text-slate-400 mt-1">Gửi tin nhắn đầu tiên để bắt đầu trò chuyện</p>
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
                                  ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white"
                                  : "bg-white border border-slate-200 text-slate-900"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  isMe ? "text-slate-300" : "text-slate-500"
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
                <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 bg-white">
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
                      className="flex-1 resize-none border border-slate-300 focus:border-slate-500 bg-slate-50 focus:bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 max-h-32 overflow-y-auto"
                      style={{
                        minHeight: '42px',
                        height: 'auto',
                      }}
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !newMessage.trim()}
                      className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 px-6 shrink-0"
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">Enter để gửi, Shift+Enter để xuống dòng</p>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                <div className="text-center">
                  <MessageCircle className="w-24 h-24 mx-auto mb-6 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600">Chọn một học viên</p>
                  <p className="text-sm text-slate-400 mt-1">để bắt đầu trò chuyện</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
