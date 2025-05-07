
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, StopCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PodcastPlayerProps {
  content: string;
  title: string;
  className?: string;
}

const PodcastPlayer = ({ content, title, className }: PodcastPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [volume, setVolume] = useState(1);
  const [isSupported, setIsSupported] = useState(true);
  const [cleanedContent, setCleanedContent] = useState("");

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const contentRef = useRef(content);
  const intervalRef = useRef<number | null>(null);

  // Check if browser supports speech synthesis
  useEffect(() => {
    if (!window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Clean the content by removing HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    setCleanedContent(textContent);
    
    // Get available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Prefer English voices
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en-') && voice.localService
        );
        setVoice(englishVoice || voices[0]);
      }
    };

    // Load voices
    loadVoices();
    
    // Some browsers (like Chrome) load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup function
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update content reference when content prop changes
  useEffect(() => {
    contentRef.current = content;
    
    // Clean the content by removing HTML tags
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    setCleanedContent(textContent);
    
    // If we're already playing, stop and reset
    if (isPlaying) {
      handleStop();
    }
  }, [content]);

  // Setup speech synthesis
  const setupUtterance = () => {
    const utterance = new SpeechSynthesisUtterance(cleanedContent);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.pitch = 1;
    
    // Set the title as part of the utterance
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      
      // Estimate duration (rough approximation: ~5 characters per second at rate 1)
      const estimatedDuration = (cleanedContent.length / 5) / rate;
      setDuration(estimatedDuration);
      
      // Start position tracking
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      
      let position = 0;
      intervalRef.current = window.setInterval(() => {
        position += 1;
        setCurrentPosition(Math.min(position, estimatedDuration));
      }, 1000) as unknown as number;
    };
    
    utterance.onpause = () => {
      setIsPaused(true);
    };
    
    utterance.onresume = () => {
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
    
    utteranceRef.current = utterance;
    return utterance;
  };

  const handlePlay = () => {
    if (!isSupported) return;
    
    // If paused, resume
    if (isPaused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }
    
    // If already speaking, cancel current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Create and start new utterance
    const utterance = setupUtterance();
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!isSupported || !isPlaying) return;
    
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const handleStop = () => {
    if (!isSupported) return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleRateChange = (newRate: number[]) => {
    const rateValue = newRate[0];
    setRate(rateValue);
    
    if (utteranceRef.current && isPlaying) {
      // To update the rate during playback, we need to restart
      const currentTime = currentPosition;
      
      // Stop current playback
      window.speechSynthesis.cancel();
      
      // Setup new utterance with updated rate
      const utterance = setupUtterance();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    
    if (utteranceRef.current) {
      utteranceRef.current.volume = volumeValue;
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoice = availableVoices.find(v => v.name === e.target.value) || null;
    setVoice(selectedVoice);
    
    if (isPlaying) {
      // Restart with new voice
      handleStop();
      setTimeout(handlePlay, 50); // Small delay to ensure stop completes
    }
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isSupported) {
    return (
      <div className={cn("text-center p-4 border rounded-md bg-muted", className)}>
        Your browser does not support Speech Synthesis.
      </div>
    );
  }

  return (
    <div className={cn("p-4 border rounded-md shadow-sm bg-card", className)}>
      <h3 className="font-medium text-lg mb-4">Listen to this article</h3>
      
      <div className="space-y-4">
        {/* Playback controls */}
        <div className="flex items-center justify-center space-x-2">
          {!isPlaying || isPaused ? (
            <Button 
              onClick={handlePlay} 
              size="icon" 
              variant="outline"
              aria-label="Play"
            >
              <Play className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
              onClick={handlePause} 
              size="icon" 
              variant="outline"
              aria-label="Pause"
            >
              <Pause className="h-5 w-5" />
            </Button>
          )}
          
          <Button 
            onClick={handleStop} 
            size="icon" 
            variant="outline" 
            disabled={!isPlaying}
            aria-label="Stop"
          >
            <StopCircle className="h-5 w-5" />
          </Button>
          
          {/* Progress display */}
          <div className="text-sm ml-2">
            {formatTime(currentPosition)} / {formatTime(duration)}
          </div>
        </div>
        
        {/* Voice selection */}
        {availableVoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <label htmlFor="voice-select" className="text-sm font-medium">
                Voice
              </label>
              <select 
                id="voice-select"
                value={voice?.name || ''}
                onChange={handleVoiceChange}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Speed control */}
            <div className="space-y-1">
              <label className="text-sm font-medium flex justify-between">
                <span>Speed: {rate.toFixed(1)}x</span>
              </label>
              <Slider
                defaultValue={[1]}
                value={[rate]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handleRateChange}
              />
            </div>
          </div>
        )}
        
        {/* Volume control */}
        <div className="space-y-1">
          <label className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span>Volume: {Math.round(volume * 100)}%</span>
          </label>
          <Slider
            defaultValue={[1]}
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PodcastPlayer;
