// Backend mock data for CTI Aggregator API
// This simulates database data that would normally come from MongoDB

const dashboardStats = {
  totalIOCs: { value: 12847, change: "+247 today" },
  newFeeds: { value: 8, change: "Last 24h" },
  criticalCVEs: { value: 23, change: "This week" },
  phishingDomains: { value: 156, change: "+12 today" }
};

const recentThreats = [
  { id: 1, ioc: "malicious-site.com", type: "Domain", severity: "Critical", time: "2:32:00 PM" },
  { id: 2, ioc: "192.168.1.100", type: "IP Address", severity: "High", time: "1:46:00 PM" },
  { id: 3, ioc: "evil.exe", type: "File Hash", severity: "Critical", time: "12:16:00 PM" },
  { id: 4, ioc: "phish-bank.org", type: "Domain", severity: "Medium", time: "11:22:00 AM" },
  { id: 5, ioc: "trojan.zip", type: "File Hash", severity: "High", time: "10:15:00 AM" }
];

const threatTrends = [
  { day: "Mon", threats: 45 },
  { day: "Tue", threats: 52 },
  { day: "Wed", threats: 48 },
  { day: "Thu", threats: 61 },
  { day: "Fri", threats: 73 },
  { day: "Sat", threats: 38 },
  { day: "Sun", threats: 51 }
];

const iocDatabase = [
  { id: 1, date: "1/15/2024 2:32:15 PM", type: "Domain", value: "malicious-banking-site.com", source: "VirusTotal", threatType: "Phishing", severity: "Critical" },
  { id: 2, date: "1/15/2024 2:28:45 PM", type: "IP Address", value: "192.168.100.50", source: "AlienVault OTX", threatType: "C2 Server", severity: "High" },
  { id: 3, date: "1/15/2024 2:25:12 PM", type: "File Hash", value: "a1b2c3d4e5f67890123456789abcdef", source: "Hybrid Analysis", threatType: "Malware", severity: "Critical" },
  { id: 4, date: "1/15/2024 2:22:30 PM", type: "Domain", value: "fake-crypto-exchange.org", source: "PhishTank", threatType: "Phishing", severity: "High" },
  { id: 5, date: "1/15/2024 2:16:05 PM", type: "URL", value: "http://evil-download.com/trojan.exe", source: "URLVoid", threatType: "Malware Distribution", severity: "Critical" },
  { id: 6, date: "1/15/2024 2:15:02 PM", type: "IP Address", value: "10.0.0.150", source: "Emerging Threats", threatType: "Exploit", severity: "Medium" },
  { id: 7, date: "1/15/2024 2:12:08 PM", type: "Email", value: "noreply@fake-bank.com", source: "SpamHaus", threatType: "Phishing", severity: "High" },
  { id: 8, date: "1/15/2024 2:08:55 PM", type: "File Hash", value: "f9e8d7c6b5a4321098765432109876dc", source: "Malware Bazaar", threatType: "Ransomware", severity: "Critical" },
  { id: 9, date: "1/15/2024 2:05:30 PM", type: "Domain", value: "scam-paypal-verify.net", source: "PhishTank", threatType: "Phishing", severity: "High" },
  { id: 10, date: "1/15/2024 2:02:15 PM", type: "IP Address", value: "203.0.113.45", source: "AlienVault OTX", threatType: "Botnet", severity: "Medium" },
  { id: 11, date: "1/15/2024 1:58:40 PM", type: "File Hash", value: "1234567890abcdef1234567890abcdef", source: "Hybrid Analysis", threatType: "Malware", severity: "High" },
  { id: 12, date: "1/15/2024 1:55:20 PM", type: "Domain", value: "fake-microsoft-update.com", source: "VirusTotal", threatType: "Malware Distribution", severity: "Critical" },
  { id: 13, date: "1/15/2024 1:50:10 PM", type: "URL", value: "http://malicious-ads.org/payload", source: "URLVoid", threatType: "Malware", severity: "Medium" },
  { id: 14, date: "1/15/2024 1:45:30 PM", type: "Email", value: "admin@fake-amazon.com", source: "SpamHaus", threatType: "Phishing", severity: "High" },
  { id: 15, date: "1/15/2024 1:40:15 PM", type: "IP Address", value: "198.51.100.200", source: "Emerging Threats", threatType: "C2 Server", severity: "Critical" },
  { id: 16, date: "1/15/2024 1:35:45 PM", type: "Domain", value: "trojan-dropper-site.org", source: "PhishTank", threatType: "Malware Distribution", severity: "High" },
  { id: 17, date: "1/15/2024 1:30:20 PM", type: "File Hash", value: "fedcba0987654321fedcba0987654321", source: "Malware Bazaar", threatType: "Ransomware", severity: "Critical" },
  { id: 18, date: "1/15/2024 1:25:10 PM", type: "Domain", value: "crypto-scam-investment.com", source: "VirusTotal", threatType: "Phishing", severity: "Medium" },
  { id: 19, date: "1/15/2024 1:20:40 PM", type: "IP Address", value: "172.16.0.99", source: "AlienVault OTX", threatType: "Exploit", severity: "High" },
  { id: 20, date: "1/15/2024 1:15:25 PM", type: "URL", value: "http://drive-by-download.net/exploit.js", source: "URLVoid", threatType: "Exploit", severity: "Critical" }
];

