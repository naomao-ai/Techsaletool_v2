/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, AlertTriangle, Users, CheckCircle, BarChart2, PieChart, X, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Requirement, Column, CardItem } from '../types';
import type { Dispatch, SetStateAction } from 'react';
import { createPortal } from 'react-dom';

export interface DashboardFilterCommand {
  type: 'clear_all' | 'status_not_done' | 'assignee' | 'priority_high' | 'priority_medium' | 'priority_low' | 'custom_column';
  value?: string; // assignee name for 'assignee' type or value for 'custom_column'
  columnId?: string; // for 'custom_column' type
}

interface StatsCardsProps {
  requirements: Requirement[];
  columns: Column[];
  openComingSoonModal: (featureName: string) => void;
  onDashboardFilter?: (filter: DashboardFilterCommand | null) => void;
  configs?: CardItem[];
  onConfigsChange?: (configs: CardItem[]) => void;
}

function StatsCardsComponent({ requirements, columns, openComingSoonModal, onDashboardFilter, configs, onConfigsChange }: StatsCardsProps) {
  // Load saved card configs from localStorage
  const defaultCards: CardItem[] = [
    { id: 'card_assignees', config: 'assignees', columns: 4 },
    { id: 'card_status', config: 'status' },
    { id: 'card_compliance', config: 'compliance' },
    { id: 'card_design_impact', config: 'design_impact' },
  ];

  const [cards, setCards] = useState<CardItem[]>(() => {
    if (configs && configs.length > 0) return configs;
    return defaultCards;
  });

  // Sync from props if they change externally
  useEffect(() => {
    if (configs && configs.length > 0) {
      setCards(configs);
    }
  }, [configs]);

  const updateCards = (updater: React.SetStateAction<CardItem[]>, skipGlobalSync = false) => {
    setCards(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onConfigsChange && !skipGlobalSync) {
        onConfigsChange(next);
      }
      return next;
    });
  };

  // Context Menus
  const [cardOptionsMenu, setCardOptionsMenu] = useState<{ visible: boolean, x: number, y: number, cardId: string | null }>({
    visible: false, x: 0, y: 0, cardId: null
  });
  const [addCardMenu, setAddCardMenu] = useState<{ visible: boolean, x: number, y: number }>({
    visible: false, x: 0, y: 0
  });

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");

  const cardOptionsRef = useRef<HTMLDivElement>(null);
  const addCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardOptionsRef.current && !cardOptionsRef.current.contains(e.target as Node)) {
        setCardOptionsMenu(prev => ({ ...prev, visible: false }));
      }
      if (addCardRef.current && !addCardRef.current.contains(e.target as Node)) {
        setAddCardMenu(prev => ({ ...prev, visible: false }));
      }
    };
    if (cardOptionsMenu.visible || addCardMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cardOptionsMenu.visible, addCardMenu.visible]);

  // Drag & Drop State
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    const el = e.currentTarget as HTMLElement;
    setTimeout(() => el.style.opacity = '0.4', 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedCardId && cardId !== draggedCardId) {
      setDragOverCardId(cardId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetCardId) return;
    
    updateCards(prev => {
      const dragIdx = prev.findIndex(c => c.id === draggedCardId);
      const dropIdx = prev.findIndex(c => c.id === targetCardId);
      if (dragIdx === -1 || dropIdx === -1) return prev;
      
      const next = [...prev];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(dropIdx, 0, removed);
      return next;
    });
    
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Use raw client coordinates for maximum reliability.
    // Shift menu upwards or leftwards if clicked near the bottom/right edges.
    const screenW = document.documentElement.clientWidth || window.innerWidth;
    const screenH = document.documentElement.clientHeight || window.innerHeight;
    const x = e.clientX > screenW - 220 ? screenW - 220 : e.clientX;
    const y = e.clientY > screenH - 300 ? screenH - 300 : e.clientY;
    
    setCardOptionsMenu({ visible: true, x, y, cardId });
    setAddCardMenu(prev => ({ ...prev, visible: false }));
  };

  const handleMatchRowHeight = () => {
    if (!cardOptionsMenu.cardId) return;
    const container = document.getElementById('statistics-dashboard');
    const currentEl = document.getElementById(cardOptionsMenu.cardId);
    if (!container || !currentEl) return;

    const rowOffset = currentEl.offsetTop;
    const targetHeight = currentEl.offsetHeight;
    const children = Array.from(container.children) as HTMLElement[];
    const idsInRow: string[] = [];

    children.forEach(child => {
      if (child.id && Math.abs(child.offsetTop - rowOffset) < 20) {
        idsInRow.push(child.id);
      }
    });

    updateCards(prev => prev.map(c => idsInRow.includes(c.id) ? { ...c, height: targetHeight } : c));
    setCardOptionsMenu(prev => ({ ...prev, visible: false }));
  };

  const handleAddCardButton = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const screenW = document.documentElement.clientWidth || window.innerWidth;
    const screenH = document.documentElement.clientHeight || window.innerHeight;
    const x = e.clientX > screenW - 260 ? screenW - 260 : e.clientX;
    const y = e.clientY > screenH - 420 ? screenH - 420 : e.clientY;

    setAddCardMenu({ visible: true, x, y });
    setCardOptionsMenu(prev => ({ ...prev, visible: false }));
  };

  const handleAddCard = (colId: string) => {
    const newCard: CardItem = {
      id: `card_${colId}_${Date.now()}`,
      config: colId,
      width: 320 // default width
    };
    updateCards(prev => [...prev, newCard]);
    setAddCardMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDeleteCard = () => {
    if (cardOptionsMenu.cardId) {
      updateCards(prev => prev.filter(c => c.id !== cardOptionsMenu.cardId));
    }
    setCardOptionsMenu(prev => ({ ...prev, visible: false }));
  };

  const handleUpdateCard = (updates: Partial<CardItem>) => {
    if (cardOptionsMenu.cardId) {
      updateCards(prev => prev.map(c => 
        c.id === cardOptionsMenu.cardId ? { ...c, ...updates } : c
      ));
    }
  };

  // Computed stats
  const totalCount = requirements.length;
  const isReqDone = (req: Requirement) => {
    const s = req.status as string || 'TODO';
    return s === 'DONE' || s === '검토완료';
  };
  const doneCount = requirements.filter(isReqDone).length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const highRiskCount = requirements.filter(r => r.priority === 'HIGH').length;
  const medRiskCount = requirements.filter(r => r.priority === 'MEDIUM').length;
  const lowRiskCount = requirements.filter(r => r.priority === 'LOW').length;

  // Assignee stats
  const assigneeStats = React.useMemo(() => {
    const stats: Record<string, { total: number, done: number }> = {};
    requirements.forEach(req => {
      req.assignees?.forEach(a => {
        if (!stats[a.name]) stats[a.name] = { total: 0, done: 0 };
        stats[a.name].total++;
        if (isReqDone(req)) stats[a.name].done++;
      });
    });
    // Sort by incomplete tasks (total - done) descending
    return Object.entries(stats).sort((a, b) => {
      const incompleteA = a[1].total - a[1].done;
      const incompleteB = b[1].total - b[1].done;
      return incompleteB - incompleteA;
    });
  }, [requirements]);

  // Aggregatable columns (for custom cards)
  const aggregatableColumns = columns.filter(c =>
    !['id', 'title', 'custom_kr', 'custom_en'].includes(c.id)
  );

  // Render individual card content
  const renderCardContent = (card: CardItem) => {
    const { config, maxRows } = card;
    const isFirstRow = ['total', 'progress', 'high_risk'].includes(config);

    const renderTitle = (defaultTitle: string) => {
      const isEditing = editingTitleId === card.id;
      if (isFirstRow) {
        return isEditing ? (
          <input 
            autoFocus
            value={editTitleValue}
            onChange={e => setEditTitleValue(e.target.value)}
            onBlur={() => { handleUpdateCard({ customTitle: editTitleValue }); setEditingTitleId(null); }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            className="bg-brand-surface border border-brand-primary/50 rounded px-1.5 py-0.5 text-[12px] font-semibold text-slate-200 outline-none w-full min-w-[50px]"
          />
        ) : (
          <h3 
            className="text-[13px] font-semibold text-slate-400 tracking-wide truncate cursor-text hover:text-slate-300 px-1 -ml-1 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); setEditingTitleId(card.id); setEditTitleValue(card.customTitle || defaultTitle); }}
            title="클릭하여 제목 변경"
          >
            {card.customTitle || defaultTitle}
          </h3>
        );
      } else {
        return isEditing ? (
          <input 
            autoFocus
            value={editTitleValue}
            onChange={e => setEditTitleValue(e.target.value)}
            onBlur={() => { handleUpdateCard({ customTitle: editTitleValue }); setEditingTitleId(null); }}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            className="font-bold text-base text-brand-on-surface bg-transparent outline-none border-none hover:bg-brand-surface-high rounded px-1 -ml-1 w-full max-w-[300px]"
          />
        ) : (
          <h3 
            className="font-bold text-base text-brand-on-surface truncate cursor-text hover:bg-brand-surface-high px-1 -ml-1 rounded transition-colors inline-block"
            onClick={(e) => { e.stopPropagation(); setEditingTitleId(card.id); setEditTitleValue(card.customTitle || defaultTitle); }}
            title="클릭하여 제목 변경"
          >
            {card.customTitle || defaultTitle}
          </h3>
        );
      }
    };

    if (config === 'total') {
      return (
        <div 
          className="flex flex-col h-full justify-between cursor-pointer group/clickable"
          onClick={() => onDashboardFilter?.({ type: 'clear_all' })}
          title="클릭하면 모든 필터가 초기화됩니다"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            {renderTitle('전체 요구조건')}
          </div>
          <div className="flex items-end mt-auto">
            <span className="text-[32px] font-black tracking-tight leading-none text-slate-200">{totalCount}</span>
          </div>
        </div>
      );
    }

    if (config === 'progress') {
      return (
        <div 
          className="flex flex-col h-full justify-between cursor-pointer group/clickable"
          onClick={() => onDashboardFilter?.({ type: 'status_not_done' })}
          title="클릭하면 진행중인 항목만 필터링됩니다"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            {renderTitle('검토 진행률')}
          </div>
          <div className="flex items-end gap-3 mt-auto">
            <span className="text-[32px] font-black tracking-tight text-emerald-400 leading-none">{progressPct}%</span>
            <span className="text-[11px] text-slate-500 font-medium mb-[4px] tracking-wide">{doneCount} / {totalCount} 완료</span>
          </div>
        </div>
      );
    }

    if (config === 'assignees') {
      const displayStats = maxRows ? assigneeStats.slice(0, maxRows) : assigneeStats;
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-3 justify-between cursor-grab active:cursor-grabbing">
            <div className="flex items-center flex-1">
              <div className="text-brand-on-surface-variant flex items-center justify-center mr-1">
                <GripVertical size={16} />
              </div>
              <div className="flex items-center flex-1 min-w-0">
                {renderTitle('담당자별 현황')}
                <span className="text-[10px] text-brand-on-surface-variant font-normal ml-2 whitespace-nowrap">미완료 건수 기준</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col p-2 custom-scrollbar">
            {displayStats.length === 0 ? (
              <p className="text-[11px] text-slate-600 italic">배정된 항목이 없습니다</p>
            ) : (
              <div className="flex flex-row gap-4 flex-wrap overflow-visible items-stretch h-full">
                {Array.from({ length: card.columns || 1 }).map((_, chunkIndex) => {
                  const numCols = card.columns || 1;
                  const chunkSize = Math.ceil(displayStats.length / numCols);
                  const chunk = displayStats.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
                  if (chunk.length === 0) return null;
                  
                  return (
                    <div key={chunkIndex} className="flex-1 min-w-[150px] flex flex-col bg-brand-surface border border-brand-outline-variant/40 rounded overflow-hidden text-sm h-full">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-brand-surface-highest sticky top-0 z-10 shadow-sm h-8">
                          <tr>
                            <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-center text-brand-on-surface-variant font-semibold h-8">담당자</th>
                            <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-right text-brand-on-surface-variant font-semibold w-[120px] h-8">진척 (완료/전체)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.map(([name, { total, done }], i) => {
                            const isComplete = total === done;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                            return (
                              <tr 
                                key={i} 
                                className="border-b border-brand-outline-variant/40 hover:bg-brand-surface-high cursor-pointer transition-colors group/assignee"
                                onClick={() => onDashboardFilter?.({ type: 'assignee', value: name })}
                                title="클릭하면 해당 담당자로 필터링됩니다"
                              >
                                <td className={`px-2 py-1 truncate max-w-[100px] text-center align-middle font-medium transition-colors ${isComplete ? 'text-brand-on-surface-variant' : 'text-brand-on-surface group-hover/assignee:text-brand-primary'}`}>
                                  {name}
                                </td>
                                <td className="px-2 py-1 align-middle text-right text-brand-on-surface-variant">
                                  <div className="flex items-center justify-end gap-2 shrink-0">
                                    <span className="inline-block min-w-[44px] whitespace-nowrap text-right">
                                      <span className={isComplete ? "text-brand-on-surface-variant" : "text-brand-primary/90 font-medium"}>{done}</span> / {total}
                                    </span>
                                    <span className="inline-block min-w-[36px] text-right">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (config === 'high_risk') {
      return (
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            {renderTitle('위험건수')}
          </div>
          <div className="flex items-end gap-2 mt-auto w-full">
            <div 
              className="flex flex-1 items-end justify-center cursor-pointer hover:bg-white/5 rounded transition-colors group/clickable"
              onClick={() => onDashboardFilter?.({ type: 'priority_high' })}
              title="클릭하면 높음 항목만 필터링됩니다"
            >
              <span className={`text-[24px] font-black tracking-tight leading-none mb-[2px] ${highRiskCount > 0 ? 'text-rose-400' : 'text-slate-600'}`}>높음 {highRiskCount}</span>
            </div>
            <div 
              className="flex flex-1 items-end justify-center cursor-pointer hover:bg-white/5 rounded transition-colors group/clickable"
              onClick={() => onDashboardFilter?.({ type: 'priority_medium' })}
              title="클릭하면 중간 항목만 필터링됩니다"
            >
              <span className={`text-[24px] font-black tracking-tight leading-none mb-[2px] ${medRiskCount > 0 ? 'text-amber-400' : 'text-slate-600'}`}>중간 {medRiskCount}</span>
            </div>
            <div 
              className="flex flex-1 items-end justify-center cursor-pointer hover:bg-white/5 rounded transition-colors group/clickable"
              onClick={() => onDashboardFilter?.({ type: 'priority_low' })}
              title="클릭하면 낮음 항목만 필터링됩니다"
            >
              <span className={`text-[24px] font-black tracking-tight leading-none mb-[2px] ${lowRiskCount > 0 ? 'text-slate-400' : 'text-slate-600'}`}>낮음 {lowRiskCount}</span>
            </div>
          </div>
        </div>
      );
    }

    // Dynamic column-based aggregation card
    const col = aggregatableColumns.find(c => c.id === config);
    if (!col) {
      return (
        <div className="flex flex-col h-full justify-center items-center text-slate-500 text-[11px]">
          <BarChart2 className="w-4 h-4 mb-1" />
          <span>데이터 없음</span>
        </div>
      );
    }

    const translateLabel = (cId: string, val: string) => {
      if (cId === 'status') {
        if (val === 'TODO') return '대기중';
        if (val === 'IN_PROGRESS') return '검토중';
        if (val === 'DONE') return '검토완료';
      }
      if (cId === 'priority') {
        if (val === 'HIGH') return '높음';
        if (val === 'MEDIUM') return '중간';
        if (val === 'LOW') return '낮음';
      }
      return val;
    };

    const isReqDone = (req: any) => {
      const s = req.status as string || 'TODO';
      return s === 'DONE' || s === '검토완료';
    };

    const counts: Record<string, { total: number, done: number }> = {};
    requirements.forEach(req => {
      let val: string | undefined = undefined;
      if (col.id === 'priority') val = req.priority || 'MEDIUM';
      else if (col.id === 'status') {
        const s = req.status as string || 'TODO';
        val = (s === 'TODO' || s === '대기중') ? 'TODO' : 
              (s === 'IN_PROGRESS' || s === '검토중') ? 'IN_PROGRESS' :
              (s === 'DONE' || s === '검토완료') ? 'DONE' : 'TODO';
      }
      else if (col.id === 'assignees') {
        req.assignees?.forEach(a => { 
          if (!counts[a.name]) counts[a.name] = { total: 0, done: 0 };
          counts[a.name].total++;
          if (isReqDone(req)) counts[a.name].done++;
        });
        return;
      } else if (col.isCustom) val = req.customColumns?.[col.id];
      else val = (req as any)[col.id] as string;

      if (val) {
        val = translateLabel(col.id, val);
        if (!counts[val]) counts[val] = { total: 0, done: 0 };
        counts[val].total++;
        if (isReqDone(req)) counts[val].done++;
      }
    });

    const allEntries = Object.entries(counts).sort((a, b) => b[1].total - a[1].total);
    const displayEntries = maxRows ? allEntries.slice(0, maxRows) : allEntries;
    const totalColCount = allEntries.reduce((sum, item) => sum + item[1].total, 0);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-3 justify-between cursor-grab active:cursor-grabbing">
          <div className="flex items-center flex-1">
            <div className="text-brand-on-surface-variant flex items-center justify-center mr-1">
              <GripVertical size={16} />
            </div>
            <div className="flex items-center flex-1 min-w-0">
              {renderTitle(col.label)}
              <span className="text-[10px] text-brand-on-surface-variant font-normal ml-2 whitespace-nowrap">총 {totalColCount}건</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col p-2 custom-scrollbar">
          {displayEntries.length === 0 ? (
            <p className="text-[11px] text-slate-600 italic">데이터가 없습니다</p>
          ) : (
            <div className="flex flex-row gap-4 flex-wrap overflow-visible items-stretch h-full">
              {Array.from({ length: card.columns || 1 }).map((_, chunkIndex) => {
                const numCols = card.columns || 1;
                const chunkSize = Math.ceil(displayEntries.length / numCols);
                const chunk = displayEntries.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
                if (chunk.length === 0) return null;
                
                return (
                  <div key={chunkIndex} className="flex-1 min-w-[150px] flex flex-col bg-brand-surface border border-brand-outline-variant/40 rounded overflow-hidden text-sm h-full">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-brand-surface-highest sticky top-0 z-10 shadow-sm h-8">
                        <tr>
                          <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-center text-brand-on-surface-variant font-semibold h-8">항목</th>
                          <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-right text-brand-on-surface-variant font-semibold w-[120px] h-8">건수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chunk.map(([label, stats], i) => {
                          const count = stats.total;
                          const done = stats.done;
                          const isComplete = count > 0 && count === done;
                          const pct = count > 0 ? Math.round((done / count) * 100) : 0;
                          const translatedLabel = translateLabel(col.id, label);
                          return (
                            <tr 
                              key={i} 
                              className="border-b border-brand-outline-variant/40 hover:bg-brand-surface-high cursor-pointer transition-colors group/item"
                              onClick={() => onDashboardFilter?.({ type: 'custom_column', columnId: col.id, value: label })}
                              title={`클릭하면 '${translatedLabel || '(비어있음)'}' 항목으로 필터링됩니다`}
                            >
                              <td className={`px-2 py-1 truncate max-w-[120px] text-center align-middle font-medium transition-colors ${isComplete ? 'text-brand-on-surface-variant' : 'text-brand-on-surface group-hover/item:text-brand-primary'}`}>
                                {translatedLabel || '(비어있음)'}
                              </td>
                              <td className="px-2 py-1 align-middle text-right text-brand-on-surface-variant">
                                {card.linkWithStatus && col.id !== 'status' ? (
                                  <div className="flex items-center justify-end gap-2 shrink-0">
                                    <span className="inline-block min-w-[40px] whitespace-nowrap text-right">
                                      <span className={isComplete ? "text-brand-on-surface-variant" : "text-brand-primary/90 font-medium"}>{done}</span> / {count}
                                    </span>
                                    <span className="inline-block min-w-[36px] text-right">
                                      {pct}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="font-medium text-brand-primary/90 shrink-0 ml-2">{count}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <>
      {/* 1st Row: Fixed Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 shadow-lg overflow-hidden select-none">
          {renderCardContent({ id: 'fixed_total', config: 'total' })}
        </div>
        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 shadow-lg overflow-hidden select-none">
          {renderCardContent({ id: 'fixed_progress', config: 'progress' })}
        </div>
        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 shadow-lg overflow-hidden select-none">
          {renderCardContent({ id: 'fixed_high_risk', config: 'high_risk' })}
        </div>
      </div>

      {/* 2nd Row: Expandable Cards Area */}
      <div
        id="statistics-dashboard"
        className="flex flex-wrap gap-4 mb-6 min-h-[120px] rounded-xl border border-transparent hover:border-white/5 transition-colors"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            const screenW = document.documentElement.clientWidth || window.innerWidth;
            const screenH = document.documentElement.clientHeight || window.innerHeight;
            const x = e.clientX > screenW - 220 ? screenW - 220 : e.clientX;
            const y = e.clientY > screenH - 300 ? screenH - 300 : e.clientY;
            setAddCardMenu({ visible: true, x, y });
            setCardOptionsMenu({ visible: false, x: 0, y: 0, cardId: null });
          }
        }}
      >
        {cards.filter(c => !['total', 'progress', 'high_risk'].includes(c.config)).map((card) => {
          return (
            <div
              key={card.id}
              id={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDrop={(e) => handleDrop(e, card.id)}
              onContextMenu={(e) => handleContextMenu(e, card.id)}
              onMouseUp={(e) => {
                // Check if card size changed significantly from resizing
                const el = e.currentTarget as HTMLDivElement;
                const currentW = card.width || 320;
                const currentH = card.height || el.offsetHeight;
                
                if (Math.abs(currentW - el.offsetWidth) > 2 || Math.abs(currentH - el.offsetHeight) > 2) {
                  updateCards(prev => prev.map(c => 
                    c.id === card.id 
                      ? { ...c, width: el.offsetWidth, height: el.offsetHeight } 
                      : c
                  ));
                }
              }}
              style={{ width: card.width || 320, height: card.height || 'auto' }}
              className={`
                group relative bg-brand-bg border border-brand-outline-variant rounded-xl p-5 shadow-sm 
                transition-all duration-300 ease-out overflow-hidden select-none
                flex-none [resize:both]
                ${dragOverCardId === card.id ? 'border-brand-primary/60 scale-[1.02]' : ''}
                ${draggedCardId === card.id ? 'opacity-40' : ''}
              `}
              title="크기를 조절하려면 우측 하단을 드래그하세요. 옵션은 우클릭, 이동은 드래그하세요."
            >
              <div className="relative z-10 h-full pointer-events-none">
                <div className="pointer-events-auto h-full">
                  {renderCardContent(card)}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-transparent z-20 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Card Options Context Menu */}
      {cardOptionsMenu.visible && cardOptionsMenu.cardId && createPortal(
        <div
          ref={cardOptionsRef}
          className="fixed z-[9999] bg-brand-surface-high border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] text-[12px] font-sans overflow-hidden animate-fade-slide-up"
          style={{ top: cardOptionsMenu.y, left: cardOptionsMenu.x }}
        >
          <div className="px-3 py-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/5 mb-1">
            카드 속성
          </div>

          <div className="px-4 py-1.5 text-slate-500 text-[10px] mt-1 pt-2">위젯 종류 변경</div>
          <div className="px-3 mb-2 pb-2 border-b border-white/5">
            <select 
              value={cards.find(c => c.id === cardOptionsMenu.cardId)?.config || ''}
              onChange={(e) => handleUpdateCard({ config: e.target.value })}
              className="w-full bg-brand-bg text-slate-200 text-xs px-2 py-1.5 rounded border border-white/10 focus:outline-none focus:border-brand-primary"
            >
              <option value="assignees">담당자별 현황</option>
              <optgroup label="컬럼 기준 집계">
                {aggregatableColumns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
              </optgroup>
            </select>
          </div>

          {(cards.find(c => c.id === cardOptionsMenu.cardId)?.config !== 'total' && 
            cards.find(c => c.id === cardOptionsMenu.cardId)?.config !== 'progress' && 
            cards.find(c => c.id === cardOptionsMenu.cardId)?.config !== 'high_risk') ? (
            <>
              <div className="px-4 py-1.5 text-slate-500 text-[10px] mt-1 pt-2">표시 행 개수</div>
              <div className="flex flex-wrap gap-1 px-3 mb-2">
                {[3, 5, 10, undefined].map((r, i) => {
                  const currentCard = cards.find(c => c.id === cardOptionsMenu.cardId);
                  const isActive = currentCard?.maxRows === r;
                  return (
                    <button 
                      key={i}
                      onClick={() => handleUpdateCard({ maxRows: r })}
                      className={`flex-1 min-w-[35px] py-1 rounded text-[10px] font-bold transition-colors ${isActive ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'}`}
                    >
                      {r ? `${r}개` : '전체'}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-1.5 text-slate-500 text-[10px] mt-1 pt-2 border-t border-white/5">단 구성 (컬럼)</div>
              <div className="flex flex-wrap gap-1 px-3 mb-2">
                {[1, 2, 3, 4, 5, 6].map((colNum, i) => {
                  const currentCard = cards.find(c => c.id === cardOptionsMenu.cardId);
                  const isActive = (currentCard?.columns || 1) === colNum;
                  return (
                    <button 
                      key={i}
                      onClick={() => handleUpdateCard({ columns: colNum })}
                      className={`flex-1 min-w-[40px] py-1 rounded text-[10px] font-bold transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'}`}
                    >
                      {colNum}단
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-1.5 text-slate-500 text-[10px] mt-1 pt-2 border-t border-white/5">데이터 집계 방식</div>
              <label className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={!!cards.find(c => c.id === cardOptionsMenu.cardId)?.linkWithStatus}
                  onChange={(e) => handleUpdateCard({ linkWithStatus: e.target.checked })}
                  className="rounded border-white/20 bg-brand-bg checked:bg-brand-primary cursor-pointer"
                />
                <span className="text-slate-300 text-[11px]">상태(진행률) 연계 표시</span>
              </label>
            </>
          ) : null}

          <div className="border-t border-white/5 my-1" />
          <button
            onClick={handleMatchRowHeight}
            className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 transition-colors flex items-center gap-2"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            현재 위젯으로 행 높이 맞추기
          </button>
          <button
            onClick={handleDeleteCard}
            className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            이 카드 삭제
          </button>
        </div>, document.body
      )}

      {/* Add Card Context Menu */}
      {addCardMenu.visible && createPortal(
        <div
          ref={addCardRef}
          className="fixed z-[9999] bg-brand-surface-high border border-white/10 rounded-xl shadow-2xl py-2 min-w-[240px] text-[12px] font-sans overflow-hidden animate-fade-slide-up"
          style={{ top: addCardMenu.y, left: addCardMenu.x }}
        >
          <div className="px-3 py-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-white/5 mb-1">
            기본 지표 추가
          </div>
          <button onClick={() => handleAddCard('assignees')} className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 transition-colors flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-violet-400" /> 담당자별 현황
          </button>

          <div className="px-3 py-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-t border-white/5 my-1 mt-2 pt-2">
            컬럼 기준 집계 추가
          </div>
          <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
            {aggregatableColumns.map(col => (
              <button
                key={col.id}
                onClick={() => handleAddCard(col.id)}
                className="w-full text-left px-4 py-2 hover:bg-white/5 text-slate-200 flex items-center gap-2 transition-colors"
              >
                <PieChart className="w-3 h-3 text-cyan-400" /> {col.label}
              </button>
            ))}
            {aggregatableColumns.length === 0 && (
              <div className="px-4 py-2 text-slate-500 text-center text-xs">집계 가능한 열이 없습니다.</div>
            )}
          </div>
        </div>, document.body
      )}

    </>
  );
}

export default React.memo(StatsCardsComponent);
