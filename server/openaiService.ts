import OpenAI from "openai";
import { FilteredContext, formatContextForLLM, QueryAnalysis } from "./contextFilter";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AnalysisResult {
  response: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  filterInfo: {
    queryType: string;
    filterApplied: string;
    contextTokenEstimate: number;
  };
}

/**
 * Analyzes threats using filtered context for optimized token usage
 */
export async function analyzeThreatWithAI(
  userQuery: string,
  filteredContext: FilteredContext,
  queryAnalysis: QueryAnalysis
): Promise<AnalysisResult> {
  try {
    const systemPrompt = buildSystemPrompt(filteredContext, queryAnalysis);
    const contextData = formatContextForLLM(filteredContext);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery + contextData }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 2048,
    });

    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      response: response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.",
      tokensUsed: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      },
      filterInfo: {
        queryType: filteredContext.queryType,
        filterApplied: filteredContext.filterApplied,
        contextTokenEstimate: filteredContext.tokenEstimate
      }
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw new Error("Failed to analyze threat with AI: " + error.message);
  }
}

/**
 * Chat with assistant using filtered context
 */
export async function chatWithAssistant(
  messages: ChatMessage[],
  filteredContext: FilteredContext,
  queryAnalysis: QueryAnalysis
): Promise<AnalysisResult> {
  try {
    const systemPrompt = buildChatSystemPrompt(filteredContext, queryAnalysis);
    const contextData = formatContextForLLM(filteredContext);
    
    // Clone messages to avoid mutating the original array
    const clonedMessages = messages.map(m => ({ ...m }));
    const lastUserMessage = clonedMessages[clonedMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      lastUserMessage.content = lastUserMessage.content + contextData;
    }

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...clonedMessages
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 2048,
    });

    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return {
      response: response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.",
      tokensUsed: {
        prompt: usage.prompt_tokens,
        completion: usage.completion_tokens,
        total: usage.total_tokens
      },
      filterInfo: {
        queryType: filteredContext.queryType,
        filterApplied: filteredContext.filterApplied,
        contextTokenEstimate: filteredContext.tokenEstimate
      }
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw new Error("Failed to chat with assistant: " + error.message);
  }
}

/**
 * Builds optimized system prompt based on query intent
 */
function buildSystemPrompt(context: FilteredContext, analysis: QueryAnalysis): string {
  const basePrompt = `You are a Cyber Threat Intelligence Assistant specialized in analyzing security threats, IOCs (Indicators of Compromise), and CVE vulnerabilities.

Current Intelligence Summary:
- Total IOCs in database: ${context.summary.totalIOCs}
- Total CVEs tracked: ${context.summary.totalCVEs}
- Critical CVEs: ${context.summary.criticalCVEs}
- Active Data Sources: ${context.summary.activeSources}
- Data last updated: ${context.summary.lastUpdated || 'Unknown'}`;

  const intentGuidance = getIntentGuidance(analysis.intent);
  
  const responseFormat = `
Response Guidelines:
- Be specific and cite actual data from the provided context
- Provide actionable insights and recommendations
- Use bullet points for clarity
- Include relevant statistics when available
- Keep responses focused and professional`;

  return basePrompt + '\n\n' + intentGuidance + responseFormat;
}

/**
 * Builds system prompt for chat mode
 */
function buildChatSystemPrompt(context: FilteredContext, analysis: QueryAnalysis): string {
  return `You are a Cyber Threat Intelligence Assistant helping security analysts investigate threats.

Intelligence Summary:
- IOCs: ${context.summary.totalIOCs} | CVEs: ${context.summary.totalCVEs} | Critical: ${context.summary.criticalCVEs}
- Active Sources: ${context.summary.activeSources}

You can help with:
- Analyzing specific threats and IOCs
- Explaining CVE vulnerabilities and their impact
- Providing security recommendations
- Searching through threat intelligence data
- Identifying trends and patterns

${getIntentGuidance(analysis.intent)}

Always provide accurate, actionable information based on the filtered context provided.`;
}

/**
 * Returns intent-specific guidance for the LLM
 */
function getIntentGuidance(intent: string): string {
  switch (intent) {
    case 'specific_lookup':
      return `Query Type: Specific Lookup
The user is looking for specific CVE or IOC information. Focus on:
- Providing detailed information about the specific item requested
- Include CVSS scores, severity, and exploitation status for CVEs
- For IOCs, include source, confidence level, and associated threat type
- Suggest related threats or vulnerabilities if relevant\n`;

    case 'ioc_search':
      return `Query Type: IOC Search
The user is searching for indicators of compromise. Focus on:
- Listing relevant IOCs with their types (IP, domain, hash, URL)
- Include severity levels and confidence scores
- Mention the data source for each IOC
- Provide context about the threat type (malware, phishing, C2, etc.)\n`;

    case 'cve_analysis':
      return `Query Type: CVE Analysis
The user is analyzing vulnerabilities. Focus on:
- CVSS scores and severity ratings (use version 4.0 if available, then 3.x, then 2.0)
- Exploitation status (especially CISA KEV entries)
- Affected products and versions
- Remediation recommendations\n`;

    case 'trend_analysis':
      return `Query Type: Trend Analysis
The user wants to understand patterns and trends. Focus on:
- Statistical summaries from the available data
- Comparisons between threat types or time periods
- Notable patterns in the threat landscape
- High-level insights without excessive raw data\n`;

    case 'source_analysis':
      return `Query Type: Data Source Analysis
The user is asking about threat intelligence sources. Focus on:
- Source reliability and data freshness
- Types of data each source provides
- Any noted issues or limitations with specific sources\n`;

    case 'severity_filter':
      return `Query Type: Severity-Based Search
The user is filtering by severity. Focus on:
- Prioritizing items matching the requested severity level
- Explaining the severity classification criteria
- Highlighting the most critical items first\n`;

    case 'comparison':
      return `Query Type: Comparison
The user wants to compare threats or data. Focus on:
- Clear side-by-side comparisons
- Key differences and similarities
- Recommendations based on the comparison\n`;

    case 'general_question':
    default:
      return `Query Type: General Question
The user has a general security question. Focus on:
- Providing relevant context from available data
- Keeping the response focused and actionable
- Suggesting specific areas to explore if relevant\n`;
  }
}

