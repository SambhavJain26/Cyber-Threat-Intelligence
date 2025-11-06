import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TopBar() {
  return (
    <div className="h-16 bg-card border-b border-card-border px-6 flex items-center justify-between" data-testid="topbar-header">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search domains, IPs, CVEs..."
            className="pl-10 bg-background border-border"
            data-testid="input-search-global"
          />
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
  );
}
