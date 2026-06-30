/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { Socket } from "socket.io-client";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Plus,
  Download,
  Search,
  Trash2,
  Filter,
  ArrowUpDown,
  Check,
  ChevronDown,
  X,
  UserPlus,
  CircleDot,
  GripVertical,
  Copy,
  Settings,
  Grid,
  Users,
  Undo2,
  Redo2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Layers,
  Edit2,
  AlignJustify,
  Lock,
  AlignLeft,
  Palette,
} from "lucide-react";
import {
  Requirement,
  Priority,
  Status,
  Assignee,
  Column,
  ColumnType,
} from "../types";
import type { DashboardFilterCommand } from "./StatsCards";
import { INITIAL_REQUIREMENTS, INITIAL_ASSIGNEES } from "../data";
import DraggableModal from "./DraggableModal";

interface SpreadsheetProps {
  activeTabId?: string;
  tabDataMap?: any;
  tabs?: any[];
  requirements: Requirement[];
  setRequirements: React.Dispatch<React.SetStateAction<Requirement[]>>;
  assigneesPool: Assignee[];
  setAssigneesPool: React.Dispatch<React.SetStateAction<Assignee[]>>;
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  openComingSoonModal: (featureName: string) => void;
  socket: any;
  dbPath?: string;
  currentUser?: { id: string; name: string };
  activeLocks?: Record<string, any>;
  dashboardFilter?: DashboardFilterCommand | null;
  onDashboardFilterConsumed?: () => void;
}

