import OpenAI from "openai";

// Using OpenAI's API with the user's API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function analyzeThreatWithAI(
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

    // Prepare context data for the AI
    let contextData = "";
    
    // If query is about recent threats or IOCs, include sample data
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
    
    // If query is about CVEs, include CVE data
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

export async function chatWithAssistant(
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
