import * as fs from 'fs';

let code = fs.readFileSync('./src/App.tsx', 'utf8');

// 1. Add types and edit state definitions
const newTypes = `
export interface TabItem {
  id: string;
  sidebarLabel: string;
  dashboardTitle: string;
  dashboardDesc: string;
  iconName?: string;
}

export interface TabData {
  requirements: Requirement[];
  columns: Column[];
}

const DEFAULT_TABS: TabItem[] = [
  { id: 'requirements', sidebarLabel: '요구조건 분석', dashboardTitle: '요구조건 분석 (Clarification)', dashboardDesc: '선주의 선박 건조 요구사항을 분석해 기술적 실현 가능성을 검증하고, 잠재적 리스크를 사전에 통제하는 핵심 작업입니다.', iconName: 'BarChart3' },
  { id: 'requirements_2', sidebarLabel: '요구조건 분석 (복사본)', dashboardTitle: '요구조건 분석 (복사본)', dashboardDesc: '추가적인 분석이나 시뮬레이션을 수행할 수 있는 독립된 버전입니다.', iconName: 'BarChart3' },
  { id: 'development_plan', sidebarLabel: '추후 개발(기능 개발)', dashboardTitle: '추후 개발 (Gantt 로드맵 및 간트 차트)', dashboardDesc: '새로운 기능 개발 명세 및 우선순위 관리 공간입니다.', iconName: 'Clock' },
  { id: 'api_integration', sidebarLabel: '추후 개발(API 연동)', dashboardTitle: 'API 연동', dashboardDesc: '외부 서비스 및 시스템과의 API 연동 관리 공간입니다.', iconName: 'Clock' },
  { id: 'user_management', sidebarLabel: '추후 개발(권한 관리)', dashboardTitle: '권한 관리', dashboardDesc: '사용자 그룹 및 권한 정책 명세 관리 공간입니다.', iconName: 'Clock' },
  { id: 'statistics', sidebarLabel: '추후 개발(통계 분석)', dashboardTitle: '통계 분석', dashboardDesc: '프로젝트 통계 및 분석 리포트입니다.', iconName: 'Clock' }
];
`;

code = code.replace(
  "import { Column } from './types';",
  "import { Column } from './types';" + newTypes
);

code = code.replace("Clock,", "Clock,\n  Edit2,");

// 2. Add applyData function to App component
const applyDataFunc = `
  const applyData = (parsed: any) => {
    if (parsed.tabs) setTabs(parsed.tabs);
    if (parsed.tabDataMap) {
      setTabDataMap(parsed.tabDataMap);
    } else {
      setTabDataMap({
        requirements: { requirements: parsed.requirements || INITIAL_REQUIREMENTS, columns: parsed.columns || DEFAULT_COLUMNS },
        requirements_2: { requirements: parsed.requirements2 || [], columns: parsed.columns2 || DEFAULT_COLUMNS }
      });
    }
    if (parsed.assigneesPool) setAssigneesPool(parsed.assigneesPool);
    if (parsed.appName) setAppName(parsed.appName);
  };
`;

code = code.replace(
  "export default function App() {",
  "export default function App() {\n" + applyDataFunc
);

// 3. Replace state definitions
code = code.replace(
  "  const [requirements, setRequirements] = useState<Requirement[]>([]);\n  const [requirements2, setRequirements2] = useState<Requirement[]>([]);\n  const [assigneesPool, setAssigneesPool] = useState<Assignee[]>([]);\n  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);\n  const [columns2, setColumns2] = useState<Column[]>(DEFAULT_COLUMNS);",
  "  const [tabs, setTabs] = useState<TabItem[]>(DEFAULT_TABS);\n  const [tabDataMap, setTabDataMap] = useState<Record<string, TabData>>({});\n  const [assigneesPool, setAssigneesPool] = useState<Assignee[]>([]);"
);

code = code.replace(
  "const statesRef = useRef({ requirements, requirements2, assigneesPool, columns, columns2 });",
  "const statesRef = useRef({ tabDataMap, tabs, assigneesPool });"
);
code = code.replace(
  "statesRef.current = { requirements, requirements2, assigneesPool, columns, columns2 };",
  "statesRef.current = { tabDataMap, tabs, assigneesPool };"
);
code = code.replace(
  "const dataPayload = JSON.stringify({ requirements, requirements2, assigneesPool, appName, columns, columns2 });",
  "const dataPayload = JSON.stringify({ tabDataMap, tabs, assigneesPool, appName });"
);

