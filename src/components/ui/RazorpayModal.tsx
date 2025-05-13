
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { razorpayService } from "@/services/razorpay";
import { Poll } from "@/types/poll";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface RazorpayModalProps {
  poll: Poll | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RazorpayModal = ({ poll, open, onOpenChange, onSuccess }: RazorpayModalProps) => {
  const [loading, setLoading] = useState(false);
  
  const handleBoost = async () => {
    if (!poll) {
      toast.error("Poll information is missing");
      return;
    }
    
    setLoading(true);
    try {
      toast.info("Initializing payment...");
      console.log(`Starting payment for poll: ${poll.id}`);
      
      await razorpayService.openCheckout(poll.id, () => {
        onSuccess();
        onOpenChange(false);
      });
    } catch (error) {
      console.error("Error in Razorpay checkout:", error);
      
      // More descriptive error message
      const errorMessage = error.message || "Unknown error";
      toast.error(`Payment failed: ${errorMessage}. Please check console for details.`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!poll) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Boost Your Poll</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Pin your poll to the top of the trending feed for 1 hour
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 rounded-lg p-4 my-4">
          <p className="text-sm text-muted-foreground">Poll</p>
          <p className="font-medium mt-1">{poll.question}</p>
        </div>
        
        <div className="space-y-4 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Pinning Fee</span>
            <span className="font-medium">₹10.00</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm">Duration</span>
            <span className="font-medium">1 Hour</span>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBoost}
            disabled={loading}
            className="sm:w-auto w-full flex items-center gap-2"
          >
            {loading ? "Processing..." : "Pay ₹10 to Boost"}
            {!loading && <ExternalLink className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RazorpayModal;
