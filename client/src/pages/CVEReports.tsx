import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Clock, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { cveReportsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function CVEReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cveReports, setCveReports] = useState<any[]>([]);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [selectedCve, setSelectedCve] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const { toast } = useToast();
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await cveReportsAPI.getReports(searchQuery);
        setCveReports(response.data);
      } catch (err) {
        setError("Failed to load CVE reports. Please try again later.");
        console.error("CVE reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [searchQuery]);

  const filteredReports = cveReports;

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

  const handleGenerateAnalysis = async (cve: any) => {
    // Clear any pending close timeout to prevent state reset
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setSelectedCve(cve);
    setAiAnalysisOpen(true);
    setAiAnalysis("");
    setGeneratingAnalysis(true);

    try {
      console.log("Generating AI analysis for CVE:", cve.id);
      console.log("Request payload:", {
        cveId: cve.id,
        cveData: {
          title: cve.title,
          description: cve.description,
          cvssScore: cve.cvssScore,
          published: cve.published
        }
      });

      const response = await cveReportsAPI.generateAnalysis(cve.id, {
        title: cve.title,
        description: cve.description,
        cvssScore: cve.cvssScore,
        published: cve.published
      });
      
      console.log("AI analysis response:", response.data);
      
      // Defensive check for missing analysis data
      if (response.data && response.data.analysis) {
        setAiAnalysis(response.data.analysis);
        
        toast({
          title: "Analysis Generated",
          description: "AI analysis has been generated successfully.",
        });
      } else {
        throw new Error("Analysis data is missing from response");
      }
    } catch (err: any) {
      console.error("AI analysis error:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to generate AI analysis. Please check your OpenAI API configuration.";
      
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setAiAnalysis(`Error: ${errorMessage}`);
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const handleCloseAnalysisModal = (open: boolean) => {
    setAiAnalysisOpen(open);
    
    if (open) {
      // Clear any pending close timeout if reopening
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    } else {
      // Only clear state when actually closing
      // Wait for modal animation to complete before clearing state
      closeTimeoutRef.current = setTimeout(() => {
        setSelectedCve(null);
        setAiAnalysis("");
        setGeneratingAnalysis(false);
        closeTimeoutRef.current = null;
      }, 300);
    }
  };

  const openNvdDetails = (cveId: string) => {
    window.open(`https://nvd.nist.gov/vuln/detail/${cveId}`, '_blank');
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
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
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openNvdDetails(cve.id)}
                    data-testid={`button-details-${cve.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleGenerateAnalysis(cve)}
                    data-testid={`button-ai-analysis-${cve.id}`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Analysis
                  </Button>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={aiAnalysisOpen} onOpenChange={handleCloseAnalysisModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Analysis: {selectedCve?.id}
            </DialogTitle>
            <DialogDescription>
              AI-powered threat intelligence analysis for {selectedCve?.title}
            </DialogDescription>
          </DialogHeader>
          
          {generatingAnalysis ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Analyzing CVE with AI...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedCve && (
                <Card className="p-4 bg-muted">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{selectedCve.id}</h4>
                    <Badge className={`${getCVSSColor(selectedCve.cvssScore)} font-semibold no-default-hover-elevate no-default-active-elevate`}>
                      {getCVSSLabel(selectedCve.cvssScore)} {selectedCve.cvssScore}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCve.description}</p>
                </Card>
              )}
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {aiAnalysis ? (
                  <MarkdownRenderer content={aiAnalysis} className="text-sm leading-relaxed" />
                ) : (
                  <p className="text-muted-foreground">No analysis available.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
