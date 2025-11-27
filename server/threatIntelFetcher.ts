import axios from 'axios';

interface ThreatData {
  success: boolean;
  data?: any[];
  count?: number;
  error?: string;
}

export class ThreatIntelligenceFetcher {
  private otxApiKey: string;
  private virusTotalApiKey: string;
  private abuseChAuthKey: string;
  private otxBaseUrl = 'https://otx.alienvault.com/api/v1';
  private virusTotalBaseUrl = 'https://www.virustotal.com/api/v3';
  private abuseChUrls = {
    malware: 'https://mb-api.abuse.ch/api/v1/',
    urlhaus: 'https://urlhaus.abuse.ch/downloads/json_recent/',
    threatfox: 'https://threatfox.abuse.ch/export/json/recent/'
  };
  private nvdBaseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
  private cisaKevUrl = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

  constructor() {
    this.otxApiKey = process.env.OTX_API_KEY || '';
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY || '';
    this.abuseChAuthKey = process.env.ABUSECH_AUTH_KEY || '';
  }

  async fetchOtxPulses(limit: number = 10): Promise<ThreatData> {
    try {
      const headers: any = {};
      if (this.otxApiKey) {
        headers['X-OTX-API-KEY'] = this.otxApiKey;
      }
      
      const response = await axios.get(`${this.otxBaseUrl}/pulses/activity`, {
        headers,
        params: { limit, page: 1 },
        timeout: 30000
      });

      const pulses = response.data.results?.map((pulse: any) => ({
        source: 'AlienVault OTX',
        pulse_id: pulse.id,
        name: pulse.name,
        description: pulse.description,
        created: pulse.created,
        modified: pulse.modified,
        tags: pulse.tags || [],
        indicators: pulse.indicators?.map((ind: any) => ({
          type: ind.type,
          indicator: ind.indicator,
          description: ind.description
        })) || []
      })) || [];

      return { success: true, data: pulses, count: pulses.length };
    } catch (error: any) {
      console.error('OTX fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchAbuseChMalware(): Promise<ThreatData> {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (this.abuseChAuthKey) {
        headers['Auth-Key'] = this.abuseChAuthKey;
      }
      
      const response = await axios.post(
        this.abuseChUrls.malware,
        { query: 'get_recent', selector: 'time' },
        { 
          headers,
          timeout: 30000 
        }
      );
      
      const malwareSamples = response.data.data?.slice(0, 50).map((sample: any) => ({
        source: 'Abuse.ch MalwareBazaar',
        sha256: sample.sha256_hash,
        md5: sample.md5_hash,
        file_type: sample.file_type,
        file_name: sample.file_name,
        signature: sample.signature,
        first_seen: sample.first_seen,
        tags: sample.tags || []
      })) || [];

      return { success: true, data: malwareSamples, count: malwareSamples.length };
    } catch (error: any) {
      console.error('Abuse.ch Malware fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchAbuseChUrls(): Promise<ThreatData> {
    try {
      const response = await axios.get(this.abuseChUrls.urlhaus, { timeout: 30000 });
      const maliciousUrls = response.data.data?.slice(0, 50).map((urlEntry: any) => ({
        source: 'Abuse.ch URLhaus',
        url: urlEntry.url,
        url_status: urlEntry.url_status,
        threat: urlEntry.threat,
        tags: urlEntry.tags || [],
        dateadded: urlEntry.dateadded
      })) || [];

      return { success: true, data: maliciousUrls, count: maliciousUrls.length };
    } catch (error: any) {
      console.error('Abuse.ch URLs fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchAbuseChIocs(): Promise<ThreatData> {
    try {
      const response = await axios.get(this.abuseChUrls.threatfox, { timeout: 30000 });
      const iocs = response.data.data?.slice(0, 50).map((ioc: any) => ({
        source: 'Abuse.ch ThreatFox',
        ioc_type: ioc.ioc_type,
        ioc_value: ioc.ioc_value,
        threat_type: ioc.threat_type,
        malware: ioc.malware,
        confidence_level: ioc.confidence_level,
        first_seen: ioc.first_seen,
        tags: ioc.tags || []
      })) || [];

      return { success: true, data: iocs, count: iocs.length };
    } catch (error: any) {
      console.error('Abuse.ch IOCs fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchNvdRecentCves(days: number = 7): Promise<ThreatData> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const params = {
        pubStartDate: startDate.toISOString().split('.')[0] + '.000',
        pubEndDate: endDate.toISOString().split('.')[0] + '.999',
        resultsPerPage: 50
      };

      const response = await axios.get(this.nvdBaseUrl, { params, timeout: 30000 });
      const cves = response.data.vulnerabilities?.map((vuln: any) => {
        const cveData = vuln.cve;
        const metrics = cveData.metrics || {};
        let cvssScore = null;
        let severity = null;
        let cvssVersion = null;

        // Priority: CVSS v4.0 -> v3.1 -> v3.0 -> v2.0
        // Try CVSS v4.0 first (newest and most accurate)
        if (metrics.cvssMetricV40?.length > 0) {
          cvssScore = metrics.cvssMetricV40[0].cvssData.baseScore;
          severity = metrics.cvssMetricV40[0].cvssData.baseSeverity;
          cvssVersion = '4.0';
        }
        // Fallback to CVSS v3.1
        else if (metrics.cvssMetricV31?.length > 0) {
          cvssScore = metrics.cvssMetricV31[0].cvssData.baseScore;
          severity = metrics.cvssMetricV31[0].cvssData.baseSeverity;
          cvssVersion = '3.1';
        }
        // Fallback to CVSS v3.0
        else if (metrics.cvssMetricV30?.length > 0) {
          cvssScore = metrics.cvssMetricV30[0].cvssData.baseScore;
          severity = metrics.cvssMetricV30[0].cvssData.baseSeverity;
          cvssVersion = '3.0';
        }
        // Fallback to CVSS v2.0
        else if (metrics.cvssMetricV2?.length > 0) {
          cvssScore = metrics.cvssMetricV2[0].cvssData.baseScore;
          severity = metrics.cvssMetricV2[0].baseSeverity;
          cvssVersion = '2.0';
        }

        return {
          source: 'NVD',
          cve_id: cveData.id,
          description: cveData.descriptions?.[0]?.value || '',
          published: cveData.published,
          last_modified: cveData.lastModified,
          cvss_score: cvssScore,
          cvss_version: cvssVersion,
          severity: severity,
          references: cveData.references?.slice(0, 5).map((ref: any) => ref.url) || []
        };
      }) || [];

      return { success: true, data: cves, count: cves.length };
    } catch (error: any) {
      console.error('NVD fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchCisaKev(): Promise<ThreatData> {
    try {
      const response = await axios.get(this.cisaKevUrl, { timeout: 30000 });
      const exploitedCves = response.data.vulnerabilities?.slice(0, 50).map((vuln: any) => ({
        source: 'CISA KEV',
        cve_id: vuln.cveID,
        vendor_project: vuln.vendorProject,
        product: vuln.product,
        vulnerability_name: vuln.vulnerabilityName,
        date_added: vuln.dateAdded,
        short_description: vuln.shortDescription,
        required_action: vuln.requiredAction,
        due_date: vuln.dueDate,
        known_ransomware: vuln.knownRansomwareCampaignUse || false
      })) || [];

      return { success: true, data: exploitedCves, count: exploitedCves.length };
    } catch (error: any) {
      console.error('CISA KEV fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchVirusTotalIpReport(ipAddress: string): Promise<ThreatData> {
    try {
      const response = await axios.get(`${this.virusTotalBaseUrl}/ip_addresses/${ipAddress}`, {
        headers: { 'x-apikey': this.virusTotalApiKey },
        timeout: 30000
      });

      const attributes = response.data.data?.attributes || {};
      const result = {
        source: 'VirusTotal',
        ip_address: ipAddress,
        country: attributes.country,
        as_owner: attributes.as_owner,
        reputation: attributes.reputation,
        last_analysis_stats: attributes.last_analysis_stats || {},
        malicious_count: attributes.last_analysis_stats?.malicious || 0
      };

      return { success: true, data: [result], count: 1 };
    } catch (error: any) {
      console.error('VirusTotal IP fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchVirusTotalDomainReport(domain: string): Promise<ThreatData> {
    try {
      const response = await axios.get(`${this.virusTotalBaseUrl}/domains/${domain}`, {
        headers: { 'x-apikey': this.virusTotalApiKey },
        timeout: 30000
      });

      const attributes = response.data.data?.attributes || {};
      const result = {
        source: 'VirusTotal',
        domain: domain,
        reputation: attributes.reputation,
        last_analysis_stats: attributes.last_analysis_stats || {},
        malicious_count: attributes.last_analysis_stats?.malicious || 0,
        categories: attributes.categories || {}
      };

      return { success: true, data: [result], count: 1 };
    } catch (error: any) {
      console.error('VirusTotal Domain fetch error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchVirusTotalEnrichment(indicators: string[]): Promise<ThreatData> {
    try {
      const enrichedData: any[] = [];
      const sampleIndicators = indicators.slice(0, 5);
      
      for (const indicator of sampleIndicators) {
        try {
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          let result;
          if (/^(\d{1,3}\.){3}\d{1,3}$/.test(indicator)) {
            result = await this.fetchVirusTotalIpReport(indicator);
          } else if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(indicator)) {
            result = await this.fetchVirusTotalDomainReport(indicator);
          } else {
            continue;
          }
          
          if (result.success && result.data) {
            enrichedData.push(...result.data);
          }
        } catch (error) {
          console.warn(`VirusTotal lookup failed for ${indicator}`);
        }
      }
      
      return { success: true, data: enrichedData, count: enrichedData.length };
    } catch (error: any) {
      console.error('VirusTotal enrichment error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchAllFeeds(options: { skipVirusTotal?: boolean; fastMode?: boolean } = {}): Promise<any> {
    const { skipVirusTotal = false, fastMode = false } = options;
    
    // Reduce timeout for fast mode
    const timeout = fastMode ? 15000 : 30000;
    
    const results = await Promise.allSettled([
      this.fetchOtxPulses(fastMode ? 10 : 20),
      this.fetchAbuseChMalware(),
      this.fetchAbuseChUrls(),
      this.fetchAbuseChIocs(),
      this.fetchNvdRecentCves(7),
      this.fetchCisaKev()
    ]);

    const baseData: any = {
      timestamp: new Date().toISOString(),
      sources: {
        'AlienVault OTX': results[0].status === 'fulfilled' ? results[0].value : { success: false, error: 'Failed to fetch' },
        'Abuse.ch Malware': results[1].status === 'fulfilled' ? results[1].value : { success: false, error: 'Failed to fetch' },
        'Abuse.ch URLs': results[2].status === 'fulfilled' ? results[2].value : { success: false, error: 'Failed to fetch' },
        'Abuse.ch IOCs': results[3].status === 'fulfilled' ? results[3].value : { success: false, error: 'Failed to fetch' },
        'NVD CVEs': results[4].status === 'fulfilled' ? results[4].value : { success: false, error: 'Failed to fetch' },
        'CISA KEV': results[5].status === 'fulfilled' ? results[5].value : { success: false, error: 'Failed to fetch' }
      }
    };

    // Skip VirusTotal enrichment for faster refresh (it has 15s delay per indicator)
    if (skipVirusTotal || fastMode) {
      baseData.sources['VirusTotal'] = { success: true, data: [], count: 0, skipped: true };
      return baseData;
    }

    const otxData = baseData.sources['AlienVault OTX'];
    const indicators: string[] = [];
    if (otxData.success && otxData.data) {
      otxData.data.forEach((pulse: any) => {
        pulse.indicators?.forEach((ind: any) => {
          if ((ind.type === 'IPv4' || ind.type === 'domain') && indicators.length < 5) {
            indicators.push(ind.indicator);
          }
        });
      });
    }

    if (indicators.length > 0) {
      try {
        const vtResult = await this.fetchVirusTotalEnrichment(indicators);
        baseData.sources['VirusTotal'] = vtResult;
      } catch (error) {
        baseData.sources['VirusTotal'] = { success: false, error: 'Enrichment failed' };
      }
    } else {
      baseData.sources['VirusTotal'] = { success: true, data: [], count: 0 };
    }

    return baseData;
  }
}
