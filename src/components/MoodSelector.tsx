
import React from 'react';
import { Smile, CloudRain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  postId: string;
  className?: string;
}

const MoodSelector = ({ postId, className }: MoodSelectorProps) => {
  const { mood, applyMoodTheme } = useTheme();
  
  const handleMoodChange = (newMood: "default" | "sad" | "joyful" | "suspenseful") => {
    applyMoodTheme(newMood === mood ? "default" : newMood);
  };

  return (
    <div className={cn("flex flex-wrap gap-2 justify-center my-4", className)}>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleMoodChange("default")}
        className={cn(
          "transition-colors",
          mood === "default" || !mood ? "bg-primary text-primary-foreground" : ""
        )}
      >
        Default
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleMoodChange("joyful")}
        className={cn(
          "transition-colors",
          mood === "joyful" ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100" : ""
        )}
      >
        <Smile className="mr-1 h-4 w-4" />
        Joyful
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleMoodChange("sad")}
        className={cn(
          "transition-colors",
          mood === "sad" ? "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : ""
        )}
      >
        <CloudRain className="mr-1 h-4 w-4" />
        Melancholy
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleMoodChange("suspenseful")}
        className={cn(
          "transition-colors",
          mood === "suspenseful" ? "bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100" : ""
        )}
      >
        <Zap className="mr-1 h-4 w-4" />
        Suspenseful
      </Button>
    </div>
  );
};

export default MoodSelector;
