
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Vote, Users, TrendingUp, Shield, Eye, UserCheck, Zap, Clock, Globe } from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WelcomeDialog = ({ open, onOpenChange }: WelcomeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Welcome to AskIt! 🗳️
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Polls made simple by ancient
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Core Features
            </h3>
            <div className="grid gap-3">
              <div className="flex items-start space-x-3">
                <Vote className="w-5 h-5 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">Create Instant Polls</p>
                  <p className="text-sm text-muted-foreground">
                    Create polls in seconds with multiple choice options
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">Real-time Voting</p>
                  <p className="text-sm text-muted-foreground">
                    See results update live as people vote
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 mt-0.5 text-orange-500" />
                <div>
                  <p className="font-medium">Trending Polls</p>
                  <p className="text-sm text-muted-foreground">
                    Discover what's hot and trending in the community
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 mt-0.5 text-purple-500" />
                <div>
                  <p className="font-medium">Public & Anonymous</p>
                  <p className="text-sm text-muted-foreground">
                    Share polls publicly while keeping votes anonymous
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="how-it-works" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-primary" />
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium">Create Your Poll</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Create Poll" and add your question with multiple choice options. Set it as public or private.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium">Share & Vote</p>
                  <p className="text-sm text-muted-foreground">
                    Share your poll link with others or let them discover it on the trending page. Anyone can vote anonymously.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium">Watch Results Live</p>
                  <p className="text-sm text-muted-foreground">
                    See results update in real-time as votes come in. Popular polls appear in the "Hot Right Now" section.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">No Registration Required</p>
                  <p className="text-sm text-muted-foreground">
                    Start creating and voting immediately - no account needed!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Privacy & Data Protection
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-500" />
                  What We Collect
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                  <li>Poll questions and answer options you create</li>
                  <li>Voting statistics (anonymous vote counts)</li>
                  <li>Device identifiers for preventing duplicate votes</li>
                  <li>Basic usage analytics to improve the service</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-green-500" />
                  What We Don't Collect
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                  <li>Personal information or account details</li>
                  <li>Individual voting choices or preferences</li>
                  <li>IP addresses or location data</li>
                  <li>Any personally identifiable information</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-purple-500" />
                  How We Protect Your Data
                </h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                  <li>All data is encrypted and stored securely with Firebase</li>
                  <li>Votes are completely anonymous and cannot be traced back</li>
                  <li>We use device IDs only to prevent duplicate voting</li>
                  <li>No data is shared with third parties</li>
                </ul>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> By using AskIt, you agree to our data practices as described above. 
                  We are committed to protecting your privacy and maintaining transparency about our data usage.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="px-8">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
