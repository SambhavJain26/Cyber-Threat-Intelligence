# CTI Aggregator - Cyber Threat Intelligence Dashboard

## Overview

The CTI Aggregator is a comprehensive cybersecurity threat intelligence dashboard that aggregates, displays, and analyzes threat data from multiple open-source intelligence (OSINT) sources. The application provides security analysts with a centralized platform to monitor indicators of compromise (IOCs), CVE vulnerabilities, phishing domains, and other cybersecurity threats in real-time.

**Core Purpose**: Centralized monitoring, analysis, and reporting of cybersecurity threats from sources like AlienVault OTX, VirusTotal, PhishTank, Abuse.ch feeds, and CISA KEV database.

**Key Features**:
- Real-time threat intelligence dashboard with KPI metrics
- IOC database with advanced filtering and search capabilities
- CVE vulnerability tracking with CVSS scoring (v4.0 priority)
- Analytics and trend visualization
- Threat feed aggregation from multiple OSINT sources
- Background data fetching and caching system
- AI-powered chat assistant with smart context filtering
- Fast mode manual refresh for quick data updates

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, using functional components and hooks pattern

**Routing**: Wouter for lightweight client-side routing (SPA architecture)

**State Management**:
- TanStack Query (React Query) for server state management with automatic caching and background refetching
- Local component state with useState/useEffect for UI state
- No global state management library (Redux/Zustand) - relies on React Query's caching

**UI Component System**:
- shadcn/ui component library built on Radix UI primitives
- Custom styling with Tailwind CSS using "New York" style preset
- Dark theme as primary design with Material Design-inspired data visualization
- Custom CSS variables for theme customization (HSL color space)

**Data Visualization**:
- Recharts library for all charts (line charts, bar charts, pie/doughnut charts)
- Responsive container patterns for adaptive layouts

**Design Rationale**: Dark theme chosen specifically for 24/7 security operations to reduce eye strain during extended monitoring sessions. Information-dense layout optimized for professional security platforms.

### Backend Architecture

**Runtime**: Node.js with Express.js REST API server

**API Design Pattern**: RESTful endpoints with JSON responses

**Data Flow**:
1. Background fetcher service runs periodically (1-hour intervals by default)
2. Fetches threat intelligence from multiple OSINT APIs
3. Processes and caches data in-memory
4. Frontend requests data from Express API endpoints
5. Express serves cached data with filtering/pagination logic

**Data Fetching Strategy**:
- `ThreatIntelligenceFetcher` class handles all external API integrations
- Background thread continuously updates cached data
- In-memory caching reduces API rate limit issues
- Mock data fallback system for development without API keys

**API Endpoints Structure**:
- `/api/dashboard/*` - Dashboard statistics and recent threats
- `/api/threat-feeds` - IOC database with query parameters for filtering
- `/api/cve-reports` - CVE vulnerability data with search
- `/api/analytics/*` - Analytics metrics and trend data
- `/api/settings/*` - Configuration and source management

**Authentication**: Currently uses in-memory session storage with connect-pg-simple (prepared for PostgreSQL sessions but using memory store)

**Error Handling**: Try-catch blocks with error state management, user-friendly error messages displayed in UI

### Data Storage Solutions

**Current Implementation**: In-memory caching (JavaScript Map/Object storage)

**Database Schema Prepared**: 
- Drizzle ORM configured for PostgreSQL
- User schema defined with UUID primary keys
- Migration system configured but database optional for current functionality

**Storage Strategy**:
- Threat intelligence data cached in `cachedData` object with timestamp tracking
- User sessions stored in memory (MemStorage class)
- No persistent database required for threat data (always fetched fresh from OSINT sources)

**Rationale**: Threat intelligence is ephemeral and time-sensitive. Real-time fetching from authoritative sources ensures data freshness. In-memory caching provides fast read access while avoiding stale database records.

### External Dependencies

**OSINT Threat Intelligence Sources**:
- **AlienVault OTX** - Threat pulses and indicators (requires API key: `OTX_API_KEY`)
- **VirusTotal** - File/URL/domain reputation (requires API key: `VIRUSTOTAL_API_KEY`)
- **PhishTank** - Phishing domain database (optional API key: `PHISHTANK_API_KEY`)
- **Abuse.ch** - Multiple feeds (MalwareBazaar, URLhaus, ThreatFox) - public access
- **NVD (NIST)** - CVE vulnerability database - public API
- **CISA KEV** - Known Exploited Vulnerabilities catalog - public feed

**API Integration Approach**:
- Axios for HTTP requests with timeout handling
- Environment variables for API key management (.env file)
- Graceful degradation when API keys missing (logs errors, continues with available sources)
- Rate limiting awareness (background fetcher intervals configurable)

**Frontend Libraries**:
- `@tanstack/react-query` - Server state management
- `recharts` - Data visualization
- `axios` - HTTP client
- `wouter` - Routing
- `date-fns` - Date manipulation
- `@radix-ui/*` - Headless UI primitives
- `lucide-react` - Icon library
- `react-hook-form` + `zod` - Form handling and validation

**Backend Libraries**:
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `drizzle-orm` + `@neondatabase/serverless` - Database ORM (optional)
- `connect-pg-simple` - Session storage adapter