// 4. Update executeSmartMerge
const mergeCode = `
      let baseData;
      try {
        baseData = JSON.parse(lastSavedPayload.current);
      } catch {
        baseData = { tabDataMap: {}, assigneesPool: [] };
      }

      const myData = statesRef.current;
      const conflicts: any[] = [];
      const finalTabs = theirData.tabs || myData.tabs;
      const mergedMap: Record<string, TabData> = {};

      Object.keys({ ...theirData.tabDataMap, ...myData.tabDataMap }).forEach(tabId => {
         const myTab = myData.tabDataMap[tabId] || { requirements: [], columns: DEFAULT_COLUMNS };
         const theirTab = theirData.tabDataMap?.[tabId] || { requirements: [], columns: DEFAULT_COLUMNS };
         const baseTab = baseData.tabDataMap?.[tabId] || { requirements: [], columns: DEFAULT_COLUMNS };
         
         const mergedReqs = [...theirTab.requirements];
         let mergedCols = theirTab.columns || myTab.columns;

         myTab.requirements.forEach(myReq => {
            const baseReq = baseTab.requirements.find((r: any) => r.id === myReq.id);
            const theirReqIndex = mergedReqs.findIndex((r: any) => r.id === myReq.id);

            if (!baseReq) {
              if (theirReqIndex === -1) {
                mergedReqs.push(myReq);
              }
            } else {
              if (theirReqIndex !== -1) {
                const theirReq = mergedReqs[theirReqIndex];
                const mergedReq = { ...theirReq, customColumns: { ...theirReq.customColumns } };
                const fields = ['title', 'priority', 'status', 'dueDate'];
                
                fields.forEach(f => {
                  if (myReq[f as keyof Requirement] !== baseReq[f as keyof Requirement]) {
                    if (theirReq[f as keyof Requirement] !== baseReq[f as keyof Requirement] && myReq[f as keyof Requirement] !== theirReq[f as keyof Requirement]) {
                      conflicts.push({ reqId: myReq.id, field: f, mine: myReq[f as keyof Requirement], theirs: theirReq[f as keyof Requirement], tabId });
                    } else {
                      (mergedReq as any)[f] = myReq[f as keyof Requirement];
                    }
                  }
                });
                
                if (JSON.stringify(myReq.assignees) !== JSON.stringify(baseReq.assignees)) {
                  if (JSON.stringify(theirReq.assignees) !== JSON.stringify(baseReq.assignees) && JSON.stringify(myReq.assignees) !== JSON.stringify(theirReq.assignees)) {
                    conflicts.push({ reqId: myReq.id, field: 'assignees', mine: myReq.assignees.map(a=>a.name).join(','), theirs: theirReq.assignees.map(a=>a.name).join(','), tabId });
                  } else {
                    mergedReq.assignees = myReq.assignees;
                  }
                }

                mergedReqs[theirReqIndex] = mergedReq;
              }
            }
         });
         
         mergedMap[tabId] = { requirements: mergedReqs, columns: mergedCols };
      });

      const mergedPayload = { ...theirData, tabDataMap: mergedMap, tabs: finalTabs };
`;
code = code.replace(
  /let baseData;\s+try\s+\{[\s\S]*?if\s+\(conflicts\.length\s+>\s+0\)\s+\{/m,
  mergeCode + "\n      if (conflicts.length > 0) {"
);

// Update successful merge block 
code = code.replace(
  /setRequirements\(mergedPayload\.requirements\);\s+setRequirements2\(mergedPayload\.requirements2\s+\|\|\s+\[\]\);\s+setAssigneesPool\(mergedPayload\.assigneesPool\);\s+if\s+\(mergedPayload\.columns\)\s+setColumns\(mergedPayload\.columns\);\s+if\s+\(mergedPayload\.columns2\)\s+setColumns2\(mergedPayload\.columns2\);/g,
  "if (mergedPayload.tabs) setTabs(mergedPayload.tabs);\n        if (mergedPayload.tabDataMap) setTabDataMap(mergedPayload.tabDataMap);\n        setAssigneesPool(mergedPayload.assigneesPool);"
);

// 5. Replace repetitive fetch and parse logic
code = code.replace(
  /const localDataStr\s*=\s*localStorage\.getItem\('offline_db'\);\s*if\s*\(localDataStr\)\s*\{\s*const parsed\s*=\s*JSON\.parse\(localDataStr\);\s*setRequirements\([\s\S]*?lastSavedPayload\.current\s*=\s*JSON\.stringify\(\{[\s\S]*?\}\);/gm,
  "const localDataStr = localStorage.getItem('offline_db');\n           if (localDataStr) { const parsed = JSON.parse(localDataStr); applyData(parsed); lastSavedPayload.current = JSON.stringify(parsed); } else { applyData({}); lastSavedPayload.current = JSON.stringify({ tabDataMap: {}, tabs: DEFAULT_TABS, assigneesPool: INITIAL_ASSIGNEES, appName: 'Business Management System' }); }"
);

code = code.replace(
  /if\s*\(parsed\)\s*\{\s*if\s*\(parsed\.requirements\)\s*setRequirements\([\s\S]*?lastSavedPayload\.current\s*=\s*JSON\.stringify\(parsed\);\s*\}/gm,
  "if (parsed) { applyData(parsed); lastSavedPayload.current = JSON.stringify(parsed); }"
);

// Replace one more load logic block in handleTauriOpen
code = code.replace(
  /if\s*\(parsed\.requirements\)\s*setRequirements\([\s\S]*?if\s*\(parsed\.columns2\)\s*setColumns2\(parsed\.columns2\);/gm,
  "applyData(parsed);"
);

// Replace one more in ConflictModal onTheirs
code = code.replace(
  /if\s*\(parsed\)\s*\{\s*if\s*\(parsed\.requirements\)\s*setRequirements\([\s\S]*?lastSavedPayload\.current\s*=\s*JSON\.stringify\(parsed\);\s*\}/gm,
  "if (parsed) { applyData(parsed); lastSavedPayload.current = JSON.stringify(parsed); }"
);

// ConflictModal onMerge resolution
const finalMergeResolution = `
                 if (choices && conflictDetails.length > 0) {
                    conflictDetails.forEach((c, idx) => {
                      if (choices[idx] === 'local') {
                         const localReq = tabDataMap[c.tabId]?.requirements?.find(r => r.id === c.reqId);
                         const targetReq = finalMergedData.tabDataMap[c.tabId]?.requirements?.find((r: any) => r.id === c.reqId);
                         if (localReq && targetReq) {
                            if (c.field === 'assignees') targetReq.assignees = localReq.assignees;
                            else (targetReq as any)[c.field] = (localReq as any)[c.field];
                         }
                      }
                    });
                 }
                 if (finalMergedData.tabs) setTabs(finalMergedData.tabs);
                 if (finalMergedData.tabDataMap) setTabDataMap(finalMergedData.tabDataMap);
                 setAssigneesPool(finalMergedData.assigneesPool);
`;
code = code.replace(
  /if\s*\(choices\s*&&\s*conflictDetails\.length\s*>\s*0\)\s*\{[\s\S]*?setColumns2\(finalMergedData\.columns2\);/m,
  finalMergeResolution
);

// 6. Handle active tab data
const activeTabRenderer = `
          {currentTab === 'settings_menu' ? (
            <SettingsPage onConfigSaved={() => {
              window.location.reload();
            }} />
          ) : (
            (() => {
              const activeTabInfo = tabs.find(t => t.id === currentTab) || tabs[0];
              const tData = tabDataMap[currentTab] || { requirements: [], columns: DEFAULT_COLUMNS };
              return (
                <div className="flex flex-col flex-1 min-h-0 animate-fade-slide-up">
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-outline-variant/40 pb-5 shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-5 h-5 text-brand-primary" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-brand-primary font-mono">B2B Platform Workspace</span>
                      </div>
                      
                      <div className="flex items-center gap-2 group">
                        <input
                          value={activeTabInfo.dashboardTitle}
                          onChange={(e) => {
                            setTabs(prev => prev.map(t => t.id === currentTab ? {...t, dashboardTitle: e.target.value} : t));
                          }}
                          className="text-2xl font-extrabold text-brand-on-surface tracking-tight font-title-md bg-transparent border-b-2 border-transparent focus:border-brand-primary outline-none transition-colors w-full"
                          placeholder="대시보드 제목"
                        />
                        <Edit2 className="w-4 h-4 text-brand-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      
                      <div className="flex items-start gap-2 group mt-1">
                        <textarea
                          value={activeTabInfo.dashboardDesc}
                          onChange={(e) => {
                            setTabs(prev => prev.map(t => t.id === currentTab ? {...t, dashboardDesc: e.target.value} : t));
                          }}
                          className="text-[18px] text-brand-on-surface-variant leading-relaxed opacity-80 bg-transparent outline-none w-full resize-none border-b border-transparent focus:border-brand-primary/50 transition-colors"
                          rows={2}
                          placeholder="대시보드 설명을 입력하세요"
                        />
                        <Edit2 className="w-4 h-4 text-brand-on-surface-variant opacity-0 group-hover:opacity-50 transition-opacity shrink-0 mt-2" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {dbPath && (
                        <button 
                          onClick={() => setShowChangelogViewer(true)}
                          className="ml-auto flex items-center justify-center gap-2 py-2 px-3 bg-brand-surface-high border border-brand-outline-variant rounded-lg text-xs font-semibold text-brand-on-surface hover:bg-brand-surface-highest transition-colors cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                          실시간 작업 이력 확인
                        </button>
                      )}
                      <div className="bg-brand-surface-high border border-brand-outline-variant/60 rounded-xl p-3 flex items-start gap-2.5 max-w-xs text-[12px]">
                        <Sparkles className="w-4 h-4 text-brand-tertiary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[12px] text-brand-on-surface">분산 워크스페이스</p>
                          <p className="text-[11px] text-brand-on-surface-variant leading-relaxed">
                            독립된 공간으로 구성되며 데이터 변경과 구조 편집이 안전하게 보존됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {syncError && (
                     <div className="mb-4 bg-brand-error/10 border border-brand-error text-brand-error text-xs p-3 rounded-lg flex items-center justify-between">
                        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {syncError}</span>
                     </div>
                  )}

                  <div className="shrink-0 mb-6">
                    <StatsCards 
                      requirements={tData.requirements}
                      columns={tData.columns}
                      openComingSoonModal={handleOpenComingSoon}
                    />
                  </div>

                  <div className="relative flex-1 min-h-0 flex flex-col min-w-0">
                    <Spreadsheet 
                      requirements={tData.requirements} 
                      setRequirements={(reqs) => {
                        setTabDataMap(prev => ({
                          ...prev,
                          [currentTab]: {
                            ...prev[currentTab] || {columns: DEFAULT_COLUMNS},
                            requirements: typeof reqs === 'function' ? reqs((prev[currentTab] || {requirements: []}).requirements) : reqs
                          }
                        }));
                      }}
                      assigneesPool={assigneesPool}
                      setAssigneesPool={setAssigneesPool}
                      columns={tData.columns}
                      setColumns={(cols) => {
                        setTabDataMap(prev => ({
                          ...prev,
                          [currentTab]: {
                            ...prev[currentTab] || {requirements: []},
                            columns: typeof cols === 'function' ? cols((prev[currentTab] || {columns: DEFAULT_COLUMNS}).columns) : cols
                          }
                        }));
                      }}
                      openComingSoonModal={handleOpenComingSoon}
                      socket={socket}
                      dbPath={dbPath}
                      currentUser={currentUser}
                      activeLocks={activeLocks}
                    />
                  </div>
                </div>
              );
            })()
          )}
`;

code = code.replace(
  /\{\s*currentTab\s*===\s*'settings_menu'\s*\?[\s\S]*?<Spreadsheet[\s\S]*?\/>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/main>/,
  activeTabRenderer + "\n        </main>"
);

// Fix the second view block that was requirements_2 (delete it)
code = code.replace(
  /\{currentTab === 'requirements_2' && \([\s\S]*?\)\}/,
  ""
);

// 7. Replace Sidebar call and handlers
const sidebarCall = `
      <Sidebar 
        currentTab={currentTab}
        tabs={tabs}
        onTauriSave={handleTauriSave}
        onTauriOpen={handleTauriOpen}
        onExportHtml={handleExportHtml}
        onTabChange={(tabId) => {
          setCurrentTab(tabId);
        }}
        onTabRename={(tabId, newLabel) => {
           setTabs(prev => prev.map(t => t.id === tabId ? {...t, sidebarLabel: newLabel} : t));
        }}
      />
`;
code = code.replace(
  /<Sidebar[\s\S]*?onTabChange=\{[\s\S]*?\}\s*\/>/m,
  sidebarCall
);

// 8. Fix window.OFFLINE_DATA download 
code = code.replace(
  /state: \{ requirements, requirements2, assigneesPool, columns, columns2 \}/g,
  "state: { tabDataMap, tabs, assigneesPool, appName }"
);
code = code.replace(
  /window\.OFFLINE_DATA\s*=\s*\{[\s\S]*?\}/,
  "window.OFFLINE_DATA = ${JSON.stringify({ tabDataMap, tabs, assigneesPool, appName })}"
);
code = code.replace(
  /setRequirements\(window\.OFFLINE_DATA\.requirements\s*\|\|\s*INITIAL_REQUIREMENTS\);[\s\S]*?setColumns2\(window\.OFFLINE_DATA\.columns2\);/m,
  "applyData(window.OFFLINE_DATA);"
);

fs.writeFileSync('./src/App.tsx', code);
console.log('App.tsx transformed successfully!');
