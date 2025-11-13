import React, { useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { exportAll, importAll } from '../../store/db';
import { toast } from '../../components/Toast';
import { maskEmail } from '../../lib/auth';

export default function SettingsPage() {
  const { prefs, setPrefs, clearAllData, logOut, user } = useStore((s) => ({
    prefs: s.prefs,
    setPrefs: s.setPrefs,
    clearAllData: s.clearAllData,
    logOut: s.logOut,
    user: s.user,
  }));
  const fileRef = useRef(null);

  const handleExport = async () => {
    try {
      const data = await exportAll();
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = 'mirrorme-data.json';
      a.click();
      toast('Data exported!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      toast('Export failed', 'error');
    }
  };

  const handleImport = async (e) => {
    try {
      const text = await e.target.files[0].text();
      await importAll(JSON.parse(text));
      toast('Data imported!', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      console.error('Import error:', error);
      toast('Import failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete all data? This cannot be undone.')) {
      await clearAllData();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-bold gradient-text mb-2">Account</h3>
        <p className="text-sm text-slate-400">
          Signed in as{' '}
          <span className="text-slate-200 font-medium">
            {maskEmail(user?.email)}
          </span>
        </p>
        <Button variant="secondary" className="w-full" onClick={logOut}>
          Log Out
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-bold gradient-text mb-4">Accessibility</h3>
        <Row
          label="Reduce Motion"
          checked={prefs.reduceMotion}
          onChange={(v) => setPrefs({ reduceMotion: v })}
        />
        <Row
          label="High Contrast"
          checked={prefs.highContrast}
          onChange={(v) => setPrefs({ highContrast: v })}
        />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-bold gradient-text mb-4">Privacy & Data</h3>
        <Button variant="primary" onClick={handleExport} className="w-full">
          📥 Export Data
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleImport}
        />
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => fileRef.current?.click()}
        >
          📤 Import Data
        </Button>
        <Button variant="danger" className="w-full" onClick={handleDelete}>
          🗑️ Delete All Data
        </Button>
      </Card>

      <div className="text-center opacity-60 text-sm text-slate-400 p-4 rounded-2xl glass">
        ⚠️ MirrorMe gives cosmetic tips only. Not medical advice.
      </div>
    </div>
  );
}

function Row({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between py-3 px-2 rounded-xl glass border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer">
      <span className="font-medium text-slate-200">{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </label>
  );
}

