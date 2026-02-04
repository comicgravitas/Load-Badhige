import React from 'react';
import { GoogleSheetsService } from '../services/googleSheets';
import { Settings as SettingsIcon, ExternalLink, Info, ShieldCheck, Lock } from 'lucide-react';

interface SettingsProps {
  onSave: () => void;
}

const Settings: React.FC<SettingsProps> = () => {
  const url = GoogleSheetsService.getScriptUrl();
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-zinc-950 p-10 rounded-[2.5rem] shadow-2xl border border-zinc-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
            <SettingsIcon className="w-32 h-32 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-100 mb-8 flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/40">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          Cloud Settings
        </h2>
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                Active Endpoint
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
              </label>
              <span className="flex items-center gap-1 text-[10px] font-black text-zinc-700 uppercase">
                <Lock className="w-3 h-3" />
                Locked by Admin
              </span>
            </div>
            <div className="relative group">
              <input
                type="text"
                readOnly
                className="w-full px-6 py-5 bg-black border border-zinc-900 rounded-[1.5rem] focus:outline-none font-mono text-sm text-zinc-700 cursor-not-allowed"
                value={url}
              />
            </div>
            <div className="flex items-start gap-2 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mt-4">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-indigo-200 leading-relaxed">
                The connection is currently fixed to the production deployment. All transactions are securely synchronized with the primary Google Sheet database.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black p-10 rounded-[2.5rem] border border-zinc-900 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <ExternalLink className="w-5 h-5 text-indigo-500" />
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-zinc-900">1</div>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Data is stored in the <strong className="text-zinc-100">"Transcations"</strong> tab of the linked sheet.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-zinc-900">2</div>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Dashboard charts refresh automatically on new entries.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-zinc-900">3</div>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">History can be exported via the <strong className="text-zinc-100">History</strong> tab.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-black text-indigo-500 border border-zinc-900">4</div>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">Local currency is set to <strong className="text-indigo-500">Maldivian Rufiyaa (MVR)</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;