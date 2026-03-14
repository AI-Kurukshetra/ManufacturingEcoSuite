"use client";

interface CsvExportButtonProps {
  filename: string;
  rows: Array<Record<string, string | number | null>>;
}

export function CsvExportButton({ filename, rows }: CsvExportButtonProps) {
  return (
    <button
      type="button"
      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
      onClick={() => {
        const headers = Object.keys(rows[0] ?? {});
        const csv = [
          headers.join(","),
          ...rows.map((row) =>
            headers
              .map((header) => JSON.stringify(row[header] ?? ""))
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }}
    >
      Export CSV
    </button>
  );
}
