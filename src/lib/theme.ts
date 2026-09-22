import { useEffect, useState } from "react"

const THEME_KEY = "sonetopia:theme"

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "dark")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark])

  return { dark, toggle: () => setDark((prev) => !prev) }
}