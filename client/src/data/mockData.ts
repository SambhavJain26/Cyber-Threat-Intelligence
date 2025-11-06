// Mock data for CTI Aggregator
// todo: remove mock functionality - replace with API calls

export const dashboardStats = {
  totalIOCs: { value: 12847, change: "+247 today" },
  newFeeds: { value: 8, change: "Last 24h" },
  criticalCVEs: { value: 23, change: "This week" },
  phishingDomains: { value: 156, change: "+12 today" }
};

export const recentThreats = [
  { id: 1, ioc: "malicious-site.com", type: "Domain", severity: "Critical", time: "2:32:00 PM" },
  { id: 2, ioc: "192.168.1.100", type: "IP Address", severity: "High", time: "1:46:00 PM" },
  { id: 3, ioc: "evil.exe", type: "File Hash", severity: "Critical", time: "12:16:00 PM" },
  { id: 4, ioc: "phish-bank.org", type: "Domain", severity: "Medium", time: "11:22:00 AM" },
  { id: 5, ioc: "trojan.zip", type: "File Hash", severity: "High", time: "10:15:00 AM" }
];

export const threatTrends = [
  { day: "Mon", threats: 45 },
  { day: "Tue", threats: 52 },
  { day: "Wed", threats: 48 },
  { day: "Thu", threats: 61 },
  { day: "Fri", threats: 73 },
  { day: "Sat", threats: 38 },
  { day: "Sun", threats: 51 }
];

export const iocDatabase = [
  { id: 1, date: "1/15/2024 2:32:15 PM", type: "Domain", value: "malicious-banking-site.com", source: "VirusTotal", threatType: "Phishing", severity: "Critical" },
  { id: 2, date: "1/15/2024 2:28:45 PM", type: "IP Address", value: "192.168.100.50", source: "AlienVault OTX", threatType: "C2 Server", severity: "High" },
  { id: 3, date: "1/15/2024 2:25:12 PM", type: "File Hash", value: "a1b2c3d4e5f67890123456789abcdef", source: "Hybrid Analysis", threatType: "Malware", severity: "Critical" },
  { id: 4, date: "1/15/2024 2:22:30 PM", type: "Domain", value: "fake-crypto-exchange.org", source: "PhishTank", threatType: "Phishing", severity: "High" },
  { id: 5, date: "1/15/2024 2:16:05 PM", type: "URL", value: "http://evil-download.com/trojan.exe", source: "URLVoid", threatType: "Malware Distribution", severity: "Critical" },
  { id: 6, date: "1/15/2024 2:15:02 PM", type: "IP Address", value: "10.0.0.150", source: "Emerging Threats", threatType: "Exploit", severity: "Medium" },
  { id: 7, date: "1/15/2024 2:12:08 PM", type: "Email", value: "noreply@fake-bank.com", source: "SpamHaus", threatType: "Phishing", severity: "High" },
  { id: 8, date: "1/15/2024 2:08:55 PM", type: "File Hash", value: "f9e8d7c6b5a4321098765432109876dc", source: "Malware Bazaar", threatType: "Ransomware", severity: "Critical" }
];

export const cveReports = [
  {
    id: "CVE-2024-0001",
    cvssScore: 9.8,
    title: "Critical Remote Code Execution in Apache HTTP Server",
    description: "A critical vulnerability in Apache HTTP Server allows remote attackers to execute arbitrary code through malformed HTTP requests. This affects versions 2.4.0 through 2.4.58.",
    published: "1/15/2024"
  },
  {
    id: "CVE-2024-0002",
    cvssScore: 7.5,
    title: "SQL Injection in WordPress Core",
    description: "A SQL injection vulnerability in WordPress Core allows authenticated users to extract sensitive database information.",
    published: "1/14/2024"
  },
  {
    id: "CVE-2024-0003",
    cvssScore: 8.1,
    title: "Privilege Escalation in Microsoft Windows",
    description: "Local privilege escalation vulnerability in Windows allows standard users to gain SYSTEM privileges through registry manipulation.",
    published: "1/13/2024"
  },
  {
    id: "CVE-2024-0004",
    cvssScore: 6.8,
    title: "Cross-Site Scripting in React Router",
    description: "Stored XSS vulnerability in React Router DOM allows attackers to inject malicious scripts through URL parameters.",
    published: "1/12/2024"
  }
];

export const analyticsStats = {
  avgDailyThreats: { value: 54.2, change: "+12.5% from last week" },
  activeSources: { value: 7, change: "Threat intel feeds" },
  criticalAlerts: { value: 89, change: "+24 today" },
  detectionRate: { value: "94.7%", change: "+2.1% this month" }
};

export const threatsPerDay = [
  { date: "Jan 8", threats: 45 },
  { date: "Jan 9", threats: 52 },
  { date: "Jan 10", threats: 38 },
  { date: "Jan 11", threats: 65 },
  { date: "Jan 12", threats: 71 },
  { date: "Jan 13", threats: 28 },
  { date: "Jan 14", threats: 51 },
  { date: "Jan 15", threats: 78 }
];

export const threatTypeDistribution = [
  { name: "Phishing", value: 35, color: "#ef4444" },
  { name: "Malware", value: 28, color: "#f59e0b" },
  { name: "C2 Server", value: 15, color: "#a855f7" },
  { name: "Botnet", value: 12, color: "#3b82f6" },
  { name: "Ransomware", value: 10, color: "#ec4899" }
];

export const activeSources = [
  { name: "SpamHaus", count: 145 },
  { name: "URLVoid", count: 132 },
  { name: "Malware Bazaar", count: 118 },
  { name: "Hybrid Analysis", count: 98 }
];

export const severityTrends = [
  { week: "Week 1", Critical: 25, High: 40, Medium: 60, Low: 15 },
  { week: "Week 2", Critical: 30, High: 45, Medium: 55, Low: 20 },
  { week: "Week 3", Critical: 28, High: 50, Medium: 58, Low: 18 },
  { week: "Week 4", Critical: 35, High: 55, Medium: 65, Low: 22 }
];

export const chatSessions = [
  { id: 1, title: "Phishing domain analysis", time: "2 hours ago" },
  { id: 2, title: "CVE-2024-0001 impact", time: "2 days ago" },
  { id: 3, title: "Ransomware trends Q1", time: "5 days ago" }
];

export const quickQueries = [
  "Top ransomware this week",
  "Critical CVEs summary",
  "IOC statistics today",
  "Threat actor analysis",
  "Malware family trends",
  "C2 server locations"
];

export const settingsData = {
  general: {
    autoRefreshInterval: "5 minutes",
    timezone: "UTC",
    itemsPerPage: "20"
  },
  notifications: {
    criticalThreats: true,
    cveAlerts: true,
    feedUpdates: false,
    notificationEmail: "admin@company.com"
  },
  security: {
    sessionTimeout: "8 hours",
    twoFactorAuth: true
  },
  sources: [
    { id: 1, name: "VirusTotal", lastSync: "2 mins ago", status: "active" },
    { id: 2, name: "AlienVault OTX", lastSync: "5 mins ago", status: "active" },
    { id: 3, name: "PhishTank", lastSync: "1 hour ago", status: "active" },
    { id: 4, name: "Hybrid Analysis", lastSync: "N/A", status: "inactive" }
  ]
};
