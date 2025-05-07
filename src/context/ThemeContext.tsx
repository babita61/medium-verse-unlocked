
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type Mood = "default" | "sad" | "joyful" | "suspenseful" | null;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  mood: Mood;
  setMood: (mood: Mood) => void;
  applyMoodTheme: (mood: Mood) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "system"
  );
  
  const [mood, setMood] = useState<Mood>(
    () => (localStorage.getItem("mood") as Mood) || "default"
  );
  
  // Track actual dark/light state based on system preference when in "system" mode
  const [isDark, setIsDark] = useState<boolean>(false);

  // Effect to apply theme changes to the DOM
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all classes first
    root.classList.remove("light", "dark");

    // Calculate if we should use dark mode
    const shouldUseDark = 
      theme === "dark" || 
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Apply the appropriate class
    root.classList.add(shouldUseDark ? "dark" : "light");
    
    // Update the dark status state
    setIsDark(shouldUseDark);
    
    // Store preference in localStorage
    localStorage.setItem("theme", theme);
    
    // Add a smooth transition effect for theme changes
    const transitionStyle = document.createElement('style');
    transitionStyle.textContent = `
      *, *::before, *::after {
        transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
      }
    `;
    
    document.head.appendChild(transitionStyle);
    
    // Remove the transition after the theme has changed to prevent transition when scrolling
    setTimeout(() => {
      document.head.removeChild(transitionStyle);
    }, 300);
  }, [theme]);

  // Apply mood theme
  const applyMoodTheme = (newMood: Mood) => {
    setMood(newMood);
    localStorage.setItem("mood", newMood || "default");
    
    const root = window.document.documentElement;
    
    // Remove existing mood classes
    root.classList.remove(
      "mood-default",
      "mood-sad", 
      "mood-joyful", 
      "mood-suspenseful"
    );
    
    // Add new mood class
    if (newMood) {
      root.classList.add(`mood-${newMood}`);
    }

    // Apply CSS variables based on mood
    const style = document.createElement('style');
    
    if (newMood === "sad") {
      style.textContent = `
        :root {
          --mood-primary: 210, 30%, 48%;
          --mood-secondary: 210, 20%, 80%;
          --mood-accent: 220, 30%, 70%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(100, 120, 150, 0.05), rgba(60, 70, 90, 0.1));
        }
        
        .dark {
          --mood-primary: 210, 30%, 40%;
          --mood-secondary: 210, 20%, 20%;
          --mood-accent: 220, 30%, 30%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(20, 40, 60, 0.3), rgba(10, 20, 40, 0.4));
        }
      `;
    } else if (newMood === "joyful") {
      style.textContent = `
        :root {
          --mood-primary: 40, 90%, 60%;
          --mood-secondary: 30, 70%, 80%;
          --mood-accent: 20, 90%, 70%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(255, 240, 175, 0.1), rgba(255, 220, 150, 0.15));
        }
        
        .dark {
          --mood-primary: 40, 70%, 50%;
          --mood-secondary: 30, 50%, 40%;
          --mood-accent: 20, 70%, 40%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(70, 60, 20, 0.3), rgba(60, 40, 10, 0.4));
        }
      `;
    } else if (newMood === "suspenseful") {
      style.textContent = `
        :root {
          --mood-primary: 0, 60%, 50%;
          --mood-secondary: 340, 40%, 30%;
          --mood-accent: 350, 50%, 40%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(40, 0, 0, 0.05), rgba(60, 0, 20, 0.1));
        }
        
        .dark {
          --mood-primary: 0, 70%, 40%;
          --mood-secondary: 340, 60%, 15%;
          --mood-accent: 350, 70%, 25%;
          --mood-background-overlay: linear-gradient(to bottom right, rgba(40, 0, 0, 0.4), rgba(60, 0, 20, 0.5));
        }
      `;
    } else {
      // Default mood
      style.textContent = `
        :root {
          --mood-primary: var(--primary);
          --mood-secondary: var(--secondary);
          --mood-accent: var(--accent);
          --mood-background-overlay: none;
        }
        
        .dark {
          --mood-primary: var(--primary);
          --mood-secondary: var(--secondary);
          --mood-accent: var(--accent);
          --mood-background-overlay: none;
        }
      `;
    }
    
    // Remove any existing mood style
    const existingStyle = document.getElementById('mood-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.id = 'mood-style';
    document.head.appendChild(style);
  };

  // Apply mood on initial load
  useEffect(() => {
    if (mood) {
      applyMoodTheme(mood);
    }
  }, []);

  // Listen for changes to system theme
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      const root = window.document.documentElement;
      const newIsDark = mediaQuery.matches;
      
      root.classList.remove("light", "dark");
      root.classList.add(newIsDark ? "dark" : "light");
      
      setIsDark(newIsDark);
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        isDark, 
        mood, 
        setMood,
        applyMoodTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
