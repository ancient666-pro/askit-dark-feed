
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { firebaseService } from "@/services/firebase";
import { Poll } from "@/types/poll";
import PollTypeToggle from "@/components/ui/PollTypeToggle";
import RazorpayModal from "@/components/ui/RazorpayModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flame } from "lucide-react";

const PollForm = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [isYesNo, setIsYesNo] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null);
  const [boostPoll, setBoostPoll] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit to 280 characters (like X/Twitter)
    if (e.target.value.length <= 280) {
      setQuestion(e.target.value);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const pollType = isYesNo ? "yesNo" : "optionAB";
      const newPoll = await firebaseService.createPoll(question.trim(), pollType);
      
      setCreatedPoll(newPoll);
      
      if (boostPoll) {
        setShowRazorpayModal(true);
      } else {
        toast.success("Poll created successfully!");
        navigate("/");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleBoostSuccess = () => {
    navigate("/");
  };
  
  return (
    <>
      <Card className="glass-card poll-card-shadow w-full max-w-lg">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Textarea
                placeholder="Ask a question..."
                className="min-h-[120px] resize-none bg-muted/50 border-input focus-visible:ring-primary"
                value={question}
                onChange={handleChange}
                maxLength={280}
              />
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">
                  {question.length}/280
                </span>
              </div>
            </div>
            
            <PollTypeToggle isYesNo={isYesNo} onChange={setIsYesNo} />
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="boost-poll"
                checked={boostPoll}
                onCheckedChange={setBoostPoll}
              />
              <Label htmlFor="boost-poll" className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Boost this poll (₹10)</span>
              </Label>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!question.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Poll"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <RazorpayModal
        poll={createdPoll}
        open={showRazorpayModal}
        onOpenChange={(open) => {
          setShowRazorpayModal(open);
          if (!open) navigate("/");
        }}
        onSuccess={handleBoostSuccess}
      />
    </>
  );
};

export default PollForm;
