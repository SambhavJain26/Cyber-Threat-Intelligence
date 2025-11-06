import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { iocDatabase } from "@/data/mockData";

export default function ThreatFeeds() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const filteredData = iocDatabase.filter((item) => {
    const matchesSearch = item.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
    return matchesSearch && matchesType && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
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
              {paginatedData.map((item, idx) => (
                <tr key={item.id} className="border-b border-border hover-elevate" data-testid={`table-row-${idx}`}>
                  <td className="px-4 py-3 text-sm">{item.date}</td>
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
        </div>

        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} IOCs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
