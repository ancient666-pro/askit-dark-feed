
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import PollCard from "@/components/polls/PollCard";
import { Poll } from "@/types/poll";
import { firebaseService } from "@/services/firebase";
import { Loader2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const TrendingPolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [topTrending, setTopTrending] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        // Get all polls
        const fetchedPolls = await firebaseService.getPolls();
        setPolls(fetchedPolls);
        
        // Get top trending polls
        const top3Trending = await firebaseService.getTopTrendingPolls(3);
        setTopTrending(top3Trending);
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolls();
  }, []);
  
  const handlePollUpdate = (updatedPoll: Poll) => {
    // Update both regular polls and top trending polls
    setPolls(prev => 
      prev.map(poll => poll.id === updatedPoll.id ? updatedPoll : poll)
    );
    
    setTopTrending(prev => {
      const isInTopTrending = prev.some(poll => poll.id === updatedPoll.id);
      if (isInTopTrending) {
        return prev.map(poll => poll.id === updatedPoll.id ? updatedPoll : poll);
      }
      return prev;
    });
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Top Trending Section */}
            {topTrending.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary mr-2 trending-icon" />
                  <h2 className="text-xl font-bold text-gradient bg-gradient-to-r from-primary to-primary/70">Hot Right Now</h2>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  {topTrending.map((poll, index) => (
                    <div key={poll.id} className="md:col-span-1">
                      <PollCard 
                        poll={poll} 
                        onPollUpdate={handlePollUpdate}
                        isTrending={true}
                        rank={index}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* All Polls Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">All Polls</h2>
              
              {polls.length > 0 ? (
                <div className="space-y-5">
                  {polls.map((poll) => (
                    <div key={poll.id}>
                      <PollCard 
                        poll={poll} 
                        onPollUpdate={handlePollUpdate}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No polls available. Be the first to create one!</p>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default TrendingPolls;
