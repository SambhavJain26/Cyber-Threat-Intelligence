import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronLeft, ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { threatFeedsAPI, exportAPI, settingsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Timezone offset mapping (in hours from UTC)
const timezoneOffsets: Record<string, number> = {
  'UTC': 0,
  'GMT': 0,
  'EST': -5,
  'PST': -8,
  'IST': 5.5,
};

// Convert date string to specified timezone
const convertToTimezone = (dateStr: string, timezone: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const offset = timezoneOffsets[timezone] || 0;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (offset * 3600000));
    
    return targetTime.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ` ${timezone}`;
  } catch (e) {
    return dateStr;
  }
};

// Parse refresh interval to milliseconds
const parseRefreshInterval = (interval: string): number => {
  const match = interval.match(/(\d+)\s*(minute|minutes|hour|hours)/i);
  if (!match) return 5 * 60 * 1000; // Default 5 minutes
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('hour')) {
    return value * 60 * 60 * 1000;
  }
  return value * 60 * 1000;
};

export default function ThreatFeeds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedsData, setFeedsData] = useState<any>({ data: [], totalItems: 0, totalPages: 0 });
  const [exporting, setExporting] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [timezone, setTimezone] = useState<string>("UTC");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<string>("5 minutes");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load settings to get items per page preference and other settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.getGeneral();
        if (response.data.itemsPerPage) {
          setItemsPerPage(parseInt(response.data.itemsPerPage));
        } else {
          setItemsPerPage(20); // Default value
        }
        if (response.data.timezone) {
          setTimezone(response.data.timezone);
        }
        if (response.data.autoRefreshInterval) {
          setAutoRefreshInterval(response.data.autoRefreshInterval);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setItemsPerPage(20); // Fallback to default on error
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, typeFilter, severityFilter]);

  // Fetch feeds function - memoized for auto-refresh
  const fetchFeeds = useCallback(async (isAutoRefresh = false) => {
    if (!settingsLoaded || itemsPerPage === null) {
      return;
    }
    
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);

      const response = await threatFeedsAPI.getFeeds({
        search: searchQuery,
        type: typeFilter,
        severity: severityFilter,
        page: currentPage,
        itemsPerPage: itemsPerPage.toString()
      });

      setFeedsData(response.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError("Failed to load threat feeds. Please try again later.");
      console.error("Threat feeds fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, severityFilter, currentPage, itemsPerPage, settingsLoaded]);

  // Initial fetch and on dependency changes
  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  // Auto-refresh based on settings interval
  useEffect(() => {
    if (!settingsLoaded) return;

    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new auto-refresh interval
    const intervalMs = parseRefreshInterval(autoRefreshInterval);
    refreshIntervalRef.current = setInterval(() => {
      fetchFeeds(true); // Pass true for auto-refresh to not show loading spinner
    }, intervalMs);

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshInterval, settingsLoaded, fetchFeeds]);

  // Re-fetch settings when window gets focus (to pick up changes from Settings page)
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const response = await settingsAPI.getGeneral();
        if (response.data.timezone && response.data.timezone !== timezone) {
          setTimezone(response.data.timezone);
        }
        if (response.data.autoRefreshInterval && response.data.autoRefreshInterval !== autoRefreshInterval) {
          setAutoRefreshInterval(response.data.autoRefreshInterval);
        }
      } catch (err) {
        console.error("Failed to refresh settings:", err);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [timezone, autoRefreshInterval]);

  const paginatedData = feedsData.data;
  const totalPages = feedsData.totalPages || 1;

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportAPI.exportThreatFeeds({
        search: searchQuery || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined
      });

      // Create a blob from the response and download it
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `threat-feeds-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Threat feeds exported successfully!",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Error",
        description: "Failed to export threat feeds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
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

  const getThreatColor = (threat: string) => {
    const colors: Record<string, string> = {
      Phishing: "bg-red-500/20 text-red-400 border-red-500/30",
      "C2 Server": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      Malware: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "Malware Distribution": "bg-amber-600/20 text-amber-300 border-amber-600/30",
      Exploit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      Ransomware: "bg-pink-500/20 text-pink-400 border-pink-500/30"
    };
    return colors[threat] || "bg-secondary text-secondary-foreground";
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-center">Error Loading Data</h2>
          <p className="text-muted-foreground text-center">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Threat Feeds</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Monitor and analyze indicators of compromise (IOCs)
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" data-testid="text-section-title">IOC Database</h2>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} data-testid="button-export">
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search IOCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-ioc"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48" data-testid="select-filter-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Domain">Domain</SelectItem>
              <SelectItem value="IP Address">IP Address</SelectItem>
              <SelectItem value="File Hash">File Hash</SelectItem>
              <SelectItem value="URL">URL</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-48" data-testid="select-filter-severity">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">IOC Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">IOC Value</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Source</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Threat Type</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-border hover-elevate" data-testid={`table-row-${idx}`}>
                  <td className="px-4 py-3 text-sm">{convertToTimezone(item.date, timezone)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.type}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{item.value}</td>
                  <td className="px-4 py-3 text-sm">{item.source}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="outline" className={getThreatColor(item.threatType)}>
                      {item.threatType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={`${getSeverityColor(item.severity)} no-default-hover-elevate no-default-active-elevate`}>
                      {item.severity}
                    </Badge>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {feedsData.totalItems === 0 ? 0 : ((currentPage - 1) * (itemsPerPage ?? 20)) + 1}-{Math.min(currentPage * (itemsPerPage ?? 20), feedsData.totalItems)} of {feedsData.totalItems} IOCs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              data-testid="button-pagination-previous"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm px-4" data-testid="text-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              data-testid="button-pagination-next"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
