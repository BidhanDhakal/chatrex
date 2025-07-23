"use client";

import React from "react";
import ShieldTooltip from "./shield-tooltip";
import CrownTooltip from "./crown-tooltip";
import { Emoji, EmojiStyle } from "emoji-picker-react";

interface EmojiParserProps {
    text: string | React.ReactNode[];
    className?: string;
}

/**
 * A component that parses text for emojis and replaces them with the Emoji component from emoji-picker-react.
 * Also handles special emojis like shield and crown with their respective tooltip components.
 */
const EmojiParser = ({ text, className }: EmojiParserProps) => {
    // If text is already ReactNode[], we assume it's already been processed for links
    if (Array.isArray(text)) {
        // Process each node in the array
        return (
            <span className={className}>
                {text.map((node, index) => {
                    // If node is a string, parse it for emojis
                    if (typeof node === 'string') {
                        return <EmojiParser key={index} text={node} />;
                    }
                    // If node is a React element (like an <a> tag), return it as is
                    return node;
                })}
            </span>
        );
    }

    // If text is a string, process it for emojis
    if (typeof text === 'string') {
        // Special handling for shield and crown emojis
        // Process the shield emoji first
        const shieldParts = text.split("🛡️");

        // If there are no shield emojis, check for crown emojis
        if (shieldParts.length === 1) {
            // Check for crown emoji
            const crownParts = text.split("👑");

            // If no crown emojis either, parse for regular emojis
            if (crownParts.length === 1) {
                // Parse for regular emojis
                return <span className={className}>{parseRegularEmojis(text)}</span>;
            }

            // Construct a new array with the parts and crown tooltips
            const crownResult = crownParts.reduce((acc: React.ReactNode[], part, index) => {
                // Parse regular emojis in this part
                acc.push(<span key={`text-${index}`}>{parseRegularEmojis(part)}</span>);

                // If not the last part, push a crown tooltip
                if (index < crownParts.length - 1) {
                    acc.push(<CrownTooltip key={`crown-${index}`} />);
                }

                return acc;
            }, []);

            return <span className={className}>{crownResult}</span>;
        }

        // Process shield emojis, and then check for crown emojis in each part
        const result = shieldParts.reduce((acc: React.ReactNode[], part, index) => {
            // Check if this part contains crown emojis
            const crownParts = part.split("👑");

            if (crownParts.length === 1) {
                // No crown emojis in this part, parse regular emojis
                acc.push(<span key={`text-${index}`}>{parseRegularEmojis(part)}</span>);
            } else {
                // This part contains crown emojis, process them
                const crownResult = crownParts.reduce((crownAcc: React.ReactNode[], crownPart, crownIndex) => {
                    crownAcc.push(<span key={`crown-text-${index}-${crownIndex}`}>{parseRegularEmojis(crownPart)}</span>);

                    // If not the last part, push a crown tooltip
                    if (crownIndex < crownParts.length - 1) {
                        crownAcc.push(<CrownTooltip key={`crown-${index}-${crownIndex}`} />);
                    }

                    return crownAcc;
                }, []);

                acc.push(<span key={`text-${index}`}>{crownResult}</span>);
            }

            // If not the last part, push a shield tooltip
            if (index < shieldParts.length - 1) {
                acc.push(<ShieldTooltip key={`shield-${index}`} />);
            }

            return acc;
        }, []);

        return <span className={className}>{result}</span>;
    }

    // Default fallback
    return <span className={className}>{text}</span>;
};

// Function to parse regular emojis and replace them with the Emoji component
const parseRegularEmojis = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Regex to match emoji characters
    // This regex matches standard emojis, emoji sequences, and emoji with modifiers
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Component}+)/gu;

    const parts = text.split(emojiRegex);
    const matches = text.match(emojiRegex) || [];
    const result: React.ReactNode[] = [];

    let i = 0;
    let matchIndex = 0;

    // Process each part
    for (const part of parts) {
        if (part) {
            // Check if this part is an emoji (matches the regex)
            const isEmoji = matchIndex < matches.length && matches[matchIndex] === part;

            if (isEmoji) {
                // This is an emoji - render using the Emoji component with increased size
                result.push(
                    <span key={`emoji-wrapper-${i}`} className="emoji-container">
                        <Emoji
                            key={`emoji-${i}`}
                            unified={getUnifiedCode(part)}
                            size={26}
                            emojiStyle={EmojiStyle.APPLE}
                        />
                    </span>
                );
                matchIndex++;
            } else {
                // This is regular text
                result.push(<span key={`text-${i}`}>{part}</span>);
            }
            i++;
        }
    }

    return result;
};

// Helper function to convert emoji to unified code
const getUnifiedCode = (emoji: string): string => {
    try {
        return Array.from(emoji)
            .map(char => {
                const codePoint = char.codePointAt(0);
                return codePoint ? codePoint.toString(16) : '';
            })
            .filter(Boolean)
            .join('-');
    } catch (error) {
        console.error("Error getting unified code for emoji:", error);
        return '';
    }
};

export default EmojiParser; 