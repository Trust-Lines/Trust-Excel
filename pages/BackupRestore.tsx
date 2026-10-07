import React, { useState, useEffect } from 'react';
import {
  getBackupDates,
  getBackupFiles,
  restoreFromBackup,
  restoreFromUpload,
  triggerBackup,
  RESTORABLE_FILE_TYPES,
  type RestoreResult,
} from '../lib/backup';

export default function BackupRestore() {
  // Section A: Server Backup Restore
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [serverResult, setServerResult] = useState<RestoreResult | null>(null);
  const [serverError, setServerError] = useState('');

  // Manual Backup
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  // Section B: Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileType, setUploadFileType] = useState(RESTORABLE_FILE_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<RestoreResult | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setLoadingDates(true);
    getBackupDates()
      .then((d) => { setDates(d); if (d.length > 0) setSelectedDate(d[0]); })
      .catch(() => {})
      .finally(() => setLoadingDates(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) { setFiles([]); return; }
    getBackupFiles(selectedDate)
      .then((f) => {
        const restorable = f.filter((name) =>
          RESTORABLE_FILE_TYPES.some((t) => name === `${t}.xlsx`),
        );
        setFiles(restorable);
        setSelectedFiles(new Set(restorable.map((name) => name.replace('.xlsx', ''))));
      })
      .catch(() => setFiles([]));
  }, [selectedDate]);

  const toggleFile = (fileKey: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileKey)) next.delete(fileKey);
      else next.add(fileKey);
      return next;
    });
  };

  const handleServerRestore = async () => {
    if (!selectedDate) return;
    setRestoring(true);
    setServerResult(null);
    setServerError('');
    try {
      const filesArr = selectedFiles.size > 0 ? Array.from(selectedFiles) : undefined;
      const result = await restoreFromBackup(selectedDate, filesArr);
      setServerResult(result);
    } catch (err: any) {
      setServerError(err.message || 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    setBackupSuccess('');
    setBackupError('');
    try {
      const res = await triggerBackup();
      setBackupSuccess(res.message || 'Backup completed');
      // Refresh dates list
      const newDates = await getBackupDates();
      setDates(newDates);
      if (newDates.length > 0) setSelectedDate(newDates[0]);
    } catch (err: any) {
      setBackupError(err.message || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  const handleUploadRestore = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    setUploadError('');
    try {
      const result = await restoreFromUpload(uploadFile, uploadFileType);
      setUploadResult(result);
    } catch (err: any) {
      setUploadError(err.message || 'Upload restore failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1f2937' }}>
        Backup & Restore
      </h1>

      {/* Manual Backup */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
          Manual Backup
        </h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualBackup}
            disabled={backingUp}
            style={{
              padding: '8px 20px', borderRadius: 6, border: 'none', fontSize: 14, fontWeight: 600,
              background: backingUp ? '#9ca3af' : '#f59e0b', color: '#fff', cursor: backingUp ? 'not-allowed' : 'pointer',
            }}
          >
            {backingUp ? 'Backing up...' : 'Backup Now'}
          </button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Generates all Excel backup files for today
          </span>
        </div>
        {backupSuccess && (
          <div style={{ padding: 12, borderRadius: 6, background: '#f0fdf4', color: '#059669', fontSize: 13, marginTop: 12 }}>
            {backupSuccess}
          </div>
        )}
        {backupError && (
          <div style={{ padding: 12, borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 13, marginTop: 12 }}>
            {backupError}
          </div>
        )}
      </div>

      {/* Section A: Server Backup Restore */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
          Restore from Server Backup
        </h2>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
              Backup Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              disabled={loadingDates}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, minWidth: 180 }}
            >
              {dates.length === 0 && <option value="">No backups available</option>}
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleServerRestore}
            disabled={restoring || !selectedDate || selectedFiles.size === 0}
            style={{
              padding: '8px 20px', borderRadius: 6, border: 'none', fontSize: 14, fontWeight: 600,
              background: restoring ? '#9ca3af' : '#2563eb', color: '#fff', cursor: restoring ? 'not-allowed' : 'pointer',
            }}
          >
            {restoring ? 'Restoring...' : 'Restore Selected'}
          </button>
        </div>

        {files.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {files.map((f) => {
              const key = f.replace('.xlsx', '');
              const checked = selectedFiles.has(key);
              return (
                <label
                  key={f}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 6, border: `1px solid ${checked ? '#2563eb' : '#d1d5db'}`,
                    background: checked ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFile(key)}
                    style={{ accentColor: '#2563eb' }}
                  />
                  {key}
                </label>
              );
            })}
          </div>
        )}

        {serverError && (
          <div style={{ padding: 12, borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
            {serverError}
          </div>
        )}

        {serverResult && <ResultTable result={serverResult} />}
      </div>

      {/* Section B: Upload Excel File */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#374151' }}>
          Restore from Uploaded File
        </h2>

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
              File Type
            </label>
            <select
              value={uploadFileType}
              onChange={(e) => setUploadFileType(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, minWidth: 180 }}
            >
              {RESTORABLE_FILE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 4 }}>
              Excel File
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ fontSize: 13 }}
            />
          </div>

          <button
            onClick={handleUploadRestore}
            disabled={uploading || !uploadFile}
            style={{
              padding: '8px 20px', borderRadius: 6, border: 'none', fontSize: 14, fontWeight: 600,
              background: uploading ? '#9ca3af' : '#059669', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload & Restore'}
          </button>
        </div>

        {uploadError && (
          <div style={{ padding: 12, borderRadius: 6, background: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
            {uploadError}
          </div>
        )}

        {uploadResult && <ResultTable result={uploadResult} />}
      </div>
    </div>
  );
}

function ResultTable({ result }: { result: RestoreResult }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
        Completed in {(result.totalDuration / 1000).toFixed(1)}s
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={thStyle}>File</th>
            <th style={thStyle}>Projects Created</th>
            <th style={thStyle}>Projects Skipped</th>
            <th style={thStyle}>Items Created</th>
            <th style={thStyle}>Items Skipped</th>
            <th style={thStyle}>Errors</th>
          </tr>
        </thead>
        <tbody>
          {result.results.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={tdStyle}>{r.file}</td>
              <td style={{ ...tdStyle, color: r.projectsCreated > 0 ? '#059669' : undefined }}>
                {r.projectsCreated}
              </td>
              <td style={tdStyle}>{r.projectsSkipped}</td>
              <td style={{ ...tdStyle, color: r.itemsCreated > 0 ? '#059669' : undefined }}>
                {r.itemsCreated}
              </td>
              <td style={tdStyle}>{r.itemsSkipped}</td>
              <td style={{ ...tdStyle, color: r.errors.length > 0 ? '#dc2626' : undefined }}>
                {r.errors.length > 0 ? (
                  <details>
                    <summary>{r.errors.length} error(s)</summary>
                    <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
                      {r.errors.map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  </details>
                ) : '0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px', color: '#4b5563',
};
