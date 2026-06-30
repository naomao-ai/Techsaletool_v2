/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, HelpCircle, Settings, User, LogOut, CheckCircle, Edit2, Minus, Maximize2, X, Sun, Moon } from 'lucide-react';

interface NavBarProps {
  appName?: string;
  onAppNameChange?: (name: string) => void;
}

export default function NavBar({ appName = 'Business Management System', onAppNameChange }: NavBarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(appName);
  const [isLightMode, setIsLightMode] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const toggleProfile = () => setShowProfileMenu(prev => !prev);
  const toggleTheme = () => setIsLightMode(prev => !prev);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLightMode]);

  // Sync tempTitle with appName when not editing
  useEffect(() => {
    if (!isEditingTitle) setTempTitle(appName);
  }, [appName, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && onAppNameChange) {
      onAppNameChange(tempTitle.trim());
    } else {
      setTempTitle(appName); // revert on empty
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(appName);
    }
  };

  const handleWindowControl = async (action: 'minimize' | 'maximize' | 'close') => {
    // @ts-ignore
    if (window.__TAURI_INTERNALS__) {
      try {
        if (action === 'close') {
          // @ts-ignore
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('exit_app');
          return;
        }

        // @ts-ignore
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const appWindow = getCurrentWindow();
        if (action === 'minimize') await appWindow.minimize();
        else if (action === 'maximize') await appWindow.toggleMaximize();
      } catch (e) {
        console.error('Window control error:', e);
      }
    } else {
      console.log('Window controls only available in Tauri desktop app.');
    }
  };

  return (
    <header 
      id="top-navbar" 
      className="fixed top-0 left-0 bg-brand-surface border-b border-brand-outline-variant flex justify-between items-center h-16 pr-6 pl-6 w-[calc(100%-220px)] ml-[220px] z-[99]"
      style={{ WebkitAppRegion: 'drag' } as any} // Allow window dragging on navbar
    >
      {/* Title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleTitleKeyDown}
            className="text-title-md font-bold text-brand-on-surface bg-brand-surface-high border border-brand-primary rounded pl-0 pr-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-primary min-w-[200px]"
          />
        ) : (
          <h2 
            className="text-title-md font-bold text-brand-on-surface tracking-tight cursor-pointer hover:bg-brand-surface-high rounded py-0.5 pr-2 transition-colors flex items-center gap-2 group"
            onClick={() => setIsEditingTitle(true)}
            title="클릭하여 이름 수정"
          >
            {appName}
            <Edit2 className="w-3.5 h-3.5 text-brand-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </h2>
        )}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success-container/20 text-brand-success border border-brand-success/30">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></span>
          실시간 동기화 동작 중
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 text-brand-on-surface-variant relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full bg-brand-surface-high border border-brand-outline hover:ring-2 hover:ring-brand-primary hover:ring-offset-2 hover:ring-offset-brand-bg transition-all duration-200 flex items-center justify-center text-brand-on-surface-variant cursor-pointer"
          title={isLightMode ? "다크 모드로 전환" : "화이트 모드로 전환"}
        >
          {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Manager Avatar Dropdown */}
        <div className="relative pr-2 border-r border-brand-outline-variant mr-1">
          <div 
            id="avatar-trigger"
            onClick={toggleProfile}
            className="w-8 h-8 rounded-full ml-1 bg-brand-surface-high border border-brand-outline cursor-pointer hover:ring-2 hover:ring-brand-primary hover:ring-offset-2 hover:ring-offset-brand-bg transition-all duration-200 flex items-center justify-center text-brand-on-surface-variant"
          >
            <User className="w-5 h-5" />
          </div>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-brand-surface-high border border-brand-outline-variant rounded-xl shadow-xl py-2 z-50 animate-fade-slide-up">
              <div className="px-4 py-2 border-b border-brand-outline-variant">
                <p className="text-xs font-semibold text-brand-on-surface">종합관리자</p>
                <p className="text-[10px] text-brand-on-surface-variant truncate">naomao84@gmail.com</p>
              </div>
              <button className="w-full text-left px-4 py-2 hover:bg-brand-surface text-xs text-brand-on-surface flex items-center gap-2 cursor-pointer transition-colors border-t border-brand-outline-variant mt-1.5 pt-2">
                <LogOut className="w-4 h-4 opacity-75" /> 로그아웃
              </button>
            </div>
          )}
        </div>

        {/* Window Controls (Tauri only rendering is ideal, but we'll show them) */}
        <div className="flex items-center">
          <button 
            onClick={() => handleWindowControl('minimize')}
            className="w-9 h-9 flex items-center justify-center hover:bg-brand-surface-high text-brand-on-surface-variant hover:text-brand-on-surface transition-colors cursor-pointer"
            title="최소화"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleWindowControl('maximize')}
            className="w-9 h-9 flex items-center justify-center hover:bg-brand-surface-high text-brand-on-surface-variant hover:text-brand-on-surface transition-colors cursor-pointer"
            title="최대화/복원"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleWindowControl('close')}
            className="w-9 h-9 flex items-center justify-center hover:bg-brand-error hover:text-white text-brand-on-surface-variant transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
