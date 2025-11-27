/**
 * Smart Context Filtering Model for CTI Chat Assistant
 * 
 * This module provides intelligent query analysis and context filtering
 * to reduce token usage and improve LLM response quality by passing
 * only relevant data to the model.
 */

// Query intent types
export type QueryIntent = 
  | 'ioc_search'        // Searching for specific IOCs (IP, domain, hash)
  | 'cve_analysis'      // Analyzing CVE vulnerabilities
  | 'trend_analysis'    // Asking about trends, patterns, statistics
  | 'general_question'  // General security questions
  | 'specific_lookup'   // Looking up a specific CVE or IOC
  | 'severity_filter'   // Filtering by severity level
  | 'source_analysis'   // Questions about data sources
  | 'comparison';       // Comparing threats or vulnerabilities

// Extracted entities from user query
export interface ExtractedEntities {
  ips: string[];
  domains: string[];
  hashes: string[];
  cveIds: string[];
  keywords: string[];
  severities: string[];
  sources: string[];
  threatTypes: string[];
}

// Complete query analysis result
export interface QueryAnalysis {
  intent: QueryIntent;
  entities: ExtractedEntities;
  severityFilter?: 'critical' | 'high' | 'medium' | 'low';
  timeframe?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
  confidence: number; // 0-1 score indicating confidence in classification
}

// Filtered context to send to LLM
export interface FilteredContext {
  summary: {
    totalIOCs: number;
    totalCVEs: number;
    criticalCVEs: number;
    activeSources: number;
    lastUpdated: string | null;
  };
  relevantIOCs: any[];
  relevantCVEs: any[];
  sourceInfo?: any;
  queryType: QueryIntent;
  filterApplied: string;
  tokenEstimate: number;
}

// Regex patterns for entity extraction
const PATTERNS = {
  cveId: /CVE-\d{4}-\d{4,7}/gi,
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  domain: /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}\b/gi,
  md5: /\b[a-f0-9]{32}\b/gi,
  sha1: /\b[a-f0-9]{40}\b/gi,
  sha256: /\b[a-f0-9]{64}\b/gi,
  url: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi
};

// Intent classification keywords
const INTENT_KEYWORDS = {
  trend_analysis: ['trend', 'trends', 'pattern', 'patterns', 'statistics', 'stats', 'overview', 'summary', 'how many', 'count', 'total', 'increase', 'decrease', 'growth', 'dashboard'],
  cve_analysis: ['cve', 'vulnerability', 'vulnerabilities', 'exploit', 'patch', 'cvss', 'affected', 'impact', 'remediation', 'fix'],
  ioc_search: ['ioc', 'indicator', 'malware', 'malicious', 'threat', 'phishing', 'ransomware', 'botnet', 'c2', 'command and control'],
  severity_filter: ['critical', 'high', 'medium', 'low', 'severe', 'dangerous', 'urgent', 'priority'],
  source_analysis: ['source', 'sources', 'alienvault', 'otx', 'virustotal', 'abuse.ch', 'abusech', 'phishtank', 'nvd', 'cisa', 'kev', 'feed', 'feeds'],
  comparison: ['compare', 'comparison', 'versus', 'vs', 'difference', 'between', 'which']
};

// Threat type keywords
const THREAT_TYPES = ['malware', 'ransomware', 'phishing', 'trojan', 'botnet', 'backdoor', 'spyware', 'adware', 'rootkit', 'worm', 'virus', 'cryptominer', 'c2', 'apt'];

// Data sources keywords
const SOURCE_NAMES = ['alienvault', 'otx', 'virustotal', 'abuse.ch', 'abusech', 'malwarebazaar', 'urlhaus', 'threatfox', 'phishtank', 'nvd', 'cisa', 'kev'];

/**
 * Analyzes a user query to determine intent and extract relevant entities
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase();
  
  // Extract entities
  const entities = extractEntities(query);
  
  // Determine intent
  const intent = classifyIntent(lowerQuery, entities);
  
  // Extract severity filter
  const severityFilter = extractSeverityFilter(lowerQuery);
  
  // Extract timeframe
  const timeframe = extractTimeframe(lowerQuery);
  
  // Calculate confidence based on entity and keyword matches
  const confidence = calculateConfidence(lowerQuery, entities, intent);
  
  return {
    intent,
    entities,
    severityFilter,
    timeframe,
    confidence
  };
}

/**
 * Extracts entities (IPs, domains, hashes, CVE IDs) from the query
 */
