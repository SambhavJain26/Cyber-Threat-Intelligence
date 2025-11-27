import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentThreats: () => api.get("/dashboard/recent-threats"),
  getThreatTrends: () => api.get("/dashboard/threat-trends")
};

// Threat Feeds API
export const threatFeedsAPI = {
  getFeeds: (params: { search?: string; type?: string; severity?: string; page?: number; itemsPerPage?: string }) => 
    api.get("/threat-feeds", { params })
};

// CVE Reports API
export const cveReportsAPI = {
  getReports: (search?: string) => 
    api.get("/cve-reports", { params: { search } }),
  generateAnalysis: (cveId: string, cveData: any) =>
    api.post("/cve-reports/analyze", { cveId, cveData })
};

// Analytics API
export const analyticsAPI = {
  getStats: () => api.get("/analytics/stats"),
  getThreatsPerDay: () => api.get("/analytics/threats-per-day"),
  getThreatTypeDistribution: () => api.get("/analytics/threat-type-distribution"),
  getActiveSources: () => api.get("/analytics/active-sources"),
  getSeverityTrends: () => api.get("/analytics/severity-trends")
};

// Settings API
export const settingsAPI = {
  getGeneral: () => api.get("/settings/general"),
  getSources: () => api.get("/settings/sources"),
  saveSettings: (settings: any) => api.post("/settings", settings)
};

// Search API
export const searchAPI = {
  search: (query: string) => api.get("/search", { params: { q: query } })
};

// Export API
export const exportAPI = {
  exportThreatFeeds: (params?: { search?: string; type?: string; severity?: string }) => 
    api.get("/export/threat-feeds", { params, responseType: 'blob' })
};

// Threat Intelligence API
export const threatIntelAPI = {
  refresh: () => api.post("/threat-intel/refresh"),
  getStatus: () => api.get("/threat-intel/status")
};

// Chat Assistant API
export const chatAPI = {
  sendMessage: (message: string, conversationHistory?: any[]) => 
    api.post("/chat/message", { message, conversationHistory }),
  analyzeIOC: (ioc: string) => 
    api.post("/chat/analyze-ioc", { ioc }),
  getSessions: () => 
    api.get("/chat/sessions"),
  getSession: (sessionId: string) => 
    api.get(`/chat/sessions/${sessionId}`),
  createSession: (title?: string) => 
    api.post("/chat/sessions", { title }),
  updateSession: (sessionId: string, messages: any[], title?: string) => 
    api.put(`/chat/sessions/${sessionId}`, { messages, title }),
  deleteSession: (sessionId: string) => 
    api.delete(`/chat/sessions/${sessionId}`)
};

export default api;
