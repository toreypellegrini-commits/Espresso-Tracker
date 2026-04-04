// ─── Dialed — Import ───
// CSV import/export functionality.
// Loads after router.js.

// ─── CSV IMPORT ───
function toggleImportPanel() {
  const p = document.getElementById('import-panel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function handleCSVDrop(e) {
  e.preventDefault();
  document.getElementById('import-drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) handleCSVFile(file);
}

async function handleCSVFile(file) {
  if (!file) return;
  const text = await file.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) { showImportResult('No data found in file.', 'error'); return; }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g,''));
  const rows = lines.slice(1);
  let imported = 0, skipped = 0, errors = 0;

  // Map header names to our field names
  const fieldMap = {
    date:'date', roaster:'roaster', roastname:'roastName', origin:'origin', varietal:'varietal',
    process:'process', roastlevel:'roast', roastdate:'roastDate',
    daysoffroast:'daysOffRoast', grinder:'grinderName', grindsetting:'grind',
    doseg:'dose', yieldg:'yield', ratio:'ratio', tempc:'temp',
    preinfusions:'preinfusion', shottimes:'time', rating:'rating', notes:'notes'
  };

  for (const line of rows) {
    if (!line.trim()) continue;
    // Handle quoted fields
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());

    const row = {};
    headers.forEach((h, i) => {
      const field = fieldMap[h];
      if (field) row[field] = cols[i] || '';
    });

    // Need at least a date or roaster
    if (!row.date && !row.roaster) { skipped++; continue; }

    // Parse date
    let dateStr = todayStr();
    if (row.date) {
      try {
        const d = new Date(row.date);
        if (!isNaN(d)) dateStr = d.toISOString().slice(0,10);
      } catch(e) { errors++; continue; }
    }

    const shot = {
      id: Date.now() + imported,
      date: dateStr + 'T12:00:00.000Z',
      roastLibId: null,
      roaster: row.roaster||'',
      roastName: row.roastName||'',
      origin: row.origin||'',
      varietal: row.varietal||'',
      process: row.process||'',
      roast: row.roast||'',
      roastDate: row.roastDate||'',
      daysOffRoast: row.daysOffRoast ? parseInt(row.daysOffRoast) : null,
      grinderName: row.grinderName||'',
      grinderId: null,
      grind: row.grind||'',
      dose: row.dose ? parseFloat(row.dose) : null,
      yield: row.yield ? parseFloat(row.yield) : null,
      ratio: row.ratio ? parseFloat(row.ratio) : null,
      temp: row.temp||'',
      preinfusion: row.preinfusion||'',
      time: row.time||'',
      rating: row.rating ? parseInt(row.rating) : 0,
      notes: row.notes||''
    };

    try {
      const dbRow = await dbInsert('shots', shot);
      shot._db_id = dbRow.id;
      shots.push(shot);
      imported++;
    } catch(e) { errors++; }
  }

  shots.sort((a,b) => new Date(b.date) - new Date(a.date));
  renderMyShots();
  if (currentPage === 'home') renderHome();

  const msg = `Imported ${imported} shot${imported!==1?'s':''}.${skipped?' '+skipped+' skipped (missing data).':''}${errors?' '+errors+' errors.':''}`;
  showImportResult(msg, imported > 0 ? 'success' : 'error');
}

function showImportResult(msg, type) {
  const el = document.getElementById('import-results');
  el.style.display = 'block';
  el.style.color = type === 'error' ? 'var(--danger-text)' : 'var(--success-text)';
  el.textContent = msg;
}

// ─── CSV TEMPLATE DOWNLOAD ───
function downloadImportTemplate() {
  const headers = ['Date','Roaster','Roast Name','Origin','Varietal','Process','Roast Level','Roast Date','Days Off Roast','Grinder','Grind Setting','Dose (g)','Yield (g)','Ratio','Temp (C)','Pre-infusion (s)','Shot Time (s)','Rating','Notes'];
  const example = ['2025-04-01','Onyx Coffee Lab','Tropical Weather','Ethiopia','Heirloom','Washed','Light','2025-03-15','17','Niche Zero','20','18','36','2.0','93','5','28','4','Sweet and floral'];
  const csv = headers.join(',') + '\n' + example.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'dialed-import-template.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── CSV EXPORT ───
function exportShotsCSV() {
  if (!shots.length) { alert('No shots to export.'); return; }
  const headers = ['Date','Roaster','Roast Name','Origin','Varietal','Process','Roast Level','Roast Date','Days Off Roast','Grinder','Grind Setting','Dose (g)','Yield (g)','Ratio','Temp (C)','Pre-infusion (s)','Shot Time (s)','Rating','Notes'];
  const escCSV = v => { const s = String(v ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = shots.map(s => [
    s.date ? s.date.slice(0,10) : '',
    s.roaster || '',
    s.roastName || '',
    s.origin || '',
    s.varietal || '',
    s.process || '',
    s.roast || '',
    s.roastDate || '',
    s.daysOffRoast ?? '',
    s.grinderName || '',
    s.grind || '',
    s.dose ?? '',
    s.yield ?? '',
    s.ratio ?? '',
    s.temp || '',
    s.preinfusion || '',
    s.time || '',
    s.rating || '',
    s.notes || ''
  ].map(escCSV).join(','));
  const csv = headers.join(',') + '\n' + rows.join('\n') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `dialed-shots-${todayStr()}.csv`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



