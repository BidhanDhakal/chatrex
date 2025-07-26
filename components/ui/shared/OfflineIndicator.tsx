"use client";

import { useEffect, useState } from "react";
import { isOnline, setupOnlineStatusListeners } from "@/lib/serviceWorkerUtils";
import { cn } from "@/lib/utils";
import { WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        // Set initial state
        setOffline(!isOnline());

        // Set up listeners for online/offline events
        const cleanup = setupOnlineStatusListeners(
            () => setOffline(false),
            () => setOffline(true)
        );

        return cleanup;
    }, []);

    if (!offline) return null;

    return (
        <div className={cn(
            "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-yellow-500/90 px-3 py-1.5 text-sm text-white shadow-md",
            "dark:bg-yellow-600/90"
        )}>
            <WifiOff className="h-4 w-4" />
            <span>You are offline. Some features may be limited.</span>
        </div>
    );
}; 