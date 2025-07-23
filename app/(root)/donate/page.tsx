"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import ShieldTooltip from "@/components/ui/shield-tooltip";
import { AlertCircle } from "lucide-react";

export default function DonatePage() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <Card className="w-full max-w-md p-6 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <h1 className="text-2xl font-bold text-center">Support Our Chat App</h1>
                    <p className="text-center text-muted-foreground">
                        Your donations help us maintain and improve the chat app for everyone.
                    </p>

                    <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-full">
                        <div className="flex items-center translate-y-[1px]">
                            <ShieldTooltip size={24} />
                        </div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300 flex-1">
                            All donors receive a verified badge for 3 months!
                        </span>
                    </div>

                    <div className="relative w-full aspect-square max-w-[400px]">
                        <Image
                            src="/donate.png"
                            alt="Donate QR Code"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                        Scan the QR code to donate directly.
                    </p>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg w-full">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-300">
                            Important: Please include your chat app username in the payment remarks when donating on eSewa to receive your verified badge.
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
} 