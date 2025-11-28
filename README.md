# CTI Aggregator - Cyber Threat Intelligence Platform

A full-stack web application for aggregating and analyzing cyber threat intelligence data from multiple sources, powered by AI analysis.

## Prerequisites

Before running this application locally on Windows, ensure you have the following installed:

### 1. Node.js (v20 or higher)

1. Download Node.js from the official website: https://nodejs.org/
2. Choose the LTS (Long Term Support) version (v20.x or higher)
3. Run the installer and follow the installation wizard
4. Verify installation by opening Command Prompt or PowerShell and running:
   ```bash
   node --version
   npm --version
   ```

### 2. MongoDB

You have two options for MongoDB:

#### Option A: Install MongoDB Locally (Recommended for Development)

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Choose "Windows" as your platform and download the MSI installer
3. Run the installer:
   - Choose "Complete" installation
   - Check "Install MongoDB as a Service" (recommended)
   - Optionally install MongoDB Compass (GUI tool)
4. Verify installation by opening Command Prompt and running:
   ```bash
   mongod --version
   ```
5. MongoDB should start automatically as a Windows service. If not, you can start it manually:
   ```bash
   net start MongoDB
   ```

#### Option B: Use MongoDB Atlas (Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a new cluster (free tier is available)
3. Create a database user with read/write permissions
4. Get your connection string from the Atlas dashboard
5. Use this connection string in your `.env` file (see Environment Variables section)

### 3. Git (for cloning the repository)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Verify installation:
   ```bash
   git --version
   ```

## Removing Replit-Specific Files (For Local Development)

If you cloned this project from Replit and want to run it locally without Replit dependencies, follow these steps:

### Step 1: Delete Replit Configuration Files

Delete the following files from your project root:

```bash
# On Windows (Command Prompt)
del .replit
del replit.md

# On Windows (PowerShell)
Remove-Item .replit
Remove-Item replit.md

# On macOS/Linux
rm .replit replit.md
```

These files are:
- `.replit` - Replit-specific configuration for running the app on their platform
- `replit.md` - Documentation specific to the Replit environment
- `design_guidelines.md` (optional) - Design guidelines used by Replit's AI agent

```bash
# Optional: Also delete design_guidelines.md
del design_guidelines.md   # Windows Command Prompt
Remove-Item design_guidelines.md   # Windows PowerShell
rm design_guidelines.md   # macOS/Linux
```

### Step 2: Update vite.config.ts

Replace the contents of `vite.config.ts` with this local-friendly version that removes Replit plugin dependencies:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### Step 3: Remove Replit Packages from package.json

Open `package.json` and remove these Replit-specific packages from the `devDependencies` section:

```json
"@replit/vite-plugin-cartographer": "^0.4.1",
"@replit/vite-plugin-dev-banner": "^0.1.1",
"@replit/vite-plugin-runtime-error-modal": "^0.0.3",
```

After editing, your `devDependencies` should look like this (without the Replit packages):

```json
"devDependencies": {
  "@tailwindcss/typography": "^0.5.15",
  "@tailwindcss/vite": "^4.1.3",
  "@types/connect-pg-simple": "^7.0.3",
  "@types/express": "4.17.21",
  "@types/express-session": "^1.18.0",
  "@types/node": "20.16.11",
  "@types/passport": "^1.0.16",
  "@types/passport-local": "^1.0.38",
  "@types/react": "^18.3.11",
  "@types/react-dom": "^18.3.1",
  "@types/ws": "^8.5.13",
  "@vitejs/plugin-react": "^4.7.0",
  "autoprefixer": "^10.4.20",
  "esbuild": "^0.25.0",
  "postcss": "^8.4.47",
  "tailwindcss": "^3.4.17",
  "tsx": "^4.20.5",
  "typescript": "5.6.3",
  "vite": "^5.4.20"
}
```

### Step 4: Clean Install Dependencies

After making the above changes, delete `node_modules` and `package-lock.json`, then reinstall:

```bash
# On Windows (Command Prompt)
rmdir /s /q node_modules
del package-lock.json
npm install

# On Windows (PowerShell)
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# On macOS/Linux
rm -rf node_modules package-lock.json
npm install
```

### Step 5: Verify the Changes

Run the application to ensure everything works:

```bash
npm run dev
```

The application should start without any Replit-related errors.

---

## Installation Steps

### Step 1: Clone the Repository

Open Command Prompt or PowerShell and run:

```bash
git clone <your-repository-url>
cd <repository-folder-name>
```

Or download the ZIP file from GitHub and extract it to your desired location.

### Step 2: Install Dependencies

Navigate to the project folder and install all required packages:

```bash
npm install
```

This may take a few minutes to complete.

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory of the project. You can do this by:

1. Open the project folder in File Explorer
2. Right-click and create a new text file
3. Rename it to `.env` (remove the `.txt` extension)
4. Open it with a text editor (Notepad, VS Code, etc.)

Add the following environment variables to your `.env` file:

