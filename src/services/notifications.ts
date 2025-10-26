import * as PushAPI from "@pushprotocol/restapi";
import { ENV } from "@pushprotocol/restapi/src/lib/constants";
import { ethers } from "ethers";

const PUSH_ENV =
  process.env.NEXT_PUBLIC_PUSH_ENV === "prod" ? ENV.PROD : ENV.STAGING;
const CHANNEL_ADDRESS = process.env.NEXT_PUBLIC_PUSH_CHANNEL_ADDRESS!;

// Push Chain specific configuration
const PUSH_CHAIN_ID = 42101;
const PUSH_CHAIN_PREFIX = `eip155:${PUSH_CHAIN_ID}`;

// Server-side only: Use channel private key for sending notifications
function getChannelSigner() {
  if (!process.env.PUSH_CHANNEL_PRIVATE_KEY) {
    throw new Error("PUSH_CHANNEL_PRIVATE_KEY not set");
  }

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_PUSH_CHAIN_RPC_URL,
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
      recipients: `${PUSH_CHAIN_PREFIX}:${recipientAddress}`,
      channel: `${PUSH_CHAIN_PREFIX}:${CHANNEL_ADDRESS}`,
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
      .map((addr) => `${PUSH_CHAIN_PREFIX}:${addr}`)
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
      channel: `${PUSH_CHAIN_PREFIX}:${CHANNEL_ADDRESS}`,
      env: PUSH_ENV,
    });

    console.log("Broadcast notification sent to:", recipientAddresses);
  } catch (error) {
    console.error("Failed to send broadcast notification:", error);
    throw error;
  }
}

/**
 * Piggy Bank specific notifications
 */
export const PiggyBankNotifications = {
  /**
   * Notify partner when a deposit is made
   */
  async depositMade(
    recipientAddress: string,
    depositorAddress: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendNotification(recipientAddress, {
      title: `💰 New Deposit in ${piggyBankName}`,
      body: `${depositorAddress.slice(0, 6)}...${depositorAddress.slice(-4)} deposited ${amount} PUSH`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify partner when withdrawal is requested
   */
  async withdrawalRequested(
    recipientAddress: string,
    initiatorAddress: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendNotification(recipientAddress, {
      title: `🔔 Withdrawal Request in ${piggyBankName}`,
      body: `${initiatorAddress.slice(0, 6)}...${initiatorAddress.slice(-4)} wants to withdraw ${amount} PUSH. Approve to continue.`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify initiator when withdrawal is approved
   */
  async withdrawalApproved(
    recipientAddress: string,
    amount: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendNotification(recipientAddress, {
      title: `✅ Withdrawal Approved in ${piggyBankName}`,
      body: `Your withdrawal request for ${amount} PUSH has been approved. You can now execute the withdrawal.`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify all members when goal milestone is reached
   */
  async goalMilestone(
    recipientAddresses: string[],
    milestone: number,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendBroadcastNotification(recipientAddresses, {
      title: `🎯 ${milestone}% Goal Reached!`,
      body: `${piggyBankName} is now ${milestone}% funded. Keep saving!`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify all members when goal is fully reached
   */
  async goalReached(
    recipientAddresses: string[],
    piggyBankName: string,
    goalAmount: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendBroadcastNotification(recipientAddresses, {
      title: `🎉 Goal Reached in ${piggyBankName}!`,
      body: `Congratulations! You've saved ${goalAmount} PUSH together!`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },

  /**
   * Notify user when invited to join piggy bank
   */
  async invitedToJoin(
    recipientAddress: string,
    inviterAddress: string,
    piggyBankName: string,
    piggyBankId: string,
  ) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendNotification(recipientAddress, {
      title: `🤝 Invited to ${piggyBankName}`,
      body: `${inviterAddress.slice(0, 6)}...${inviterAddress.slice(-4)} invited you to join their piggy bank!`,
      cta: `${appUrl}/piggy-bank/${piggyBankId}`,
    });
  },
};
