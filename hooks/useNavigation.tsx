import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Heart, MessageSquare, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const useNavigation = () => {
    const pathname = usePathname();

    const requestsCount = useQuery(api.requests.count);

    const paths = useMemo(() => [
        {
            name: "Conversations",
            href: "/conversations",
            icon: <MessageSquare />,
            active: pathname.startsWith("/conversations"),
        },
        {
            name: "Friends",
            href: "/friends",
            icon: <Users />,
            active: pathname === "/friends",
            count: requestsCount,
        },
        {
            name: "Donate",
            href: "/donate",
            icon: <Heart />,
            active: pathname === "/donate",
        },
    ],
        [pathname, requestsCount]
    );
    return paths;
};