let cachedInvoke: any = null;
const getTauriInvoke = async () => {
  if (cachedInvoke) return cachedInvoke;
  // @ts-ignore
  if (("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window)) {
    const { invoke } = await import("@tauri-apps/api/core");
    cachedInvoke = invoke;
    return invoke;
  }
  return null;
};

export default function Spreadsheet({
  activeTabId,
  requirements,
  setRequirements: originalSetRequirements,
  assigneesPool,
  setAssigneesPool,
  columns,
  setColumns,
  openComingSoonModal,
  socket,
  dbPath,
  currentUser,
  activeLocks = {},
  tabs = [],
  tabDataMap = {},
  dashboardFilter,
  onDashboardFilterConsumed,
}: SpreadsheetProps) {
  // --- UNDO / REDO STATE ---
  const MAX_HISTORY = 20;
  const historyRef = useRef<Requirement[][]>([]);
  const redoStackRef = useRef<Requirement[][]>([]);

  // Wrapper for setRequirements to record history
  const setRequirements = useCallback(
    (action: React.SetStateAction<Requirement[]>) => {
      originalSetRequirements((prev) => {
        const next =
          typeof action === "function" ? (action as any)(prev) : action;

        // Save to history before updating (if different)
        if (prev !== next) {
          historyRef.current.push(prev);
          if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
          }
          redoStackRef.current = []; // Clear redo stack on new action
        }
        return next;
      });
    },
    [originalSetRequirements],
  );

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      originalSetRequirements((prev) => {
        const previousState = historyRef.current.pop()!;
        redoStackRef.current.push([...prev]);
        return previousState;
      });
    }
  }, [originalSetRequirements]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      originalSetRequirements((prev) => {
        const nextState = redoStackRef.current.pop()!;
        historyRef.current.push([...prev]);
        return nextState;
      });
    }
  }, [originalSetRequirements]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + y
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);
  // --- END UNDO / REDO STATE ---
  // Queries & Filters
  const [tabFilters, setTabFilters] = useState<
    Record<
      string,
      {
        searchTerm: string;
        priorityFilter: Priority | "ALL";
        statusFilter: Status | "ALL";
        sortField: "id" | "title" | "dueDate" | "status" | null;
        sortDirection: "asc" | "desc";
      }
    >
  >({});

  const currentTabFilters = tabFilters[activeTabId || "global"] || {
    searchTerm: "",
    priorityFilter: "ALL",
    statusFilter: "ALL",
    sortField: null,
    sortDirection: "asc",
  };

  const searchTerm = currentTabFilters.searchTerm;
  const priorityFilter = currentTabFilters.priorityFilter;
  const statusFilter = currentTabFilters.statusFilter;
  const sortField = currentTabFilters.sortField;
  const sortDirection = currentTabFilters.sortDirection;

  const setSearchTerm = (val: string) =>
    setTabFilters((prev) => ({
      ...prev,
      [activeTabId || "global"]: {
        ...currentTabFilters,
        ...(prev[activeTabId || "global"] || {}),
        searchTerm: val,
      },
    }));
  const setPriorityFilter = (val: Priority | "ALL") =>
    setTabFilters((prev) => ({
      ...prev,
      [activeTabId || "global"]: {
        ...currentTabFilters,
        ...(prev[activeTabId || "global"] || {}),
        priorityFilter: val,
      },
    }));
  const setStatusFilter = (val: Status | "ALL") =>
    setTabFilters((prev) => ({
      ...prev,
      [activeTabId || "global"]: {
        ...currentTabFilters,
        ...(prev[activeTabId || "global"] || {}),
        statusFilter: val,
      },
    }));
  const setSortField = (val: "id" | "title" | "dueDate" | "status" | null) =>
    setTabFilters((prev) => ({
      ...prev,
      [activeTabId || "global"]: {
        ...currentTabFilters,
        ...(prev[activeTabId || "global"] || {}),
        sortField: val,
      },
    }));
  const setSortDirection = (val: "asc" | "desc") =>
    setTabFilters((prev) => ({
      ...prev,
      [activeTabId || "global"]: {
        ...currentTabFilters,
        ...(prev[activeTabId || "global"] || {}),
        sortDirection: val,
      },
    }));

  // Custom Columns List
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [editingColumnDefId, setEditingColumnDefId] = useState<string | null>(
    null,
  );
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState<ColumnType>("text");
  const [editingColumnNameId, setEditingColumnNameId] = useState<string | null>(
    null,
  );

  // Advanced Column State
  const [formulaInput, setFormulaInput] = useState("");
  const [buttonLabelInput, setButtonLabelInput] = useState("");
  const [buttonActionInput, setButtonActionInput] = useState("start_work");
  const [currencyAmountColIdInput, setCurrencyAmountColIdInput] = useState("");
  const [currencyCodeColIdInput, setCurrencyCodeColIdInput] = useState("");
  const [currencyExchangeRatesInput, setCurrencyExchangeRatesInput] = useState({
    KRW: 1,
    USD: 1400,
    EUR: 1500,
    GBP: 1750,
  });
  const [currencyDecimalPlacesInput, setCurrencyDecimalPlacesInput] =
    useState<number>(0);
  const [decimalPlacesInput, setDecimalPlacesInput] = useState<string>("");
  const [rollupRelIdInput, setRollupRelIdInput] = useState("");
  const [rollupAggTypeInput, setRollupAggTypeInput] = useState<
    "count" | "percent_done" | "sum" | "avg"
  >("count");
  const [statusOptionsInput, setStatusOptionsInput] = useState(
    "아이디어,기획,디자인,개발,QA,배포",
  );

  // Lookup column state
  const [lookupTabIdInput, setLookupTabIdInput] = useState("");
  const [lookupMatchMyColIdInput, setLookupMatchMyColIdInput] = useState("");
  const [lookupMatchTargetColIdInput, setLookupMatchTargetColIdInput] =
    useState("");
  const [lookupReturnTargetColIdInput, setLookupReturnTargetColIdInput] =
    useState("");

  // Inflation PV state
  const [inflationAmountColIdInput, setInflationAmountColIdInput] =
    useState("");
  const [inflationTitleColIdInput, setInflationTitleColIdInput] =
    useState("title");
  const [inflationRefTabIdInput, setInflationRefTabIdInput] = useState("");
  const [inflationMatchColIdInput, setInflationMatchColIdInput] =
    useState("id");
  const [inflationRefMatchColIdInput, setInflationRefMatchColIdInput] =
    useState("id");
  const [inflationBaseDateColIdInput, setInflationBaseDateColIdInput] =
    useState("");
  const [inflationTargetDateColIdInput, setInflationTargetDateColIdInput] =
    useState("");
  const [inflationRatesInput, setInflationRatesInput] = useState<
    { word: string; rate: number; baseShip?: string; note?: string }[]
  >([]);
  const [isInflationRatesExpanded, setIsInflationRatesExpanded] =
    useState(true);

  // Exchange Rates Setup
  const exchangeRates = { KRW: 1, USD: 1400, EUR: 1500, GBP: 1750 };

  // Column Resizing Logic per tab
  const [columnWidths, _setColumnWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem(
      `app_grid_col_widths_${activeTabId || "global"}`,
    );
    let base: Record<string, number> = {};
    if (saved) {
      try {
        base = JSON.parse(saved);
      } catch (e) {}
    }

    if (Object.keys(base).length === 0) {
      base = {
        custom_index: 60,
        custom_lv1: 100,
        custom_lv2: 100,
        id: 110,
        title: 300,
        custom_role: 80,
        assignees: 130,
        custom_kr: 200,
        custom_en: 200,
        priority: 100,
        status: 100,
      };
    }

    columns.forEach((c) => {
      if (c.width) base[c.id] = c.width;
    });

    _setColumnWidths(base);
  }, [activeTabId, columns]);

  const setColumnWidths = useCallback(
    (updater: React.SetStateAction<Record<string, number>>) => {
      _setColumnWidths((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localStorage.setItem(
          `app_grid_col_widths_${activeTabId || "global"}`,
          JSON.stringify(next),
        );
        return next;
      });
    },
    [activeTabId],
  );

  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  useEffect(() => {
    if (!resizingColId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + deltaX);
      setColumnWidths((prev) => ({ ...prev, [resizingColId]: newWidth }));
    };

    const handleMouseUp = () => {
      setColumnWidths((prevWidths) => {
        const finalWidth = prevWidths[resizingColId];
        if (finalWidth) {
          setColumns((prev) =>
            prev.map((c) =>
              c.id === resizingColId ? { ...c, width: finalWidth } : c,
            ),
          );
        }
        return prevWidths;
      });
      setResizingColId(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingColId, resizeStartX, resizeStartWidth, setColumns]);

  // New Global States
  const [showAssigneeManager, setShowAssigneeManager] = useState(false);
  const [editingAssigneeId, setEditingAssigneeId] = useState<string | null>(
    null,
  );
  const [editingAssigneeName, setEditingAssigneeName] = useState("");
  const [assigneeManagerPos, setAssigneeManagerPos] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const [newAssigneeName, setNewAssigneeName] = useState("");

  // Global toggle for 1-line view
  const [isSingleLineView, setIsSingleLineView] = useState(false);

  // Global toggle for minimized columns per tab
  const [minimizedColumns, _setMinimizedColumns] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setIsSingleLineView(
      localStorage.getItem(`singleLineView_${activeTabId || "global"}`) ===
        "true",
    );
    const saved = localStorage.getItem(
      `minimizedCols_${activeTabId || "global"}`,
    );
    if (saved) {
      try {
        _setMinimizedColumns(JSON.parse(saved));
      } catch (e) {
        _setMinimizedColumns({});
      }
    } else {
      _setMinimizedColumns({});
    }
  }, [activeTabId]);

  const toggleSingleLineView = () => {
    setIsSingleLineView((prev) => {
      const next = !prev;
      localStorage.setItem(
        `singleLineView_${activeTabId || "global"}`,
        String(next),
      );
      return next;
    });
  };

  const setMinimizedColumns = useCallback(
    (updater: React.SetStateAction<Record<string, boolean>>) => {
      _setMinimizedColumns((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localStorage.setItem(
          `minimizedCols_${activeTabId || "global"}`,
          JSON.stringify(next),
        );
        return next;
      });
    },
    [activeTabId],
  );

  // Column level text search filters (Per tab)
  const [tabColumnSearchTerms, setTabColumnSearchTerms] = useState<
    Record<string, Record<string, string>>
  >({});
  const columnSearchTerms = tabColumnSearchTerms[activeTabId || "global"] || {};
  const setColumnSearchTerms = useCallback(
    (updater: React.SetStateAction<Record<string, string>>) => {
      setTabColumnSearchTerms((prev) => {
        const current = prev[activeTabId || "global"] || {};
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [activeTabId || "global"]: next };
      });
    },
    [activeTabId],
  );
  const [showFilterColumnId, setShowFilterColumnId] = useState<string | null>(
    null,
  );
  const [filterPopupCoords, setFilterPopupCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const filterPopupRef = useRef<HTMLDivElement>(null);

  // Close popup globally
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Close filter popup
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(e.target as Node)
      ) {
        setShowFilterColumnId(null);
        setFilterPopupCoords(null);
      }
      // Close context menu
      setContextMenuColId(null);
      setSuperContextMenuGroup(null);
    };
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([]);
  const [showDescriptionEditColId, setShowDescriptionEditColId] = useState<
    string | null
  >(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [newColumnOptionsInput, setNewColumnOptionsInput] = useState("");

  // Active Inline Cell Editors
  const [activeCellEditor, setActiveCellEditorState] = useState<{
    rowId: string;
    field: string;
  } | null>(null);
  const cellRef = useRef<{ rowId: string; field: string } | null>(null);
  const locksRef = useRef<any>(null);

  useEffect(() => {
    cellRef.current = activeCellEditor;
    locksRef.current = activeLocks;
  });

  // Real-time Editing Lock Helpers
  const setActiveCellEditor = useCallback(
    async (val: { rowId: string; field: string } | null) => {
      const activeCell = cellRef.current;

      // If closing, release the currently held lock
      if (val === null && activeCell) {
        // @ts-ignore
        if (
          (("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window)) &&
          dbPath &&
          currentUser
        ) {
          try {
            // @ts-ignore
            const invokeCall = await getTauriInvoke();
            await invokeCall("release_item_lock", {
              projectPath: dbPath,
              itemId: `${activeTabId}:${activeCell.rowId}`,
              userId: currentUser.id,
            });
          } catch (e) {}
        }
        setActiveCellEditorState(null);
        return;
      }
      // If opening, request lock from server
      if (val) {
        // Optimistic UI state update to eliminate delay
        setActiveCellEditorState(val);
        // @ts-ignore
        if (
          (("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window)) &&
          dbPath &&
          currentUser
        ) {
          try {
            // @ts-ignore
            const invokeCall = await getTauriInvoke();
            await invokeCall("acquire_item_lock", {
              projectPath: dbPath,
              itemId: `${activeTabId}:${val.rowId}`,
              userId: currentUser.id,
              userName: currentUser.name,
            });
          } catch (e: any) {
            // Revert on failure
            setActiveCellEditorState(null);
            const locker = locksRef.current[`${activeTabId}:${val.rowId}`];
            const lockerName = locker ? locker.userName : "다른 사용자";
            alert(
              `[접근 제한]\n현재 ${lockerName} 님이 이 항목을 편집하고 있습니다.\n편집이 완료될 때까지 기다려 주세요.`,
            );
          }
          return;
        }
      }
      // Fallback if no Tauri
      setActiveCellEditorState(val);
    },
    [dbPath, currentUser],
  );

  // Heartbeat to keep lock alive
  useEffect(() => {
    if (!activeCellEditor || !dbPath || !currentUser) return;
    
    // @ts-ignore
    if (!(("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window))) return;

    const intervalId = setInterval(async () => {
      try {
        // @ts-ignore
        const invokeCall = await getTauriInvoke();
        await invokeCall("acquire_item_lock", {
          projectPath: dbPath,
          itemId: `${activeTabId}:${activeCellEditor.rowId}`,
          userId: currentUser.id,
          userName: currentUser.name,
        });
      } catch (e) {
        // Lock lost (e.g. another user forced it or error)
      }
    }, 5000); // Send heartbeat every 5 seconds

    const handleBeforeUnload = () => {
      // Best-effort release on window close
      try {
        // @ts-ignore
        if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
          // @ts-ignore
          window.__TAURI_INTERNALS__.invoke("release_item_lock", {
            projectPath: dbPath,
            itemId: `${activeTabId}:${activeCellEditor.rowId}`,
            userId: currentUser.id,
          });
        }
      } catch (e) {}
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeCellEditor, dbPath, currentUser, activeTabId]);

  // Dropdown States
  const [showPriorityDropdownId, setShowPriorityDropdownId] = useState<
    string | null
  >(null);
  const [priorityDropdownPos, setPriorityDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [showStatusDropdownId, setShowStatusDropdownId] = useState<
    string | null
  >(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [showAssigneeDropdownId, setShowAssigneeDropdownId] = useState<
    string | null
  >(null);
  const [assigneeDropdownPos, setAssigneeDropdownPos] = useState({
    top: 0,
    left: 0,
  });
  const [showSelectDropdown, setShowSelectDropdown] = useState<{
    rowId: string;
    colId: string;
  } | null>(null);
  const [selectDropdownPos, setSelectDropdownPos] = useState({
    top: 0,
    left: 0,
  });

  // References for closing menus on click outside
  const priorityRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const selectDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        priorityRef.current &&
        !priorityRef.current.contains(event.target as Node)
      ) {
        setShowPriorityDropdownId(null);
      }
      if (
        statusRef.current &&
        !statusRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdownId(null);
      }
      if (
        assigneeRef.current &&
        !assigneeRef.current.contains(event.target as Node)
      ) {
        setShowAssigneeDropdownId(null);
      }
      if (
        selectDropdownRef.current &&
        !selectDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSelectDropdown(null);
      }
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(event.target as Node)
      ) {
        setShowFilterColumnId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setColumnSearchTerms({});
  };

  // React to dashboard filter commands from StatsCards
  useEffect(() => {
    if (!dashboardFilter) return;

    // Clear all filters first for any command
    clearAllFilters();

    if (dashboardFilter.type === "status_not_done") {
      // Show only non-DONE items using negation filter
      setColumnSearchTerms({ status: "!DONE" });
    } else if (dashboardFilter.type === "assignee" && dashboardFilter.value) {
      setColumnSearchTerms({ assignees: dashboardFilter.value });
    } else if (dashboardFilter.type === "priority_high") {
      setPriorityFilter("HIGH");
    } else if (dashboardFilter.type === "priority_medium") {
      setPriorityFilter("MEDIUM");
    } else if (dashboardFilter.type === "priority_low") {
      setPriorityFilter("LOW");
    } else if (
      dashboardFilter.type === "custom_column" &&
      dashboardFilter.columnId &&
      dashboardFilter.value
    ) {
      // Add isolated filter for the clicked custom column value
      setColumnSearchTerms({
        [dashboardFilter.columnId]: dashboardFilter.value,
      });
    }
    // 'clear_all' just needs the clearAllFilters() above

    onDashboardFilterConsumed?.();
  }, [dashboardFilter]);

  const reqById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r])),
    [requirements],
  );

  const collator = useMemo(() => new Intl.Collator("ko"), []);

  // Filter & Search Logic
  const filteredAndSortedRequirements = useMemo(
    () =>
      requirements
        .filter((req) => {
          // Priority filter
          if (priorityFilter !== "ALL" && req.priority !== priorityFilter)
            return false;

          // Status filter
          if (statusFilter !== "ALL") {
            const s = (req.status as string) || "TODO";
            const normalizedStatus =
              s === "TODO" || s === "대기중"
                ? "TODO"
                : s === "IN_PROGRESS" || s === "검토중"
                  ? "IN_PROGRESS"
                  : s === "DONE" || s === "검토완료"
                    ? "DONE"
                    : "TODO";
            if (normalizedStatus !== statusFilter) return false;
          }

          // Search term
          if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            const matchesId = req.id.toLowerCase().includes(term);
            const matchesTitle = req.title.toLowerCase().includes(term);
            const matchesAssignees = req.assignees.some((a) =>
              a.name.toLowerCase().includes(term),
            );
            const matchesDueDate = req.dueDate.toLowerCase().includes(term);

            let matchesCustom = false;
            if (req.customColumns) {
              matchesCustom = Object.values(req.customColumns).some((v) =>
                v.toLowerCase().includes(term),
              );
            }

            if (
              !matchesId &&
              !matchesTitle &&
              !matchesAssignees &&
              !matchesDueDate &&
              !matchesCustom
            )
              return false;
          }

          // Column-level search logic
          for (const colId of Object.keys(columnSearchTerms)) {
            const rawTerm = columnSearchTerms[colId].trim();
            if (rawTerm === "") continue;

            const isNegation = rawTerm.startsWith("!");
            const colTerm = (
              isNegation ? rawTerm.slice(1) : rawTerm
            ).toLowerCase();
            if (colTerm === "") continue;

            const translateStatus = (st: string) => {
              if (st === "TODO") return "대기중";
              if (st === "IN_PROGRESS") return "검토중";
              if (st === "DONE") return "검토완료";
              return st;
            };

            const matchColumn = (value: string): boolean => {
              const matches = value.toLowerCase().includes(colTerm);
              return isNegation ? !matches : matches;
            };

            if (colId === "id" && !matchColumn(req.id)) return false;
            if (colId === "title" && !matchColumn(req.title)) return false;
            if (colId === "status" && !matchColumn(translateStatus(req.status)))
              return false;
            if (colId === "priority" && !matchColumn(req.priority))
              return false;
            if (colId === "dueDate" && !matchColumn(req.dueDate)) return false;
            if (colId === "assignees") {
              if (isNegation) {
                if (
                  req.assignees.some((a) =>
                    a.name.toLowerCase().includes(colTerm),
                  )
                )
                  return false;
              } else {
                if (
                  !req.assignees.some((a) =>
                    a.name.toLowerCase().includes(colTerm),
                  )
                )
                  return false;
              }
            }

            // Custom columns logic...
            if (
              ![
                "id",
                "title",
                "status",
                "priority",
                "dueDate",
                "assignees",
              ].includes(colId)
            ) {
              const val = req.customColumns?.[colId] || "";
              if (!matchColumn(val)) return false;
            }
          }

          return true;
        })
        .sort((a, b) => {
          if (!sortField) return 0;

          let valA = a[sortField] || "";
          let valB = b[sortField] || "";

          if (sortField === "id") {
            // REQ- 숫자 파싱하여 비교
            const numA = parseInt(String(valA).replace("REQ-", ""), 10) || 0;
            const numB = parseInt(String(valB).replace("REQ-", ""), 10) || 0;
            return sortDirection === "asc" ? numA - numB : numB - numA;
          }

          if (sortField === "dueDate") {
            const dateA = new Date(valA as string).getTime();
            const dateB = new Date(valB as string).getTime();
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          }

          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();

          return sortDirection === "asc"
            ? collator.compare(strA, strB)
            : collator.compare(strB, strA);
        }),
    [
      requirements,
      priorityFilter,
      statusFilter,
      searchTerm,
      columnSearchTerms,
      sortField,
      sortDirection,
      collator,
    ],
  );

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredAndSortedRequirements.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (isSingleLineView ? 40 : 80),
    overscan: 5,
  });

  const handleGridScroll = useCallback(() => {
    if (cellRef.current) {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        document.activeElement.blur();
      }
    }
    setShowPriorityDropdownId(null);
    setShowStatusDropdownId(null);
    setShowAssigneeDropdownId(null);
    setShowSelectDropdown(null);
  }, []);

  // Handle Checked state
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredAndSortedRequirements.map((r) => r.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, []);

  // 1. Sort Handler
  const handleSort = (field: "id" | "title" | "dueDate" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 2. Add Row Function
  const handleAddRow = () => {
    // Generate new autoincremented ID
    const maxNumericId = requirements.reduce((max, r) => {
      const match = r.id.match(/REQ-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextId = `REQ-${String(maxNumericId + 1).padStart(3, "0")}`;

    // Use assigneesPool[0] if available, otherwise a placeholder
    const defaultAssignee =
      assigneesPool.length > 0
        ? assigneesPool[0]
        : { id: "USR-000", name: "미지정", avatarUrl: "" };

    const newReq: Requirement = {
      id: nextId,
      title: "새로 추가된 요구사항 내용을 입력하세요",
      priority: "MEDIUM",
      assignees: [defaultAssignee], // assign default user
      dueDate: new Date().toISOString().split("T")[0],
      status: "TODO",
      customColumns: {},
    };

    setRequirements((prev) => [...prev, newReq]);
    // Immediately open editor for name
    setActiveCellEditor({ rowId: nextId, field: "title" });
  };

  // 3. Delete selected rows
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (
      confirm(
        `선택한 ${selectedIds.length}개의 요구사항 코드를 영구적으로 분할/삭제하시겠습니까?`,
      )
    ) {
      setRequirements((prev) =>
        prev.filter((r) => !selectedIds.includes(r.id)),
      );
      setSelectedIds([]);
    }
  }, [selectedIds, setRequirements]);

  // 4. Update single field
  const updateRequirementField = useCallback(
    (rowId: string, field: string, value: any) => {
      setRequirements((prev) =>
        prev.map((req) => {
          if (req.id === rowId) {
            // Standard Columns
            if (field === "id") {
              if (prev.some((r) => r.id === value && r.id !== rowId)) {
                alert("이미 존재하는 ID입니다.");
                return req;
              }
              return { ...req, id: value };
            }
            if (field === "title") return { ...req, title: value };
            if (field === "priority")
              return { ...req, priority: value as Priority };
            if (field === "status") return { ...req, status: value as Status };
            if (field === "dueDate") return { ...req, dueDate: value };

            // Custom dynamic columns
            const updatedCustom = { ...req.customColumns, [field]: value };
            return { ...req, customColumns: updatedCustom };
          }
          return req;
        }),
      );
    },
    [setRequirements],
  );

  // 5. Add or Edit Custom Column
  const handleAddOrEditCustomColumn = () => {
    if (!newColumnName.trim()) return;

    if (editingColumnDefId) {
      setColumns((prev) => {
        const newCols = prev.map((c) => {
          if (c.id === editingColumnDefId) {
            let options =
              newColumnType === "status" || newColumnType === "select"
                ? (newColumnType === "select"
                    ? newColumnOptionsInput
                    : statusOptionsInput
                  )
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined;

            if (newColumnType === "select") {
              const existingValues = new Set<string>();
              requirements.forEach((req) => {
                const val = req.customColumns?.[editingColumnDefId];
                if (val) {
                  existingValues.add(val.trim());
                }
              });
              if (options) {
                existingValues.forEach((val) => {
                  if (!options!.includes(val)) {
                    options!.push(val);
                  }
                });
              }
            }

            return {
              ...c,
              label: newColumnName.trim(),
              type: newColumnType,
              options,
              formula: newColumnType === "formula" ? formulaInput : undefined,
              buttonAction:
                newColumnType === "button" ? buttonActionInput : undefined,
              buttonLabel:
                newColumnType === "button" ? buttonLabelInput : undefined,
              currencyAmountColId:
                newColumnType === "currency_usd"
                  ? currencyAmountColIdInput
                  : undefined,
              currencyCodeColId:
                newColumnType === "currency_usd"
                  ? currencyCodeColIdInput
                  : undefined,
              currencyExchangeRates:
                newColumnType === "currency_usd"
                  ? currencyExchangeRatesInput
                  : undefined,
              currencyDecimalPlaces:
                newColumnType === "currency_usd"
                  ? currencyDecimalPlacesInput
                  : undefined,
              rollupRelId:
                newColumnType === "rollup" ? rollupRelIdInput : undefined,
              rollupAggType:
                newColumnType === "rollup" ? rollupAggTypeInput : undefined,
              lookupTabId:
                newColumnType === "lookup" ? lookupTabIdInput : undefined,
              lookupMatchMyColId:
                newColumnType === "lookup"
                  ? lookupMatchMyColIdInput
                  : undefined,
              lookupMatchTargetColId:
                newColumnType === "lookup"
                  ? lookupMatchTargetColIdInput
                  : undefined,
              lookupReturnTargetColId:
                newColumnType === "lookup"
                  ? lookupReturnTargetColIdInput
                  : undefined,
              inflationAmountColId:
                newColumnType === "inflation_pv"
                  ? inflationAmountColIdInput
                  : undefined,
              inflationTitleColId:
                newColumnType === "inflation_pv"
                  ? inflationTitleColIdInput
                  : undefined,
              inflationRefTabId:
                newColumnType === "inflation_pv"
                  ? inflationRefTabIdInput
                  : undefined,
              inflationMatchColId:
                newColumnType === "inflation_pv"
                  ? inflationMatchColIdInput
                  : undefined,
              inflationRefMatchColId:
                newColumnType === "inflation_pv"
                  ? inflationRefMatchColIdInput
                  : undefined,
              inflationBaseDateColId:
                newColumnType === "inflation_pv"
                  ? inflationBaseDateColIdInput
                  : undefined,
              inflationTargetDateColId:
                newColumnType === "inflation_pv"
                  ? inflationTargetDateColIdInput
                  : undefined,
              inflationRates:
                newColumnType === "inflation_pv"
                  ? inflationRatesInput
                  : undefined,
              decimalPlaces:
                decimalPlacesInput !== ""
                  ? Number(decimalPlacesInput)
                  : undefined,
            };
          }
          if (
            newColumnType === "currency_usd" &&
            c.type === "currency_usd" &&
            c.id !== editingColumnDefId
          ) {
            return { ...c, currencyExchangeRates: currencyExchangeRatesInput };
          }
          return c;
        });
        return newCols;
      });
      setShowAddColumnModal(false);
      setEditingColumnDefId(null);
      // Reset forms
      setNewColumnName("");
      setNewColumnType("text");
      setFormulaInput("");
      setButtonLabelInput("");
      setButtonActionInput("start_work");
      setRollupRelIdInput("");
      setRollupAggTypeInput("count");
      setNewColumnOptionsInput("");
      setCurrencyExchangeRatesInput({
        KRW: 1,
        USD: 1400,
        EUR: 1500,
        GBP: 1750,
      });
      setCurrencyDecimalPlacesInput(0);
      setDecimalPlacesInput("");
      setLookupTabIdInput("");
      setLookupMatchMyColIdInput("");
      setLookupMatchTargetColIdInput("");
      setLookupReturnTargetColIdInput("");
      setInflationAmountColIdInput("");
      setInflationTitleColIdInput("title");
      setInflationRefTabIdInput("");
      setInflationMatchColIdInput("id");
      setInflationRefMatchColIdInput("id");
      setInflationBaseDateColIdInput("");
      setInflationTargetDateColIdInput("");
      setInflationRatesInput([]);
      return;
    }

    const colId = `custom_${newColumnName.trim().replace(/\s+/g, "_")}`;

    // Check duplication
    if (
      columns.some((c) => c.label === newColumnName.trim() || c.id === colId)
    ) {
      alert("이미 존재하는 열 이름입니다.");
      return;
    }

    setColumns((prev) => {
      const nextCols = prev.map((c) => {
        if (newColumnType === "currency_usd" && c.type === "currency_usd") {
          return { ...c, currencyExchangeRates: currencyExchangeRatesInput };
        }
        return c;
      });
      return [
        ...nextCols,
        {
          id: colId,
          label: newColumnName.trim(),
          isCustom: true,
          type: newColumnType,
          options:
            newColumnType === "status" || newColumnType === "select"
              ? (newColumnType === "select"
                  ? newColumnOptionsInput
                  : statusOptionsInput
                )
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : undefined,
          formula: newColumnType === "formula" ? formulaInput : undefined,
          buttonAction:
            newColumnType === "button" ? buttonActionInput : undefined,
          buttonLabel:
            newColumnType === "button" ? buttonLabelInput : undefined,
          currencyAmountColId:
            newColumnType === "currency_usd"
              ? currencyAmountColIdInput
              : undefined,
          currencyCodeColId:
            newColumnType === "currency_usd"
              ? currencyCodeColIdInput
              : undefined,
          currencyExchangeRates:
            newColumnType === "currency_usd"
              ? currencyExchangeRatesInput
              : undefined,
          currencyDecimalPlaces:
            newColumnType === "currency_usd"
              ? currencyDecimalPlacesInput
              : undefined,
          rollupRelId:
            newColumnType === "rollup" ? rollupRelIdInput : undefined,
          rollupAggType:
            newColumnType === "rollup" ? rollupAggTypeInput : undefined,
          lookupTabId:
            newColumnType === "lookup" ? lookupTabIdInput : undefined,
          lookupMatchMyColId:
            newColumnType === "lookup" ? lookupMatchMyColIdInput : undefined,
          lookupMatchTargetColId:
            newColumnType === "lookup"
              ? lookupMatchTargetColIdInput
              : undefined,
          lookupReturnTargetColId:
            newColumnType === "lookup"
              ? lookupReturnTargetColIdInput
              : undefined,
          inflationAmountColId:
            newColumnType === "inflation_pv"
              ? inflationAmountColIdInput
              : undefined,
          inflationTitleColId:
            newColumnType === "inflation_pv"
              ? inflationTitleColIdInput
              : undefined,
          inflationRefTabId:
            newColumnType === "inflation_pv"
              ? inflationRefTabIdInput
              : undefined,
          inflationMatchColId:
            newColumnType === "inflation_pv"
              ? inflationMatchColIdInput
              : undefined,
          inflationRefMatchColId:
            newColumnType === "inflation_pv"
              ? inflationRefMatchColIdInput
              : undefined,
          inflationBaseDateColId:
            newColumnType === "inflation_pv"
              ? inflationBaseDateColIdInput
              : undefined,
          inflationTargetDateColId:
            newColumnType === "inflation_pv"
              ? inflationTargetDateColIdInput
              : undefined,
          inflationRates:
            newColumnType === "inflation_pv" ? inflationRatesInput : undefined,
          decimalPlaces:
            decimalPlacesInput !== "" ? Number(decimalPlacesInput) : undefined,
        },
      ];
    });

    // Reset forms
    setNewColumnName("");
    setNewColumnType("text");
    setFormulaInput("");
    setButtonLabelInput("");
    setButtonActionInput("start_work");
    setRollupRelIdInput("");
    setRollupAggTypeInput("count");
    setCurrencyExchangeRatesInput({ KRW: 1, USD: 1400, EUR: 1500, GBP: 1750 });
    setCurrencyDecimalPlacesInput(0);
    setDecimalPlacesInput("");
    setLookupTabIdInput("");
    setLookupMatchMyColIdInput("");
    setLookupMatchTargetColIdInput("");
    setLookupReturnTargetColIdInput("");
    setInflationAmountColIdInput("");
    setInflationTitleColIdInput("title");
    setInflationRefTabIdInput("");
    setInflationMatchColIdInput("id");
    setInflationRefMatchColIdInput("id");
    setInflationBaseDateColIdInput("");
    setInflationTargetDateColIdInput("");
    setInflationRatesInput([]);
    setShowAddColumnModal(false);
  };

  // Delete Custom Column helper
  const handleDeleteCustomColumn = (colId: string) => {
    setColumnToDelete(colId);
  };

  const executeDeleteColumn = () => {
    if (!columnToDelete) return;
    setColumns((prev) => prev.filter((c) => c.id !== columnToDelete));
    // Purge from requirement objects
    setRequirements((prev) =>
      prev.map((req) => {
        if (req.customColumns) {
          const dict = { ...req.customColumns };
          delete dict[columnToDelete];
          return { ...req, customColumns: dict };
        }
        return req;
      }),
    );
    setColumnToDelete(null);
  };

  // 6. Excel Exporter via Local App
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("요구사항 관리", {
        views: [{ state: "frozen", xSplit: 0, ySplit: 6 }],
      });

      const colCount = columns.length;
      const lastColLetter = sheet.getColumn(colCount).letter;

      // 1. 문서 메타 정보 및 타이틀 대시보드
      sheet.getRow(1).height = 40;
      sheet.mergeCells(`A1:${lastColLetter}1`);
      const titleCell = sheet.getCell("A1");
      titleCell.value = "요구조건 분석 (Clarification)";
      titleCell.font = {
        name: "HD Medium",
        size: 20,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 90,
        stops: [
          { position: 0, color: { argb: "FF465FA0" } },
          { position: 1, color: { argb: "FF1E2D5D" } },
        ],
      };

      if (colCount >= 3) {
        const startLetter = sheet.getColumn(colCount - 2).letter;
        sheet.mergeCells(`${startLetter}2:${lastColLetter}2`);
        sheet.mergeCells(`${startLetter}3:${lastColLetter}3`);

        const meta1 = sheet.getCell(`${startLetter}2`);
        const doneCount = requirements.filter(
          (r) => r.status === "DONE",
        ).length;
        const progress =
          Math.round((doneCount / requirements.length) * 100) || 0;
        meta1.value = `완료(진행) 현황 표시: ${progress}%`;
        meta1.font = {
          name: "HD Medium",
          color: { argb: "FF3B82F6" },
          bold: true,
        };
        meta1.alignment = { horizontal: "right", vertical: "middle" };

        const meta2 = sheet.getCell(`${startLetter}3`);
        const warningCount = requirements.filter(
          (r) => r.status === "TODO" || r.status === "IN_PROGRESS",
        ).length;
        meta2.value = `주의 / 미완료 내역 분석: ${warningCount}건`;
        meta2.font = {
          name: "HD Medium",
          color: { argb: "FFEF4444" },
          bold: true,
        };
        meta2.alignment = { horizontal: "right", vertical: "middle" };
      }

      // 5-6행 헤더 준비
      const headerRow5 = sheet.getRow(5);
      const headerRow6 = sheet.getRow(6);

      let currentGroup: string | undefined = undefined;
      let groupStartIdx = -1;

      // 먼저 각각의 값을 씁니다.
      columns.forEach((col, index) => {
        const cell5 = headerRow5.getCell(index + 1);
        const cell6 = headerRow6.getCell(index + 1);

        if (col.groupName) {
          cell5.value = col.groupName;
          cell6.value = col.label;
        } else {
          cell5.value = col.label;
          cell6.value = col.label;
        }

        cell5.fill = {
          type: "gradient",
          gradient: "angle",
          degree: 90,
          stops: [
            { position: 0, color: { argb: "FF465FA0" } },
            { position: 1, color: { argb: "FF2B427D" } },
          ],
        };
        cell5.font = {
          bold: true,
          color: { argb: "FFFFFFFF" },
          name: "HD Medium",
        };
        cell5.alignment = { horizontal: "center", vertical: "middle" };

        cell6.fill = {
          type: "gradient",
          gradient: "angle",
          degree: 90,
          stops: [
            { position: 0, color: { argb: "FF2B427D" } },
            { position: 1, color: { argb: "FF1E2D5D" } },
          ],
        };
        cell6.font = {
          bold: false,
          color: { argb: "FFFFFFFF" },
          name: "HD Medium",
        };
        cell6.alignment = { horizontal: "center", vertical: "middle" };

        cell5.border = {
          right: { style: "medium", color: { argb: "FF2B427D" } },
          top: { style: "medium", color: { argb: "FF2B427D" } },
        };
        cell6.border = {
          right: { style: "medium", color: { argb: "FF2B427D" } },
          bottom: { style: "medium", color: { argb: "FF2B427D" } },
        };

        sheet.getColumn(index + 1).width = Math.max(
          10,
          (columnWidths[col.id] || 150) / 7.5,
        );
      });

      // 병합 처리
      columns.forEach((col, index) => {
        if (col.groupName) {
          if (col.groupName !== currentGroup) {
            if (currentGroup && groupStartIdx !== -1) {
              const startCell = headerRow5.getCell(groupStartIdx + 1);
              const endCell = headerRow5.getCell(index);
              if (startCell.address !== endCell.address)
                sheet.mergeCells(`${startCell.address}:${endCell.address}`);
            }
            currentGroup = col.groupName;
            groupStartIdx = index;
          }
        } else {
          if (currentGroup && groupStartIdx !== -1) {
            const startCell = headerRow5.getCell(groupStartIdx + 1);
            const endCell = headerRow5.getCell(index);
            if (startCell.address !== endCell.address)
              sheet.mergeCells(`${startCell.address}:${endCell.address}`);
            currentGroup = undefined;
            groupStartIdx = -1;
          }
          const cell5 = headerRow5.getCell(index + 1);
          const cell6 = headerRow6.getCell(index + 1);
          sheet.mergeCells(`${cell5.address}:${cell6.address}`);
        }
      });
      if (currentGroup && groupStartIdx !== -1) {
        const startCell = headerRow5.getCell(groupStartIdx + 1);
        const endCell = headerRow5.getCell(columns.length);
        if (startCell.address !== endCell.address)
          sheet.mergeCells(`${startCell.address}:${endCell.address}`);
      }

      sheet.autoFilter = `A6:${lastColLetter}6`;

      // 3. 데이터 삽입 및 스타일적용
      requirements.forEach((req, i) => {
        const rowIndex = 7 + i;
        const row = sheet.getRow(rowIndex);

        let isWarning = req.status === "TODO";
        let isRoot = req.priority === "HIGH";

        columns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          let val: any = "";

          if (col.id === "id") val = req.id;
          else if (col.id === "title") val = req.title || "";
          else if (col.id === "priority") val = req.priority || "";
          else if (col.id === "assignees")
            val = (req.assignees || []).map((a) => a.name).join(", ");
          else if (col.id === "dueDate") val = req.dueDate || "";
          else if (col.id === "status") val = req.status || "";
          else if (col.type === "button") val = col.buttonLabel;
          else if (col.type === "currency_usd") {
            const usdValue = resolveColumnValue(
              req,
              col.id,
              columns,
              tabDataMap,
              tabs,
              exchangeRates,
            );
            const fractionDigits =
              col.currencyDecimalPlaces !== undefined
                ? col.currencyDecimalPlaces
                : 0;
            val =
              usdValue === ""
                ? "N/A"
                : isNaN(usdValue)
                  ? "N/A"
                  : "$" +
                    Number(usdValue).toLocaleString(undefined, {
                      minimumFractionDigits: fractionDigits,
                      maximumFractionDigits: fractionDigits,
                    });
          } else if (col.type === "formula") {
            try {
              val = String(
                resolveColumnValue(
                  req,
                  col.id,
                  columns,
                  tabDataMap,
                  tabs,
                  exchangeRates,
                ),
              );
              if (
                !val.startsWith("Error") &&
                val !== "" &&
                !isNaN(Number(val)) &&
                col.decimalPlaces !== undefined
              ) {
                val = Number(val).toLocaleString(undefined, {
                  minimumFractionDigits: col.decimalPlaces,
                  maximumFractionDigits: col.decimalPlaces,
                });
              }
            } catch (e: any) {
              val = `Error: ${e.message}`;
            }
          } else if (col.type === "lookup") {
            val = resolveColumnValue(
              req,
              col.id,
              columns,
              tabDataMap,
              tabs,
              exchangeRates,
            );
            if (val && !isNaN(Number(val)) && col.decimalPlaces !== undefined)
              val = String(Number(val).toFixed(col.decimalPlaces));
          } else if (col.type === "inflation_pv") {
            try {
              const numVal = resolveColumnValue(
                req,
                col.id,
                columns,
                tabDataMap,
                tabs,
                exchangeRates,
              );
              if (numVal !== "" && !isNaN(Number(numVal))) {
                const dp =
                  col.decimalPlaces !== undefined ? col.decimalPlaces : 0;
                val = Number(numVal).toLocaleString(undefined, {
                  minimumFractionDigits: dp,
                  maximumFractionDigits: dp,
                });
              } else {
                val = numVal;
              }
            } catch (e: any) {
              val = `Error: ${e.message}`;
            }
          } else if (col.type === "relation") {
            val = req.customColumns?.[col.id] || "";
          } else if (col.type === "rollup") {
            val = resolveColumnValue(
              req,
              col.id,
              columns,
              tabDataMap,
              tabs,
              exchangeRates,
            );
          } else if (col.type === "status") {
            val = req.customColumns?.[col.id] || "";
          } else if (col.isCustom) val = req.customColumns?.[col.id] || "";

          // 숫자 타입 자동 파싱
          if (/^\-?\d+(\.\d+)?$/.test(String(val))) {
            cell.value = Number(val);
            if (col.decimalPlaces !== undefined) {
              const mask =
                col.decimalPlaces === 0
                  ? "0"
                  : "0." + "0".repeat(col.decimalPlaces);
              cell.numFmt = mask;
            }
          } else {
            cell.value = String(val);
          }

          // 동적 행 높이 조절
          const lines = String(val).split("\n").length;
          if (lines > 1) {
            const newHeight = lines >= 3 ? 45 : 30;
            if ((row.height || 22) < newHeight) row.height = newHeight;
          } else {
            if ((row.height || 0) < 22) row.height = 22;
          }

          cell.alignment = { wrapText: true, vertical: "middle" };
          cell.font = { name: "HD Medium", size: 8 };

          if (isRoot) {
            cell.fill = {
              type: "gradient",
              gradient: "angle",
              degree: 90,
              stops: [
                { position: 0, color: { argb: "FF475569" } },
                { position: 1, color: { argb: "FF334155" } },
              ],
            };
            cell.font = {
              ...(cell.font as any),
              bold: true,
              color: { argb: "FFFFFFFF" },
            };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF1F5F9" },
            };
          }

          cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            right: {
              style: "thin",
              color:
                colIdx === columns.length - 1
                  ? { argb: "FFCBD5E1" }
                  : undefined,
            },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      // @ts-ignore
      const isTauri = ("__TAURI_INTERNALS__" in window) || ("__TAURI_IPC__" in window);

      const currentTabName =
        tabs?.find((t) => t.id === activeTabId)?.sidebarLabel || "Requirements";
      const dateStr = new Date().toISOString().split("T")[0];
      const defaultFileName = `${currentTabName}_${dateStr}.xlsx`;

      if (isTauri) {
        // @ts-ignore
        const { save } = await import("@tauri-apps/plugin-dialog");
        // @ts-ignore
        const { writeFile, BaseDirectory } =
          await import("@tauri-apps/plugin-fs");

        let exportPath = "";
        try {
          const configStr = localStorage.getItem("app_config");
          if (configStr) {
            const config = JSON.parse(configStr);
            exportPath = config.excelExportPath || "";
          }
        } catch (e) {}

        let fullDefaultPath = defaultFileName;
        if (exportPath) {
          const separator = exportPath.includes("\\") ? "\\" : "/";
          const ensureTrailingSlash = (path: string) =>
            path.endsWith(separator) ? path : path + separator;
          fullDefaultPath = ensureTrailingSlash(exportPath) + defaultFileName;
        }

        try {
          const filePath = await save({
            filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
            defaultPath: fullDefaultPath,
          });

          if (filePath) {
            let uint8Data: Uint8Array;
            if (buffer instanceof ArrayBuffer) {
              uint8Data = new Uint8Array(buffer);
            } else if (
              buffer &&
              typeof (buffer as any).length !== "undefined"
            ) {
              uint8Data = new Uint8Array(buffer as any);
            } else {
              throw new Error("Invalid buffer type returned from ExcelJS");
            }

            // @ts-ignore
            const { invoke } = await import("@tauri-apps/api/core");
            await invoke("save_binary_file", {
              path: filePath,
              contents: Array.from(uint8Data),
            });
            alert(`Excel 내보내기 성공!\n${filePath}`);
          }
        } catch (dialogErr: any) {
          throw new Error(
            "OS 파일 대화상자/저장 실패: " +
              (dialogErr?.message || String(dialogErr)),
          );
        }
      } else {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, defaultFileName);
        alert("Excel 내보내기 다운로드가 시작되었습니다.");
      }
    } catch (e: any) {
      console.error("Export failed: ", e);
      alert(`엑셀 내보내기 중 문제가 발생했습니다:\n${e.message || String(e)}`);
    }
  };

  // 7. Drag and Drop & Duplication Logic
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [contextMenuColId, setContextMenuColId] = useState<string | null>(null);
  const [superContextMenuGroup, setSuperContextMenuGroup] = useState<
    string | null
  >(null);
  const [contextMenuPos, setContextMenuPos] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const [hoverTitleCoords, setHoverTitleCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [frozenColumnIds, setFrozenColumnIds] = useState<
    Record<string, string | null>
  >({});

  const frozenColumnId = useMemo(() => {
    if (frozenColumnIds[activeTabId || "global"] !== undefined) {
      return frozenColumnIds[activeTabId || "global"];
    }
    if (columns.find((c) => c.id === "title")) return "title";
    if (columns.find((c) => c.id === "item")) return "item";
    return null;
  }, [frozenColumnIds, activeTabId, columns]);

  const setFrozenColumnId = useCallback(
    (id: string | null) => {
      setFrozenColumnIds((prev) => ({
        ...prev,
        [activeTabId || "global"]: id,
      }));
    },
    [activeTabId],
  );

  const frozenOffsets = useMemo(() => {
    if (!frozenColumnId) return null;
    const frozenIndex = columns.findIndex((c) => c.id === frozenColumnId);
    if (frozenIndex === -1) return null;

    const offsets: Record<string, number> = {};
    let currentLeft = 84; // 40px (index) + 44px (checkbox)

    for (let i = 0; i <= frozenIndex; i++) {
      const col = columns[i];
      offsets[col.id] = currentLeft;
      const isMinimized = minimizedColumns[col.id];
      currentLeft += isMinimized ? 24 : columnWidths[col.id] || 150;
    }
    return { offsets, frozenIndex, lastColId: columns[frozenIndex].id };
  }, [frozenColumnId, columns, minimizedColumns, columnWidths]);

  const handleColumnContextMenu = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    setContextMenuColId(colId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleColumnDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColumnId(colId);
    e.dataTransfer.setData("text/plain", colId);
  };
  const handleColumnDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(colId);
  };
  const handleColumnDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    if (!draggedColumnId || draggedColumnId === targetColId) return;

    setColumns((prev) => {
      const draft = [...prev];
      const fromIndex = draft.findIndex((c) => c.id === draggedColumnId);
      const toIndex = draft.findIndex((c) => c.id === targetColId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [removed] = draft.splice(fromIndex, 1);
      draft.splice(toIndex, 0, removed);
      return draft;
    });
    setDraggedColumnId(null);
  };

  const handleDuplicateRow = useCallback(
    (sourceRowId: string, insertAfterId?: string) => {
      setRequirements((prev: Requirement[]) => {
        const sourceRow = prev.find((r) => r.id === sourceRowId);
        if (!sourceRow) return prev;

        const maxNumericId = prev.reduce((max, r) => {
          const match = r.id.match(/REQ-(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        const nextId = `REQ-${String(maxNumericId + 1).padStart(3, "0")}`;

        const clone: Requirement = {
          ...sourceRow,
          id: nextId,
          title: `${sourceRow.title} (복사본)`,
          assignees: [...sourceRow.assignees],
          customColumns: { ...sourceRow.customColumns },
        };

        const draft = [...prev];
        const targetIndex = draft.findIndex(
          (r) => r.id === (insertAfterId || sourceRowId),
        );
        if (targetIndex !== -1) {
          draft.splice(targetIndex + 1, 0, clone);
        } else {
          draft.push(clone);
        }
        return draft;
      });
    },
    [setRequirements],
  );

  const handleRowDragStart = useCallback(
    (e: React.DragEvent, rowId: string) => {
      setDraggedRowId(rowId);
      e.dataTransfer.effectAllowed = "copyMove";
      e.dataTransfer.setData("text/plain", rowId);
    },
    [],
  );

  const handleRowDragOver = useCallback((e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    setDragOverRowId(rowId);
    e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
  }, []);

  const handleRowDrop = useCallback(
    (e: React.DragEvent, targetRowId: string) => {
      e.preventDefault();
      setDragOverRowId(null);
      if (!draggedRowId) return;

      if (e.altKey) {
        handleDuplicateRow(draggedRowId, targetRowId);
      } else {
        if (draggedRowId === targetRowId) {
          setDraggedRowId(null);
          return;
        }
        setRequirements((prev) => {
          const draft = [...prev];
          const fromIndex = draft.findIndex((r) => r.id === draggedRowId);
          const toIndex = draft.findIndex((r) => r.id === targetRowId);
          if (fromIndex === -1 || toIndex === -1) return prev;

          const [removed] = draft.splice(fromIndex, 1);
          draft.splice(toIndex, 0, removed);
          return draft;
        });
      }
      setDraggedRowId(null);
    },
    [draggedRowId, handleDuplicateRow, setRequirements],
  );

  // 8. Excel Paste Logic
  const handleGridPaste = useCallback(
    (e: React.ClipboardEvent, startRowId: string, startColId: string) => {
      const text = e.clipboardData.getData("text");
      if (!text) return;

      // Only process if it feels like grid paste (has tabs or newlines)
      if (!text.includes("\t") && !text.includes("\n")) {
        // Natural single cell paste - let native input handle it
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Parse TSV taking quotes into account (Excel wraps cells with newlines in quotes)
      const parseTSV = (str: string) => {
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = "";
        let inQuotes = false;

        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          const nextChar = str[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              currentCell += '"'; // unescape double quotes
              i++; // skip next quote
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "\t" && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = "";
          } else if (char === "\r" && nextChar === "\n" && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
            i++; // skip \n
          } else if (char === "\n" && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
          } else {
            currentCell += char;
          }
        }

        if (currentCell !== "" || currentRow.length > 0) {
          currentRow.push(currentCell);
          // Avoid adding a single empty row at the end if the text ended with a newline
          if (currentRow.length !== 1 || currentRow[0] !== "") {
            rows.push(currentRow);
          }
        }
        return rows;
      };

      const pasteData = parseTSV(text);
      if (
        pasteData.length === 0 ||
        (pasteData.length === 1 && pasteData[0].length <= 1)
      )
        return; // Fallback to normal if just text

      const startRowIndex = filteredAndSortedRequirements.findIndex(
        (r) => r.id === startRowId,
      );
      // Exclude 'id' col, but allow pasting to 'assignees'
      const usableCols = columns.filter((c) => c.id !== "id");
      const startColIndex = usableCols.findIndex((c) => c.id === startColId);

      if (startRowIndex === -1 || startColIndex === -1) return;

      let newAssigneesToAdd: Assignee[] = [];

      setRequirements((prev) => {
        const draft = [...prev];

        const currentRowsCount = filteredAndSortedRequirements.length;
        let nextNumericId =
          draft.reduce((max, r) => {
            const match = r.id.match(/REQ-(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
          }, 0) + 1;

        const defaultAssignee =
          assigneesPool.length > 0
            ? assigneesPool[0]
            : { id: "USR-000", name: "미지정", avatarUrl: "" };

        pasteData.forEach((rowData, i) => {
          const targetReqIndex = startRowIndex + i;
          let currentReq: Requirement;
          let realIndex = -1;

          if (targetReqIndex < currentRowsCount) {
            const targetReqId =
              filteredAndSortedRequirements[targetReqIndex].id;
            realIndex = draft.findIndex((r) => r.id === targetReqId);
            if (realIndex === -1) return;
            currentReq = {
              ...draft[realIndex],
              customColumns: { ...draft[realIndex].customColumns },
            };
          } else {
            // Create new row when pasting beyond existing rows
            const newId = `REQ-${String(nextNumericId++).padStart(3, "0")}`;
            currentReq = {
              id: newId,
              title: "",
              priority: "MEDIUM",
              assignees: [], // will be populated or stay empty, we remove default here to prevent mixing
              dueDate: new Date().toISOString().split("T")[0],
              status: "TODO",
              customColumns: {},
            };
          }

          rowData.forEach((cellText, j) => {
            const targetColIndex = startColIndex + j;
            if (targetColIndex >= usableCols.length) return;
            const colId = usableCols[targetColIndex].id;

            const cleanedText = cellText.trim();

            if (colId === "title") currentReq.title = cleanedText;
            else if (colId === "priority") {
              const up = cleanedText.toUpperCase() as Priority;
              if (["HIGH", "MEDIUM", "LOW"].includes(up))
                currentReq.priority = up;
            } else if (colId === "status") {
              const up = cleanedText.toUpperCase() as Status;
              if (["TODO", "IN_PROGRESS", "DONE"].includes(up))
                currentReq.status = up;
            } else if (colId === "dueDate") {
              currentReq.dueDate = cleanedText || currentReq.dueDate;
            } else if (colId === "assignees") {
              const names = cleanedText
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean);
              const matchedAssignees = [];
              for (const name of names) {
                const foundPool = assigneesPool.find(
                  (a) => a.name.toLowerCase() === name.toLowerCase(),
                );
                const foundNew = newAssigneesToAdd.find(
                  (a) => a.name.toLowerCase() === name.toLowerCase(),
                );
                if (foundPool) {
                  matchedAssignees.push(foundPool);
                } else if (foundNew) {
                  matchedAssignees.push(foundNew);
                } else {
                  // Create new assignee on the fly
                  const newAssigneeId = `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
                  const newAssignee = {
                    id: newAssigneeId,
                    name: name,
                    avatarUrl: "",
                  };
                  newAssigneesToAdd.push(newAssignee);
                  matchedAssignees.push(newAssignee);
                }
              }
              if (matchedAssignees.length > 0) {
                currentReq.assignees = matchedAssignees;
              }
            } else if (usableCols[targetColIndex].isCustom) {
              currentReq.customColumns[colId] = cleanedText;
            }
          });

          if (currentReq.assignees.length === 0) {
            currentReq.assignees = [defaultAssignee];
          }

          if (targetReqIndex < currentRowsCount) {
            draft[realIndex] = currentReq;
          } else {
            draft.push(currentReq);
          }
        });

        return draft;
      });

      if (newAssigneesToAdd.length > 0) {
        setAssigneesPool((prev) => [...prev, ...newAssigneesToAdd]);
      }

      setActiveCellEditor(null);
    },
    [
      columns,
      filteredAndSortedRequirements,
      assigneesPool,
      setRequirements,
      setAssigneesPool,
      setActiveCellEditor,
    ],
  );

  const getStickyStyle = useCallback(
    (isHeader = false): React.CSSProperties => {
      if (isHeader) {
        return {
          backgroundColor: "var(--color-brand-surface-lowest)",
        };
      }
      return {};
    },
    [],
  );

  const getCellStickyStyle = useCallback(
    (
      colId: string | "index" | "checkbox",
      isHeader = false,
    ): React.CSSProperties => {
      let base = getStickyStyle(isHeader);

      if (frozenOffsets) {
        const isFrozen =
          colId === "index" ||
          colId === "checkbox" ||
          frozenOffsets.offsets[colId as string] !== undefined;
        if (isFrozen) {
          const left =
            colId === "index"
              ? 0
              : colId === "checkbox"
                ? 40
                : frozenOffsets.offsets[colId as string];
          const isLastFrozen =
            (colId === "checkbox" && frozenOffsets.frozenIndex === -1) ||
            colId === frozenOffsets.lastColId;

          base = {
            ...base,
            position: "sticky",
            left,
            zIndex: isHeader ? 30 : 10,
            backgroundColor: isHeader
              ? "var(--color-brand-surface-highest)"
              : "var(--row-bg)",
          };

          if (isLastFrozen) {
            base.boxShadow = "6px 0px 10px -3px rgba(0,0,0,0.5)";
          }
        }
      }
      return base;
    },
    [frozenOffsets, getStickyStyle],
  );

  const getStickyShadowClass = () => "";

  return (
    <div className="bg-brand-surface border border-brand-outline rounded-[2rem] shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px] animate-fade-slide-up delay-100">
      {/* 1. SpreadSheet Toolbar */}
      <div className="px-5 py-4 border-b border-brand-outline-variant bg-brand-surface-low flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left Side Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Action Buttons */}
          <div className="flex bg-brand-surface border border-brand-outline-variant rounded-lg overflow-hidden shrink-0 h-[36px]">
            <button
              onClick={handleUndo}
              disabled={historyRef.current.length === 0}
              className={`px-3 flex items-center justify-center transition-colors ${historyRef.current.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-brand-surface-high cursor-pointer text-brand-on-surface"}`}
              title="되돌리기 (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] bg-brand-outline-variant" />
            <button
              onClick={handleRedo}
              disabled={redoStackRef.current.length === 0}
              className={`px-3 flex items-center justify-center transition-colors ${redoStackRef.current.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-brand-surface-high cursor-pointer text-brand-on-surface"}`}
              title="다시 실행 (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
          <button
            id="btn-spreadsheet-add-row"
            onClick={handleAddRow}
            className="flex-1 sm:flex-initial px-4 py-2 bg-brand-primary text-brand-on-primary text-sm font-semibold rounded-lg hover:opacity-95 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />새 요구사항
          </button>
          {requirements.length === 0 && (
            <button
              id="btn-spreadsheet-load-examples"
              onClick={() => {
                setRequirements(INITIAL_REQUIREMENTS);
                setAssigneesPool(INITIAL_ASSIGNEES);
              }}
              className="px-4 py-2 bg-brand-tertiary text-white text-sm font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              예시 데이터 로드
            </button>
          )}
          <button
            id="btn-spreadsheet-export"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high hover:text-brand-on-surface active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Excel 내보내기
          </button>
          <button
            id="btn-spreadsheet-manage-assignees"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAssigneeManagerPos({
                x: rect.right + 10,
                y: rect.top,
              });
              setShowAssigneeManager(true);
            }}
            className="px-4 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high hover:text-brand-on-surface active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-brand-primary" />
            담당자 관리
          </button>
          <button
            id="btn-spreadsheet-single-line"
            onClick={toggleSingleLineView}
            className={`px-3 py-2 border text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${isSingleLineView ? "bg-brand-primary-container/20 border-brand-primary text-brand-primary" : "bg-brand-surface border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface-high"}`}
          >
            <AlignLeft className="w-4 h-4" />
            1줄보기
          </button>
          {selectedIds.length > 0 && (
            <button
              id="btn-spreadsheet-delete-bulk"
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-brand-error-container text-brand-on-error-container text-sm font-semibold rounded-lg hover:bg-opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-error/20 animate-pulse"
            >
              <Trash2 className="w-4 h-4" />
              선택 삭제 ({selectedIds.length})
            </button>
          )}
        </div>
        <div className="flex flex-col 2xl:flex-row items-end 2xl:items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-col flex-wrap sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1 text-xs text-brand-on-surface-variant w-full sm:w-auto">
              <span>우선순위:</span>
              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as Priority | "ALL")
                }
                className="bg-brand-surface-high border border-brand-outline-variant rounded-md px-2 py-1 text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-xs"
              >
                <option value="ALL">전체</option>
                <option value="HIGH">높음</option>
                <option value="MEDIUM">중간</option>
                <option value="LOW">낮음</option>
              </select>
            </div>
            <div className="flex items-center gap-1 text-xs text-brand-on-surface-variant w-full sm:w-auto">
              <span>상태:</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Status | "ALL")
                }
                className="bg-brand-surface-high border border-brand-outline-variant rounded-md px-2 py-1 text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-xs"
              >
                <option value="ALL">전체</option>
                <option value="TODO">대기중</option>
                <option value="IN_PROGRESS">검토중</option>
                <option value="DONE">검토완료</option>
              </select>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline-variant w-4.5 h-4.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색 (ID, 명칭, 담당자...)"
                className="w-full pl-9 pr-8 py-2 bg-brand-surface-lowest text-sm border border-brand-outline-variant rounded-lg text-brand-on-surface placeholder:text-brand-outline-variant focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-brand-on-surface text-brand-outline-variant transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="px-3 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface-variant hover:text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              title="모든 검색 및 필터 지우기"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>
      <div
        ref={parentRef}
        onScroll={handleGridScroll}
        className="overflow-x-auto overflow-y-auto overscroll-y-contain flex-1 min-h-0 w-full relative"
      >
        <table className="w-max table-fixed border-separate border-spacing-0 text-left select-none bg-brand-surface [&_th]:border-b [&_td]:border-b [&_th]:border-brand-outline-variant [&_td]:border-brand-outline-variant">
          <colgroup>
            <col
              style={{
                width: "40px",
                minWidth: "40px",
                maxWidth: "40px",
              }}
            />
            <col
              style={{
                width: "44px",
                minWidth: "44px",
                maxWidth: "44px",
              }}
            />
            {columns.map((col) => {
              const width = minimizedColumns[col.id]
                ? 24
                : columnWidths[col.id] || 150;
              return (
                <col
                  key={col.id}
                  style={{
                    width: `${width}px`,
                    minWidth: `${width}px`,
                    maxWidth: `${width}px`,
                  }}
                />
              );
            })}
            <col
              style={{
                width: "150px",
                minWidth: "150px",
                maxWidth: "150px",
              }}
            />
          </colgroup>
          <thead className="sticky top-0 z-20 bg-brand-surface-lowest shadow-sm">
            <tr className="h-0 p-0 border-0 m-0 invisible">
              <th
                style={{
                  width: "40px",
                  minWidth: "40px",
                  maxWidth: "40px",
                  padding: 0,
                  border: 0,
                }}
              />
              <th
                style={{
                  width: "44px",
                  minWidth: "44px",
                  maxWidth: "44px",
                  padding: 0,
                  border: 0,
                }}
              />
              {columns.map((col) => {
                const w = minimizedColumns[col.id]
                  ? 24
                  : columnWidths[col.id] || 150;
                return (
                  <th
                    key={`resizer-h-${col.id}`}
                    style={{
                      width: `${w}px`,
                      minWidth: `${w}px`,
                      maxWidth: `${w}px`,
                      padding: 0,
                      border: 0,
                    }}
                  />
                );
              })}
              <th
                style={{
                  width: "150px",
                  minWidth: "150px",
                  maxWidth: "150px",
                  padding: 0,
                  border: 0,
                }}
              />
            </tr>
            {columns.some((c) => c.groupName) && (
              <tr className="bg-brand-surface-low border-b border-brand-outline-variant text-[12px] font-semibold text-brand-on-surface-variant select-none">
                <th
                  className="w-10 border-r border-brand-outline-variant"
                  style={getCellStickyStyle("index", true)}
                />
                <th
                  className="w-11 border-r border-brand-outline-variant"
                  style={getCellStickyStyle("checkbox", true)}
                />
                {(() => {
                  const ths = [];
                  let currentGroup: string | undefined = undefined;
                  let colSpan = 0;
                  let firstColId: string = columns[0]?.id || "";
                  const pushGroup = (groupIdx: number, colId: string) => {
                    if (colSpan > 0) {
                      ths.push(
                        <th
                          key={`group-${groupIdx}-${currentGroup || "none"}`}
                          colSpan={colSpan}
                          className={`py-1 text-center ${currentGroup ? "border-x border-t-2 border-b-0 border-brand-primary/60 bg-brand-surface-highest text-brand-on-surface-variant font-semibold shadow-sm cursor-context-menu" : "border-r border-brand-outline-variant"}`}
                          style={getCellStickyStyle(colId, true)}
                          onContextMenu={(e) => {
                            if (currentGroup) {
                              e.preventDefault();
                              setSuperContextMenuGroup(currentGroup);
                              setContextMenuPos({
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }
                          }}
                        >
                          {currentGroup || ""}
                        </th>,
                      );
                    }
                  };
                  columns.forEach((col, idx) => {
                    if (col.groupName === currentGroup) {
                      colSpan++;
                    } else {
                      pushGroup(idx, firstColId);
                      currentGroup = col.groupName;
                      colSpan = 1;
                      firstColId = col.id;
                    }
                  });
                  pushGroup(columns.length, firstColId);
                  return ths;
                })()}
                <th className="w-[150px] border-brand-outline-variant" />
              </tr>
            )}
            <tr className="bg-brand-surface-low border-b border-brand-outline-variant text-[12px] font-semibold text-brand-on-surface-variant select-none">
              <th
                className="w-10 px-2 py-3 border-r border-brand-outline-variant text-center"
                style={getCellStickyStyle("index", true)}
              />
              <th
                className={`p-3 border-r border-brand-outline-variant w-11 text-center`}
                style={{
                  ...getCellStickyStyle("checkbox", true),
                  verticalAlign: "middle",
                }}
              >
                <div
                  className="w-4 h-4 inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors mb-[2px]"
                  onClick={() =>
                    handleSelectAll(
                      filteredAndSortedRequirements.length > 0 &&
                        selectedIds.length !==
                          filteredAndSortedRequirements.length,
                    )
                  }
                >
                  {filteredAndSortedRequirements.length > 0 &&
                    selectedIds.length ===
                      filteredAndSortedRequirements.length && (
                      <Check
                        className="w-3 h-3 text-brand-on-surface"
                        strokeWidth={4}
                      />
                    )}
                </div>
              </th>
              {columns.map((col) => {
                const isMinimized = minimizedColumns[col.id];
                const width = isMinimized ? 24 : columnWidths[col.id] || 150;
                return (
                  <th
                    key={col.id}
                    draggable={true}
                    onDragStart={(e) => handleColumnDragStart(e, col.id)}
                    onDragOver={(e) => handleColumnDragOver(e, col.id)}
                    onDragEnter={(e) => e.preventDefault()}
                    onDrop={(e) => handleColumnDrop(e, col.id)}
                    onContextMenu={(e) => handleColumnContextMenu(e, col.id)}
                    style={{
                      width,
                      minWidth: width,
                      maxWidth: width,
                      ...getCellStickyStyle(col.id, true),
                      ...(col.backgroundColor
                        ? {
                            backgroundImage: `linear-gradient(180deg, var(--color-brand-surface-highest) 0%, ${col.backgroundColor} 100%)`,
                          }
                        : {}),
                    }}
                    className={`pl-1.5 pr-1 py-2 border-r border-brand-outline-variant text-[13px] group relative ${isMinimized ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} transition-all duration-300 ${dragOverColumnId === col.id ? "bg-brand-surface-high/50 border-l-2 border-l-brand-primary" : ""} ${selectedColumnIds.includes(col.id) ? "bg-brand-primary/10" : ""}`}
                    onClick={(e) => {
                      if (isMinimized) {
                        setMinimizedColumns((p) => ({
                          ...p,
                          [col.id]: false,
                        }));
                      } else if (e.shiftKey || e.metaKey || e.ctrlKey) {
                        setSelectedColumnIds((prev) =>
                          prev.includes(col.id)
                            ? prev.filter((id) => id !== col.id)
                            : [...prev, col.id],
                        );
                      } else {
                        setSelectedColumnIds([col.id]);
                      }
                    }}
                  >
                    <div
                      className="flex items-center justify-between w-full h-full relative"
                      title={isMinimized ? col.label : void 0}
                    >
                      {!isMinimized ? (
                        editingColumnNameId === col.id ? (
                          <textarea
                            autoFocus={true}
                            defaultValue={col.label}
                            rows={2}
                            className="font-semibold flex-1 mr-0.5 bg-brand-surface-lowest border border-brand-primary text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1 w-full text-[13px] resize-none overflow-hidden"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val) {
                                setColumns((prev) =>
                                  prev.map((c) =>
                                    c.id === col.id
                                      ? {
                                          ...c,
                                          label: val,
                                        }
                                      : c,
                                  ),
                                );
                              }
                              setEditingColumnNameId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  setColumns((prev) =>
                                    prev.map((c) =>
                                      c.id === col.id
                                        ? {
                                            ...c,
                                            label: val,
                                          }
                                        : c,
                                    ),
                                  );
                                }
                                setEditingColumnNameId(null);
                              }
                              if (e.key === "Escape") {
                                setEditingColumnNameId(null);
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="font-semibold line-clamp-2 leading-[1.15] break-words flex-1 mr-0.5 cursor-text whitespace-pre-wrap text-center"
                            onMouseEnter={(e) => {
                              if (col.description) {
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setHoverTitleCoords({
                                  x: rect.left,
                                  y: rect.bottom + 5,
                                });
                                setHoveredColumnId(col.id);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredColumnId(null);
                            }}
                            onDoubleClick={() => setEditingColumnNameId(col.id)}
                          >
                            {col.label}
                          </div>
                        )
                      ) : (
                        <span
                          className="text-brand-outline-variant font-bold mx-auto text-[10px] tracking-widest cursor-pointer group-hover:text-brand-primary"
                          title={`열 숨김: ${col.label} (우클릭하여 확장)`}
                        >
                          ...
                        </span>
                      )}
                      {!isMinimized && columnSearchTerms[col.id] && (
                        <Filter className="w-3 h-3 text-brand-primary" />
                      )}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setResizingColId(col.id);
                          setResizeStartX(e.clientX);
                          setResizeStartWidth(columnWidths[col.id] || 150);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          let maxLen = (col.label.length || 0) * 15 + 40;
                          filteredAndSortedRequirements.forEach((req) => {
                            let text = "";
                            if (
                              col.isCustom ||
                              ![
                                "id",
                                "title",
                                "priority",
                                "dueDate",
                                "status",
                              ].includes(col.id)
                            ) {
                              try {
                                text = String(
                                  resolveColumnValue(
                                    req,
                                    col.id,
                                    columns,
                                    tabDataMap,
                                    tabs,
                                    exchangeRates,
                                  ) || "",
                                );
                              } catch (e) {}
                            } else {
                              text = String(
                                req[col.id as keyof Requirement] || "",
                              );
                            }
                            maxLen = Math.max(maxLen, text.length * 8 + 20);
                          });
                          const newWidth = Math.min(Math.max(maxLen, 60), 600);
                          setColumns((prev) =>
                            prev.map((c) =>
                              c.id === col.id ? { ...c, width: newWidth } : c,
                            ),
                          );
                        }}
                        className="absolute -right-4 top-0 bottom-0 w-4 cursor-col-resize hover:bg-brand-primary/20 group-hover:bg-brand-outline-variant/10 z-10 transition-colors"
                        title="크기 조절 (더블클릭시 내용에 맞게 맞춤)"
                      />
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 w-[150px] text-brand-on-surface-variant border-brand-outline-variant bg-brand-surface-lowest font-medium">
                <button
                  id="btn-add-custom-column"
                  onClick={() => setShowAddColumnModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-dashed border-brand-outline-variant text-brand-outline hover:text-brand-primary hover:border-brand-primary hover:bg-brand-surface-high/35 transition-all duration-200 cursor-pointer w-full text-left"
                >
                  <Plus className="w-3.5 h-3.5" />열 추가
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-brand-on-surface divide-y divide-brand-outline-variant/60 leading-[1.35]">
            {filteredAndSortedRequirements.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 3}
                  className="px-6 py-12 text-center text-brand-on-surface-variant"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CircleDot className="w-8 h-8 text-brand-outline-variant animate-pulse" />
                    <span className="text-sm font-medium">
                      부합하는 요구사항이 없습니다.
                    </span>
                    <span className="text-xs opacity-70">
                      새 요구사항을 만들기 위해 상단의 '새 요구사항' 또는 하단의
                      '행 추가' 버튼을 눌러주세요.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              (() => {
                const virtualRows = rowVirtualizer.getVirtualItems();
                const paddingTop =
                  virtualRows.length > 0 ? virtualRows[0].start : 0;
                const paddingBottom =
                  virtualRows.length > 0
                    ? rowVirtualizer.getTotalSize() -
                      virtualRows[virtualRows.length - 1].end
                    : 0;

                return (
                  <>
                    {paddingTop > 0 && (
                      <tr>
                        <td
                          style={{
                            height: `${paddingTop}px`,
                            padding: 0,
                            border: "none",
                          }}
                          colSpan={columns.length + 3}
                        />
                      </tr>
                    )}
                    {virtualRows.map((virtualRow) => {
                      const req =
                        filteredAndSortedRequirements[virtualRow.index];
                      if (!req) return null;
                      return (
                        <SpreadsheetRow
                          key={req.id}
                          ref={rowVirtualizer.measureElement}
                          dataIndex={virtualRow.index}
                          req={req}
                          isSelected={selectedIds.includes(req.id)}
                          isSingleLineView={isSingleLineView}
                          dragOverRowId={dragOverRowId}
                          columns={columns}
                          minimizedColumns={minimizedColumns}
                          columnWidths={columnWidths}
                          isActive={activeCellEditor?.rowId === req.id}
                          activeField={
                            activeCellEditor?.rowId === req.id
                              ? activeCellEditor.field
                              : null
                          }
                          isLockedByOther={
                            !!activeLocks[`${activeTabId}:${req.id}`] &&
                            activeLocks[`${activeTabId}:${req.id}`].userId !==
                              currentUser?.id
                          }
                          lockedByName={
                            activeLocks[`${activeTabId}:${req.id}`]?.userName ??
                            null
                          }
                          isPriorityOpen={showPriorityDropdownId === req.id}
                          isAssigneeOpen={showAssigneeDropdownId === req.id}
                          isStatusOpen={showStatusDropdownId === req.id}
                          currentUser={currentUser}
                          assigneesPool={assigneesPool}
                          reqById={reqById}
                          exchangeRates={exchangeRates}
                          activeCellEditor={activeCellEditor}
                          tabDataMap={tabDataMap}
                          tabs={tabs}
                          handleRowDragOver={handleRowDragOver}
                          handleRowDrop={handleRowDrop}
                          handleDuplicateRow={handleDuplicateRow}
                          handleRowDragStart={handleRowDragStart}
                          handleSelectRow={handleSelectRow}
                          setMinimizedColumns={setMinimizedColumns}
                          setActiveCellEditor={setActiveCellEditor}
                          updateRequirementField={updateRequirementField}
                          handleGridPaste={handleGridPaste}
                          setShowPriorityDropdownId={setShowPriorityDropdownId}
                          setPriorityDropdownPos={setPriorityDropdownPos}
                          priorityDropdownPos={priorityDropdownPos}
                          priorityRef={priorityRef}
                          setShowAssigneeDropdownId={setShowAssigneeDropdownId}
                          setAssigneeDropdownPos={setAssigneeDropdownPos}
                          assigneeDropdownPos={assigneeDropdownPos}
                          originalSetRequirements={originalSetRequirements}
                          assigneeRef={assigneeRef}
                          setShowStatusDropdownId={setShowStatusDropdownId}
                          setStatusDropdownPos={setStatusDropdownPos}
                          statusDropdownPos={statusDropdownPos}
                          statusRef={statusRef}
                          showSelectDropdown={
                            showSelectDropdown?.rowId === req.id
                              ? showSelectDropdown.colId
                              : null
                          }
                          setShowSelectDropdown={setShowSelectDropdown}
                          setSelectDropdownPos={setSelectDropdownPos}
                          selectDropdownPos={selectDropdownPos}
                          selectDropdownRef={selectDropdownRef}
                          setRequirements={setRequirements}
                          setColumns={setColumns}
                          setSelectedIds={setSelectedIds}
                          getCellStickyStyle={getCellStickyStyle}
                        />
                      );
                    })}
                    {paddingBottom > 0 && (
                      <tr>
                        <td
                          style={{
                            height: `${paddingBottom}px`,
                            padding: 0,
                            border: "none",
                          }}
                          colSpan={columns.length + 3}
                        />
                      </tr>
                    )}
                  </>
                );
              })()
            )}
            <tr>
              <td
                className="p-0 border-t border-brand-outline-variant"
                colSpan={columns.length + 3}
              >
                <button
                  id="btn-spreadsheet-add-bottom"
                  onClick={handleAddRow}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-primary-container/5 transition-colors text-xs font-semibold text-left select-none cursor-pointer"
                >
                  <Plus className="w-4 h-4" />행 추가
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {showAddColumnModal && (
        <DraggableModal
          isOpen={showAddColumnModal}
          onClose={() => {
            setShowAddColumnModal(false);
            setEditingColumnDefId(null);
            setNewColumnName("");
            setNewColumnType("text");
            setNewColumnOptionsInput("");
          }}
          title={editingColumnDefId ? "열 속성 변경" : "새 컬럼(열) 정의"}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                열 명칭 (예: 검증 결과, 메모, 담당부서)
              </label>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="열 이름 입력..."
                autoFocus={true}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleAddOrEditCustomColumn()
                }
                className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                열 속성 유형 (Notion 스타일)
              </label>
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
                className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
              >
                <option value="text">텍스트 (Text)</option>
                <option value="number">숫자 (Number)</option>
                <option value="date">날짜 (Date)</option>
                <option value="checkbox">체크박스 (Checkbox)</option>
                <option value="select">선택 (Select)</option>
                <option value="status">상태 (Status)</option>
                <option value="relation">관계형 (Relation)</option>
                <option value="rollup">롤업 (Rollup)</option>
                <option value="formula">수식 (Formula)</option>
                <option value="lookup">교차 탭 참조 (Lookup)</option>
                <option value="inflation_pv">
                  물가상승 현가화 (Inflation PV)
                </option>
                <option value="currency_usd">외화 환산 (USD)</option>
                <option value="button">버튼 (Button)</option>
              </select>
            </div>
            {newColumnType === "lookup" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                    대상 탭 (선택 시 가져올 탭)
                  </label>
                  <select
                    value={lookupTabIdInput}
                    onChange={(e) => setLookupTabIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">탭을 선택하세요</option>
                    {tabs.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.sidebarLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                    현재 탭의 기준 열 (예: 기준/견적)
                  </label>
                  <select
                    value={lookupMatchMyColIdInput}
                    onChange={(e) => setLookupMatchMyColIdInput(e.target.value)}
                    className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">기준 열 선택</option>
                    <option value="title">호선명(Title)</option>
                    {columns.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                    대상 탭의 비교할 열 (위 열과 값이 같은지 비교)
                  </label>
                  <select
                    value={lookupMatchTargetColIdInput}
                    onChange={(e) =>
                      setLookupMatchTargetColIdInput(e.target.value)
                    }
                    className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                    disabled={!lookupTabIdInput}
                  >
                    <option value="">비교 대상 열 선택</option>
                    <option value="title">호선명(Title)</option>
                    {lookupTabIdInput &&
                      tabDataMap?.[lookupTabIdInput]?.columns?.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                    대상 탭에서 가져올 열의 값 (결과값)
                  </label>
                  <select
                    value={lookupReturnTargetColIdInput}
                    onChange={(e) =>
                      setLookupReturnTargetColIdInput(e.target.value)
                    }
                    className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                    disabled={!lookupTabIdInput}
                  >
                    <option value="">가져올 열 선택</option>
                    <option value="title">호선명(Title)</option>
                    {lookupTabIdInput &&
                      tabDataMap?.[lookupTabIdInput]?.columns?.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
            {newColumnType === "inflation_pv" && (
              <div className="space-y-3">
                <p className="text-[10px] text-brand-outline-variant leading-relaxed">
                  금액을 물가상승률을 적용하여 현가화합니다. 참조 탭에서
                  견적일과 발주일을 가져와 개월 수 차이를 계산하고, 항목의 특정
                  단어별 상승률을 반영합니다.
                </p>
                <div>
                  <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                    대상 금액 열 (현재 탭)
                  </label>
                  <select
                    value={inflationAmountColIdInput}
                    onChange={(e) =>
                      setInflationAmountColIdInput(e.target.value)
                    }
                    className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="">열 선택</option>
                    {columns
                      .filter(
                        (c) =>
                          c.type === "number" ||
                          c.type === "currency_usd" ||
                          c.type === "formula" ||
                          c.type === "text" ||
                          c.type === "lookup",
                      )
                      .map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 bg-brand-surface-high border border-brand-outline-variant rounded-lg space-y-3">
                  <h4 className="text-xs font-semibold text-brand-on-surface">
                    참조 탭(Dates Tab) 설정 영역
                  </h4>
                  <p className="text-[10px] text-brand-on-surface-variant">
                    다른 탭에서 날짜(견적일, 발주일)를 가져오기 위한 설정입니다.
                    VLOOKUP처럼 두 탭을 연결할 매치 키를 지정하세요.
                  </p>
                  <div>
                    <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                      참조할 탭 선택
                    </label>
                    <select
                      value={inflationRefTabIdInput}
                      onChange={(e) =>
                        setInflationRefTabIdInput(e.target.value)
                      }
                      className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                    >
                      <option value="">탭 선택</option>
                      {tabs?.map((t: any) => (
                        <option value={t.id} key={t.id}>
                          {t.sidebarLabel || t.dashboardTitle || t.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] text-brand-on-surface-variant font-medium mb-1.5">
                        현재 탭 매치 키
                      </label>
                      <select
                        value={inflationMatchColIdInput}
                        onChange={(e) =>
                          setInflationMatchColIdInput(e.target.value)
                        }
                        className="w-full px-2 py-1.5 bg-brand-surface text-xs border border-brand-outline-variant rounded focus:ring-1 focus:ring-brand-primary focus:outline-none"
                      >
                        <option value="id">ID</option>
                        <option value="title">Title</option>
                        {columns.map((c) => (
                          <option value={c.id} key={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] text-brand-on-surface-variant font-medium mb-1.5">
                        참조 탭 매치 키
                      </label>
                      <select
                        value={inflationRefMatchColIdInput}
                        onChange={(e) =>
                          setInflationRefMatchColIdInput(e.target.value)
                        }
                        disabled={!inflationRefTabIdInput}
                        className="w-full px-2 py-1.5 bg-brand-surface text-xs border border-brand-outline-variant rounded focus:ring-1 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="id">ID</option>
                        <option value="title">Title</option>
                        {inflationRefTabIdInput &&
                          tabDataMap?.[inflationRefTabIdInput]?.columns?.map(
                            (c: any) => (
                              <option value={c.id} key={c.id}>
                                {c.label}
                              </option>
                            ),
                          )}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-brand-outline-variant/50">
                    <div className="flex-1">
                      <label className="block text-[11px] text-brand-on-surface-variant font-medium mb-1.5">
                        가져올 견적일(기준일)
                      </label>
                      <select
                        value={inflationBaseDateColIdInput}
                        onChange={(e) =>
                          setInflationBaseDateColIdInput(e.target.value)
                        }
                        disabled={!inflationRefTabIdInput}
                        className="w-full px-2 py-1.5 bg-brand-surface text-xs border border-brand-outline-variant rounded focus:ring-1 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="">선택</option>
                        <option value="dueDate">Due Date</option>
                        {inflationRefTabIdInput &&
                          tabDataMap?.[inflationRefTabIdInput]?.columns?.map(
                            (c: any) => (
                              <option value={c.id} key={c.id}>
                                {c.label}
                              </option>
                            ),
                          )}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] text-brand-on-surface-variant font-medium mb-1.5">
                        가져올 발주일(대상일)
                      </label>
                      <select
                        value={inflationTargetDateColIdInput}
                        onChange={(e) =>
                          setInflationTargetDateColIdInput(e.target.value)
                        }
                        disabled={!inflationRefTabIdInput}
                        className="w-full px-2 py-1.5 bg-brand-surface text-xs border border-brand-outline-variant rounded focus:ring-1 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
                      >
                        <option value="">선택</option>
                        <option value="dueDate">Due Date</option>
                        {inflationRefTabIdInput &&
                          tabDataMap?.[inflationRefTabIdInput]?.columns?.map(
                            (c: any) => (
                              <option value={c.id} key={c.id}>
                                {c.label}
                              </option>
                            ),
                          )}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs text-brand-on-surface-variant font-medium">
                      호선별 월간 물가상승률(%)
                    </label>
                    <button
                      onClick={() =>
                        setIsInflationRatesExpanded(!isInflationRatesExpanded)
                      }
                      className="text-[10px] text-brand-primary hover:underline px-1 py-0.5 rounded transition-colors"
                    >
                      {isInflationRatesExpanded ? "간략히 접기" : "전체 펼치기"}
                    </button>
                  </div>

                  {isInflationRatesExpanded ? (
                    <div className="border border-brand-outline-variant rounded-lg overflow-hidden bg-brand-surface text-xs">
                      <div className="grid grid-cols-[2fr_1.5fr_2fr_2fr_30px] gap-1 bg-brand-surface-high p-1.5 border-b border-brand-outline-variant font-semibold text-brand-on-surface text-[11px]">
                        <div className="px-1 truncate">기준호선(검색어)</div>
                        <div className="px-1 truncate text-center">
                          INF/년(%)
                        </div>
                        <div className="px-1 truncate">호선명</div>
                        <div className="px-1 truncate">비고</div>
                        <div></div>
                      </div>
                      <div
                        className="max-h-[200px] overflow-y-auto p-1 space-y-1"
                        onPaste={(e) => {
                          const pasteData = e.clipboardData.getData("text");
                          if (!pasteData) return;
                          const rows = pasteData
                            .split("\n")
                            .map((r) => r.trim())
                            .filter(Boolean);
                          const newRates = [];
                          for (const row of rows) {
                            const cols = row.split("\t");
                            if (cols.length >= 2) {
                              const word = cols[0] || "";
                              let rateStr = cols[1] || "0";
                              if (rateStr.includes("%"))
                                rateStr = rateStr.replace("%", "");
                              let rate = parseFloat(
                                rateStr.replace(/[^0-9.-]+/g, ""),
                              );
                              if (isNaN(rate)) rate = 0;
                              const baseShip = cols[2] || "";
                              const note = cols[3] || "";
                              newRates.push({ baseShip, rate, word, note });
                            }
                          }
                          if (newRates.length > 0) {
                            e.preventDefault();
                            setInflationRatesInput((prev) => [
                              ...prev,
                              ...newRates,
                            ]);
                          }
                        }}
                      >
                        {inflationRatesInput.length === 0 && (
                          <div className="text-center py-4 text-[10px] text-brand-outline-variant italic">
                            엑셀에서 복사(Ctrl+C) 후 여기에 붙여넣기(Ctrl+V)
                            하세요.
                          </div>
                        )}
                        {inflationRatesInput.map((rateObj, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[2fr_1.5fr_2fr_2fr_30px] gap-1 items-center"
                          >
                            <input
                              type="text"
                              placeholder="검색 단어"
                              value={rateObj.word}
                              onChange={(e) => {
                                const newRates = [...inflationRatesInput];
                                newRates[idx].word = e.target.value;
                                setInflationRatesInput(newRates);
                              }}
                              className="w-full px-1.5 py-1 bg-transparent border border-brand-outline-variant/50 rounded focus:ring-1 focus:ring-brand-primary focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="0.0"
                              value={rateObj.rate}
                              onChange={(e) => {
                                const newRates = [...inflationRatesInput];
                                newRates[idx].rate = Number(e.target.value);
                                setInflationRatesInput(newRates);
                              }}
                              className="w-full px-1.5 py-1 bg-transparent border border-brand-outline-variant/50 rounded focus:ring-1 focus:ring-brand-primary focus:outline-none text-center"
                            />
                            <input
                              type="text"
                              placeholder="호선명"
                              value={rateObj.baseShip || ""}
                              onChange={(e) => {
                                const newRates = [...inflationRatesInput];
                                newRates[idx].baseShip = e.target.value;
                                setInflationRatesInput(newRates);
                              }}
                              className="w-full px-1.5 py-1 bg-transparent border border-brand-outline-variant/50 rounded focus:ring-1 focus:ring-brand-primary focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="비고"
                              value={rateObj.note || ""}
                              onChange={(e) => {
                                const newRates = [...inflationRatesInput];
                                newRates[idx].note = e.target.value;
                                setInflationRatesInput(newRates);
                              }}
                              className="w-full px-1.5 py-1 bg-transparent border border-brand-outline-variant/50 rounded focus:ring-1 focus:ring-brand-primary focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                const newRates = [...inflationRatesInput];
                                newRates.splice(idx, 1);
                                setInflationRatesInput(newRates);
                              }}
                              className="text-red-500 hover:bg-red-500/10 rounded w-full h-full flex items-center justify-center transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="p-1.5 border-t border-brand-outline-variant bg-brand-surface-high">
                        <button
                          onClick={() =>
                            setInflationRatesInput([
                              ...inflationRatesInput,
                              { word: "", rate: 0, baseShip: "", note: "" },
                            ])
                          }
                          className="text-[11px] px-2 py-1 bg-brand-surface border border-brand-outline-variant rounded hover:bg-brand-surface-highest transition-colors cursor-pointer w-full"
                        >
                          + 항목 추가
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border border-brand-outline-variant rounded-lg bg-brand-surface text-[10px] text-brand-on-surface-variant flex justify-between items-center">
                      <span>
                        총 {inflationRatesInput.length}개의 호선별 물가상승률
                        설정됨
                      </span>
                      <button
                        onClick={() => setIsInflationRatesExpanded(true)}
                        className="px-2 py-1 bg-brand-surface-high border border-brand-outline-variant rounded hover:bg-brand-surface-highest transition-colors cursor-pointer"
                      >
                        펼치기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {newColumnType === "formula" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs text-brand-on-surface-variant font-medium">
                    수식 (Excel 스타일 지원)
                  </label>
                  <button
                    onClick={() => setShowFormulaHelp(true)}
                    className="text-xs text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    수식 도움말
                  </button>
                </div>
                <input
                  type="text"
                  value={formulaInput}
                  onChange={(e) => setFormulaInput(e.target.value)}
                  placeholder="예: SUM([단가], [수선비]) 또는 [상태] === '완료' ? '✅' : '🚨'"
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
                {(() => {
                  if (!formulaInput.trim()) return null;
                  try {
                    const testFn = getFormulaFn(formulaInput, columns);
                    const dummyReq = requirements[0] || {
                      id: "dummy",
                      title: "",
                      customColumns: {},
                    };
                    const boundSUMIFS = (...args: any[]) =>
                      SUMIFS(
                        tabDataMap,
                        tabs,
                        args[0],
                        args[1],
                        args[2],
                        args[3],
                      );
                    const today = new Date().toISOString().split("T")[0];
                    const GET_VAL = (id: string) =>
                      resolveColumnValue(
                        dummyReq,
                        id,
                        columns,
                        tabDataMap,
                        tabs,
                        exchangeRates,
                      );
                    testFn(
                      dummyReq,
                      today,
                      SUM,
                      AVERAGE,
                      IF,
                      DAYS,
                      MONTHS,
                      exchangeRates.KRW,
                      exchangeRates.USD,
                      exchangeRates.EUR,
                      boundSUMIFS,
                      GET_VAL,
                    );
                    return (
                      <p className="text-emerald-500 text-[10px] mt-1">
                        ✓ 수식이 유효합니다.
                      </p>
                    );
                  } catch (err: any) {
                    return (
                      <p className="text-red-500 text-[10px] mt-1 font-medium bg-red-500/10 p-1.5 rounded border border-red-500/20">
                        🚨 수식 오류: {err.message}
                      </p>
                    );
                  }
                })()}
                <p className="text-[10px] text-brand-outline-variant mt-1 leading-relaxed">
                  <strong>[컬럼명]</strong> 형식으로 값을 참조하고, 엑셀
                  함수(SUM, AVERAGE, IF 등)를 사용할 수 있습니다.
                </p>
              </div>
            )}
            {newColumnType === "button" && (
              <div>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  버튼 라벨
                </label>
                <input
                  type="text"
                  value={buttonLabelInput}
                  onChange={(e) => setButtonLabelInput(e.target.value)}
                  placeholder="예: 내가 맡기"
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none mb-2"
                />
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  동작
                </label>
                <select
                  value={buttonActionInput}
                  onChange={(e) => setButtonActionInput(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                >
                  <option value="start_work">담당 나로 변경 & 진행 중</option>
                  <option value="finish_work">상태 완료로 변경</option>
                </select>
              </div>
            )}
            {newColumnType === "currency_usd" && (
              <div>
                <p className="text-[10px] text-brand-outline-variant mt-1 mb-2">
                  외환 금액을 환율 정보를 통해 환산합니다. 기준이 되는 금액 열과
                  화폐 열을 선택하세요.
                </p>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  금액 대상 열 (Amount)
                </label>
                <select
                  value={currencyAmountColIdInput}
                  onChange={(e) => setCurrencyAmountColIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer mb-2"
                >
                  <option value="">-- 컬럼 선택 --</option>
                  {columns.map((c) => (
                    <option value={c.id}>{c.label}</option>
                  ))}
                </select>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  화폐 대상 열 (Currency)
                </label>
                <select
                  value={currencyCodeColIdInput}
                  onChange={(e) => setCurrencyCodeColIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                >
                  <option value="">-- 컬럼 선택 --</option>
                  {columns.map((c) => (
                    <option value={c.id}>{c.label}</option>
                  ))}
                </select>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5 mt-2">
                  수동 환율 설정 (기준: 원화 KRW)
                </label>
                <p className="text-[10px] text-brand-outline-variant mb-2">
                  환율을 직접 입력하여 사용할 수 있습니다.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-brand-outline-variant mb-1">
                      KRW
                    </label>
                    <input
                      type="number"
                      value={currencyExchangeRatesInput.KRW}
                      onChange={(e) =>
                        setCurrencyExchangeRatesInput({
                          ...currencyExchangeRatesInput,
                          KRW: Number(e.target.value),
                        })
                      }
                      className="w-full bg-brand-surface border border-brand-outline-variant rounded px-2 py-1 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-outline-variant mb-1">
                      USD (원/달러)
                    </label>
                    <input
                      type="number"
                      value={currencyExchangeRatesInput.USD}
                      onChange={(e) =>
                        setCurrencyExchangeRatesInput({
                          ...currencyExchangeRatesInput,
                          USD: Number(e.target.value),
                        })
                      }
                      className="w-full bg-brand-surface border border-brand-outline-variant rounded px-2 py-1 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-outline-variant mb-1">
                      EUR (원/유로)
                    </label>
                    <input
                      type="number"
                      value={currencyExchangeRatesInput.EUR}
                      onChange={(e) =>
                        setCurrencyExchangeRatesInput({
                          ...currencyExchangeRatesInput,
                          EUR: Number(e.target.value),
                        })
                      }
                      className="w-full bg-brand-surface border border-brand-outline-variant rounded px-2 py-1 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-outline-variant mb-1">
                      GBP (원/파운드)
                    </label>
                    <input
                      type="number"
                      value={currencyExchangeRatesInput.GBP}
                      onChange={(e) =>
                        setCurrencyExchangeRatesInput({
                          ...currencyExchangeRatesInput,
                          GBP: Number(e.target.value),
                        })
                      }
                      className="w-full bg-brand-surface border border-brand-outline-variant rounded px-2 py-1 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5 mt-3">
                  소수점 자리수
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currencyDecimalPlacesInput}
                  onChange={(e) =>
                    setCurrencyDecimalPlacesInput(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            )}
            {newColumnType === "select" && (
              <div>
                <p className="text-[10px] text-brand-outline-variant mt-1 mb-2">
                  선택 가능한 옵션들을 쉼표(,)로 구분하여 입력하세요.
                </p>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  옵션 항목 (예: FC, NFC, TBD)
                </label>
                <input
                  type="text"
                  value={newColumnOptionsInput}
                  onChange={(e) => setNewColumnOptionsInput(e.target.value)}
                  placeholder="FC, NFC, TBD"
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            )}
            {newColumnType === "status" && (
              <div>
                <p className="text-[10px] text-brand-outline-variant mt-1 mb-2">
                  할 일, 진행 중, 완료의 3단계 대분류 아래 세부 단계를 추가하여
                  관리합니다.
                </p>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  세부 단계 쉼표 구분 (예: 기획,디자인,개발,QA)
                </label>
                <input
                  type="text"
                  value={statusOptionsInput}
                  onChange={(e) => setStatusOptionsInput(e.target.value)}
                  placeholder="기획, 디자인, 개발, QA, 배포"
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            )}
            {newColumnType === "relation" && (
              <div>
                <p className="text-[10px] text-brand-outline-variant mt-1 mb-2">
                  다른 요구사항(ID)들을 연결하여 데이터를 참조합니다.
                </p>
              </div>
            )}
            {newColumnType === "rollup" && (
              <div className="space-y-2">
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  대상 관계형 컬럼 ID
                </label>
                <select
                  value={rollupRelIdInput}
                  onChange={(e) => setRollupRelIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                >
                  <option value="">선택</option>
                  {columns
                    .filter((c) => c.type === "relation")
                    .map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.label}
                      </option>
                    ))}
                </select>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  집계 연산
                </label>
                <select
                  value={rollupAggTypeInput}
                  onChange={(e) =>
                    setRollupAggTypeInput(
                      e.target.value as
                        "count" | "percent_done" | "sum" | "avg",
                    )
                  }
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
                >
                  <option value="count">개수 세기</option>
                  <option value="percent_done">완료 비율(%)</option>
                </select>
              </div>
            )}
            {["number", "formula", "rollup", "lookup"].includes(
              newColumnType,
            ) && (
              <div>
                <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                  표시할 소수점 자릿수 (숫자의 경우, 공란 시 기본값)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={decimalPlacesInput}
                  onChange={(e) => setDecimalPlacesInput(e.target.value)}
                  placeholder="예: 2"
                  className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowAddColumnModal(false);
                  setEditingColumnDefId(null);
                  setNewColumnName("");
                  setNewColumnType("text");
                  setNewColumnOptionsInput("");
                }}
                className="px-4 py-1.8 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface text-xs rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleAddOrEditCustomColumn}
                className="px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer"
              >
                {editingColumnDefId ? "저장" : "열 생성"}
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
      {columnToDelete && (
        <DraggableModal
          isOpen={!!columnToDelete}
          onClose={() => setColumnToDelete(null)}
          title={<span className="text-brand-error">열 삭제 경고</span>}
          icon={<AlertCircle className="w-5 h-5 text-brand-error" />}
        >
          <p className="text-xs text-brand-on-surface-variant mb-5 leading-relaxed">
            <strong className="text-brand-on-surface">
              '{columns.find((c) => c.id === columnToDelete)?.label}'
            </strong>{" "}
            열을 삭제하시겠습니까? 관련 데이터가 모두 영구적으로 소멸되며 복구할
            수 없습니다.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setColumnToDelete(null)}
              className="px-4 py-2 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface-high text-xs rounded-lg cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              onClick={executeDeleteColumn}
              className="px-4 py-2 bg-brand-error text-white text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer transition-opacity"
            >
              영구 삭제
            </button>
          </div>
        </DraggableModal>
      )}
      {showAssigneeManager && (
        <DraggableModal
          isOpen={showAssigneeManager}
          onClose={() => setShowAssigneeManager(false)}
          title="담당자 풀 관리"
          icon={<Users className="w-4.5 h-4.5 text-brand-primary" />}
          defaultPos={assigneeManagerPos}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAssigneeName}
                onChange={(e) => setNewAssigneeName(e.target.value)}
                placeholder="새 담당자 이름 입력"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newAssigneeName.trim()) {
                    const newId = `USR-${Date.now().toString().slice(-6)}`;
                    setAssigneesPool((prev) => [
                      ...prev,
                      {
                        id: newId,
                        name: newAssigneeName.trim(),
                        avatarUrl: "",
                      },
                    ]);
                    setNewAssigneeName("");
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-brand-surface-lowest text-xs border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none placeholder:text-brand-outline-variant"
              />
              <button
                onClick={() => {
                  if (newAssigneeName.trim()) {
                    const newId = `USR-${Date.now().toString().slice(-6)}`;
                    setAssigneesPool((prev) => [
                      ...prev,
                      {
                        id: newId,
                        name: newAssigneeName.trim(),
                        avatarUrl: "",
                      },
                    ]);
                    setNewAssigneeName("");
                  }
                }}
                className="px-3 py-1.5 bg-brand-primary text-brand-on-primary rounded-lg font-semibold text-xs hover:opacity-90 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 inline-block" /> 추가
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 border border-brand-outline-variant rounded-lg p-2 bg-brand-surface-low">
              {assigneesPool.length === 0 && (
                <p className="text-xs text-center p-3 text-brand-outline-variant">
                  등록된 담당자가 없습니다.
                </p>
              )}
              {assigneesPool.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 hover:bg-brand-surface hover:shadow-sm rounded transition-colors group border border-transparent hover:border-brand-outline-variant bg-brand-surface-lowest"
                >
                  {editingAssigneeId === a.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={editingAssigneeName}
                        onChange={(e) => setEditingAssigneeName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (editingAssigneeName.trim()) {
                              setAssigneesPool((prev) =>
                                prev.map((x) =>
                                  x.id === a.id
                                    ? { ...x, name: editingAssigneeName.trim() }
                                    : x,
                                ),
                              );
                              setRequirements((prev) =>
                                prev.map((req) => ({
                                  ...req,
                                  assignees: req.assignees.map((x) =>
                                    x.id === a.id
                                      ? {
                                          ...x,
                                          name: editingAssigneeName.trim(),
                                        }
                                      : x,
                                  ),
                                })),
                              );
                            }
                            setEditingAssigneeId(null);
                          } else if (e.key === "Escape") {
                            setEditingAssigneeId(null);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-brand-surface-lowest text-xs border border-brand-primary/50 rounded focus:ring-1 focus:ring-brand-primary outline-none"
                      />
                      <button
                        onClick={() => {
                          if (editingAssigneeName.trim()) {
                            setAssigneesPool((prev) =>
                              prev.map((x) =>
                                x.id === a.id
                                  ? { ...x, name: editingAssigneeName.trim() }
                                  : x,
                              ),
                            );
                            setRequirements((prev) =>
                              prev.map((req) => ({
                                ...req,
                                assignees: req.assignees.map((x) =>
                                  x.id === a.id
                                    ? { ...x, name: editingAssigneeName.trim() }
                                    : x,
                                ),
                              })),
                            );
                          }
                          setEditingAssigneeId(null);
                        }}
                        className="p-1 text-brand-primary bg-brand-primary/10 rounded cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-surface-highest flex items-center justify-center text-[10px] font-bold border border-brand-outline-variant text-brand-on-surface">
                          {a.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-brand-on-surface-variant">
                          {a.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingAssigneeId(a.id);
                            setEditingAssigneeName(a.name);
                          }}
                          className="text-brand-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-brand-surface-high rounded hover:bg-brand-surface-highest cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(`'${a.name}' 님을 풀에서 삭제하시겠습니까?
이 담당자가 배정된 모든 요구사항에서도 담당자가 일괄 삭제됩니다.`)
                            ) {
                              setAssigneesPool((prev) =>
                                prev.filter((x) => x.id !== a.id),
                              );
                              setRequirements((prev) =>
                                prev.map((req) => ({
                                  ...req,
                                  assignees: req.assignees.filter(
                                    (x) => x.id !== a.id,
                                  ),
                                })),
                              );
                            }
                          }}
                          className="text-brand-error opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-brand-error-container/20 rounded hover:bg-brand-error-container cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DraggableModal>
      )}
      {hoveredColumnId &&
        hoverTitleCoords &&
        createPortal(
          <div
            style={{
              top: hoverTitleCoords.y,
              left: hoverTitleCoords.x,
              position: "fixed",
            }}
            className="bg-brand-surface-high border border-brand-outline-variant shadow-lg text-xs text-brand-on-surface px-3 py-2 rounded-lg max-w-xs z-[9999] pointer-events-none whitespace-pre-wrap animate-fade-slide-up"
          >
            {columns.find((c) => c.id === hoveredColumnId)?.description}
          </div>,
          document.body,
        )}
      {showFilterColumnId &&
        filterPopupCoords &&
        createPortal(
          <div
            ref={filterPopupRef}
            style={{
              top: filterPopupCoords.top,
              left: filterPopupCoords.left,
              position: "fixed",
            }}
            className="mt-2 w-48 bg-brand-surface border border-brand-outline-variant rounded-lg shadow-xl p-2 z-[9999] animate-fade-slide-up"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              autoFocus={true}
              value={columnSearchTerms[showFilterColumnId] || ""}
              onChange={(e) =>
                setColumnSearchTerms((prev) => ({
                  ...prev,
                  [showFilterColumnId]: e.target.value,
                }))
              }
              placeholder={`${columns.find((c) => c.id === showFilterColumnId)?.label || ""} 필터...`}
              className="w-full bg-brand-surface-lowest border border-brand-outline-variant rounded p-1.5 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>,
          document.body,
        )}
      {showDescriptionEditColId && (
        <DraggableModal
          isOpen={true}
          onClose={() => setShowDescriptionEditColId(null)}
          title="컬럼 설명(메모) 수정"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-brand-on-surface-variant font-medium mb-1.5">
                설명 내용 지시 (마우스 오버 시 팝업에 표시됨)
              </label>
              <textarea
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="컬럼에 대한 보충 설명..."
                className="w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none h-24 resize-none"
                autoFocus={true}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowDescriptionEditColId(null)}
                className="px-4 py-1.8 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface text-xs rounded-lg cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setColumns((prev) =>
                    prev.map((c) =>
                      c.id === showDescriptionEditColId
                        ? {
                            ...c,
                            description: descriptionInput,
                          }
                        : c,
                    ),
                  );
                  setShowDescriptionEditColId(null);
                }}
                className="px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer"
              >
                저장
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
      {showFormulaHelp && (
        <DraggableModal
          isOpen={showFormulaHelp}
          onClose={() => setShowFormulaHelp(false)}
          title="수식(Formula) 작성 도움말"
        >
          <div className="space-y-4 text-sm text-brand-on-surface max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            <div>
              <h4 className="font-semibold text-brand-primary mb-1">
                1. 컬럼(열) 참조 방법
              </h4>
              <p className="text-xs text-brand-on-surface-variant">
                대괄호를 사용하여 현재 행(Row)의 다른 컬럼 값을 가져옵니다.
                <br />
                예를 들어, "수량"이라는 열이 있다면{" "}
                <code className="bg-brand-surface-highest px-1 rounded text-brand-primary">
                  [수량]
                </code>{" "}
                과 같이 작성합니다.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-primary mb-1">
                2. 사용 가능한 엑셀 함수
              </h4>
              <ul className="text-xs text-brand-on-surface-variant list-disc list-inside space-y-1">
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    SUM(값1, 값2, ...)
                  </code>{" "}
                  : 합계
                </li>
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    AVERAGE(값1, 값2, ...)
                  </code>{" "}
                  : 평균
                </li>
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    IF(조건, 참일때, 거짓일때)
                  </code>{" "}
                  : 조건문
                </li>
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    DAYS(종료일, 시작일)
                  </code>{" "}
                  : 날짜 차이 (일수 계산)
                </li>
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    MONTHS(종료일, 시작일)
                  </code>{" "}
                  : 날짜 차이 (개월수 계산)
                </li>
                <li>
                  <code className="bg-brand-surface-highest px-1 rounded font-mono">
                    SUMIFS('탭이름', '합산열', '조건열', '조건값')
                  </code>{" "}
                  : 교차 탭 조건부 합산
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-brand-primary mb-1">
                3. 환율 및 기본 속성
              </h4>
              <p className="text-xs text-brand-on-surface-variant mb-1">
                상단에서 입력한 환율을{" "}
                <code className="bg-brand-surface-highest px-1 rounded">
                  KRW
                </code>
                ,{" "}
                <code className="bg-brand-surface-highest px-1 rounded">
                  USD
                </code>
                ,{" "}
                <code className="bg-brand-surface-highest px-1 rounded">
                  EUR
                </code>{" "}
                변수로 즉시 곱하여 사용할 수 있습니다.
              </p>
              <p className="text-xs text-brand-on-surface-variant">
                <code className="bg-brand-surface-highest px-1 rounded">
                  req
                </code>{" "}
                데이터 객체나{" "}
                <code className="bg-brand-surface-highest px-1 rounded">
                  today
                </code>{" "}
                변수도 사용할 수 있습니다.
              </p>
            </div>
            <div className="pt-2 border-t border-brand-outline-variant">
              <h4 className="font-medium text-xs mb-2">실전 예시 모음</h4>
              <ul className="text-xs space-y-2 font-mono bg-brand-surface-lowest p-2 border border-brand-outline-variant rounded">
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 두 열의 합계 (SUM 함수)
                  </span>
                  <br />
                  SUM([개발 공수], [디자인 공수])
                </li>
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 환율 곱하기 (USD)
                  </span>
                  <br />
                  [단가] * USD
                </li>
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 간단한 사칙연산
                  </span>
                  <br />
                  [단가] * [수량] * 1.1
                </li>
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 조건식 표현 (IF 함수)
                  </span>
                  <br />
                  IF([우선순위] === '긴급', '🚨', '✅')
                </li>
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 기본 필드(status) 활용
                  </span>
                  <br />
                  req.status === 'DONE' ? 100 : 0
                </li>
                <li>
                  <span className="text-brand-on-surface-variant">
                    // 다른 탭의 데이터 합산 (교차 탭 기능)
                  </span>
                  <br />
                  SUMIFS('요구조건 분석', '금액(1)', '우선순위', '긴급')
                </li>
              </ul>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFormulaHelp(false)}
                className="px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
      {contextMenuColId &&
        createPortal(
          <div
            style={{
              top: contextMenuPos.y,
              left: contextMenuPos.x,
              position: "fixed",
            }}
            className="mt-1 w-48 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-2xl py-1.5 z-[9999] animate-fade-slide-up flex flex-col text-xs font-semibold text-brand-on-surface"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-2 border-b border-brand-outline-variant/60 flex flex-col gap-1.5 mb-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] text-brand-on-surface-variant font-medium">
                정렬 지정
              </span>
              <div className="flex gap-1.5">
                <button
                  className={`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors ${columns.find((c) => c.id === contextMenuColId)?.alignment === "left" || !columns.find((c) => c.id === contextMenuColId)?.alignment ? "bg-brand-primary text-brand-on-primary border-brand-primary" : "border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface"}`}
                  onClick={() => {
                    setColumns((prev) =>
                      prev.map((c) =>
                        c.id === contextMenuColId
                          ? { ...c, alignment: "left" }
                          : c,
                      ),
                    );
                    setContextMenuColId(null);
                  }}
                >
                  왼쪽
                </button>
                <button
                  className={`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors ${columns.find((c) => c.id === contextMenuColId)?.alignment === "center" ? "bg-brand-primary text-brand-on-primary border-brand-primary" : "border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface"}`}
                  onClick={() => {
                    setColumns((prev) =>
                      prev.map((c) =>
                        c.id === contextMenuColId
                          ? { ...c, alignment: "center" }
                          : c,
                      ),
                    );
                    setContextMenuColId(null);
                  }}
                >
                  가운데
                </button>
                <button
                  className={`flex-1 px-1.5 py-1 box-border rounded border text-[10px] transition-colors ${columns.find((c) => c.id === contextMenuColId)?.alignment === "right" ? "bg-brand-primary text-brand-on-primary border-brand-primary" : "border-brand-outline-variant text-brand-on-surface hover:bg-brand-surface"}`}
                  onClick={() => {
                    setColumns((prev) =>
                      prev.map((c) =>
                        c.id === contextMenuColId
                          ? { ...c, alignment: "right" }
                          : c,
                      ),
                    );
                    setContextMenuColId(null);
                  }}
                >
                  오른쪽
                </button>
              </div>
            </div>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                setMinimizedColumns((p) => ({
                  ...p,
                  [contextMenuColId]: !p[contextMenuColId],
                }));
                setContextMenuColId(null);
              }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-outline-variant rotate-90" />
              {minimizedColumns[contextMenuColId] ? "열 펼치기" : "열 숨기기"}
            </button>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                if (frozenColumnId === contextMenuColId) {
                  setFrozenColumnId(null);
                } else {
                  setFrozenColumnId(contextMenuColId);
                }
                setContextMenuColId(null);
              }}
            >
              <Maximize2 className="w-3.5 h-3.5 text-brand-outline-variant" />
              {frozenColumnId === contextMenuColId
                ? "고정 해제"
                : "여기까지 틀 고정"}
            </button>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                handleSort(contextMenuColId as any);
                setContextMenuColId(null);
              }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-outline-variant" />
              정렬
            </button>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                setShowFilterColumnId(contextMenuColId);
                setFilterPopupCoords({
                  top: contextMenuPos.y + 10,
                  left: contextMenuPos.x + 10,
                });
                setContextMenuColId(null);
              }}
            >
              <Filter className="w-3.5 h-3.5 text-brand-outline-variant" />
              필터
            </button>

            {selectedColumnIds.length > 1 &&
              selectedColumnIds.includes(contextMenuColId) && (
                <button
                  className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
                  onClick={() => {
                    const grp = prompt(
                      "병합할 상위 컬럼명(LV.1)을 입력하세요:",
                    );
                    if (grp !== null && grp.trim() !== "") {
                      setColumns((prev) =>
                        prev.map((c) =>
                          selectedColumnIds.includes(c.id)
                            ? { ...c, groupName: grp.trim() }
                            : c,
                        ),
                      );
                      setSelectedColumnIds([]);
                      setContextMenuColId(null);
                    }
                  }}
                >
                  <Grid className="w-3.5 h-3.5 text-brand-primary" />
                  상위 컬럼으로 병합 (LV.1)
                </button>
              )}

            {columns.find((c) => c.id === contextMenuColId)?.groupName && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
                onClick={() => {
                  setColumns((prev) =>
                    prev.map((c) =>
                      c.id === contextMenuColId
                        ? { ...c, groupName: undefined }
                        : c,
                    ),
                  );
                  setContextMenuColId(null);
                }}
              >
                <Grid className="w-3.5 h-3.5 text-brand-outline-variant" />
                병합 해제
              </button>
            )}

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                setShowDescriptionEditColId(contextMenuColId);
                setDescriptionInput(
                  columns.find((c) => c.id === contextMenuColId)?.description ||
                    "",
                );
                setContextMenuColId(null);
              }}
            >
              <HelpCircle className="w-3.5 h-3.5 text-brand-outline-variant" />
              열 설명(메모) 수정
            </button>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                setColumns((prev) =>
                  prev.map((c) =>
                    c.id === contextMenuColId
                      ? { ...c, truncateText: !c.truncateText }
                      : c,
                  ),
                );
                setContextMenuColId(null);
              }}
            >
              <AlignLeft className="w-3.5 h-3.5 text-brand-outline-variant" />
              {columns.find((c) => c.id === contextMenuColId)?.truncateText
                ? "내용 펼치기"
                : "내용 감추기 (2줄 고정)"}
            </button>

            <div className="px-4 py-2 hover:bg-brand-surface flex flex-col gap-1 transition-colors">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-on-surface-variant">
                <Palette className="w-3.5 h-3.5" />열 색상
              </div>
              <div className="flex gap-1.5 mt-1">
                {[
                  "transparent",
                  "#1e293b",
                  "#1e1b4b",
                  "#064e3b",
                  "#4c0519",
                  "#3b0764",
                  "#422006",
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-4 h-4 rounded-full border ${color === "transparent" ? "border-brand-outline-variant bg-transparent" : "border-transparent"} ${columns.find((c) => c.id === contextMenuColId)?.backgroundColor === color ? "ring-1 ring-offset-1 ring-brand-primary" : ""}`}
                    style={{
                      backgroundColor: color === "transparent" ? "" : color,
                    }}
                    onClick={() => {
                      setColumns((prev) =>
                        prev.map((c) =>
                          c.id === contextMenuColId
                            ? {
                                ...c,
                                backgroundColor:
                                  color === "transparent" ? undefined : color,
                              }
                            : c,
                        ),
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                const val = prompt(
                  `'${columns.find((c) => c.id === contextMenuColId)?.label}' 열에 일괄 입력할 값을 입력하세요:`,
                );
                if (val !== null) {
                  setRequirements((prev) =>
                    prev.map((req) => {
                      const colId = contextMenuColId;
                      if (!colId) return req;
                      if (
                        [
                          "id",
                          "title",
                          "priority",
                          "dueDate",
                          "status",
                        ].includes(colId)
                      ) {
                        return { ...req, [colId]: val };
                      }
                      return {
                        ...req,
                        customColumns: {
                          ...(req.customColumns || {}),
                          [colId]: val,
                        },
                      };
                    }),
                  );
                }
                setContextMenuColId(null);
              }}
            >
              <Edit2 className="w-3.5 h-3.5 text-brand-outline-variant" />
              데이터 일괄 입력
            </button>

            {contextMenuColId === "status" && (
              <div className="px-4 py-2 hover:bg-brand-surface flex flex-col gap-1 transition-colors group relative cursor-pointer text-brand-primary">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  상태 일괄 적용
                </div>
                <div className="absolute left-full top-0 ml-1 hidden group-hover:flex flex-col bg-brand-surface border border-brand-outline-variant rounded-lg shadow-xl w-32 z-50">
                  <button
                    className="px-3 py-2 text-left hover:bg-brand-surface-high text-brand-on-surface text-xs font-medium"
                    onClick={() => {
                      setRequirements((prev) =>
                        prev.map((req) => ({ ...req, status: "TODO" })),
                      );
                      setContextMenuColId(null);
                    }}
                  >
                    대기중
                  </button>
                  <button
                    className="px-3 py-2 text-left hover:bg-brand-surface-high text-brand-on-surface text-xs font-medium"
                    onClick={() => {
                      setRequirements((prev) =>
                        prev.map((req) => ({ ...req, status: "IN_PROGRESS" })),
                      );
                      setContextMenuColId(null);
                    }}
                  >
                    검토중
                  </button>
                  <button
                    className="px-3 py-2 text-left hover:bg-brand-surface-high text-brand-on-surface text-xs font-medium"
                    onClick={() => {
                      setRequirements((prev) =>
                        prev.map((req) => ({ ...req, status: "DONE" })),
                      );
                      setContextMenuColId(null);
                    }}
                  >
                    검토완료
                  </button>
                </div>
              </div>
            )}

            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors text-brand-primary"
              onClick={() => {
                const col = columns.find((c) => c.id === contextMenuColId);
                if (col) {
                  setEditingColumnDefId(col.id);
                  setNewColumnName(col.label);
                  setNewColumnType(col.type || "text");
                  setNewColumnOptionsInput(col.options?.join(", ") || "");
                  setFormulaInput(col.formula || "");
                  setButtonLabelInput(col.buttonLabel || "");
                  setButtonActionInput(col.buttonAction || "start_work");
                  setCurrencyAmountColIdInput(col.currencyAmountColId || "");
                  setCurrencyCodeColIdInput(col.currencyCodeColId || "");
                  setCurrencyExchangeRatesInput(
                    (col.currencyExchangeRates as any) || {
                      KRW: 1,
                      USD: 1400,
                      EUR: 1500,
                      GBP: 1750,
                    },
                  );
                  setCurrencyDecimalPlacesInput(col.currencyDecimalPlaces || 0);
                  setRollupRelIdInput(col.rollupRelId || "");
                  setRollupAggTypeInput(col.rollupAggType || "count");
                  setStatusOptionsInput(
                    col.type === "status"
                      ? col.options?.join(", ") || ""
                      : "아이디어,기획,디자인,개발,QA,배포",
                  );
                  setLookupTabIdInput(col.lookupTabId || "");
                  setLookupMatchMyColIdInput(col.lookupMatchMyColId || "");
                  setLookupMatchTargetColIdInput(
                    col.lookupMatchTargetColId || "",
                  );
                  setLookupReturnTargetColIdInput(
                    col.lookupReturnTargetColId || "",
                  );
                  setInflationAmountColIdInput(col.inflationAmountColId || "");
                  setInflationTitleColIdInput(
                    col.inflationTitleColId || "title",
                  );
                  setInflationRefTabIdInput(col.inflationRefTabId || "");
                  setInflationMatchColIdInput(col.inflationMatchColId || "id");
                  setInflationRefMatchColIdInput(
                    col.inflationRefMatchColId || "id",
                  );
                  setInflationBaseDateColIdInput(
                    col.inflationBaseDateColId || "",
                  );
                  setInflationTargetDateColIdInput(
                    col.inflationTargetDateColId || "",
                  );
                  setInflationRatesInput(col.inflationRates || []);
                  setDecimalPlacesInput(
                    col.decimalPlaces !== undefined
                      ? String(col.decimalPlaces)
                      : "",
                  );
                }
                setShowAddColumnModal(true);
                setContextMenuColId(null);
              }}
            >
              <Layers className="w-3.5 h-3.5" />열 속성 변경
            </button>
            <div className="h-px bg-brand-outline-variant my-1 mx-2" />
            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-error-container text-brand-error flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                handleDeleteCustomColumn(contextMenuColId);
                setContextMenuColId(null);
              }}
            >
              <X className="w-3.5 h-3.5" />열 삭제
            </button>
          </div>,
          document.body,
        )}

      {superContextMenuGroup &&
        createPortal(
          <div
            style={{
              top: contextMenuPos.y,
              left: contextMenuPos.x,
              position: "fixed",
            }}
            className="mt-1 w-48 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-2xl py-1.5 z-[9999] animate-fade-slide-up flex flex-col text-xs font-semibold text-brand-on-surface"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors"
              onClick={() => {
                setColumns((prev) =>
                  prev.map((c) =>
                    c.groupName === superContextMenuGroup
                      ? { ...c, groupName: undefined }
                      : c,
                  ),
                );
                setSuperContextMenuGroup(null);
              }}
            >
              <Grid className="w-3.5 h-3.5 text-brand-outline-variant" />
              배열/그룹 전체 병합 해제
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

const formulaCache = new Map();

const SUM = (...args: any[]) => args.reduce((a, b) => a + (Number(b) || 0), 0);
const AVERAGE = (...args: any[]) =>
  args.length ? SUM(...args) / args.length : 0;
const IF = (condition: boolean, trueVal: any, falseVal: any) =>
  condition ? trueVal : falseVal;
const DAYS = (d1: any, d2: any) => {
  if (!d1 || !d2) return "";
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return "";
  return Math.round(
    (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24),
  );
};
const MONTHS = (d1: any, d2: any) => {
  if (!d1 || !d2) return "";
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return "";
  const diffMonths =
    (date1.getFullYear() - date2.getFullYear()) * 12 +
    (date1.getMonth() - date2.getMonth());
  return diffMonths;
};

const SUMIFS = (
  tabDataMap: Record<string, any>,
  tabs: any[],
  targetTab: string,
  sumCol: string,
  critCol: string,
  critVal: any,
) => {
  if (!tabDataMap || !tabs) return 0;
  const tab = tabs.find(
    (t: any) =>
      t.sidebarLabel === targetTab ||
      t.id === targetTab ||
      t.dashboardTitle === targetTab,
  );
  if (!tab) return 0;
  const data = tabDataMap[tab.id];
  if (!data || !data.requirements || !data.columns) return 0;
  const sCol = data.columns.find(
    (c: any) => c.label === sumCol || c.id === sumCol,
  );
  const cCol = data.columns.find(
    (c: any) => c.label === critCol || c.id === critCol,
  );
  if (!sCol || !cCol) return 0;
  let sum = 0;
  data.requirements.forEach((r: any) => {
    let sVal = ["title", "dueDate", "createdAt", "status", "priority"].includes(
      sCol.id,
    )
      ? (r as any)[sCol.id]
      : r.customColumns?.[sCol.id];
    let cVal = ["title", "dueDate", "createdAt", "status", "priority"].includes(
      cCol.id,
    )
      ? (r as any)[cCol.id]
      : r.customColumns?.[cCol.id];
    if (String(cVal).trim() === String(critVal).trim()) {
      sum += Number(sVal) || 0;
    }
  });
  return sum;
};

export const resolveColumnValue = (
  req: any,
  colId: string,
  columns: any[],
  tabDataMap: Record<string, any>,
  tabs: any[],
  exchangeRates: any,
  callStack = new Set<string>(),
): any => {
  if (!req || !colId || callStack.has(colId)) return "";
  callStack.add(colId);
  try {
    const col = columns.find((c) => c.id === colId);
    if (!col) return "";

    if (["id", "title", "dueDate", "createdAt", "priority"].includes(col.id)) {
      return req[col.id] || "";
    }
    if (col.id === "status") {
      const s = (req.status as string) || "TODO";
      return s === "TODO" || s === "대기중"
        ? "TODO"
        : s === "IN_PROGRESS" || s === "검토중"
          ? "IN_PROGRESS"
          : s === "DONE" || s === "검토완료"
            ? "DONE"
            : "TODO";
    }
    if (col.id === "assignees") {
      return (req.assignees || []).map((a: any) => a.name).join(", ");
    }

    if (col.type === "formula") {
      const today = new Date().toISOString().split("T")[0];
      const func = getFormulaFn(col.formula || '""', columns);
      const boundSUMIFS = (...args: any[]) =>
        SUMIFS(tabDataMap, tabs, args[0], args[1], args[2], args[3]);
      const GET_VAL = (id: string) =>
        resolveColumnValue(
          req,
          id,
          columns,
          tabDataMap,
          tabs,
          exchangeRates,
          new Set(callStack),
        );
      return func(
        req,
        today,
        SUM,
        AVERAGE,
        IF,
        DAYS,
        MONTHS,
        exchangeRates.KRW,
        exchangeRates.USD,
        exchangeRates.EUR,
        boundSUMIFS,
        GET_VAL,
      );
    }

    if (col.type === "inflation_pv") {
      const amountRaw =
        col.inflationAmountColId === "title"
          ? req.title
          : resolveColumnValue(
              req,
              col.inflationAmountColId,
              columns,
              tabDataMap,
              tabs,
              exchangeRates,
              new Set(callStack),
            );
      const amountStr = String(amountRaw || "0").replace(/[^0-9.-]+/g, "");
      const amount = Number(amountStr) || 0;

      let baseDateStr = "";
      let targetDateStr = "";
      let myVal = "";

      if (col.inflationMatchColId) {
        myVal =
          col.inflationMatchColId === "id"
            ? req.id
            : col.inflationMatchColId === "title"
              ? req.title
              : String(
                  resolveColumnValue(
                    req,
                    col.inflationMatchColId,
                    columns,
                    tabDataMap,
                    tabs,
                    exchangeRates,
                    new Set(callStack),
                  ) || "",
                );
      }

      const targetTab = tabDataMap?.[col.inflationRefTabId || ""];
      if (targetTab && col.inflationRefMatchColId && myVal) {
        const matchedReq = targetTab?.requirements?.find((r: any) => {
          const tVal =
            col.inflationRefMatchColId === "id"
              ? r.id
              : col.inflationRefMatchColId === "title"
                ? r.title
                : String(r.customColumns?.[col.inflationRefMatchColId!] || "");
          return tVal === myVal;
        });
        if (matchedReq) {
          baseDateStr =
            col.inflationBaseDateColId === "dueDate"
              ? matchedReq.dueDate
              : matchedReq.customColumns?.[col.inflationBaseDateColId!] || "";
          targetDateStr =
            col.inflationTargetDateColId === "dueDate"
              ? matchedReq.dueDate
              : matchedReq.customColumns?.[col.inflationTargetDateColId!] || "";
        }
      }

      let matchedRate = 0;
      if (col.inflationRates && myVal) {
        for (const rateObj of col.inflationRates) {
          if (rateObj.word && myVal.includes(rateObj.word)) {
            matchedRate = rateObj.rate;
            break;
          }
        }
      }

      if (matchedRate && baseDateStr && targetDateStr) {
        const date1 = new Date(targetDateStr);
        const date2 = new Date(baseDateStr);
        let diffMonths = 0;
        if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
          const msPerDay = 1000 * 60 * 60 * 24;
          const diffDays = (date1.getTime() - date2.getTime()) / msPerDay;
          diffMonths = diffDays / (365 / 12);
        }
        const annualMultiplier =
          matchedRate < 2 ? matchedRate : 1 + matchedRate / 100;
        return amount * Math.pow(annualMultiplier, diffMonths / 12);
      }
      return amount;
    }

    if (col.type === "currency_usd") {
      const amountCol = col.currencyAmountColId
        ? columns.find((c) => c.id === col.currencyAmountColId)
        : columns.find((c) => c.label.includes("금액"));
      const currencyCol = col.currencyCodeColId
        ? columns.find((c) => c.id === col.currencyCodeColId)
        : columns.find((c) => c.label.includes("화폐"));
      if (amountCol && currencyCol) {
        const rawAmountStr = String(
          resolveColumnValue(
            req,
            amountCol.id,
            columns,
            tabDataMap,
            tabs,
            exchangeRates,
            new Set(callStack),
          ),
        ).replace(/[^0-9.-]+/g, "");
        const amount = Number(rawAmountStr) || 0;
        const curr = String(
          resolveColumnValue(
            req,
            currencyCol.id,
            columns,
            tabDataMap,
            tabs,
            exchangeRates,
            new Set(callStack),
          ),
        ).toUpperCase();

        const rates = col.currencyExchangeRates || {
          KRW: 1,
          USD: 1400,
          EUR: 1500,
          GBP: 1750,
        };
        let krwValue = amount;
        if (curr.includes("WON") || curr.includes("KRW")) {
          krwValue = amount;
        } else if (curr.includes("GBP")) {
          krwValue = amount * (rates.GBP || 1750);
        } else if (curr.includes("EUR")) {
          krwValue = amount * rates.EUR;
        } else if (curr.includes("US") || curr.includes("USD")) {
          krwValue = amount * rates.USD;
        }

        const targetRate = rates.USD;

        const usdValue = krwValue / targetRate;
        return usdValue;
      }
      return "";
    }

    if (col.type === "rollup") {
      const targetTab = tabDataMap?.[col.rollupTargetTabId || ""];
      const rReqs = targetTab?.requirements || [];
      if (
        !col.rollupMatchMyColId ||
        !col.rollupMatchTargetColId ||
        !col.rollupTargetValueColId ||
        !col.rollupAggType
      )
        return "";
      const myVal = resolveColumnValue(
        req,
        col.rollupMatchMyColId,
        columns,
        tabDataMap,
        tabs,
        exchangeRates,
        new Set(callStack),
      );
      const matchedReqs = rReqs.filter((r: any) => {
        const tVal =
          col.rollupMatchTargetColId === "id"
            ? r.id
            : col.rollupMatchTargetColId === "title"
              ? r.title
              : r.customColumns?.[col.rollupMatchTargetColId!];
        return tVal === myVal;
      });
      const vals = matchedReqs.map((r: any) =>
        col.rollupTargetValueColId === "id"
          ? r.id
          : col.rollupTargetValueColId === "title"
            ? r.title
            : r.customColumns?.[col.rollupTargetValueColId!],
      );
      const numVals = vals
        .map((v: any) => Number(String(v).replace(/[^0-9.-]+/g, "")))
        .filter((n: any) => !isNaN(n));

      if (col.rollupAggType === "sum")
        return numVals.reduce((a: any, b: any) => a + b, 0);
      if (col.rollupAggType === "avg")
        return numVals.length
          ? numVals.reduce((a: any, b: any) => a + b, 0) / numVals.length
          : 0;
      if (col.rollupAggType === "max")
        return numVals.length ? Math.max(...numVals) : 0;
      if (col.rollupAggType === "min")
        return numVals.length ? Math.min(...numVals) : 0;
      if (col.rollupAggType === "count") return vals.length;
      if (col.rollupAggType === "join") return vals.join(", ");
      return "";
    }

    if (col.type === "lookup") {
      const targetTab = tabDataMap?.[col.lookupTabId || ""];
      const lReqs = targetTab?.requirements || [];
      if (
        !col.lookupMatchMyColId ||
        !col.lookupMatchTargetColId ||
        !col.lookupReturnTargetColId
      )
        return "";
      const myVal = resolveColumnValue(
        req,
        col.lookupMatchMyColId,
        columns,
        tabDataMap,
        tabs,
        exchangeRates,
        new Set(callStack),
      );
      const matchedReq = lReqs.find((r: any) => {
        const tVal =
          col.lookupMatchTargetColId === "id"
            ? r.id
            : col.lookupMatchTargetColId === "title"
              ? r.title
              : r.customColumns?.[col.lookupMatchTargetColId!];
        return tVal === myVal;
      });
      if (matchedReq) {
        return col.lookupReturnTargetColId === "id"
          ? matchedReq.id
          : col.lookupReturnTargetColId === "title"
            ? matchedReq.title
            : matchedReq.customColumns?.[col.lookupReturnTargetColId!];
      }
      return "";
    }

    return req.customColumns?.[col.id] || "";
  } finally {
    callStack.delete(colId);
  }
};

const getFormulaFn = (f: string, columns: any[]) => {
  // Use column labels in cache key to ensure it rebuilds if a column is renamed
  const cacheKey = f + "|" + columns.map((c) => `${c.id}:${c.label}`).join(",");
  if (!formulaCache.has(cacheKey)) {
    try {
      const labelToIdMap = new Map<string, string>();
      columns.forEach((c) => {
        if (c.label) {
          labelToIdMap.set(c.label.replace(/\s+/g, ""), c.id);
        }
      });
      // Add generic aliases
      const aliases = {
        제목: "title",
        title: "title",
        요구사항명칭: "title",
        "req.description": "title",
        마감일: "dueDate",
        duedate: "dueDate",
        기한: "dueDate",
        상태: "status",
        status: "status",
        우선순위: "priority",
        priority: "priority",
        담당자: "assignees",
        assignees: "assignees",
      };
      for (const [alias, id] of Object.entries(aliases)) {
        labelToIdMap.set(alias.replace(/\s+/g, "").toLowerCase(), id);
      }

      let parsed = f.replace(/\[([\s\S]+?)\]/g, (match, p1) => {
        const normLabel = p1.replace(/\s+/g, "");
        const normLabelLower = normLabel.toLowerCase();
        const matchedId =
          labelToIdMap.get(normLabel) || labelToIdMap.get(normLabelLower);
        if (matchedId) {
          if (
            ["title", "dueDate", "createdAt", "status", "priority"].includes(
              matchedId,
            )
          ) {
            return `(req.${matchedId} || '')`;
          } else if (matchedId === "assignees") {
            return `(req.assignees ? req.assignees.map(a=>a.name).join(', ') : '')`;
          } else {
            return `(isNaN(Number(GET_VAL('${matchedId}'))) ? (GET_VAL('${matchedId}') || '') : Number(GET_VAL('${matchedId}')))`;
          }
        }
        return match; // Keep as is if no match found (might cause a JS syntax error, but prevents empty replacement)
      });

      formulaCache.set(
        cacheKey,
        new Function(
          "req",
          "today",
          "SUM",
          "AVERAGE",
          "IF",
          "DAYS",
          "MONTHS",
          "KRW",
          "USD",
          "EUR",
          "SUMIFS",
          "GET_VAL",
          `try { return ${parsed || '""'}; } catch(e) { console.error("Formula Eval Error in getFormulaFn:", e, "Original:", \`${f.replace(/`/g, "\\`")}\`, "Parsed:", \`${parsed.replace(/`/g, "\\`")}\`); throw e; }`,
        ),
      );
    } catch (err: any) {
      console.error("Formula Parsing Error:", err, f);
      formulaCache.set(cacheKey, () => {
        throw err;
      });
    }
  }
  return formulaCache.get(cacheKey);
};

const SpreadsheetRow = React.memo(
  React.forwardRef(function SpreadsheetRow(
    {
      req,
      isSelected,
      isSingleLineView,
      dragOverRowId,
      columns,
      minimizedColumns,
      columnWidths,
      isActive,
      activeField,
      isLockedByOther,
      lockedByName,
      isPriorityOpen,
      isAssigneeOpen,
      isStatusOpen,
      currentUser,
      assigneesPool,
      reqById,
      exchangeRates,
      activeCellEditor,
      tabDataMap,
      tabs,

      handleRowDragOver,
      handleRowDrop,
      handleDuplicateRow,
      handleRowDragStart,
      handleSelectRow,
      setMinimizedColumns,
      setActiveCellEditor,
      updateRequirementField,
      handleGridPaste,
      setShowPriorityDropdownId,
      setPriorityDropdownPos,
      priorityDropdownPos,
      priorityRef,
      setShowAssigneeDropdownId,
      setAssigneeDropdownPos,
      assigneeDropdownPos,
      originalSetRequirements,
      assigneeRef,
      setShowStatusDropdownId,
      setStatusDropdownPos,
      statusDropdownPos,
      statusRef,
      showSelectDropdown,
      setShowSelectDropdown,
      setSelectDropdownPos,
      selectDropdownPos,
      selectDropdownRef,
      setRequirements,
      setColumns,
      setSelectedIds,
      getCellStickyStyle,
      dataIndex,
    }: any,
    ref: any,
  ) {
    const normalizedStatusForDone =
      (req.status as string) === "TODO" ||
      (req.status as string) === "대기중" ||
      !req.status
        ? "TODO"
        : (req.status as string) === "IN_PROGRESS" ||
            (req.status as string) === "검토중"
          ? "IN_PROGRESS"
          : (req.status as string) === "DONE" ||
              (req.status as string) === "검토완료"
            ? "DONE"
            : "TODO";
    const isDone = normalizedStatusForDone === "DONE";

    let rowTextColorClass = "text-brand-on-surface";
    let rowBgDoneClass = "";
    if (isDone) {
      rowTextColorClass = "text-brand-on-surface-variant/50";
      rowBgDoneClass = "done-row";
    } else if (normalizedStatusForDone === "IN_PROGRESS")
      rowTextColorClass = "text-green-700 font-medium";

    return (
      <tr
        ref={ref}
        data-index={dataIndex}
        key={req.id}
        id={`req-row-${req.id}`}
        onDragOver={(e) => handleRowDragOver(e, req.id)}
        onDrop={(e) => handleRowDrop(e, req.id)}
        className={`spreadsheet-row border-b border-brand-outline-variant transition-colors duration-150 group ${rowTextColorClass} ${rowBgDoneClass} ${
          isSelected ? "bg-brand-primary-container/10" : ""
        } ${dragOverRowId === req.id ? "border-t-2 border-t-brand-primary bg-brand-surface-high/30" : ""}`}
      >
        {/* Grip/Copy Actions (On Hover) */}
        <td
          style={getCellStickyStyle("index")}
          className={`${isSingleLineView ? "px-2 py-0.5" : "p-2"} border-r border-brand-outline-variant text-center w-10 text-brand-on-surface-variant/40 align-middle`}
        >
          <div
            className={`flex ${isSingleLineView ? "flex-row" : "flex-col"} flex-wrap justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateRow(req.id, req.id);
              }}
              className="hover:text-brand-primary cursor-pointer transition-colors"
              title="템플릿 복제"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <div
              draggable
              onDragStart={(e) => handleRowDragStart(e, req.id)}
              className="cursor-grab active:cursor-grabbing hover:text-brand-primary transition-colors flex items-center justify-center p-0.5"
              title="드래그하여 행 이동 (Alt 키를 누르고 드래그 시 복제)"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        </td>

        {/* Checkbox cell */}
        <td
          style={getCellStickyStyle("checkbox")}
          className={`${isSingleLineView ? "px-2 py-1" : "p-3"} border-r border-brand-outline-variant text-center select-none align-middle`}
        >
          <div
            className="w-4 h-4 mx-auto inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors"
            onClick={() => handleSelectRow(req.id, !isSelected)}
          >
            {isSelected && (
              <Check
                className="w-3 h-3 text-brand-on-surface"
                strokeWidth={4}
              />
            )}
          </div>
        </td>

        {/* Render Columns cell based on col.id */}
        {columns.map((col) => {
          const isMinimized = minimizedColumns[col.id];
          const width = isMinimized ? 24 : columnWidths[col.id] || 150;
          const baseStickyStyle = getCellStickyStyle(col.id);
          const textAlignStyle = col.alignment
            ? { textAlign: col.alignment }
            : {};
          const bgStyle = col.backgroundColor
            ? {
                backgroundImage: `linear-gradient(to bottom right, ${col.backgroundColor}40, transparent)`,
              }
            : {};
          const cellStyle: React.CSSProperties = {
            width,
            minWidth: width,
            maxWidth: width,
            ...baseStickyStyle,
            ...textAlignStyle,
            ...bgStyle,
          };
          const shadowClass = "";
          const truncateClass = isSingleLineView
            ? "whitespace-nowrap overflow-hidden text-ellipsis"
            : col.truncateText
              ? "line-clamp-2 overflow-hidden overflow-ellipsis break-words whitespace-normal"
              : "whitespace-pre-wrap break-words";

          if (isMinimized) {
            return (
              <td
                key={col.id}
                style={cellStyle}
                className={`px-0 py-2 border-r border-brand-outline-variant align-middle text-center hover:bg-brand-surface-high/20 transition-colors cursor-pointer ${shadowClass}`}
                onClick={() =>
                  setMinimizedColumns((p) => ({ ...p, [col.id]: false }))
                }
                title="열 펼치기 (클릭)"
              >
                <span className="text-brand-outline-variant select-none tracking-widest text-[10px] font-bold mx-auto flex justify-center w-full">
                  ...
                </span>
              </td>
            );
          }

          // 1. ID Column
          if (col.id === "id") {
            const isEditing = isActive && activeField === "id";

            return (
              <td
                key={col.id}
                style={cellStyle}
                onClick={() => {
                  if (isLockedByOther) {
                    alert(
                      `현재 ${lockedByName} 님이 편집 중이므로 접근할 수 없습니다.`,
                    );
                    return;
                  }
                  setActiveCellEditor({ rowId: req.id, field: "id" });
                }}
                className={`px-2 py-1 border-r border-brand-outline-variant text-[13px] ${isLockedByOther ? "cursor-not-allowed bg-brand-surface-high/30" : "cursor-text hover:bg-brand-primary/5"} transition-colors whitespace-normal break-words align-top relative ${shadowClass}`}
                title={
                  isLockedByOther ? `${lockedByName} 님이 편집 중` : undefined
                }
              >
                {isLockedByOther && (
                  <div
                    className="absolute top-1 right-1 opacity-70"
                    title={`${lockedByName} 님이 편집 중`}
                  >
                    <Lock className="w-3.5 h-3.5 text-brand-error" />
                  </div>
                )}
                {isEditing && (
                  <input
                    type="text"
                    defaultValue={req.id}
                    autoFocus
                    onBlur={(e) => {
                      updateRequirementField(
                        req.id,
                        "id",
                        e.target.value.trim() || req.id,
                      );
                      setActiveCellEditor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateRequirementField(
                          req.id,
                          "id",
                          e.currentTarget.value.trim() || req.id,
                        );
                        setActiveCellEditor(null);
                      }
                      if (e.key === "Escape") setActiveCellEditor(null);
                    }}
                    className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md uppercase font-mono font-medium"
                  />
                )}
                <div className={isEditing ? "opacity-0" : ""}>{req.id}</div>
              </td>
            );
          }

          // 2. Title Column (with inline editable Excel style)
          if (col.id === "title") {
            const isEditing = isActive && activeField === "title";

            return (
              <td
                key={col.id}
                style={cellStyle}
                onClick={() => {
                  if (isLockedByOther) {
                    alert(
                      `현재 ${lockedByName} 님이 편집 중이므로 접근할 수 없습니다.`,
                    );
                    return;
                  }
                  setActiveCellEditor({ rowId: req.id, field: "title" });
                }}
                className={`px-2 py-1 border-r border-brand-outline-variant duration-300 ${isLockedByOther ? "cursor-not-allowed bg-brand-surface-high/30" : "cursor-text hover:bg-brand-surface-high/20"} transition-colors ${truncateClass} align-top relative ${shadowClass}`}
                title={
                  isLockedByOther ? `${lockedByName} 님이 편집 중` : undefined
                }
              >
                {isLockedByOther && (
                  <div
                    className="absolute top-1 right-1 opacity-70"
                    title={`${lockedByName} 님이 편집 중`}
                  >
                    <Lock className="w-3.5 h-3.5 text-brand-error" />
                  </div>
                )}
                {isEditing && (
                  <textarea
                    defaultValue={req.title}
                    autoFocus
                    onPaste={(e) => handleGridPaste(e, req.id, col.id)}
                    onBlur={(e) => {
                      updateRequirementField(req.id, "title", e.target.value);
                      setActiveCellEditor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        updateRequirementField(
                          req.id,
                          "title",
                          e.currentTarget.value,
                        );
                        setActiveCellEditor(null);
                      }
                      if (e.key === "Escape") setActiveCellEditor(null);
                    }}
                    className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-sm px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md resize-none font-medium"
                  />
                )}
                <div
                  className={`font-medium min-h-[1.2rem] ${isEditing ? "opacity-0" : ""}`}
                >
                  {req.title || <span className="opacity-0">-</span>}
                </div>
              </td>
            );
          }

          // 3. Priority Column
          if (col.id === "priority") {
            const badgeColors = {
              HIGH: "bg-brand-error-container text-brand-on-error-container",
              MEDIUM: "bg-brand-surface-highest text-brand-on-surface-variant",
              LOW: "bg-brand-surface-high text-brand-outline/80",
            };
            const labels = { HIGH: "높음", MEDIUM: "중간", LOW: "낮음" };

            return (
              <td
                key={col.id}
                style={cellStyle}
                className={`px-2 py-1 border-r border-brand-outline-variant relative align-top ${shadowClass} ${isDone ? "opacity-60" : ""}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPriorityOpen) {
                      setShowPriorityDropdownId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPriorityDropdownPos({
                        top: rect.bottom,
                        left: rect.left,
                      });
                      setShowPriorityDropdownId(req.id);
                    }
                  }}
                  className="font-semibold text-[11px] px-2 py-0.5 rounded cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-1"
                >
                  <span
                    className={`px-2 py-0.5 rounded ${badgeColors[req.priority] || badgeColors.MEDIUM}`}
                  >
                    {labels[req.priority] || "중간"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-brand-outline-variant" />
                </button>

                {/* Dropdown Menu */}
                {isPriorityOpen &&
                  createPortal(
                    <div
                      ref={priorityRef}
                      style={{
                        position: "fixed",
                        top: priorityDropdownPos.top + 4,
                        left: priorityDropdownPos.left,
                      }}
                      className="w-24 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-xl py-1 z-[9999] animate-fade-slide-up text-xs font-medium"
                    >
                      {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            updateRequirementField(req.id, "priority", p);
                            setShowPriorityDropdownId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-brand-on-surface hover:bg-brand-surface flex items-center justify-between cursor-pointer"
                        >
                          <span>{labels[p]}</span>
                          {req.priority === p && (
                            <Check className="w-3 h-3 text-brand-primary" />
                          )}
                        </button>
                      ))}
                    </div>,
                    document.body,
                  )}
              </td>
            );
          }

          // 4. Assignees Stack Column
          if (col.id === "assignees") {
            return (
              <td
                key={col.id}
                style={cellStyle}
                className={`px-2 py-1 border-r border-brand-outline-variant relative align-top ${isSingleLineView ? "whitespace-nowrap overflow-hidden" : "whitespace-normal"} ${shadowClass}`}
              >
                <div
                  onClick={(e) => {
                    if (isAssigneeOpen) {
                      setShowAssigneeDropdownId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setAssigneeDropdownPos({
                        top: rect.bottom,
                        left: rect.left,
                      });
                      setShowAssigneeDropdownId(req.id);
                    }
                  }}
                  className={`flex ${isSingleLineView ? "flex-row items-center gap-1 overflow-hidden h-[1.8rem]" : "flex-col items-center gap-1.5 min-h-[40px]"} cursor-pointer hover:bg-brand-surface-high/30 p-1.5 rounded transition-colors w-full`}
                >
                  {req.assignees.length === 0 ? (
                    <div className="text-[11px] text-brand-outline-variant italic">
                      담당자 없음
                    </div>
                  ) : (
                    req.assignees.map((a, idx) => (
                      <div
                        key={a.id}
                        className={`inline-flex items-center px-2 py-0.5 border border-brand-outline-variant rounded bg-brand-surface/40 text-[11px] font-semibold whitespace-nowrap text-brand-on-surface-variant ${isDone ? "opacity-70" : ""}`}
                        title={a.name}
                      >
                        <span
                          className={
                            isSingleLineView ? "truncate max-w-[40px]" : ""
                          }
                        >
                          {a.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Assignee Directory Picker Dropdown */}
                {isAssigneeOpen &&
                  createPortal(
                    <div
                      ref={assigneeRef}
                      style={{
                        position: "fixed",
                        top: assigneeDropdownPos.top + 4,
                        left: assigneeDropdownPos.left,
                      }}
                      className="w-52 bg-brand-surface-high border border-brand-outline-variant rounded-xl shadow-xl p-3 z-[9999] animate-fade-slide-up text-xs font-semibold"
                    >
                      <p className="text-[11px] text-brand-outline mb-2 pb-1 border-b border-brand-outline-variant">
                        담당자 배정 ({req.assignees.length}명)
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {assigneesPool.map((member) => {
                          const isAssigned = req.assignees.some(
                            (a) => a.id === member.id,
                          );
                          return (
                            <label
                              key={member.id}
                              className="flex items-center gap-2 p-1.5 hover:bg-brand-surface rounded cursor-pointer text-brand-on-surface-variant hover:text-brand-on-surface transition-colors"
                            >
                              <div className="w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center rounded border border-brand-outline-variant transition-colors">
                                {isAssigned && (
                                  <Check
                                    className="w-2.5 h-2.5 text-brand-on-surface"
                                    strokeWidth={4}
                                  />
                                )}
                              </div>
                              {/* Hidden real checkbox for accessibility / label linking */}
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={isAssigned}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newAssignees = [
                                      ...req.assignees,
                                      member,
                                    ];
                                    originalSetRequirements((prev) =>
                                      prev.map((r) =>
                                        r.id === req.id
                                          ? { ...r, assignees: newAssignees }
                                          : r,
                                      ),
                                    );
                                  } else {
                                    const newAssignees = req.assignees.filter(
                                      (a) => a.id !== member.id,
                                    );
                                    originalSetRequirements((prev) =>
                                      prev.map((r) =>
                                        r.id === req.id
                                          ? { ...r, assignees: newAssignees }
                                          : r,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <span>{member.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>,
                    document.body,
                  )}
              </td>
            );
          }

          // 5. Due Date Column
          if (col.id === "dueDate") {
            const isEditing = isActive && activeField === "dueDate";

            return (
              <td
                key={col.id}
                style={cellStyle}
                onClick={() =>
                  setActiveCellEditor({ rowId: req.id, field: "dueDate" })
                }
                className={`px-2 py-1 border-r border-brand-outline-variant text-[13px] text-brand-on-surface-variant hover:bg-brand-surface-high/10 cursor-pointer align-top relative ${shadowClass}`}
              >
                {isEditing && (
                  <input
                    type="date"
                    defaultValue={req.dueDate}
                    autoFocus
                    onPaste={(e) => handleGridPaste(e, req.id, col.id)}
                    onBlur={(e) => {
                      updateRequirementField(
                        req.id,
                        "dueDate",
                        e.target.value || req.dueDate,
                      );
                      setActiveCellEditor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateRequirementField(
                          req.id,
                          "dueDate",
                          e.currentTarget.value || req.dueDate,
                        );
                        setActiveCellEditor(null);
                      }
                      if (e.key === "Escape") setActiveCellEditor(null);
                    }}
                    className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                  />
                )}
                <div className={isEditing ? "opacity-0" : ""}>
                  {req.dueDate}
                </div>
              </td>
            );
          }

          // 6. Status Badge Column
          if (col.id === "status") {
            const statusColors: any = {
              TODO: "border border-brand-outline-variant text-brand-on-surface-variant bg-brand-surface/40",
              IN_PROGRESS: "bg-brand-primary-container/20 text-brand-primary",
              DONE: "bg-brand-success-container/30 text-brand-success",
            };
            const labels: any = {
              TODO: "대기중",
              IN_PROGRESS: "검토중",
              DONE: "검토완료",
            };

            const s = (req.status as string) || "TODO";
            const normalizedStatus =
              s === "TODO" || s === "대기중"
                ? "TODO"
                : s === "IN_PROGRESS" || s === "검토중"
                  ? "IN_PROGRESS"
                  : s === "DONE" || s === "검토완료"
                    ? "DONE"
                    : "TODO";

            return (
              <td
                key={col.id}
                style={cellStyle}
                className={`px-2 py-1 border-r border-brand-outline-variant relative align-top ${shadowClass}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isStatusOpen) {
                      setShowStatusDropdownId(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setStatusDropdownPos({
                        top: rect.bottom,
                        left: rect.left,
                      });
                      setShowStatusDropdownId(req.id);
                    }
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium leading-none ${statusColors[normalizedStatus] || statusColors.TODO}`}
                  >
                    {normalizedStatus === "DONE" && (
                      <span className="w-1.5 h-1.5 bg-brand-success rounded-full"></span>
                    )}
                    {normalizedStatus === "IN_PROGRESS" && (
                      <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping"></span>
                    )}
                    {normalizedStatus === "TODO" && (
                      <span className="w-1.5 h-1.5 bg-brand-outline rounded-full opacity-60"></span>
                    )}
                    {labels[normalizedStatus] || "대기중"}
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                  </span>
                </button>

                {/* Status Selector Dropdown */}
                {isStatusOpen &&
                  createPortal(
                    <div
                      ref={statusRef}
                      style={{
                        position: "fixed",
                        top: statusDropdownPos.top + 4,
                        left: statusDropdownPos.left,
                      }}
                      className="w-28 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-xl py-1 z-[9999] animate-fade-slide-up text-xs font-semibold"
                    >
                      {(["TODO", "IN_PROGRESS", "DONE"] as Status[]).map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => {
                              updateRequirementField(req.id, "status", st);
                              setShowStatusDropdownId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-brand-on-surface hover:bg-brand-surface flex items-center justify-between cursor-pointer"
                          >
                            <span>{labels[st]}</span>
                            {normalizedStatus === st && (
                              <Check className="w-3 h-3 text-brand-primary" />
                            )}
                          </button>
                        ),
                      )}
                    </div>,
                    document.body,
                  )}
              </td>
            );
          }

          // 7. Custom Column Render
          if (col.isCustom) {
            let cellVal = req.customColumns?.[col.id] || "";
            const isEditing = isActive && activeField === col.id;

            // Checkbox doesn't need inline edit state, just toggles on click
            if (col.type === "checkbox") {
              const isChecked = cellVal === "true";
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant text-center align-middle ${shadowClass}`}
                >
                  <div
                    className="w-4 h-4 mx-auto inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors"
                    onClick={() =>
                      updateRequirementField(
                        req.id,
                        col.id,
                        isChecked ? "false" : "true",
                      )
                    }
                  >
                    {isChecked && (
                      <Check
                        className="w-3 h-3 text-brand-on-surface"
                        strokeWidth={4}
                      />
                    )}
                  </div>
                </td>
              );
            }

            if (col.type === "button") {
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant text-center align-middle ${shadowClass}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (col.buttonAction === "start_work") {
                        if (
                          req.assignees.length === 0 &&
                          assigneesPool.length > 0
                        ) {
                          updateRequirementField(req.id, "assignees", [
                            assigneesPool[0],
                          ]);
                        }
                        updateRequirementField(req.id, "status", "IN_PROGRESS");
                      } else if (col.buttonAction === "finish_work") {
                        updateRequirementField(req.id, "status", "DONE");
                      }
                    }}
                    className="px-3 py-1 bg-brand-surface-high border border-brand-outline hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary rounded text-xs transition-colors whitespace-nowrap"
                  >
                    {col.buttonLabel || "실행"}
                  </button>
                </td>
              );
            }

            if (col.type === "currency_usd") {
              let result = resolveColumnValue(
                req,
                col.id,
                columns,
                tabDataMap,
                tabs,
                exchangeRates,
              );
              if (result === "") {
                result = "N/A (금액/화폐 열 필요)";
              } else if (isNaN(result)) {
                result = "N/A";
              } else {
                const fractionDigits =
                  col.currencyDecimalPlaces !== undefined
                    ? col.currencyDecimalPlaces
                    : 0;
                result =
                  "$" +
                  Number(result).toLocaleString(undefined, {
                    minimumFractionDigits: fractionDigits,
                    maximumFractionDigits: fractionDigits,
                  });
              }
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top text-brand-primary font-bold bg-brand-surface-lowest/50 ${shadowClass}`}
                >
                  {result}
                </td>
              );
            }

            if (col.type === "inflation_pv") {
              let result = "";
              try {
                const numVal = resolveColumnValue(
                  req,
                  col.id,
                  columns,
                  tabDataMap,
                  tabs,
                  exchangeRates,
                );
                result = String(numVal);
              } catch (e: any) {
                result = `Error: ${e.message}`;
              }

              let formattedResult = result;
              if (
                !result.startsWith("Error") &&
                result !== "" &&
                !isNaN(Number(result))
              ) {
                const dp =
                  col.decimalPlaces !== undefined ? col.decimalPlaces : 0;
                formattedResult = Number(result).toLocaleString(undefined, {
                  minimumFractionDigits: dp,
                  maximumFractionDigits: dp,
                });
              }

              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top text-brand-primary font-bold bg-brand-surface-lowest/50 ${shadowClass}`}
                >
                  <div
                    className={`flex items-center gap-1.5 justify-end ${truncateClass}`}
                  >
                    <span>{formattedResult || "-"}</span>
                  </div>
                </td>
              );
            }

            if (col.type === "lookup") {
              let result = String(
                resolveColumnValue(
                  req,
                  col.id,
                  columns,
                  tabDataMap,
                  tabs,
                  exchangeRates,
                ),
              );
              if (
                result &&
                !isNaN(Number(result)) &&
                col.decimalPlaces !== undefined
              )
                result = String(Number(result).toFixed(col.decimalPlaces));

              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top text-brand-primary font-bold bg-brand-surface-lowest/50 relative ${shadowClass}`}
                >
                  <div
                    className={`font-medium min-h-[1.2rem] ${truncateClass}`}
                  >
                    {result || <span className="opacity-0">-</span>}
                  </div>
                </td>
              );
            }

            if (col.type === "formula") {
              let result = "";
              try {
                result = String(
                  resolveColumnValue(
                    req,
                    col.id,
                    columns,
                    tabDataMap,
                    tabs,
                    exchangeRates,
                  ),
                );
              } catch (e: any) {
                result = `Error: ${e.message}`;
              }

              if (
                !result.startsWith("Error") &&
                result !== "" &&
                !isNaN(Number(result)) &&
                col.decimalPlaces !== undefined
              ) {
                result = Number(result).toFixed(col.decimalPlaces);
              }

              const isFormulaEditing =
                activeCellEditor?.rowId === "FORMULA_" + col.id &&
                activeCellEditor?.field === col.id;
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  onClick={() => {
                    setActiveCellEditor({
                      rowId: "FORMULA_" + col.id,
                      field: col.id,
                    });
                  }}
                  title="클릭하여 해당 열의 수식을 수정합니다"
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top font-bold bg-brand-surface-lowest/50 cursor-text hover:bg-brand-surface-high/20 transition-colors relative ${shadowClass} ${isDone ? "opacity-60 text-brand-primary/60" : "text-brand-primary"}`}
                >
                  {isFormulaEditing ? (
                    <textarea
                      defaultValue={col.formula || ""}
                      autoFocus
                      onBlur={(e) => {
                        const newFormula = e.target.value;
                        setColumns((prev) =>
                          prev.map((c) =>
                            c.id === col.id ? { ...c, formula: newFormula } : c,
                          ),
                        );
                        setActiveCellEditor(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const newFormula = e.currentTarget.value;
                          setColumns((prev) =>
                            prev.map((c) =>
                              c.id === col.id
                                ? { ...c, formula: newFormula }
                                : c,
                            ),
                          );
                          setActiveCellEditor(null);
                        } else if (e.key === "Escape") {
                          setActiveCellEditor(null);
                        }
                      }}
                      className="w-full h-full bg-brand-surface border border-brand-primary absolute inset-0 z-10 p-2 text-brand-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-left resize-none"
                    />
                  ) : (
                    result
                  )}
                </td>
              );
            }

            if (col.type === "relation") {
              const relIds = cellVal
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  onClick={() =>
                    setActiveCellEditor({ rowId: req.id, field: col.id })
                  }
                  className={`px-2 py-1 border-r border-brand-outline-variant cursor-text hover:bg-brand-surface-high/20 transition-colors align-top relative ${shadowClass}`}
                >
                  {isEditing && (
                    <input
                      type="text"
                      defaultValue={cellVal}
                      autoFocus
                      onBlur={(e) => {
                        updateRequirementField(req.id, col.id, e.target.value);
                        setActiveCellEditor(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateRequirementField(
                            req.id,
                            col.id,
                            e.currentTarget.value,
                          );
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      }}
                      placeholder="REQ-002, REQ-003..."
                      className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-xs px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                    />
                  )}
                  <div
                    className={`flex ${isSingleLineView ? "flex-row overflow-hidden whitespace-nowrap h-[1.8rem] items-center" : "flex-wrap"} gap-1 ${isEditing ? "opacity-0" : ""}`}
                  >
                    {relIds.length === 0 && (
                      <span className="opacity-35 italic font-light">-</span>
                    )}
                    {relIds.map((rid) => {
                      const linkedReq = reqById.get(rid);
                      if (!linkedReq)
                        return (
                          <span
                            key={rid}
                            className="text-brand-error text-[10px] border border-brand-error/20 bg-brand-error/10 px-1 rounded"
                          >
                            {rid} 없음
                          </span>
                        );
                      return (
                        <span
                          key={rid}
                          className="text-[10px] font-medium bg-brand-tertiary/10 text-brand-tertiary border border-brand-tertiary/30 px-1 py-0.5 rounded flex items-center gap-1 leading-none shadow-sm"
                        >
                          🔗 {linkedReq.title.slice(0, 10)}
                        </span>
                      );
                    })}
                  </div>
                </td>
              );
            }

            if (col.type === "rollup") {
              const relColVal =
                req.customColumns?.[col.rollupRelId || ""] || "";
              const relIds = relColVal
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const linkedReqs = relIds
                .map((rid) => reqById.get(rid))
                .filter(Boolean) as Requirement[];

              let resultStr = "-";
              if (linkedReqs.length > 0) {
                if (col.rollupAggType === "count") {
                  resultStr = linkedReqs.length.toString();
                } else if (col.rollupAggType === "percent_done") {
                  const doneCount = linkedReqs.filter(
                    (r) => r.status === "DONE",
                  ).length;
                  resultStr = `${Math.round((doneCount / linkedReqs.length) * 100)}%`;
                }
              }

              if (
                resultStr !== "-" &&
                !resultStr.includes("%") &&
                !isNaN(Number(resultStr)) &&
                col.decimalPlaces !== undefined
              ) {
                resultStr = Number(resultStr).toFixed(col.decimalPlaces);
              }

              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top text-[13px] font-bold bg-brand-surface-lowest/50 ${shadowClass} ${isDone ? "text-inherit opacity-60" : "text-brand-on-surface-variant"}`}
                >
                  {resultStr}
                </td>
              );
            }

            if (col.type === "status") {
              const options = col.options || [];
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant align-top relative ${shadowClass}`}
                >
                  <select
                    value={cellVal}
                    onChange={(e) =>
                      updateRequirementField(req.id, col.id, e.target.value)
                    }
                    className="w-full h-full min-h-[1.2rem] bg-transparent border border-transparent hover:border-brand-primary text-inherit text-[13px] text-center font-medium rounded px-0 py-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary appearance-none transition-colors"
                  >
                    <option value="">- 상태 선택 -</option>
                    <optgroup label="할 일 (TODO)">
                      {options
                        .filter((_, i) => i < options.length / 3)
                        .map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="진행 중 (IN PROGRESS)">
                      {options
                        .filter(
                          (_, i) =>
                            i >= options.length / 3 &&
                            i < (options.length / 3) * 2,
                        )
                        .map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="완료 (DONE)">
                      {options
                        .filter((_, i) => i >= (options.length / 3) * 2)
                        .map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </td>
              );
            }

            if (col.type === "select") {
              const options = col.options || [];
              const selectedValues =
                typeof cellVal === "string"
                  ? cellVal
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [];
              const isSelectOpen = showSelectDropdown === col.id;

              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  className={`px-2 py-1 border-r border-brand-outline-variant relative align-top ${isSingleLineView ? "whitespace-nowrap overflow-hidden" : "whitespace-normal"} ${shadowClass}`}
                >
                  <div
                    onClick={(e) => {
                      if (isSelectOpen) {
                        setShowSelectDropdown(null);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setSelectDropdownPos({
                          top: rect.bottom,
                          left: rect.left,
                        });
                        setShowSelectDropdown({ rowId: req.id, colId: col.id });
                      }
                    }}
                    className={`flex ${isSingleLineView ? "flex-row items-center gap-1 overflow-hidden h-[1.8rem]" : "flex-col items-center gap-1.5 min-h-[40px]"} cursor-pointer hover:bg-brand-surface-high/30 p-1.5 rounded transition-colors w-full`}
                  >
                    {selectedValues.length === 0 ? (
                      <div className="text-[11px] text-brand-outline-variant italic">
                        선택 없음
                      </div>
                    ) : (
                      selectedValues.map((val, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 border border-brand-outline-variant rounded bg-brand-surface/40 text-[11px] font-semibold whitespace-nowrap text-brand-on-surface-variant"
                          title={val}
                        >
                          <span
                            className={
                              isSingleLineView ? "truncate max-w-[40px]" : ""
                            }
                          >
                            {val}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {isSelectOpen &&
                    createPortal(
                      <div
                        ref={selectDropdownRef}
                        style={{
                          position: "fixed",
                          top: selectDropdownPos.top + 4,
                          left: selectDropdownPos.left,
                        }}
                        className="w-52 bg-brand-surface-high border border-brand-outline-variant rounded-xl shadow-xl p-3 z-[9999] animate-fade-slide-up text-xs font-semibold"
                      >
                        <p className="text-[11px] text-brand-outline mb-2 pb-1 border-b border-brand-outline-variant">
                          {col.label} 선택 ({selectedValues.length})
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {options.map((opt) => {
                            const isAssigned = selectedValues.includes(opt);
                            return (
                              <label
                                key={opt}
                                className="flex items-center gap-2 p-1.5 hover:bg-brand-surface rounded cursor-pointer text-brand-on-surface-variant hover:text-brand-on-surface transition-colors"
                              >
                                <div className="w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center rounded border border-brand-outline-variant transition-colors">
                                  {isAssigned && (
                                    <Check
                                      className="w-2.5 h-2.5 text-brand-on-surface"
                                      strokeWidth={4}
                                    />
                                  )}
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isAssigned}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newVals = [...selectedValues, opt];
                                      updateRequirementField(
                                        req.id,
                                        col.id,
                                        newVals.join(", "),
                                      );
                                    } else {
                                      const newVals = selectedValues.filter(
                                        (v) => v !== opt,
                                      );
                                      updateRequirementField(
                                        req.id,
                                        col.id,
                                        newVals.join(", "),
                                      );
                                    }
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                          <button
                            className="w-full text-left p-1.5 text-brand-primary hover:bg-brand-surface rounded transition-colors text-[11px]"
                            onClick={() => {
                              const newOption =
                                prompt("새 항목의 이름을 입력하세요:");
                              if (newOption && newOption.trim()) {
                                const trimmed = newOption.trim();
                                setColumns((prev) =>
                                  prev.map((c) => {
                                    if (c.id === col.id) {
                                      const existing = c.options || [];
                                      if (!existing.includes(trimmed)) {
                                        return {
                                          ...c,
                                          options: [...existing, trimmed],
                                        };
                                      }
                                    }
                                    return c;
                                  }),
                                );
                                if (!selectedValues.includes(trimmed)) {
                                  const newVals = [...selectedValues, trimmed];
                                  updateRequirementField(
                                    req.id,
                                    col.id,
                                    newVals.join(", "),
                                  );
                                }
                              }
                            }}
                          >
                            + 새 항목 추가
                          </button>
                        </div>
                      </div>,
                      document.body,
                    )}
                </td>
              );
            }

            if (col.type === "date") {
              return (
                <td
                  key={col.id}
                  style={cellStyle}
                  onClick={() =>
                    setActiveCellEditor({ rowId: req.id, field: col.id })
                  }
                  className={`px-2 py-1 border-r border-brand-outline-variant text-[13px] text-brand-on-surface-variant hover:bg-brand-surface-high/10 cursor-pointer align-top relative ${shadowClass}`}
                >
                  {isEditing && (
                    <input
                      type="date"
                      defaultValue={cellVal}
                      autoFocus
                      onPaste={(e) => handleGridPaste(e, req.id, col.id)}
                      onBlur={(e) => {
                        updateRequirementField(req.id, col.id, e.target.value);
                        setActiveCellEditor(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateRequirementField(
                            req.id,
                            col.id,
                            e.currentTarget.value,
                          );
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      }}
                      className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                    />
                  )}
                  <div className={isEditing ? "opacity-0" : ""}>{cellVal}</div>
                </td>
              );
            }

            // Determine input type
            let inputType = "text";
            if (col.type === "number") inputType = "number";

            return (
              <td
                key={col.id}
                style={cellStyle}
                onClick={() =>
                  setActiveCellEditor({ rowId: req.id, field: col.id })
                }
                className={`px-2 py-1 border-r border-brand-outline-variant cursor-text hover:bg-brand-surface-high/20 transition-colors align-top relative ${shadowClass}`}
              >
                {isEditing && (
                  <textarea
                    defaultValue={cellVal}
                    autoFocus
                    onPaste={(e) => handleGridPaste(e, req.id, col.id)}
                    onBlur={(e) => {
                      updateRequirementField(req.id, col.id, e.target.value);
                      setActiveCellEditor(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        updateRequirementField(
                          req.id,
                          col.id,
                          e.currentTarget.value,
                        );
                        setActiveCellEditor(null);
                      }
                      if (e.key === "Escape") setActiveCellEditor(null);
                    }}
                    className="absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-sm px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md resize-none font-medium"
                  />
                )}
                <div
                  className={`font-medium min-h-[1.2rem] ${truncateClass} ${isEditing ? "opacity-0" : ""}`}
                >
                  {inputType === "number" &&
                  col.decimalPlaces !== undefined &&
                  cellVal &&
                  !isNaN(Number(cellVal))
                    ? Number(cellVal).toFixed(col.decimalPlaces)
                    : cellVal || <span className="opacity-0">-</span>}
                </div>
              </td>
            );
          }

          return null;
        })}

        {/* Single Row actions cell */}
        <td className="px-2 py-1 text-center text-brand-on-surface-variant w-[100px]">
          <button
            onClick={() => {
              if (confirm(`'${req.id}' 항목을 즉각 삭제하시겠습니까?`)) {
                setRequirements((prev) => prev.filter((r) => r.id !== req.id));
                setSelectedIds((prev) => prev.filter((id) => id !== req.id));
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-brand-outline hover:text-brand-error hover:bg-brand-surface-lowest rounded-lg transition-all cursor-pointer"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  }),
  (prev, next) => {
    return (
      prev.req === next.req &&
      prev.isSelected === next.isSelected &&
      prev.isSingleLineView === next.isSingleLineView &&
      prev.isActive === next.isActive &&
      prev.activeField === next.activeField &&
      prev.isLockedByOther === next.isLockedByOther &&
      prev.lockedByName === next.lockedByName &&
      prev.isPriorityOpen === next.isPriorityOpen &&
      prev.isAssigneeOpen === next.isAssigneeOpen &&
      prev.isStatusOpen === next.isStatusOpen &&
      prev.dragOverRowId === next.dragOverRowId &&
      prev.columns === next.columns &&
      prev.minimizedColumns === next.minimizedColumns &&
      prev.columnWidths === next.columnWidths &&
      prev.assigneesPool === next.assigneesPool &&
      prev.currentUser === next.currentUser &&
      prev.exchangeRates === next.exchangeRates &&
      prev.activeCellEditor === next.activeCellEditor &&
      prev.tabDataMap === next.tabDataMap &&
      prev.tabs === next.tabs &&
      prev.getCellStickyStyle === next.getCellStickyStyle
    );
  },
);