function extractEntities(query: string): ExtractedEntities {
  const lowerQuery = query.toLowerCase();
  
  // Extract CVE IDs
  const cveMatches = query.match(PATTERNS.cveId) || [];
  const cveIds = Array.from(new Set(cveMatches)).map(c => c.toUpperCase());
  
  // Extract IPs
  const ipMatches = query.match(PATTERNS.ipv4) || [];
  const ips = Array.from(new Set(ipMatches));
  
  // Extract domains (exclude common words)
  const domainMatches = query.match(PATTERNS.domain) || [];
  const commonWords = ['example.com', 'test.com', 'localhost.local'];
  const filteredDomains = domainMatches.filter(d => 
    !commonWords.includes(d.toLowerCase()) && 
    d.includes('.') && 
    d.length > 4
  );
  const domains = Array.from(new Set(filteredDomains));
  
  // Extract hashes
  const md5s: string[] = query.match(PATTERNS.md5) || [];
  const sha1s: string[] = query.match(PATTERNS.sha1) || [];
  const sha256s: string[] = query.match(PATTERNS.sha256) || [];
  const allHashes: string[] = [...md5s, ...sha1s, ...sha256s];
  const hashes = Array.from(new Set(allHashes));
  
  // Extract keywords (threat types)
  const keywords: string[] = [];
  for (const threatType of THREAT_TYPES) {
    if (lowerQuery.includes(threatType)) {
      keywords.push(threatType);
    }
  }
  
  // Extract severities mentioned
  const severities: string[] = [];
  if (lowerQuery.includes('critical')) severities.push('critical');
  if (lowerQuery.includes('high')) severities.push('high');
  if (lowerQuery.includes('medium')) severities.push('medium');
  if (lowerQuery.includes('low')) severities.push('low');
  
  // Extract sources mentioned
  const sources: string[] = [];
  for (const source of SOURCE_NAMES) {
    if (lowerQuery.includes(source)) {
      sources.push(source);
    }
  }
  
  // Extract threat types
  const threatTypes: string[] = [];
  for (const tt of THREAT_TYPES) {
    if (lowerQuery.includes(tt)) {
      threatTypes.push(tt);
    }
  }
  
  return {
    ips,
    domains,
    hashes,
    cveIds,
    keywords,
    severities,
    sources,
    threatTypes
  };
}

/**
 * Classifies the intent of the query
 */
function classifyIntent(lowerQuery: string, entities: ExtractedEntities): QueryIntent {
  // Check for specific lookups first (highest priority)
  if (entities.cveIds.length > 0) {
    return 'specific_lookup';
  }
  
  if (entities.ips.length > 0 || entities.domains.length > 0 || entities.hashes.length > 0) {
    return 'ioc_search';
  }
  
  // Check for intent keywords
  const intentScores: Record<QueryIntent, number> = {
    'ioc_search': 0,
    'cve_analysis': 0,
    'trend_analysis': 0,
    'general_question': 0,
    'specific_lookup': 0,
    'severity_filter': 0,
    'source_analysis': 0,
    'comparison': 0
  };
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        intentScores[intent as QueryIntent] += 1;
      }
    }
  }
  
  // Find the intent with highest score
  let maxScore = 0;
  let bestIntent: QueryIntent = 'general_question';
  
  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as QueryIntent;
    }
  }
  
  // If severity filter has high score but CVE-related, combine them
  if (intentScores['severity_filter'] > 0 && intentScores['cve_analysis'] > 0) {
    return 'cve_analysis';
  }
  
  return maxScore > 0 ? bestIntent : 'general_question';
}

/**
 * Extracts severity filter from query
 */
function extractSeverityFilter(lowerQuery: string): 'critical' | 'high' | 'medium' | 'low' | undefined {
  if (lowerQuery.includes('critical')) return 'critical';
  if (lowerQuery.includes('high') && !lowerQuery.includes('highlight')) return 'high';
  if (lowerQuery.includes('medium')) return 'medium';
  if (lowerQuery.includes('low') && !lowerQuery.includes('below') && !lowerQuery.includes('follow')) return 'low';
  return undefined;
}

