import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
}

export default function KPICard({ title, value, subtitle, icon: Icon, iconColor = "text-primary" }: KPICardProps) {
  return (
    <Card className="p-6" data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium mb-2" data-testid={`text-kpi-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-1" data-testid={`text-kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground" data-testid={`text-kpi-subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {subtitle}
          </p>
        </div>
        <div className={`${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}
