import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { TimelineConfig, Column } from '../types';

interface TimelineConfigModalProps {
  currentConfig: TimelineConfig | undefined;
  columns: Column[];
  onSave: (config: TimelineConfig) => void;
  onClose: () => void;
}

export default function TimelineConfigModal({ currentConfig, columns, onSave, onClose }: TimelineConfigModalProps) {
  const dateColumns = columns.filter(c => c.type === 'date');
  const textColumns = columns.filter(c => c.type === 'text' || c.id === 'title');
  const checkboxColumns = columns.filter(c => c.type === 'checkbox');
  const allLabelColumns = columns.filter(c => c.type === 'text' || c.id === 'title');

  const [config, setConfig] = useState<TimelineConfig>(currentConfig || {
    targetColId: dateColumns.find(c => c.id === 'kl_date')?.id || dateColumns[0]?.id || '',
    baseColId: dateColumns.find(c => c.id === 'quote_date')?.id || dateColumns[0]?.id || '',
    titleColId: textColumns.find(c => c.id === 'title')?.id || textColumns[0]?.id || '',
    checkboxColId: checkboxColumns.find(c => c.id === 'show_in_timeline')?.id || checkboxColumns[0]?.id || '',
    manualStartDate: null,
    manualEndDate: null,
    showBaseDate: true,
    showBackgroundEvents: false,
    diffUnit: 'month',
    extraLabelColId: null
  });

  const [manualStart, setManualStart] = useState<boolean>(!!config.manualStartDate);
  const [manualEnd, setManualEnd] = useState<boolean>(!!config.manualEndDate);

  const handleSave = () => {
    onSave({
      ...config,
      manualStartDate: manualStart ? config.manualStartDate : null,
      manualEndDate: manualEnd ? config.manualEndDate : null
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-100">타임라인 설정</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* === 데이터 매핑 === */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">데이터 매핑</div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">표시 기준 열 (예: K/L)</label>
            <select
              value={config.targetColId}
              onChange={e => setConfig(prev => ({ ...prev, targetColId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {dateColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">베이스 기준 열 (예: 견적일)</label>
            <select
              value={config.baseColId}
              onChange={e => setConfig(prev => ({ ...prev, baseColId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {dateColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">호선(라벨) 열</label>
            <select
              value={config.titleColId}
              onChange={e => setConfig(prev => ({ ...prev, titleColId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              {textColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">추가 표시 열 (호선 옆에 병기)</label>
            <select
              value={config.extraLabelColId || ''}
              onChange={e => setConfig(prev => ({ ...prev, extraLabelColId: e.target.value || null }))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">(없음)</option>
              {allLabelColumns.filter(c => c.id !== config.titleColId).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">표시 필터 열 (체크박스)</label>
            <select
              value={config.checkboxColId}
              onChange={e => setConfig(prev => ({ ...prev, checkboxColId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">(사용 안함 - 전체 표시)</option>
              {checkboxColumns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <hr className="border-slate-700/50" />
          
          {/* === 표시 옵션 === */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">표시 옵션</div>
          
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.showBaseDate} 
              onChange={e => setConfig(prev => ({ ...prev, showBaseDate: e.target.checked }))} 
              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/20" 
            />
            본함 견적일 마커 표시
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={config.showBackgroundEvents} 
              onChange={e => setConfig(prev => ({ ...prev, showBackgroundEvents: e.target.checked }))} 
              className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/20" 
            />
            배경 이벤트 표시 (코로나19, 우크라이나 전쟁 등)
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">개월수 차이 표시 단위</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer">
                <input type="radio" name="diffUnit" value="month" checked={config.diffUnit === 'month'} onChange={() => setConfig(prev => ({ ...prev, diffUnit: 'month' }))} className="text-cyan-500 focus:ring-cyan-500/20" />
                월 (Month)
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer">
                <input type="radio" name="diffUnit" value="year" checked={config.diffUnit === 'year'} onChange={() => setConfig(prev => ({ ...prev, diffUnit: 'year' }))} className="text-cyan-500 focus:ring-cyan-500/20" />
                연 (Year)
              </label>
            </div>
          </div>

          <hr className="border-slate-700/50" />
          
          {/* === 범위 설정 === */}
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">범위 설정</div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <input type="checkbox" checked={manualStart} onChange={e => setManualStart(e.target.checked)} className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/20" />
              시작 시점 수동 설정
            </label>
            {manualStart && (
              <input
                type="date"
                value={config.manualStartDate || ''}
                onChange={e => setConfig(prev => ({ ...prev, manualStartDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <input type="checkbox" checked={manualEnd} onChange={e => setManualEnd(e.target.checked)} className="rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/20" />
              종료 시점 수동 설정
            </label>
            {manualEnd && (
              <input
                type="date"
                value={config.manualEndDate || ''}
                onChange={e => setConfig(prev => ({ ...prev, manualEndDate: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-700/50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">취소</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg transition-colors">
            <Save className="w-4 h-4" /> 저장
          </button>
        </div>
      </div>
    </div>
  );
}