/**
 * Extracts timeframe from query
 */
function extractTimeframe(lowerQuery: string): 'today' | 'week' | 'month' | 'all' | undefined {
  if (lowerQuery.includes('today') || lowerQuery.includes('24 hour') || lowerQuery.includes('last day')) return 'today';
  if (lowerQuery.includes('week') || lowerQuery.includes('7 day') || lowerQuery.includes('past week')) return 'week';
  if (lowerQuery.includes('month') || lowerQuery.includes('30 day') || lowerQuery.includes('past month')) return 'month';
  if (lowerQuery.includes('all') || lowerQuery.includes('ever') || lowerQuery.includes('total')) return 'all';
  return undefined;
}

/**
 * Calculates confidence score for the classification
 */
function calculateConfidence(lowerQuery: string, entities: ExtractedEntities, intent: QueryIntent): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence for specific entity matches
  if (entities.cveIds.length > 0) confidence += 0.3;
  if (entities.ips.length > 0) confidence += 0.2;
  if (entities.domains.length > 0) confidence += 0.2;
  if (entities.hashes.length > 0) confidence += 0.2;
  
  // Increase confidence for keyword matches
  const intentKeywords = INTENT_KEYWORDS[intent as keyof typeof INTENT_KEYWORDS] || [];
  const matchedKeywords = intentKeywords.filter(k => lowerQuery.includes(k));
  confidence += matchedKeywords.length * 0.1;
  
  return Math.min(confidence, 1.0);
}

/**
 * Filters context data based on query analysis
 */
