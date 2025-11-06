import { Activity, Radio, AlertTriangle, Globe } from "lucide-react";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardStats, recentThreats, threatTrends } from "@/data/mockData";

export default function Dashboard() {
  const threatColumns = [
    { key: "ioc", label: "IOC", width: "30%" },
    { key: "type", label: "Type", width: "20%" },
    { key: "severity", label: "Severity", width: "20%" },
    { key: "time", label: "Time", width: "30%" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Overview of your cyber threat intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total IOCs"
          value={dashboardStats.totalIOCs.value.toLocaleString()}
          subtitle={dashboardStats.totalIOCs.change}
          icon={Activity}
          iconColor="text-blue-500"
        />
        <KPICard
          title="New Feeds"
          value={dashboardStats.newFeeds.value}
          subtitle={dashboardStats.newFeeds.change}
          icon={Radio}
          iconColor="text-green-500"
        />
        <KPICard
          title="Critical CVEs"
          value={dashboardStats.criticalCVEs.value}
          subtitle={dashboardStats.criticalCVEs.change}
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <KPICard
          title="Phishing Domains"
          value={dashboardStats.phishingDomains.value}
          subtitle={dashboardStats.phishingDomains.change}
          icon={Globe}
          iconColor="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-section-title-recent-threats">
            Recent Threats
          </h2>
          <DataTable columns={threatColumns} data={recentThreats} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" data-testid="text-section-title-threat-trends">
            Threat Trends (7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--popover))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px"
                }}
              />
              <Line 
                type="monotone" 
                dataKey="threats" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
