import * as PushAPI from "@pushprotocol/restapi";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";
import { ethers } from "ethers";

export const PUSH_ENV =
  process.env.NEXT_PUBLIC_PUSH_ENV === "prod" ? ENV.PROD : ENV.STAGING;
export const PUSH_CHANNEL_ADDRESS =
  process.env.NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS;

// Push Chain specific configuration
const PUSH_CHAIN_ID = 42101;
const PUSH_CHAIN_PREFIX = `eip155:${PUSH_CHAIN_ID}`;

/**
 * Initialize Push user
 */
export async function initializePushUser(signer: ethers.Signer) {
  try {
    const user = await PushAPI.user.create({
      env: PUSH_ENV,
      signer: signer as any, // Push Protocol type compatibility
    });

    return user;
  } catch (error) {
    console.error("Failed to initialize Push user:", error);
    throw error;
  }
}

/**
 * Get Push user info
 */
export async function getPushUser(address: string) {
  try {
    const user = await PushAPI.user.get({
      env: PUSH_ENV,
      account: `${PUSH_CHAIN_PREFIX}:${address}`,
    });

    return user;
  } catch (error) {
    console.error("Failed to get Push user:", error);
    return null;
  }
}

/**
 * Subscribe to Push channel
 */
export async function subscribeToChannel(signer: ethers.Signer) {
  if (!PUSH_CHANNEL_ADDRESS) {
    throw new Error("PUSH_CHANNEL_ADDRESS not configured");
  }

  try {
    await PushAPI.channels.subscribe({
      signer: signer as any, // Push Protocol type compatibility
      channelAddress: `${PUSH_CHAIN_PREFIX}:${PUSH_CHANNEL_ADDRESS}`,
      userAddress: `${PUSH_CHAIN_PREFIX}:${await signer.getAddress()}`,
      env: PUSH_ENV,
    });

    return true;
  } catch (error) {
    console.error("Failed to subscribe to channel:", error);
    throw error;
  }
}

/**
 * Check if user is subscribed to channel
 */
export async function isSubscribed(address: string): Promise<boolean> {
  if (!PUSH_CHANNEL_ADDRESS) {
    return false;
  }

  try {
    const subscriptions = await PushAPI.user.getSubscriptions({
      user: `${PUSH_CHAIN_PREFIX}:${address}`,
      env: PUSH_ENV,
    });

    return subscriptions.some(
      (sub: any) =>
        sub.channel.toLowerCase() === PUSH_CHANNEL_ADDRESS.toLowerCase(),
    );
  } catch (error) {
    console.error("Failed to check subscription:", error);
    return false;
  }
}

/**
 * Initialize Push chat
 */
export async function initializePushChat(signer: ethers.Signer) {
  try {
    const user = await PushAPI.user.create({
      env: PUSH_ENV,
      signer: signer as any, // Push Protocol type compatibility
    });

    return user;
  } catch (error) {
    console.error("Failed to initialize Push chat:", error);
    throw error;
  }
}

/**
 * Create piggy bank chat (group chat between partners)
 */
export async function createPiggyBankChat(
  signer: ethers.Signer,
  partnerAddress: string,
  name: string,
) {
  try {
    const userAddress = await signer.getAddress();

    const chat = await PushAPI.chat.createGroup({
      groupName: name,
      groupDescription: `Piggy Bank: ${name}`,
      members: [`${PUSH_CHAIN_PREFIX}:${partnerAddress}`],
      admins: [`${PUSH_CHAIN_PREFIX}:${userAddress}`],
      isPublic: false,
      signer: signer as any, // Push Protocol type compatibility
      env: PUSH_ENV,
    });

    return chat;
  } catch (error) {
    console.error("Failed to create piggy bank chat:", error);
    throw error;
  }
}

/**
 * Send chat message
 */
export async function sendChatMessage(
  signer: ethers.Signer,
  chatId: string,
  message: string,
) {
  try {
    const response = await PushAPI.chat.send({
      messageContent: message,
      messageType: "Text",
      receiverAddress: chatId,
      signer: signer as any, // Push Protocol type compatibility
      env: PUSH_ENV,
    });

    return response;
  } catch (error) {
    console.error("Failed to send chat message:", error);
    throw error;
  }
}

/**
 * Fetch chat messages
 */
export async function fetchChatMessages(address: string, chatId: string) {
  try {
    const messages = await PushAPI.chat.history({
      account: `${PUSH_CHAIN_PREFIX}:${address}`,
      threadhash: chatId,
      limit: 50,
      env: PUSH_ENV,
    });

    return messages;
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return [];
  }
}

/**
 * Get user chats
 */
export async function getUserChats(address: string) {
  try {
    const chats = await PushAPI.chat.chats({
      account: `${PUSH_CHAIN_PREFIX}:${address}`,
      env: PUSH_ENV,
    });

    return chats;
  } catch (error) {
    console.error("Failed to get user chats:", error);
    return [];
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(address: string, page = 1) {
  try {
    const notifications = await PushAPI.user.getFeeds({
      user: `${PUSH_CHAIN_PREFIX}:${address}`,
      env: PUSH_ENV,
      page: page,
      limit: 20,
    });

    return notifications;
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return [];
  }
}