export function filterContext(
  analysis: QueryAnalysis,
  cachedData: {
    threatFeeds: any[];
    cveReports: any[];
    dashboardStats: any;
    sourceStatus: any;
    lastUpdated: string | null;
  }
): FilteredContext {
  const { intent, entities, severityFilter, timeframe } = analysis;
  
  let relevantIOCs: any[] = [];
  let relevantCVEs: any[] = [];
  let filterApplied = '';
  
  switch (intent) {
    case 'specific_lookup':
      // Only return matching CVEs
      if (entities.cveIds.length > 0) {
        relevantCVEs = cachedData.cveReports.filter(cve => 
          entities.cveIds.some(id => cve.id?.toUpperCase() === id)
        );
        filterApplied = `Specific CVE lookup: ${entities.cveIds.join(', ')}`;
      }
      // Also check IOCs for specific lookup
      if (entities.ips.length > 0 || entities.domains.length > 0 || entities.hashes.length > 0) {
        relevantIOCs = filterIOCsByEntities(cachedData.threatFeeds, entities);
        filterApplied += filterApplied ? '; ' : '';
        filterApplied += 'Specific IOC lookup';
      }
      break;
      
    case 'ioc_search':
      relevantIOCs = filterIOCsByEntities(cachedData.threatFeeds, entities);
      
      // If no specific matches, get IOCs by type/keyword
      if (relevantIOCs.length === 0 && entities.threatTypes.length > 0) {
        relevantIOCs = cachedData.threatFeeds.filter(ioc =>
          entities.threatTypes.some(tt => 
            ioc.threatType?.toLowerCase().includes(tt) ||
            ioc.type?.toLowerCase().includes(tt) ||
            ioc.description?.toLowerCase().includes(tt)
          )
        ).slice(0, 15);
      }
      
      // If still no matches, get by severity
      if (relevantIOCs.length === 0 && severityFilter) {
        relevantIOCs = cachedData.threatFeeds.filter(ioc =>
          ioc.severity?.toLowerCase() === severityFilter
        ).slice(0, 15);
      }
      
      // Default: get most recent high-severity IOCs
      if (relevantIOCs.length === 0) {
        relevantIOCs = cachedData.threatFeeds
          .filter(ioc => ['critical', 'high'].includes(ioc.severity?.toLowerCase()))
          .slice(0, 10);
      }
      
      filterApplied = `IOC search${entities.threatTypes.length ? `: ${entities.threatTypes.join(', ')}` : ''}`;
      break;
      
    case 'cve_analysis':
      if (severityFilter) {
        relevantCVEs = cachedData.cveReports.filter(cve =>
          cve.severity?.toLowerCase() === severityFilter ||
          (severityFilter === 'critical' && parseFloat(cve.cvssScore) >= 9.0) ||
          (severityFilter === 'high' && parseFloat(cve.cvssScore) >= 7.0 && parseFloat(cve.cvssScore) < 9.0)
        ).slice(0, 15);
        filterApplied = `CVE analysis (${severityFilter} severity)`;
      } else {
        // Get critical and high severity CVEs
        relevantCVEs = cachedData.cveReports
          .filter(cve => parseFloat(cve.cvssScore) >= 7.0)
          .slice(0, 15);
        filterApplied = 'CVE analysis (high+ severity)';
      }
      break;
      
    case 'trend_analysis':
      // Minimal data - just provide stats and a sample
      relevantIOCs = cachedData.threatFeeds.slice(0, 5);
      relevantCVEs = cachedData.cveReports.slice(0, 5);
      filterApplied = 'Trend analysis (summary only)';
      break;
      
    case 'source_analysis':
      if (entities.sources.length > 0) {
        relevantIOCs = cachedData.threatFeeds.filter(ioc =>
          entities.sources.some(s => ioc.source?.toLowerCase().includes(s))
        ).slice(0, 15);
        filterApplied = `Source analysis: ${entities.sources.join(', ')}`;
      } else {
        // Provide samples from each source
        const sourceGroups = new Map<string, any[]>();
        cachedData.threatFeeds.forEach(ioc => {
          const source = ioc.source || 'Unknown';
          if (!sourceGroups.has(source)) {
            sourceGroups.set(source, []);
          }
          if (sourceGroups.get(source)!.length < 3) {
            sourceGroups.get(source)!.push(ioc);
          }
        });
        relevantIOCs = Array.from(sourceGroups.values()).flat();
        filterApplied = 'Source analysis (samples from each source)';
      }
      break;
      
    case 'severity_filter':
      if (severityFilter) {
        relevantIOCs = cachedData.threatFeeds
          .filter(ioc => ioc.severity?.toLowerCase() === severityFilter)
          .slice(0, 15);
        relevantCVEs = cachedData.cveReports
          .filter(cve => {
            const score = parseFloat(cve.cvssScore);
            if (severityFilter === 'critical') return score >= 9.0;
            if (severityFilter === 'high') return score >= 7.0 && score < 9.0;
            if (severityFilter === 'medium') return score >= 4.0 && score < 7.0;
            return score < 4.0;
          })
          .slice(0, 10);
        filterApplied = `Severity filter: ${severityFilter}`;
      }
      break;
      
    case 'comparison':
      // Provide diverse samples for comparison
      relevantIOCs = cachedData.threatFeeds.slice(0, 10);
      relevantCVEs = cachedData.cveReports.slice(0, 10);
      filterApplied = 'Comparison (diverse samples)';
      break;
      
    case 'general_question':
    default:
      // Minimal context for general questions
      relevantIOCs = cachedData.threatFeeds
        .filter(ioc => ['critical', 'high'].includes(ioc.severity?.toLowerCase()))
        .slice(0, 5);
      relevantCVEs = cachedData.cveReports
        .filter(cve => parseFloat(cve.cvssScore) >= 8.0)
        .slice(0, 5);
      filterApplied = 'General question (minimal context)';
      break;
  }
  
  // Apply timeframe filter if specified
  if (timeframe && timeframe !== 'all') {
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeframe) {
      case 'today':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }
    
    relevantIOCs = relevantIOCs.filter(ioc => {
      const date = new Date(ioc.timestamp || ioc.date || ioc.lastSeen || 0);
      return date >= cutoffDate;
    });
    
    relevantCVEs = relevantCVEs.filter(cve => {
      const date = new Date(cve.published || cve.lastModified || 0);
      return date >= cutoffDate;
    });
    
    filterApplied += ` (${timeframe})`;
  }
  
  // Calculate token estimate (rough approximation)
  const tokenEstimate = estimateTokens(relevantIOCs, relevantCVEs);
  
  return {
    summary: {
      totalIOCs: cachedData.threatFeeds.length,
      totalCVEs: cachedData.cveReports.length,
      criticalCVEs: cachedData.cveReports.filter(c => parseFloat(c.cvssScore) >= 9.0).length,
      activeSources: Object.values(cachedData.sourceStatus).filter((s: any) => s.success).length,
      lastUpdated: cachedData.lastUpdated
    },
    relevantIOCs: compactIOCs(relevantIOCs),
    relevantCVEs: compactCVEs(relevantCVEs),
    sourceInfo: cachedData.sourceStatus,
    queryType: intent,
    filterApplied,
    tokenEstimate
  };
}

