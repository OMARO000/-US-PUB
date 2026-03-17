"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "charcoal" | "dusk";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("us-theme") as Theme;
    const valid: Theme[] = ["light", "charcoal", "dusk"];
    const active = valid.includes(stored) ? stored : "light";
    setThemeState(active);
    document.documentElement.setAttribute("data-theme", active);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("us-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
