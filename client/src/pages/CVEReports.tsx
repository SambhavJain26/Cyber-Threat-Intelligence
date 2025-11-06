import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Clock } from "lucide-react";
import { cveReports } from "@/data/mockData";

export default function CVEReports() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = cveReports.filter((cve) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      cve.id.toLowerCase().includes(searchLower) ||
      cve.title.toLowerCase().includes(searchLower) ||
      cve.description.toLowerCase().includes(searchLower)
    );
  });

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return "bg-destructive text-destructive-foreground";
    if (score >= 7.0) return "bg-amber-500 text-white";
    if (score >= 4.0) return "bg-yellow-600 text-white";
    return "bg-blue-500 text-white";
  };

  const getCVSSLabel = (score: number) => {
    if (score >= 9.0) return "CRITICAL";
    if (score >= 7.0) return "HIGH";
    if (score >= 4.0) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">CVE Reports</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Common Vulnerabilities and Exposures with AI-powered analysis
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold" data-testid="text-section-title">Latest CVE Reports</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Last updated: 2 hours ago
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search CVE IDs, products, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-cve"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.map((cve) => (
            <Card key={cve.id} className="p-6 hover-elevate" data-testid={`card-cve-${cve.id}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold font-mono text-primary" data-testid={`text-cve-id-${cve.id}`}>
                      {cve.id}
                    </h3>
                    <Badge className={`${getCVSSColor(cve.cvssScore)} font-semibold no-default-hover-elevate no-default-active-elevate`}>
                      {getCVSSLabel(cve.cvssScore)} {cve.cvssScore}
                    </Badge>
                  </div>
                  <h4 className="text-base font-semibold mb-2" data-testid={`text-cve-title-${cve.id}`}>
                    {cve.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3" data-testid={`text-cve-description-${cve.id}`}>
                    {cve.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Published: {cve.published}
                  </p>
                </div>
                <div>
                  <Button variant="ghost" size="sm" data-testid={`button-details-${cve.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
