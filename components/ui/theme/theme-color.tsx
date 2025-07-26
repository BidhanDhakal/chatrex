"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export function ThemeColor() {
    const { theme, resolvedTheme } = useTheme()

    useEffect(() => {
        // Set theme color based on current theme
        const themeColor = resolvedTheme === 'dark' ? '#000000' : '#ffffff'

        // Update theme-color meta tag
        let metaThemeColor = document.querySelector('meta[name="theme-color"]')

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta')
            metaThemeColor.setAttribute('name', 'theme-color')
            document.head.appendChild(metaThemeColor)
        }

        metaThemeColor.setAttribute('content', themeColor)
    }, [theme, resolvedTheme])

    return null
} 