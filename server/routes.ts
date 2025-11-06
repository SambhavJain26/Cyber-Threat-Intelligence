import type { Express } from "express";
import { createServer, type Server } from "http";
const mockData = require("./mockData");

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard endpoints
  app.get("/api/dashboard/stats", (req, res) => {
    res.json(mockData.dashboardStats);
  });

  app.get("/api/dashboard/recent-threats", (req, res) => {
    res.json(mockData.recentThreats);
  });

  app.get("/api/dashboard/threat-trends", (req, res) => {
    res.json(mockData.threatTrends);
  });

  // Threat Feeds endpoint with filtering and pagination
  app.get("/api/threat-feeds", (req, res) => {
    const { search = "", type = "all", severity = "all", page = "1" } = req.query;
    const pageNum = parseInt(page as string);
    const itemsPerPage = 7;

    let filtered = mockData.iocDatabase.filter((item: any) => {
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
    
    const filtered = mockData.cveReports.filter((cve: any) => {
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

  const httpServer = createServer(app);

  return httpServer;
}
