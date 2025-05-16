
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border py-3 px-4 select-none">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1
            className="text-xl md:text-2xl font-semibold shimmer-title text-primary"
            aria-label="AskIt"
            tabIndex={0}
          >
            AskIt
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          {isHome ? (
            <Button asChild size="sm" className="flex items-center gap-1">
              <Link to="/create">
                <PlusCircle className="w-4 h-4 mr-1" /> Create Poll
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                Back to Trending
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
