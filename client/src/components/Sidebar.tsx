import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Radio, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Shield
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/threat-feeds", label: "Threat Feeds", icon: Radio },
  { path: "/cve-reports", label: "CVE Reports", icon: FileText },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/chat-assistant", label: "Chat Assistant", icon: MessageSquare },
  { path: "/settings", label: "Settings", icon: Settings }
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-60 bg-sidebar border-r border-sidebar-border h-screen flex flex-col" data-testid="sidebar-navigation">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg" data-testid="text-app-title">CTI Aggregator</h1>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover-elevate"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
        Cyber Threat Intelligence Aggregator | Capstone Project
      </div>
    </div>
  );
}
