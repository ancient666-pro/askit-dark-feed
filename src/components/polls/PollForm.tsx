
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { firebaseService } from "@/services/firebase";
import { Poll, PollOption } from "@/types/poll";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

const PollForm = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [isYesNo, setIsYesNo] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [customOptions, setCustomOptions] = useState<PollOption[]>([
    { id: uuidv4(), text: "Option A", votes: 0 },
    { id: uuidv4(), text: "Option B", votes: 0 }
  ]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit to 280 characters (like X/Twitter)
    if (e.target.value.length <= 280) {
      setQuestion(e.target.value);
    }
  };

  const handleOptionChange = (id: string, value: string) => {
    setCustomOptions(prev => 
      prev.map(opt => opt.id === id ? { ...opt, text: value } : opt)
    );
  };

  const addOption = () => {
    if (customOptions.length < 6) {
      setCustomOptions(prev => [
        ...prev, 
        { id: uuidv4(), text: `Option ${String.fromCharCode(65 + prev.length)}`, votes: 0 }
      ]);
    } else {
      toast.error("Maximum 6 options allowed");
    }
  };

  const removeOption = (id: string) => {
    if (customOptions.length > 2) {
      setCustomOptions(prev => prev.filter(opt => opt.id !== id));
    } else {
      toast.error("Minimum 2 options required");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (!isYesNo && customOptions.some(opt => !opt.text.trim())) {
      toast.error("All options must have text");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const pollType = isYesNo ? "yesNo" : "customOptions";
      let options: PollOption[];
      
      if (isYesNo) {
        options = [
          { id: "yes", text: "Yes", votes: 0 },
          { id: "no", text: "No", votes: 0 }
        ];
      } else {
        options = customOptions;
      }
      
      await firebaseService.createPoll(question.trim(), pollType, options);
      toast.success("Poll created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
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
          
          {/* Poll Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Poll Type</Label>
            <RadioGroup 
              defaultValue={isYesNo ? "yesNo" : "customOptions"} 
              onValueChange={(value) => setIsYesNo(value === "yesNo")}
              className="grid grid-cols-2 gap-4"
            >
              <div className={cn(
                "flex items-center space-x-2 rounded-md border p-4 cursor-pointer",
                isYesNo ? "border-primary bg-primary/10" : "border-muted"
              )}>
                <RadioGroupItem value="yesNo" id="yesNo" className="sr-only" />
                <Label 
                  htmlFor="yesNo" 
                  className={cn(
                    "cursor-pointer font-medium flex-grow",
                    isYesNo ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Yes / No
                </Label>
                {isYesNo && <Check className="h-4 w-4 text-primary" />}
              </div>
              
              <div className={cn(
                "flex items-center space-x-2 rounded-md border p-4 cursor-pointer",
                !isYesNo ? "border-primary bg-primary/10" : "border-muted"
              )}>
                <RadioGroupItem value="customOptions" id="customOptions" className="sr-only" />
                <Label 
                  htmlFor="customOptions" 
                  className={cn(
                    "cursor-pointer font-medium flex-grow",
                    !isYesNo ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Custom Options
                </Label>
                {!isYesNo && <Check className="h-4 w-4 text-primary" />}
              </div>
            </RadioGroup>
          </div>
          
          {/* Custom Options */}
          {!isYesNo && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Poll Options</Label>
              <div className="space-y-2">
                {customOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      className="flex-grow"
                      placeholder="Enter option text"
                      maxLength={100}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={customOptions.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={addOption}
                  disabled={customOptions.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
          
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
  );
};

export default PollForm;
