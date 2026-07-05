/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Sidebar from "./components/Sidebar";
import NavBar from "./components/NavBar";
import StatsCards, { DashboardFilterCommand } from "./components/StatsCards";
import CEDashboard from "./components/CEDashboard";
import Spreadsheet from "./components/Spreadsheet";
import SettingsPage from "./components/SettingsPage";
import BoardPage from "./components/BoardPage";
import ConflictModal from "./components/ConflictModal";
import ChangelogViewer from "./components/ChangelogViewer";
import { Requirement, Assignee, Column, TimelineConfig } from "./types";
import {
  INITIAL_REQUIREMENTS,
  INITIAL_ASSIGNEES,
  DEFAULT_COLUMNS,
  INFLATION_DATES_COLUMNS,
  INFLATION_DATES_REQUIREMENTS,
  INFLATION_ESTIMATES_COLUMNS,
  INFLATION_ESTIMATES_REQUIREMENTS,
  CE_EXAMPLE_REQUIREMENTS,
  CE_EXAMPLE_COLUMNS,
} from "./data";
import { computeSmartMerge } from "./lib/mergeEngine";
import { io, Socket } from "socket.io-client";
import {
  Sparkles,
  Layers,
  History,
  HelpCircle,
  X,
  Send,
  Kanban,
  Clock,
  Edit2,
  AlertCircle,
  Activity,
  AlertTriangle,
  Users,
  CheckCircle,
  BarChart2,
  LayoutDashboard,
  Settings2,
  Plus,
  ArrowRight,
  Eye,
  Play,
  StopCircle,
  RefreshCw,
  X as XIcon,
  Table,
  KanbanSquare,
  Calendar,
  ChevronDown,
  Check,
  Layout,
  Save,
  FolderOpen,
  PieChart,
  Trash2,
  ArrowUpRight,
  Copy,
  Share2,
  UploadCloud,
} from "lucide-react";
import TimelineDashboard from "./components/TimelineDashboard";
export interface TabItem {
  id: string;
  sidebarLabel: string;
  dashboardTitle: string;
  dashboardDesc: string;
  iconName?: string;
  dashboardWidgets?: string[]; // e.g. ['stats', 'spreadsheet', 'ce_dashboard']
  ceDashboardConfigs?: {
    [key: string]: any;
  }[];
}

export interface TabData {
  requirements: Requirement[];
  columns: Column[];
  statsCardConfigs?: any[]; // configurations for StatsCards
  timelineConfig?: TimelineConfig;
}

const DEFAULT_TABS: TabItem[] = [
  {
    id: "requirements",
    sidebarLabel: "요구조건 분석",
    dashboardTitle: "요구조건 분석",
    dashboardDesc: "요구조건을 분석하고 현황을 추적합니다.",
    iconName: "BarChart3",
    dashboardWidgets: ["stats", "spreadsheet"],
  },
  {
    id: "ce_dashboard_example",
    sidebarLabel: "CE 대시보드",
    dashboardTitle: "CE 대시보드",
    dashboardDesc: "원가 및 증액 분석 대시보드입니다.",
    iconName: "PieChart",
    dashboardWidgets: ["ce_dashboard", "spreadsheet"],
    ceDashboardConfigs: [
      {
        criteriaColId: "wbs",
        sumColId: "usd_amount",
        filterColId: "apply",
        currencyColId: "currency",
        usdAmountColId: "usd_amount",
        layoutCount: 5,
        aggMode: "wbs",
        wbsColId: "wbs",
      },
      { chartType: "comparisonTable", title: "비교호선1", isLinked: true },
      { chartType: "comparisonTable", title: "비교호선2", isLinked: true },
      {
        chartType: "horizontalBar",
        title: "견적비교",
        isLinked: true,
        comparisonPanels: [1, 2],
      },
      {
        chartType: "table",
        title: "WBS별 비용",
        isLinked: true,
        aggMode: "wbs",
        wbsColId: "wbs",
      },
    ],
  },
  {
    id: "inflation_dates",
    sidebarLabel: "호선일정",
    dashboardTitle: "호선일정",
    dashboardDesc: "선박별 견적일 및 발주일 관리 탭",
    iconName: "Calendar",
    dashboardWidgets: ["timeline", "spreadsheet"],
  },
];

