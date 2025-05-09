
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PollTypeToggleProps {
  isYesNo: boolean;
  onChange: (isYesNo: boolean) => void;
}

const PollTypeToggle = ({ isYesNo, onChange }: PollTypeToggleProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <Label className="text-sm font-medium text-secondary-foreground">Poll Type</Label>
      
      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
        <div className={`text-sm ${isYesNo ? 'text-primary' : 'text-secondary'}`}>
          Yes / No
        </div>
        
        <Switch
          checked={!isYesNo}
          onCheckedChange={(checked) => onChange(!checked)}
          className="data-[state=checked]:bg-primary"
        />
        
        <div className={`text-sm ${!isYesNo ? 'text-primary' : 'text-secondary'}`}>
          Option A / B
        </div>
      </div>
    </div>
  );
};

export default PollTypeToggle;
