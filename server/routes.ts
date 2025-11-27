import type { Express } from "express";
import { createServer, type Server } from "http";
import { ThreatIntelligenceFetcher } from "./threatIntelFetcher";
import { analyzeThreatWithAI, chatWithAssistant, type ChatMessage } from "./openaiService";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { authenticateToken, generateToken, type AuthRequest } from "./middleware/auth";
import { insertUserSchema } from "@shared/schema";

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
  sourceStatus: Record<string, { success: boolean; count: number; error?: string; lastFetch?: string }>;
  settings?: any;
}

// Default settings when no settings have been saved
const defaultSettings = {
  general: {
    autoRefreshInterval: "5 minutes",
    timezone: "UTC",
    itemsPerPage: "20"
  }
};

const cachedData: CachedData = {
  lastUpdated: null,
  data: null,
  threatFeeds: [],
  cveReports: [],
  dashboardStats: {
    totalIOCs: { value: 0, change: "Initializing..." },
    newFeeds: { value: 0, change: "Starting up" },
    criticalCVEs: { value: 0, change: "Loading..." },
    phishingDomains: { value: 0, change: "Fetching..." }
  },
  recentThreats: [],
  sourceStatus: {},
  settings: null
};

// Background fetcher function with optional fast mode for manual refresh
async function backgroundFetcher(options: { fastMode?: boolean } = {}) {
  try {
    const { fastMode = false } = options;
    const modeLabel = fastMode ? 'fast' : 'full';
    console.log(`[${new Date().toISOString()}] Starting ${modeLabel} threat intelligence fetch...`);
    
    // Use fast mode for manual refresh (skips VirusTotal which has 15s delay per indicator)
    const data = await fetcher.fetchAllFeeds({ skipVirusTotal: fastMode, fastMode });
    cachedData.lastUpdated = new Date().toISOString();
    cachedData.data = data;
    
    // Process and transform data for frontend
    processThreatData(data);
    
    console.log(`[${new Date().toISOString()}] ${modeLabel} fetch completed successfully`);
    console.log(`[${new Date().toISOString()}] Fetched data from ${Object.keys(data.sources).length} sources`);
    
    // Log each source status
    for (const [sourceName, sourceData] of Object.entries(data.sources)) {
      const sd = sourceData as any;
      if (sd.success) {
        const skippedLabel = sd.skipped ? ' (skipped for speed)' : '';
        console.log(`  ✓ ${sourceName}: ${sd.count || 0} items${skippedLabel}`);
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
  const sourceStatus: Record<string, { success: boolean; count: number; error?: string; lastFetch: string }> = {};
  const timestamp = new Date().toISOString();
  
  // Track status for all sources
  for (const [sourceName, sourceData] of Object.entries(data.sources)) {
    const sd = sourceData as any;
    sourceStatus[sourceName] = {
      success: sd.success,
      count: sd.count || 0,
      error: sd.error,
      lastFetch: timestamp
    };
  }
  
  // Process each successful source
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
            severity: 'High',
            cvssScore: 7.5
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
          severity: 'Critical',
          cvssScore: 9.8
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
          severity: 'High',
          cvssScore: 7.5
        });
        totalIOCs++;
      });
    }
    
    // Process Abuse.ch IOCs
    if (sourceName === 'Abuse.ch IOCs') {
      sd.data.forEach((ioc: any, index: number) => {
        const isSevereCritical = ioc.confidence_level > 75;
        threatFeeds.push({
          id: `ioc-${index}`,
          date: ioc.first_seen,
          type: ioc.ioc_type,
          value: ioc.ioc_value,
          source: 'Abuse.ch ThreatFox',
          threatType: ioc.threat_type || 'IOC',
          severity: isSevereCritical ? 'Critical' : 'High',
          cvssScore: isSevereCritical ? 9.0 : 7.5
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
          const isCritical = maliciousCount > 5;
          threatFeeds.push({
            id: `vt-${index}`,
            date: new Date().toLocaleString(),
            type: type,
            value: indicator,
            source: 'VirusTotal',
            threatType: `Malicious (${maliciousCount} detections)`,
            severity: isCritical ? 'Critical' : 'High',
            cvssScore: isCritical ? 9.5 : 7.5
          });
          totalIOCs++;
        }
      });
    }
  }
  
  // Calculate active and failed sources
  const activeSources = Object.values(sourceStatus).filter(s => s.success).length;
  const totalSources = Object.keys(sourceStatus).length;
  const failedSources = Object.values(sourceStatus).filter(s => !s.success);
  
  // Deduplicate CVE reports by ID (keep first occurrence)
  const uniqueCVEs = new Map();
  cveReports.forEach(cve => {
    if (!uniqueCVEs.has(cve.id)) {
      uniqueCVEs.set(cve.id, cve);
    }
  });
  const deduplicatedCVEs = Array.from(uniqueCVEs.values());
  
  // Update cached data with ONLY real-time data
  cachedData.threatFeeds = threatFeeds;
  cachedData.cveReports = deduplicatedCVEs;
  cachedData.recentThreats = recentThreats;
  cachedData.sourceStatus = sourceStatus;
  cachedData.dashboardStats = {
    totalIOCs: { 
      value: totalIOCs, 
      change: totalIOCs > 0 ? `Updated ${new Date().toLocaleTimeString()}` : "No IOC data yet" 
    },
    newFeeds: { 
      value: activeSources, 
      change: failedSources.length > 0 ? `${failedSources.length} source(s) offline` : `${totalSources} sources active`
    },
    criticalCVEs: { 
      value: criticalCVEs, 
      change: criticalCVEs > 0 ? "From real-time feeds" : "No CVE data yet" 
    },
    phishingDomains: { 
      value: threatFeeds.filter(t => t.threatType?.toLowerCase().includes('phish')).length, 
      change: "Real-time detection" 
    }
  };
}

