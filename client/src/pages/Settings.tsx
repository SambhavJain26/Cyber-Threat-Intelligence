import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsData } from "@/data/mockData";

export default function Settings() {
  const [settings, setSettings] = useState(settingsData);

  const handleSave = () => {
    console.log("Settings saved:", settings);
    alert("Settings saved successfully!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Settings</h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Configure your dashboard and data sources
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            General Settings
          </h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="refresh-interval" className="text-sm font-medium mb-2 block">
                Auto-refresh interval
              </Label>
              <Select 
                value={settings.general.autoRefreshInterval}
                onValueChange={(value) => setSettings({
                  ...settings,
                  general: { ...settings.general, autoRefreshInterval: value }
                })}
              >
                <SelectTrigger id="refresh-interval" data-testid="select-refresh-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 minute">1 minute</SelectItem>
                  <SelectItem value="5 minutes">5 minutes</SelectItem>
                  <SelectItem value="10 minutes">10 minutes</SelectItem>
                  <SelectItem value="30 minutes">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone" className="text-sm font-medium mb-2 block">
                Timezone
              </Label>
              <Select 
                value={settings.general.timezone}
                onValueChange={(value) => setSettings({
                  ...settings,
                  general: { ...settings.general, timezone: value }
                })}
              >
                <SelectTrigger id="timezone" data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="GMT">GMT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="items-per-page" className="text-sm font-medium mb-2 block">
                Items per page
              </Label>
              <Select 
                value={settings.general.itemsPerPage}
                onValueChange={(value) => setSettings({
                  ...settings,
                  general: { ...settings.general, itemsPerPage: value }
                })}
              >
                <SelectTrigger id="items-per-page" data-testid="select-items-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            Notifications
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="critical-threats" className="text-sm font-medium">
                  Critical threats
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Notify when critical threats are detected
                </p>
              </div>
              <Switch 
                id="critical-threats"
                checked={settings.notifications.criticalThreats}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, criticalThreats: checked }
                })}
                data-testid="switch-critical-threats"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="cve-alerts" className="text-sm font-medium">
                  CVE alerts
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Alert for new critical CVEs
                </p>
              </div>
              <Switch 
                id="cve-alerts"
                checked={settings.notifications.cveAlerts}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, cveAlerts: checked }
                })}
                data-testid="switch-cve-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="feed-updates" className="text-sm font-medium">
                  Feed updates
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Notify when threat feeds are updated
                </p>
              </div>
              <Switch 
                id="feed-updates"
                checked={settings.notifications.feedUpdates}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, feedUpdates: checked }
                })}
                data-testid="switch-feed-updates"
              />
            </div>

            <div>
              <Label htmlFor="notification-email" className="text-sm font-medium mb-2 block">
                Notification email
              </Label>
              <Input
                id="notification-email"
                type="email"
                value={settings.notifications.notificationEmail}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, notificationEmail: e.target.value }
                })}
                data-testid="input-notification-email"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            Security
          </h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="session-timeout" className="text-sm font-medium mb-2 block">
                Session timeout
              </Label>
              <Select 
                value={settings.security.sessionTimeout}
                onValueChange={(value) => setSettings({
                  ...settings,
                  security: { ...settings.security, sessionTimeout: value }
                })}
              >
                <SelectTrigger id="session-timeout" data-testid="select-session-timeout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 hour">1 hour</SelectItem>
                  <SelectItem value="4 hours">4 hours</SelectItem>
                  <SelectItem value="8 hours">8 hours</SelectItem>
                  <SelectItem value="24 hours">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="2fa" className="text-sm font-medium">
                  Two-factor authentication
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable 2FA for enhanced security
                </p>
              </div>
              <Switch 
                id="2fa"
                checked={settings.security.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  security: { ...settings.security, twoFactorAuth: checked }
                })}
                data-testid="switch-2fa"
              />
            </div>

            <Button variant="outline" className="w-full" data-testid="button-change-password">
              <span className="text-sm">🔑</span>
              <span className="ml-2">Change Password</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            Threat Intelligence Sources
          </h2>
          <div className="space-y-3">
            {settings.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 rounded-md border border-border"
                data-testid={`source-item-${source.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${source.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-muted-foreground">Last sync: {source.lastSync}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={source.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                >
                  {source.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" data-testid="button-save-settings">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
