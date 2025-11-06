import { Badge } from "@/components/ui/badge";

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  renderCell?: (key: string, value: any, row: any) => React.ReactNode;
}

export default function DataTable({ columns, data, onRowClick, renderCell }: DataTableProps) {
  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      Critical: "bg-destructive text-destructive-foreground",
      High: "bg-amber-500 text-white",
      Medium: "bg-yellow-600 text-white",
      Low: "bg-blue-500 text-white"
    };
    return colors[severity] || "bg-secondary text-secondary-foreground";
  };

  const defaultRenderCell = (key: string, value: any, row: any) => {
    if (key === "severity") {
      return (
        <Badge className={`${getSeverityColor(value)} no-default-hover-elevate no-default-active-elevate`}>
          {value}
        </Badge>
      );
    }
    return value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full" data-testid="table-data">
        <thead className="border-b border-border">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-sm font-semibold text-foreground"
                style={{ width: col.width }}
                data-testid={`table-header-${col.key}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-border hover-elevate cursor-pointer"
              onClick={() => onRowClick?.(row)}
              data-testid={`table-row-${idx}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-sm"
                  data-testid={`table-cell-${col.key}-${idx}`}
                >
                  {renderCell ? renderCell(col.key, row[col.key], row) : defaultRenderCell(col.key, row[col.key], row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
