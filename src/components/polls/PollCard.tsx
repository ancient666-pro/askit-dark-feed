
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Poll } from "@/types/poll";
import { firebaseService } from "@/services/firebase";
import { toast } from "sonner";
import { BarChart2, Clock, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface PollCardProps {
  poll: Poll;
  isTrending?: boolean;
  rank?: number;
  onPollUpdate?: (updatedPoll: Poll) => void;
}

const PollCard = ({ poll, isTrending = false, rank, onPollUpdate }: PollCardProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const hasVoted = firebaseService.hasVoted(poll.id);
  const votedOptionId = firebaseService.getVotedOption(poll.id);
  
  // Get color based on rank
  const getRankColor = (rank: number) => {
    switch(rank) {
      case 0: return "bg-gradient-to-r from-amber-300 to-yellow-500 border-amber-400";
      case 1: return "bg-gradient-to-r from-gray-300 to-gray-400 border-gray-400";
      case 2: return "bg-gradient-to-r from-amber-700 to-amber-600 border-amber-700";
      default: return "bg-primary text-primary-foreground";
    }
  };
  
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  const getTotalVotes = () => {
    return poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  };
  
  const getPercentage = (voteCount: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  };
  
  const handleVote = async (optionId: string) => {
    if (hasVoted || isVoting) return;
    
    setIsVoting(true);
    try {
      const updatedPoll = await firebaseService.votePoll({
        pollId: poll.id,
        optionId
      });
      
      if (updatedPoll && onPollUpdate) {
        onPollUpdate(updatedPoll);
      }
      
      toast.success("Vote recorded!");
    } catch (error) {
      toast.error("Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };
  
  return (
    <Card className={cn(
      "glass-card w-full relative overflow-hidden transition-all duration-300", 
      isTrending ? "bg-gradient-to-br from-primary/20 via-background to-background border-primary/30 shadow-lg" : "poll-card-shadow",
      hasVoted ? 'border-primary/30' : ''
    )}>
      {isTrending && rank !== undefined && (
        <div className={cn(
          "absolute top-0 left-0 px-4 py-1 rounded-br-lg font-bold text-xs shadow-md", 
          getRankColor(rank)
        )}>
          <span className={cn(
            "relative z-10",
            rank === 0 ? "animate-pulse text-black" : 
            rank === 1 ? "text-black" : 
            rank === 2 ? "text-white" : ""
          )}>
            #{rank + 1}
          </span>
          <div className={cn(
            "absolute inset-0 opacity-30",
            rank === 0 ? "shine-gold" : 
            rank === 1 ? "shine-silver" : 
            rank === 2 ? "shine-bronze" : ""
          )}></div>
        </div>
      )}
      
      {isTrending && (
        <div className="absolute top-0 right-0 flex items-center p-2 animate-pulse">
          <div className="trending-animation mr-1">
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <span className="text-xs font-medium text-green-400">Trending</span>
        </div>
      )}
      
      <CardContent className="p-5 pt-8">
        <div className="mb-4">
          <p className="text-lg font-medium">{poll.question}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {formatTime(poll.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Users className="h-3 w-3 mr-1" /> {getTotalVotes()} votes
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {poll.options.map((option) => (
            <div 
              key={option.id}
              className={cn(
                "poll-option p-3 rounded-lg border transition-all duration-300 hover:shadow-md", 
                hasVoted ? 'border-muted' : 'border-primary/50 hover:border-primary cursor-pointer',
                votedOptionId === option.id ? 'bg-primary/20 border-primary' : ''
              )}
              onClick={() => !hasVoted && !isVoting && handleVote(option.id)}
            >
              <div 
                className="poll-option-progress" 
                style={{ width: `${getPercentage(option.votes || 0)}%` }}
              />
              <div className="flex justify-between items-center relative z-10">
                <span>{option.text}</span>
                {hasVoted && <span className="text-sm font-medium">{getPercentage(option.votes || 0)}%</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      {!hasVoted && (
        <CardFooter className="px-5 pb-4 pt-1">
          <p className="text-xs text-muted-foreground">
            Tap an option to vote
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default PollCard;
