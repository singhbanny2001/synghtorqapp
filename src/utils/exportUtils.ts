export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const escapeCell = (val: string) => {
    const escaped = String(val).replace(/"/g, '""');
    return `"${escaped}"`;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printTableAsPDF(title: string, headers: string[], rows: string[][]): void {
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join('')}</tr>`,
    )
    .join('');
  const headerRow = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:99999;';
  iframe.title = 'Print Preview';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; white-space: nowrap; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <table>${headerRow}${tableRows}</table>
</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 400);
  };

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true });
  // Fallback cleanup in case afterprint doesn't fire
  setTimeout(() => {
    if (iframe.parentNode && !iframe.contentWindow?.document?.querySelector('html')) {
      document.body.removeChild(iframe);
    }
  }, 120000); // 2 min fallback
}