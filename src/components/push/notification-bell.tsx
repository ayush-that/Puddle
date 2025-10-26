"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserNotifications } from "@/lib/push-protocol";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  sid: string;
  title: string;
  message: string;
  cta: string;
  timestamp: string;
}

export function NotificationBell() {
  const { user } = usePrivy();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!user?.wallet?.address) return;

    try {
      setLoading(true);
      const feeds = await getUserNotifications(user.wallet.address);

      const formatted = feeds.map((feed: any) => ({
        sid: feed.sid,
        title: feed.notification.title || "Notification",
        message: feed.notification.body || "",
        cta: feed.payload?.cta || "",
        timestamp: feed.epoch,
      }));

      setNotifications(formatted);
      setUnreadCount(formatted.length);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.wallet?.address) {
      loadNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.wallet?.address]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.cta) {
      window.location.href = notification.cta;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.sid}
              className="flex flex-col items-start p-4 cursor-pointer focus:bg-accent"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-medium text-sm mb-1">
                {notification.title}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {notification.message}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(
                  new Date(parseInt(notification.timestamp)),
                  {
                    addSuffix: true,
                  },
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
