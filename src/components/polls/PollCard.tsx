
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Poll } from "@/types/poll";
import { firebaseService } from "@/services/firebase";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

interface PollCardProps {
  poll: Poll;
  onPollUpdate?: (updatedPoll: Poll) => void;
}

const PollCard = ({ poll, onPollUpdate }: PollCardProps) => {
  const [isVoting, setIsVoting] = useState(false);
  const hasVoted = firebaseService.hasVoted(poll.id);
  
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  const getTotalVotes = () => {
    if (poll.type === "yesNo") {
      return (poll.votes.yes || 0) + (poll.votes.no || 0);
    } else {
      return (poll.votes.optionA || 0) + (poll.votes.optionB || 0);
    }
  };
  
  const getPercentage = (voteCount: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((voteCount / total) * 100);
  };
  
  const handleVote = async (vote: "yes" | "no" | "optionA" | "optionB") => {
    if (hasVoted) return;
    
    setIsVoting(true);
    try {
      const updatedPoll = await firebaseService.votePoll({
        pollId: poll.id,
        vote
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
    <Card className={`glass-card poll-card-shadow w-full relative overflow-hidden ${hasVoted ? 'border-primary/30' : ''}`}>
      {poll.isPinned && (
        <div className="poll-pin">
          <MapPin className="h-4 w-4" />
        </div>
      )}
      
      <CardContent className="p-5">
        <div className="mb-4">
          <p className="text-lg font-medium">{poll.question}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTime(poll.createdAt)} • {getTotalVotes()} votes
          </p>
        </div>
        
        <div className="space-y-3">
          {poll.type === "yesNo" ? (
            <>
              <div 
                className={`poll-option p-3 rounded-lg border ${hasVoted ? 'border-muted' : 'border-primary/50 hover:border-primary cursor-pointer'}`}
                onClick={() => !hasVoted && !isVoting && handleVote("yes")}
              >
                <div 
                  className="poll-option-progress" 
                  style={{ width: `${getPercentage(poll.votes.yes || 0)}%` }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <span>Yes</span>
                  {hasVoted && <span className="text-sm font-medium">{getPercentage(poll.votes.yes || 0)}%</span>}
                </div>
              </div>
              
              <div 
                className={`poll-option p-3 rounded-lg border ${hasVoted ? 'border-muted' : 'border-primary/50 hover:border-primary cursor-pointer'}`}
                onClick={() => !hasVoted && !isVoting && handleVote("no")}
              >
                <div 
                  className="poll-option-progress" 
                  style={{ width: `${getPercentage(poll.votes.no || 0)}%` }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <span>No</span>
                  {hasVoted && <span className="text-sm font-medium">{getPercentage(poll.votes.no || 0)}%</span>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div 
                className={`poll-option p-3 rounded-lg border ${hasVoted ? 'border-muted' : 'border-primary/50 hover:border-primary cursor-pointer'}`}
                onClick={() => !hasVoted && !isVoting && handleVote("optionA")}
              >
                <div 
                  className="poll-option-progress" 
                  style={{ width: `${getPercentage(poll.votes.optionA || 0)}%` }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <span>Option A</span>
                  {hasVoted && <span className="text-sm font-medium">{getPercentage(poll.votes.optionA || 0)}%</span>}
                </div>
              </div>
              
              <div 
                className={`poll-option p-3 rounded-lg border ${hasVoted ? 'border-muted' : 'border-primary/50 hover:border-primary cursor-pointer'}`}
                onClick={() => !hasVoted && !isVoting && handleVote("optionB")}
              >
                <div 
                  className="poll-option-progress" 
                  style={{ width: `${getPercentage(poll.votes.optionB || 0)}%` }}
                />
                <div className="flex justify-between items-center relative z-10">
                  <span>Option B</span>
                  {hasVoted && <span className="text-sm font-medium">{getPercentage(poll.votes.optionB || 0)}%</span>}
                </div>
              </div>
            </>
          )}
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
