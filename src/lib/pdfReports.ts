function openPrintDocument(title: string, bodyHtml: string) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Ative pop-ups para exportar o PDF.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @media print { body { margin: 0; padding: 24px; } .no-print { display: none; } }
    body { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #fff; padding: 40px; line-height: 1.55; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 28px; }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
    .brand span { color: #7c3aed; }
    .meta { text-align: right; font-size: 11px; color: #64748b; }
    h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #475569; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px dashed #f1f5f9; }
    .row:last-child { border-bottom: none; }
    .full { grid-column: span 2; }
    .clinical { white-space: pre-line; font-size: 13px; color: #334155; background: #f1f5f9; padding: 12px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; }
    .no-print { margin-top: 24px; text-align: center; }
    button { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  ${bodyHtml}
  <div class="no-print"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
  <script>window.onload = () => setTimeout(() => window.print(), 400);</script>
</body>
</html>`);
  win.document.close();
}

export interface AssessmentPdfData {
  studentName: string;
  trainerName: string;
  date: string;
  imc: number;
  bodyFat?: number;
  anamnesis?: string;
  measurements?: Record<string, string | number | undefined>;
}

export function exportAssessmentPdf(data: AssessmentPdfData) {
  const measureRows = data.measurements
    ? Object.entries(data.measurements)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `<div class="row"><span>${k}</span><strong>${v}</strong></div>`)
        .join('')
    : '';

  openPrintDocument(
    `Avaliação Física — ${data.studentName}`,
    `
    <div class="header">
      <div class="brand">AXXOS<span>FIT</span></div>
      <div class="meta">Data: ${data.date}<br/>Personal: ${data.trainerName}</div>
    </div>
    <h1>Laudo de Avaliação Física</h1>
    <p class="subtitle">Aluno: ${data.studentName}</p>
    <div class="grid">
      <div class="card"><h3>Composição</h3>
        <div class="row"><span>IMC</span><strong>${data.imc.toFixed(1)}</strong></div>
        ${data.bodyFat !== undefined ? `<div class="row"><span>% Gordura</span><strong>${data.bodyFat}%</strong></div>` : ''}
      </div>
      ${measureRows ? `<div class="card full"><h3>Medidas corporais (cm)</h3>${measureRows}</div>` : ''}
      ${data.anamnesis ? `<div class="card full"><h3>Anamnese</h3><div class="clinical">${data.anamnesis}</div></div>` : ''}
    </div>
    <div class="footer">Documento gerado pela plataforma AxxosFit · Uso profissional</div>
    `
  );
}

export interface FinancialPdfRow {
  name: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

export interface FinancialPdfData {
  trainerName: string;
  periodLabel: string;
  totalReceived: number;
  totalPending: number;
  rows: FinancialPdfRow[];
}

export function exportFinancialPdf(data: FinancialPdfData) {
  const rows = data.rows
    .map(
      (r) =>
        `<tr><td>${r.name}</td><td>${r.type}</td><td>${r.date}</td><td>R$ ${r.amount.toFixed(2)}</td><td>${r.status}</td></tr>`
    )
    .join('');

  openPrintDocument(
    `Relatório Financeiro — ${data.trainerName}`,
    `
    <div class="header">
      <div class="brand">AXXOS<span>FIT</span></div>
      <div class="meta">${data.periodLabel}<br/>Personal: ${data.trainerName}</div>
    </div>
    <h1>Relatório Financeiro</h1>
    <p class="subtitle">Mensalidades e cobranças de alunos</p>
    <div class="grid">
      <div class="card"><h3>Recebido</h3><div class="row"><span>Total confirmado</span><strong>R$ ${data.totalReceived.toFixed(2)}</strong></div></div>
      <div class="card"><h3>Pendente</h3><div class="row"><span>A receber</span><strong>R$ ${data.totalPending.toFixed(2)}</strong></div></div>
    </div>
    <div class="card full">
      <h3>Transações</h3>
      <table>
        <thead><tr><th>Aluno</th><th>Tipo</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Nenhuma transação</td></tr>'}</tbody>
      </table>
    </div>
    <div class="footer">Documento gerado pela plataforma AxxosFit · Cobranças de alunos apenas</div>
    `
  );
}
