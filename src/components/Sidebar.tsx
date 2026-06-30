/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, Clock, Settings, HelpCircle, Bell, Shield, User, Edit2, Check, X, ClipboardList } from 'lucide-react';
import { TabItem } from '../App';

interface SidebarProps {
  currentTab: string;
  tabs: TabItem[];
  onTabChange: (tabId: string) => void;
  onTabRename: (tabId: string, newLabel: string) => void;
  onExportHtml?: () => void;
  isExportingHtml?: boolean;
  onTauriSave?: () => void;
  onTauriOpen?: () => void;
}

const IconMap: Record<string, any> = {
  BarChart3,
  Clock,
  Settings,
  HelpCircle,
  Bell,
  Shield,
  User
};

export default function Sidebar({ currentTab, tabs, onTabChange, onTabRename, onExportHtml, isExportingHtml, onTauriSave, onTauriOpen }: SidebarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTabId]);

  const handleEditClick = (e: React.MouseEvent, tab: TabItem) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingLabel(tab.sidebarLabel);
  };

  const handleEditSubmit = () => {
    if (editingTabId && editingLabel.trim()) {
      onTabRename(editingTabId, editingLabel.trim());
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') setEditingTabId(null);
  };

  return (
    <aside 
      id="sidebar-container" 
      className="fixed left-0 top-0 h-full w-16 lg:w-[220px] bg-brand-surface-low text-brand-on-surface-variant flex flex-col z-20 border-r border-brand-outline-variant transition-all duration-300"
    >
      {/* Platform Branding */}
      <div className="px-3 lg:px-5 py-6 mb-4 flex flex-col items-center lg:items-start gap-2 border-b border-brand-outline-variant">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center text-brand-on-primary font-bold shrink-0">
            B
          </div>
          <div className="hidden lg:block">
            <h1 className="text-[14px] text-brand-on-surface font-semibold leading-tight truncate max-w-[140px]">
              TS Platform
            </h1>
            <p className="text-[10px] text-brand-on-surface-variant truncate max-w-[140px]">
              technical sales management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {tabs.map((item) => {
          const IconComponent = IconMap[item.iconName || 'BarChart3'] || BarChart3;
          const isActive = currentTab === item.id;
          const isEditing = editingTabId === item.id;
          
          return (
            <div
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => {
                if (!isEditing) onTabChange(item.id);
              }}
              className={`group w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all duration-200 cursor-pointer border-l-4 ${
                isActive 
                  ? 'bg-brand-surface-high text-brand-on-surface border-brand-primary font-medium' 
                  : 'text-brand-on-surface-variant border-transparent hover:bg-brand-surface hover:text-brand-on-surface hover:border-brand-outline-variant'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <IconComponent className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-brand-primary' : 'text-brand-on-surface-variant opacity-70'}`} />
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={handleEditSubmit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden lg:block flex-1 bg-brand-surface-lowest text-brand-on-surface text-[13px] px-1.5 py-0.5 rounded outline-none border border-brand-primary min-w-0"
                  />
                ) : (
                  <span className="hidden lg:block text-[13px] truncate">{item.sidebarLabel}</span>
                )}
              </div>
              
              {!isEditing && (
                <button
                  onClick={(e) => handleEditClick(e, item)}
                  className={`hidden lg:block shrink-0 ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-brand-surface-highest transition-opacity ${isActive ? 'opacity-100 text-brand-on-surface' : ''}`}
                  title="이름 변경"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
        
        {/* Settings Tab (Fixed) */}
        <button
          onClick={() => onTabChange('settings_menu')}
          className={`group w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all duration-200 cursor-pointer border-l-4 mt-4 ${
            currentTab === 'settings_menu' 
              ? 'bg-brand-surface-high text-brand-on-surface border-brand-primary font-medium' 
              : 'text-brand-on-surface-variant border-transparent hover:bg-brand-surface hover:text-brand-on-surface hover:border-brand-outline-variant'
          }`}
        >
          <Settings className={`w-[18px] h-[18px] shrink-0 ${currentTab === 'settings_menu' ? 'text-brand-primary' : 'text-brand-on-surface-variant opacity-70'}`} />
          <span className="hidden lg:block text-[13px] truncate">환경 설정</span>
        </button>

        {/* Board Tab (Fixed) */}
        <button
          onClick={() => onTabChange('board_menu')}
          className={`group w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-lg transition-all duration-200 cursor-pointer border-l-4 mt-1 ${
            currentTab === 'board_menu' 
              ? 'bg-brand-surface-high text-brand-on-surface border-brand-primary font-medium' 
              : 'text-brand-on-surface-variant border-transparent hover:bg-brand-surface hover:text-brand-on-surface hover:border-brand-outline-variant'
          }`}
        >
          <ClipboardList className={`w-[18px] h-[18px] shrink-0 ${currentTab === 'board_menu' ? 'text-brand-primary' : 'text-brand-on-surface-variant opacity-70'}`} />
          <span className="hidden lg:block text-[13px] truncate">게시판 (요청)</span>
        </button>
      </nav>

      {/* Sidebar Footer */}
      <div className="px-4 py-4 mt-auto border-t border-brand-outline-variant bg-brand-surface-lowest space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full border border-brand-outline-variant shrink-0 bg-brand-surface flex items-center justify-center text-brand-on-surface-variant">
              <User className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-brand-success ring-1 ring-brand-surface-lowest"></span>
          </div>
          <div className="hidden lg:block overflow-hidden flex-1">
            <span className="block text-xs font-medium text-brand-on-surface truncate">Manager</span>
            <span className="block text-[10px] text-brand-on-surface-variant truncate opacity-70">Administrator</span>
          </div>
        </div>
        
        {/* @ts-ignore */}
        {window.__TAURI_INTERNALS__ && (
          <>
            <button
              onClick={onTauriSave}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface text-brand-on-surface text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-brand-outline-variant hover:bg-brand-primary hover:text-brand-on-primary group"
              title="로컬 PC에 데이터 저장 (Tauri Dialog)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span className="hidden lg:inline">로컬 저장 (Save)</span>
            </button>
            <button
              onClick={onTauriOpen}
              className="w-full flex items-center justify-center lg:justify-start gap-2 px-3 py-2 bg-brand-surface text-brand-on-surface text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-brand-outline-variant hover:bg-brand-primary hover:text-brand-on-primary group"
              title="로컬 PC에서 데이터 불러오기 (Tauri Dialog)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              <span className="hidden lg:inline">파일 열기 (Open)</span>
            </button>
          </>
        )}

        <button
          onClick={onExportHtml}
          disabled={isExportingHtml}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-surface-high hover:bg-brand-primary hover:text-brand-on-primary text-brand-on-surface-variant text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-brand-outline-variant group disabled:opacity-50 disabled:cursor-not-allowed"
          title="현재 데이터를 단일 HTML로 내보내기"
        >
          {isExportingHtml ? (
            <div className="w-3.5 h-3.5 border-2 border-brand-on-surface-variant/30 border-t-brand-primary rounded-full animate-spin shrink-0" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 shrink-0">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          )}
          <span className="hidden lg:inline">{isExportingHtml ? '내보내는 중...' : 'HTML 내보내기'}</span>
        </button>
      </div>
    </aside>
  );
}
