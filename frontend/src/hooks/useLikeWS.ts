import { useEffect, useRef } from "react";
import { Client, type Message } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface LikeUpdate {
  postId: string;
  likeCount: number;
}

export const useLikeWS = (
  postId: string,
  onReceive: (update: LikeUpdate) => void
) => {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);
  const onReceiveRef = useRef(onReceive);
  const isConnectedRef = useRef(false);

  // Update callback ref without triggering reconnect
  useEffect(() => {
    onReceiveRef.current = onReceive;
  }, [onReceive]);

  useEffect(() => {
    // Prevent double connection - đảm bảo chỉ connect 1 lần
    if (isConnectedRef.current && clientRef.current?.connected) {
      console.log("⚠️ WebSocket already connected for post:", postId);
      return;
    }

    console.log("🔌 Connecting WebSocket for post:", postId);
    
    const client = new Client({
      brokerURL: undefined,
      connectHeaders: {},
      debug: (str) => {
        // Only log errors
        if (str.includes("ERROR")) {
          console.error("[Like WS Error]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      webSocketFactory: () => new SockJS("http://localhost:8080/ws")
    });

    client.onConnect = () => {
      console.log("✅ Connected to Like WS for post:", postId);
      isConnectedRef.current = true;
      
      subscriptionRef.current = client.subscribe(`/topic/likes/${postId}`, (msg: Message) => {
        try {
          if (!msg.body) {
            console.warn("⚠️ Empty message body received");
            return;
          }
          
          const likeUpdate = JSON.parse(msg.body) as LikeUpdate;
          console.log("💚 Like update received:", likeUpdate);
          
          // Use ref to get latest callback without re-subscribing
          onReceiveRef.current(likeUpdate);
        } catch (error) {
          console.error("❌ Failed to parse like update:", error);
          console.error("Raw message:", msg);
        }
      });
    };

    client.onStompError = frame => {
      console.error("Broker reported error:", frame.headers["message"], frame.body);
      isConnectedRef.current = false;
    };

    client.onWebSocketClose = () => {
      console.log("🔌 WebSocket closed");
      isConnectedRef.current = false;
    };

    client.activate();
    clientRef.current = client;

    return () => {
      console.log("🔌 Disconnecting WebSocket for post:", postId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      isConnectedRef.current = false;
    };
  }, [postId]); // Only reconnect when postId changes
};
