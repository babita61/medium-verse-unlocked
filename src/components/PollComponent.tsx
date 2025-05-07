
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartBar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollProps {
  pollId: string;
  question: string;
  options: PollOption[];
  className?: string;
}

const PollComponent = ({ pollId, question, options: initialOptions, className }: PollProps) => {
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  
  // Load vote state from localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem(`poll-${pollId}-vote`);
    if (savedVote) {
      setSelectedOption(savedVote);
      setHasVoted(true);
    }
    
    // Load vote counts
    const savedPollData = localStorage.getItem(`poll-${pollId}-data`);
    if (savedPollData) {
      try {
        const parsedData = JSON.parse(savedPollData) as PollOption[];
        setOptions(parsedData);
        // Calculate total votes
        const total = parsedData.reduce((sum, option) => sum + option.votes, 0);
        setTotalVotes(total);
      } catch (e) {
        console.error('Failed to parse poll data:', e);
      }
    } else {
      // Initialize with zeros if no data
      const total = initialOptions.reduce((sum, option) => sum + option.votes, 0);
      setTotalVotes(total);
    }
  }, [pollId, initialOptions]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    
    // Update state with new vote
    const updatedOptions = options.map(option => {
      if (option.id === optionId) {
        return { ...option, votes: option.votes + 1 };
      }
      return option;
    });
    
    setOptions(updatedOptions);
    setSelectedOption(optionId);
    setHasVoted(true);
    setTotalVotes(prev => prev + 1);
    
    // Store vote in localStorage
    localStorage.setItem(`poll-${pollId}-vote`, optionId);
    localStorage.setItem(`poll-${pollId}-data`, JSON.stringify(updatedOptions));
    
    toast.success("Your vote has been recorded!");
  };

  const resetVote = () => {
    // Reset user's vote
    localStorage.removeItem(`poll-${pollId}-vote`);
    setSelectedOption(null);
    setHasVoted(false);
    
    // Update the options to reduce the vote count
    if (selectedOption) {
      const resetOptions = options.map(option => {
        if (option.id === selectedOption) {
          return { ...option, votes: Math.max(0, option.votes - 1) };
        }
        return option;
      });
      
      setOptions(resetOptions);
      setTotalVotes(prev => Math.max(0, prev - 1));
      localStorage.setItem(`poll-${pollId}-data`, JSON.stringify(resetOptions));
    }
    
    toast.success("Vote reset. You can vote again.");
  };

  // Calculate percentages for the results view
  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 mb-6 bg-card",
      hasVoted ? "border-primary/30" : "border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="flex items-center gap-2 mb-4">
        <ChartBar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">{question}</h3>
      </div>
      
      <div className="space-y-3">
        {options.map(option => (
          <div key={option.id} className="space-y-1">
            {hasVoted ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{option.text}</span>
                  <span className="text-gray-500">{getPercentage(option.votes)}% ({option.votes})</span>
                </div>
                <Progress 
                  value={getPercentage(option.votes)} 
                  className={selectedOption === option.id ? "h-2 bg-muted" : "h-2 bg-muted"} 
                />
              </>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 font-normal"
                onClick={() => handleVote(option.id)}
              >
                {option.text}
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {hasVoted && (
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetVote}
            className="text-xs"
          >
            Reset vote
          </Button>
          <div className="text-xs text-gray-500 mt-1">Total votes: {totalVotes}</div>
        </div>
      )}
    </div>
  );
};

export default PollComponent;
