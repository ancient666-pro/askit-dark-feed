
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import PollCard from "@/components/polls/PollCard";
import AnimatedFireIcon from "@/components/ui/AnimatedFireIcon";
import { Poll } from "@/types/poll";
import { firebaseService } from "@/services/firebase";
import { Loader2 } from "lucide-react";

const TrendingPolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        // Clean any expired pins first
        await firebaseService.cleanExpiredPins();
        
        // Then fetch the updated polls
        const fetchedPolls = await firebaseService.getPolls();
        setPolls(fetchedPolls);
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolls();
  }, []);
  
  const handlePollUpdate = (updatedPoll: Poll) => {
    setPolls(prev => 
      prev.map(poll => poll.id === updatedPoll.id ? updatedPoll : poll)
    );
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-primary">Trending Polls</h1>
          <p className="text-muted-foreground">Vote on community polls or create your own</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : polls.length > 0 ? (
          <div className="space-y-5">
            {polls.map((poll, index) => (
              <div key={poll.id} className="relative">
                {index === 0 && <AnimatedFireIcon />}
                <PollCard 
                  poll={poll} 
                  onPollUpdate={handlePollUpdate}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No polls available. Be the first to create one!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TrendingPolls;
