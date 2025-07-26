"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConversation } from "@/hooks/useConversation";
import { useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import Message from "./Message";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import notificationSound from "@/lib/NotificationSound";
import { cacheMessages, getCachedMessages, isOnline } from "@/lib/serviceWorkerUtils";

type Props = {
  members: {
    lastSeenMessageId?: Id<"messages">;
    username?: string;
    [key: string]: any;
  }[];
};

const Body = ({ members }: Props) => {
  const { conversationId } = useConversation();
  const messages = useQuery(api.messages.get, { conversationId: conversationId as Id<"conversations"> });
  const messagesRef = useRef<typeof messages>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);
  const [offlineMessages, setOfflineMessages] = useState<any[] | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Check online status and load cached messages if offline
  useEffect(() => {
    const checkOnlineStatus = () => {
      const online = isOnline();
      setIsOffline(!online);

      if (!online) {
        // If offline, try to load cached messages
        loadCachedMessages();
      }
    };

    // Check on mount and when online status changes
    checkOnlineStatus();

    const handleOnline = () => {
      setIsOffline(false);
      setOfflineMessages(null); // Clear offline messages when back online
    };

    const handleOffline = () => {
      setIsOffline(true);
      loadCachedMessages();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [conversationId]);

  // Load cached messages from service worker
  const loadCachedMessages = async () => {
    if (!conversationId) return;

    try {
      const cached = await getCachedMessages(conversationId);
      if (cached && cached.length > 0) {
        setOfflineMessages(cached);
      }
    } catch (error) {
      console.error('Error loading cached messages:', error);
    }
  };

  // Cache messages when they're loaded from the server
  useEffect(() => {
    if (messages && messages.length > 0 && isOnline()) {
      cacheMessages(conversationId, messages);
    }
  }, [messages, conversationId]);

  useEffect(() => {
    // Skip notification on initial load
    if (isInitialLoad && messages && messages.length > 0) {
      messagesRef.current = messages;
      setIsInitialLoad(false);
      return;
    }

    // Check if there's a new message
    if (!isInitialLoad && messages && messages.length > 0 && messagesRef.current) {
      // Check if the first (newest) message is new by comparing with the previous reference
      const latestMessage = messages[0];
      const previousMessages = messagesRef.current;

      // If we have a new message
      if (
        previousMessages.length === 0 ||
        latestMessage.message._id !== previousMessages[0].message._id
      ) {
        // Set the new message ID for animation
        setNewMessageId(latestMessage.message._id.toString());

        // Clear the new message ID after animation time
        setTimeout(() => {
          setNewMessageId(null);
        }, 2000);

        // If the message is not from the current user, play sound
        if (!latestMessage.isCurrentUser) {
          // Play the notification sound
          notificationSound.playMessageSound();
          console.log("Playing notification sound for new message");
        }
      }

      // Update our reference
      messagesRef.current = messages;
    }
  }, [messages, isInitialLoad]);

  // Use offline messages if we're offline and have cached messages
  const displayMessages = isOffline && offlineMessages ? offlineMessages : messages;

  // Show loading or offline message if no messages available
  if (!displayMessages || displayMessages.length === 0) {
    return (
      <div className="flex-1 w-full flex items-center justify-center">
        <p className="text-muted-foreground">
          {isOffline ? "You're offline. No cached messages available." : "Loading messages..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex overflow-y-scroll flex-col-reverse gap-2 p-0 pb-28 md:pb-3 no-scrollbar">
      {isOffline && (
        <div className="sticky top-0 w-full bg-yellow-100 dark:bg-yellow-900 p-2 text-center text-sm">
          You're viewing cached messages. Some features may be limited while offline.
        </div>
      )}

      {displayMessages?.map(({ message, senderImage, senderName, isCurrentUser }, index) => {
        // Check if this message is from the same user as the next message
        // (since messages are in reverse order in the UI)
        const isConsecutive = index > 0 &&
          displayMessages[index - 1].message.senderId === message.senderId;

        // Check if this is the first message in a sequence from this user
        // by looking at the previous message (next in UI since reversed)
        const isFirstInSequence = index === displayMessages.length - 1 ||
          displayMessages[index + 1].message.senderId !== message.senderId;

        // Check if this is a new message to animate
        const isNew = message._id.toString() === newMessageId;

        return (
          <Message key={message._id}
            fromCurrentUser={isCurrentUser}
            senderImage={senderImage}
            senderName={senderName}
            lastByUser={isConsecutive}
            content={message.content}
            createdAt={message._creationTime}
            type={message.type}
            isFirstInSequence={isFirstInSequence}
            isNew={isNew}
          />
        );
      })}
    </div>
  );
};

export default Body;