```env
# Required Variables
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here

# MongoDB Configuration (optional - defaults shown)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=cti_aggregator

# Server Port (optional - defaults to 5000)
PORT=5000

# Threat Intelligence API Keys (optional - for full functionality)
OTX_API_KEY=your-otx-api-key
VIRUSTOTAL_API_KEY=your-virustotal-api-key
ABUSECH_AUTH_KEY=your-abusech-auth-key
```

#### How to Get API Keys:

**JWT_SECRET:**
- Generate a random secure string. You can use any random string generator or create your own
- Example: `my-super-secret-key-12345` (use something more complex in production)

**OPENAI_API_KEY (Required):**
1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key and copy it

**OTX_API_KEY (Optional - AlienVault OTX):**
1. Go to https://otx.alienvault.com/
2. Create a free account
3. Go to Settings > API Integration
4. Copy your API key

**VIRUSTOTAL_API_KEY (Optional):**
1. Go to https://www.virustotal.com/
2. Create a free account
3. Go to your profile settings
4. Copy your API key

**ABUSECH_AUTH_KEY (Optional):**
1. Go to https://abuse.ch/
2. Register for their services
3. Obtain your authentication key

### Step 4: Start MongoDB (if using local installation)

If MongoDB is not running as a service, start it manually:

```bash
# Open a new Command Prompt window and run:
mongod
```

Keep this window open while running the application.

### Step 5: Run the Application

#### Development Mode (with hot-reload):

```bash
npm run dev
```

#### Production Mode:

First, build the application:
```bash
npm run build
```

Then start the server:
```bash
npm run start
```

### Step 6: Access the Application

Open your web browser and navigate to:

```
http://localhost:5000
```

You should see the login page of the CTI Aggregator application.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server with hot-reload |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server |
| `npm run check` | Runs TypeScript type checking |

## Project Structure

```
project-root/
├── attached_assets/     # Static assets (images, etc.)
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── index.html
├── server/              # Backend Express server
│   ├── db/              # Database configuration (MongoDB)
│   ├── middleware/      # Express middleware (auth, etc.)
│   ├── routes.ts        # API routes
│   ├── openaiService.ts # OpenAI integration
│   ├── threatIntelFetcher.ts # Threat intelligence fetching
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
├── .dockerignore        # Files to exclude from Docker builds
├── .env                 # Environment variables (create this)
├── .gitignore           # Git ignore rules
├── components.json      # Shadcn UI configuration
├── docker-compose.yaml  # Production Docker Compose config
├── docker-compose.dev.yaml # Development Docker Compose config
├── Dockerfile           # Production Docker build
├── Dockerfile.dev       # Development Docker build
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite bundler configuration
└── README.md            # This file

# Files to remove for local development (Replit-specific):
# - .replit
# - replit.md
# - design_guidelines.md (optional)
```

---

## Docker Deployment

Docker provides a consistent, isolated environment to run the CTI Aggregator application. This section covers both production and development Docker setups.

### Prerequisites for Docker

1. **Docker Desktop** (Windows/macOS) or **Docker Engine** (Linux)
   - Download from: https://www.docker.com/products/docker-desktop/
   - For Windows, enable WSL 2 backend for better performance
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

2. **Environment Variables**
   - Create a `.env` file in the project root (see Environment Variables section above)

### Docker Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Production build (multi-stage, optimized) |
| `Dockerfile.dev` | Development build (with hot-reload support) |
| `docker-compose.yaml` | Production deployment with MongoDB |
| `docker-compose.dev.yaml` | Development deployment with volume mounts |
| `.dockerignore` | Files to exclude from Docker builds |

---

### Quick Start with Docker (Production)

1. **Create Environment File**

   Create a `.env` file in the project root:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Optional threat intel API keys
   OTX_API_KEY=your-otx-api-key
   VIRUSTOTAL_API_KEY=your-virustotal-api-key
   ABUSECH_AUTH_KEY=your-abusech-auth-key
   ```

2. **Build and Start Containers**

   ```bash
   # Build and start all services in detached mode
   docker-compose up -d --build

   # View logs
   docker-compose logs -f

   # View logs for specific service
   docker-compose logs -f app
   docker-compose logs -f mongodb
   ```

3. **Access the Application**

   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

4. **Stop Containers**

   ```bash
   # Stop all services
   docker-compose down

   # Stop and remove volumes (clears database)
   docker-compose down -v
   ```

---

### Development with Docker

For development with hot-reload support:

1. **Start Development Environment**

   ```bash
   # Build and start development containers
   docker-compose -f docker-compose.dev.yaml up -d --build

   # View logs
   docker-compose -f docker-compose.dev.yaml logs -f
   ```

2. **Development Features**
   - Source code is mounted as volumes
   - Changes to `client/`, `server/`, and `shared/` directories are reflected immediately
   - Hot-reload is enabled for faster development

3. **Stop Development Environment**

   ```bash
   docker-compose -f docker-compose.dev.yaml down
   ```

---

### Docker Commands Reference

#### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart app

# View running containers
docker-compose ps

# View container logs
docker-compose logs -f [service_name]

# Execute command in running container
docker-compose exec app sh
docker-compose exec mongodb mongosh
```

