import type { Express } from "express";
import { createServer, type Server } from "http";
import * as mockData from "./mockData.js";
import { ThreatIntelligenceFetcher } from "./threatIntelFetcher";

// Initialize threat intelligence fetcher
const fetcher = new ThreatIntelligenceFetcher();

// Cache for threat intelligence data
interface CachedData {
  lastUpdated: string | null;
  data: any;
  threatFeeds: any[];
  cveReports: any[];
  dashboardStats: any;
  recentThreats: any[];
}

const cachedData: CachedData = {
  lastUpdated: null,
  data: null,
  threatFeeds: [],
  cveReports: [],
  dashboardStats: mockData.dashboardStats,
  recentThreats: mockData.recentThreats
};

// Background fetcher function
async function backgroundFetcher() {
  try {
    console.log(`[${new Date().toISOString()}] Starting background threat intelligence fetch...`);
    const data = await fetcher.fetchAllFeeds();
    cachedData.lastUpdated = new Date().toISOString();
    cachedData.data = data;
    
    // Process and transform data for frontend
    processThreatData(data);
    
    console.log(`[${new Date().toISOString()}] Background fetch completed successfully`);
    console.log(`[${new Date().toISOString()}] Fetched data from ${Object.keys(data.sources).length} sources`);
    
    // Log each source status
    for (const [sourceName, sourceData] of Object.entries(data.sources)) {
      const sd = sourceData as any;
      if (sd.success) {
        console.log(`  ✓ ${sourceName}: ${sd.count || 0} items`);
      } else {
        console.log(`  ✗ ${sourceName}: ${sd.error || 'Unknown error'}`);
      }
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Background fetch error:`, error.message);
  }
}

// Process fetched data into frontend-friendly format
function processThreatData(data: any) {
  const threatFeeds: any[] = [];
  const cveReports: any[] = [];
  let totalIOCs = 0;
  let criticalCVEs = 0;
  const recentThreats: any[] = [];
  
  // Process each source
  for (const [sourceName, sourceData] of Object.entries(data.sources)) {
    const sd = sourceData as any;
    if (!sd.success || !sd.data) continue;
    
    // Process OTX Pulses
    if (sourceName === 'AlienVault OTX') {
      sd.data.forEach((pulse: any, index: number) => {
        pulse.indicators?.forEach((indicator: any) => {
          threatFeeds.push({
            id: `otx-${index}-${threatFeeds.length}`,
            date: new Date(pulse.created).toLocaleString(),
            type: indicator.type,
            value: indicator.indicator,
            source: 'AlienVault OTX',
            threatType: pulse.name,
            severity: 'High'
          });
          totalIOCs++;
          
          if (recentThreats.length < 5) {
            recentThreats.push({
              id: recentThreats.length + 1,
              ioc: indicator.indicator,
              type: indicator.type,
              severity: 'High',
              time: new Date(pulse.created).toLocaleTimeString()
            });
          }
        });
      });
    }
    
    // Process Abuse.ch Malware
    if (sourceName === 'Abuse.ch Malware') {
      sd.data.forEach((malware: any, index: number) => {
        threatFeeds.push({
          id: `malware-${index}`,
          date: malware.first_seen,
          type: 'File Hash',
          value: malware.sha256,
          source: 'Abuse.ch MalwareBazaar',
          threatType: malware.signature || 'Malware',
          severity: 'Critical'
        });
        totalIOCs++;
      });
    }
    
    // Process Abuse.ch URLs
    if (sourceName === 'Abuse.ch URLs') {
      sd.data.forEach((urlData: any, index: number) => {
        threatFeeds.push({
          id: `url-${index}`,
          date: urlData.dateadded,
          type: 'URL',
          value: urlData.url,
          source: 'Abuse.ch URLhaus',
          threatType: urlData.threat || 'Malicious URL',
          severity: 'High'
        });
        totalIOCs++;
      });
    }
    
    // Process Abuse.ch IOCs
    if (sourceName === 'Abuse.ch IOCs') {
      sd.data.forEach((ioc: any, index: number) => {
        threatFeeds.push({
          id: `ioc-${index}`,
          date: ioc.first_seen,
          type: ioc.ioc_type,
          value: ioc.ioc_value,
          source: 'Abuse.ch ThreatFox',
          threatType: ioc.threat_type || 'IOC',
          severity: ioc.confidence_level > 75 ? 'Critical' : 'High'
        });
        totalIOCs++;
      });
    }
    
    // Process NVD CVEs
    if (sourceName === 'NVD CVEs') {
      sd.data.forEach((cve: any) => {
        const cvssScore = cve.cvss_score || 0;
        if (cvssScore >= 9.0) criticalCVEs++;
        
        cveReports.push({
          id: cve.cve_id,
          cvssScore: cvssScore,
          title: cve.cve_id,
          description: cve.description,
          published: new Date(cve.published).toLocaleDateString()
        });
      });
    }
    
    // Process CISA KEV
    if (sourceName === 'CISA KEV') {
      sd.data.forEach((vuln: any) => {
        criticalCVEs++;
        cveReports.push({
          id: vuln.cve_id,
          cvssScore: 9.0,
          title: vuln.vulnerability_name,
          description: vuln.short_description,
          published: vuln.date_added
        });
      });
    }
    
    // Process VirusTotal
    if (sourceName === 'VirusTotal') {
      sd.data.forEach((vtData: any, index: number) => {
        const maliciousCount = vtData.malicious_count || 0;
        const indicator = vtData.ip_address || vtData.domain;
        const type = vtData.ip_address ? 'IP Address' : 'Domain';
        
        if (maliciousCount > 0) {
          threatFeeds.push({
            id: `vt-${index}`,
            date: new Date().toLocaleString(),
            type: type,
            value: indicator,
            source: 'VirusTotal',
            threatType: `Malicious (${maliciousCount} detections)`,
            severity: maliciousCount > 5 ? 'Critical' : 'High'
          });
          totalIOCs++;
        }
      });
    }
  }
  
  // Update cached data
  cachedData.threatFeeds = threatFeeds;
  cachedData.cveReports = cveReports;
  cachedData.recentThreats = recentThreats.length > 0 ? recentThreats : mockData.recentThreats;
  cachedData.dashboardStats = {
    totalIOCs: { value: totalIOCs, change: `Updated ${new Date().toLocaleTimeString()}` },
    newFeeds: { value: Object.keys(data.sources).filter((k: string) => (data.sources as any)[k].success).length, change: "Active sources" },
    criticalCVEs: { value: criticalCVEs, change: "Last 7 days" },
    phishingDomains: { value: threatFeeds.filter(t => t.threatType?.toLowerCase().includes('phish')).length, change: "Detected" }
  };
}

// Start background fetcher immediately and then every hour
backgroundFetcher();
setInterval(backgroundFetcher, 3600000); // 1 hour

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard endpoints
  app.get("/api/dashboard/stats", (req, res) => {
    res.json(cachedData.dashboardStats);
  });

  app.get("/api/dashboard/recent-threats", (req, res) => {
    res.json(cachedData.recentThreats);
  });

  app.get("/api/dashboard/threat-trends", (req, res) => {
    res.json(mockData.threatTrends);
  });

  // Threat Feeds endpoint with filtering and pagination
  app.get("/api/threat-feeds", (req, res) => {
    const { search = "", type = "all", severity = "all", page = "1" } = req.query;
    const pageNum = parseInt(page as string);
    const itemsPerPage = 7;

    // Use real data if available, otherwise fallback to mock data
    const dataSource = cachedData.threatFeeds.length > 0 ? cachedData.threatFeeds : mockData.iocDatabase;

    let filtered = dataSource.filter((item: any) => {
      const matchesSearch = !search || 
        item.value.toLowerCase().includes((search as string).toLowerCase()) ||
        item.source.toLowerCase().includes((search as string).toLowerCase());
      const matchesType = type === "all" || item.type === type;
      const matchesSeverity = severity === "all" || item.severity === severity;
      return matchesSearch && matchesType && matchesSeverity;
    });

    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filtered.slice(
      (pageNum - 1) * itemsPerPage,
      pageNum * itemsPerPage
    );

    res.json({
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage: pageNum
    });
  });

  // CVE Reports endpoint with search
  app.get("/api/cve-reports", (req, res) => {
    const { search = "" } = req.query;
    
    // Use real data if available, otherwise fallback to mock data
    const dataSource = cachedData.cveReports.length > 0 ? cachedData.cveReports : mockData.cveReports;
    
    const filtered = dataSource.filter((cve: any) => {
      if (!search) return true;
      const searchLower = (search as string).toLowerCase();
      return (
        cve.id.toLowerCase().includes(searchLower) ||
        cve.title.toLowerCase().includes(searchLower) ||
        cve.description.toLowerCase().includes(searchLower)
      );
    });

    res.json(filtered);
  });

  // Analytics endpoints
  app.get("/api/analytics/stats", (req, res) => {
    res.json(mockData.analyticsStats);
  });

  app.get("/api/analytics/threats-per-day", (req, res) => {
    res.json(mockData.threatsPerDay);
  });

  app.get("/api/analytics/threat-type-distribution", (req, res) => {
    res.json(mockData.threatTypeDistribution);
  });

  app.get("/api/analytics/active-sources", (req, res) => {
    res.json(mockData.activeSources);
  });

  app.get("/api/analytics/severity-trends", (req, res) => {
    res.json(mockData.severityTrends);
  });

  // Settings endpoints
  app.get("/api/settings/general", (req, res) => {
    res.json(mockData.settingsGeneral);
  });

  app.get("/api/settings/sources", (req, res) => {
    res.json(mockData.settingsSources);
  });

  // New threat intelligence endpoints
  app.get("/api/threat-intel/status", (req, res) => {
    res.json({
      lastUpdated: cachedData.lastUpdated,
      threatFeedsCount: cachedData.threatFeeds.length,
      cveReportsCount: cachedData.cveReports.length,
      sources: cachedData.data?.sources || {}
    });
  });

  app.post("/api/threat-intel/refresh", async (req, res) => {
    try {
      console.log(`[${new Date().toISOString()}] Manual refresh triggered`);
      await backgroundFetcher();
      res.json({
        success: true,
        message: "Threat intelligence data refreshed",
        lastUpdated: cachedData.lastUpdated
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get("/api/threat-intel/all", async (req, res) => {
    if (!cachedData.data) {
      await backgroundFetcher();
    }
    res.json({
      success: true,
      lastUpdated: cachedData.lastUpdated,
      data: cachedData.data
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