const cveReports = [
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
  },
  {
    id: "CVE-2024-0005",
    cvssScore: 9.1,
    title: "Authentication Bypass in Node.js Express",
    description: "Critical authentication bypass vulnerability in Express.js middleware allows unauthorized access to protected routes.",
    published: "1/11/2024"
  },
  {
    id: "CVE-2024-0006",
    cvssScore: 5.4,
    title: "Information Disclosure in Django Framework",
    description: "Django debug mode exposes sensitive configuration information when misconfigured in production environments.",
    published: "1/10/2024"
  }
];

const analyticsStats = {
  avgDailyThreats: { value: 54.2, change: "+12.5% from last week" },
  activeSources: { value: 7, change: "Threat intel feeds" },
  criticalAlerts: { value: 89, change: "+24 today" },
  detectionRate: { value: "94.7%", change: "+2.1% this month" }
};

const threatsPerDay = [
  { date: "Jan 8", threats: 45 },
  { date: "Jan 9", threats: 52 },
  { date: "Jan 10", threats: 38 },
  { date: "Jan 11", threats: 65 },
  { date: "Jan 12", threats: 71 },
  { date: "Jan 13", threats: 28 },
  { date: "Jan 14", threats: 51 },
  { date: "Jan 15", threats: 78 }
];

const threatTypeDistribution = [
  { name: "Phishing", value: 35, color: "#ef4444" },
  { name: "Malware", value: 28, color: "#f59e0b" },
  { name: "C2 Server", value: 15, color: "#a855f7" },
  { name: "Botnet", value: 12, color: "#3b82f6" },
  { name: "Ransomware", value: 10, color: "#ec4899" }
];

const activeSources = [
  { name: "SpamHaus", count: 145 },
  { name: "URLVoid", count: 132 },
  { name: "Malware Bazaar", count: 118 },
  { name: "Hybrid Analysis", count: 98 }
];

const severityTrends = [
  { week: "Week 1", Critical: 25, High: 40, Medium: 60, Low: 15 },
  { week: "Week 2", Critical: 30, High: 45, Medium: 55, Low: 20 },
  { week: "Week 3", Critical: 28, High: 50, Medium: 58, Low: 18 },
  { week: "Week 4", Critical: 35, High: 55, Medium: 65, Low: 22 }
];

const settingsGeneral = {
  autoRefreshInterval: "5 minutes",
  timezone: "UTC",
  itemsPerPage: "20"
};

const settingsSources = [
  { id: 1, name: "VirusTotal", lastSync: "2 mins ago", status: "active" },
  { id: 2, name: "AlienVault OTX", lastSync: "5 mins ago", status: "active" },
  { id: 3, name: "PhishTank", lastSync: "1 hour ago", status: "active" },
  { id: 4, name: "Hybrid Analysis", lastSync: "N/A", status: "inactive" }
];

export {
  dashboardStats,
  recentThreats,
  threatTrends,
  iocDatabase,
  cveReports,
  analyticsStats,
  threatsPerDay,
  threatTypeDistribution,
  activeSources,
  severityTrends,
  settingsGeneral,
  settingsSources
};
