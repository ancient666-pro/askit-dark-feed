
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import PollCard from "@/components/polls/PollCard";
import WelcomeDialog from "@/components/dialogs/WelcomeDialog";
import { Poll } from "@/types/poll";
import { firebaseService } from "@/services/firebase";
import { Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TrendingPolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [topTrending, setTopTrending] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    // Check if user has visited before and show welcome dialog
    const hasVisited = localStorage.getItem('askit-visited');
    console.log("Has visited before:", hasVisited);
    
    if (!hasVisited) {
      console.log("First time visitor - showing welcome dialog");
      setShowWelcome(true);
    }

    const fetchPolls = async () => {
      try {
        console.log("Starting to fetch polls...");
        setError(null);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        // Get all polls with timeout
        const pollsPromise = firebaseService.getPolls();
        const fetchedPolls = await Promise.race([pollsPromise, timeoutPromise]) as Poll[];
        
        console.log("Fetched polls:", fetchedPolls);
        setPolls(fetchedPolls);
        
        // Get top trending polls
        const top3Trending = await firebaseService.getTopTrendingPolls(3);
        console.log("Fetched trending polls:", top3Trending);
        setTopTrending(top3Trending);
        
      } catch (error) {
        console.error("Error fetching polls:", error);
        setError(error instanceof Error ? error.message : "Failed to load polls");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolls();
  }, []);

  const handleWelcomeClose = () => {
    console.log("Welcome dialog closed - marking as visited");
    setShowWelcome(false);
    localStorage.setItem('askit-visited', 'true');
  };
  
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

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    // Trigger re-fetch by updating a key state
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <WelcomeDialog open={showWelcome} onOpenChange={handleWelcomeClose} />
      
      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <Button onClick={retryFetch} variant="outline">
              Try Again
            </Button>
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
                  <Button 
                    onClick={() => setShowWelcome(true)} 
                    variant="link" 
                    className="mt-2"
                  >
                    Learn more about AskIt
                  </Button>
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