**Build & Development Tools**:
- Vite - Frontend build tool with HMR
- esbuild - Backend bundling for production
- TypeScript - Type safety across frontend and backend
- Tailwind CSS - Utility-first styling
- PostCSS - CSS processing

**Replit-Specific Integrations**:
- `@replit/vite-plugin-runtime-error-modal` - Development error overlay
- `@replit/vite-plugin-cartographer` - Code navigation
- `@replit/vite-plugin-dev-banner` - Development environment banner

**Environment Variables Required**:
```
DATABASE_URL (optional - for PostgreSQL if needed)
OTX_API_KEY (recommended - AlienVault OTX)
VIRUSTOTAL_API_KEY (recommended - VirusTotal)
ABUSECH_AUTH_KEY (recommended - Abuse.ch MalwareBazaar)
PHISHTANK_API_KEY (optional - better rate limits)
```

### API Key Setup Instructions

**Currently Working (No API Key Required)**:
✓ **NVD CVEs** - Fetching latest CVE data from NIST
✓ **CISA KEV** - Fetching known exploited vulnerabilities  
✓ **Abuse.ch URLhaus** - Public malicious URL feed
✓ **Abuse.ch ThreatFox** - Public IOC feed

**Requires API Keys (Optional but Recommended)**:

1. **AlienVault OTX** (`OTX_API_KEY`):
   - Sign up at: https://otx.alienvault.com/
   - Navigate to your profile dashboard
   - Find your "OTX KEY" in the top right corner
   - Add to environment variables: `OTX_API_KEY=your_key_here`
   - Benefits: Access to threat pulses and indicators (10,000 requests/hour)

2. **VirusTotal** (`VIRUSTOTAL_API_KEY`):
   - Sign up at: https://www.virustotal.com/
   - Go to: https://www.virustotal.com/gui/my-apikey
   - Copy your API key
   - Add to environment variables: `VIRUSTOTAL_API_KEY=your_key_here`
   - Benefits: File/URL/domain reputation checks

3. **Abuse.ch MalwareBazaar** (`ABUSECH_AUTH_KEY`):
   - Register at: https://auth.abuse.ch/
   - Login using X (Twitter), LinkedIn, Google, or GitHub
   - Generate your Auth-Key in the profile "Optional" section
   - Add to environment variables: `ABUSECH_AUTH_KEY=your_key_here`
   - Benefits: Access to recent malware samples (free for commercial and non-commercial use)

4. **PhishTank** (`PHISHTANK_API_KEY`) - Optional:
   - Register at: https://www.phishtank.com/api_register.php
   - Benefits: Better rate limits for phishing domain lookups

**Monorepo Structure**:
- `/client` - React frontend application
- `/server` - Express backend API
- `/shared` - Shared TypeScript types and schemas
- `/migrations` - Drizzle database migrations (if using PostgreSQL)

### AI Chat Assistant

**Smart Context Filtering System**:
The chat assistant uses a two-stage filtering pipeline to optimize token usage and improve response quality:

1. **Query Analysis** (`server/contextFilter.ts`):
   - Intent Classification: Determines query type (ioc_search, cve_analysis, trend_analysis, specific_lookup, conversation, etc.)
   - Entity Extraction: Extracts CVE IDs, IP addresses, domains, and file hashes using regex patterns
   - Severity/Timeframe Detection: Identifies filtering preferences
   - Conversational Detection: Identifies greetings and casual messages to skip data fetching

2. **Context Filtering**:
   - Specific lookups return only matching CVEs/IOCs (e.g., "CVE-2024-1234" returns just that CVE)
   - IOC searches filter by entity type and threat category
   - Trend analysis queries receive minimal raw data (just stats)
   - Conversational queries skip data fetching entirely
   - Token usage tracked and logged for monitoring

**Query Types Supported**:
- `specific_lookup` - Looking up specific CVE or IOC
- `ioc_search` - Searching for threats by IP, domain, hash
- `cve_analysis` - Vulnerability analysis with severity filtering
- `trend_analysis` - Pattern and statistics queries
- `source_analysis` - Questions about data sources
- `severity_filter` - Filtering by threat severity
- `conversation` - Casual greetings and non-analytical messages
- `general_question` - General security inquiries

**Chat Session Persistence**:
- Chat sessions stored per user in MongoDB (`chatSessions` collection)
- Each session includes title, messages array, and timestamps
- Sessions persist across browser refreshes and login sessions
- API endpoints: GET/POST `/api/chat/sessions`, POST `/api/chat/sessions/:id/messages`

**Conversation Memory**:
- Only last 4 messages sent to OpenAI for context
- Reduces token usage while maintaining conversation coherence
- Full history preserved in database for reference

**Markdown Rendering**:
- AI responses rendered with proper markdown formatting
- `MarkdownRenderer` component at `client/src/components/MarkdownRenderer.tsx`
- Supports headers, lists, code blocks, bold/italic, and inline code
- Used in both ChatAssistant and CVE analysis dialogs

**Benefits**:
- 60-80% token reduction for specific lookups
- Intent-specific system prompts for better responses
- Token usage tracking in API responses
- Persistent chat history per user
- Casual conversation handled without wasting API calls