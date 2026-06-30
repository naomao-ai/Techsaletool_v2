import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConflictModalProps {
  conflicts?: any[];
  onResolve: (strategy: 'mine' | 'theirs' | 'merge', choices?: Record<number, 'local' | 'server'>) => void;
  onCancel: () => void;
}

export default function ConflictModal({ conflicts = [], onResolve, onCancel }: ConflictModalProps) {
  // 1. 사용자 선택 상태 저장 (인덱스 -> 'local' | 'server')
  const [resolutions, setResolutions] = useState<Record<number, 'local' | 'server'>>({});

  const submitResolution = () => {
    onResolve('merge', resolutions);
  };

  // 모든 충돌 항목에 대한 선택이 완료되었는지 체크하는 플래그
  const allResolved = conflicts.length > 0 && Object.keys(resolutions).length === conflicts.length;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-outline-variant rounded-xl shadow-2xl max-w-4xl w-full p-6 animate-fade-slide-up flex flex-col max-h-[90vh]">
        <div className="flex items-center gap-3 text-brand-error mb-4 shrink-0">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-bold text-brand-on-surface">데이터 충돌 해결</h2>
        </div>
        
        <p className="text-sm text-brand-on-surface-variant mb-6 leading-relaxed shrink-0">
          다른 작업자와 동일한 항목을 동시에 수정했습니다. 자동으로 병합할 수 없는 각 항목마다 반영할 데이터를 선택해주세요.
        </p>

        {/* 3. 충돌 내역 리스트 렌더링 : 사용자가 양쪽 값을 비교하고 선택 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-6 pr-2">
          {conflicts.map((conflict, idx) => {
            const isLocalSelected = resolutions[idx] === 'local';
            const isServerSelected = resolutions[idx] === 'server';

            return (
              <div key={idx} className="bg-brand-surface-low border border-brand-outline-variant rounded-lg p-4">
                <div className="mb-3 border-b border-brand-outline-variant/50 pb-2 text-brand-on-surface text-sm">
                  <span className="font-bold text-brand-primary">REQ ID: {conflict.reqId}</span> 항목의 
                  <span className="text-brand-tertiary ml-1 font-bold">[{conflict.field}]</span> 속성이 겹칩니다.
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* 나의 로컬 수정본 */}
                  <div 
                    onClick={() => setResolutions(prev => ({ ...prev, [idx]: 'local' }))}
                    className={`flex-1 p-3 rounded-lg border transition-all cursor-pointer ${isLocalSelected ? 'border-brand-primary bg-brand-primary/10 shadow-sm' : 'border-brand-outline-variant hover:border-brand-primary/50 bg-brand-surface'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-bold ${isLocalSelected ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>
                        나의 로컬 수정본 (덮어쓰기)
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isLocalSelected ? 'border-brand-primary bg-brand-primary' : 'border-brand-outline-variant'}`}>
                        {isLocalSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <pre className="text-sm text-brand-on-surface whitespace-pre-wrap font-mono break-all bg-brand-surface-low p-2 rounded">
                      {JSON.stringify(conflict.mine, null, 2).replace(/^"|"$/g, '')}
                    </pre>
                  </div>

                  {/* 공유 폴더 최신본 */}
                  <div 
                    onClick={() => setResolutions(prev => ({ ...prev, [idx]: 'server' }))}
                    className={`flex-1 p-3 rounded-lg border transition-all cursor-pointer ${isServerSelected ? 'border-brand-success bg-brand-success/10 shadow-sm' : 'border-brand-outline-variant hover:border-brand-success/50 bg-brand-surface'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-bold ${isServerSelected ? 'text-brand-success' : 'text-brand-on-surface-variant'}`}>
                        공유 폴더 최신본 (타인 데이터 유지)
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isServerSelected ? 'border-brand-success bg-brand-success' : 'border-brand-outline-variant'}`}>
                        {isServerSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <pre className="text-sm text-brand-on-surface whitespace-pre-wrap font-mono break-all bg-brand-surface-low p-2 rounded">
                      {JSON.stringify(conflict.theirs, null, 2).replace(/^"|"$/g, '')}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. 최종 결정 버튼 : 모든 항목 선택 전까지 비활성화 */}
        <div className="shrink-0 flex justify-end gap-3 border-t border-brand-outline-variant pt-4 mt-auto">
          <button 
            onClick={onCancel} 
            className="px-4 py-2.5 bg-brand-surface-high hover:bg-brand-surface-highest border border-brand-outline-variant text-brand-on-surface rounded-lg font-medium text-sm transition-colors"
          >
            취소 (저장 보류)
          </button>
          <button 
            onClick={submitResolution}
            disabled={!allResolved}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${allResolved ? 'bg-brand-primary text-brand-on-primary hover:opacity-90 active:scale-[0.98]' : 'bg-brand-surface-highest text-brand-on-surface-variant cursor-not-allowed border border-brand-outline-variant'}`}
          >
            선택 항목 병합 및 적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
