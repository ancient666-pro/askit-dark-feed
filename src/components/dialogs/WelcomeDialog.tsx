
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Vote, Users, TrendingUp, Shield, Eye, UserCheck } from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WelcomeDialog = ({ open, onOpenChange }: WelcomeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Welcome to AskIt! 🗳️
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Polls made simple by ancient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Core Features */}
          <div>
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
            </div>
          </div>

          <Separator />

          {/* Privacy Policy */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Privacy & Data
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <Eye className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="font-medium">Anonymous Voting</p>
                  <p className="text-muted-foreground">
                    All votes are anonymous - we don't track individual voters
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UserCheck className="w-4 h-4 mt-0.5 text-green-500" />
                <div>
                  <p className="font-medium">Minimal Data Collection</p>
                  <p className="text-muted-foreground">
                    We only collect poll data and voting statistics for functionality
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-4 h-4 mt-0.5 text-purple-500" />
                <div>
                  <p className="font-medium">Secure & Safe</p>
                  <p className="text-muted-foreground">
                    Your data is encrypted and stored securely with Firebase
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={() => onOpenChange(false)} className="px-8">
              Get Started
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
