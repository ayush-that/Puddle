"use client";

import { useEffect, useState, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchChatMessages,
  sendChatMessage,
  createPiggyBankChat,
} from "@/lib/push-protocol";
import { ethers } from "ethers";
import { formatDistanceToNow } from "date-fns";

interface ChatMessage {
  messageContent: string;
  fromDID: string;
  timestamp: number;
}

interface ChatWindowProps {
  piggyBankName: string;
  chatId?: string;
  partnerAddress?: string;
  onChatCreated?: (chatId: string) => void;
}

export function ChatWindow({
  piggyBankName,
  chatId,
  partnerAddress,
  onChatCreated,
}: ChatWindowProps) {
  const { user } = usePrivy();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!user?.wallet?.address || !currentChatId) return;

    try {
      setLoading(true);
      const history = await fetchChatMessages(
        user.wallet.address,
        currentChatId,
      );

      const formatted = history.map((msg: any) => ({
        messageContent: msg.messageContent,
        fromDID: msg.fromDID,
        timestamp: msg.timestamp,
      }));

      setMessages(formatted);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async () => {
    if (!user?.wallet?.address || !partnerAddress) return;

    try {
      setLoading(true);

      // Create ethers signer from Privy
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum,
      );
      const signer = provider.getSigner();

      const chat = await createPiggyBankChat(
        signer,
        partnerAddress,
        piggyBankName,
      );

      setCurrentChatId(chat.chatId);
      onChatCreated?.(chat.chatId);
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user?.wallet?.address || !currentChatId) return;

    try {
      setSending(true);

      // Create ethers signer from Privy
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum,
      );
      const signer = provider.getSigner();

      await sendChatMessage(signer, currentChatId, newMessage);

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (currentChatId) {
      loadMessages();

      // Poll for new messages every 5 seconds
      const interval = setInterval(loadMessages, 5000);

      return () => clearInterval(interval);
    }
  }, [currentChatId, user?.wallet?.address]);

  const formatAddress = (did: string) => {
    const address = did.split(":").pop() || did;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!currentChatId && partnerAddress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Start a chat with your partner
            </p>
            <Button onClick={handleCreateChat} disabled={loading}>
              {loading ? "Creating chat..." : "Start Chat"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col h-[500px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {loading && messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.fromDID.includes(
                user?.wallet?.address || "",
              );

              return (
                <div
                  key={index}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {isOwn ? "You" : formatAddress(message.fromDID)}
                    </div>
                    <div className="text-sm">{message.messageContent}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(message.timestamp), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
