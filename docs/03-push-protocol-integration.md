# Stage 3: Push Protocol Integration

## Overview

This guide covers integrating Push Protocol for web3 notifications and chat functionality. Partners will receive real-time notifications for deposits, withdrawals, and goal milestones, plus can chat about their savings goals.

## What is Push Protocol?

Push Protocol is a web3 communication network enabling:

- **Notifications**: Send alerts to wallet addresses
- **Chat**: Peer-to-peer and group messaging
- **Video**: Video calls (optional for future)

## Prerequisites

- Push Protocol account (create at https://app.push.org)
- Channel created on Push Protocol
- Basic understanding of web3 wallets

## Step 1: Install Dependencies

```bash
pnpm add @pushprotocol/restapi @pushprotocol/uiweb @pushprotocol/socket ethers@5.7.2
```

Note: Push Protocol currently requires ethers v5, not v6.

## Step 2: Create Push Protocol Channel

1. Go to https://app.push.org
2. Connect your wallet
3. Click "Create Channel"
4. Fill in details:
   - **Channel Name**: "Onchain Piggy Bank"
   - **Channel Description**: "Get notified about your shared savings progress"
   - **Channel URL**: Your app URL
   - **Channel Icon**: Upload logo
5. Deploy channel (requires small gas fee)
6. Save your channel address

## Step 3: Setup Environment Variables

Update `.env.local`:

```bash
# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYourChannelAddress"
PUSH_CHANNEL_PRIVATE_KEY="your-channel-private-key"
NEXT_PUBLIC_PUSH_ENV="staging" # or "prod" for mainnet
```

## Step 4: Create Push Protocol Service

Create `src/lib/push-protocol.ts`:

```typescript
import * as PushAPI from "@pushprotocol/restapi";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";
import { ethers } from "ethers";

// Environment configuration
export const PUSH_ENV = (
  process.env.NEXT_PUBLIC_PUSH_ENV === "prod" ? ENV.PROD : ENV.STAGING
) as ENV;

// Channel address
export const PUSH_CHANNEL_ADDRESS =
  process.env.NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS!;

/**
 * Initialize Push Protocol user
 */
export async function initializePushUser(signer: ethers.Signer) {
  const user = await PushAPI.user.create({
    env: PUSH_ENV,
    signer: signer,
  });

  return user;
}

/**
 * Get Push Protocol user
 */
export async function getPushUser(address: string) {
  const user = await PushAPI.user.get({
    env: PUSH_ENV,
    account: address,
  });

  return user;
}

/**
 * Subscribe user to channel notifications
 */
export async function subscribeToChannel(signer: ethers.Signer) {
  try {
    await PushAPI.channels.subscribe({
      signer: signer,
      channelAddress: `eip155:11155111:${PUSH_CHANNEL_ADDRESS}`, // Sepolia
      userAddress: await signer.getAddress(),
      onSuccess: () => {
        console.log("Subscribed to Push notifications");
      },
      onError: (error) => {
        console.error("Subscription error:", error);
      },
      env: PUSH_ENV,
    });
  } catch (error) {
    console.error("Failed to subscribe:", error);
    throw error;
  }
}

/**
 * Check if user is subscribed to channel
 */
export async function isSubscribed(userAddress: string): Promise<boolean> {
  try {
    const subscriptions = await PushAPI.user.getSubscriptions({
      user: `eip155:11155111:${userAddress}`,
      env: PUSH_ENV,
    });

    return subscriptions.some(
      (sub) => sub.channel.toLowerCase() === PUSH_CHANNEL_ADDRESS.toLowerCase(),
    );
  } catch (error) {
    console.error("Failed to check subscription:", error);
    return false;
  }
}

/**
 * Initialize Push Chat for a user
 */
export async function initializePushChat(signer: ethers.Signer) {
  const user = await PushAPI.user.get({
    account: await signer.getAddress(),
    env: PUSH_ENV,
  });

  if (!user) {
    // Create user if doesn't exist
    await PushAPI.user.create({
      env: PUSH_ENV,
      signer: signer,
    });
  }

  return user;
}

/**
 * Create a group chat for piggy bank partners
 */
export async function createPiggyBankChat(
  signer: ethers.Signer,
  partnerAddress: string,
  piggyBankName: string,
) {
  try {
    const response = await PushAPI.chat.createGroup({
      groupName: `💰 ${piggyBankName}`,
      groupDescription: "Chat about your shared savings goal",
      members: [partnerAddress],
      groupImage: null,
      admins: [],
      isPublic: false,
      signer: signer,
      env: PUSH_ENV,
    });

    return response;
  } catch (error) {
    console.error("Failed to create group chat:", error);
    throw error;
  }
}

/**
 * Send a message in the group chat
 */
export async function sendChatMessage(
  signer: ethers.Signer,
  chatId: string,
  message: string,
) {
  try {
    await PushAPI.chat.send({
      messageContent: message,
      messageType: "Text",
      receiverAddress: chatId,
      signer: signer,
      env: PUSH_ENV,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
}

/**
 * Fetch chat messages
 */
export async function fetchChatMessages(userAddress: string, chatId: string) {
  try {
    const messages = await PushAPI.chat.history({
      account: userAddress,
      threadhash: chatId,
      limit: 50,
      env: PUSH_ENV,
    });

    return messages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return [];
  }
}

/**
 * Get all chats for a user
 */
export async function getUserChats(userAddress: string) {
  try {
    const chats = await PushAPI.chat.chats({
      account: userAddress,
      toDecrypt: false,
      env: PUSH_ENV,
    });

    return chats;
  } catch (error) {
    console.error("Failed to fetch chats:", error);
    return [];
  }
}
```

## Step 5: Create Notification Service

Create `src/services/notifications.ts`:

```typescript
import * as PushAPI from "@pushprotocol/restapi";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";
import { ethers } from "ethers";

const PUSH_ENV = (
  process.env.NEXT_PUBLIC_PUSH_ENV === "prod" ? ENV.PROD : ENV.STAGING
) as ENV;
const CHANNEL_ADDRESS = process.env.NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS!;

// Server-side only: Use channel private key for sending notifications
function getChannelSigner() {
  if (!process.env.PUSH_CHANNEL_PRIVATE_KEY) {
    throw new Error("PUSH_CHANNEL_PRIVATE_KEY not set");
  }

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
  );

  return new ethers.Wallet(process.env.PUSH_CHANNEL_PRIVATE_KEY, provider);
}

interface NotificationPayload {
  title: string;
  body: string;
  cta?: string; // Call to action URL
  img?: string; // Image URL
}

/**
 * Send notification to a specific wallet address
 */
export async function sendNotification(
  recipientAddress: string,
  payload: NotificationPayload,
) {
  try {
    const signer = getChannelSigner();

    await PushAPI.payloads.sendNotification({
      signer: signer,
      type: 3, // Targeted notification
      identityType: 2, // Direct payload
      notification: {
        title: payload.title,
        body: payload.body,
      },
      payload: {
        title: payload.title,
        body: payload.body,
        cta: payload.cta || "",
        img: payload.img || "",
      },
      recipients: `eip155:11155111:${recipientAddress}`, // Sepolia
      channel: `eip155:11155111:${CHANNEL_ADDRESS}`,
      env: PUSH_ENV,
    });

    console.log("Notification sent to:", recipientAddress);
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
}

/**
 * Send notification to multiple recipients
 */
export async function sendBroadcastNotification(
  recipientAddresses: string[],
  payload: NotificationPayload,
) {
  try {
    const signer = getChannelSigner();

    // Format recipients for Push Protocol
    const recipients = recipientAddresses
      .map((addr) => `eip155:11155111:${addr}`)
      .join(",");

    await PushAPI.payloads.sendNotification({
      signer: signer,
      type: 4, // Subset notification (multiple recipients)
      identityType: 2,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      payload: {
        title: payload.title,
        body: payload.body,
        cta: payload.cta || "",
        img: payload.img || "",
      },
      recipients: recipients,
      channel: `eip155:11155111:${CHANNEL_ADDRESS}`,
      env: PUSH_ENV,
    });

    console.log(
      "Broadcast notification sent to:",
      recipientAddresses.length,
      "recipients",
    );
  } catch (error) {
    console.error("Failed to send broadcast:", error);
    throw error;
  }
}

// Specific notification types for our app
export const PiggyBankNotifications = {
  /**
   * Notify when partner makes a deposit
   */
  async depositMade(
    recipientAddress: string,
    depositorName: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    await sendNotification(recipientAddress, {
      title: "💰 New Deposit!",
      body: `${depositorName} deposited ${amount} ETH to ${piggyBankName}`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify when withdrawal is requested
   */
  async withdrawalRequested(
    recipientAddress: string,
    initiatorName: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    await sendNotification(recipientAddress, {
      title: "🔔 Withdrawal Request",
      body: `${initiatorName} wants to withdraw ${amount} ETH from ${piggyBankName}. Your approval is needed!`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify when withdrawal is approved
   */
  async withdrawalApproved(
    recipientAddress: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    await sendNotification(recipientAddress, {
      title: "✅ Withdrawal Approved",
      body: `Withdrawal of ${amount} ETH from ${piggyBankName} has been executed!`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify when goal milestone reached
   */
  async goalMilestone(
    recipientAddresses: string[],
    milestone: number,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    await sendBroadcastNotification(recipientAddresses, {
      title: `🎉 ${milestone}% Goal Reached!`,
      body: `${piggyBankName} is ${milestone}% complete. Keep going!`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify when goal is fully reached
   */
  async goalReached(
    recipientAddresses: string[],
    piggyBankName: string,
    goalAmount: string,
    piggyBankId: string,
  ) {
    await sendBroadcastNotification(recipientAddresses, {
      title: "🎊 Goal Reached!",
      body: `Congratulations! ${piggyBankName} reached its ${goalAmount} ETH goal!`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify when invited to join piggy bank
   */
  async invitedToJoin(
    recipientAddress: string,
    inviterName: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    await sendNotification(recipientAddress, {
      title: "💌 Piggy Bank Invitation",
      body: `${inviterName} invited you to join ${piggyBankName}!`,
      cta: `${process.env.NEXT_PUBLIC_APP_URL}/piggy-bank/${piggyBankId}/invite`,
    });
  },
};
```

## Step 6: Create Push Chat Component

Create `src/components/push/chat-window.tsx`:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { sendChatMessage, fetchChatMessages } from '@/lib/push-protocol';

interface Message {
  fromCAIP10: string;
  toCAIP10: string;
  messageContent: string;
  timestamp: number;
}

interface ChatWindowProps {
  chatId: string;
  piggyBankName: string;
}

export function ChatWindow({ chatId, piggyBankName }: ChatWindowProps) {
  const { user } = usePrivy();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    if (!user?.wallet?.address) return;

    const loadMessages = async () => {
      const msgs = await fetchChatMessages(user.wallet.address, chatId);
      setMessages(msgs);
    };

    loadMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [user?.wallet?.address, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.wallet) return;

    setLoading(true);
    try {
      // Get signer from Privy
      const provider = await user.wallet.getEthersProvider();
      const signer = provider.getSigner();

      await sendChatMessage(signer, chatId, newMessage);
      setNewMessage('');

      // Reload messages
      const msgs = await fetchChatMessages(user.wallet.address, chatId);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    const cleaned = address.split(':')[2] || address;
    return `${cleaned.slice(0, 6)}...${cleaned.slice(-4)}`;
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-medium">💬 Chat - {piggyBankName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isOwnMessage = msg.fromCAIP10.includes(user?.wallet?.address || '');
            return (
              <div
                key={idx}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs opacity-75 mb-1">
                    {formatAddress(msg.fromCAIP10)}
                  </p>
                  <p className="text-sm">{msg.messageContent}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Step 7: Create Notification Bell Component

Create `src/components/push/notification-bell.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import * as PushAPI from '@pushprotocol/restapi';
import { PUSH_ENV } from '@/lib/push-protocol';
import { BellIcon } from '@heroicons/react/24/outline';

export function NotificationBell() {
  const { user } = usePrivy();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.wallet?.address) return;

    const fetchNotifications = async () => {
      try {
        const notifs = await PushAPI.user.getFeeds({
          user: `eip155:11155111:${user.wallet.address}`,
          env: PUSH_ENV,
          limit: 10,
        });

        setNotifications(notifs);
        // Count unread (you can add a read status in your DB)
        setUnreadCount(notifs.length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.wallet?.address]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notif.epoch * 1000).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Step 8: Update Environment Variables

Final `.env.local`:

```bash
# Push Protocol
NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS="0xYourChannelAddress"
PUSH_CHANNEL_PRIVATE_KEY="your-channel-private-key"
NEXT_PUBLIC_PUSH_ENV="staging"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ETHEREUM_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
```

## Best Practices

1. **Rate Limiting**: Don't send too many notifications too quickly
2. **User Opt-in**: Always ask users to subscribe to notifications
3. **Meaningful Content**: Only send important notifications
4. **Test Environment**: Use staging environment during development
5. **Error Handling**: Always handle Push Protocol errors gracefully

## Next Steps

- ✅ Push Protocol integrated
- ✅ Notification service created
- ✅ Chat functionality implemented
- ⏭️ Next: Backend API Routes (Stage 4)