/**
 * Filters IOCs based on extracted entities
 */
function filterIOCsByEntities(threatFeeds: any[], entities: ExtractedEntities): any[] {
  const results: any[] = [];
  
  for (const ioc of threatFeeds) {
    const value = (ioc.value || '').toLowerCase();
    
    // Check for IP matches
    if (entities.ips.some(ip => value.includes(ip.toLowerCase()))) {
      results.push(ioc);
      continue;
    }
    
    // Check for domain matches
    if (entities.domains.some(domain => value.includes(domain.toLowerCase()))) {
      results.push(ioc);
      continue;
    }
    
    // Check for hash matches
    if (entities.hashes.some(hash => value.includes(hash.toLowerCase()))) {
      results.push(ioc);
      continue;
    }
  }
  
  return results.slice(0, 20); // Limit results
}

/**
 * Creates compact IOC representations to reduce token usage
 */
function compactIOCs(iocs: any[]): any[] {
  return iocs.map(ioc => ({
    type: ioc.type,
    value: ioc.value,
    severity: ioc.severity,
    source: ioc.source,
    threatType: ioc.threatType,
    confidence: ioc.confidence,
    // Only include date if present and compact
    ...(ioc.timestamp && { date: new Date(ioc.timestamp).toISOString().split('T')[0] })
  }));
}

/**
 * Creates compact CVE representations to reduce token usage
 */
function compactCVEs(cves: any[]): any[] {
  return cves.map(cve => ({
    id: cve.id,
    title: cve.title?.substring(0, 100), // Truncate long titles
    cvssScore: cve.cvssScore,
    severity: cve.severity,
    exploited: cve.exploited,
    // Truncate description to save tokens
    description: cve.description?.substring(0, 200),
    published: cve.published?.split('T')[0]
  }));
}

/**
 * Estimates token count for the filtered context
 */
function estimateTokens(iocs: any[], cves: any[]): number {
  // Rough estimation: ~4 characters per token
  const iocText = JSON.stringify(iocs);
  const cveText = JSON.stringify(cves);
  return Math.ceil((iocText.length + cveText.length) / 4);
}

/**
 * Formats filtered context into a compact string for LLM
 */
export function formatContextForLLM(context: FilteredContext): string {
  let output = '';
  
  // Always include summary
  output += `\n--- Threat Intelligence Summary ---\n`;
  output += `Total IOCs: ${context.summary.totalIOCs} | Total CVEs: ${context.summary.totalCVEs}\n`;
  output += `Critical CVEs: ${context.summary.criticalCVEs} | Active Sources: ${context.summary.activeSources}\n`;
  output += `Filter Applied: ${context.filterApplied}\n`;
  
  // Include relevant IOCs if any
  if (context.relevantIOCs.length > 0) {
    output += `\n--- Relevant IOCs (${context.relevantIOCs.length}) ---\n`;
    context.relevantIOCs.forEach(ioc => {
      output += `- [${ioc.severity?.toUpperCase() || 'N/A'}] ${ioc.type}: ${ioc.value}`;
      if (ioc.source) output += ` (${ioc.source})`;
      if (ioc.threatType) output += ` [${ioc.threatType}]`;
      output += '\n';
    });
  }
  
  // Include relevant CVEs if any
  if (context.relevantCVEs.length > 0) {
    output += `\n--- Relevant CVEs (${context.relevantCVEs.length}) ---\n`;
    context.relevantCVEs.forEach(cve => {
      output += `- ${cve.id} (CVSS: ${cve.cvssScore}${cve.exploited ? ', EXPLOITED' : ''}): ${cve.title}\n`;
      if (cve.description) {
        output += `  ${cve.description}\n`;
      }
    });
  }
  
  return output;
}
