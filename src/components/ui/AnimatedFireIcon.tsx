
import { Flame } from "lucide-react";

const AnimatedFireIcon = () => {
  return (
    <div className="absolute -top-1 -left-1 z-10 animate-bounce">
      <div className="relative">
        <Flame className="h-6 w-6 text-amber-400 animate-pulse" />
        <div className="absolute inset-0 bg-amber-400 blur-md opacity-30 rounded-full -z-10"></div>
      </div>
    </div>
  );
};

export default AnimatedFireIcon;
