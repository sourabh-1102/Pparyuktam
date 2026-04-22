"use client";

import { ReactNode } from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
}

export default function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center border border-dashed rounded-lg text-slate-500">
         No data available.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 uppercase">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-4 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={keyExtractor(row)} className="border-b last:border-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  {typeof col.accessor === "function" ? col.accessor(row) : (row[col.accessor] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
