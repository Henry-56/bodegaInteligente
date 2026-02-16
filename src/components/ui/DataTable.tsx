"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  /** Unique key that identifies this column */
  key: string;
  /** Header label displayed in the table head */
  header: string;
  /** Render function for cell content. Receives the row data. */
  render: (row: T) => ReactNode;
  /** Optional class name applied to both th and td */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** A function that returns a unique key for each row */
  rowKey: (row: T, index: number) => string | number;
  /** Message or element to display when data is empty */
  emptyMessage?: ReactNode;
  /** Optional className for the wrapper */
  className?: string;
  /** Optional callback when a row is clicked */
  onRowClick?: (row: T) => void;
}

function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "No hay datos para mostrar.",
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-gray-200",
        className
      )}
    >
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors hover:bg-gray-50",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-gray-700",
                      col.className
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
