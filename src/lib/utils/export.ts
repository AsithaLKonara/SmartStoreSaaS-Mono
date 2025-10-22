/**
 * Data Export Utilities
 */

export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  data: any[];
  columns?: string[];
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  const headers = columns || Object.keys(data[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download exported data
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export to CSV and download
 */
export function exportAndDownloadCSV(data: any[], filename: string, columns?: string[]) {
  const csv = exportToCSV(data, columns);
  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

/**
 * Export to JSON and download
 */
export function exportAndDownloadJSON(data: any[], filename: string) {
  const json = exportToJSON(data);
  downloadFile(json, `${filename}.json`, 'application/json');
}

/**
 * Parse CSV file
 */
export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    data.push(row);
  }

  return data;
}

/**
 * Bulk import validation
 */
export function validateImportData(data: any[], requiredFields: string[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('No data to import');
    return { isValid: false, errors };
  }

  // Check required fields
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (const field of requiredFields) {
      if (!row[field] || row[field] === '') {
        errors.push(`Row ${i + 1}: Missing required field "${field}"`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

