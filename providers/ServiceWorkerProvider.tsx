"use client";

import { registerServiceWorker } from "@/lib/serviceWorkerUtils";
import { useEffect } from "react";

export const ServiceWorkerProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    useEffect(() => {
        // Register service worker when the app loads
        const registerSW = async () => {
            await registerServiceWorker();
        };

        registerSW();
    }, []);

    return <>{children}</>;
}; 