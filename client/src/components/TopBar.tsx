import { useState } from "react";
import { Search, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchAPI } from "@/lib/api";

export default function TopBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await searchAPI.search(query);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: "bg-destructive text-destructive-foreground",
      High: "bg-amber-500 text-white",
      Medium: "bg-yellow-600 text-white",
      Low: "bg-blue-500 text-white"
    };
    return colors[severity] || "bg-secondary text-secondary-foreground";
  };

  return (
    <>
      <div className="h-16 bg-card border-b border-card-border px-6 flex items-center justify-between" data-testid="topbar-header">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search domains, IPs, CVEs..."
              className="pl-10 bg-background border-border"
              data-testid="input-search-global"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Avatar className="w-8 h-8 cursor-pointer hover-elevate" data-testid="button-user-profile">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Results for "{searchQuery}"</DialogTitle>
          </DialogHeader>
          
          {searchResults && (
            <div className="space-y-6">
              {searchResults.totalResults === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No results found for "{searchQuery}"
                </p>
              )}

              {searchResults.threatFeeds && searchResults.threatFeeds.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Threat Feeds ({searchResults.threatFeeds.length})</h3>
                  <div className="space-y-2">
                    {searchResults.threatFeeds.map((item: any) => (
                      <div key={item.id} className="p-3 rounded-md border border-border hover-elevate">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm truncate">{item.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.type} • {item.source} • {item.date}
                            </p>
                          </div>
                          <Badge className={`${getSeverityColor(item.severity)} no-default-hover-elevate no-default-active-elevate flex-shrink-0`}>
                            {item.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.cveReports && searchResults.cveReports.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">CVE Reports ({searchResults.cveReports.length})</h3>
                  <div className="space-y-2">
                    {searchResults.cveReports.map((cve: any) => (
                      <div key={cve.id} className="p-3 rounded-md border border-border hover-elevate">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{cve.id}</p>
                            <p className="text-sm mt-1">{cve.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {cve.description}
                            </p>
                          </div>
                          <Badge className="bg-destructive text-destructive-foreground no-default-hover-elevate no-default-active-elevate flex-shrink-0">
                            {cve.cvssScore}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
