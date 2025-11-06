import DataTable from '../DataTable';

export default function DataTableExample() {
  const columns = [
    { key: "ioc", label: "IOC", width: "30%" },
    { key: "type", label: "Type", width: "20%" },
    { key: "severity", label: "Severity", width: "20%" },
    { key: "time", label: "Time", width: "30%" }
  ];

  const data = [
    { ioc: "malicious-site.com", type: "Domain", severity: "Critical", time: "2:32:00 PM" },
    { ioc: "192.168.1.100", type: "IP Address", severity: "High", time: "1:46:00 PM" },
    { ioc: "evil.exe", type: "File Hash", severity: "Medium", time: "12:16:00 PM" }
  ];

  return (
    <div className="p-8 bg-background">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