export default function App() {
  const applyData = (parsed: any) => {
    // [결함 #9 수정] tabs가 빈 배열이면(과거 병합 결함으로 오염된 파일 등) 적용하지 않고
    // 기존/기본 탭을 유지 — 앱은 최소 1개 탭을 전제하며, UI상 모든 탭을 삭제하는 경로도
    // 없으므로 빈 배열은 항상 손상 신호다. 다음 저장이 정상 tabs를 파일에 복원한다(자가 치유).
    if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
      setTabs(
        parsed.tabs.map((t: TabItem) => {
          if (t.id === "ce_dashboard_example" && !t.ceDashboardConfigs) {
            return {
              ...t,
              ceDashboardConfigs: [
                {
                  criteriaColId: "wbs",
                  sumColId: "usd_amount",
                  filterColId: "apply",
                  currencyColId: "currency",
                  usdAmountColId: "usd_amount",
                  layoutCount: 5,
                  aggMode: "wbs",
                  wbsColId: "wbs",
                },
                {
                  chartType: "comparisonTable",
                  title: "비교호선1",
                  isLinked: true,
                },
                {
                  chartType: "comparisonTable",
                  title: "비교호선2",
                  isLinked: true,
                },
                {
                  chartType: "horizontalBar",
                  title: "견적비교",
                  isLinked: true,
                  comparisonPanels: [1, 2],
                },
                {
                  chartType: "table",
                  title: "WBS별 비용",
                  isLinked: true,
                  aggMode: "wbs",
                  wbsColId: "wbs",
                },
              ],
            };
          }
          return t;
        }),
      );
    }
    if (parsed.tabDataMap) {
      const loadedDataMap = { ...parsed.tabDataMap };
      if (
        !loadedDataMap.inflation_dates?.columns?.find(
          (c: any) => c.id === "contract_date",
        ) ||
        !loadedDataMap.inflation_dates?.columns?.find(
          (c: any) => c.id === "ship_name",
        )
      ) {
        loadedDataMap.inflation_dates = {
          requirements: INFLATION_DATES_REQUIREMENTS,
          columns: INFLATION_DATES_COLUMNS,
        };
        loadedDataMap.inflation_estimates = {
          requirements: INFLATION_ESTIMATES_REQUIREMENTS,
          columns: INFLATION_ESTIMATES_COLUMNS,
        };
      }
      setTabDataMap({
        ...loadedDataMap,
        ce_dashboard_example: {
          requirements: CE_EXAMPLE_REQUIREMENTS,
          columns: CE_EXAMPLE_COLUMNS,
        },
      });
    } else {
      setTabDataMap({
        ce_dashboard_example: {
          requirements: CE_EXAMPLE_REQUIREMENTS,
          columns: CE_EXAMPLE_COLUMNS,
        },
        requirements: {
          requirements: parsed.requirements || INITIAL_REQUIREMENTS,
          columns: parsed.columns || DEFAULT_COLUMNS,
          statsCardConfigs: [
            { id: "card_assignees", config: "assignees", columns: 4 },
            { id: "card_status", config: "status" },
            { id: "card_compliance", config: "compliance" },
            { id: "card_design_impact", config: "design_impact" },
          ],
        },
        inflation_dates: {
          requirements: INFLATION_DATES_REQUIREMENTS,
          columns: INFLATION_DATES_COLUMNS,
        },
      });
    }
    if (parsed.assigneesPool) setAssigneesPool(parsed.assigneesPool);
    if (parsed.appName) setAppName(parsed.appName);
    if (parsed.boardItems) setBoardItems(parsed.boardItems);
  };

  // 1. Core State
  const [tabs, setTabs] = useState<TabItem[]>(DEFAULT_TABS);
  const [tabDataMap, setTabDataMap] = useState<Record<string, TabData>>({});
  const [assigneesPool, setAssigneesPool] = useState<Assignee[]>([]);
  const [appName, setAppName] = useState<string>("Business Management System");
  const [boardItems, setBoardItems] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("requirements");
  const [showChangelogViewer, setShowChangelogViewer] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictDetails, setConflictDetails] = useState<any[]>([]);
  const [pendingMergeData, setPendingMergeData] = useState<any>(null);
  const [activeLocks, setActiveLocks] = useState<Record<string, any>>({});
  const [showWidgetMenu, setShowWidgetMenu] = useState(false);
  const [dashboardFilter, setDashboardFilter] =
    useState<DashboardFilterCommand | null>(null);
  const widgetMenuRef = useRef<HTMLDivElement>(null);

  // Close widget menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        widgetMenuRef.current &&
        !widgetMenuRef.current.contains(e.target as Node)
      ) {
        setShowWidgetMenu(false);
      }
    };
    if (showWidgetMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWidgetMenu]);

  // Migrate existing tabs to have dashboardWidgets if missing and add ce_dashboard_example if missing
  useEffect(() => {
    setTabs((prevTabs) => {
      let changed = false;
      const newTabs = prevTabs.map((t) => {
        if (!t.dashboardWidgets) {
          changed = true;
          return { ...t, dashboardWidgets: ["stats", "spreadsheet"] };
        }
        return t;
      });
      if (!newTabs.find((t) => t.id === "ce_dashboard_example")) {
        changed = true;
        newTabs.unshift(
          DEFAULT_TABS.find((t) => t.id === "ce_dashboard_example")!,
        );
      }
      return changed ? newTabs : prevTabs;
    });

    setTabDataMap((prev) => {
      if (!prev["ce_dashboard_example"]) {
        return {
          ...prev,
          ce_dashboard_example: {
            requirements: CE_EXAMPLE_REQUIREMENTS,
            columns: CE_EXAMPLE_COLUMNS,
          },
        };
      }
      return prev;
    });
  }, []);

  // Ctrl + Mouse Wheel Zoom
  useEffect(() => {
    let currentZoom = 1;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        currentZoom = Math.max(0.3, Math.min(3, currentZoom + delta));
        (document.body.style as any).zoom = currentZoom.toString();
      }
    };

    // Non-passive listener required to call preventDefault
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const statesRef = useRef({
    tabDataMap,
    tabs,
    assigneesPool,
    appName,
    boardItems,
  });
  statesRef.current = { tabDataMap, tabs, assigneesPool, appName, boardItems };

  const [currentUser] = useState(() => {
    let user = localStorage.getItem("app_user_profile");
    if (!user) {
      const newId =
        "USR-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newUser = { id: newId, name: `User_${newId.slice(4)}` };
      localStorage.setItem("app_user_profile", JSON.stringify(newUser));
      return newUser;
    }
    return JSON.parse(user);
  });

  // Real-time Sync states
  const [dbPath, setDbPath] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>("");
  const [syncError, setSyncError] = useState<string | null>(null);
  // 결함#3 수정: mtime이 아니라 파일 payload 루트의 단조 증가 `_rev` 카운터를 보관한다.
  // save_data 호출 시 expectedRev로 전달되며, 서버 현재 _rev와 다르면 VERSION_CONFLICT.
  const lastSaveRef = useRef<number>(0);

  const [socket, setSocket] = useState<Socket | null>(null);

  const initCompleteData = useRef(false);
  const lastSavedPayload = useRef("");

  // Use a string ref to decouple serialization from React render
  const dataPayloadRef = useRef("");
  const syncTimerRef = useRef<any>(null);

  // §9 T2/R5 수정: 저장 경합 대응.
  // - conflictStreakRef: 연속 VERSION_CONFLICT 횟수 — 지수 백오프 계산용(다중 사용자
  //   동시 충돌 시 전원이 동시에 재시도하는 thundering herd 방지, 지터 포함).
  // - saveRetryNonce/saveRetryTimerRef: ITEM_LOCKED/LOCK_TIMEOUT으로 저장이 보류됐을 때
  //   상태 변경이 더 없어도 자동으로 재시도하도록 저장 이펙트를 재점화하는 논스.
  const conflictStreakRef = useRef(0);
  // [§14 P3-1] 저장 디바운스 설정값화 — 기본 1000ms(기존과 동일). 10인 이상 환경에서
  // 저장 경합이 심하면 app_config.saveDebounceMs(예: 2000)로 조정 가능(initServer에서 로드).
  const saveDebounceRef = useRef(1000);
  const saveRetryTimerRef = useRef<any>(null);
  const [saveRetryNonce, setSaveRetryNonce] = useState(0);
  const scheduleSaveRetry = (delayMs: number) => {
    if (saveRetryTimerRef.current) return; // 단일 타이머만 유지
    saveRetryTimerRef.current = setTimeout(() => {
      saveRetryTimerRef.current = null;
      setSaveRetryNonce((n) => n + 1);
    }, delayMs);
  };

  // Future feature modal states
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // [§14 T3+IO 최적화] preRead: 감시자/폴링이 방금 read_data한 응답을 그대로 넘겨받아
  // 병합 내부의 중복 read_data를 생략한다(원격 변경 1건당 NAS 읽기 2회→1회).
  // preRead가 코얼레싱 지연만큼 오래됐어도 안전 — 저장은 _rev CAS로 보호되므로
  // 최악의 경우 VERSION_CONFLICT 1회 후 재병합으로 수렴한다.
  const executeSmartMerge = async (serverPath: string, preRead?: any) => {
    try {
      // @ts-ignore
      const { invoke } = await import("@tauri-apps/api/core");
      const response: any =
        preRead ?? (await invoke("read_data", { path: serverPath }));
      const theirData = response.data;
      if (!theirData) return;
      const theirRev = response.rev ?? 0;

      let baseData;
      try {
        baseData = JSON.parse(lastSavedPayload.current);
      } catch {
        baseData = { tabDataMap: {}, assigneesPool: [] };
      }

      const myData = statesRef.current;
      // 3-way 병합 코어는 src/lib/mergeEngine.ts로 추출됨 (단위 테스트 대상).
      // 부수효과(setState/save_data)는 아래에 그대로 남는다.
      const { mergedPayload, conflicts } = computeSmartMerge(
        baseData,
        myData,
        theirData,
      );

      if (conflicts.length > 0) {
        setConflictDetails(conflicts);
        setPendingMergeData({
          mergedData: mergedPayload,
          version: theirRev,
        });
        setShowConflictModal(true);
      } else {
        // Auto merged!
        const normalizedTheirDataStr = JSON.stringify({
          tabDataMap: theirData.tabDataMap,
          tabs: theirData.tabs,
          assigneesPool: theirData.assigneesPool,
          appName: theirData.appName || statesRef.current.appName,
          boardItems: theirData.boardItems || statesRef.current.boardItems || [],
        });

        const normalizedMergedPayloadStr = JSON.stringify({
          tabDataMap: mergedPayload.tabDataMap,
          tabs: mergedPayload.tabs,
          assigneesPool: mergedPayload.assigneesPool,
          appName: mergedPayload.appName || statesRef.current.appName,
          boardItems: mergedPayload.boardItems || statesRef.current.boardItems || [],
        });

        if (mergedPayload.tabs) setTabs(mergedPayload.tabs);
        if (mergedPayload.tabDataMap) setTabDataMap(mergedPayload.tabDataMap);
        if (mergedPayload.assigneesPool) setAssigneesPool(mergedPayload.assigneesPool);

        if (normalizedMergedPayloadStr === normalizedTheirDataStr) {
          lastSaveRef.current = theirRev;
          lastSavedPayload.current = normalizedTheirDataStr;
          return;
        }

        const payloadStr = normalizedMergedPayloadStr;

        // Immediately save the resolved data to lock in the merge
        try {
          // @ts-ignore
          const { invoke } = await import("@tauri-apps/api/core");
          const modifiedId: any = await invoke("save_data", {
            path: serverPath,
            data: payloadStr,
            expectedRev: theirRev,
            userId: currentUser.id,
          });
          lastSaveRef.current = Number(modifiedId);
          lastSavedPayload.current = payloadStr;
        } catch (e) {
          console.error("Merge save failed:", e);
          // Update it locally anyway, wait for next heartbeat to fix discrepancy
          lastSaveRef.current = theirRev;
          lastSavedPayload.current = payloadStr;
        }
      }
    } catch (e) {
      console.error("Smart merge failed", e);
    }
  };

  // [§14 T3 최적화] 병합 코얼레싱 — 파일 감시자/폴링이 연속으로 변경을 알릴 때
  // (10인 환경에선 초당 수 회) 매 이벤트마다 병합하지 않고 400ms 창으로 묶어 1회만
  // 실행한다. 병합이 이미 진행 중이면 종료 후 1회 더 실행(pending)해 마지막 변경을
  // 놓치지 않는다. preRead는 가장 최신 것 하나만 유지.
  const mergeCoalesceTimerRef = useRef<any>(null);
  const mergeInFlightRef = useRef(false);
  const mergePendingRef = useRef<string | null>(null);
  const mergePreReadRef = useRef<any>(null);
  const requestSmartMerge = (serverPath: string, preRead?: any) => {
    if (preRead) mergePreReadRef.current = preRead;
    if (mergeInFlightRef.current) {
      mergePendingRef.current = serverPath;
      return;
    }
    if (mergeCoalesceTimerRef.current) return; // 이미 예약됨 — 이번 이벤트는 흡수
    mergeCoalesceTimerRef.current = setTimeout(async () => {
      mergeCoalesceTimerRef.current = null;
      mergeInFlightRef.current = true;
      const pre = mergePreReadRef.current;
      mergePreReadRef.current = null;
      try {
        await executeSmartMerge(serverPath, pre);
      } finally {
        mergeInFlightRef.current = false;
        if (mergePendingRef.current) {
          const p = mergePendingRef.current;
          mergePendingRef.current = null;
          requestSmartMerge(p); // 진행 중 쌓인 변경 1회 더 반영(신선한 재판독)
        }
      }
    }, 400);
  };

  // 2. Fetch Server Config Loading
  // 1. Polling Locks
  // [§14 R6 최적화] 락 폴링 + 전파 폴백 하이브리드.
  // 일부 NAS(Samba 설정)는 디렉터리 change-notify를 지원하지 않아 파일 감시자가
  // 조용히 침묵할 수 있다(§9 R6). 이미 2초마다 도는 락 폴링 인터벌에 mtime 힌트
  // 검사(메타데이터만, 파일 본문 미판독)를 얹어, mtime이 움직였을 때만 read_data로
  // rev를 확인하고 앞서 있으면 병합을 트리거한다 — 감시자가 죽어도 최대 ~2.4초
  // 안에 전파가 보장되고, 정상 경로에선 추가 비용이 메타데이터 조회 1회뿐이다.
  const lastPolledMtimeRef = useRef<number>(0);
  useEffect(() => {
    // @ts-ignore
    const isTauri = !!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window));
    if (isTauri && dbPath) {
      const interval = setInterval(async () => {
        try {
          // @ts-ignore
          const { invoke } = await import("@tauri-apps/api/core");
          const locks = await invoke("get_active_locks", {
            projectPath: dbPath,
          });
          setActiveLocks((prev) => {
            const newLocks = locks || {};
            if (JSON.stringify(prev) === JSON.stringify(newLocks)) return prev;
            return newLocks;
          });

          // 전파 폴백: mtime은 변경 "힌트"로만 사용(판정은 언제나 _rev CAS)
          try {
            const mtime: number = await invoke("get_file_modified_time_native", {
              path: dbPath,
            });
            if (mtime !== lastPolledMtimeRef.current) {
              lastPolledMtimeRef.current = mtime;
              const check: any = await invoke("read_data", { path: dbPath });
              if ((check.rev ?? 0) > lastSaveRef.current) {
                requestSmartMerge(dbPath, check);
              }
            }
          } catch {}
        } catch (e) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [dbPath]);

  useEffect(() => {
    const initServer = async () => {
      try {
        setSyncError(null);
        // @ts-ignore
        const isTauri = !!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window));

        let configStr = localStorage.getItem("app_config");
        let config: any = null;

        if (isTauri) {
          try {
            // @ts-ignore
            const { invoke } = await import("@tauri-apps/api/core");
            let rawConfig: any;
            try {
              rawConfig = await invoke("get_server_config");
            } catch (e) {
              console.warn("No server config found:", e);
              rawConfig = {};
            }

            if (!rawConfig || !rawConfig.activeDataPath) {
              // If there's no data path setup, open settings tab
              setCurrentTab("settings_menu");
            }

            if (rawConfig && rawConfig.activeDataPath) {
              // UNC Path correction for network shared drives
              const uncPath = await invoke("convert_to_unc_path", {
                path: rawConfig.activeDataPath,
              });
              rawConfig.activeDataPath = uncPath;

              const d = new Date();
              const yy = String(d.getFullYear()).slice(-2);
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              const todayStr = `${yy}${mm}${dd}`;

              let shouldPrompt = false;
              let fileDateStr = "알 수 없음";

              try {
                const { invoke } = await import("@tauri-apps/api/core");
                // 실제 OS 파일 메타데이터(마지막 수정일) 가져오기
                const mtimeMs: number = await invoke("get_file_modified_time_native", { path: rawConfig.activeDataPath });
                const mtimeDate = new Date(mtimeMs);
                const mYy = String(mtimeDate.getFullYear()).slice(-2);
                const mMm = String(mtimeDate.getMonth() + 1).padStart(2, "0");
                const mDd = String(mtimeDate.getDate()).padStart(2, "0");
                fileDateStr = `${mYy}${mMm}${mDd}`;

                if (fileDateStr !== todayStr) {
                  shouldPrompt = true;
                }
              } catch (e) {
                console.warn("Failed to get file metadata, falling back to filename check", e);
                const match = rawConfig.activeDataPath.match(/_(\d{6})\.json$/i);
                if (match) {
                  fileDateStr = match[1];
                  if (fileDateStr !== todayStr) {
                    shouldPrompt = true;
                  }
                }
              }

              if (shouldPrompt) {
                const { ask } = await import("@tauri-apps/plugin-dialog");
                const wantBackup = await ask(
                  `서버 파일 일자(${fileDateStr})가 오늘(${todayStr})과 다릅니다.\n오늘 일자로 신규 관리 파일을 생성하시겠습니까?`,
                  { title: "신규 관리 파일 생성", kind: "info" },
                );
                
                if (wantBackup) {
                  let newPath = "";
                  if (/_(\d{6})\.json$/i.test(rawConfig.activeDataPath)) {
                    newPath = rawConfig.activeDataPath.replace(/_\d{6}\.json$/i, `_${todayStr}.json`);
                  } else {
                    newPath = rawConfig.activeDataPath.replace(/\.json$/i, `_${todayStr}.json`);
                  }

                  try {
                    const { invoke } = await import("@tauri-apps/api/core");
                    const fileExists = await invoke("check_file_exists_native", { path: newPath });
                    if (!fileExists) {
                      await invoke("copy_file_native", {
                        source: rawConfig.activeDataPath,
                        dest: newPath,
                      });
                    }
                    rawConfig.activeDataPath = newPath;
                    await invoke("update_server_config", { activePath: newPath }).catch(() => null);

                    const { message } = await import("@tauri-apps/plugin-dialog");
                    await message("기존 데이터를 성공적으로 복사하여 새로운 일자의 파일로 백업 및 전환했습니다.", { title: "백업 완료", kind: "info" });
                  } catch (err) {
                    const { message } = await import("@tauri-apps/plugin-dialog");
                    await message("신규 파일 생성에 실패하여 기존 파일을 유지합니다.", { kind: "error" });
                    console.error("Backup copy failed", err);
                  }
                }
              }
            }

            // Merge with local config (like excelExportPath which is local only)
            const localConfig = configStr ? JSON.parse(configStr) : {};
            config = { ...localConfig, ...rawConfig };
            localStorage.setItem("app_config", JSON.stringify(config));
          } catch (e) {
            console.error("Tauri init failed:", e);
            if (configStr) config = JSON.parse(configStr);
          }
        } else {
          // Web Fallback
          try {
            const resConfig = await fetch("/api/config/server-config", {
              cache: "no-store",
            });
            if (resConfig.ok) {
              config = await resConfig.json();
              localStorage.setItem("app_config", JSON.stringify(config));
            } else {
              if (configStr) config = JSON.parse(configStr);
            }
          } catch {
            if (configStr) config = JSON.parse(configStr);
          }
        }

        // [§14 P3-1] 운영 튜닝용 저장 디바운스 오버라이드(하한 250ms — 실수 방지)
        if (config && typeof config.saveDebounceMs === "number" && config.saveDebounceMs >= 250) {
          saveDebounceRef.current = config.saveDebounceMs;
        }

        if (config && config.activeDataPath) {
          setDbPath(config.activeDataPath);
          await fetchData(config.activeDataPath);
        } else {
          const localDataStr = localStorage.getItem("offline_db");
          if (localDataStr) {
            const parsed = JSON.parse(localDataStr);
            applyData(parsed);
            lastSavedPayload.current = JSON.stringify(parsed);
          } else {
            applyData({});
            lastSavedPayload.current = JSON.stringify({
              tabDataMap: {},
              tabs: DEFAULT_TABS,
              assigneesPool: INITIAL_ASSIGNEES,
              appName: "Business Management System",
              boardItems: [],
            });
          }
          initCompleteData.current = true;
        }
      } catch (e: any) {
        console.warn("Server initialization failed:", e);
        const localDataStr = localStorage.getItem("offline_db");
        if (localDataStr) {
          const parsed = JSON.parse(localDataStr);
          applyData(parsed);
          lastSavedPayload.current = JSON.stringify(parsed);
        } else {
          applyData({});
          lastSavedPayload.current = JSON.stringify({
            tabDataMap: {},
            tabs: DEFAULT_TABS,
            assigneesPool: INITIAL_ASSIGNEES,
            appName: "Business Management System",
            boardItems: [],
          });
        }
        initCompleteData.current = true;
      }
    };

    const fetchData = async (path?: string) => {
      const fetchPath = path || dbPath;
      if (!fetchPath) return;
      try {
        let parsed: any = null;

        // @ts-ignore
        const isTauri = !!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window));

        const configStr = localStorage.getItem("app_config");
        const config = configStr ? JSON.parse(configStr) : null;

        if (isTauri) {
          // @ts-ignore
          const { invoke, listen } = await import("@tauri-apps/api/core");
          const { listen: tListen } = await import("@tauri-apps/api/event");
          const response: any = await invoke("read_data", { path: fetchPath });
          parsed = response.data;
          lastSaveRef.current = response.rev ?? 0;

          // Start watcher and listen for changes
          await invoke("start_file_watcher", { path: fetchPath });

          (window as any).__unlistenWatcher?.();
          (window as any).__unlistenWatcher = await tListen(
            "shared-file-changed",
            async (e: any) => {
              if (e.payload === fetchPath) {
                // _rev가 내가 아는 것보다 커졌으면 타인이 저장한 것 (mtime 오차창 불필요)
                try {
                  const check: any = await invoke("read_data", {
                    path: fetchPath,
                  });
                  if ((check.rev ?? 0) > lastSaveRef.current) {
                    // [§14] 코얼레싱 + 사전판독(check) 재사용 — 중복 read_data 제거
                    requestSmartMerge(fetchPath, check);
                  }
                } catch (err) {
                  console.error(err);
                }
              }
            },
          );
        } else {
          // Web Fallback not supported in native offline mode
        }

        if (parsed) {
          applyData(parsed);
          lastSavedPayload.current = JSON.stringify(parsed);
        } else {
          localStorage.removeItem("offline_db");
          const localDataStr = localStorage.getItem("offline_db");
          if (localDataStr) {
            const parsed = JSON.parse(localDataStr);
            applyData(parsed);
            if (parsed.appName) setAppName(parsed.appName);
            lastSavedPayload.current = JSON.stringify(parsed);
          } else {
            applyData({});
            lastSavedPayload.current = JSON.stringify({
              tabDataMap: {},
              tabs: DEFAULT_TABS,
              assigneesPool: INITIAL_ASSIGNEES,
              appName: "Business Management System",
              boardItems: [],
            });
          }
        }
      } catch (e) {
        console.error("Failed to load path:", e);
        localStorage.removeItem("offline_db");
        const localDataStr = localStorage.getItem("offline_db");
        if (localDataStr) {
          const parsed = JSON.parse(localDataStr);
          applyData(parsed);
          if (parsed.appName) setAppName(parsed.appName);
          lastSavedPayload.current = JSON.stringify(parsed);
        } else {
          applyData({});
          lastSavedPayload.current = JSON.stringify({
            tabDataMap: {},
            tabs: DEFAULT_TABS,
            assigneesPool: INITIAL_ASSIGNEES,
            appName: "Business Management System",
            boardItems: [],
          });
        }
      } finally {
        initCompleteData.current = true;
      }
    };

    initServer();

    return () => {
      setSocket((s) => {
        s?.disconnect();
        return null;
      });
    };
  }, []);

  // 3. Save Data to Server Node Runtime File System
  useEffect(() => {
    if (!initCompleteData.current) return;

    // Use a timeout to stringify outside of the React render cycle
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const newPayload = JSON.stringify({
        tabDataMap: statesRef.current.tabDataMap,
        tabs: statesRef.current.tabs,
        assigneesPool: statesRef.current.assigneesPool,
        appName: statesRef.current.appName,
        boardItems: statesRef.current.boardItems,
      });
      dataPayloadRef.current = newPayload;

      if (newPayload === lastSavedPayload.current) return; // Prevent double save

      try {
        localStorage.setItem("offline_db", newPayload);

        // @ts-ignore
        const isTauri = !!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window));

        if (isTauri && dbPath) {
          try {
            // @ts-ignore
            const { invoke } = await import("@tauri-apps/api/core");
            const newModified: any = await invoke("save_data", {
              path: dbPath,
              data: newPayload,
              expectedRev: lastSaveRef.current ?? 0,
              userId: currentUser.id,
            });
            if (newModified) lastSaveRef.current = newModified;
            conflictStreakRef.current = 0; // 저장 성공 → 백오프 리셋

            await invoke("append_changelog", {
              projectPath: dbPath,
              logEntry: {
                userId: currentUser.id,
                userName: currentUser.name,
                action: `요구사항 데이터 일괄 저장 (항목 개수: ${statesRef.current.tabDataMap[currentTab]?.requirements?.length || 0}개)`,
                timestamp: Date.now(),
              },
            });
          } catch (e: any) {
            console.error("Tauri save failed", e);
            if (String(e).includes("VERSION_CONFLICT")) {
              // §9 T2 수정: 즉시 재시도하지 않고 지수 백오프+지터 후 병합 —
              // 여러 사용자가 동시에 충돌했을 때 재시도가 서로 겹치지 않게 분산시킨다.
              const streak = conflictStreakRef.current++;
              const backoff =
                Math.min(250 * 2 ** streak, 3000) + Math.random() * 250;
              setTimeout(() => {
                // [§14] 코얼레싱 경유 — 감시자/폴링 트리거와 병합이 중복 실행되지 않음
                requestSmartMerge(dbPath);
              }, backoff);
              return; // Early return to prevent overwriting lastSavedPayload with conflicting data
            } else if (String(e).includes("ITEM_LOCKED")) {
              // 결함#4 수정: 타 사용자가 편집 중인 항목이 있어 저장이 거부됨.
              // §9 R5 수정: 상태 변경이 더 없어도 3초 후 자동 재시도(락 TTL 최대 15초이므로
              // 곧 해소됨). lastSavedPayload를 갱신하지 않아 재시도 시 같은 내용이 저장된다.
              setSyncError("다른 사용자가 편집 중인 항목이 있어 저장이 보류되었습니다. 잠시 후 자동으로 다시 저장됩니다.");
              scheduleSaveRetry(3000);
              return;
            } else if (String(e).includes("LOCK_TIMEOUT")) {
              // §9 T1 수정: 공유 파일 임계구역 혼잡은 "오프라인"이 아니라 일시적 대기 상태 —
              // 사용자에게 정확히 알리고 지터를 섞어 자동 재시도한다.
              setSyncError("공유 파일 사용량이 많아 저장 대기 중입니다. 자동으로 다시 시도합니다.");
              scheduleSaveRetry(1500 + Math.random() * 1500);
              return;
            } else {
              throw e;
            }
          }
        }

        // Success (either local or networked)
        lastSavedPayload.current = newPayload;
        setSyncError(null);
      } catch (e: any) {
        setSyncError(`오프라인 모드 작동 중 (서버 동기화 실패)`);
        // We still saved it to localStorage, so update lastSavedPayload
        lastSavedPayload.current = newPayload;
      }
    }, saveDebounceRef.current); // Atomic write with debounce (기본 1000ms, app_config.saveDebounceMs로 조정 가능)
  }, [tabDataMap, tabs, assigneesPool, appName, dbPath, saveRetryNonce]); // Triggers when state changes or a deferred save retries

  // 4. Force flush on unload/visibilitychange
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem("offline_db", dataPayloadRef.current);
      } catch {}
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) flush();
    });
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  const handleOpenComingSoon = (featureName: string) => {
    setComingSoonFeature(featureName);
    setFeedbackText("");
  };

  const handleCloseComingSoon = () => {
    setComingSoonFeature(null);
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setShowSuccessToast(true);
    setComingSoonFeature(null);
    setFeedbackText("");

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);
  };

  const handleTauriSave = async () => {
    // @ts-ignore
    if (!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window))) return;
    try {
      // @ts-ignore
      const { save, message } = await import("@tauri-apps/plugin-dialog");
      // @ts-ignore
      const { invoke } = await import("@tauri-apps/api/core");

      const dataPayload = JSON.stringify(
        {
          tabDataMap: statesRef.current.tabDataMap,
          tabs: statesRef.current.tabs,
          assigneesPool: statesRef.current.assigneesPool,
          appName: statesRef.current.appName,
          boardItems: statesRef.current.boardItems,
        },
        null,
        2,
      );

      const filePath = await save({
        filters: [{ name: "JSON Data", extensions: ["json"] }],
      });

      if (filePath) {
        // 기존 plugin-fs가 아닌 Rust 백엔드의 안전한 Atomic Save 기능을 호출 (동시성 및 백업 지원)
        // 새로운 'Save As' 대상 경로이므로 expectedRev 0(=파일 없음/최초 저장)으로 저장.
        const newModified: any = await invoke("save_data", {
          path: filePath,
          data: dataPayload,
          expectedRev: 0,
          userId: currentUser.id,
        });

        lastSaveRef.current = Number(newModified);
        lastSavedPayload.current = dataPayload;

        const configStr = localStorage.getItem("app_config");
        const localConfig = configStr ? JSON.parse(configStr) : {};
        localStorage.setItem(
          "app_config",
          JSON.stringify({ ...localConfig, activeDataPath: filePath }),
        );
        setDbPath(filePath);

        // Restart the file watcher for the new dbPath
        try {
          // @ts-ignore
          const { listen: tListen } = await import("@tauri-apps/api/event");
          await invoke("start_file_watcher", { path: filePath });
          (window as any).__unlistenWatcher?.();
          (window as any).__unlistenWatcher = await tListen(
            "shared-file-changed",
            async (e: any) => {
              if (e.payload === filePath) {
                try {
                  const check: any = await invoke("read_data", {
                    path: filePath,
                  });
                  if ((check.rev ?? 0) > lastSaveRef.current) {
                    // [§14] 코얼레싱 + 사전판독 재사용
                    requestSmartMerge(filePath, check);
                  }
                } catch (err) {
                  console.error(err);
                }
              }
            },
          );
        } catch (e) {
          console.error("File watcher rebind failed", e);
        }

        await message(`성공적으로 저장되었습니다.\n경로: ${filePath}`, {
          title: "저장 완료",
          kind: "info",
        });
      }
    } catch (e) {
      console.error(e);
      // @ts-ignore
      const { message } = await import("@tauri-apps/plugin-dialog");
      await message(`저장 중 오류가 발생했습니다: ${e}`, {
        title: "오류",
        kind: "error",
      });
    }
  };

  const handleTauriOpen = async () => {
    // @ts-ignore
    if (!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window))) return;
    try {
      // @ts-ignore
      const { open, confirm, message } =
        await import("@tauri-apps/plugin-dialog");
      // @ts-ignore
      const { invoke } = await import("@tauri-apps/api/core");

      const isConfirmed = await confirm(
        "작업 중인 데이터가 덮어씌워집니다. 계속하시겠습니까?",
        { title: "경고", kind: "warning" },
      );
      if (!isConfirmed) return;

      const filePath = await open({
        multiple: false,
        filters: [{ name: "JSON Data", extensions: ["json"] }],
      });

      if (filePath && typeof filePath === "string") {
        // 백엔드의 read_data 호출 (.bak 복구 자동화)
        const response: any = await invoke("read_data", { path: filePath });
        const parsed = response.data;

        if (dbPath && dbPath !== filePath) {
          const overwriteCurrent = await confirm(
            `현재 설정된 데이터 파일에 이 백업 데이터를 덮어쓰시겠습니까?\n\n'Yes'를 누르면 현재 설정된 파일에 덮어씁니다.\n'No'를 누르면 이 파일을 새로운 데이터 저장 경로로 변경합니다.`,
            { title: "가져오기 방식 선택", kind: "info" },
          );

          if (overwriteCurrent) {
            applyData(parsed);
            lastSavedPayload.current = ""; // 즉시 저장이 트리거되도록 빈 값으로 설정
            await message(
              "현재 활성화된 데이터 파일에 백업 데이터가 덮어씌워졌습니다.",
              { title: "덮어쓰기 완료", kind: "info" },
            );
            return;
          }
        }

        applyData(parsed);
        lastSavedPayload.current = JSON.stringify(parsed);

        const configStr = localStorage.getItem("app_config");
        const localConfig = configStr ? JSON.parse(configStr) : {};
        localStorage.setItem(
          "app_config",
          JSON.stringify({ ...localConfig, activeDataPath: filePath }),
        );
        setDbPath(filePath);

        lastSaveRef.current = response.rev ?? 0;

        // Restart the file watcher
        try {
          // @ts-ignore
          const { listen: tListen } = await import("@tauri-apps/api/event");
          // @ts-ignore
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("start_file_watcher", { path: filePath });
          (window as any).__unlistenWatcher?.();
          (window as any).__unlistenWatcher = await tListen(
            "shared-file-changed",
            async (e: any) => {
              if (e.payload === filePath) {
                try {
                  const check: any = await invoke("read_data", {
                    path: filePath,
                  });
                  if ((check.rev ?? 0) > lastSaveRef.current) {
                    // [§14] 코얼레싱 + 사전판독 재사용
                    requestSmartMerge(filePath, check);
                  }
                } catch (err) {
                  console.error(err);
                }
              }
            },
          );
        } catch (e) {
          console.error("File watcher rebind failed", e);
        }

        await message(`데이터를 성공적으로 불러왔습니다.\n경로: ${filePath}`, {
          title: "불러오기 완료",
          kind: "info",
        });
      }
    } catch (e) {
      console.error(e);
      // @ts-ignore
      const { message } = await import("@tauri-apps/plugin-dialog");
      await message(`불러오기 중 오류가 발생했습니다: ${e}`, {
        title: "오류",
        kind: "error",
      });
    }
  };

  const handleExportHtml = async () => {
    try {
      setIsExportingHtml(true);
      const isTauri = !!(
        (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI_IPC__
      );

      if (!isTauri) {
        // Web Mode: Use the backend Vite API integration to build the single file HTML
        const res = await fetch("/api/download-offline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: { tabDataMap, tabs, assigneesPool, appName },
          }),
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Offline download failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `offline_app_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Tauri Mode: The app is already a single HTML file bundle running natively
        let htmlText = "";
        try {
          const res = await fetch(window.location.href);
          htmlText = await res.text();
        } catch (err) {
          htmlText = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
        }

        // Remove any injected scripts to avoid duplicates, although simple replace is safer
        const safeJsonPayload = JSON.stringify({
          tabDataMap,
          tabs,
          assigneesPool,
          appName,
        }).replace(/</g, "\\u003c");
        const payloadScript = `<script>window.OFFLINE_DATA = ${safeJsonPayload};</script>`;
        if (htmlText.includes("window.OFFLINE_DATA")) {
          // Replace existing OFFLINE_DATA if present
          htmlText = htmlText.replace(
            /<script>window\.OFFLINE_DATA\s*=\s*\{[\s\S]*?\}<\/script>/,
            payloadScript,
          );
        } else {
          htmlText = htmlText.replace(/<\/body>/i, `${payloadScript}\n</body>`);
        }

        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");

        const filePath = await save({
          filters: [{ name: "HTML Document", extensions: ["html"] }],
          defaultPath: `offline_app_${new Date().toISOString().slice(0, 10)}.html`,
        });

        if (filePath) {
          await writeTextFile(filePath, htmlText);
          const { message } = await import("@tauri-apps/plugin-dialog");
          await message("파일이 성공적으로 내보내졌습니다.", {
            title: "내보내기 완료",
            kind: "info",
          });
        }
      }
    } catch (e) {
      console.error("Failed to export HTML", e);
      if (
        typeof window !== "undefined" &&
        ((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI_IPC__)
      ) {
        const { message } = await import("@tauri-apps/plugin-dialog");
        await message(`파일 저장 중 오류가 발생했습니다: ${e}`, {
          title: "오류",
          kind: "error",
        });
      } else {
        alert("파일 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setIsExportingHtml(false);
    }
  };

  // When testing offline payload loading placeholder...
  useEffect(() => {
    // @ts-ignore
    if (window.OFFLINE_DATA) {
      // @ts-ignore
      applyData(window.OFFLINE_DATA);
      initCompleteData.current = true;
    }
  }, []);

  const handleSetRequirements = useCallback(
    (reqs: React.SetStateAction<Requirement[]>) => {
      setTabDataMap((prev) => ({
        ...prev,
        [currentTab]: {
          ...(prev[currentTab] || { columns: DEFAULT_COLUMNS }),
          requirements:
            typeof reqs === "function"
              ? (reqs as any)(
                  (prev[currentTab] || { requirements: [] }).requirements,
                )
              : reqs,
        },
      }));
    },
    [currentTab],
  );

  return (
    <div
      id="b2b-management-app"
      className="bg-brand-surface-lowest text-brand-on-surface font-sans h-screen overflow-hidden flex"
    >
      {/* 1. Sidebar Left Panel */}

      <Sidebar
        currentTab={currentTab}
        tabs={tabs}
        onTauriSave={handleTauriSave}
        onTauriOpen={handleTauriOpen}
        onExportHtml={handleExportHtml}
        isExportingHtml={isExportingHtml}
        onTabChange={(tabId) => {
          setCurrentTab(tabId);
        }}
        onTabRename={(tabId, newLabel) => {
          setTabs((prev) =>
            prev.map((t) =>
              t.id === tabId ? { ...t, sidebarLabel: newLabel } : t,
            ),
          );
        }}
      />

      {/* 2. Main Workstage Content (offsetted due to sidebar width) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden ml-16 lg:ml-[220px] w-[calc(100%-64px)] lg:w-[calc(100%-220px)] transition-all duration-300 min-w-0">
        {/* Top Navbar */}
        <NavBar appName={appName} onAppNameChange={setAppName} />

        {/* Scrollable Worksite Canvas */}
        <main className="flex-1 p-4 md:p-6 mt-16 min-w-0 flex flex-col pb-4 overflow-y-auto">
          {currentTab === "settings_menu" ? (
            <SettingsPage
              onConfigSaved={() => {
                window.location.reload();
              }}
            />
          ) : currentTab === "board_menu" ? (
            <BoardPage boardItems={boardItems} setBoardItems={setBoardItems} />
          ) : (
            (() => {
              // [결함 #9 수정] tabs가 비어 있어도(오염된 공유 파일 등) 렌더가 크래시하지
              // 않도록 기본 탭으로 폴백 — 크래시 대신 기본 화면을 보여주고, 다음 저장이
              // 정상 tabs를 파일에 복원한다.
              const activeTabInfo =
                tabs.find((t) => t.id === currentTab) || tabs[0] || DEFAULT_TABS[0];
              const tData = tabDataMap[currentTab] || {
                requirements: [],
                columns: DEFAULT_COLUMNS,
              };
              return (
                <div className="flex flex-col flex-1 min-h-0 animate-fade-slide-up">
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-outline-variant/40 pb-5 shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-5 h-5 text-brand-primary" />
                        <span className="text-[11px] uppercase tracking-wider font-bold text-brand-primary font-mono">
                          B2B Platform Workspace
                        </span>
                      </div>

                      <div className="flex items-center gap-2 group">
                        <input
                          value={activeTabInfo.dashboardTitle}
                          onChange={(e) => {
                            setTabs((prev) =>
                              prev.map((t) =>
                                t.id === currentTab
                                  ? { ...t, dashboardTitle: e.target.value }
                                  : t,
                              ),
                            );
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
                            setTabs((prev) =>
                              prev.map((t) =>
                                t.id === currentTab
                                  ? { ...t, dashboardDesc: e.target.value }
                                  : t,
                              ),
                            );
                          }}
                          className="text-[18px] text-brand-on-surface-variant leading-relaxed opacity-80 bg-transparent outline-none w-full resize-none border-b border-transparent focus:border-brand-primary/50 transition-colors"
                          rows={2}
                          placeholder="대시보드 설명을 입력하세요"
                        />
                        <Edit2 className="w-4 h-4 text-brand-on-surface-variant opacity-0 group-hover:opacity-50 transition-opacity shrink-0 mt-2" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <div className="flex gap-2 justify-end">
                        <div className="relative" ref={widgetMenuRef}>
                          <button
                            onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                            className="flex items-center justify-center gap-2 py-2 px-3 bg-brand-surface-high border border-brand-outline-variant rounded-lg text-xs font-semibold text-brand-on-surface hover:bg-brand-surface-highest transition-colors cursor-pointer"
                          >
                            <Layout className="w-4 h-4" />
                            레이아웃 설정
                          </button>
                          {showWidgetMenu && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-brand-surface-highest border border-brand-outline-variant shadow-xl rounded-xl p-3 z-50 animate-in fade-in zoom-in duration-200">
                              <h4 className="text-xs font-bold text-brand-on-surface mb-2 border-b border-brand-outline-variant/50 pb-2">
                                대시보드 위젯 구성
                              </h4>
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-brand-on-surface-variant hover:text-brand-on-surface cursor-pointer p-1 rounded-md hover:bg-brand-primary-container/10">
                                  <input
                                    type="checkbox"
                                    className="rounded border-brand-outline text-brand-primary focus:ring-brand-primary/50"
                                    checked={
                                      activeTabInfo.dashboardWidgets?.includes(
                                        "stats",
                                      ) ?? true
                                    }
                                    onChange={(e) => {
                                      const widgets =
                                        activeTabInfo.dashboardWidgets || [
                                          "stats",
                                          "spreadsheet",
                                        ];
                                      const newWidgets = e.target.checked
                                        ? Array.from(
                                            new Set([...widgets, "stats"]),
                                          )
                                        : widgets.filter((w) => w !== "stats");
                                      setTabs((prev) =>
                                        prev.map((t) =>
                                          t.id === currentTab
                                            ? {
                                                ...t,
                                                dashboardWidgets: newWidgets,
                                              }
                                            : t,
                                        ),
                                      );
                                    }}
                                  />
                                  <span>통계 및 요약 카드</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-brand-on-surface-variant hover:text-brand-on-surface cursor-pointer p-1 rounded-md hover:bg-brand-primary-container/10">
                                  <input
                                    type="checkbox"
                                    className="rounded border-brand-outline text-brand-primary focus:ring-brand-primary/50"
                                    checked={
                                      activeTabInfo.dashboardWidgets?.includes(
                                        "ce_dashboard",
                                      ) ?? false
                                    }
                                    onChange={(e) => {
                                      const widgets =
                                        activeTabInfo.dashboardWidgets || [
                                          "stats",
                                          "spreadsheet",
                                        ];
                                      const newWidgets = e.target.checked
                                        ? Array.from(
                                            new Set([
                                              ...widgets,
                                              "ce_dashboard",
                                            ]),
                                          )
                                        : widgets.filter(
                                            (w) => w !== "ce_dashboard",
                                          );
                                      setTabs((prev) =>
                                        prev.map((t) =>
                                          t.id === currentTab
                                            ? {
                                                ...t,
                                                dashboardWidgets: newWidgets,
                                              }
                                            : t,
                                        ),
                                      );
                                    }}
                                  />
                                  <span>CE (Cost Estimation)</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-brand-on-surface-variant hover:text-brand-on-surface cursor-pointer p-1 rounded-md hover:bg-brand-primary-container/10">
                                  <input
                                    type="checkbox"
                                    className="rounded border-brand-outline text-brand-primary focus:ring-brand-primary/50"
                                    checked={
                                      activeTabInfo.dashboardWidgets?.includes(
                                        "spreadsheet",
                                      ) ?? true
                                    }
                                    onChange={(e) => {
                                      const widgets =
                                        activeTabInfo.dashboardWidgets || [
                                          "stats",
                                          "spreadsheet",
                                        ];
                                      const newWidgets = e.target.checked
                                        ? Array.from(
                                            new Set([
                                              ...widgets,
                                              "spreadsheet",
                                            ]),
                                          )
                                        : widgets.filter(
                                            (w) => w !== "spreadsheet",
                                          );
                                      setTabs((prev) =>
                                        prev.map((t) =>
                                          t.id === currentTab
                                            ? {
                                                ...t,
                                                dashboardWidgets: newWidgets,
                                              }
                                            : t,
                                        ),
                                      );
                                    }}
                                  />
                                  <span>스프레드시트 뷰</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-brand-on-surface-variant hover:text-brand-on-surface cursor-pointer p-1 rounded-md hover:bg-brand-primary-container/10">
                                  <input
                                    type="checkbox"
                                    className="rounded border-brand-outline text-brand-primary focus:ring-brand-primary/50"
                                    checked={
                                      activeTabInfo.dashboardWidgets?.includes(
                                        "timeline",
                                      ) ?? false
                                    }
                                    onChange={(e) => {
                                      const widgets =
                                        activeTabInfo.dashboardWidgets || [
                                          "stats",
                                          "spreadsheet",
                                        ];
                                      const newWidgets = e.target.checked
                                        ? Array.from(
                                            new Set([...widgets, "timeline"]),
                                          )
                                        : widgets.filter(
                                            (w) => w !== "timeline",
                                          );
                                      setTabs((prev) =>
                                        prev.map((t) =>
                                          t.id === currentTab
                                            ? {
                                                ...t,
                                                dashboardWidgets: newWidgets,
                                              }
                                            : t,
                                        ),
                                      );
                                    }}
                                  />
                                  <span>타임라인 대시보드</span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        {dbPath && (
                          <button
                            onClick={() => setShowChangelogViewer(true)}
                            className="flex items-center justify-center gap-2 py-2 px-3 bg-brand-surface-high border border-brand-outline-variant rounded-lg text-xs font-semibold text-brand-on-surface hover:bg-brand-surface-highest transition-colors cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                            실시간 작업 이력 확인
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {syncError && (
                    <div className="mb-4 bg-brand-error/10 border border-brand-error text-brand-error text-xs p-3 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {syncError}
                      </span>
                    </div>
                  )}

                  {(() => {
                    const hasStats =
                      activeTabInfo.dashboardWidgets?.includes("stats") ?? true;
                    const hasTimeline =
                      activeTabInfo.dashboardWidgets?.includes("timeline") ??
                      false;
                    const hasCE =
                      activeTabInfo.dashboardWidgets?.includes(
                        "ce_dashboard",
                      ) ?? false;
                    const hasSpreadsheet =
                      activeTabInfo.dashboardWidgets?.includes("spreadsheet") ??
                      true;

                    return (
                      <div className="flex flex-col flex-1 gap-6 min-h-max">
                        {(hasStats || hasTimeline || hasCE) && (
                          <div className={`flex flex-col gap-6 shrink-0`}>
                            {hasStats && (
                              <StatsCards
                                key={currentTab}
                                requirements={tData.requirements}
                                columns={tData.columns}
                                openComingSoonModal={handleOpenComingSoon}
                                onDashboardFilter={setDashboardFilter}
                                configs={tData.statsCardConfigs}
                                onConfigsChange={(newConfigs) => {
                                  setTabDataMap((prev) => ({
                                    ...prev,
                                    [currentTab]: {
                                      ...prev[currentTab],
                                      statsCardConfigs: newConfigs,
                                    },
                                  }));
                                }}
                              />
                            )}

                            {hasTimeline && (
                              <TimelineDashboard
                                key={currentTab}
                                requirements={tData.requirements}
                                columns={tData.columns}
                                config={tData.timelineConfig}
                                onConfigChange={(newConfig) => {
                                  setTabDataMap((prev) => ({
                                    ...prev,
                                    [currentTab]: {
                                      ...prev[currentTab],
                                      timelineConfig: newConfig,
                                    },
                                  }));
                                }}
                                onDashboardFilter={setDashboardFilter}
                              />
                            )}

                            {hasCE && (
                              <CEDashboard
                                key={currentTab}
                                requirements={tData.requirements}
                                columns={tData.columns}
                                tabDataMap={tabDataMap}
                                tabs={tabs}
                                configs={activeTabInfo.ceDashboardConfigs || []}
                                onConfigChange={(index, newConfig) => {
                                  const newConfigs = [
                                    ...(activeTabInfo.ceDashboardConfigs || []),
                                  ];
                                  newConfigs[index] = newConfig;
                                  setTabs((prev) =>
                                    prev.map((t) =>
                                      t.id === currentTab
                                        ? {
                                            ...t,
                                            ceDashboardConfigs: newConfigs,
                                          }
                                        : t,
                                    ),
                                  );
                                }}
                                onConfigsChange={(newConfigs) => {
                                  setTabs((prev) =>
                                    prev.map((t) =>
                                      t.id === currentTab
                                        ? {
                                            ...t,
                                            ceDashboardConfigs: newConfigs,
                                          }
                                        : t,
                                    ),
                                  );
                                }}
                              />
                            )}
                          </div>
                        )}

                        {hasSpreadsheet && (
                          <div className="relative h-[80vh] min-h-[500px] flex flex-col min-w-0">
                            <Spreadsheet
                              key={currentTab}
                              activeTabId={currentTab}
                              tabDataMap={tabDataMap}
                              tabs={tabs}
                              requirements={tData.requirements}
                              setRequirements={handleSetRequirements}
                              assigneesPool={assigneesPool}
                              setAssigneesPool={setAssigneesPool}
                              columns={tData.columns}
                              setColumns={(cols) => {
                                setTabDataMap((prev) => ({
                                  ...prev,
                                  [currentTab]: {
                                    ...(prev[currentTab] || {
                                      requirements: [],
                                    }),
                                    columns:
                                      typeof cols === "function"
                                        ? cols(
                                            (
                                              prev[currentTab] || {
                                                columns: DEFAULT_COLUMNS,
                                              }
                                            ).columns,
                                          )
                                        : cols,
                                  },
                                }));
                              }}
                              openComingSoonModal={handleOpenComingSoon}
                              socket={socket}
                              dbPath={dbPath}
                              currentUser={currentUser}
                              activeLocks={activeLocks}
                              dashboardFilter={dashboardFilter}
                              onDashboardFilterConsumed={() =>
                                setDashboardFilter(null)
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()
          )}
        </main>
      </div>

      {showConflictModal && (
        <ConflictModal
          conflicts={conflictDetails}
          onResolve={async (strategy, choices) => {
            const dataPayload = JSON.stringify(
              {
                tabDataMap: statesRef.current.tabDataMap,
                tabs: statesRef.current.tabs,
                assigneesPool: statesRef.current.assigneesPool,
                appName: statesRef.current.appName,
                boardItems: statesRef.current.boardItems,
              },
              null,
              2,
            );

            setShowConflictModal(false);
            if (strategy === "mine") {
              // 강제 덮어쓰기: 저장 직전 현재 파일의 최신 rev를 다시 읽어 그 rev로 저장한다.
              // (참고: 예전 mtime 체계에서 expectedVersion:0은 파일이 이미 존재하면 mtime이
              //  항상 500ms보다 크므로 매번 VERSION_CONFLICT로 조용히 실패하던 결함이 있었음 —
              //  이번 _rev 전환 과정에서 함께 수정.)
              if (dataPayload === lastSavedPayload.current) return; // Bypass double save block
              const { invoke } = await import("@tauri-apps/api/core");
              try {
                const current: any = await invoke("read_data", { path: dbPath });
                const newModified: any = await invoke("save_data", {
                  path: dbPath,
                  data: dataPayload,
                  expectedRev: current.rev ?? 0,
                  userId: currentUser.id,
                });
                lastSaveRef.current = Number(newModified);
                lastSavedPayload.current = dataPayload;
              } catch (e) {
                console.error("Force overwrite save failed:", e);
              }
            } else if (strategy === "theirs") {
              // Reload
              const { invoke } = await import("@tauri-apps/api/core");
              const response: any = await invoke("read_data", { path: dbPath });
              const parsed = response.data;
              if (parsed) {
                applyData(parsed);
                lastSavedPayload.current = JSON.stringify(parsed);
              }
              lastSaveRef.current = response.rev ?? 0;
            } else {
              // Use pending smart merge data!
              if (pendingMergeData) {
                const { mergedData, version } = pendingMergeData;
                const finalMergedData = JSON.parse(JSON.stringify(mergedData));

                if (choices && conflictDetails.length > 0) {
                  conflictDetails.forEach((c, idx) => {
                    if (choices[idx] === "local") {
                      const localReq = tabDataMap[c.tabId]?.requirements?.find(
                        (r) => r.id === c.reqId,
                      );
                      const targetReq = finalMergedData.tabDataMap[
                        c.tabId
                      ]?.requirements?.find((r: any) => r.id === c.reqId);
                      if (localReq && targetReq) {
                        if (c.field === "assignees")
                          targetReq.assignees = localReq.assignees;
                        else if (c.field.startsWith("customColumns.")) {
                          const colId = c.field.split(".")[1];
                          if (!targetReq.customColumns)
                            targetReq.customColumns = {};
                          targetReq.customColumns[colId] =
                            localReq.customColumns?.[colId];
                        } else
                          (targetReq as any)[c.field] = (localReq as any)[
                            c.field
                          ];
                      }
                    }
                  });
                }
                if (finalMergedData.tabs) setTabs(finalMergedData.tabs);
                if (finalMergedData.tabDataMap)
                  setTabDataMap(finalMergedData.tabDataMap);
                setAssigneesPool(finalMergedData.assigneesPool);

                const payload = JSON.stringify(finalMergedData);
                lastSaveRef.current = version;
                lastSavedPayload.current = payload;

                // Immediately save the resolved data to lock in the merge
                try {
                  const { invoke } = await import("@tauri-apps/api/core");
                  const modifiedId = await invoke("save_data", {
                    path: dbPath,
                    data: payload,
                    expectedRev: version,
                    userId: currentUser.id,
                  });
                  lastSaveRef.current = Number(modifiedId);
                } catch (e) {
                  console.error("Merge save failed:", e);
                }
              }
            }
          }}
          onCancel={() => setShowConflictModal(false)}
        />
      )}

      {showChangelogViewer && (
        <ChangelogViewer
          dbPath={dbPath}
          onClose={() => setShowChangelogViewer(false)}
        />
      )}

      {/* 3. High-fidelity "Coming Soon / 추후 서비스 준비 중" Modal */}
      {comingSoonFeature && (
        <div
          id="coming-soon-modal"
          className="fixed inset-0 bg-brand-surface-lowest/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-slide-up"
        >
          <div className="bg-brand-surface border border-brand-outline-variant/80 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              id="close-coming-soon"
              onClick={handleCloseComingSoon}
              className="absolute right-4 top-4 text-brand-outline-variant hover:text-brand-on-surface transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-brand-tertiary/10 border border-brand-tertiary flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-brand-tertiary" />
              </div>
              <h3 className="text-lg font-bold text-brand-on-surface">
                {comingSoonFeature}
              </h3>
              <p className="text-xs text-brand-on-surface-variant mt-2 leading-relaxed">
                현재 해당 메뉴는 코어 시스템과 연동하는 백엔드 프로세스가 고도화
                중인 단계에 있습니다. 빠른 출시를 위한 개발 제안 사항을
                남겨주시면 개발 우선순위에 연동하겠습니다.
              </p>
            </div>

            {/* Custom feedback form */}
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <div>
                <label className="block text-[11px] text-brand-on-surface-variant font-medium mb-1.5">
                  개발팀에 제안 및 피드백 (필수)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="예: 간트 차트 연동 시 양방향 동기화가 지원되면 좋겠습니다."
                  rows={4}
                  required
                  className="w-full text-xs p-3 bg-brand-surface-lowest border border-brand-outline-variant rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-on-surface placeholder:text-brand-outline-variant focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCloseComingSoon}
                  className="px-4 py-2 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface-high text-xs font-semibold rounded-lg cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-tertiary text-white text-xs font-bold rounded-lg hover:opacity-90 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  제출하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Success Toast */}
      {showSuccessToast && (
        <div
          id="toast-success"
          className="fixed bottom-6 right-6 bg-brand-surface-high border border-brand-success/40 text-brand-on-surface px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-slide-up max-w-sm"
        >
          <div className="w-8 h-8 rounded-full bg-brand-success/15 border border-brand-success flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-brand-success" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-on-surface">
              도움 주셔서 대단히 감사합니다!
            </p>
            <p className="text-[10px] text-brand-on-surface-variant">
              제출된 제안 내용이 성공적으로 개발 우선순위에 인가되었습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
