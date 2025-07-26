// Service worker registration and utilities

// Check if service workers are supported
export const isServiceWorkerSupported = () => {
    return 'serviceWorker' in navigator;
};

// Register the service worker
export const registerServiceWorker = async () => {
    if (!isServiceWorkerSupported()) {
        console.log('Service workers are not supported in this browser');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.register('/custom-sw.js');
        console.log('Service worker registered successfully:', registration.scope);
        return true;
    } catch (error) {
        console.error('Service worker registration failed:', error);
        return false;
    }
};

// Ensure conversationId is a string
const ensureString = (value: string | string[] | unknown): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (Array.isArray(value) && value.length > 0) {
        return String(value[0]);
    }
    return String(value || '');
};

// Cache messages for offline access
export const cacheMessages = (conversationId: string | string[] | unknown, messages: any[]) => {
    if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
        console.log('Service worker not active, cannot cache messages');
        return;
    }

    const conversationIdString = ensureString(conversationId);

    if (!conversationIdString) {
        console.log('Invalid conversation ID, cannot cache messages');
        return;
    }

    navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_MESSAGES',
        conversationId: conversationIdString,
        messages
    });
};

// Retrieve cached messages
export const getCachedMessages = (conversationId: string | string[] | unknown): Promise<any[]> => {
    return new Promise((resolve) => {
        if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
            console.log('Service worker not active, cannot retrieve cached messages');
            resolve([]);
            return;
        }

        const conversationIdString = ensureString(conversationId);

        if (!conversationIdString) {
            console.log('Invalid conversation ID, cannot retrieve cached messages');
            resolve([]);
            return;
        }

        // Create a message channel for the response
        const messageChannel = new MessageChannel();

        // Set up the onmessage handler to receive the response
        messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === 'CACHED_MESSAGES' &&
                event.data.conversationId === conversationIdString) {
                resolve(event.data.messages || []);
            } else {
                resolve([]);
            }
        };

        // Send the message to the service worker
        navigator.serviceWorker.controller.postMessage(
            {
                type: 'GET_CACHED_MESSAGES',
                conversationId: conversationIdString
            },
            [messageChannel.port2]
        );

        // Set a timeout in case the service worker doesn't respond
        setTimeout(() => {
            resolve([]);
        }, 3000);
    });
};

// Listen for service worker messages
export const setupServiceWorkerMessageListener = (callback: (event: MessageEvent) => void) => {
    if (!isServiceWorkerSupported()) {
        return;
    }

    navigator.serviceWorker.addEventListener('message', callback);
};

// Check if we're online
export const isOnline = (): boolean => {
    return navigator.onLine;
};

// Set up online/offline event listeners
export const setupOnlineStatusListeners = (
    onlineCallback: () => void,
    offlineCallback: () => void
) => {
    window.addEventListener('online', onlineCallback);
    window.addEventListener('offline', offlineCallback);

    return () => {
        window.removeEventListener('online', onlineCallback);
        window.removeEventListener('offline', offlineCallback);
    };
}; 