#### Image Management

```bash
# Rebuild images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Remove unused images
docker image prune -f
```

#### Volume Management

```bash
# List volumes
docker volume ls

# Remove all project volumes (WARNING: deletes database data)
docker-compose down -v

# Backup MongoDB data
docker-compose exec mongodb mongodump --out /data/backup

# View volume details
docker volume inspect cti-aggregator_mongodb_data
```

---

### Docker Configuration Details

#### Production Dockerfile Features

- **Multi-stage build**: Separates build and runtime for smaller images
- **Alpine base**: Uses lightweight Node.js Alpine image
- **Non-root user**: Runs application as non-root for security
- **Health checks**: Built-in health monitoring
- **Optimized layers**: Dependencies cached separately from source code

#### Docker Compose Services

| Service | Description | Port |
|---------|-------------|------|
| `app` | CTI Aggregator application | 5000 |
| `mongodb` | MongoDB 7.0 database | 27017 |

#### Environment Variables in Docker

Environment variables are passed from your `.env` file to containers via docker-compose. The following are used:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `OTX_API_KEY` | No | AlienVault OTX API key |
| `VIRUSTOTAL_API_KEY` | No | VirusTotal API key |
| `ABUSECH_AUTH_KEY` | No | Abuse.ch authentication key |

---

### Docker Troubleshooting

#### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- On Linux, check if the Docker service is started: `sudo systemctl start docker`

#### "Port 5000 already in use"
- Stop any existing services using port 5000
- Or modify the port mapping in `docker-compose.yaml`:
  ```yaml
  ports:
    - "3000:5000"  # Maps to localhost:3000
  ```

#### "MongoDB connection refused"
- Wait for MongoDB to fully start (check with `docker-compose logs mongodb`)
- Ensure the MongoDB container is healthy: `docker-compose ps`

#### "Build failed - npm install error"
- Clear Docker build cache: `docker-compose build --no-cache`
- Ensure you have a stable internet connection

#### Container keeps restarting
- Check container logs: `docker-compose logs app`
- Verify all required environment variables are set in `.env`

#### "Health check failed"
- The health check endpoint is `/api/health`
- Wait for the application to fully start (30s grace period)
- Check application logs for startup errors

---

### Advanced: Building Individual Images

```bash
# Build production image only
docker build -t cti-aggregator:latest .

# Build development image only
docker build -f Dockerfile.dev -t cti-aggregator:dev .

# Run production image standalone (requires external MongoDB)
docker run -d \
  -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e MONGODB_DB_NAME=cti_aggregator \
  -e JWT_SECRET=your-secret \
  -e OPENAI_API_KEY=your-key \
  --name cti-app \
  cti-aggregator:latest
```

---

### Using Docker with MongoDB Atlas

If you prefer using MongoDB Atlas instead of the containerized MongoDB:

1. **Modify docker-compose.yaml**

   Comment out or remove the `mongodb` service and update the `app` service:

   ```yaml
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       container_name: cti-app
       restart: unless-stopped
       environment:
         - NODE_ENV=production
         - PORT=5000
         - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
         - MONGODB_DB_NAME=cti_aggregator
         - JWT_SECRET=${JWT_SECRET}
         - OPENAI_API_KEY=${OPENAI_API_KEY}
       ports:
         - "5000:5000"
   ```

2. **Update your `.env` file** with your Atlas connection string

3. **Ensure your IP is whitelisted** in MongoDB Atlas Network Access settings

---

## Troubleshooting

### "MongoDB connection failed"
- Ensure MongoDB is running (`net start MongoDB` or run `mongod`)
- Check if the `MONGODB_URI` in your `.env` file is correct
- If using MongoDB Atlas, ensure your IP is whitelisted

### "OPENAI_API_KEY is required"
- Make sure you have created the `.env` file in the root directory
- Verify the API key is correct and has no extra spaces

### "JWT_SECRET is required"
- Add `JWT_SECRET=your-secret-key` to your `.env` file

### "Port 5000 is already in use"
- Change the `PORT` in your `.env` file to another value (e.g., 3000)
- Or close the application using port 5000

### "cross-env is not recognized"
- Run `npm install` again to ensure all dependencies are installed

### Application not loading in browser
- Ensure the server is running (check the terminal for "serving on port 5000")
- Try clearing your browser cache
- Check for errors in the terminal where you ran `npm run dev`

## Tech Stack

- **Frontend:** React, TailwindCSS, Shadcn UI, React Query
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **AI Integration:** OpenAI API
- **Authentication:** JWT (JSON Web Tokens)
- **Build Tools:** Vite, TypeScript, esbuild

## Support

If you encounter any issues not covered in the troubleshooting section, please:
1. Check the console/terminal for error messages
2. Ensure all environment variables are correctly set
3. Verify all prerequisites are properly installed

## License

MIT License