// Start background fetcher immediately and then every hour
backgroundFetcher();
setInterval(backgroundFetcher, 3600000); // 1 hour

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error });
      }

      const { username, email, password } = result.data;

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, email, password: hashedPassword });

      const token = generateToken(user.id, user.username);

      res.status(201).json({
        message: "User created successfully",
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Server error during signup" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ error: "Email/username and password are required" });
      }

      const user = await storage.getUserByEmailOrUsername(emailOrUsername);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id, user.username);

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error during login" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error: any) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logout successful" });
  });

  // Dashboard endpoints
  app.get("/api/dashboard/stats", (req, res) => {
    res.json(cachedData.dashboardStats);
  });

  app.get("/api/dashboard/recent-threats", (req, res) => {
    res.json(cachedData.recentThreats);
  });

  app.get("/api/dashboard/threat-trends", (req, res) => {
    // Generate threat trends from real data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayCounts = new Map<string, number>();
    
    cachedData.threatFeeds.forEach(threat => {
      try {
        const date = new Date(threat.date);
        if (!isNaN(date.getTime())) {
          const dayName = days[date.getDay()];
          dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    const result = days.map(day => ({
      day,
      threats: dayCounts.get(day) || 0
    }));
    
    res.json(result);
  });

  // Source status endpoint - shows which feeds are working/failing
  app.get("/api/dashboard/source-status", (req, res) => {
    res.json({
      sources: cachedData.sourceStatus,
      lastUpdated: cachedData.lastUpdated,
      summary: {
        total: Object.keys(cachedData.sourceStatus).length,
        active: Object.values(cachedData.sourceStatus).filter(s => s.success).length,
        failed: Object.values(cachedData.sourceStatus).filter(s => !s.success).length
      }
    });
  });

  // Threat Feeds endpoint with filtering and pagination
  app.get("/api/threat-feeds", (req, res) => {
    const { search = "", type = "all", severity = "all", page = "1", itemsPerPage: itemsPerPageParam } = req.query;
    const pageNum = parseInt(page as string);
    
    // Use itemsPerPage from query parameter, or from saved settings, or default to 20
    let itemsPerPage = 20; // Default value
    if (itemsPerPageParam) {
      itemsPerPage = parseInt(itemsPerPageParam as string);
    } else if (cachedData.settings?.general?.itemsPerPage) {
      itemsPerPage = parseInt(cachedData.settings.general.itemsPerPage);
    }

    // Use only real data from threat feeds
    let filtered = cachedData.threatFeeds.filter((item: any) => {
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
    
    // Use only real data from CVE reports
    const filtered = cachedData.cveReports.filter((cve: any) => {
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

  // Generate AI analysis for a specific CVE
  app.post("/api/cve-reports/analyze", async (req, res) => {
    try {
      const { cveId, cveData } = req.body;
      
      if (!cveId || !cveData) {
        return res.status(400).json({ error: "CVE ID and data are required" });
      }

      const prompt = `Analyze the following CVE vulnerability and provide a comprehensive threat intelligence report:

CVE ID: ${cveId}
Title: ${cveData.title}
CVSS Score: ${cveData.cvssScore}
Published: ${cveData.published}
Description: ${cveData.description}

Please provide:
1. **Severity Assessment**: Analyze the threat level based on the CVSS score and description
2. **Potential Impact**: What systems or applications could be affected?
3. **Attack Vectors**: How might attackers exploit this vulnerability?
4. **Recommended Actions**: What should security teams do to mitigate this threat?
5. **Priority Level**: Should this be addressed immediately, or can it wait?

Format the response in a clear, professional manner suitable for a security operations team.`;

      const context = {
        threatFeeds: cachedData.threatFeeds.slice(0, 5),
        cveReports: cachedData.cveReports.slice(0, 5),
        dashboardStats: cachedData.dashboardStats,
        sourceStatus: cachedData.sourceStatus
      };

      const analysis = await analyzeThreatWithAI(prompt, context);

      res.json({ 
        success: true, 
        analysis,
        cveId
      });
    } catch (error: any) {
      console.error("CVE analysis error:", error.message);
      res.status(500).json({ 
        error: error.message || "Failed to generate CVE analysis" 
      });
    }
  });

  // Analytics endpoints with real data preprocessing
  app.get("/api/analytics/stats", (req, res) => {
    const totalThreats = cachedData.threatFeeds.length;
    const avgDailyThreats = totalThreats > 0 ? Math.round(totalThreats / 7) : 0;
    const activeSources = Object.values(cachedData.sourceStatus).filter(s => s.success).length;
    const totalSources = Object.keys(cachedData.sourceStatus).length;
    const criticalAlerts = cachedData.threatFeeds.filter(t => t.severity === 'Critical').length;
    
    // Calculate detection rate from source reliability
    const detectionRate = totalSources > 0 
      ? Math.round((activeSources / totalSources) * 100) 
      : 0;
    
    res.json({
      avgDailyThreats: { 
        value: avgDailyThreats, 
        change: totalThreats > 0 ? `Based on ${totalThreats} total threats` : "No threats yet"
      },
      activeSources: { 
        value: activeSources, 
        change: `${totalSources} total sources` 
      },
      criticalAlerts: { 
        value: criticalAlerts, 
        change: totalThreats > 0 ? `${Math.round((criticalAlerts / totalThreats) * 100)}% of total threats` : "No threats yet"
      },
      detectionRate: { 
        value: `${detectionRate}%`, 
        change: `${activeSources} of ${totalSources} sources online` 
      }
    });
  });

  app.get("/api/analytics/threats-per-day", (req, res) => {
    // Generate real data from threat feeds
    const threatsPerDay: { date: Date; dateStr: string; threats: number }[] = [];
    const dateCounts = new Map<string, number>();
    
    cachedData.threatFeeds.forEach(threat => {
      try {
        const date = new Date(threat.date);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateCounts.set(dateStr, (dateCounts.get(dateStr) || 0) + 1);
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Convert to array and sort by date
    dateCounts.forEach((threats, dateStr) => {
      try {
        const date = new Date(dateStr + ', 2024');
        threatsPerDay.push({ date, dateStr, threats });
      } catch (e) {
        // Skip invalid dates
      }
    });

    // Sort chronologically and get last 8 days
    const result = threatsPerDay
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-8)
      .map(({ dateStr, threats }) => ({ date: dateStr, threats }));
    
    res.json(result);
  });

  app.get("/api/analytics/threat-type-distribution", (req, res) => {
    // Count threat types from real data
    const typeCount: { [key: string]: number } = {};
    
    cachedData.threatFeeds.forEach(threat => {
      const type = threat.type || 'Unknown';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
    const result = Object.entries(typeCount)
      .map(([name, value], index) => ({ 
        name, 
        value, 
        color: colors[index % colors.length] 
      }))
      .sort((a, b) => b.value - a.value);
    
    res.json(result);
  });

  app.get("/api/analytics/active-sources", (req, res) => {
    // Count threats per source from real data
    const sourceCount: { [key: string]: number } = {};
    
    cachedData.threatFeeds.forEach(threat => {
      const source = threat.source || 'Unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });

    const result = Object.entries(sourceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    
    res.json(result);
  });

  app.get("/api/analytics/severity-trends", (req, res) => {
    // Generate weekly severity trends
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const severityCounts = {
      Critical: cachedData.threatFeeds.filter(t => t.severity === 'Critical').length,
      High: cachedData.threatFeeds.filter(t => t.severity === 'High').length,
      Medium: cachedData.threatFeeds.filter(t => t.severity === 'Medium').length,
      Low: cachedData.threatFeeds.filter(t => t.severity === 'Low').length
    };

    // Distribute counts across weeks with some variation
    const result = weeks.map((week, index) => {
      const factor = 0.8 + (index * 0.1);
      return {
        week,
        Critical: Math.round(severityCounts.Critical / 4 * factor),
        High: Math.round(severityCounts.High / 4 * factor),
        Medium: Math.round(severityCounts.Medium / 4 * factor),
        Low: Math.round(severityCounts.Low / 4 * factor)
      };
    });
    
    res.json(result);
  });

  // Settings endpoints
  app.get("/api/settings/general", (req, res) => {
    // Return saved settings if available, otherwise return defaults
    if (cachedData.settings?.general) {
      res.json(cachedData.settings.general);
    } else {
      res.json(defaultSettings.general);
    }
  });

  app.get("/api/settings/sources", (req, res) => {
    // Generate source settings from real source status
    const sources = Object.entries(cachedData.sourceStatus).map(([name, status], index) => ({
      id: index + 1,
      name,
      lastSync: status.lastFetch ? new Date(status.lastFetch).toLocaleTimeString() : 'N/A',
      status: status.success ? 'active' : 'inactive'
    }));
    res.json(sources);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    console.log("Settings saved:", settings);
    
    // Store settings in cached data so they persist across requests
    cachedData.settings = settings;
    
    res.json({ success: true, message: "Settings saved successfully" });
  });

  // Threat intelligence endpoints
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
      console.log(`[${new Date().toISOString()}] Manual refresh triggered (fast mode enabled)`);
      // Use fast mode for manual refresh - skips VirusTotal enrichment which takes 15s per indicator
      // This significantly reduces refresh time from ~1-2 minutes to ~10-15 seconds
      await backgroundFetcher({ fastMode: true });
      res.json({
        success: true,
        message: "Threat intelligence data refreshed (fast mode)",
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

  // Chat Assistant endpoints
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { message, conversationHistory } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: "Message is required"
        });
      }

      // Prepare context for the AI
      const context = {
        threatFeeds: cachedData.threatFeeds,
        cveReports: cachedData.cveReports,
        dashboardStats: cachedData.dashboardStats,
        sourceStatus: cachedData.sourceStatus
      };

      let response: string;

      // If there's conversation history, use chat mode
      if (conversationHistory && conversationHistory.length > 0) {
        const messages: ChatMessage[] = conversationHistory.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
        messages.push({ role: 'user', content: message });
        
        response = await chatWithAssistant(messages, context);
      } else {
        // Single query mode
        response = await analyzeThreatWithAI(message, context);
      }

      res.json({
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Chat error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post("/api/chat/analyze-ioc", async (req, res) => {
    try {
      const { ioc } = req.body;

      if (!ioc) {
        return res.status(400).json({
          success: false,
          error: "IOC is required"
        });
      }

      // Search for the IOC in our threat feeds
      const matches = cachedData.threatFeeds.filter(threat => 
        threat.value.toLowerCase().includes(ioc.toLowerCase())
      );

      const context = {
        threatFeeds: cachedData.threatFeeds,
        cveReports: cachedData.cveReports,
        dashboardStats: cachedData.dashboardStats,
        sourceStatus: cachedData.sourceStatus
      };

      const query = `Analyze this IOC: ${ioc}. I found ${matches.length} matches in our threat feeds. ${
        matches.length > 0 ? `Here are the matches: ${JSON.stringify(matches.slice(0, 5))}` : 'No matches found in current feeds.'
      } Provide a security analysis and recommendations.`;

      const response = await analyzeThreatWithAI(query, context);

      res.json({
        success: true,
        response: response,
        matches: matches.slice(0, 10),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("IOC analysis error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Search endpoint - search across threat feeds and CVEs
  app.get("/api/search", (req, res) => {
    const { q = "" } = req.query;
    const query = (q as string).toLowerCase();

    if (!query) {
      return res.json({ threatFeeds: [], cveReports: [] });
    }

    // Search threat feeds from real data
    const threatFeedResults = cachedData.threatFeeds.filter((item: any) => 
      item.value.toLowerCase().includes(query) ||
      item.source.toLowerCase().includes(query) ||
      item.threatType.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    ).slice(0, 10);

    // Search CVE reports from real data
    const cveResults = cachedData.cveReports.filter((cve: any) => 
      cve.id.toLowerCase().includes(query) ||
      cve.title.toLowerCase().includes(query) ||
      cve.description.toLowerCase().includes(query)
    ).slice(0, 10);

    res.json({
      threatFeeds: threatFeedResults,
      cveReports: cveResults,
      totalResults: threatFeedResults.length + cveResults.length
    });
  });

  // Export endpoint - export threat feeds as CSV
  app.get("/api/export/threat-feeds", (req, res) => {
    const { search = "", type = "all", severity = "all", timezone = "UTC" } = req.query;

    // Use only real data from threat feeds
    let filtered = cachedData.threatFeeds.filter((item: any) => {
      const matchesSearch = !search || 
        item.value.toLowerCase().includes((search as string).toLowerCase()) ||
        item.source.toLowerCase().includes((search as string).toLowerCase());
      const matchesType = type === "all" || item.type === type;
      const matchesSeverity = severity === "all" || item.severity === severity;
      return matchesSearch && matchesType && matchesSeverity;
    });

    // Helper function to escape CSV values properly
    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      // If contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Generate CSV with proper escaping (including CVSS Score column)
    const headers = ["Date", "IOC Type", "IOC Value", "Source", "Threat Type", "Severity", "CVSS Score"];
    const csvRows = [headers.join(",")];

    filtered.forEach((item: any) => {
      const row = [
        escapeCSV(item.date || ""),
        escapeCSV(item.type || ""),
        escapeCSV(item.value || ""),
        escapeCSV(item.source || ""),
        escapeCSV(item.threatType || ""),
        escapeCSV(item.severity || ""),
        escapeCSV(item.cvssScore !== undefined && item.cvssScore !== null ? String(item.cvssScore) : "N/A")
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="threat-feeds-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  });

  const httpServer = createServer(app);

  return httpServer;
}
