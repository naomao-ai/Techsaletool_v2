import React, { useState, useEffect } from 'react';
import { History, X, User } from 'lucide-react';

interface ChangelogEntry {
  userId: string;
  userName: string;
  action: string;
  timestamp: number;
}

interface ChangelogViewerProps {
  onClose: () => void;
  dbPath: string;
}

export default function ChangelogViewer({ onClose, dbPath }: ChangelogViewerProps) {
  const [logs, setLogs] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      // @ts-ignore
      const isTauri = window.__TAURI_INTERNALS__;
      if (!isTauri || !dbPath) return;

      setLoading(true);
      try {
        // @ts-ignore
        const { invoke } = await import('@tauri-apps/api/core');
        const now = new Date();
        const dateStr = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0')
        ].join('-');

        const dailyLogs: ChangelogEntry[] = await invoke('read_changelog', { projectPath: dbPath, dateStr });
        setLogs(dailyLogs.reverse()); // Show newest first
      } catch (err) {
        console.error('Failed to read changelog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [dbPath]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[9000] flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-outline-variant rounded-xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col animate-fade-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-outline-variant bg-brand-surface-lowest rounded-t-xl">
          <div className="flex items-center gap-2 text-brand-on-surface">
            <History className="w-5 h-5 text-brand-primary" />
            <h2 className="font-bold font-title-md">작업 이력 (실시간 포렌식)</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-surface-high rounded-lg transition-colors text-brand-outline-variant hover:text-brand-on-surface cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-brand-surface space-y-3">
          {loading ? (
            <p className="text-center text-sm text-brand-outline-variant p-4">분석 중...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-sm text-brand-outline-variant p-4">오늘 기록된 변경 내역이 없습니다.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-4 p-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-surface-high flex items-center justify-center text-brand-primary shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-brand-on-surface truncate">{log.userName}</span>
                    <span className="text-[10px] text-brand-on-surface-variant font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-brand-on-surface-variant break-words">{log.action}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