/**
 * Legacy function for backwards compatibility - wraps to new API
 * @deprecated Use analyzeThreatWithAI with FilteredContext instead
 */
export async function analyzeThreatWithAILegacy(
  userQuery: string,
  context: {
    threatFeeds: any[];
    cveReports: any[];
    dashboardStats: any;
    sourceStatus: any;
  }
): Promise<string> {
  try {
    const systemPrompt = `You are a Cyber Threat Intelligence Assistant specialized in analyzing security threats, IOCs (Indicators of Compromise), and CVE vulnerabilities. 

You have access to the following real-time threat intelligence data:
- Total IOCs: ${context.dashboardStats.totalIOCs?.value || 0}
- Critical CVEs: ${context.dashboardStats.criticalCVEs?.value || 0}
- Phishing Domains: ${context.dashboardStats.phishingDomains?.value || 0}
- Active Sources: ${Object.keys(context.sourceStatus).length}
- Recent Threat Feeds: ${context.threatFeeds.length} IOCs from sources like AlienVault OTX, Abuse.ch, VirusTotal
- CVE Reports: ${context.cveReports.length} vulnerabilities from NVD and CISA KEV

When analyzing threats:
1. Be specific and cite actual data from the provided context
2. Provide actionable insights and recommendations
3. Explain severity levels and their implications
4. If searching for specific IOCs, look through the threat feeds data
5. For CVE analysis, reference actual CVE data and CVSS scores
6. Keep responses clear, concise, and professional
7. Use security terminology appropriately

Format your responses with clear structure:
- Use bullet points for lists
- Highlight critical findings
- Include relevant statistics
- Provide context and recommendations`;

    let contextData = "";
    
    if (userQuery.toLowerCase().includes("ioc") || 
        userQuery.toLowerCase().includes("threat") || 
        userQuery.toLowerCase().includes("domain") ||
        userQuery.toLowerCase().includes("ip") ||
        userQuery.toLowerCase().includes("phishing")) {
      const recentThreats = context.threatFeeds.slice(0, 20);
      contextData += `\n\nRecent Threat Feeds (Top 20):\n${recentThreats.map(t => 
        `- ${t.type}: ${t.value} (Source: ${t.source}, Severity: ${t.severity}, Type: ${t.threatType})`
      ).join('\n')}`;
    }
    
    if (userQuery.toLowerCase().includes("cve") || 
        userQuery.toLowerCase().includes("vulnerability") ||
        userQuery.toLowerCase().includes("critical")) {
      const recentCVEs = context.cveReports.slice(0, 10);
      contextData += `\n\nRecent CVE Reports (Top 10):\n${recentCVEs.map(c => 
        `- ${c.id}: ${c.title} (CVSS: ${c.cvssScore}, Published: ${c.published})`
      ).join('\n')}`;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery + contextData }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 2048,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw new Error("Failed to analyze threat with AI: " + error.message);
  }
}

/**
 * Legacy chat function for backwards compatibility
 * @deprecated Use chatWithAssistant with FilteredContext instead
 */
export async function chatWithAssistantLegacy(
  messages: ChatMessage[],
  context: {
    threatFeeds: any[];
    cveReports: any[];
    dashboardStats: any;
    sourceStatus: any;
  }
): Promise<string> {
  try {
    const systemPrompt = `You are a Cyber Threat Intelligence Assistant. You help security analysts understand and investigate cyber threats, IOCs, and vulnerabilities.

Current Threat Intelligence Summary:
- Total IOCs: ${context.dashboardStats.totalIOCs?.value || 0}
- Critical CVEs: ${context.dashboardStats.criticalCVEs?.value || 0}
- Active Threat Sources: ${Object.values(context.sourceStatus).filter((s: any) => s.success).length}/${Object.keys(context.sourceStatus).length}

You can help with:
- Analyzing specific threats and IOCs
- Explaining CVE vulnerabilities and their impact
- Providing security recommendations
- Searching through threat intelligence data
- Identifying trends and patterns in security data

Always provide accurate, actionable information based on the available threat intelligence data.`;

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 2048,
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
  } catch (error: any) {
    console.error("OpenAI API error:", error.message);
    throw new Error("Failed to chat with assistant: " + error.message);
  }
}
