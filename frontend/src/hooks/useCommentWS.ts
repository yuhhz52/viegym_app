import { useEffect, useRef } from "react";
import { Client, type Message } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { PostComment } from "../pages/Community/type";

export const useCommentWS = (
  postId: string,
  onReceive: (comment: PostComment) => void
) => {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      brokerURL: undefined,
      connectHeaders: {},
      debug: (str) => console.log("[WS]", str),
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS("http://localhost:8080/ws")
    });

    client.onConnect = () => {
      console.log("Connected to WS");
      client.subscribe(`/topic/comments/${postId}`, (msg: Message) => {
        const comment = JSON.parse(msg.body) as PostComment;
        onReceive(comment);
      });
    };

    client.onStompError = frame => {
      console.error("Broker reported error:", frame.headers["message"], frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [postId, onReceive]);
};
