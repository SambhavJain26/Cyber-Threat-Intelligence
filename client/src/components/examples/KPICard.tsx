import KPICard from '../KPICard';
import { Activity } from 'lucide-react';

export default function KPICardExample() {
  return (
    <div className="p-8 bg-background">
      <KPICard 
        title="Total IOCs"
        value="12,847"
        subtitle="+247 today"
        icon={Activity}
        iconColor="text-primary"
      />
    </div>
  );
}
