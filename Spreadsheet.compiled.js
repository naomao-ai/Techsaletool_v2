import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=55b0a2e0"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=55b0a2e0"; const React = __vite__cjsImport1_react.__esModule ? __vite__cjsImport1_react.default : __vite__cjsImport1_react; const useState = __vite__cjsImport1_react["useState"]; const useRef = __vite__cjsImport1_react["useRef"]; const useEffect = __vite__cjsImport1_react["useEffect"]; const useCallback = __vite__cjsImport1_react["useCallback"]; const useMemo = __vite__cjsImport1_react["useMemo"];
import __vite__cjsImport2_reactDom from "/node_modules/.vite/deps/react-dom.js?v=55b0a2e0"; const createPortal = __vite__cjsImport2_reactDom["createPortal"];
import __vite__cjsImport3_exceljs from "/node_modules/.vite/deps/exceljs.js?v=55b0a2e0"; const ExcelJS = __vite__cjsImport3_exceljs.__esModule ? __vite__cjsImport3_exceljs.default : __vite__cjsImport3_exceljs;
import __vite__cjsImport4_fileSaver from "/node_modules/.vite/deps/file-saver.js?v=55b0a2e0"; const saveAs = __vite__cjsImport4_fileSaver["saveAs"];
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
  CircleDot,
  GripVertical,
  Copy,
  Grid,
  Users,
  Undo2,
  Redo2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Layers,
  Edit2,
  AlignJustify
} from "/node_modules/.vite/deps/lucide-react.js?v=55b0a2e0";
import { INITIAL_REQUIREMENTS, INITIAL_ASSIGNEES } from "/src/data.ts";
import DraggableModal from "/src/components/DraggableModal.tsx";
let cachedInvoke = null;
const getTauriInvoke = async () => {
  if (cachedInvoke) return cachedInvoke;
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("/node_modules/.vite/deps/@tauri-apps_api_core.js?v=55b0a2e0");
    cachedInvoke = invoke;
    return invoke;
  }
  return null;
};
export default function Spreadsheet({ requirements, setRequirements: originalSetRequirements, assigneesPool, setAssigneesPool, columns, setColumns, openComingSoonModal, socket, dbPath, currentUser, activeLocks = {}, tabs = [], tabDataMap = {} }) {
  const MAX_HISTORY = 20;
  const historyRef = useRef([]);
  const redoStackRef = useRef([]);
  const setRequirements = useCallback((action) => {
    originalSetRequirements((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      if (prev !== next) {
        historyRef.current.push(prev);
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift();
        }
        redoStackRef.current = [];
      }
      return next;
    });
  }, [originalSetRequirements]);
  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      originalSetRequirements((prev) => {
        const previousState = historyRef.current.pop();
        redoStackRef.current.push([...prev]);
        return previousState;
      });
    }
  }, [originalSetRequirements]);
  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      originalSetRequirements((prev) => {
        const nextState = redoStackRef.current.pop();
        historyRef.current.push([...prev]);
        return nextState;
      });
    }
  }, [originalSetRequirements]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [editingColumnDefId, setEditingColumnDefId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("text");
  const [editingColumnNameId, setEditingColumnNameId] = useState(null);
  const [formulaInput, setFormulaInput] = useState("");
  const [buttonLabelInput, setButtonLabelInput] = useState("");
  const [buttonActionInput, setButtonActionInput] = useState("start_work");
  const [currencyAmountColIdInput, setCurrencyAmountColIdInput] = useState("");
  const [currencyCodeColIdInput, setCurrencyCodeColIdInput] = useState("");
  const [currencyDecimalPlacesInput, setCurrencyDecimalPlacesInput] = useState(0);
  const [decimalPlacesInput, setDecimalPlacesInput] = useState("");
  const [rollupRelIdInput, setRollupRelIdInput] = useState("");
  const [rollupAggTypeInput, setRollupAggTypeInput] = useState("count");
  const [statusOptionsInput, setStatusOptionsInput] = useState("아이디어,기획,디자인,개발,QA,배포");
  const [lookupTabIdInput, setLookupTabIdInput] = useState("");
  const [lookupMatchMyColIdInput, setLookupMatchMyColIdInput] = useState("");
  const [lookupMatchTargetColIdInput, setLookupMatchTargetColIdInput] = useState("");
  const [lookupReturnTargetColIdInput, setLookupReturnTargetColIdInput] = useState("");
  const [exchangeRates, setExchangeRates] = useState(() => {
    const saved = localStorage.getItem("app_exchange_rates");
    return saved ? JSON.parse(saved) : { KRW: 1, USD: 1400, EUR: 1500 };
  });
  useEffect(() => {
    localStorage.setItem("app_exchange_rates", JSON.stringify(exchangeRates));
  }, [exchangeRates]);
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem("app_grid_col_widths");
    const base = saved ? JSON.parse(saved) : {
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
      status: 100
    };
    columns.forEach((c) => {
      if (c.width) base[c.id] = c.width;
    });
    return base;
  });
  useEffect(() => {
    setColumnWidths((prev) => {
      let changed = false;
      const next = { ...prev };
      columns.forEach((c) => {
        if (c.width && next[c.id] !== c.width) {
          next[c.id] = c.width;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [columns]);
  useEffect(() => {
    localStorage.setItem("app_grid_col_widths", JSON.stringify(columnWidths));
  }, [columnWidths]);
  const [resizingColId, setResizingColId] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  useEffect(() => {
    if (!resizingColId) return;
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + deltaX);
      setColumnWidths((prev) => ({ ...prev, [resizingColId]: newWidth }));
    };
    const handleMouseUp = () => {
      setColumnWidths((prevWidths) => {
        const finalWidth = prevWidths[resizingColId];
        if (finalWidth) {
          setColumns((prev) => prev.map((c) => c.id === resizingColId ? { ...c, width: finalWidth } : c));
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
  const [showAssigneeManager, setShowAssigneeManager] = useState(false);
  const [assigneeManagerPos, setAssigneeManagerPos] = useState(void 0);
  const [newAssigneeName, setNewAssigneeName] = useState("");
  const [columnSearchTerms, setColumnSearchTerms] = useState({});
  const [showFilterColumnId, setShowFilterColumnId] = useState(null);
  const [filterPopupCoords, setFilterPopupCoords] = useState(null);
  const filterPopupRef = useRef(null);
  const [minimizedColumns, setMinimizedColumns] = useState({});
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(e.target)) {
        setShowFilterColumnId(null);
        setFilterPopupCoords(null);
      }
      setContextMenuColId(null);
      setSuperContextMenuGroup(null);
    };
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  }, []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedColumnIds, setSelectedColumnIds] = useState([]);
  const [showDescriptionEditColId, setShowDescriptionEditColId] = useState(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [newColumnOptionsInput, setNewColumnOptionsInput] = useState("");
  const [activeCellEditor, setActiveCellEditorState] = useState(null);
  const cellRef = useRef(null);
  const locksRef = useRef(null);
  useEffect(() => {
    cellRef.current = activeCellEditor;
    locksRef.current = activeLocks;
  });
  const setActiveCellEditor = useCallback(async (val) => {
    const activeCell = cellRef.current;
    if (val === null && activeCell) {
      if (window.__TAURI_INTERNALS__ && dbPath && currentUser) {
        try {
          const invokeCall = await getTauriInvoke();
          await invokeCall("release_item_lock", {
            projectPath: dbPath,
            itemId: activeCell.rowId,
            userId: currentUser.id
          });
        } catch (e) {
        }
      }
      setActiveCellEditorState(null);
      return;
    }
    if (val) {
      setActiveCellEditorState(val);
      if (window.__TAURI_INTERNALS__ && dbPath && currentUser) {
        try {
          const invokeCall = await getTauriInvoke();
          await invokeCall("acquire_item_lock", {
            projectPath: dbPath,
            itemId: val.rowId,
            userId: currentUser.id,
            userName: currentUser.name
          });
        } catch (e) {
          setActiveCellEditorState(null);
          const locker = locksRef.current[val.rowId];
          const lockerName = locker ? locker.userName : "다른 사용자";
          alert(`[접근 제한]
현재 ${lockerName} 님이 이 항목을 편집하고 있습니다.
편집이 완료될 때까지 기다려 주세요.`);
        }
        return;
      }
    }
    setActiveCellEditorState(val);
  }, [dbPath, currentUser]);
  const [showPriorityDropdownId, setShowPriorityDropdownId] = useState(null);
  const [showStatusDropdownId, setShowStatusDropdownId] = useState(null);
  const [showAssigneeDropdownId, setShowAssigneeDropdownId] = useState(null);
  const priorityRef = useRef(null);
  const statusRef = useRef(null);
  const assigneeRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (priorityRef.current && !priorityRef.current.contains(event.target)) {
        setShowPriorityDropdownId(null);
      }
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setShowStatusDropdownId(null);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(event.target)) {
        setShowAssigneeDropdownId(null);
      }
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target)) {
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
  const reqById = useMemo(() => new Map(requirements.map((r) => [r.id, r])), [requirements]);
  const collator = useMemo(() => new Intl.Collator("ko"), []);
  const filteredAndSortedRequirements = useMemo(() => requirements.filter((req) => {
    if (priorityFilter !== "ALL" && req.priority !== priorityFilter) return false;
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchesId = req.id.toLowerCase().includes(term);
      const matchesTitle = req.title.toLowerCase().includes(term);
      const matchesAssignees = req.assignees.some((a) => a.name.toLowerCase().includes(term));
      const matchesDueDate = req.dueDate.toLowerCase().includes(term);
      let matchesCustom = false;
      if (req.customColumns) {
        matchesCustom = Object.values(req.customColumns).some((v) => v.toLowerCase().includes(term));
      }
      if (!matchesId && !matchesTitle && !matchesAssignees && !matchesDueDate && !matchesCustom) return false;
    }
    for (const colId of Object.keys(columnSearchTerms)) {
      const colTerm = columnSearchTerms[colId].trim().toLowerCase();
      if (colTerm === "") continue;
      if (colId === "id" && !req.id.toLowerCase().includes(colTerm)) return false;
      if (colId === "title" && !req.title.toLowerCase().includes(colTerm)) return false;
      if (colId === "status" && !req.status.toLowerCase().includes(colTerm)) return false;
      if (colId === "priority" && !req.priority.toLowerCase().includes(colTerm)) return false;
      if (colId === "dueDate" && !req.dueDate.toLowerCase().includes(colTerm)) return false;
      if (colId === "assignees" && !req.assignees.some((a) => a.name.toLowerCase().includes(colTerm))) return false;
      if (!["id", "title", "status", "priority", "dueDate", "assignees"].includes(colId)) {
        const val = req.customColumns?.[colId] || "";
        if (!val.toLowerCase().includes(colTerm)) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField] || "";
    let valB = b[sortField] || "";
    if (sortField === "id") {
      const numA = parseInt(String(valA).replace("REQ-", ""), 10) || 0;
      const numB = parseInt(String(valB).replace("REQ-", ""), 10) || 0;
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }
    if (sortField === "dueDate") {
      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return sortDirection === "asc" ? collator.compare(strA, strB) : collator.compare(strB, strA);
  }), [requirements, priorityFilter, statusFilter, searchTerm, columnSearchTerms, sortField, sortDirection, collator]);
  const handleSelectAll = (checked) => {
    if (checked) {
      const allFilteredIds = filteredAndSortedRequirements.map((r) => r.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectRow = useCallback((id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, []);
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const handleAddRow = () => {
    const maxNumericId = requirements.reduce((max, r) => {
      const match = r.id.match(/REQ-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextId = `REQ-${String(maxNumericId + 1).padStart(3, "0")}`;
    const defaultAssignee = assigneesPool.length > 0 ? assigneesPool[0] : { id: "USR-000", name: "미지정", avatarUrl: "" };
    const newReq = {
      id: nextId,
      title: "새로 추가된 요구사항 내용을 입력하세요",
      priority: "MEDIUM",
      assignees: [defaultAssignee],
      // assign default user
      dueDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: "TODO",
      customColumns: {}
    };
    setRequirements((prev) => [...prev, newReq]);
    setActiveCellEditor({ rowId: nextId, field: "title" });
  };
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개의 요구사항 코드를 영구적으로 분할/삭제하시겠습니까?`)) {
      setRequirements((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  }, [selectedIds, setRequirements]);
  const updateRequirementField = useCallback((rowId, field, value) => {
    setRequirements((prev) => prev.map((req) => {
      if (req.id === rowId) {
        if (field === "id") {
          if (prev.some((r) => r.id === value && r.id !== rowId)) {
            alert("이미 존재하는 ID입니다.");
            return req;
          }
          return { ...req, id: value };
        }
        if (field === "title") return { ...req, title: value };
        if (field === "priority") return { ...req, priority: value };
        if (field === "status") return { ...req, status: value };
        if (field === "dueDate") return { ...req, dueDate: value };
        const updatedCustom = { ...req.customColumns, [field]: value };
        return { ...req, customColumns: updatedCustom };
      }
      return req;
    }));
  }, [setRequirements]);
  const handleAddOrEditCustomColumn = () => {
    if (!newColumnName.trim()) return;
    if (editingColumnDefId) {
      setColumns((prev) => prev.map((c) => {
        if (c.id === editingColumnDefId) {
          let options = newColumnType === "status" || newColumnType === "select" ? (newColumnType === "select" ? newColumnOptionsInput : statusOptionsInput).split(",").map((s) => s.trim()).filter(Boolean) : void 0;
          if (newColumnType === "select") {
            const existingValues = /* @__PURE__ */ new Set();
            requirements.forEach((req) => {
              const val = req.customColumns?.[editingColumnDefId];
              if (val) {
                existingValues.add(val.trim());
              }
            });
            if (options) {
              existingValues.forEach((val) => {
                if (!options.includes(val)) {
                  options.push(val);
                }
              });
            }
          }
          return {
            ...c,
            label: newColumnName.trim(),
            type: newColumnType,
            options,
            formula: newColumnType === "formula" ? formulaInput : void 0,
            buttonAction: newColumnType === "button" ? buttonActionInput : void 0,
            buttonLabel: newColumnType === "button" ? buttonLabelInput : void 0,
            currencyAmountColId: newColumnType === "currency_usd" ? currencyAmountColIdInput : void 0,
            currencyCodeColId: newColumnType === "currency_usd" ? currencyCodeColIdInput : void 0,
            currencyDecimalPlaces: newColumnType === "currency_usd" ? currencyDecimalPlacesInput : void 0,
            rollupRelId: newColumnType === "rollup" ? rollupRelIdInput : void 0,
            rollupAggType: newColumnType === "rollup" ? rollupAggTypeInput : void 0,
            lookupTabId: newColumnType === "lookup" ? lookupTabIdInput : void 0,
            lookupMatchMyColId: newColumnType === "lookup" ? lookupMatchMyColIdInput : void 0,
            lookupMatchTargetColId: newColumnType === "lookup" ? lookupMatchTargetColIdInput : void 0,
            lookupReturnTargetColId: newColumnType === "lookup" ? lookupReturnTargetColIdInput : void 0,
            decimalPlaces: decimalPlacesInput !== "" ? Number(decimalPlacesInput) : void 0
          };
        }
        return c;
      }));
      setShowAddColumnModal(false);
      setEditingColumnDefId(null);
      setNewColumnName("");
      setNewColumnType("text");
      setFormulaInput("");
      setButtonLabelInput("");
      setButtonActionInput("start_work");
      setRollupRelIdInput("");
      setRollupAggTypeInput("count");
      setNewColumnOptionsInput("");
      setCurrencyDecimalPlacesInput(0);
      setDecimalPlacesInput("");
      setLookupTabIdInput("");
      setLookupMatchMyColIdInput("");
      setLookupMatchTargetColIdInput("");
      setLookupReturnTargetColIdInput("");
      return;
    }
    const colId = `custom_${newColumnName.trim().replace(/\s+/g, "_")}`;
    if (columns.some((c) => c.label === newColumnName.trim() || c.id === colId)) {
      alert("이미 존재하는 열 이름입니다.");
      return;
    }
    setColumns((prev) => [...prev, {
      id: colId,
      label: newColumnName.trim(),
      isCustom: true,
      type: newColumnType,
      options: newColumnType === "status" || newColumnType === "select" ? (newColumnType === "select" ? newColumnOptionsInput : statusOptionsInput).split(",").map((s) => s.trim()).filter(Boolean) : void 0,
      formula: newColumnType === "formula" ? formulaInput : void 0,
      buttonAction: newColumnType === "button" ? buttonActionInput : void 0,
      buttonLabel: newColumnType === "button" ? buttonLabelInput : void 0,
      currencyAmountColId: newColumnType === "currency_usd" ? currencyAmountColIdInput : void 0,
      currencyCodeColId: newColumnType === "currency_usd" ? currencyCodeColIdInput : void 0,
      currencyDecimalPlaces: newColumnType === "currency_usd" ? currencyDecimalPlacesInput : void 0,
      rollupRelId: newColumnType === "rollup" ? rollupRelIdInput : void 0,
      rollupAggType: newColumnType === "rollup" ? rollupAggTypeInput : void 0,
      lookupTabId: newColumnType === "lookup" ? lookupTabIdInput : void 0,
      lookupMatchMyColId: newColumnType === "lookup" ? lookupMatchMyColIdInput : void 0,
      lookupMatchTargetColId: newColumnType === "lookup" ? lookupMatchTargetColIdInput : void 0,
      lookupReturnTargetColId: newColumnType === "lookup" ? lookupReturnTargetColIdInput : void 0,
      decimalPlaces: decimalPlacesInput !== "" ? Number(decimalPlacesInput) : void 0
    }]);
    setNewColumnName("");
    setNewColumnType("text");
    setFormulaInput("");
    setButtonLabelInput("");
    setButtonActionInput("start_work");
    setRollupRelIdInput("");
    setRollupAggTypeInput("count");
    setCurrencyDecimalPlacesInput(0);
    setDecimalPlacesInput("");
    setLookupTabIdInput("");
    setLookupMatchMyColIdInput("");
    setLookupMatchTargetColIdInput("");
    setLookupReturnTargetColIdInput("");
    setShowAddColumnModal(false);
  };
  const handleDeleteCustomColumn = (colId) => {
    setColumnToDelete(colId);
  };
  const executeDeleteColumn = () => {
    if (!columnToDelete) return;
    setColumns((prev) => prev.filter((c) => c.id !== columnToDelete));
    setRequirements((prev) => prev.map((req) => {
      if (req.customColumns) {
        const dict = { ...req.customColumns };
        delete dict[columnToDelete];
        return { ...req, customColumns: dict };
      }
      return req;
    }));
    setColumnToDelete(null);
  };
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("요구사항 관리", {
        views: [{ state: "frozen", xSplit: 0, ySplit: 6 }]
      });
      const colCount = columns.length;
      const lastColLetter = sheet.getColumn(colCount).letter;
      sheet.getRow(1).height = 40;
      sheet.mergeCells(`A1:${lastColLetter}1`);
      const titleCell = sheet.getCell("A1");
      titleCell.value = "요구조건 분석 (Clarification)";
      titleCell.font = { name: "HD Medium", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 90,
        stops: [
          { position: 0, color: { argb: "FF465FA0" } },
          { position: 1, color: { argb: "FF1E2D5D" } }
        ]
      };
      if (colCount >= 3) {
        const startLetter = sheet.getColumn(colCount - 2).letter;
        sheet.mergeCells(`${startLetter}2:${lastColLetter}2`);
        sheet.mergeCells(`${startLetter}3:${lastColLetter}3`);
        const meta1 = sheet.getCell(`${startLetter}2`);
        const doneCount = requirements.filter((r) => r.status === "DONE").length;
        const progress = Math.round(doneCount / requirements.length * 100) || 0;
        meta1.value = `완료(진행) 현황 표시: ${progress}%`;
        meta1.font = { name: "HD Medium", color: { argb: "FF3B82F6" }, bold: true };
        meta1.alignment = { horizontal: "right", vertical: "middle" };
        const meta2 = sheet.getCell(`${startLetter}3`);
        const warningCount = requirements.filter((r) => r.status === "TODO" || r.status === "IN_PROGRESS").length;
        meta2.value = `주의 / 미완료 내역 분석: ${warningCount}건`;
        meta2.font = { name: "HD Medium", color: { argb: "FFEF4444" }, bold: true };
        meta2.alignment = { horizontal: "right", vertical: "middle" };
      }
      const headerRow5 = sheet.getRow(5);
      const headerRow6 = sheet.getRow(6);
      let currentGroup = void 0;
      let groupStartIdx = -1;
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
          stops: [{ position: 0, color: { argb: "FF465FA0" } }, { position: 1, color: { argb: "FF2B427D" } }]
        };
        cell5.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "HD Medium" };
        cell5.alignment = { horizontal: "center", vertical: "middle" };
        cell6.fill = {
          type: "gradient",
          gradient: "angle",
          degree: 90,
          stops: [{ position: 0, color: { argb: "FF2B427D" } }, { position: 1, color: { argb: "FF1E2D5D" } }]
        };
        cell6.font = { bold: false, color: { argb: "FFFFFFFF" }, name: "HD Medium" };
        cell6.alignment = { horizontal: "center", vertical: "middle" };
        cell5.border = { right: { style: "medium", color: { argb: "FF2B427D" } }, top: { style: "medium", color: { argb: "FF2B427D" } } };
        cell6.border = { right: { style: "medium", color: { argb: "FF2B427D" } }, bottom: { style: "medium", color: { argb: "FF2B427D" } } };
        sheet.getColumn(index + 1).width = Math.max(10, (columnWidths[col.id] || 150) / 7.5);
      });
      columns.forEach((col, index) => {
        if (col.groupName) {
          if (col.groupName !== currentGroup) {
            if (currentGroup && groupStartIdx !== -1) {
              const startCell = headerRow5.getCell(groupStartIdx + 1);
              const endCell = headerRow5.getCell(index);
              if (startCell.address !== endCell.address) sheet.mergeCells(`${startCell.address}:${endCell.address}`);
            }
            currentGroup = col.groupName;
            groupStartIdx = index;
          }
        } else {
          if (currentGroup && groupStartIdx !== -1) {
            const startCell = headerRow5.getCell(groupStartIdx + 1);
            const endCell = headerRow5.getCell(index);
            if (startCell.address !== endCell.address) sheet.mergeCells(`${startCell.address}:${endCell.address}`);
            currentGroup = void 0;
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
        if (startCell.address !== endCell.address) sheet.mergeCells(`${startCell.address}:${endCell.address}`);
      }
      sheet.autoFilter = `A6:${lastColLetter}6`;
      requirements.forEach((req, i) => {
        const rowIndex = 7 + i;
        const row = sheet.getRow(rowIndex);
        let isWarning = req.status === "TODO";
        let isRoot = req.priority === "HIGH";
        columns.forEach((col, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          let val = "";
          if (col.id === "id") val = req.id;
          else if (col.id === "title") val = req.title || "";
          else if (col.id === "priority") val = req.priority || "";
          else if (col.id === "assignees") val = (req.assignees || []).map((a) => a.name).join(", ");
          else if (col.id === "dueDate") val = req.dueDate || "";
          else if (col.id === "status") val = req.status || "";
          else if (col.type === "button") val = col.buttonLabel;
          else if (col.type === "currency_usd") {
            const amountCol = col.currencyAmountColId ? columns.find((c) => c.id === col.currencyAmountColId) : columns.find((c) => c.label.includes("금액"));
            const currencyCol = col.currencyCodeColId ? columns.find((c) => c.id === col.currencyCodeColId) : columns.find((c) => c.label.includes("화폐"));
            if (amountCol && currencyCol) {
              const rawAmountStr = String(req.customColumns?.[amountCol.id] || "0").replace(/[^0-9.-]+/g, "");
              const amount = Number(rawAmountStr) || 0;
              const curr = String(req.customColumns?.[currencyCol.id] || "").toUpperCase();
              let krwValue = amount;
              if (curr.includes("WON") || curr.includes("KRW")) {
                krwValue = amount;
              } else if (curr.includes("EUR")) {
                krwValue = amount * exchangeRates.EUR;
              } else if (curr.includes("US") || curr.includes("USD")) {
                krwValue = amount * exchangeRates.USD;
              }
              const usdValue = krwValue / exchangeRates.USD;
              const fractionDigits = col.currencyDecimalPlaces !== void 0 ? col.currencyDecimalPlaces : 0;
              val = isNaN(usdValue) ? "N/A" : "$" + usdValue.toLocaleString(void 0, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
            } else {
              val = "N/A";
            }
          } else if (col.type === "formula") {
            try {
              const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
              const func = getFormulaFn(col.formula || '""', columns);
              val = String(func(req, today, SUM, AVERAGE, IF, DAYS, MONTHS, exchangeRates.KRW, exchangeRates.USD, exchangeRates.EUR));
            } catch (e) {
              val = "Error";
            }
          } else if (col.type === "lookup") {
            const targetTab = tabDataMap?.[col.lookupTabId || ""];
            if (targetTab && col.lookupMatchMyColId && col.lookupMatchTargetColId && col.lookupReturnTargetColId) {
              const myVal = col.lookupMatchMyColId === "title" ? req.title : req.customColumns?.[col.lookupMatchMyColId];
              if (myVal) {
                const matchedReq = targetTab?.requirements?.find((r) => {
                  const tVal = col.lookupMatchTargetColId === "title" ? r.title : r.customColumns?.[col.lookupMatchTargetColId];
                  return tVal === myVal;
                });
                if (matchedReq) {
                  val = col.lookupReturnTargetColId === "title" ? matchedReq.title : matchedReq.customColumns?.[col.lookupReturnTargetColId] || "";
                  if (val && !isNaN(Number(val)) && col.decimalPlaces !== void 0) val = String(Number(val).toFixed(col.decimalPlaces));
                }
              }
            }
          } else if (col.type === "relation") {
            val = req.customColumns?.[col.id] || "";
          } else if (col.type === "rollup") {
            const relColVal = req.customColumns?.[col.rollupRelId || ""] || "";
            const relIds = relColVal.split(",").map((s) => s.trim()).filter(Boolean);
            const linkedReqs = relIds.map((rid) => requirements.find((r) => r.id === rid)).filter(Boolean);
            if (linkedReqs.length > 0) {
              if (col.rollupAggType === "count") {
                val = linkedReqs.length.toString();
              } else if (col.rollupAggType === "percent_done") {
                const doneCount = linkedReqs.filter((r) => r.status === "DONE").length;
                val = `${Math.round(doneCount / linkedReqs.length * 100)}%`;
              }
            } else {
              val = "-";
            }
          } else if (col.type === "status") {
            val = req.customColumns?.[col.id] || "";
          } else if (col.isCustom) val = req.customColumns?.[col.id] || "";
          if (/^\-?\d+(\.\d+)?$/.test(String(val))) {
            cell.value = Number(val);
            if (col.decimalPlaces !== void 0) {
              const mask = col.decimalPlaces === 0 ? "0" : "0." + "0".repeat(col.decimalPlaces);
              cell.numFmt = mask;
            }
          } else {
            cell.value = String(val);
          }
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
              stops: [{ position: 0, color: { argb: "FF475569" } }, { position: 1, color: { argb: "FF334155" } }]
            };
            cell.font = { ...cell.font, bold: true, color: { argb: "FFFFFFFF" } };
          } else {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
          }
          cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            right: { style: "thin", color: colIdx === columns.length - 1 ? { argb: "FFCBD5E1" } : void 0 }
          };
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const isTauri = window.__TAURI_INTERNALS__;
      if (isTauri) {
        const { save } = await import("/node_modules/.vite/deps/@tauri-apps_plugin-dialog.js?v=55b0a2e0");
        const { writeFile, BaseDirectory } = await import("/node_modules/.vite/deps/@tauri-apps_plugin-fs.js?v=55b0a2e0");
        try {
          const filePath = await save({
            filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
            defaultPath: `Requirements_Export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`
          });
          if (filePath) {
            let uint8Data;
            if (buffer instanceof ArrayBuffer) {
              uint8Data = new Uint8Array(buffer);
            } else if (buffer && typeof buffer.length !== "undefined") {
              uint8Data = new Uint8Array(buffer);
            } else {
              throw new Error("Invalid buffer type returned from ExcelJS");
            }
            const { invoke } = await import("/node_modules/.vite/deps/@tauri-apps_api_core.js?v=55b0a2e0");
            await invoke("save_binary_file", { path: filePath, contents: Array.from(uint8Data) });
            alert(`Excel 내보내기 성공!
${filePath}`);
          }
        } catch (dialogErr) {
          throw new Error("OS 파일 대화상자/저장 실패: " + (dialogErr?.message || String(dialogErr)));
        }
      } else {
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Requirements_Export_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`);
        alert("Excel 내보내기 다운로드가 시작되었습니다.");
      }
    } catch (e) {
      console.error("Export failed: ", e);
      alert(`엑셀 내보내기 중 문제가 발생했습니다:
${e.message || String(e)}`);
    }
  };
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [draggedRowId, setDraggedRowId] = useState(null);
  const [dragOverRowId, setDragOverRowId] = useState(null);
  const [contextMenuColId, setContextMenuColId] = useState(null);
  const [superContextMenuGroup, setSuperContextMenuGroup] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [hoveredColumnId, setHoveredColumnId] = useState(null);
  const [hoverTitleCoords, setHoverTitleCoords] = useState(null);
  const [frozenColumnId, setFrozenColumnId] = useState(null);
  const frozenOffsets = useMemo(() => {
    if (!frozenColumnId) return null;
    const frozenIndex = columns.findIndex((c) => c.id === frozenColumnId);
    if (frozenIndex === -1) return null;
    const offsets = {};
    let currentLeft = 84;
    for (let i = 0; i <= frozenIndex; i++) {
      const col = columns[i];
      offsets[col.id] = currentLeft;
      const isMinimized = minimizedColumns[col.id];
      currentLeft += isMinimized ? 24 : columnWidths[col.id] || 150;
    }
    return { offsets, frozenIndex, lastColId: columns[frozenIndex].id };
  }, [frozenColumnId, columns, minimizedColumns, columnWidths]);
  const handleColumnContextMenu = (e, colId) => {
    e.preventDefault();
    setContextMenuColId(colId);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };
  const handleColumnDragStart = (e, colId) => {
    setDraggedColumnId(colId);
    e.dataTransfer.setData("text/plain", colId);
  };
  const handleColumnDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverColumnId(colId);
  };
  const handleColumnDrop = (e, targetColId) => {
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
  const handleDuplicateRow = useCallback((sourceRowId, insertAfterId) => {
    setRequirements((prev) => {
      const sourceRow = prev.find((r) => r.id === sourceRowId);
      if (!sourceRow) return prev;
      const maxNumericId = prev.reduce((max, r) => {
        const match = r.id.match(/REQ-(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      const nextId = `REQ-${String(maxNumericId + 1).padStart(3, "0")}`;
      const clone = {
        ...sourceRow,
        id: nextId,
        title: `${sourceRow.title} (복사본)`,
        assignees: [...sourceRow.assignees],
        customColumns: { ...sourceRow.customColumns }
      };
      const draft = [...prev];
      const targetIndex = draft.findIndex((r) => r.id === (insertAfterId || sourceRowId));
      if (targetIndex !== -1) {
        draft.splice(targetIndex + 1, 0, clone);
      } else {
        draft.push(clone);
      }
      return draft;
    });
  }, [setRequirements]);
  const handleRowDragStart = useCallback((e, rowId) => {
    setDraggedRowId(rowId);
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", rowId);
  }, []);
  const handleRowDragOver = useCallback((e, rowId) => {
    e.preventDefault();
    setDragOverRowId(rowId);
    e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
  }, []);
  const handleRowDrop = useCallback((e, targetRowId) => {
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
  }, [draggedRowId, handleDuplicateRow, setRequirements]);
  const handleGridPaste = useCallback((e, startRowId, startColId) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    if (!text.includes("	") && !text.includes("\n")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const parseTSV = (str) => {
      const rows = [];
      let currentRow = [];
      let currentCell = "";
      let inQuotes = false;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const nextChar = str[i + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "	" && !inQuotes) {
          currentRow.push(currentCell);
          currentCell = "";
        } else if (char === "\r" && nextChar === "\n" && !inQuotes) {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = "";
          i++;
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
        if (currentRow.length !== 1 || currentRow[0] !== "") {
          rows.push(currentRow);
        }
      }
      return rows;
    };
    const pasteData = parseTSV(text);
    if (pasteData.length === 0 || pasteData.length === 1 && pasteData[0].length <= 1) return;
    const startRowIndex = filteredAndSortedRequirements.findIndex((r) => r.id === startRowId);
    const usableCols = columns.filter((c) => c.id !== "id");
    const startColIndex = usableCols.findIndex((c) => c.id === startColId);
    if (startRowIndex === -1 || startColIndex === -1) return;
    let newAssigneesToAdd = [];
    setRequirements((prev) => {
      const draft = [...prev];
      const currentRowsCount = filteredAndSortedRequirements.length;
      let nextNumericId = draft.reduce((max, r) => {
        const match = r.id.match(/REQ-(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0) + 1;
      const defaultAssignee = assigneesPool.length > 0 ? assigneesPool[0] : { id: "USR-000", name: "미지정", avatarUrl: "" };
      pasteData.forEach((rowData, i) => {
        const targetReqIndex = startRowIndex + i;
        let currentReq;
        let realIndex = -1;
        if (targetReqIndex < currentRowsCount) {
          const targetReqId = filteredAndSortedRequirements[targetReqIndex].id;
          realIndex = draft.findIndex((r) => r.id === targetReqId);
          if (realIndex === -1) return;
          currentReq = { ...draft[realIndex], customColumns: { ...draft[realIndex].customColumns } };
        } else {
          const newId = `REQ-${String(nextNumericId++).padStart(3, "0")}`;
          currentReq = {
            id: newId,
            title: "",
            priority: "MEDIUM",
            assignees: [],
            // will be populated or stay empty, we remove default here to prevent mixing
            dueDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            status: "TODO",
            customColumns: {}
          };
        }
        rowData.forEach((cellText, j) => {
          const targetColIndex = startColIndex + j;
          if (targetColIndex >= usableCols.length) return;
          const colId = usableCols[targetColIndex].id;
          const cleanedText = cellText.trim();
          if (colId === "title") currentReq.title = cleanedText;
          else if (colId === "priority") {
            const up = cleanedText.toUpperCase();
            if (["HIGH", "MEDIUM", "LOW"].includes(up)) currentReq.priority = up;
          } else if (colId === "status") {
            const up = cleanedText.toUpperCase();
            if (["TODO", "IN_PROGRESS", "DONE"].includes(up)) currentReq.status = up;
          } else if (colId === "dueDate") {
            currentReq.dueDate = cleanedText || currentReq.dueDate;
          } else if (colId === "assignees") {
            const names = cleanedText.split(",").map((n) => n.trim()).filter(Boolean);
            const matchedAssignees = [];
            for (const name of names) {
              const foundPool = assigneesPool.find((a) => a.name.toLowerCase() === name.toLowerCase());
              const foundNew = newAssigneesToAdd.find((a) => a.name.toLowerCase() === name.toLowerCase());
              if (foundPool) {
                matchedAssignees.push(foundPool);
              } else if (foundNew) {
                matchedAssignees.push(foundNew);
              } else {
                const newAssigneeId = `USR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1e3)}`;
                const newAssignee = { id: newAssigneeId, name, avatarUrl: "" };
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
  }, [columns, filteredAndSortedRequirements, assigneesPool, setRequirements, setAssigneesPool, setActiveCellEditor]);
  const getStickyStyle = useCallback((isHeader = false) => {
    if (isHeader) {
      return {
        position: "sticky",
        top: 0,
        zIndex: 20,
        backgroundColor: "var(--color-brand-surface-lowest)"
      };
    }
    return {};
  }, []);
  const getCellStickyStyle = useCallback((colId, isHeader = false) => {
    let base = getStickyStyle(isHeader);
    if (frozenOffsets) {
      const isFrozen = colId === "index" || colId === "checkbox" || frozenOffsets.offsets[colId] !== void 0;
      if (isFrozen) {
        const left = colId === "index" ? 0 : colId === "checkbox" ? 40 : frozenOffsets.offsets[colId];
        const isLastFrozen = colId === "checkbox" && frozenOffsets.frozenIndex === -1 || colId === frozenOffsets.lastColId;
        base = {
          ...base,
          position: "sticky",
          left,
          zIndex: isHeader ? 30 : 10,
          backgroundColor: isHeader ? "var(--color-brand-surface-high)" : "var(--color-brand-surface-low)"
        };
        if (isLastFrozen) {
          base.boxShadow = "6px 0px 10px -3px rgba(0,0,0,0.5)";
        }
      }
    }
    return base;
  }, [frozenOffsets, getStickyStyle]);
  const getStickyShadowClass = () => "";
  return /* @__PURE__ */ jsxDEV("div", { className: "bg-brand-surface/70 backdrop-blur-md border border-brand-outline rounded-[2rem] shadow-xl overflow-hidden flex flex-col flex-1 min-h-0 animate-fade-slide-up delay-100", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "px-5 py-4 border-b border-brand-outline-variant bg-brand-surface-low flex flex-col sm:flex-row justify-between items-center gap-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex bg-brand-surface border border-brand-outline-variant rounded-lg overflow-hidden shrink-0 h-[36px]", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleUndo,
              disabled: historyRef.current.length === 0,
              className: `px-3 flex items-center justify-center transition-colors ${historyRef.current.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-brand-surface-high cursor-pointer text-brand-on-surface"}`,
              title: "되돌리기 (Ctrl+Z)",
              children: /* @__PURE__ */ jsxDEV(Undo2, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1337,
                columnNumber: 15
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1331,
              columnNumber: 13
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "w-[1px] bg-brand-outline-variant" }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1339,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleRedo,
              disabled: redoStackRef.current.length === 0,
              className: `px-3 flex items-center justify-center transition-colors ${redoStackRef.current.length === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-brand-surface-high cursor-pointer text-brand-on-surface"}`,
              title: "다시 실행 (Ctrl+Shift+Z)",
              children: /* @__PURE__ */ jsxDEV(Redo2, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1346,
                columnNumber: 15
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1340,
              columnNumber: 13
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1330,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-add-row",
            onClick: handleAddRow,
            className: "flex-1 sm:flex-initial px-4 py-2 bg-brand-primary text-brand-on-primary text-sm font-semibold rounded-lg hover:opacity-95 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1355,
                columnNumber: 13
              }, this),
              "새 요구사항"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1350,
            columnNumber: 11
          },
          this
        ),
        requirements.length === 0 && /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-load-examples",
            onClick: () => {
              setRequirements(INITIAL_REQUIREMENTS);
              setAssigneesPool(INITIAL_ASSIGNEES);
            },
            className: "px-4 py-2 bg-brand-tertiary text-white text-sm font-medium rounded-lg hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
            children: "예시 데이터 로드"
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1360,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-export",
            onClick: handleExportExcel,
            className: "px-4 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high hover:text-brand-on-surface active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Download, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1377,
                columnNumber: 13
              }, this),
              "Excel 내보내기"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1372,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-manage-assignees",
            onClick: (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAssigneeManagerPos({ x: rect.right + 10, y: rect.top });
              setShowAssigneeManager(true);
            },
            className: "px-4 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high hover:text-brand-on-surface active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Users, { className: "w-4 h-4 text-brand-primary" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1390,
                columnNumber: 13
              }, this),
              "담당자 관리"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1381,
            columnNumber: 11
          },
          this
        ),
        selectedIds.length > 0 && /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-delete-bulk",
            onClick: handleDeleteSelected,
            className: "px-4 py-2 bg-brand-error-container text-brand-on-error-container text-sm font-semibold rounded-lg hover:bg-opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-error/20 animate-pulse",
            children: [
              /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1401,
                columnNumber: 15
              }, this),
              "선택 삭제 (",
              selectedIds.length,
              ")"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1396,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1328,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col 2xl:flex-row items-end 2xl:items-center gap-3 w-full lg:w-auto", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-xs bg-brand-surface-high border border-brand-outline-variant rounded-md px-3 py-1.5 w-full sm:w-auto overflow-x-auto whitespace-nowrap", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-brand-primary", children: "환율 연동" }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1411,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 ml-1", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-brand-on-surface-variant font-medium", children: "KRW:" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1413,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "number", className: "w-16 bg-brand-surface text-brand-on-surface px-1.5 py-0.5 border border-brand-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-brand-primary text-right", value: exchangeRates.KRW, onChange: (e) => setExchangeRates({ ...exchangeRates, KRW: Number(e.target.value) }) }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1414,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1412,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 ml-2", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-brand-on-surface-variant font-medium", children: "USD:" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1417,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "number", className: "w-16 bg-brand-surface text-brand-on-surface px-1.5 py-0.5 border border-brand-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-brand-primary text-right", value: exchangeRates.USD, onChange: (e) => setExchangeRates({ ...exchangeRates, USD: Number(e.target.value) }) }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1418,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1416,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 ml-2", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "text-brand-on-surface-variant font-medium", children: "EUR:" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1421,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("input", { type: "number", className: "w-16 bg-brand-surface text-brand-on-surface px-1.5 py-0.5 border border-brand-outline-variant rounded focus:outline-none focus:ring-1 focus:ring-brand-primary text-right", value: exchangeRates.EUR, onChange: (e) => setExchangeRates({ ...exchangeRates, EUR: Number(e.target.value) }) }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1422,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1420,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1410,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col flex-wrap sm:flex-row items-center gap-3 w-full sm:w-auto justify-end", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 text-xs text-brand-on-surface-variant w-full sm:w-auto", children: [
            /* @__PURE__ */ jsxDEV("span", { children: "우선순위:" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1429,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: priorityFilter,
                onChange: (e) => setPriorityFilter(e.target.value),
                className: "bg-brand-surface-high border border-brand-outline-variant rounded-md px-2 py-1 text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-xs",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "ALL", children: "전체" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1435,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "HIGH", children: "높음" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1436,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "MEDIUM", children: "중간" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1437,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "LOW", children: "낮음" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1438,
                    columnNumber: 15
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1430,
                columnNumber: 13
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1428,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 text-xs text-brand-on-surface-variant w-full sm:w-auto", children: [
            /* @__PURE__ */ jsxDEV("span", { children: "상태:" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1444,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: statusFilter,
                onChange: (e) => setStatusFilter(e.target.value),
                className: "bg-brand-surface-high border border-brand-outline-variant rounded-md px-2 py-1 text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer text-xs",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "ALL", children: "전체" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1450,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "TODO", children: "미검토" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1451,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "IN_PROGRESS", children: "검토중" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1452,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "DONE", children: "검토완료" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1453,
                    columnNumber: 15
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1445,
                columnNumber: 13
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1443,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "relative w-full sm:w-64", children: [
            /* @__PURE__ */ jsxDEV(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline-variant w-4.5 h-4.5" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1459,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "검색 (ID, 명칭, 담당자...)",
                className: "w-full pl-9 pr-8 py-2 bg-brand-surface-lowest text-sm border border-brand-outline-variant rounded-lg text-brand-on-surface placeholder:text-brand-outline-variant focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1460,
                columnNumber: 13
              },
              this
            ),
            searchTerm && /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setSearchTerm(""),
                className: "absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-brand-on-surface text-brand-outline-variant transition-colors",
                children: /* @__PURE__ */ jsxDEV(X, { className: "w-4 h-4" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1472,
                  columnNumber: 17
                }, this)
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1468,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1458,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: clearAllFilters,
              className: "px-3 py-2 bg-brand-surface border border-brand-outline-variant text-brand-on-surface-variant hover:text-brand-on-surface text-sm font-medium rounded-lg hover:bg-brand-surface-high active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              title: "모든 검색 및 필터 지우기",
              children: "필터 초기화"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1477,
              columnNumber: 11
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1426,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1408,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Spreadsheet.tsx",
      lineNumber: 1325,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto overflow-y-auto flex-1 min-h-0 w-full relative", children: /* @__PURE__ */ jsxDEV("table", { className: "w-max table-fixed border-separate border-spacing-0 text-left select-none bg-brand-surface [&_th]:border-b [&_td]:border-b [&_th]:border-brand-outline-variant [&_td]:border-brand-outline-variant", children: [
      /* @__PURE__ */ jsxDEV("colgroup", { children: [
        /* @__PURE__ */ jsxDEV("col", { style: { width: "40px", minWidth: "40px", maxWidth: "40px" } }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1493,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("col", { style: { width: "44px", minWidth: "44px", maxWidth: "44px" } }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1494,
          columnNumber: 13
        }, this),
        columns.map((col) => {
          const width = minimizedColumns[col.id] ? 24 : columnWidths[col.id] || 150;
          return /* @__PURE__ */ jsxDEV("col", { style: { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } }, col.id, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1497,
            columnNumber: 22
          }, this);
        }),
        /* @__PURE__ */ jsxDEV("col", { style: { width: "150px", minWidth: "150px", maxWidth: "150px" } }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1499,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1492,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("thead", { children: [
        /* @__PURE__ */ jsxDEV("tr", { className: "h-0 p-0 border-0 m-0 invisible", children: [
          /* @__PURE__ */ jsxDEV("th", { style: { width: "40px", minWidth: "40px", maxWidth: "40px", padding: 0, border: 0 } }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1506,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("th", { style: { width: "44px", minWidth: "44px", maxWidth: "44px", padding: 0, border: 0 } }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1507,
            columnNumber: 15
          }, this),
          columns.map((col) => {
            const w = minimizedColumns[col.id] ? 24 : columnWidths[col.id] || 150;
            return /* @__PURE__ */ jsxDEV("th", { style: { width: `${w}px`, minWidth: `${w}px`, maxWidth: `${w}px`, padding: 0, border: 0 } }, col.id, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1510,
              columnNumber: 24
            }, this);
          }),
          /* @__PURE__ */ jsxDEV("th", { style: { width: "150px", minWidth: "150px", maxWidth: "150px", padding: 0, border: 0 } }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1512,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1505,
          columnNumber: 13
        }, this),
        columns.some((c) => c.groupName) && /* @__PURE__ */ jsxDEV("tr", { className: "bg-brand-surface-lowest border-b border-brand-outline-variant text-[12px] font-semibold text-brand-on-surface-variant select-none", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "w-10 border-r border-brand-outline-variant", style: getCellStickyStyle("index", true) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1518,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "w-11 border-r border-brand-outline-variant", style: getCellStickyStyle("checkbox", true) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1519,
            columnNumber: 17
          }, this),
          (() => {
            const ths = [];
            let currentGroup = void 0;
            let colSpan = 0;
            const pushGroup = () => {
              if (colSpan > 0) {
                ths.push(
                  /* @__PURE__ */ jsxDEV(
                    "th",
                    {
                      colSpan,
                      className: `py-1 text-center ${currentGroup ? "border-x border-t-2 border-b-0 border-brand-primary/50 text-brand-primary font-bold shadow-sm cursor-context-menu" : "border-r border-brand-outline-variant"}`,
                      onContextMenu: (e) => {
                        if (currentGroup) {
                          e.preventDefault();
                          setSuperContextMenuGroup(currentGroup);
                          setContextMenuPos({ x: e.clientX, y: e.clientY });
                        }
                      },
                      children: currentGroup || ""
                    },
                    `group-${ths.length}`,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1528,
                      columnNumber: 25
                    },
                    this
                  )
                );
              }
            };
            columns.forEach((col, idx) => {
              if (col.groupName === currentGroup) {
                colSpan++;
              } else {
                pushGroup();
                currentGroup = col.groupName;
                colSpan = 1;
              }
            });
            pushGroup();
            return ths;
          })(),
          /* @__PURE__ */ jsxDEV("th", { className: "w-[150px] border-brand-outline-variant" }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1558,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1517,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tr", { className: "bg-brand-surface-lowest border-b border-brand-outline-variant text-[12px] font-semibold text-brand-on-surface-variant select-none", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "w-10 px-2 py-3 border-r border-brand-outline-variant text-center", style: getCellStickyStyle("index", true) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1564,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: `p-3 border-r border-brand-outline-variant w-11 text-center`, style: { ...getCellStickyStyle("checkbox", true), verticalAlign: "middle" }, children: /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: "w-4 h-4 inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors mb-[2px]",
              onClick: () => handleSelectAll(filteredAndSortedRequirements.length > 0 && selectedIds.length !== filteredAndSortedRequirements.length),
              children: filteredAndSortedRequirements.length > 0 && selectedIds.length === filteredAndSortedRequirements.length && /* @__PURE__ */ jsxDEV(Check, { className: "w-3 h-3 text-brand-on-surface", strokeWidth: 4 }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1573,
                columnNumber: 21
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1568,
              columnNumber: 17
            },
            this
          ) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1567,
            columnNumber: 15
          }, this),
          columns.map((col) => {
            const isMinimized = minimizedColumns[col.id];
            const width = isMinimized ? 24 : columnWidths[col.id] || 150;
            return /* @__PURE__ */ jsxDEV(
              "th",
              {
                draggable: true,
                onDragStart: (e) => handleColumnDragStart(e, col.id),
                onDragOver: (e) => handleColumnDragOver(e, col.id),
                onDragEnter: (e) => e.preventDefault(),
                onDrop: (e) => handleColumnDrop(e, col.id),
                onContextMenu: (e) => handleColumnContextMenu(e, col.id),
                style: { width, minWidth: width, maxWidth: width, ...getCellStickyStyle(col.id, true) },
                className: `pl-1.5 pr-1 py-2 border-r border-brand-outline-variant text-[13px] group relative ${isMinimized ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} transition-all duration-300 ${dragOverColumnId === col.id ? "bg-brand-surface-high/50 border-l-2 border-l-brand-primary" : ""} ${selectedColumnIds.includes(col.id) ? "bg-brand-primary/10" : ""}`,
                onClick: (e) => {
                  if (isMinimized) {
                    setMinimizedColumns((p) => ({ ...p, [col.id]: false }));
                  } else if (e.shiftKey || e.metaKey || e.ctrlKey) {
                    setSelectedColumnIds((prev) => prev.includes(col.id) ? prev.filter((id) => id !== col.id) : [...prev, col.id]);
                  } else {
                    setSelectedColumnIds([col.id]);
                  }
                },
                children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between w-full h-full relative", title: isMinimized ? col.label : void 0, children: [
                  !isMinimized ? editingColumnNameId === col.id ? /* @__PURE__ */ jsxDEV(
                    "textarea",
                    {
                      autoFocus: true,
                      defaultValue: col.label,
                      rows: 2,
                      className: "font-semibold flex-1 mr-0.5 bg-brand-surface-lowest border border-brand-primary text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary rounded px-1 w-full text-[13px] resize-none overflow-hidden",
                      onBlur: (e) => {
                        const val = e.target.value.trim();
                        if (val) {
                          setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, label: val } : c));
                        }
                        setEditingColumnNameId(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, label: val } : c));
                          }
                          setEditingColumnNameId(null);
                        }
                        if (e.key === "Escape") {
                          setEditingColumnNameId(null);
                        }
                      }
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1608,
                      columnNumber: 25
                    },
                    this
                  ) : /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      className: "font-semibold line-clamp-2 leading-[1.15] break-words flex-1 mr-0.5 cursor-text whitespace-pre-wrap text-center",
                      onMouseEnter: (e) => {
                        if (col.description) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoverTitleCoords({ x: rect.left, y: rect.bottom + 5 });
                          setHoveredColumnId(col.id);
                        }
                      },
                      onMouseLeave: () => {
                        setHoveredColumnId(null);
                      },
                      onDoubleClick: () => setEditingColumnNameId(col.id),
                      children: col.label
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1635,
                      columnNumber: 25
                    },
                    this
                  ) : /* @__PURE__ */ jsxDEV("span", { className: "text-brand-outline-variant font-bold mx-auto text-[10px] tracking-widest cursor-pointer group-hover:text-brand-primary", title: `열 숨김: ${col.label} (우클릭하여 확장)`, children: "..." }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1653,
                    columnNumber: 23
                  }, this),
                  !isMinimized && columnSearchTerms[col.id] && /* @__PURE__ */ jsxDEV(Filter, { className: "w-3 h-3 text-brand-primary" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1659,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      onMouseDown: (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingColId(col.id);
                        setResizeStartX(e.clientX);
                        setResizeStartWidth(columnWidths[col.id] || 150);
                      },
                      className: "absolute -right-4 top-0 bottom-0 w-4 cursor-col-resize hover:bg-brand-primary/20 group-hover:bg-brand-outline-variant/10 z-10 transition-colors",
                      title: "크기 조절"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1663,
                      columnNumber: 21
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1605,
                  columnNumber: 19
                }, this)
              },
              col.id,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1583,
                columnNumber: 17
              },
              this
            );
          }),
          /* @__PURE__ */ jsxDEV("th", { className: "px-4 py-3 w-[150px] text-brand-on-surface-variant border-brand-outline-variant bg-brand-surface-lowest font-medium", children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              id: "btn-add-custom-column",
              onClick: () => setShowAddColumnModal(true),
              className: "flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-dashed border-brand-outline-variant text-brand-outline hover:text-brand-primary hover:border-brand-primary hover:bg-brand-surface-high/35 transition-all duration-200 cursor-pointer w-full text-left",
              children: [
                /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1685,
                  columnNumber: 19
                }, this),
                "열 추가"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1680,
              columnNumber: 17
            },
            this
          ) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1679,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1562,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1503,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("tbody", { className: "text-sm text-brand-on-surface divide-y divide-brand-outline-variant/60 leading-[1.35]", children: [
        filteredAndSortedRequirements.length === 0 ? /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: columns.length + 3, className: "px-6 py-12 text-center text-brand-on-surface-variant", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(CircleDot, { className: "w-8 h-8 text-brand-outline-variant animate-pulse" }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1699,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-medium", children: "부합하는 요구사항이 없습니다." }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1700,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs opacity-70", children: "새 요구사항을 만들기 위해 상단의 '새 요구사항' 또는 하단의 '행 추가' 버튼을 눌러주세요." }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1701,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1698,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1697,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1696,
          columnNumber: 15
        }, this) : filteredAndSortedRequirements.map((req) => /* @__PURE__ */ jsxDEV(
          SpreadsheetRow,
          {
            req,
            isSelected: selectedIds.includes(req.id),
            dragOverRowId,
            columns,
            minimizedColumns,
            columnWidths,
            isActive: activeCellEditor?.rowId === req.id,
            activeField: activeCellEditor?.rowId === req.id ? activeCellEditor.field : null,
            isLockedByOther: !!activeLocks[req.id] && activeLocks[req.id].userId !== currentUser?.id,
            lockedByName: activeLocks[req.id]?.userName ?? null,
            isPriorityOpen: showPriorityDropdownId === req.id,
            isAssigneeOpen: showAssigneeDropdownId === req.id,
            isStatusOpen: showStatusDropdownId === req.id,
            currentUser,
            assigneesPool,
            reqById,
            exchangeRates,
            activeCellEditor,
            tabDataMap,
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
            priorityRef,
            setShowAssigneeDropdownId,
            originalSetRequirements,
            assigneeRef,
            setShowStatusDropdownId,
            statusRef,
            setRequirements,
            setColumns,
            setSelectedIds,
            getCellStickyStyle
          },
          req.id,
          false,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1707,
            columnNumber: 17
          },
          this
        )),
        /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { className: "p-0 border-t border-brand-outline-variant", colSpan: columns.length + 3, children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            id: "btn-spreadsheet-add-bottom",
            onClick: handleAddRow,
            className: "w-full flex items-center justify-center gap-2 px-5 py-3 text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-primary-container/5 transition-colors text-xs font-semibold text-left select-none cursor-pointer",
            children: [
              /* @__PURE__ */ jsxDEV(Plus, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1761,
                columnNumber: 19
              }, this),
              "행 추가"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1756,
            columnNumber: 17
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1755,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1754,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1694,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Spreadsheet.tsx",
      lineNumber: 1491,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/Spreadsheet.tsx",
      lineNumber: 1490,
      columnNumber: 7
    }, this),
    showAddColumnModal && /* @__PURE__ */ jsxDEV(
      DraggableModal,
      {
        isOpen: showAddColumnModal,
        onClose: () => {
          setShowAddColumnModal(false);
          setEditingColumnDefId(null);
          setNewColumnName("");
          setNewColumnType("text");
          setNewColumnOptionsInput("");
        },
        title: editingColumnDefId ? "열 속성 변경" : "새 컬럼(열) 정의",
        children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "열 명칭 (예: 검증 결과, 메모, 담당부서)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1786,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: newColumnName,
                onChange: (e) => setNewColumnName(e.target.value),
                placeholder: "열 이름 입력...",
                autoFocus: true,
                onKeyDown: (e) => e.key === "Enter" && handleAddOrEditCustomColumn(),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1787,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1785,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "열 속성 유형 (Notion 스타일)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1799,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: newColumnType,
                onChange: (e) => setNewColumnType(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "text", children: "텍스트 (Text)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1805,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "number", children: "숫자 (Number)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1806,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "date", children: "날짜 (Date)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1807,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "checkbox", children: "체크박스 (Checkbox)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1808,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "select", children: "선택 (Select)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1809,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "status", children: "상태 (Status)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1810,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "relation", children: "관계형 (Relation)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1811,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "rollup", children: "롤업 (Rollup)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1812,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "formula", children: "수식 (Formula)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1813,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "lookup", children: "교차 탭 참조 (Lookup)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1814,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "currency_usd", children: "외화 환산 (USD)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1815,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "button", children: "버튼 (Button)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1816,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1800,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1798,
            columnNumber: 15
          }, this),
          newColumnType === "lookup" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "대상 탭 (선택 시 가져올 탭)" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1823,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: lookupTabIdInput,
                  onChange: (e) => setLookupTabIdInput(e.target.value),
                  className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "", children: "탭을 선택하세요" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1829,
                      columnNumber: 23
                    }, this),
                    tabs.map((t) => /* @__PURE__ */ jsxDEV("option", { value: t.id, children: t.sidebarLabel }, t.id, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1831,
                      columnNumber: 25
                    }, this))
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1824,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1822,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "현재 탭의 기준 열 (예: 기준/견적)" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1836,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: lookupMatchMyColIdInput,
                  onChange: (e) => setLookupMatchMyColIdInput(e.target.value),
                  className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "", children: "기준 열 선택" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1842,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "title", children: "호선명(Title)" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1843,
                      columnNumber: 23
                    }, this),
                    columns.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1845,
                      columnNumber: 25
                    }, this))
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1837,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1835,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "대상 탭의 비교할 열 (위 열과 값이 같은지 비교)" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1850,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: lookupMatchTargetColIdInput,
                  onChange: (e) => setLookupMatchTargetColIdInput(e.target.value),
                  className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                  disabled: !lookupTabIdInput,
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "", children: "비교 대상 열 선택" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1857,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "title", children: "호선명(Title)" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1858,
                      columnNumber: 23
                    }, this),
                    lookupTabIdInput && tabDataMap?.[lookupTabIdInput]?.columns?.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1860,
                      columnNumber: 25
                    }, this))
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1851,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1849,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "대상 탭에서 가져올 열의 값 (결과값)" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1865,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "select",
                {
                  value: lookupReturnTargetColIdInput,
                  onChange: (e) => setLookupReturnTargetColIdInput(e.target.value),
                  className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                  disabled: !lookupTabIdInput,
                  children: [
                    /* @__PURE__ */ jsxDEV("option", { value: "", children: "가져올 열 선택" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1872,
                      columnNumber: 23
                    }, this),
                    /* @__PURE__ */ jsxDEV("option", { value: "title", children: "호선명(Title)" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1873,
                      columnNumber: 23
                    }, this),
                    lookupTabIdInput && tabDataMap?.[lookupTabIdInput]?.columns?.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1875,
                      columnNumber: 25
                    }, this))
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1866,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1864,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1821,
            columnNumber: 17
          }, this),
          newColumnType === "formula" && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-1.5", children: [
              /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium", children: "수식 (Excel 스타일 지원)" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1885,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => setShowFormulaHelp(true),
                  className: "text-xs text-brand-primary hover:underline flex items-center gap-1 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsxDEV(HelpCircle, { className: "w-3.5 h-3.5" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 1890,
                      columnNumber: 23
                    }, this),
                    "수식 도움말"
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 1886,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1884,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: formulaInput,
                onChange: (e) => setFormulaInput(e.target.value),
                placeholder: "예: SUM([단가], [수선비]) 또는 [상태] === '완료' ? '✅' : '🚨'",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1894,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-brand-outline-variant mt-1 leading-relaxed", children: [
              /* @__PURE__ */ jsxDEV("strong", { children: "[컬럼명]" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1902,
                columnNumber: 21
              }, this),
              " 형식으로 값을 참조하고, 엑셀 함수(SUM, AVERAGE, IF 등)를 사용할 수 있습니다."
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1901,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1883,
            columnNumber: 17
          }, this),
          newColumnType === "button" && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "버튼 라벨" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1909,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: buttonLabelInput,
                onChange: (e) => setButtonLabelInput(e.target.value),
                placeholder: "예: 내가 맡기",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none mb-2"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1910,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "동작" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1917,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: buttonActionInput,
                onChange: (e) => setButtonActionInput(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "start_work", children: "담당 나로 변경 & 진행 중" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1923,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "finish_work", children: "상태 완료로 변경" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1924,
                    columnNumber: 21
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1918,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1908,
            columnNumber: 17
          }, this),
          newColumnType === "currency_usd" && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-brand-outline-variant mt-1 mb-2", children: "외환 금액을 환율 정보를 통해 환산합니다. 기준이 되는 금액 열과 화폐 열을 선택하세요." }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1931,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "금액 대상 열 (Amount)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1932,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: currencyAmountColIdInput,
                onChange: (e) => setCurrencyAmountColIdInput(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer mb-2",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "", children: "-- 컬럼 선택 --" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1938,
                    columnNumber: 21
                  }, this),
                  columns.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1940,
                    columnNumber: 23
                  }, this))
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1933,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "화폐 대상 열 (Currency)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1943,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: currencyCodeColIdInput,
                onChange: (e) => setCurrencyCodeColIdInput(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "", children: "-- 컬럼 선택 --" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1949,
                    columnNumber: 21
                  }, this),
                  columns.map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 1951,
                    columnNumber: 23
                  }, this))
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1944,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5 mt-2", children: "소수점 자리수" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1954,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "number",
                min: "0",
                max: "10",
                value: currencyDecimalPlacesInput,
                onChange: (e) => setCurrencyDecimalPlacesInput(Number(e.target.value)),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1955,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1930,
            columnNumber: 17
          }, this),
          newColumnType === "select" && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-brand-outline-variant mt-1 mb-2", children: "선택 가능한 옵션들을 쉼표(,)로 구분하여 입력하세요." }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1968,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "옵션 항목 (예: FC, NFC, TBD)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1969,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: newColumnOptionsInput,
                onChange: (e) => setNewColumnOptionsInput(e.target.value),
                placeholder: "FC, NFC, TBD",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1970,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1967,
            columnNumber: 17
          }, this),
          newColumnType === "status" && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-brand-outline-variant mt-1 mb-2", children: "할 일, 진행 중, 완료의 3단계 대분류 아래 세부 단계를 추가하여 관리합니다." }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1982,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "세부 단계 쉼표 구분 (예: 기획,디자인,개발,QA)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 1983,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: statusOptionsInput,
                onChange: (e) => setStatusOptionsInput(e.target.value),
                placeholder: "기획, 디자인, 개발, QA, 배포",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 1984,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1981,
            columnNumber: 17
          }, this),
          newColumnType === "relation" && /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-brand-outline-variant mt-1 mb-2", children: "다른 요구사항(ID)들을 연결하여 데이터를 참조합니다." }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1996,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 1995,
            columnNumber: 17
          }, this),
          newColumnType === "rollup" && /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "대상 관계형 컬럼 ID" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2002,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: rollupRelIdInput,
                onChange: (e) => setRollupRelIdInput(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "", children: "선택" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2008,
                    columnNumber: 21
                  }, this),
                  columns.filter((c) => c.type === "relation").map((c) => /* @__PURE__ */ jsxDEV("option", { value: c.id, children: c.label }, c.id, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2010,
                    columnNumber: 23
                  }, this))
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2003,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "집계 연산" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2014,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "select",
              {
                value: rollupAggTypeInput,
                onChange: (e) => setRollupAggTypeInput(e.target.value),
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV("option", { value: "count", children: "개수 세기" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2020,
                    columnNumber: 21
                  }, this),
                  /* @__PURE__ */ jsxDEV("option", { value: "percent_done", children: "완료 비율(%)" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2021,
                    columnNumber: 21
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2015,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2001,
            columnNumber: 17
          }, this),
          ["number", "formula", "rollup", "lookup"].includes(newColumnType) && /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "표시할 소수점 자릿수 (숫자의 경우, 공란 시 기본값)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2029,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "number",
                min: "0",
                max: "10",
                value: decimalPlacesInput,
                onChange: (e) => setDecimalPlacesInput(e.target.value),
                placeholder: "예: 2",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2030,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2028,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end pt-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  setShowAddColumnModal(false);
                  setEditingColumnDefId(null);
                  setNewColumnName("");
                  setNewColumnType("text");
                  setNewColumnOptionsInput("");
                },
                className: "px-4 py-1.8 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface text-xs rounded-lg cursor-pointer",
                children: "취소"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2043,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: handleAddOrEditCustomColumn,
                className: "px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer",
                children: editingColumnDefId ? "저장" : "열 생성"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2055,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2042,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 1784,
          columnNumber: 13
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 1773,
        columnNumber: 9
      },
      this
    ),
    columnToDelete && /* @__PURE__ */ jsxDEV(
      DraggableModal,
      {
        isOpen: !!columnToDelete,
        onClose: () => setColumnToDelete(null),
        title: /* @__PURE__ */ jsxDEV("span", { className: "text-brand-error", children: "열 삭제 경고" }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2071,
          columnNumber: 18
        }, this),
        icon: /* @__PURE__ */ jsxDEV(AlertCircle, { className: "w-5 h-5 text-brand-error" }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2072,
          columnNumber: 17
        }, this),
        children: [
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-brand-on-surface-variant mb-5 leading-relaxed", children: [
            /* @__PURE__ */ jsxDEV("strong", { className: "text-brand-on-surface", children: [
              "'",
              columns.find((c) => c.id === columnToDelete)?.label,
              "'"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2075,
              columnNumber: 15
            }, this),
            " 열을 삭제하시겠습니까? 관련 데이터가 모두 영구적으로 소멸되며 복구할 수 없습니다."
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2074,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setColumnToDelete(null),
                className: "px-4 py-2 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface-high text-xs rounded-lg cursor-pointer transition-colors",
                children: "취소"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2078,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: executeDeleteColumn,
                className: "px-4 py-2 bg-brand-error text-white text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer transition-opacity",
                children: "영구 삭제"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2084,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2077,
            columnNumber: 13
          }, this)
        ]
      },
      void 0,
      true,
      {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 2068,
        columnNumber: 9
      },
      this
    ),
    showAssigneeManager && /* @__PURE__ */ jsxDEV(
      DraggableModal,
      {
        isOpen: showAssigneeManager,
        onClose: () => setShowAssigneeManager(false),
        title: "담당자 풀 관리",
        icon: /* @__PURE__ */ jsxDEV(Users, { className: "w-4.5 h-4.5 text-brand-primary" }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2100,
          columnNumber: 17
        }, this),
        defaultPos: assigneeManagerPos,
        children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                value: newAssigneeName,
                onChange: (e) => setNewAssigneeName(e.target.value),
                placeholder: "새 담당자 이름 입력",
                onKeyDown: (e) => {
                  if (e.key === "Enter" && newAssigneeName.trim()) {
                    const newId = `USR-${Date.now().toString().slice(-6)}`;
                    setAssigneesPool((prev) => [...prev, { id: newId, name: newAssigneeName.trim(), avatarUrl: "" }]);
                    setNewAssigneeName("");
                  }
                },
                className: "flex-1 px-3 py-1.5 bg-brand-surface-lowest text-xs border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none placeholder:text-brand-outline-variant"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2105,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  if (newAssigneeName.trim()) {
                    const newId = `USR-${Date.now().toString().slice(-6)}`;
                    setAssigneesPool((prev) => [...prev, { id: newId, name: newAssigneeName.trim(), avatarUrl: "" }]);
                    setNewAssigneeName("");
                  }
                },
                className: "px-3 py-1.5 bg-brand-primary text-brand-on-primary rounded-lg font-semibold text-xs hover:opacity-90 cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxDEV(Plus, { className: "w-3.5 h-3.5 inline-block" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2129,
                    columnNumber: 19
                  }, this),
                  " 추가"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2119,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2104,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "max-h-60 overflow-y-auto space-y-1.5 border border-brand-outline-variant rounded-lg p-2 bg-brand-surface-low", children: [
            assigneesPool.length === 0 && /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-center p-3 text-brand-outline-variant", children: "등록된 담당자가 없습니다." }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2135,
              columnNumber: 19
            }, this),
            assigneesPool.map((a) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between p-2 hover:bg-brand-surface hover:shadow-sm rounded transition-colors group border border-transparent hover:border-brand-outline-variant bg-brand-surface-lowest", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "w-6 h-6 rounded-full bg-brand-surface-highest flex items-center justify-center text-[10px] font-bold border border-brand-outline-variant text-brand-on-surface", children: a.name.charAt(0) }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2140,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-semibold text-brand-on-surface-variant", children: a.name }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2143,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2139,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: () => {
                    if (confirm(`'${a.name}' 님을 풀에서 삭제하시겠습니까?
이 담당자가 배정된 모든 요구사항에서도 담당자가 일괄 삭제됩니다.`)) {
                      setAssigneesPool((prev) => prev.filter((x) => x.id !== a.id));
                      setRequirements((prev) => prev.map((req) => ({
                        ...req,
                        assignees: req.assignees.filter((x) => x.id !== a.id)
                      })));
                    }
                  },
                  className: "text-brand-error opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-brand-error-container/20 rounded hover:bg-brand-error-container cursor-pointer",
                  children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2157,
                    columnNumber: 23
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2145,
                  columnNumber: 21
                },
                this
              )
            ] }, a.id, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2138,
              columnNumber: 19
            }, this))
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2133,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2103,
          columnNumber: 13
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 2096,
        columnNumber: 9
      },
      this
    ),
    hoveredColumnId && hoverTitleCoords && createPortal(
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: { top: hoverTitleCoords.y, left: hoverTitleCoords.x, position: "fixed" },
          className: "bg-brand-surface-high border border-brand-outline-variant shadow-lg text-xs text-brand-on-surface px-3 py-2 rounded-lg max-w-xs z-[9999] pointer-events-none whitespace-pre-wrap animate-fade-slide-up",
          children: columns.find((c) => c.id === hoveredColumnId)?.description
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2168,
          columnNumber: 9
        },
        this
      ),
      document.body
    ),
    showFilterColumnId && filterPopupCoords && createPortal(
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          ref: filterPopupRef,
          style: { top: filterPopupCoords.top, left: filterPopupCoords.left, position: "fixed" },
          className: "mt-2 w-48 bg-brand-surface border border-brand-outline-variant rounded-lg shadow-xl p-2 z-[9999] animate-fade-slide-up",
          onMouseDown: (e) => e.stopPropagation(),
          children: /* @__PURE__ */ jsxDEV(
            "input",
            {
              type: "text",
              autoFocus: true,
              value: columnSearchTerms[showFilterColumnId] || "",
              onChange: (e) => setColumnSearchTerms((prev) => ({ ...prev, [showFilterColumnId]: e.target.value })),
              placeholder: `${columns.find((c) => c.id === showFilterColumnId)?.label || ""} 필터...`,
              className: "w-full bg-brand-surface-lowest border border-brand-outline-variant rounded p-1.5 text-xs text-brand-on-surface focus:outline-none focus:ring-1 focus:ring-brand-primary"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2185,
              columnNumber: 11
            },
            this
          )
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2179,
          columnNumber: 9
        },
        this
      ),
      document.body
    ),
    showDescriptionEditColId && /* @__PURE__ */ jsxDEV(
      DraggableModal,
      {
        isOpen: true,
        onClose: () => setShowDescriptionEditColId(null),
        title: "컬럼 설명(메모) 수정",
        children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("label", { className: "block text-xs text-brand-on-surface-variant font-medium mb-1.5", children: "설명 내용 지시 (마우스 오버 시 팝업에 표시됨)" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2206,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV(
              "textarea",
              {
                value: descriptionInput,
                onChange: (e) => setDescriptionInput(e.target.value),
                placeholder: "컬럼에 대한 보충 설명...",
                className: "w-full px-3 py-2 bg-brand-surface text-sm border border-brand-outline-variant rounded-lg focus:ring-1 focus:ring-brand-primary focus:outline-none h-24 resize-none",
                autoFocus: true
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2207,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2205,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 justify-end pt-2", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => setShowDescriptionEditColId(null),
                className: "px-4 py-1.8 border border-brand-outline-variant text-brand-on-surface-variant hover:bg-brand-surface text-xs rounded-lg cursor-pointer",
                children: "취소"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2216,
                columnNumber: 15
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  setColumns((prev) => prev.map((c) => c.id === showDescriptionEditColId ? { ...c, description: descriptionInput } : c));
                  setShowDescriptionEditColId(null);
                },
                className: "px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer",
                children: "저장"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2222,
                columnNumber: 15
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2215,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2204,
          columnNumber: 11
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 2199,
        columnNumber: 9
      },
      this
    ),
    showFormulaHelp && /* @__PURE__ */ jsxDEV(
      DraggableModal,
      {
        isOpen: showFormulaHelp,
        onClose: () => setShowFormulaHelp(false),
        title: "수식(Formula) 작성 도움말",
        children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-4 text-sm text-brand-on-surface", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-semibold text-brand-primary mb-1", children: "1. 컬럼(열) 참조 방법" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2244,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-brand-on-surface-variant", children: [
              "대괄호를 사용하여 현재 행(Row)의 다른 컬럼 값을 가져옵니다.",
              /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2246,
                columnNumber: 53
              }, this),
              '예를 들어, "수량"이라는 열이 있다면 ',
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded text-brand-primary", children: "[수량]" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2247,
                columnNumber: 39
              }, this),
              " 과 같이 작성합니다."
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2245,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2243,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-semibold text-brand-primary mb-1", children: "2. 사용 가능한 엑셀 함수" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2252,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("ul", { className: "text-xs text-brand-on-surface-variant list-disc list-inside space-y-1", children: [
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded font-mono", children: "SUM(값1, 값2, ...)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2254,
                  columnNumber: 21
                }, this),
                " : 합계"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2254,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded font-mono", children: "AVERAGE(값1, 값2, ...)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2255,
                  columnNumber: 21
                }, this),
                " : 평균"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2255,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded font-mono", children: "IF(조건, 참일때, 거짓일때)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2256,
                  columnNumber: 21
                }, this),
                " : 조건문"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2256,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded font-mono", children: "DAYS(종료일, 시작일)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2257,
                  columnNumber: 21
                }, this),
                " : 날짜 차이 (일수 계산)"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2257,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded font-mono", children: "MONTHS(종료일, 시작일)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2258,
                  columnNumber: 21
                }, this),
                " : 날짜 차이 (개월수 계산)"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2258,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2253,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2251,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-semibold text-brand-primary mb-1", children: "3. 환율 및 기본 속성" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2263,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-brand-on-surface-variant mb-1", children: [
              "상단에서 입력한 환율을 ",
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded", children: "KRW" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2265,
                columnNumber: 30
              }, this),
              ", ",
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded", children: "USD" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2265,
                columnNumber: 98
              }, this),
              ", ",
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded", children: "EUR" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2265,
                columnNumber: 166
              }, this),
              " 변수로 즉시 곱하여 사용할 수 있습니다."
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2264,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-brand-on-surface-variant", children: [
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded", children: "req" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2268,
                columnNumber: 17
              }, this),
              " 데이터 객체나 ",
              /* @__PURE__ */ jsxDEV("code", { className: "bg-brand-surface-highest px-1 rounded", children: "today" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2268,
                columnNumber: 92
              }, this),
              " 변수도 사용할 수 있습니다."
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2267,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2262,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "pt-2 border-t border-brand-outline-variant", children: [
            /* @__PURE__ */ jsxDEV("h4", { className: "font-medium text-xs mb-2", children: "실전 예시 모음" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2273,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("ul", { className: "text-xs space-y-2 font-mono bg-brand-surface-lowest p-2 border border-brand-outline-variant rounded", children: [
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-on-surface-variant", children: "// 두 열의 합계 (SUM 함수)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2275,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2275,
                  columnNumber: 95
                }, this),
                "SUM([개발 공수], [디자인 공수])"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2275,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-on-surface-variant", children: "// 환율 곱하기 (USD)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2276,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2276,
                  columnNumber: 91
                }, this),
                "[단가] * USD"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2276,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-on-surface-variant", children: "// 간단한 사칙연산" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2277,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2277,
                  columnNumber: 87
                }, this),
                "[단가] * [수량] * 1.1"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2277,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-on-surface-variant", children: "// 조건식 표현 (IF 함수)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2278,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2278,
                  columnNumber: 93
                }, this),
                "IF([우선순위] === '긴급', '🚨', '✅')"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2278,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV("li", { children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-brand-on-surface-variant", children: "// 기본 필드(status) 활용" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2279,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2279,
                  columnNumber: 95
                }, this),
                "req.status === 'DONE' ? 100 : 0"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2279,
                columnNumber: 17
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2274,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2272,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setShowFormulaHelp(false),
              className: "px-4 py-1.8 bg-brand-primary text-brand-on-primary text-xs font-semibold rounded-lg hover:opacity-90 cursor-pointer",
              children: "닫기"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2284,
              columnNumber: 15
            },
            this
          ) }, void 0, false, {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2283,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2242,
          columnNumber: 11
        }, this)
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Spreadsheet.tsx",
        lineNumber: 2237,
        columnNumber: 9
      },
      this
    ),
    superContextMenuGroup && createPortal(
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: { top: contextMenuPos.y, left: contextMenuPos.x, position: "fixed" },
          className: "mt-1 w-48 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-2xl py-1.5 z-[9999] animate-fade-slide-up flex flex-col text-xs font-semibold text-brand-on-surface",
          onMouseDown: (e) => e.stopPropagation(),
          children: /* @__PURE__ */ jsxDEV(
            "button",
            {
              className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
              onClick: () => {
                setColumns((prev) => prev.map((c) => c.groupName === superContextMenuGroup ? { ...c, groupName: void 0 } : c));
                setSuperContextMenuGroup(null);
              },
              children: [
                /* @__PURE__ */ jsxDEV(Grid, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2309,
                  columnNumber: 13
                }, this),
                "상위제목열 해제"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2302,
              columnNumber: 11
            },
            this
          )
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2297,
          columnNumber: 9
        },
        this
      ),
      document.body
    ),
    contextMenuColId && !superContextMenuGroup && createPortal(
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          style: { top: contextMenuPos.y, left: contextMenuPos.x, position: "fixed" },
          className: "mt-1 w-48 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-2xl py-1.5 z-[9999] animate-fade-slide-up flex flex-col text-xs font-semibold text-brand-on-surface",
          onMouseDown: (e) => e.stopPropagation(),
          children: [
            (() => {
              const currentMenuCol = columns.find((c) => c.id === contextMenuColId);
              if (currentMenuCol && currentMenuCol.isCustom) {
                return /* @__PURE__ */ jsxDEV("div", { className: "px-4 py-2 border-b border-brand-outline-variant/60 flex flex-col gap-1.5 mb-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-brand-on-surface-variant font-medium", children: "열 속성 지정" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2328,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDEV(
                    "select",
                    {
                      value: currentMenuCol.type || "text",
                      onChange: (e) => {
                        setColumns((prev) => prev.map((c) => c.id === contextMenuColId ? { ...c, type: e.target.value } : c));
                      },
                      className: "w-full bg-brand-surface border border-brand-outline-variant rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-primary outline-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxDEV("option", { value: "text", children: "텍스트 (Text)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2336,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "number", children: "숫자 (Number)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2337,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "date", children: "날짜 (Date)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2338,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "checkbox", children: "체크박스 (Checkbox)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2339,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "select", children: "선택 (Select)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2340,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "status", children: "상태 (Status)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2341,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "relation", children: "관계형 (Relation)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2342,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "rollup", children: "롤업 (Rollup)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2343,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "formula", children: "수식 (Formula)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2344,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "currency_usd", children: "외화 환산 (USD)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2345,
                          columnNumber: 21
                        }, this),
                        /* @__PURE__ */ jsxDEV("option", { value: "button", children: "버튼 (Button)" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2346,
                          columnNumber: 21
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2329,
                      columnNumber: 19
                    },
                    this
                  )
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2327,
                  columnNumber: 17
                }, this);
              }
              return null;
            })(),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  const blk = prompt(`'${columns.find((c) => c.id === contextMenuColId)?.label}' 열에 일괄 입력할 값을 입력하세요:
이 작업은 모든 행에 적용됩니다.`);
                  if (blk !== null) {
                    const updatedReqs = requirements.map((req) => {
                      if (["id", "title", "priority", "status", "dueDate"].includes(contextMenuColId)) {
                        return { ...req, [contextMenuColId]: blk };
                      } else if (contextMenuColId === "assignees") {
                        return req;
                      } else {
                        return { ...req, customColumns: { ...req.customColumns, [contextMenuColId]: blk } };
                      }
                    });
                    originalSetRequirements(updatedReqs);
                    saveState(updatedReqs);
                    setContextMenuColId(null);
                  }
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Edit2, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2374,
                    columnNumber: 13
                  }, this),
                  "일괄 데이터 입력"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2354,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  setColumns((prev) => prev.map(
                    (c) => c.id === contextMenuColId ? { ...c, alignment: c.alignment === "center" ? "left" : "center" } : c
                  ));
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(AlignJustify, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2389,
                    columnNumber: 13
                  }, this),
                  columns.find((c) => c.id === contextMenuColId)?.alignment === "center" ? "기본 정렬 (좌측)" : "가운데 정렬"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2378,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  setMinimizedColumns((p) => ({ ...p, [contextMenuColId]: !p[contextMenuColId] }));
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(ArrowUpDown, { className: "w-3.5 h-3.5 text-brand-outline-variant rotate-90" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2400,
                    columnNumber: 13
                  }, this),
                  minimizedColumns[contextMenuColId] ? "열 펼치기" : "열 숨기기"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2393,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  if (frozenColumnId === contextMenuColId) {
                    setFrozenColumnId(null);
                  } else {
                    setFrozenColumnId(contextMenuColId);
                  }
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Maximize2, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2415,
                    columnNumber: 13
                  }, this),
                  frozenColumnId === contextMenuColId ? "고정 해제" : "여기까지 틀 고정"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2404,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  handleSort(contextMenuColId);
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(ArrowUpDown, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2426,
                    columnNumber: 13
                  }, this),
                  "정렬"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2419,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  setShowFilterColumnId(contextMenuColId);
                  setFilterPopupCoords({ top: contextMenuPos.y + 10, left: contextMenuPos.x + 10 });
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Filter, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2438,
                    columnNumber: 13
                  }, this),
                  "필터"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2430,
                columnNumber: 11
              },
              this
            ),
            selectedColumnIds.length > 1 && selectedColumnIds.includes(contextMenuColId) && /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  const grp = prompt("병합할 상위 컬럼명(LV.1)을 입력하세요:");
                  if (grp !== null && grp.trim() !== "") {
                    setColumns((prev) => prev.map((c) => selectedColumnIds.includes(c.id) ? { ...c, groupName: grp.trim() } : c));
                    setSelectedColumnIds([]);
                    setContextMenuColId(null);
                  }
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Grid, { className: "w-3.5 h-3.5 text-brand-primary" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2454,
                    columnNumber: 15
                  }, this),
                  "상위 컬럼으로 병합 (LV.1)"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2443,
                columnNumber: 13
              },
              this
            ),
            columns.find((c) => c.id === contextMenuColId)?.groupName && /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  setColumns((prev) => prev.map((c) => c.id === contextMenuColId ? { ...c, groupName: void 0 } : c));
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Grid, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2467,
                    columnNumber: 15
                  }, this),
                  "병합 해제"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2460,
                columnNumber: 13
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  setShowDescriptionEditColId(contextMenuColId);
                  setDescriptionInput(columns.find((c) => c.id === contextMenuColId)?.description || "");
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(HelpCircle, { className: "w-3.5 h-3.5 text-brand-outline-variant" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2480,
                    columnNumber: 13
                  }, this),
                  "열 설명(메모) 수정"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2472,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-surface flex items-center gap-2 cursor-pointer transition-colors text-brand-primary",
                onClick: () => {
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
                    setCurrencyDecimalPlacesInput(col.currencyDecimalPlaces || 0);
                    setRollupRelIdInput(col.rollupRelId || "");
                    setRollupAggTypeInput(col.rollupAggType || "count");
                    setStatusOptionsInput(col.type === "status" ? col.options?.join(", ") || "" : "아이디어,기획,디자인,개발,QA,배포");
                    setLookupTabIdInput(col.lookupTabId || "");
                    setLookupMatchMyColIdInput(col.lookupMatchMyColId || "");
                    setLookupMatchTargetColIdInput(col.lookupMatchTargetColId || "");
                    setLookupReturnTargetColIdInput(col.lookupReturnTargetColId || "");
                    setDecimalPlacesInput(col.decimalPlaces !== void 0 ? String(col.decimalPlaces) : "");
                  }
                  setShowAddColumnModal(true);
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(Layers, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2512,
                    columnNumber: 13
                  }, this),
                  "열 속성 변경"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2484,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "h-px bg-brand-outline-variant my-1 mx-2" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2515,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                className: "w-full px-4 py-2 text-left hover:bg-brand-error-container text-brand-error flex items-center gap-2 cursor-pointer transition-colors",
                onClick: () => {
                  handleDeleteCustomColumn(contextMenuColId);
                  setContextMenuColId(null);
                },
                children: [
                  /* @__PURE__ */ jsxDEV(X, { className: "w-3.5 h-3.5" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2523,
                    columnNumber: 13
                  }, this),
                  "열 삭제"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2516,
                columnNumber: 11
              },
              this
            )
          ]
        },
        void 0,
        true,
        {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2318,
          columnNumber: 9
        },
        this
      ),
      document.body
    )
  ] }, void 0, true, {
    fileName: "/app/applet/src/components/Spreadsheet.tsx",
    lineNumber: 1322,
    columnNumber: 5
  }, this);
}
const formulaCache = /* @__PURE__ */ new Map();
const SUM = (...args) => args.reduce((a, b) => a + (Number(b) || 0), 0);
const AVERAGE = (...args) => args.length ? SUM(...args) / args.length : 0;
const IF = (condition, trueVal, falseVal) => condition ? trueVal : falseVal;
const DAYS = (d1, d2) => {
  if (!d1 || !d2) return "";
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return "";
  return Math.round((date1.getTime() - date2.getTime()) / (1e3 * 60 * 60 * 24));
};
const MONTHS = (d1, d2) => {
  if (!d1 || !d2) return "";
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return "";
  const diffMonths = (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth());
  return diffMonths;
};
const getFormulaFn = (f, columns) => {
  const cacheKey = f + "|" + columns.map((c) => c.id).join(",");
  if (!formulaCache.has(cacheKey)) {
    try {
      let parsed = f;
      columns.forEach((c) => {
        const safeLabel = c.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\[${safeLabel}\\]`, "g");
        if (["title", "dueDate", "createdAt", "status", "priority"].includes(c.id)) {
          parsed = parsed.replace(re, `(req.${c.id} || '')`);
        } else {
          parsed = parsed.replace(re, `(isNaN(Number(req.customColumns?.['${c.id}'])) ? (req.customColumns?.['${c.id}'] || '') : Number(req.customColumns?.['${c.id}']))`);
        }
      });
      formulaCache.set(cacheKey, new Function("req", "today", "SUM", "AVERAGE", "IF", "DAYS", "MONTHS", "KRW", "USD", "EUR", `try { return ${parsed || '""'}; } catch(e) { return "Error"; }`));
    } catch {
      formulaCache.set(cacheKey, () => "Error");
    }
  }
  return formulaCache.get(cacheKey);
};
const SpreadsheetRow = React.memo(function SpreadsheetRow2({
  req,
  isSelected,
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
  priorityRef,
  setShowAssigneeDropdownId,
  originalSetRequirements,
  assigneeRef,
  setShowStatusDropdownId,
  statusRef,
  setRequirements,
  setColumns,
  setSelectedIds,
  getCellStickyStyle
}) {
  const isDone = req.status === "DONE";
  let rowTextColorClass = "text-brand-on-surface";
  if (req.status === "DONE") rowTextColorClass = "text-brand-on-surface-variant/50";
  else if (req.status === "IN_PROGRESS") rowTextColorClass = "text-green-700 font-medium";
  return /* @__PURE__ */ jsxDEV(
    "tr",
    {
      id: `req-row-${req.id}`,
      onDragOver: (e) => handleRowDragOver(e, req.id),
      onDrop: (e) => handleRowDrop(e, req.id),
      className: `spreadsheet-row hover:bg-brand-surface-low border-b border-brand-outline-variant transition-colors duration-150 group ${rowTextColorClass} ${isSelected ? "bg-brand-primary-container/10" : ""} ${dragOverRowId === req.id ? "border-t-2 border-t-brand-primary bg-brand-surface-high/30" : ""}`,
      children: [
        /* @__PURE__ */ jsxDEV("td", { style: getCellStickyStyle("index"), className: `p-2 border-r border-brand-outline-variant text-center w-10 text-brand-on-surface-variant/40`, children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col flex-wrap justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                handleDuplicateRow(req.id, req.id);
              },
              className: "hover:text-brand-primary cursor-pointer transition-colors",
              title: "템플릿 복제",
              children: /* @__PURE__ */ jsxDEV(Copy, { className: "w-3.5 h-3.5" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2649,
                columnNumber: 27
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2644,
              columnNumber: 25
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              draggable: true,
              onDragStart: (e) => handleRowDragStart(e, req.id),
              className: "cursor-grab active:cursor-grabbing hover:text-brand-primary transition-colors flex items-center justify-center p-0.5",
              title: "드래그하여 행 이동 (Alt 키를 누르고 드래그 시 복제)",
              children: /* @__PURE__ */ jsxDEV(GripVertical, { className: "w-4 h-4" }, void 0, false, {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2657,
                columnNumber: 27
              }, this)
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2651,
              columnNumber: 25
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2643,
          columnNumber: 23
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2642,
          columnNumber: 21
        }, this),
        /* @__PURE__ */ jsxDEV("td", { style: getCellStickyStyle("checkbox"), className: `p-3 border-r border-brand-outline-variant text-center select-none align-middle`, children: /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "w-4 h-4 mx-auto inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors",
            onClick: () => handleSelectRow(req.id, !isSelected),
            children: isSelected && /* @__PURE__ */ jsxDEV(Check, { className: "w-3 h-3 text-brand-on-surface", strokeWidth: 4 }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2668,
              columnNumber: 40
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 2664,
            columnNumber: 23
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 2663,
          columnNumber: 21
        }, this),
        columns.map((col) => {
          const isMinimized = minimizedColumns[col.id];
          const width = isMinimized ? 24 : columnWidths[col.id] || 150;
          const baseStickyStyle = getCellStickyStyle(col.id);
          const textAlignStyle = col.alignment ? { textAlign: col.alignment } : {};
          const cellStyle = { width, minWidth: width, maxWidth: width, ...baseStickyStyle, ...textAlignStyle };
          const shadowClass = "";
          if (isMinimized) {
            return /* @__PURE__ */ jsxDEV(
              "td",
              {
                style: cellStyle,
                className: `px-0 py-2 border-r border-brand-outline-variant align-middle text-center hover:bg-brand-surface-high/20 transition-colors cursor-pointer ${shadowClass}`,
                onClick: () => setMinimizedColumns((p) => ({ ...p, [col.id]: false })),
                title: "열 펼치기 (클릭)",
                children: /* @__PURE__ */ jsxDEV("span", { className: "text-brand-outline-variant select-none tracking-widest text-[10px] font-bold mx-auto flex justify-center w-full", children: "..." }, void 0, false, {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2690,
                  columnNumber: 29
                }, this)
              },
              col.id,
              false,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2683,
                columnNumber: 27
              },
              this
            );
          }
          if (col.id === "id") {
            const isEditing = isActive && activeField === "id";
            return /* @__PURE__ */ jsxDEV(
              "td",
              {
                style: cellStyle,
                onClick: () => {
                  if (isLockedByOther) {
                    alert(`현재 ${lockedByName} 님이 편집 중이므로 접근할 수 없습니다.`);
                    return;
                  }
                  setActiveCellEditor({ rowId: req.id, field: "id" });
                },
                className: `px-4 py-2 border-r border-brand-outline-variant font-mono text-[13px] text-brand-on-surface-variant font-medium ${isLockedByOther ? "cursor-not-allowed bg-brand-surface-high/30" : "cursor-text hover:bg-brand-primary/5"} transition-colors whitespace-normal break-words align-top relative ${shadowClass}`,
                title: isLockedByOther ? `${lockedByName} 님이 편집 중` : void 0,
                children: [
                  isLockedByOther && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 right-1 opacity-70", title: `${lockedByName} 님이 편집 중`, children: /* @__PURE__ */ jsxDEV(Lock, { className: "w-3.5 h-3.5 text-brand-error" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2715,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2714,
                    columnNumber: 31
                  }, this),
                  isEditing && /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "text",
                      defaultValue: req.id,
                      autoFocus: true,
                      onBlur: (e) => {
                        updateRequirementField(req.id, "id", e.target.value.trim() || req.id);
                        setActiveCellEditor(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter") {
                          updateRequirementField(req.id, "id", e.currentTarget.value.trim() || req.id);
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      },
                      className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md uppercase font-mono font-medium"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2719,
                      columnNumber: 31
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV("div", { className: isEditing ? "opacity-0" : "", children: req.id }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2737,
                    columnNumber: 29
                  }, this)
                ]
              },
              col.id,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2700,
                columnNumber: 27
              },
              this
            );
          }
          if (col.id === "title") {
            const isEditing = isActive && activeField === "title";
            return /* @__PURE__ */ jsxDEV(
              "td",
              {
                style: cellStyle,
                onClick: () => {
                  if (isLockedByOther) {
                    alert(`현재 ${lockedByName} 님이 편집 중이므로 접근할 수 없습니다.`);
                    return;
                  }
                  setActiveCellEditor({ rowId: req.id, field: "title" });
                },
                className: `px-4 py-2 border-r border-brand-outline-variant duration-300 ${isLockedByOther ? "cursor-not-allowed bg-brand-surface-high/30" : "cursor-text hover:bg-brand-surface-high/20"} transition-colors whitespace-pre-wrap break-words align-top relative ${shadowClass}`,
                title: isLockedByOther ? `${lockedByName} 님이 편집 중` : void 0,
                children: [
                  isLockedByOther && /* @__PURE__ */ jsxDEV("div", { className: "absolute top-1 right-1 opacity-70", title: `${lockedByName} 님이 편집 중`, children: /* @__PURE__ */ jsxDEV(Lock, { className: "w-3.5 h-3.5 text-brand-error" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2764,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2763,
                    columnNumber: 31
                  }, this),
                  isEditing && /* @__PURE__ */ jsxDEV(
                    "textarea",
                    {
                      defaultValue: req.title,
                      autoFocus: true,
                      onPaste: (e) => handleGridPaste(e, req.id, col.id),
                      onBlur: (e) => {
                        updateRequirementField(req.id, "title", e.target.value);
                        setActiveCellEditor(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          updateRequirementField(req.id, "title", e.currentTarget.value);
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      },
                      className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-sm px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md resize-none font-medium"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2768,
                      columnNumber: 31
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV("div", { className: `font-medium h-full w-full ${isEditing ? "opacity-0" : ""}`, children: req.title || /* @__PURE__ */ jsxDEV("span", { className: "opacity-0", children: "-" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2787,
                    columnNumber: 45
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2786,
                    columnNumber: 29
                  }, this)
                ]
              },
              col.id,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2749,
                columnNumber: 27
              },
              this
            );
          }
          if (col.id === "priority") {
            const badgeColors = {
              HIGH: "bg-brand-error-container text-brand-on-error-container",
              MEDIUM: "bg-brand-surface-highest text-brand-on-surface-variant",
              LOW: "bg-brand-surface-high text-brand-outline/80"
            };
            const labels = { HIGH: "높음", MEDIUM: "중간", LOW: "낮음" };
            return /* @__PURE__ */ jsxDEV("td", { style: cellStyle, className: `px-4 py-2 border-r border-brand-outline-variant relative align-top ${shadowClass}`, children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    setShowPriorityDropdownId(isPriorityOpen ? null : req.id);
                  },
                  className: "font-semibold text-[11px] px-2 py-0.5 rounded cursor-pointer transition-transform hover:scale-105 inline-flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsxDEV("span", { className: `px-2 py-0.5 rounded ${badgeColors[req.priority] || badgeColors.MEDIUM}`, children: labels[req.priority] || "중간" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2811,
                      columnNumber: 31
                    }, this),
                    /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-3 h-3 text-brand-outline-variant" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2814,
                      columnNumber: 31
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2804,
                  columnNumber: 29
                },
                this
              ),
              isPriorityOpen && /* @__PURE__ */ jsxDEV(
                "div",
                {
                  ref: priorityRef,
                  className: "absolute left-4 mt-1 w-24 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-xl py-1 z-30 animate-fade-slide-up text-xs font-medium",
                  children: ["HIGH", "MEDIUM", "LOW"].map((p) => /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        updateRequirementField(req.id, "priority", p);
                        setShowPriorityDropdownId(null);
                      },
                      className: "w-full text-left px-3 py-1.5 text-brand-on-surface hover:bg-brand-surface flex items-center justify-between cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxDEV("span", { children: labels[p] }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2832,
                          columnNumber: 37
                        }, this),
                        req.priority === p && /* @__PURE__ */ jsxDEV(Check, { className: "w-3 h-3 text-brand-primary" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2833,
                          columnNumber: 60
                        }, this)
                      ]
                    },
                    p,
                    true,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2824,
                      columnNumber: 35
                    },
                    this
                  ))
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2819,
                  columnNumber: 31
                },
                this
              )
            ] }, col.id, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2803,
              columnNumber: 27
            }, this);
          }
          if (col.id === "assignees") {
            return /* @__PURE__ */ jsxDEV("td", { style: cellStyle, className: `px-4 py-2 border-r border-brand-outline-variant relative align-top whitespace-normal ${shadowClass}`, children: [
              /* @__PURE__ */ jsxDEV(
                "div",
                {
                  onClick: () => setShowAssigneeDropdownId(isAssigneeOpen ? null : req.id),
                  className: "flex flex-col items-center gap-1.5 cursor-pointer hover:bg-brand-surface-high/30 p-1.5 rounded transition-colors w-full min-h-[40px]",
                  children: req.assignees.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] text-brand-outline-variant italic", children: "담당자 없음" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2851,
                    columnNumber: 33
                  }, this) : req.assignees.map((a, idx) => /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      className: "inline-flex items-center justify-center px-2 py-1 bg-brand-surface-highest text-brand-on-surface border border-brand-outline-variant rounded-full text-[11px] font-semibold tracking-wide w-full h-auto whitespace-normal break-words text-center",
                      title: a.name,
                      children: a.name
                    },
                    a.id,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2854,
                      columnNumber: 35
                    },
                    this
                  ))
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2846,
                  columnNumber: 29
                },
                this
              ),
              isAssigneeOpen && /* @__PURE__ */ jsxDEV(
                "div",
                {
                  ref: assigneeRef,
                  className: "absolute left-6 mt-1 w-52 bg-brand-surface-high border border-brand-outline-variant rounded-xl shadow-xl p-3 z-30 animate-fade-slide-up text-xs font-semibold",
                  children: [
                    /* @__PURE__ */ jsxDEV("p", { className: "text-[11px] text-brand-outline mb-2 pb-1 border-b border-brand-outline-variant", children: [
                      "담당자 배정 (",
                      req.assignees.length,
                      "명)"
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2871,
                      columnNumber: 33
                    }, this),
                    /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 max-h-48 overflow-y-auto", children: assigneesPool.map((member) => {
                      const isAssigned = req.assignees.some((a) => a.id === member.id);
                      return /* @__PURE__ */ jsxDEV(
                        "label",
                        {
                          className: "flex items-center gap-2 p-1.5 hover:bg-brand-surface rounded cursor-pointer text-brand-on-surface-variant hover:text-brand-on-surface transition-colors",
                          children: [
                            /* @__PURE__ */ jsxDEV(
                              "div",
                              {
                                className: "w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center rounded border border-brand-outline-variant transition-colors",
                                children: isAssigned && /* @__PURE__ */ jsxDEV(Check, { className: "w-2.5 h-2.5 text-brand-on-surface", strokeWidth: 4 }, void 0, false, {
                                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                                  lineNumber: 2885,
                                  columnNumber: 60
                                }, this)
                              },
                              void 0,
                              false,
                              {
                                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                                lineNumber: 2882,
                                columnNumber: 43
                              },
                              this
                            ),
                            /* @__PURE__ */ jsxDEV(
                              "input",
                              {
                                type: "checkbox",
                                className: "hidden",
                                checked: isAssigned,
                                onChange: (e) => {
                                  if (e.target.checked) {
                                    const newAssignees = [...req.assignees, member];
                                    originalSetRequirements((prev) => prev.map((r) => r.id === req.id ? { ...r, assignees: newAssignees } : r));
                                  } else {
                                    const newAssignees = req.assignees.filter((a) => a.id !== member.id);
                                    originalSetRequirements((prev) => prev.map((r) => r.id === req.id ? { ...r, assignees: newAssignees } : r));
                                  }
                                }
                              },
                              void 0,
                              false,
                              {
                                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                                lineNumber: 2888,
                                columnNumber: 43
                              },
                              this
                            ),
                            /* @__PURE__ */ jsxDEV("span", { children: member.name }, void 0, false, {
                              fileName: "/app/applet/src/components/Spreadsheet.tsx",
                              lineNumber: 2902,
                              columnNumber: 41
                            }, this)
                          ]
                        },
                        member.id,
                        true,
                        {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2878,
                          columnNumber: 39
                        },
                        this
                      );
                    }) }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2874,
                      columnNumber: 33
                    }, this)
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2867,
                  columnNumber: 31
                },
                this
              )
            ] }, col.id, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2845,
              columnNumber: 27
            }, this);
          }
          if (col.id === "dueDate") {
            const isEditing = isActive && activeField === "dueDate";
            return /* @__PURE__ */ jsxDEV(
              "td",
              {
                style: cellStyle,
                onClick: () => setActiveCellEditor({ rowId: req.id, field: "dueDate" }),
                className: `px-4 py-2 border-r border-brand-outline-variant text-[13px] text-brand-on-surface-variant hover:bg-brand-surface-high/10 cursor-pointer align-top relative ${shadowClass}`,
                children: [
                  isEditing && /* @__PURE__ */ jsxDEV(
                    "input",
                    {
                      type: "date",
                      defaultValue: req.dueDate,
                      autoFocus: true,
                      onPaste: (e) => handleGridPaste(e, req.id, col.id),
                      onBlur: (e) => {
                        updateRequirementField(req.id, "dueDate", e.target.value || req.dueDate);
                        setActiveCellEditor(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter") {
                          updateRequirementField(req.id, "dueDate", e.currentTarget.value || req.dueDate);
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      },
                      className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2925,
                      columnNumber: 31
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV("div", { className: isEditing ? "opacity-0" : "", children: req.dueDate }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2944,
                    columnNumber: 29
                  }, this)
                ]
              },
              col.id,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 2918,
                columnNumber: 27
              },
              this
            );
          }
          if (col.id === "status") {
            const statusColors = {
              TODO: "border border-brand-outline-variant text-brand-on-surface-variant bg-brand-surface/40",
              IN_PROGRESS: "bg-brand-primary-container/20 text-brand-primary",
              DONE: "bg-brand-success-container/30 text-brand-success"
            };
            const labels = { TODO: "미검토", IN_PROGRESS: "검토중", DONE: "검토완료" };
            return /* @__PURE__ */ jsxDEV("td", { style: cellStyle, className: `px-4 py-2 border-r border-brand-outline-variant relative align-top ${shadowClass}`, children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    setShowStatusDropdownId(isStatusOpen ? null : req.id);
                  },
                  className: "cursor-pointer transition-transform hover:scale-105",
                  children: /* @__PURE__ */ jsxDEV("span", { className: `inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium leading-none ${statusColors[req.status] || statusColors.TODO}`, children: [
                    req.status === "DONE" && /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 bg-brand-success rounded-full" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2971,
                      columnNumber: 35
                    }, this),
                    req.status === "IN_PROGRESS" && /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 bg-brand-primary rounded-full animate-ping" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2974,
                      columnNumber: 35
                    }, this),
                    req.status === "TODO" && /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 bg-brand-brand-outline rounded-full bg-brand-outline opacity-60" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2977,
                      columnNumber: 35
                    }, this),
                    labels[req.status] || "대기 중",
                    /* @__PURE__ */ jsxDEV(ChevronDown, { className: "w-3 h-3 opacity-60 ml-0.5" }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2980,
                      columnNumber: 33
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 2969,
                    columnNumber: 31
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2962,
                  columnNumber: 29
                },
                this
              ),
              isStatusOpen && /* @__PURE__ */ jsxDEV(
                "div",
                {
                  ref: statusRef,
                  className: "absolute left-4 mt-1 w-28 bg-brand-surface-high border border-brand-outline-variant rounded-lg shadow-xl py-1 z-30 animate-fade-slide-up text-xs font-semibold",
                  children: ["TODO", "IN_PROGRESS", "DONE"].map((st) => /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => {
                        updateRequirementField(req.id, "status", st);
                        setShowStatusDropdownId(null);
                      },
                      className: "w-full text-left px-3 py-2 text-brand-on-surface hover:bg-brand-surface flex items-center justify-between cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsxDEV("span", { children: labels[st] }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 2999,
                          columnNumber: 37
                        }, this),
                        req.status === st && /* @__PURE__ */ jsxDEV(Check, { className: "w-3 h-3 text-brand-primary" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3e3,
                          columnNumber: 59
                        }, this)
                      ]
                    },
                    st,
                    true,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 2991,
                      columnNumber: 35
                    },
                    this
                  ))
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 2986,
                  columnNumber: 31
                },
                this
              )
            ] }, col.id, true, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 2961,
              columnNumber: 27
            }, this);
          }
          if (col.isCustom) {
            let cellVal = req.customColumns?.[col.id] || "";
            const isEditing = isActive && activeField === col.id;
            if (col.type === "checkbox") {
              const isChecked = cellVal === "true";
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant text-center align-middle ${shadowClass}`,
                  children: /* @__PURE__ */ jsxDEV(
                    "div",
                    {
                      className: "w-4 h-4 mx-auto inline-flex items-center justify-center rounded border border-gray-500 bg-transparent cursor-pointer transition-colors",
                      onClick: () => updateRequirementField(req.id, col.id, isChecked ? "false" : "true"),
                      children: isChecked && /* @__PURE__ */ jsxDEV(Check, { className: "w-3 h-3 text-brand-on-surface", strokeWidth: 4 }, void 0, false, {
                        fileName: "/app/applet/src/components/Spreadsheet.tsx",
                        lineNumber: 3027,
                        columnNumber: 47
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3023,
                      columnNumber: 31
                    },
                    this
                  )
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3018,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "button") {
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant text-center align-middle ${shadowClass}`,
                  children: /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        if (col.buttonAction === "start_work") {
                          if (req.assignees.length === 0 && assigneesPool.length > 0) {
                            updateRequirementField(req.id, "assignees", [assigneesPool[0]]);
                          }
                          updateRequirementField(req.id, "status", "IN_PROGRESS");
                        } else if (col.buttonAction === "finish_work") {
                          updateRequirementField(req.id, "status", "DONE");
                        }
                      },
                      className: "px-3 py-1 bg-brand-surface-high border border-brand-outline hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary rounded text-xs transition-colors whitespace-nowrap",
                      children: col.buttonLabel || "실행"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3040,
                      columnNumber: 31
                    },
                    this
                  )
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3035,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "currency_usd") {
              const amountCol = col.currencyAmountColId ? columns.find((c) => c.id === col.currencyAmountColId) : columns.find((c) => c.label.includes("금액"));
              const currencyCol = col.currencyCodeColId ? columns.find((c) => c.id === col.currencyCodeColId) : columns.find((c) => c.label.includes("화폐"));
              let result = "";
              if (amountCol && currencyCol) {
                const rawAmountStr = String(req.customColumns?.[amountCol.id] || "0").replace(/[^0-9.-]+/g, "");
                const amount = Number(rawAmountStr) || 0;
                const curr = String(req.customColumns?.[currencyCol.id] || "").toUpperCase();
                let krwValue = amount;
                if (curr.includes("WON") || curr.includes("KRW")) {
                  krwValue = amount;
                } else if (curr.includes("EUR")) {
                  krwValue = amount * exchangeRates.EUR;
                } else if (curr.includes("US") || curr.includes("USD")) {
                  krwValue = amount * exchangeRates.USD;
                }
                const usdValue = krwValue / exchangeRates.USD;
                const fractionDigits = col.currencyDecimalPlaces !== void 0 ? col.currencyDecimalPlaces : 0;
                result = isNaN(usdValue) ? "N/A" : "$" + usdValue.toLocaleString(void 0, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
              } else {
                result = "N/A (금액/화폐 열 필요)";
              }
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top text-brand-primary font-bold bg-brand-surface-lowest/50 ${shadowClass}`,
                  children: result
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3083,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "lookup") {
              let result = "";
              const targetTab = tabDataMap?.[col.lookupTabId || ""];
              if (targetTab && col.lookupMatchMyColId && col.lookupMatchTargetColId && col.lookupReturnTargetColId) {
                const myVal = col.lookupMatchMyColId === "title" ? req.title : req.customColumns?.[col.lookupMatchMyColId];
                if (myVal) {
                  const matchedReq = targetTab?.requirements?.find((r) => {
                    const tVal = col.lookupMatchTargetColId === "title" ? r.title : r.customColumns?.[col.lookupMatchTargetColId];
                    return tVal === myVal;
                  });
                  if (matchedReq) {
                    result = col.lookupReturnTargetColId === "title" ? matchedReq.title : matchedReq.customColumns?.[col.lookupReturnTargetColId] || "";
                    if (result && !isNaN(Number(result)) && col.decimalPlaces !== void 0) result = String(Number(result).toFixed(col.decimalPlaces));
                  }
                }
              }
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top text-brand-on-surface bg-brand-surface-lowest/30 relative ${shadowClass}`,
                  children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 opacity-80", children: /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] bg-brand-surface-highest px-1.5 py-0.5 rounded text-brand-on-surface-variant whitespace-nowrap overflow-hidden text-ellipsis flex-1", children: result || "-" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 3117,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 3116,
                    columnNumber: 31
                  }, this)
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3111,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "formula") {
              let result = "";
              try {
                const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
                const func = getFormulaFn(col.formula || '""', columns);
                result = String(func(req, today, SUM, AVERAGE, IF, DAYS, MONTHS, exchangeRates.KRW, exchangeRates.USD, exchangeRates.EUR));
              } catch (e) {
                result = "Error";
              }
              if (result !== "Error" && result !== "" && !isNaN(Number(result)) && col.decimalPlaces !== void 0) {
                result = Number(result).toFixed(col.decimalPlaces);
              }
              const isFormulaEditing = activeCellEditor?.rowId === "FORMULA_" + col.id && activeCellEditor?.field === col.id;
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  onClick: () => {
                    setActiveCellEditor({ rowId: "FORMULA_" + col.id, field: col.id });
                  },
                  title: "클릭하여 해당 열의 수식을 수정합니다",
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top text-brand-primary font-medium bg-brand-surface-lowest/50 cursor-text hover:bg-brand-surface-high/20 transition-colors relative ${shadowClass}`,
                  children: isFormulaEditing ? /* @__PURE__ */ jsxDEV(
                    "textarea",
                    {
                      defaultValue: col.formula || "",
                      autoFocus: true,
                      onBlur: (e) => {
                        const newFormula = e.target.value;
                        setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, formula: newFormula } : c));
                        setActiveCellEditor(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const newFormula = e.currentTarget.value;
                          setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, formula: newFormula } : c));
                          setActiveCellEditor(null);
                        } else if (e.key === "Escape") {
                          setActiveCellEditor(null);
                        }
                      },
                      className: "w-full h-full bg-brand-surface border border-brand-primary absolute inset-0 z-10 p-2 text-brand-on-surface font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/50 text-left resize-none"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3149,
                      columnNumber: 33
                    },
                    this
                  ) : result
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3139,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "relation") {
              const relIds = cellVal.split(",").map((s) => s.trim()).filter(Boolean);
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  onClick: () => setActiveCellEditor({ rowId: req.id, field: col.id }),
                  className: `px-4 py-2 border-r border-brand-outline-variant cursor-text hover:bg-brand-surface-high/20 transition-colors align-top relative ${shadowClass}`,
                  children: [
                    isEditing && /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "text",
                        defaultValue: cellVal,
                        autoFocus: true,
                        onBlur: (e) => {
                          updateRequirementField(req.id, col.id, e.target.value);
                          setActiveCellEditor(null);
                        },
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            updateRequirementField(req.id, col.id, e.currentTarget.value);
                            setActiveCellEditor(null);
                          }
                          if (e.key === "Escape") setActiveCellEditor(null);
                        },
                        placeholder: "REQ-002, REQ-003...",
                        className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-xs px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/Spreadsheet.tsx",
                        lineNumber: 3186,
                        columnNumber: 33
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("div", { className: `flex flex-wrap gap-1 ${isEditing ? "opacity-0" : ""}`, children: [
                      relIds.length === 0 && /* @__PURE__ */ jsxDEV("span", { className: "opacity-35 italic font-light", children: "-" }, void 0, false, {
                        fileName: "/app/applet/src/components/Spreadsheet.tsx",
                        lineNumber: 3206,
                        columnNumber: 57
                      }, this),
                      relIds.map((rid) => {
                        const linkedReq = reqById.get(rid);
                        if (!linkedReq) return /* @__PURE__ */ jsxDEV("span", { className: "text-brand-error text-[10px] border border-brand-error/20 bg-brand-error/10 px-1 rounded", children: [
                          rid,
                          " 없음"
                        ] }, rid, true, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3209,
                          columnNumber: 58
                        }, this);
                        return /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-medium bg-brand-tertiary/10 text-brand-tertiary border border-brand-tertiary/30 px-1 py-0.5 rounded flex items-center gap-1 leading-none shadow-sm", children: [
                          "🔗 ",
                          linkedReq.title.slice(0, 10)
                        ] }, rid, true, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3211,
                          columnNumber: 37
                        }, this);
                      })
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3205,
                      columnNumber: 31
                    }, this)
                  ]
                },
                col.id,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3179,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "rollup") {
              const relColVal = req.customColumns?.[col.rollupRelId || ""] || "";
              const relIds = relColVal.split(",").map((s) => s.trim()).filter(Boolean);
              const linkedReqs = relIds.map((rid) => reqById.get(rid)).filter(Boolean);
              let resultStr = "-";
              if (linkedReqs.length > 0) {
                if (col.rollupAggType === "count") {
                  resultStr = linkedReqs.length.toString();
                } else if (col.rollupAggType === "percent_done") {
                  const doneCount = linkedReqs.filter((r) => r.status === "DONE").length;
                  resultStr = `${Math.round(doneCount / linkedReqs.length * 100)}%`;
                }
              }
              if (resultStr !== "-" && !resultStr.includes("%") && !isNaN(Number(resultStr)) && col.decimalPlaces !== void 0) {
                resultStr = Number(resultStr).toFixed(col.decimalPlaces);
              }
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top text-[13px] text-brand-on-surface-variant font-bold bg-brand-surface-lowest/50 ${shadowClass}`,
                  children: resultStr
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3241,
                  columnNumber: 30
                },
                this
              );
            }
            if (col.type === "status") {
              const options = col.options || [];
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top relative ${shadowClass}`,
                  children: /* @__PURE__ */ jsxDEV(
                    "select",
                    {
                      value: cellVal,
                      onChange: (e) => updateRequirementField(req.id, col.id, e.target.value),
                      className: "w-full bg-brand-surface border border-transparent hover:border-brand-primary text-brand-on-surface text-[13px] text-center font-medium rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary appearance-none transition-colors",
                      children: [
                        /* @__PURE__ */ jsxDEV("option", { value: "", children: "- 상태 선택 -" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3264,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV("optgroup", { label: "할 일 (TODO)", children: options.filter((_, i) => i < options.length / 3).map((opt) => /* @__PURE__ */ jsxDEV("option", { value: opt, children: opt }, opt, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3267,
                          columnNumber: 37
                        }, this)) }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3265,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV("optgroup", { label: "진행 중 (IN PROGRESS)", children: options.filter((_, i) => i >= options.length / 3 && i < options.length / 3 * 2).map((opt) => /* @__PURE__ */ jsxDEV("option", { value: opt, children: opt }, opt, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3272,
                          columnNumber: 37
                        }, this)) }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3270,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV("optgroup", { label: "완료 (DONE)", children: options.filter((_, i) => i >= options.length / 3 * 2).map((opt) => /* @__PURE__ */ jsxDEV("option", { value: opt, children: opt }, opt, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3277,
                          columnNumber: 37
                        }, this)) }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3275,
                          columnNumber: 33
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3259,
                      columnNumber: 31
                    },
                    this
                  )
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3254,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "select") {
              const options = col.options || [];
              const hasValue = cellVal !== void 0 && cellVal !== null && cellVal !== "";
              const isValueInOptions = options.includes(cellVal);
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  className: `px-4 py-2 border-r border-brand-outline-variant align-top relative ${shadowClass}`,
                  children: /* @__PURE__ */ jsxDEV(
                    "select",
                    {
                      value: cellVal || "",
                      onChange: (e) => updateRequirementField(req.id, col.id, e.target.value),
                      className: "w-full bg-brand-surface border border-transparent hover:border-brand-primary text-brand-on-surface text-[13px] text-center font-medium rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary appearance-none transition-colors",
                      children: [
                        /* @__PURE__ */ jsxDEV("option", { value: "" }, void 0, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3300,
                          columnNumber: 33
                        }, this),
                        options.map((opt) => /* @__PURE__ */ jsxDEV("option", { value: opt, children: opt }, opt, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3302,
                          columnNumber: 35
                        }, this)),
                        hasValue && !isValueInOptions && /* @__PURE__ */ jsxDEV("option", { value: cellVal, children: cellVal }, cellVal, false, {
                          fileName: "/app/applet/src/components/Spreadsheet.tsx",
                          lineNumber: 3305,
                          columnNumber: 35
                        }, this)
                      ]
                    },
                    void 0,
                    true,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3295,
                      columnNumber: 31
                    },
                    this
                  )
                },
                col.id,
                false,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3290,
                  columnNumber: 29
                },
                this
              );
            }
            if (col.type === "date") {
              return /* @__PURE__ */ jsxDEV(
                "td",
                {
                  style: cellStyle,
                  onClick: () => setActiveCellEditor({ rowId: req.id, field: col.id }),
                  className: `px-4 py-2 border-r border-brand-outline-variant text-[13px] text-brand-on-surface-variant hover:bg-brand-surface-high/10 cursor-pointer align-top relative ${shadowClass}`,
                  children: [
                    isEditing && /* @__PURE__ */ jsxDEV(
                      "input",
                      {
                        type: "date",
                        defaultValue: cellVal,
                        autoFocus: true,
                        onPaste: (e) => handleGridPaste(e, req.id, col.id),
                        onBlur: (e) => {
                          updateRequirementField(req.id, col.id, e.target.value);
                          setActiveCellEditor(null);
                        },
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            updateRequirementField(req.id, col.id, e.currentTarget.value);
                            setActiveCellEditor(null);
                          }
                          if (e.key === "Escape") setActiveCellEditor(null);
                        },
                        className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-[13px] px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md font-mono"
                      },
                      void 0,
                      false,
                      {
                        fileName: "/app/applet/src/components/Spreadsheet.tsx",
                        lineNumber: 3321,
                        columnNumber: 33
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV("div", { className: isEditing ? "opacity-0" : "", children: cellVal }, void 0, false, {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3340,
                      columnNumber: 31
                    }, this)
                  ]
                },
                col.id,
                true,
                {
                  fileName: "/app/applet/src/components/Spreadsheet.tsx",
                  lineNumber: 3314,
                  columnNumber: 29
                },
                this
              );
            }
            let inputType = "text";
            if (col.type === "number") inputType = "number";
            return /* @__PURE__ */ jsxDEV(
              "td",
              {
                style: cellStyle,
                onClick: () => setActiveCellEditor({ rowId: req.id, field: col.id }),
                className: `px-4 py-2 border-r border-brand-outline-variant cursor-text hover:bg-brand-surface-high/20 transition-colors whitespace-pre-wrap break-words align-top relative ${shadowClass}`,
                children: [
                  isEditing && /* @__PURE__ */ jsxDEV(
                    "textarea",
                    {
                      defaultValue: cellVal,
                      autoFocus: true,
                      onPaste: (e) => handleGridPaste(e, req.id, col.id),
                      onBlur: (e) => {
                        updateRequirementField(req.id, col.id, e.target.value);
                        setActiveCellEditor(null);
                      },
                      onKeyDown: (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          updateRequirementField(req.id, col.id, e.currentTarget.value);
                          setActiveCellEditor(null);
                        }
                        if (e.key === "Escape") setActiveCellEditor(null);
                      },
                      className: "absolute -inset-[1px] z-20 w-[calc(100%+2px)] h-[calc(100%+2px)] bg-brand-surface-lowest border-2 border-brand-primary text-sm px-[15px] py-[7px] text-brand-on-surface focus:outline-none shadow-md resize-none font-medium"
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Spreadsheet.tsx",
                      lineNumber: 3359,
                      columnNumber: 31
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV("div", { className: `font-medium break-words whitespace-pre-wrap h-full w-full ${isEditing ? "opacity-0" : ""}`, children: inputType === "number" && col.decimalPlaces !== void 0 && cellVal && !isNaN(Number(cellVal)) ? Number(cellVal).toFixed(col.decimalPlaces) : cellVal || /* @__PURE__ */ jsxDEV("span", { className: "opacity-0", children: "-" }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 3380,
                    columnNumber: 47
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Spreadsheet.tsx",
                    lineNumber: 3377,
                    columnNumber: 29
                  }, this)
                ]
              },
              col.id,
              true,
              {
                fileName: "/app/applet/src/components/Spreadsheet.tsx",
                lineNumber: 3352,
                columnNumber: 27
              },
              this
            );
          }
          return null;
        }),
        /* @__PURE__ */ jsxDEV("td", { className: "px-4 py-2 text-center text-brand-on-surface-variant w-[100px]", children: /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              if (confirm(`'${req.id}' 항목을 즉각 삭제하시겠습니까?`)) {
                setRequirements((prev) => prev.filter((r) => r.id !== req.id));
                setSelectedIds((prev) => prev.filter((id) => id !== req.id));
              }
            },
            className: "opacity-0 group-hover:opacity-100 p-1.5 text-brand-outline hover:text-brand-error hover:bg-brand-surface-lowest rounded-lg transition-all cursor-pointer",
            title: "삭제",
            children: /* @__PURE__ */ jsxDEV(Trash2, { className: "w-4 h-4" }, void 0, false, {
              fileName: "/app/applet/src/components/Spreadsheet.tsx",
              lineNumber: 3401,
              columnNumber: 25
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/Spreadsheet.tsx",
            lineNumber: 3391,
            columnNumber: 23
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/Spreadsheet.tsx",
          lineNumber: 3390,
          columnNumber: 21
        }, this)
      ]
    },
    req.id,
    true,
    {
      fileName: "/app/applet/src/components/Spreadsheet.tsx",
      lineNumber: 2631,
      columnNumber: 19
    },
    this
  );
}, (prev, next) => {
  return prev.req === next.req && prev.isSelected === next.isSelected && prev.isActive === next.isActive && prev.activeField === next.activeField && prev.isLockedByOther === next.isLockedByOther && prev.lockedByName === next.lockedByName && prev.isPriorityOpen === next.isPriorityOpen && prev.isAssigneeOpen === next.isAssigneeOpen && prev.isStatusOpen === next.isStatusOpen && prev.dragOverRowId === next.dragOverRowId && prev.columns === next.columns && prev.minimizedColumns === next.minimizedColumns && prev.columnWidths === next.columnWidths && prev.assigneesPool === next.assigneesPool && prev.currentUser === next.currentUser && prev.exchangeRates === next.exchangeRates && prev.activeCellEditor === next.activeCellEditor && prev.tabDataMap === next.tabDataMap && prev.getCellStickyStyle === next.getCellStickyStyle;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlNwcmVhZHNoZWV0LnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxuICovXG5cbmltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlUmVmLCB1c2VFZmZlY3QsIHVzZUNhbGxiYWNrLCB1c2VNZW1vIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgY3JlYXRlUG9ydGFsIH0gZnJvbSAncmVhY3QtZG9tJztcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gJ3NvY2tldC5pby1jbGllbnQnO1xuaW1wb3J0IEV4Y2VsSlMgZnJvbSAnZXhjZWxqcyc7XG5pbXBvcnQgeyBzYXZlQXMgfSBmcm9tICdmaWxlLXNhdmVyJztcbmltcG9ydCB7IFxuICBQbHVzLCBcbiAgRG93bmxvYWQsIFxuICBTZWFyY2gsIFxuICBUcmFzaDIsIFxuICBGaWx0ZXIsIFxuICBBcnJvd1VwRG93biwgXG4gIENoZWNrLCBcbiAgQ2hldnJvbkRvd24sIFxuICBYLCBcbiAgVXNlclBsdXMsXG4gIENpcmNsZURvdCxcbiAgR3JpcFZlcnRpY2FsLFxuICBDb3B5LFxuICBTZXR0aW5ncyxcbiAgR3JpZCxcbiAgVXNlcnMsXG4gIFVuZG8yLFxuICBSZWRvMixcbiAgQWxlcnRDaXJjbGUsXG4gIEhlbHBDaXJjbGUsXG4gIE1heGltaXplMixcbiAgTGF5ZXJzLFxuICBFZGl0MixcbiAgQWxpZ25KdXN0aWZ5XG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgeyBSZXF1aXJlbWVudCwgUHJpb3JpdHksIFN0YXR1cywgQXNzaWduZWUsIENvbHVtbiwgQ29sdW1uVHlwZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IElOSVRJQUxfUkVRVUlSRU1FTlRTLCBJTklUSUFMX0FTU0lHTkVFUyB9IGZyb20gJy4uL2RhdGEnO1xuaW1wb3J0IERyYWdnYWJsZU1vZGFsIGZyb20gJy4vRHJhZ2dhYmxlTW9kYWwnO1xuXG5pbnRlcmZhY2UgU3ByZWFkc2hlZXRQcm9wcyB7XG4gIHJlcXVpcmVtZW50czogUmVxdWlyZW1lbnRbXTtcbiAgc2V0UmVxdWlyZW1lbnRzOiBSZWFjdC5EaXNwYXRjaDxSZWFjdC5TZXRTdGF0ZUFjdGlvbjxSZXF1aXJlbWVudFtdPj47XG4gIGFzc2lnbmVlc1Bvb2w6IEFzc2lnbmVlW107XG4gIHNldEFzc2lnbmVlc1Bvb2w6IFJlYWN0LkRpc3BhdGNoPFJlYWN0LlNldFN0YXRlQWN0aW9uPEFzc2lnbmVlW10+PjtcbiAgY29sdW1uczogQ29sdW1uW107XG4gIHNldENvbHVtbnM6IFJlYWN0LkRpc3BhdGNoPFJlYWN0LlNldFN0YXRlQWN0aW9uPENvbHVtbltdPj47XG4gIG9wZW5Db21pbmdTb29uTW9kYWw6IChmZWF0dXJlTmFtZTogc3RyaW5nKSA9PiB2b2lkO1xuICBzb2NrZXQ6IGFueTtcbiAgZGJQYXRoPzogc3RyaW5nO1xuICBjdXJyZW50VXNlcj86IHsgaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nIH07XG4gIGFjdGl2ZUxvY2tzPzogUmVjb3JkPHN0cmluZywgYW55PjtcbiAgdGFicz86IGFueVtdO1xuICB0YWJEYXRhTWFwPzogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxubGV0IGNhY2hlZEludm9rZTogYW55ID0gbnVsbDtcbmNvbnN0IGdldFRhdXJpSW52b2tlID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChjYWNoZWRJbnZva2UpIHJldHVybiBjYWNoZWRJbnZva2U7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICh3aW5kb3cuX19UQVVSSV9JTlRFUk5BTFNfXykge1xuICAgICAgICBjb25zdCB7IGludm9rZSB9ID0gYXdhaXQgaW1wb3J0KCdAdGF1cmktYXBwcy9hcGkvY29yZScpO1xuICAgICAgICBjYWNoZWRJbnZva2UgPSBpbnZva2U7XG4gICAgICAgIHJldHVybiBpbnZva2U7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU3ByZWFkc2hlZXQoeyByZXF1aXJlbWVudHMsIHNldFJlcXVpcmVtZW50czogb3JpZ2luYWxTZXRSZXF1aXJlbWVudHMsIGFzc2lnbmVlc1Bvb2wsIHNldEFzc2lnbmVlc1Bvb2wsIGNvbHVtbnMsIHNldENvbHVtbnMsIG9wZW5Db21pbmdTb29uTW9kYWwsIHNvY2tldCwgZGJQYXRoLCBjdXJyZW50VXNlciwgYWN0aXZlTG9ja3MgPSB7fSwgdGFicyA9IFtdLCB0YWJEYXRhTWFwID0ge30gfTogU3ByZWFkc2hlZXRQcm9wcykge1xuXG4gIC8vIC0tLSBVTkRPIC8gUkVETyBTVEFURSAtLS1cbiAgY29uc3QgTUFYX0hJU1RPUlkgPSAyMDtcbiAgY29uc3QgaGlzdG9yeVJlZiA9IHVzZVJlZjxSZXF1aXJlbWVudFtdW10+KFtdKTtcbiAgY29uc3QgcmVkb1N0YWNrUmVmID0gdXNlUmVmPFJlcXVpcmVtZW50W11bXT4oW10pO1xuXG4gIC8vIFdyYXBwZXIgZm9yIHNldFJlcXVpcmVtZW50cyB0byByZWNvcmQgaGlzdG9yeVxuICBjb25zdCBzZXRSZXF1aXJlbWVudHMgPSB1c2VDYWxsYmFjaygoYWN0aW9uOiBSZWFjdC5TZXRTdGF0ZUFjdGlvbjxSZXF1aXJlbWVudFtdPikgPT4ge1xuICAgIG9yaWdpbmFsU2V0UmVxdWlyZW1lbnRzKHByZXYgPT4ge1xuICAgICAgY29uc3QgbmV4dCA9IHR5cGVvZiBhY3Rpb24gPT09ICdmdW5jdGlvbicgPyAoYWN0aW9uIGFzIGFueSkocHJldikgOiBhY3Rpb247XG4gICAgICBcbiAgICAgIC8vIFNhdmUgdG8gaGlzdG9yeSBiZWZvcmUgdXBkYXRpbmcgKGlmIGRpZmZlcmVudClcbiAgICAgIGlmIChwcmV2ICE9PSBuZXh0KSB7XG4gICAgICAgIGhpc3RvcnlSZWYuY3VycmVudC5wdXNoKHByZXYpO1xuICAgICAgICBpZiAoaGlzdG9yeVJlZi5jdXJyZW50Lmxlbmd0aCA+IE1BWF9ISVNUT1JZKSB7XG4gICAgICAgICAgaGlzdG9yeVJlZi5jdXJyZW50LnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVkb1N0YWNrUmVmLmN1cnJlbnQgPSBbXTsgLy8gQ2xlYXIgcmVkbyBzdGFjayBvbiBuZXcgYWN0aW9uXG4gICAgICB9XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9KTtcbiAgfSwgW29yaWdpbmFsU2V0UmVxdWlyZW1lbnRzXSk7XG5cbiAgY29uc3QgaGFuZGxlVW5kbyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAoaGlzdG9yeVJlZi5jdXJyZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgIG9yaWdpbmFsU2V0UmVxdWlyZW1lbnRzKHByZXYgPT4ge1xuICAgICAgICBjb25zdCBwcmV2aW91c1N0YXRlID0gaGlzdG9yeVJlZi5jdXJyZW50LnBvcCgpITtcbiAgICAgICAgcmVkb1N0YWNrUmVmLmN1cnJlbnQucHVzaChbLi4ucHJldl0pO1xuICAgICAgICByZXR1cm4gcHJldmlvdXNTdGF0ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW29yaWdpbmFsU2V0UmVxdWlyZW1lbnRzXSk7XG5cbiAgY29uc3QgaGFuZGxlUmVkbyA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpZiAocmVkb1N0YWNrUmVmLmN1cnJlbnQubGVuZ3RoID4gMCkge1xuICAgICAgb3JpZ2luYWxTZXRSZXF1aXJlbWVudHMocHJldiA9PiB7XG4gICAgICAgIGNvbnN0IG5leHRTdGF0ZSA9IHJlZG9TdGFja1JlZi5jdXJyZW50LnBvcCgpITtcbiAgICAgICAgaGlzdG9yeVJlZi5jdXJyZW50LnB1c2goWy4uLnByZXZdKTtcbiAgICAgICAgcmV0dXJuIG5leHRTdGF0ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgW29yaWdpbmFsU2V0UmVxdWlyZW1lbnRzXSk7XG5cbiAgLy8gS2V5Ym9hcmQgU2hvcnRjdXRzIGZvciBVbmRvL1JlZG9cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVLZXlEb3duID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgIC8vIEN0cmwvQ21kICsgWlxuICAgICAgaWYgKChlLmN0cmxLZXkgfHwgZS5tZXRhS2V5KSAmJiBlLmtleS50b0xvd2VyQ2FzZSgpID09PSAneicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBoYW5kbGVVbmRvKCk7XG4gICAgICB9XG4gICAgICAvLyBDdHJsL0NtZCArIFNoaWZ0ICsgWiBPUiBDdHJsL0NtZCArIHlcbiAgICAgIGlmICgoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkgJiYgKGUua2V5LnRvTG93ZXJDYXNlKCkgPT09ICd5JyB8fCAoZS5rZXkudG9Mb3dlckNhc2UoKSA9PT0gJ3onICYmIGUuc2hpZnRLZXkpKSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGhhbmRsZVJlZG8oKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bik7XG4gICAgcmV0dXJuICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlS2V5RG93bik7XG4gIH0sIFtoYW5kbGVVbmRvLCBoYW5kbGVSZWRvXSk7XG4gIC8vIC0tLSBFTkQgVU5ETyAvIFJFRE8gU1RBVEUgLS0tXG4gIC8vIFF1ZXJpZXMgJiBGaWx0ZXJzXG4gIGNvbnN0IFtzZWFyY2hUZXJtLCBzZXRTZWFyY2hUZXJtXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3ByaW9yaXR5RmlsdGVyLCBzZXRQcmlvcml0eUZpbHRlcl0gPSB1c2VTdGF0ZTxQcmlvcml0eSB8ICdBTEwnPignQUxMJyk7XG4gIGNvbnN0IFtzdGF0dXNGaWx0ZXIsIHNldFN0YXR1c0ZpbHRlcl0gPSB1c2VTdGF0ZTxTdGF0dXMgfCAnQUxMJz4oJ0FMTCcpO1xuICBcbiAgLy8gU29ydGVyc1xuICBjb25zdCBbc29ydEZpZWxkLCBzZXRTb3J0RmllbGRdID0gdXNlU3RhdGU8J2lkJyB8ICd0aXRsZScgfCAnZHVlRGF0ZScgfCAnc3RhdHVzJyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbc29ydERpcmVjdGlvbiwgc2V0U29ydERpcmVjdGlvbl0gPSB1c2VTdGF0ZTwnYXNjJyB8ICdkZXNjJz4oJ2FzYycpO1xuXG4gIC8vIEN1c3RvbSBDb2x1bW5zIExpc3RcbiAgY29uc3QgW3Nob3dBZGRDb2x1bW5Nb2RhbCwgc2V0U2hvd0FkZENvbHVtbk1vZGFsXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dGb3JtdWxhSGVscCwgc2V0U2hvd0Zvcm11bGFIZWxwXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2VkaXRpbmdDb2x1bW5EZWZJZCwgc2V0RWRpdGluZ0NvbHVtbkRlZklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbY29sdW1uVG9EZWxldGUsIHNldENvbHVtblRvRGVsZXRlXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbbmV3Q29sdW1uTmFtZSwgc2V0TmV3Q29sdW1uTmFtZV0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtuZXdDb2x1bW5UeXBlLCBzZXROZXdDb2x1bW5UeXBlXSA9IHVzZVN0YXRlPENvbHVtblR5cGU+KCd0ZXh0Jyk7XG4gIGNvbnN0IFtlZGl0aW5nQ29sdW1uTmFtZUlkLCBzZXRFZGl0aW5nQ29sdW1uTmFtZUlkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBcbiAgLy8gQWR2YW5jZWQgQ29sdW1uIFN0YXRlXG4gIGNvbnN0IFtmb3JtdWxhSW5wdXQsIHNldEZvcm11bGFJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtidXR0b25MYWJlbElucHV0LCBzZXRCdXR0b25MYWJlbElucHV0XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2J1dHRvbkFjdGlvbklucHV0LCBzZXRCdXR0b25BY3Rpb25JbnB1dF0gPSB1c2VTdGF0ZSgnc3RhcnRfd29yaycpO1xuICBjb25zdCBbY3VycmVuY3lBbW91bnRDb2xJZElucHV0LCBzZXRDdXJyZW5jeUFtb3VudENvbElkSW5wdXRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbY3VycmVuY3lDb2RlQ29sSWRJbnB1dCwgc2V0Q3VycmVuY3lDb2RlQ29sSWRJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtjdXJyZW5jeURlY2ltYWxQbGFjZXNJbnB1dCwgc2V0Q3VycmVuY3lEZWNpbWFsUGxhY2VzSW5wdXRdID0gdXNlU3RhdGU8bnVtYmVyPigwKTtcbiAgY29uc3QgW2RlY2ltYWxQbGFjZXNJbnB1dCwgc2V0RGVjaW1hbFBsYWNlc0lucHV0XSA9IHVzZVN0YXRlPHN0cmluZz4oJycpO1xuICBjb25zdCBbcm9sbHVwUmVsSWRJbnB1dCwgc2V0Um9sbHVwUmVsSWRJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtyb2xsdXBBZ2dUeXBlSW5wdXQsIHNldFJvbGx1cEFnZ1R5cGVJbnB1dF0gPSB1c2VTdGF0ZTwnY291bnQnIHwgJ3BlcmNlbnRfZG9uZSc+KCdjb3VudCcpO1xuICBjb25zdCBbc3RhdHVzT3B0aW9uc0lucHV0LCBzZXRTdGF0dXNPcHRpb25zSW5wdXRdID0gdXNlU3RhdGUoJ+yVhOydtOuUlOyWtCzquLDtmo0s65SU7J6Q7J24LOqwnOuwnCxRQSzrsLDtj6wnKTtcblxuICAvLyBMb29rdXAgY29sdW1uIHN0YXRlXG4gIGNvbnN0IFtsb29rdXBUYWJJZElucHV0LCBzZXRMb29rdXBUYWJJZElucHV0XSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2xvb2t1cE1hdGNoTXlDb2xJZElucHV0LCBzZXRMb29rdXBNYXRjaE15Q29sSWRJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtsb29rdXBNYXRjaFRhcmdldENvbElkSW5wdXQsIHNldExvb2t1cE1hdGNoVGFyZ2V0Q29sSWRJbnB1dF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtsb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0LCBzZXRMb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0XSA9IHVzZVN0YXRlKCcnKTtcblxuXG4gIC8vIEV4Y2hhbmdlIFJhdGVzIFNldHVwXG4gIGNvbnN0IFtleGNoYW5nZVJhdGVzLCBzZXRFeGNoYW5nZVJhdGVzXSA9IHVzZVN0YXRlKCgpID0+IHtcbiAgICBjb25zdCBzYXZlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcHBfZXhjaGFuZ2VfcmF0ZXMnKTtcbiAgICByZXR1cm4gc2F2ZWQgPyBKU09OLnBhcnNlKHNhdmVkKSA6IHsgS1JXOiAxLCBVU0Q6IDE0MDAsIEVVUjogMTUwMCB9O1xuICB9KTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcHBfZXhjaGFuZ2VfcmF0ZXMnLCBKU09OLnN0cmluZ2lmeShleGNoYW5nZVJhdGVzKSk7XG4gIH0sIFtleGNoYW5nZVJhdGVzXSk7XG5cbiAgLy8gQ29sdW1uIFJlc2l6aW5nIExvZ2ljXG4gIGNvbnN0IFtjb2x1bW5XaWR0aHMsIHNldENvbHVtbldpZHRoc10gPSB1c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBudW1iZXI+PigoKSA9PiB7XG4gICAgY29uc3Qgc2F2ZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXBwX2dyaWRfY29sX3dpZHRocycpO1xuICAgIGNvbnN0IGJhc2UgPSBzYXZlZCA/IEpTT04ucGFyc2Uoc2F2ZWQpIDoge1xuICAgICAgY3VzdG9tX2luZGV4OiA2MCxcbiAgICAgIGN1c3RvbV9sdjE6IDEwMCxcbiAgICAgIGN1c3RvbV9sdjI6IDEwMCxcbiAgICAgIGlkOiAxMTAsXG4gICAgICB0aXRsZTogMzAwLFxuICAgICAgY3VzdG9tX3JvbGU6IDgwLFxuICAgICAgYXNzaWduZWVzOiAxMzAsXG4gICAgICBjdXN0b21fa3I6IDIwMCxcbiAgICAgIGN1c3RvbV9lbjogMjAwLFxuICAgICAgcHJpb3JpdHk6IDEwMCxcbiAgICAgIHN0YXR1czogMTAwXG4gICAgfTtcbiAgICBjb2x1bW5zLmZvckVhY2goYyA9PiB7XG4gICAgICBpZiAoYy53aWR0aCkgYmFzZVtjLmlkXSA9IGMud2lkdGg7XG4gICAgfSk7XG4gICAgcmV0dXJuIGJhc2U7XG4gIH0pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgc2V0Q29sdW1uV2lkdGhzKHByZXYgPT4ge1xuICAgICAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IG5leHQgPSB7IC4uLnByZXYgfTtcbiAgICAgIGNvbHVtbnMuZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMud2lkdGggJiYgbmV4dFtjLmlkXSAhPT0gYy53aWR0aCkge1xuICAgICAgICAgIG5leHRbYy5pZF0gPSBjLndpZHRoO1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjaGFuZ2VkID8gbmV4dCA6IHByZXY7XG4gICAgfSk7XG4gIH0sIFtjb2x1bW5zXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYXBwX2dyaWRfY29sX3dpZHRocycsIEpTT04uc3RyaW5naWZ5KGNvbHVtbldpZHRocykpO1xuICB9LCBbY29sdW1uV2lkdGhzXSk7XG5cbiAgY29uc3QgW3Jlc2l6aW5nQ29sSWQsIHNldFJlc2l6aW5nQ29sSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtyZXNpemVTdGFydFgsIHNldFJlc2l6ZVN0YXJ0WF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgW3Jlc2l6ZVN0YXJ0V2lkdGgsIHNldFJlc2l6ZVN0YXJ0V2lkdGhdID0gdXNlU3RhdGUoMCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAoIXJlc2l6aW5nQ29sSWQpIHJldHVybjtcblxuICAgIGNvbnN0IGhhbmRsZU1vdXNlTW92ZSA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBkZWx0YVggPSBlLmNsaWVudFggLSByZXNpemVTdGFydFg7XG4gICAgICBjb25zdCBuZXdXaWR0aCA9IE1hdGgubWF4KDUwLCByZXNpemVTdGFydFdpZHRoICsgZGVsdGFYKTtcbiAgICAgIHNldENvbHVtbldpZHRocyhwcmV2ID0+ICh7IC4uLnByZXYsIFtyZXNpemluZ0NvbElkXTogbmV3V2lkdGggfSkpO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVNb3VzZVVwID0gKCkgPT4ge1xuICAgICAgc2V0Q29sdW1uV2lkdGhzKHByZXZXaWR0aHMgPT4ge1xuICAgICAgICBjb25zdCBmaW5hbFdpZHRoID0gcHJldldpZHRoc1tyZXNpemluZ0NvbElkXTtcbiAgICAgICAgaWYgKGZpbmFsV2lkdGgpIHtcbiAgICAgICAgICBzZXRDb2x1bW5zKHByZXYgPT4gcHJldi5tYXAoYyA9PiBjLmlkID09PSByZXNpemluZ0NvbElkID8geyAuLi5jLCB3aWR0aDogZmluYWxXaWR0aCB9IDogYykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcmV2V2lkdGhzO1xuICAgICAgfSk7XG4gICAgICBzZXRSZXNpemluZ0NvbElkKG51bGwpO1xuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZU1vdXNlVXApO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlTW91c2VNb3ZlKTtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaGFuZGxlTW91c2VVcCk7XG4gICAgfTtcbiAgfSwgW3Jlc2l6aW5nQ29sSWQsIHJlc2l6ZVN0YXJ0WCwgcmVzaXplU3RhcnRXaWR0aCwgc2V0Q29sdW1uc10pO1xuXG4gIC8vIE5ldyBHbG9iYWwgU3RhdGVzXG4gIGNvbnN0IFtzaG93QXNzaWduZWVNYW5hZ2VyLCBzZXRTaG93QXNzaWduZWVNYW5hZ2VyXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2Fzc2lnbmVlTWFuYWdlclBvcywgc2V0QXNzaWduZWVNYW5hZ2VyUG9zXSA9IHVzZVN0YXRlPHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IHVuZGVmaW5lZD4odW5kZWZpbmVkKTtcbiAgY29uc3QgW25ld0Fzc2lnbmVlTmFtZSwgc2V0TmV3QXNzaWduZWVOYW1lXSA9IHVzZVN0YXRlKCcnKTtcblxuICAvLyBDb2x1bW4gbGV2ZWwgdGV4dCBzZWFyY2ggZmlsdGVyc1xuICBjb25zdCBbY29sdW1uU2VhcmNoVGVybXMsIHNldENvbHVtblNlYXJjaFRlcm1zXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIHN0cmluZz4+KHt9KTtcbiAgY29uc3QgW3Nob3dGaWx0ZXJDb2x1bW5JZCwgc2V0U2hvd0ZpbHRlckNvbHVtbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZmlsdGVyUG9wdXBDb29yZHMsIHNldEZpbHRlclBvcHVwQ29vcmRzXSA9IHVzZVN0YXRlPHsgdG9wOiBudW1iZXI7IGxlZnQ6IG51bWJlciB9IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IGZpbHRlclBvcHVwUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcbiAgXG4gIGNvbnN0IFttaW5pbWl6ZWRDb2x1bW5zLCBzZXRNaW5pbWl6ZWRDb2x1bW5zXSA9IHVzZVN0YXRlPFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+Pih7fSk7XG5cbiAgLy8gQ2xvc2UgcG9wdXAgZ2xvYmFsbHlcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCBoYW5kbGVHbG9iYWxDbGljayA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAvLyBDbG9zZSBmaWx0ZXIgcG9wdXBcbiAgICAgIGlmIChmaWx0ZXJQb3B1cFJlZi5jdXJyZW50ICYmICFmaWx0ZXJQb3B1cFJlZi5jdXJyZW50LmNvbnRhaW5zKGUudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIHNldFNob3dGaWx0ZXJDb2x1bW5JZChudWxsKTtcbiAgICAgICAgc2V0RmlsdGVyUG9wdXBDb29yZHMobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBDbG9zZSBjb250ZXh0IG1lbnVcbiAgICAgIHNldENvbnRleHRNZW51Q29sSWQobnVsbCk7XG4gICAgICBzZXRTdXBlckNvbnRleHRNZW51R3JvdXAobnVsbCk7XG4gICAgfTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlR2xvYmFsQ2xpY2spO1xuICAgIHJldHVybiAoKSA9PiB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlR2xvYmFsQ2xpY2spO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgW3NlbGVjdGVkSWRzLCBzZXRTZWxlY3RlZElkc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pO1xuICBjb25zdCBbc2VsZWN0ZWRDb2x1bW5JZHMsIHNldFNlbGVjdGVkQ29sdW1uSWRzXSA9IHVzZVN0YXRlPHN0cmluZ1tdPihbXSk7XG4gIGNvbnN0IFtzaG93RGVzY3JpcHRpb25FZGl0Q29sSWQsIHNldFNob3dEZXNjcmlwdGlvbkVkaXRDb2xJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2Rlc2NyaXB0aW9uSW5wdXQsIHNldERlc2NyaXB0aW9uSW5wdXRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbbmV3Q29sdW1uT3B0aW9uc0lucHV0LCBzZXROZXdDb2x1bW5PcHRpb25zSW5wdXRdID0gdXNlU3RhdGUoJycpO1xuXG4gIC8vIEFjdGl2ZSBJbmxpbmUgQ2VsbCBFZGl0b3JzXG4gIGNvbnN0IFthY3RpdmVDZWxsRWRpdG9yLCBzZXRBY3RpdmVDZWxsRWRpdG9yU3RhdGVdID0gdXNlU3RhdGU8eyByb3dJZDogc3RyaW5nOyBmaWVsZDogc3RyaW5nIH0gfCBudWxsPihudWxsKTtcbiAgY29uc3QgY2VsbFJlZiA9IHVzZVJlZjx7IHJvd0lkOiBzdHJpbmc7IGZpZWxkOiBzdHJpbmcgfSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBsb2Nrc1JlZiA9IHVzZVJlZjxhbnk+KG51bGwpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY2VsbFJlZi5jdXJyZW50ID0gYWN0aXZlQ2VsbEVkaXRvcjtcbiAgICBsb2Nrc1JlZi5jdXJyZW50ID0gYWN0aXZlTG9ja3M7XG4gIH0pO1xuICBcbiAgLy8gUmVhbC10aW1lIEVkaXRpbmcgTG9jayBIZWxwZXJzXG4gIGNvbnN0IHNldEFjdGl2ZUNlbGxFZGl0b3IgPSB1c2VDYWxsYmFjayhhc3luYyAodmFsOiB7IHJvd0lkOiBzdHJpbmc7IGZpZWxkOiBzdHJpbmcgfSB8IG51bGwpID0+IHtcbiAgICBjb25zdCBhY3RpdmVDZWxsID0gY2VsbFJlZi5jdXJyZW50O1xuICAgIFxuICAgIC8vIElmIGNsb3NpbmcsIHJlbGVhc2UgdGhlIGN1cnJlbnRseSBoZWxkIGxvY2tcbiAgICBpZiAodmFsID09PSBudWxsICYmIGFjdGl2ZUNlbGwpIHtcbiAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgaWYgKHdpbmRvdy5fX1RBVVJJX0lOVEVSTkFMU19fICYmIGRiUGF0aCAmJiBjdXJyZW50VXNlcikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgIGNvbnN0IGludm9rZUNhbGwgPSBhd2FpdCBnZXRUYXVyaUludm9rZSgpO1xuICAgICAgICAgICAgIGF3YWl0IGludm9rZUNhbGwoJ3JlbGVhc2VfaXRlbV9sb2NrJywgeyBcbiAgICAgICAgICAgICAgICBwcm9qZWN0UGF0aDogZGJQYXRoLCBpdGVtSWQ6IGFjdGl2ZUNlbGwucm93SWQsIHVzZXJJZDogY3VycmVudFVzZXIuaWQgXG4gICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgIH1cbiAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yU3RhdGUobnVsbCk7XG4gICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBJZiBvcGVuaW5nLCByZXF1ZXN0IGxvY2sgZnJvbSBzZXJ2ZXJcbiAgICBpZiAodmFsKSB7XG4gICAgICAgLy8gT3B0aW1pc3RpYyBVSSBzdGF0ZSB1cGRhdGUgdG8gZWxpbWluYXRlIGRlbGF5XG4gICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvclN0YXRlKHZhbCk7XG4gICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgIGlmICh3aW5kb3cuX19UQVVSSV9JTlRFUk5BTFNfXyAmJiBkYlBhdGggJiYgY3VycmVudFVzZXIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICBjb25zdCBpbnZva2VDYWxsID0gYXdhaXQgZ2V0VGF1cmlJbnZva2UoKTtcbiAgICAgICAgICAgICBhd2FpdCBpbnZva2VDYWxsKCdhY3F1aXJlX2l0ZW1fbG9jaycsIHsgXG4gICAgICAgICAgICAgICAgcHJvamVjdFBhdGg6IGRiUGF0aCwgaXRlbUlkOiB2YWwucm93SWQsIHVzZXJJZDogY3VycmVudFVzZXIuaWQsIHVzZXJOYW1lOiBjdXJyZW50VXNlci5uYW1lIFxuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgICAgIC8vIFJldmVydCBvbiBmYWlsdXJlXG4gICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvclN0YXRlKG51bGwpO1xuICAgICAgICAgICAgIGNvbnN0IGxvY2tlciA9IGxvY2tzUmVmLmN1cnJlbnRbdmFsLnJvd0lkXTtcbiAgICAgICAgICAgICBjb25zdCBsb2NrZXJOYW1lID0gbG9ja2VyID8gbG9ja2VyLnVzZXJOYW1lIDogJ+uLpOuluCDsgqzsmqnsnpAnO1xuICAgICAgICAgICAgIGFsZXJ0KGBb7KCR6re8IOygnO2VnF1cXG7tmITsnqwgJHtsb2NrZXJOYW1lfSDri5jsnbQg7J20IO2VreuqqeydhCDtjrjsp5HtlZjqs6Ag7J6I7Iq164uI64ukLlxcbu2OuOynkeydtCDsmYTro4zrkKAg65WM6rmM7KeAIOq4sOuLpOugpCDso7zshLjsmpQuYCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICB9XG4gICAgfVxuICAgIC8vIEZhbGxiYWNrIGlmIG5vIFRhdXJpXG4gICAgc2V0QWN0aXZlQ2VsbEVkaXRvclN0YXRlKHZhbCk7XG4gIH0sIFtkYlBhdGgsIGN1cnJlbnRVc2VyXSk7XG4gIFxuICAvLyBEcm9wZG93biBTdGF0ZXNcbiAgY29uc3QgW3Nob3dQcmlvcml0eURyb3Bkb3duSWQsIHNldFNob3dQcmlvcml0eURyb3Bkb3duSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtzaG93U3RhdHVzRHJvcGRvd25JZCwgc2V0U2hvd1N0YXR1c0Ryb3Bkb3duSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtzaG93QXNzaWduZWVEcm9wZG93bklkLCBzZXRTaG93QXNzaWduZWVEcm9wZG93bklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIC8vIFJlZmVyZW5jZXMgZm9yIGNsb3NpbmcgbWVudXMgb24gY2xpY2sgb3V0c2lkZVxuICBjb25zdCBwcmlvcml0eVJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IHN0YXR1c1JlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IGFzc2lnbmVlUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50PihudWxsKTtcblxuICAvLyBDbG9zZSBtZW51cyBvbiBjbGljayBvdXRzaWRlXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZnVuY3Rpb24gaGFuZGxlQ2xpY2tPdXRzaWRlKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICBpZiAocHJpb3JpdHlSZWYuY3VycmVudCAmJiAhcHJpb3JpdHlSZWYuY3VycmVudC5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgICAgc2V0U2hvd1ByaW9yaXR5RHJvcGRvd25JZChudWxsKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdGF0dXNSZWYuY3VycmVudCAmJiAhc3RhdHVzUmVmLmN1cnJlbnQuY29udGFpbnMoZXZlbnQudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIHNldFNob3dTdGF0dXNEcm9wZG93bklkKG51bGwpO1xuICAgICAgfVxuICAgICAgaWYgKGFzc2lnbmVlUmVmLmN1cnJlbnQgJiYgIWFzc2lnbmVlUmVmLmN1cnJlbnQuY29udGFpbnMoZXZlbnQudGFyZ2V0IGFzIE5vZGUpKSB7XG4gICAgICAgIHNldFNob3dBc3NpZ25lZURyb3Bkb3duSWQobnVsbCk7XG4gICAgICB9XG4gICAgICBpZiAoZmlsdGVyUG9wdXBSZWYuY3VycmVudCAmJiAhZmlsdGVyUG9wdXBSZWYuY3VycmVudC5jb250YWlucyhldmVudC50YXJnZXQgYXMgTm9kZSkpIHtcbiAgICAgICAgc2V0U2hvd0ZpbHRlckNvbHVtbklkKG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVDbGlja091dHNpZGUpO1xuICAgIHJldHVybiAoKSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVDbGlja091dHNpZGUpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgY2xlYXJBbGxGaWx0ZXJzID0gKCkgPT4ge1xuICAgIHNldFNlYXJjaFRlcm0oJycpO1xuICAgIHNldFByaW9yaXR5RmlsdGVyKCdBTEwnKTtcbiAgICBzZXRTdGF0dXNGaWx0ZXIoJ0FMTCcpO1xuICAgIHNldENvbHVtblNlYXJjaFRlcm1zKHt9KTtcbiAgfTtcblxuICBjb25zdCByZXFCeUlkID0gdXNlTWVtbygoKSA9PiBuZXcgTWFwKHJlcXVpcmVtZW50cy5tYXAociA9PiBbci5pZCwgcl0pKSwgW3JlcXVpcmVtZW50c10pO1xuXG4gIGNvbnN0IGNvbGxhdG9yID0gdXNlTWVtbygoKSA9PiBuZXcgSW50bC5Db2xsYXRvcigna28nKSwgW10pO1xuXG4gIC8vIEZpbHRlciAmIFNlYXJjaCBMb2dpY1xuICBjb25zdCBmaWx0ZXJlZEFuZFNvcnRlZFJlcXVpcmVtZW50cyA9IHVzZU1lbW8oKCkgPT4gcmVxdWlyZW1lbnRzXG4gICAgLmZpbHRlcihyZXEgPT4ge1xuICAgICAgLy8gUHJpb3JpdHkgZmlsdGVyXG4gICAgICBpZiAocHJpb3JpdHlGaWx0ZXIgIT09ICdBTEwnICYmIHJlcS5wcmlvcml0eSAhPT0gcHJpb3JpdHlGaWx0ZXIpIHJldHVybiBmYWxzZTtcbiAgICAgIFxuICAgICAgLy8gU3RhdHVzIGZpbHRlclxuICAgICAgaWYgKHN0YXR1c0ZpbHRlciAhPT0gJ0FMTCcgJiYgcmVxLnN0YXR1cyAhPT0gc3RhdHVzRmlsdGVyKSByZXR1cm4gZmFsc2U7XG4gICAgICBcbiAgICAgIC8vIFNlYXJjaCB0ZXJtXG4gICAgICBpZiAoc2VhcmNoVGVybS50cmltKCkgIT09ICcnKSB7XG4gICAgICAgIGNvbnN0IHRlcm0gPSBzZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IG1hdGNoZXNJZCA9IHJlcS5pZC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRlcm0pO1xuICAgICAgICBjb25zdCBtYXRjaGVzVGl0bGUgPSByZXEudGl0bGUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyh0ZXJtKTtcbiAgICAgICAgY29uc3QgbWF0Y2hlc0Fzc2lnbmVlcyA9IHJlcS5hc3NpZ25lZXMuc29tZShhID0+IGEubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRlcm0pKTtcbiAgICAgICAgY29uc3QgbWF0Y2hlc0R1ZURhdGUgPSByZXEuZHVlRGF0ZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHRlcm0pO1xuICAgICAgICBcbiAgICAgICAgbGV0IG1hdGNoZXNDdXN0b20gPSBmYWxzZTtcbiAgICAgICAgaWYgKHJlcS5jdXN0b21Db2x1bW5zKSB7XG4gICAgICAgICAgbWF0Y2hlc0N1c3RvbSA9IE9iamVjdC52YWx1ZXMocmVxLmN1c3RvbUNvbHVtbnMpLnNvbWUodiA9PiB2LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXModGVybSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFtYXRjaGVzSWQgJiYgIW1hdGNoZXNUaXRsZSAmJiAhbWF0Y2hlc0Fzc2lnbmVlcyAmJiAhbWF0Y2hlc0R1ZURhdGUgJiYgIW1hdGNoZXNDdXN0b20pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29sdW1uLWxldmVsIHNlYXJjaCBsb2dpY1xuICAgICAgZm9yIChjb25zdCBjb2xJZCBvZiBPYmplY3Qua2V5cyhjb2x1bW5TZWFyY2hUZXJtcykpIHtcbiAgICAgICAgY29uc3QgY29sVGVybSA9IGNvbHVtblNlYXJjaFRlcm1zW2NvbElkXS50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGNvbFRlcm0gPT09ICcnKSBjb250aW51ZTtcblxuICAgICAgICBpZiAoY29sSWQgPT09ICdpZCcgJiYgIXJlcS5pZC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGNvbFRlcm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChjb2xJZCA9PT0gJ3RpdGxlJyAmJiAhcmVxLnRpdGxlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoY29sVGVybSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGNvbElkID09PSAnc3RhdHVzJyAmJiAhcmVxLnN0YXR1cy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGNvbFRlcm0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChjb2xJZCA9PT0gJ3ByaW9yaXR5JyAmJiAhcmVxLnByaW9yaXR5LnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoY29sVGVybSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGNvbElkID09PSAnZHVlRGF0ZScgJiYgIXJlcS5kdWVEYXRlLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoY29sVGVybSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKGNvbElkID09PSAnYXNzaWduZWVzJyAmJiAhcmVxLmFzc2lnbmVlcy5zb21lKGEgPT4gYS5uYW1lLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoY29sVGVybSkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvLyBDdXN0b20gY29sdW1ucyBsb2dpYy4uLlxuICAgICAgICBpZiAoIVsnaWQnLCd0aXRsZScsJ3N0YXR1cycsJ3ByaW9yaXR5JywnZHVlRGF0ZScsJ2Fzc2lnbmVlcyddLmluY2x1ZGVzKGNvbElkKSkge1xuICAgICAgICAgICBjb25zdCB2YWwgPSByZXEuY3VzdG9tQ29sdW1ucz8uW2NvbElkXSB8fCAnJztcbiAgICAgICAgICAgaWYgKCF2YWwudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhjb2xUZXJtKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pXG4gICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmICghc29ydEZpZWxkKSByZXR1cm4gMDtcbiAgICAgIFxuICAgICAgbGV0IHZhbEEgPSBhW3NvcnRGaWVsZF0gfHwgJyc7XG4gICAgICBsZXQgdmFsQiA9IGJbc29ydEZpZWxkXSB8fCAnJztcblxuICAgICAgaWYgKHNvcnRGaWVsZCA9PT0gJ2lkJykge1xuICAgICAgICAgLy8gUkVRLSDsiKvsnpAg7YyM7Iux7ZWY7JesIOu5hOq1kFxuICAgICAgICAgY29uc3QgbnVtQSA9IHBhcnNlSW50KFN0cmluZyh2YWxBKS5yZXBsYWNlKCdSRVEtJywgJycpLCAxMCkgfHwgMDtcbiAgICAgICAgIGNvbnN0IG51bUIgPSBwYXJzZUludChTdHJpbmcodmFsQikucmVwbGFjZSgnUkVRLScsICcnKSwgMTApIHx8IDA7XG4gICAgICAgICByZXR1cm4gc29ydERpcmVjdGlvbiA9PT0gJ2FzYycgPyBudW1BIC0gbnVtQiA6IG51bUIgLSBudW1BO1xuICAgICAgfVxuXG4gICAgICBpZiAoc29ydEZpZWxkID09PSAnZHVlRGF0ZScpIHtcbiAgICAgICAgY29uc3QgZGF0ZUEgPSBuZXcgRGF0ZSh2YWxBIGFzIHN0cmluZykuZ2V0VGltZSgpO1xuICAgICAgICBjb25zdCBkYXRlQiA9IG5ldyBEYXRlKHZhbEIgYXMgc3RyaW5nKS5nZXRUaW1lKCk7XG4gICAgICAgIHJldHVybiBzb3J0RGlyZWN0aW9uID09PSAnYXNjJyA/IGRhdGVBIC0gZGF0ZUIgOiBkYXRlQiAtIGRhdGVBO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdHJBID0gU3RyaW5nKHZhbEEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBzdHJCID0gU3RyaW5nKHZhbEIpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIHJldHVybiBzb3J0RGlyZWN0aW9uID09PSAnYXNjJyA/IGNvbGxhdG9yLmNvbXBhcmUoc3RyQSwgc3RyQikgOiBjb2xsYXRvci5jb21wYXJlKHN0ckIsIHN0ckEpO1xuICAgIH0pLCBbcmVxdWlyZW1lbnRzLCBwcmlvcml0eUZpbHRlciwgc3RhdHVzRmlsdGVyLCBzZWFyY2hUZXJtLCBjb2x1bW5TZWFyY2hUZXJtcywgc29ydEZpZWxkLCBzb3J0RGlyZWN0aW9uLCBjb2xsYXRvcl0pO1xuXG4gIC8vIEhhbmRsZSBDaGVja2VkIHN0YXRlXG4gIGNvbnN0IGhhbmRsZVNlbGVjdEFsbCA9IChjaGVja2VkOiBib29sZWFuKSA9PiB7XG4gICAgaWYgKGNoZWNrZWQpIHtcbiAgICAgIGNvbnN0IGFsbEZpbHRlcmVkSWRzID0gZmlsdGVyZWRBbmRTb3J0ZWRSZXF1aXJlbWVudHMubWFwKHIgPT4gci5pZCk7XG4gICAgICBzZXRTZWxlY3RlZElkcyhhbGxGaWx0ZXJlZElkcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFNlbGVjdGVkSWRzKFtdKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlU2VsZWN0Um93ID0gdXNlQ2FsbGJhY2soKGlkOiBzdHJpbmcsIGNoZWNrZWQ6IGJvb2xlYW4pID0+IHtcbiAgICBpZiAoY2hlY2tlZCkge1xuICAgICAgc2V0U2VsZWN0ZWRJZHMocHJldiA9PiBbLi4ucHJldiwgaWRdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0U2VsZWN0ZWRJZHMocHJldiA9PiBwcmV2LmZpbHRlcih4ID0+IHggIT09IGlkKSk7XG4gICAgfVxuICB9LCBbXSk7XG5cbiAgLy8gMS4gU29ydCBIYW5kbGVyXG4gIGNvbnN0IGhhbmRsZVNvcnQgPSAoZmllbGQ6ICdpZCcgfCAndGl0bGUnIHwgJ2R1ZURhdGUnIHwgJ3N0YXR1cycpID0+IHtcbiAgICBpZiAoc29ydEZpZWxkID09PSBmaWVsZCkge1xuICAgICAgc2V0U29ydERpcmVjdGlvbihwcmV2ID0+IChwcmV2ID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFNvcnRGaWVsZChmaWVsZCk7XG4gICAgICBzZXRTb3J0RGlyZWN0aW9uKCdhc2MnKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gMi4gQWRkIFJvdyBGdW5jdGlvblxuICBjb25zdCBoYW5kbGVBZGRSb3cgPSAoKSA9PiB7XG4gICAgLy8gR2VuZXJhdGUgbmV3IGF1dG9pbmNyZW1lbnRlZCBJRFxuICAgIGNvbnN0IG1heE51bWVyaWNJZCA9IHJlcXVpcmVtZW50cy5yZWR1Y2UoKG1heCwgcikgPT4ge1xuICAgICAgY29uc3QgbWF0Y2ggPSByLmlkLm1hdGNoKC9SRVEtKFxcZCspLyk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgY29uc3QgbnVtID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgcmV0dXJuIG51bSA+IG1heCA/IG51bSA6IG1heDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXg7XG4gICAgfSwgMCk7XG5cbiAgICBjb25zdCBuZXh0SWQgPSBgUkVRLSR7U3RyaW5nKG1heE51bWVyaWNJZCArIDEpLnBhZFN0YXJ0KDMsICcwJyl9YDtcbiAgICBcbiAgICAvLyBVc2UgYXNzaWduZWVzUG9vbFswXSBpZiBhdmFpbGFibGUsIG90aGVyd2lzZSBhIHBsYWNlaG9sZGVyXG4gICAgY29uc3QgZGVmYXVsdEFzc2lnbmVlID0gYXNzaWduZWVzUG9vbC5sZW5ndGggPiAwID8gYXNzaWduZWVzUG9vbFswXSA6IHsgaWQ6ICdVU1ItMDAwJywgbmFtZTogJ+uvuOyngOyglScsIGF2YXRhclVybDogJycgfTtcblxuICAgIGNvbnN0IG5ld1JlcTogUmVxdWlyZW1lbnQgPSB7XG4gICAgICBpZDogbmV4dElkLFxuICAgICAgdGl0bGU6ICfsg4jroZwg7LaU6rCA65CcIOyalOq1rOyCrO2VrSDrgrTsmqnsnYQg7J6F66Cl7ZWY7IS47JqUJyxcbiAgICAgIHByaW9yaXR5OiAnTUVESVVNJyxcbiAgICAgIGFzc2lnbmVlczogW2RlZmF1bHRBc3NpZ25lZV0sIC8vIGFzc2lnbiBkZWZhdWx0IHVzZXJcbiAgICAgIGR1ZURhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdLFxuICAgICAgc3RhdHVzOiAnVE9ETycsXG4gICAgICBjdXN0b21Db2x1bW5zOiB7fVxuICAgIH07XG5cbiAgICBzZXRSZXF1aXJlbWVudHMocHJldiA9PiBbLi4ucHJldiwgbmV3UmVxXSk7XG4gICAgLy8gSW1tZWRpYXRlbHkgb3BlbiBlZGl0b3IgZm9yIG5hbWVcbiAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKHsgcm93SWQ6IG5leHRJZCwgZmllbGQ6ICd0aXRsZScgfSk7XG4gIH07XG5cbiAgLy8gMy4gRGVsZXRlIHNlbGVjdGVkIHJvd3NcbiAgY29uc3QgaGFuZGxlRGVsZXRlU2VsZWN0ZWQgPSB1c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkSWRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmIChjb25maXJtKGDshKDtg53tlZwgJHtzZWxlY3RlZElkcy5sZW5ndGh96rCc7J2YIOyalOq1rOyCrO2VrSDsvZTrk5zrpbwg7JiB6rWs7KCB7Jy866GcIOu2hO2VoC/sgq3soJztlZjsi5zqsqDsirXri4jquYw/YCkpIHtcbiAgICAgICBzZXRSZXF1aXJlbWVudHMocHJldiA9PiBwcmV2LmZpbHRlcihyID0+ICFzZWxlY3RlZElkcy5pbmNsdWRlcyhyLmlkKSkpO1xuICAgICAgIHNldFNlbGVjdGVkSWRzKFtdKTtcbiAgICB9XG4gIH0sIFtzZWxlY3RlZElkcywgc2V0UmVxdWlyZW1lbnRzXSk7XG5cbiAgLy8gNC4gVXBkYXRlIHNpbmdsZSBmaWVsZFxuICBjb25zdCB1cGRhdGVSZXF1aXJlbWVudEZpZWxkID0gdXNlQ2FsbGJhY2soKHJvd0lkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICBzZXRSZXF1aXJlbWVudHMocHJldiA9PiBwcmV2Lm1hcChyZXEgPT4ge1xuICAgICAgaWYgKHJlcS5pZCA9PT0gcm93SWQpIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgQ29sdW1uc1xuICAgICAgICBpZiAoZmllbGQgPT09ICdpZCcpIHtcbiAgICAgICAgICBpZiAocHJldi5zb21lKHIgPT4gci5pZCA9PT0gdmFsdWUgJiYgci5pZCAhPT0gcm93SWQpKSB7XG4gICAgICAgICAgICBhbGVydCgn7J2066+4IOyhtOyerO2VmOuKlCBJROyeheuLiOuLpC4nKTtcbiAgICAgICAgICAgIHJldHVybiByZXE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IC4uLnJlcSwgaWQ6IHZhbHVlIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpZWxkID09PSAndGl0bGUnKSByZXR1cm4geyAuLi5yZXEsIHRpdGxlOiB2YWx1ZSB9O1xuICAgICAgICBpZiAoZmllbGQgPT09ICdwcmlvcml0eScpIHJldHVybiB7IC4uLnJlcSwgcHJpb3JpdHk6IHZhbHVlIGFzIFByaW9yaXR5IH07XG4gICAgICAgIGlmIChmaWVsZCA9PT0gJ3N0YXR1cycpIHJldHVybiB7IC4uLnJlcSwgc3RhdHVzOiB2YWx1ZSBhcyBTdGF0dXMgfTtcbiAgICAgICAgaWYgKGZpZWxkID09PSAnZHVlRGF0ZScpIHJldHVybiB7IC4uLnJlcSwgZHVlRGF0ZTogdmFsdWUgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIEN1c3RvbSBkeW5hbWljIGNvbHVtbnNcbiAgICAgICAgY29uc3QgdXBkYXRlZEN1c3RvbSA9IHsgLi4ucmVxLmN1c3RvbUNvbHVtbnMsIFtmaWVsZF06IHZhbHVlIH07XG4gICAgICAgIHJldHVybiB7IC4uLnJlcSwgY3VzdG9tQ29sdW1uczogdXBkYXRlZEN1c3RvbSB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcTtcbiAgICB9KSk7XG4gIH0sIFtzZXRSZXF1aXJlbWVudHNdKTtcblxuICAvLyA1LiBBZGQgb3IgRWRpdCBDdXN0b20gQ29sdW1uXG4gIGNvbnN0IGhhbmRsZUFkZE9yRWRpdEN1c3RvbUNvbHVtbiA9ICgpID0+IHtcbiAgICBpZiAoIW5ld0NvbHVtbk5hbWUudHJpbSgpKSByZXR1cm47XG4gICAgXG4gICAgaWYgKGVkaXRpbmdDb2x1bW5EZWZJZCkge1xuICAgICAgc2V0Q29sdW1ucyhwcmV2ID0+IHByZXYubWFwKGMgPT4ge1xuICAgICAgICAgaWYgKGMuaWQgPT09IGVkaXRpbmdDb2x1bW5EZWZJZCkge1xuICAgICAgICAgICAgbGV0IG9wdGlvbnMgPSAobmV3Q29sdW1uVHlwZSA9PT0gJ3N0YXR1cycgfHwgbmV3Q29sdW1uVHlwZSA9PT0gJ3NlbGVjdCcpID8gKG5ld0NvbHVtblR5cGUgPT09ICdzZWxlY3QnID8gbmV3Q29sdW1uT3B0aW9uc0lucHV0IDogc3RhdHVzT3B0aW9uc0lucHV0KS5zcGxpdCgnLCcpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbikgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChuZXdDb2x1bW5UeXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgICAgICAgIHJlcXVpcmVtZW50cy5mb3JFYWNoKHJlcSA9PiB7XG4gICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSByZXEuY3VzdG9tQ29sdW1ucz8uW2VkaXRpbmdDb2x1bW5EZWZJZF07XG4gICAgICAgICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICBleGlzdGluZ1ZhbHVlcy5hZGQodmFsLnRyaW0oKSk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgIGV4aXN0aW5nVmFsdWVzLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zIS5pbmNsdWRlcyh2YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMhLnB1c2godmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgIC4uLmMsXG4gICAgICAgICAgICAgICBsYWJlbDogbmV3Q29sdW1uTmFtZS50cmltKCksXG4gICAgICAgICAgICAgICB0eXBlOiBuZXdDb2x1bW5UeXBlLFxuICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgIGZvcm11bGE6IG5ld0NvbHVtblR5cGUgPT09ICdmb3JtdWxhJyA/IGZvcm11bGFJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGJ1dHRvbkFjdGlvbjogbmV3Q29sdW1uVHlwZSA9PT0gJ2J1dHRvbicgPyBidXR0b25BY3Rpb25JbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGJ1dHRvbkxhYmVsOiBuZXdDb2x1bW5UeXBlID09PSAnYnV0dG9uJyA/IGJ1dHRvbkxhYmVsSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBjdXJyZW5jeUFtb3VudENvbElkOiBuZXdDb2x1bW5UeXBlID09PSAnY3VycmVuY3lfdXNkJyA/IGN1cnJlbmN5QW1vdW50Q29sSWRJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgIGN1cnJlbmN5Q29kZUNvbElkOiBuZXdDb2x1bW5UeXBlID09PSAnY3VycmVuY3lfdXNkJyA/IGN1cnJlbmN5Q29kZUNvbElkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBjdXJyZW5jeURlY2ltYWxQbGFjZXM6IG5ld0NvbHVtblR5cGUgPT09ICdjdXJyZW5jeV91c2QnID8gY3VycmVuY3lEZWNpbWFsUGxhY2VzSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICByb2xsdXBSZWxJZDogbmV3Q29sdW1uVHlwZSA9PT0gJ3JvbGx1cCcgPyByb2xsdXBSZWxJZElucHV0IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgcm9sbHVwQWdnVHlwZTogbmV3Q29sdW1uVHlwZSA9PT0gJ3JvbGx1cCcgPyByb2xsdXBBZ2dUeXBlSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBsb29rdXBUYWJJZDogbmV3Q29sdW1uVHlwZSA9PT0gJ2xvb2t1cCcgPyBsb29rdXBUYWJJZElucHV0IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgbG9va3VwTWF0Y2hNeUNvbElkOiBuZXdDb2x1bW5UeXBlID09PSAnbG9va3VwJyA/IGxvb2t1cE1hdGNoTXlDb2xJZElucHV0IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgbG9va3VwTWF0Y2hUYXJnZXRDb2xJZDogbmV3Q29sdW1uVHlwZSA9PT0gJ2xvb2t1cCcgPyBsb29rdXBNYXRjaFRhcmdldENvbElkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICBsb29rdXBSZXR1cm5UYXJnZXRDb2xJZDogbmV3Q29sdW1uVHlwZSA9PT0gJ2xvb2t1cCcgPyBsb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0IDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgZGVjaW1hbFBsYWNlczogZGVjaW1hbFBsYWNlc0lucHV0ICE9PSAnJyA/IE51bWJlcihkZWNpbWFsUGxhY2VzSW5wdXQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgIH1cbiAgICAgICAgIHJldHVybiBjO1xuICAgICAgfSkpO1xuICAgICAgc2V0U2hvd0FkZENvbHVtbk1vZGFsKGZhbHNlKTtcbiAgICAgIHNldEVkaXRpbmdDb2x1bW5EZWZJZChudWxsKTtcbiAgICAgIC8vIFJlc2V0IGZvcm1zXG4gICAgICBzZXROZXdDb2x1bW5OYW1lKCcnKTtcbiAgICAgIHNldE5ld0NvbHVtblR5cGUoJ3RleHQnKTtcbiAgICAgIHNldEZvcm11bGFJbnB1dCgnJyk7XG4gICAgICBzZXRCdXR0b25MYWJlbElucHV0KCcnKTtcbiAgICAgIHNldEJ1dHRvbkFjdGlvbklucHV0KCdzdGFydF93b3JrJyk7XG4gICAgICBzZXRSb2xsdXBSZWxJZElucHV0KCcnKTtcbiAgICAgIHNldFJvbGx1cEFnZ1R5cGVJbnB1dCgnY291bnQnKTtcbiAgICAgIHNldE5ld0NvbHVtbk9wdGlvbnNJbnB1dCgnJyk7XG4gICAgICBzZXRDdXJyZW5jeURlY2ltYWxQbGFjZXNJbnB1dCgwKTtcbiAgICAgIHNldERlY2ltYWxQbGFjZXNJbnB1dCgnJyk7XG4gICAgICBzZXRMb29rdXBUYWJJZElucHV0KCcnKTtcbiAgICAgIHNldExvb2t1cE1hdGNoTXlDb2xJZElucHV0KCcnKTtcbiAgICAgIHNldExvb2t1cE1hdGNoVGFyZ2V0Q29sSWRJbnB1dCgnJyk7XG4gICAgICBzZXRMb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0KCcnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xJZCA9IGBjdXN0b21fJHtuZXdDb2x1bW5OYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICdfJyl9YDtcbiAgICBcbiAgICAvLyBDaGVjayBkdXBsaWNhdGlvblxuICAgIGlmIChjb2x1bW5zLnNvbWUoYyA9PiBjLmxhYmVsID09PSBuZXdDb2x1bW5OYW1lLnRyaW0oKSB8fCBjLmlkID09PSBjb2xJZCkpIHtcbiAgICAgIGFsZXJ0KCfsnbTrr7gg7KG07J6s7ZWY64qUIOyXtCDsnbTrpoTsnoXri4jri6QuJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0Q29sdW1ucyhwcmV2ID0+IFsuLi5wcmV2LCB7IFxuICAgICAgaWQ6IGNvbElkLCBcbiAgICAgIGxhYmVsOiBuZXdDb2x1bW5OYW1lLnRyaW0oKSwgXG4gICAgICBpc0N1c3RvbTogdHJ1ZSwgXG4gICAgICB0eXBlOiBuZXdDb2x1bW5UeXBlLFxuICAgICAgb3B0aW9uczogKG5ld0NvbHVtblR5cGUgPT09ICdzdGF0dXMnIHx8IG5ld0NvbHVtblR5cGUgPT09ICdzZWxlY3QnKSA/IChuZXdDb2x1bW5UeXBlID09PSAnc2VsZWN0JyA/IG5ld0NvbHVtbk9wdGlvbnNJbnB1dCA6IHN0YXR1c09wdGlvbnNJbnB1dCkuc3BsaXQoJywnKS5tYXAocyA9PiBzLnRyaW0oKSkuZmlsdGVyKEJvb2xlYW4pIDogdW5kZWZpbmVkLFxuICAgICAgZm9ybXVsYTogbmV3Q29sdW1uVHlwZSA9PT0gJ2Zvcm11bGEnID8gZm9ybXVsYUlucHV0IDogdW5kZWZpbmVkLFxuICAgICAgYnV0dG9uQWN0aW9uOiBuZXdDb2x1bW5UeXBlID09PSAnYnV0dG9uJyA/IGJ1dHRvbkFjdGlvbklucHV0IDogdW5kZWZpbmVkLFxuICAgICAgYnV0dG9uTGFiZWw6IG5ld0NvbHVtblR5cGUgPT09ICdidXR0b24nID8gYnV0dG9uTGFiZWxJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgIGN1cnJlbmN5QW1vdW50Q29sSWQ6IG5ld0NvbHVtblR5cGUgPT09ICdjdXJyZW5jeV91c2QnID8gY3VycmVuY3lBbW91bnRDb2xJZElucHV0IDogdW5kZWZpbmVkLFxuICAgICAgY3VycmVuY3lDb2RlQ29sSWQ6IG5ld0NvbHVtblR5cGUgPT09ICdjdXJyZW5jeV91c2QnID8gY3VycmVuY3lDb2RlQ29sSWRJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgIGN1cnJlbmN5RGVjaW1hbFBsYWNlczogbmV3Q29sdW1uVHlwZSA9PT0gJ2N1cnJlbmN5X3VzZCcgPyBjdXJyZW5jeURlY2ltYWxQbGFjZXNJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgIHJvbGx1cFJlbElkOiBuZXdDb2x1bW5UeXBlID09PSAncm9sbHVwJyA/IHJvbGx1cFJlbElkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICByb2xsdXBBZ2dUeXBlOiBuZXdDb2x1bW5UeXBlID09PSAncm9sbHVwJyA/IHJvbGx1cEFnZ1R5cGVJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgIGxvb2t1cFRhYklkOiBuZXdDb2x1bW5UeXBlID09PSAnbG9va3VwJyA/IGxvb2t1cFRhYklkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICBsb29rdXBNYXRjaE15Q29sSWQ6IG5ld0NvbHVtblR5cGUgPT09ICdsb29rdXAnID8gbG9va3VwTWF0Y2hNeUNvbElkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICBsb29rdXBNYXRjaFRhcmdldENvbElkOiBuZXdDb2x1bW5UeXBlID09PSAnbG9va3VwJyA/IGxvb2t1cE1hdGNoVGFyZ2V0Q29sSWRJbnB1dCA6IHVuZGVmaW5lZCxcbiAgICAgIGxvb2t1cFJldHVyblRhcmdldENvbElkOiBuZXdDb2x1bW5UeXBlID09PSAnbG9va3VwJyA/IGxvb2t1cFJldHVyblRhcmdldENvbElkSW5wdXQgOiB1bmRlZmluZWQsXG4gICAgICBkZWNpbWFsUGxhY2VzOiBkZWNpbWFsUGxhY2VzSW5wdXQgIT09ICcnID8gTnVtYmVyKGRlY2ltYWxQbGFjZXNJbnB1dCkgOiB1bmRlZmluZWQsXG4gICAgfV0pO1xuICAgIFxuICAgIC8vIFJlc2V0IGZvcm1zXG4gICAgc2V0TmV3Q29sdW1uTmFtZSgnJyk7XG4gICAgc2V0TmV3Q29sdW1uVHlwZSgndGV4dCcpO1xuICAgIHNldEZvcm11bGFJbnB1dCgnJyk7XG4gICAgc2V0QnV0dG9uTGFiZWxJbnB1dCgnJyk7XG4gICAgc2V0QnV0dG9uQWN0aW9uSW5wdXQoJ3N0YXJ0X3dvcmsnKTtcbiAgICBzZXRSb2xsdXBSZWxJZElucHV0KCcnKTtcbiAgICBzZXRSb2xsdXBBZ2dUeXBlSW5wdXQoJ2NvdW50Jyk7XG4gICAgc2V0Q3VycmVuY3lEZWNpbWFsUGxhY2VzSW5wdXQoMCk7XG4gICAgc2V0RGVjaW1hbFBsYWNlc0lucHV0KCcnKTtcbiAgICBzZXRMb29rdXBUYWJJZElucHV0KCcnKTtcbiAgICBzZXRMb29rdXBNYXRjaE15Q29sSWRJbnB1dCgnJyk7XG4gICAgc2V0TG9va3VwTWF0Y2hUYXJnZXRDb2xJZElucHV0KCcnKTtcbiAgICBzZXRMb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0KCcnKTtcbiAgICBzZXRTaG93QWRkQ29sdW1uTW9kYWwoZmFsc2UpO1xuICB9O1xuXG4gIC8vIERlbGV0ZSBDdXN0b20gQ29sdW1uIGhlbHBlclxuICBjb25zdCBoYW5kbGVEZWxldGVDdXN0b21Db2x1bW4gPSAoY29sSWQ6IHN0cmluZykgPT4ge1xuICAgIHNldENvbHVtblRvRGVsZXRlKGNvbElkKTtcbiAgfTtcblxuICBjb25zdCBleGVjdXRlRGVsZXRlQ29sdW1uID0gKCkgPT4ge1xuICAgIGlmICghY29sdW1uVG9EZWxldGUpIHJldHVybjtcbiAgICBzZXRDb2x1bW5zKHByZXYgPT4gcHJldi5maWx0ZXIoYyA9PiBjLmlkICE9PSBjb2x1bW5Ub0RlbGV0ZSkpO1xuICAgIC8vIFB1cmdlIGZyb20gcmVxdWlyZW1lbnQgb2JqZWN0c1xuICAgIHNldFJlcXVpcmVtZW50cyhwcmV2ID0+IHByZXYubWFwKHJlcSA9PiB7XG4gICAgICBpZiAocmVxLmN1c3RvbUNvbHVtbnMpIHtcbiAgICAgICAgY29uc3QgZGljdCA9IHsgLi4ucmVxLmN1c3RvbUNvbHVtbnMgfTtcbiAgICAgICAgZGVsZXRlIGRpY3RbY29sdW1uVG9EZWxldGVdO1xuICAgICAgICByZXR1cm4geyAuLi5yZXEsIGN1c3RvbUNvbHVtbnM6IGRpY3QgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXE7XG4gICAgfSkpO1xuICAgIHNldENvbHVtblRvRGVsZXRlKG51bGwpO1xuICB9O1xuXG4gIC8vIDYuIEV4Y2VsIEV4cG9ydGVyIHZpYSBMb2NhbCBBcHBcbiAgY29uc3QgaGFuZGxlRXhwb3J0RXhjZWwgPSBhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKTtcbiAgICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KCfsmpTqtazsgqztla0g6rSA66asJywge1xuICAgICAgICB2aWV3czogW3sgc3RhdGU6ICdmcm96ZW4nLCB4U3BsaXQ6IDAsIHlTcGxpdDogNiB9XVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvbENvdW50ID0gY29sdW1ucy5sZW5ndGg7XG4gICAgICBjb25zdCBsYXN0Q29sTGV0dGVyID0gc2hlZXQuZ2V0Q29sdW1uKGNvbENvdW50KS5sZXR0ZXI7XG5cbiAgICAgIC8vIDEuIOusuOyEnCDrqZTtg4Ag7KCV67O0IOuwjyDtg4DsnbTti4Ag64yA7Iuc67O065OcXG4gICAgICBzaGVldC5nZXRSb3coMSkuaGVpZ2h0ID0gNDA7XG4gICAgICBzaGVldC5tZXJnZUNlbGxzKGBBMToke2xhc3RDb2xMZXR0ZXJ9MWApO1xuICAgICAgY29uc3QgdGl0bGVDZWxsID0gc2hlZXQuZ2V0Q2VsbCgnQTEnKTtcbiAgICAgIHRpdGxlQ2VsbC52YWx1ZSA9ICfsmpTqtazsobDqsbQg67aE7ISdIChDbGFyaWZpY2F0aW9uKSc7XG4gICAgICB0aXRsZUNlbGwuZm9udCA9IHsgbmFtZTogJ0hEIE1lZGl1bScsIHNpemU6IDIwLCBib2xkOiB0cnVlLCBjb2xvcjogeyBhcmdiOiAnRkZGRkZGRkYnIH0gfTtcbiAgICAgIHRpdGxlQ2VsbC5hbGlnbm1lbnQgPSB7IGhvcml6b250YWw6ICdjZW50ZXInLCB2ZXJ0aWNhbDogJ21pZGRsZScgfTtcbiAgICAgIHRpdGxlQ2VsbC5maWxsID0ge1xuICAgICAgICB0eXBlOiAnZ3JhZGllbnQnLFxuICAgICAgICBncmFkaWVudDogJ2FuZ2xlJyxcbiAgICAgICAgZGVncmVlOiA5MCxcbiAgICAgICAgc3RvcHM6IFtcbiAgICAgICAgICB7IHBvc2l0aW9uOiAwLCBjb2xvcjogeyBhcmdiOiAnRkY0NjVGQTAnIH0gfSxcbiAgICAgICAgICB7IHBvc2l0aW9uOiAxLCBjb2xvcjogeyBhcmdiOiAnRkYxRTJENUQnIH0gfVxuICAgICAgICBdXG4gICAgICB9O1xuXG4gICAgICBpZiAoY29sQ291bnQgPj0gMykge1xuICAgICAgICBjb25zdCBzdGFydExldHRlciA9IHNoZWV0LmdldENvbHVtbihjb2xDb3VudCAtIDIpLmxldHRlcjtcbiAgICAgICAgc2hlZXQubWVyZ2VDZWxscyhgJHtzdGFydExldHRlcn0yOiR7bGFzdENvbExldHRlcn0yYCk7XG4gICAgICAgIHNoZWV0Lm1lcmdlQ2VsbHMoYCR7c3RhcnRMZXR0ZXJ9Mzoke2xhc3RDb2xMZXR0ZXJ9M2ApO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgbWV0YTEgPSBzaGVldC5nZXRDZWxsKGAke3N0YXJ0TGV0dGVyfTJgKTtcbiAgICAgICAgY29uc3QgZG9uZUNvdW50ID0gcmVxdWlyZW1lbnRzLmZpbHRlcihyID0+IHIuc3RhdHVzID09PSAnRE9ORScpLmxlbmd0aDtcbiAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBNYXRoLnJvdW5kKChkb25lQ291bnQgLyByZXF1aXJlbWVudHMubGVuZ3RoKSAqIDEwMCkgfHwgMDtcbiAgICAgICAgbWV0YTEudmFsdWUgPSBg7JmE66OMKOynhO2WiSkg7ZiE7ZmpIO2RnOyLnDogJHtwcm9ncmVzc30lYDtcbiAgICAgICAgbWV0YTEuZm9udCA9IHsgbmFtZTogJ0hEIE1lZGl1bScsIGNvbG9yOiB7IGFyZ2I6ICdGRjNCODJGNicgfSwgYm9sZDogdHJ1ZSB9O1xuICAgICAgICBtZXRhMS5hbGlnbm1lbnQgPSB7IGhvcml6b250YWw6ICdyaWdodCcsIHZlcnRpY2FsOiAnbWlkZGxlJyB9O1xuXG4gICAgICAgIGNvbnN0IG1ldGEyID0gc2hlZXQuZ2V0Q2VsbChgJHtzdGFydExldHRlcn0zYCk7XG4gICAgICAgIGNvbnN0IHdhcm5pbmdDb3VudCA9IHJlcXVpcmVtZW50cy5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gJ1RPRE8nIHx8IHIuc3RhdHVzID09PSAnSU5fUFJPR1JFU1MnKS5sZW5ndGg7XG4gICAgICAgIG1ldGEyLnZhbHVlID0gYOyjvOydmCAvIOuvuOyZhOujjCDrgrTsl60g67aE7ISdOiAke3dhcm5pbmdDb3VudH3qsbRgO1xuICAgICAgICBtZXRhMi5mb250ID0geyBuYW1lOiAnSEQgTWVkaXVtJywgY29sb3I6IHsgYXJnYjogJ0ZGRUY0NDQ0JyB9LCBib2xkOiB0cnVlIH07XG4gICAgICAgIG1ldGEyLmFsaWdubWVudCA9IHsgaG9yaXpvbnRhbDogJ3JpZ2h0JywgdmVydGljYWw6ICdtaWRkbGUnIH07XG4gICAgICB9XG5cbiAgICAgIC8vIDUtNu2WiSDtl6TrjZQg7KSA67mEXG4gICAgICBjb25zdCBoZWFkZXJSb3c1ID0gc2hlZXQuZ2V0Um93KDUpO1xuICAgICAgY29uc3QgaGVhZGVyUm93NiA9IHNoZWV0LmdldFJvdyg2KTtcbiAgICAgIFxuICAgICAgbGV0IGN1cnJlbnRHcm91cDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IGdyb3VwU3RhcnRJZHggPSAtMTtcblxuICAgICAgLy8g66i87KCAIOqwgeqwgeydmCDqsJLsnYQg7JSB64uI64ukLlxuICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2wsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGNlbGw1ID0gaGVhZGVyUm93NS5nZXRDZWxsKGluZGV4ICsgMSk7XG4gICAgICAgIGNvbnN0IGNlbGw2ID0gaGVhZGVyUm93Ni5nZXRDZWxsKGluZGV4ICsgMSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoY29sLmdyb3VwTmFtZSkge1xuICAgICAgICAgICBjZWxsNS52YWx1ZSA9IGNvbC5ncm91cE5hbWU7XG4gICAgICAgICAgIGNlbGw2LnZhbHVlID0gY29sLmxhYmVsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICBjZWxsNS52YWx1ZSA9IGNvbC5sYWJlbDtcbiAgICAgICAgICAgY2VsbDYudmFsdWUgPSBjb2wubGFiZWw7XG4gICAgICAgIH1cblxuICAgICAgICBjZWxsNS5maWxsID0ge1xuICAgICAgICAgIHR5cGU6ICdncmFkaWVudCcsIGdyYWRpZW50OiAnYW5nbGUnLCBkZWdyZWU6IDkwLFxuICAgICAgICAgIHN0b3BzOiBbeyBwb3NpdGlvbjogMCwgY29sb3I6IHsgYXJnYjogJ0ZGNDY1RkEwJyB9IH0sIHsgcG9zaXRpb246IDEsIGNvbG9yOiB7IGFyZ2I6ICdGRjJCNDI3RCcgfSB9XVxuICAgICAgICB9O1xuICAgICAgICBjZWxsNS5mb250ID0geyBib2xkOiB0cnVlLCBjb2xvcjogeyBhcmdiOiAnRkZGRkZGRkYnIH0sIG5hbWU6ICdIRCBNZWRpdW0nIH07XG4gICAgICAgIGNlbGw1LmFsaWdubWVudCA9IHsgaG9yaXpvbnRhbDogJ2NlbnRlcicsIHZlcnRpY2FsOiAnbWlkZGxlJyB9O1xuXG4gICAgICAgIGNlbGw2LmZpbGwgPSB7XG4gICAgICAgICAgdHlwZTogJ2dyYWRpZW50JywgZ3JhZGllbnQ6ICdhbmdsZScsIGRlZ3JlZTogOTAsXG4gICAgICAgICAgc3RvcHM6IFt7IHBvc2l0aW9uOiAwLCBjb2xvcjogeyBhcmdiOiAnRkYyQjQyN0QnIH0gfSwgeyBwb3NpdGlvbjogMSwgY29sb3I6IHsgYXJnYjogJ0ZGMUUyRDVEJyB9IH1dXG4gICAgICAgIH07XG4gICAgICAgIGNlbGw2LmZvbnQgPSB7IGJvbGQ6IGZhbHNlLCBjb2xvcjogeyBhcmdiOiAnRkZGRkZGRkYnIH0sIG5hbWU6ICdIRCBNZWRpdW0nIH07XG4gICAgICAgIGNlbGw2LmFsaWdubWVudCA9IHsgaG9yaXpvbnRhbDogJ2NlbnRlcicsIHZlcnRpY2FsOiAnbWlkZGxlJyB9O1xuICAgICAgICBcbiAgICAgICAgY2VsbDUuYm9yZGVyID0geyByaWdodDogeyBzdHlsZTogJ21lZGl1bScsIGNvbG9yOiB7IGFyZ2I6ICdGRjJCNDI3RCcgfSB9LCB0b3A6IHsgc3R5bGU6ICdtZWRpdW0nLCBjb2xvcjogeyBhcmdiOiAnRkYyQjQyN0QnIH0gfX07XG4gICAgICAgIGNlbGw2LmJvcmRlciA9IHsgcmlnaHQ6IHsgc3R5bGU6ICdtZWRpdW0nLCBjb2xvcjogeyBhcmdiOiAnRkYyQjQyN0QnIH0gfSwgYm90dG9tOiB7IHN0eWxlOiAnbWVkaXVtJywgY29sb3I6IHsgYXJnYjogJ0ZGMkI0MjdEJyB9IH0gfTtcblxuICAgICAgICBzaGVldC5nZXRDb2x1bW4oaW5kZXggKyAxKS53aWR0aCA9IE1hdGgubWF4KDEwLCAoY29sdW1uV2lkdGhzW2NvbC5pZF0gfHwgMTUwKSAvIDcuNSk7IFxuICAgICAgfSk7XG5cbiAgICAgIC8vIOuzke2VqSDsspjrpqxcbiAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAoY29sLmdyb3VwTmFtZSkge1xuICAgICAgICAgICBpZiAoY29sLmdyb3VwTmFtZSAhPT0gY3VycmVudEdyb3VwKSB7XG4gICAgICAgICAgICAgICBpZiAoY3VycmVudEdyb3VwICYmIGdyb3VwU3RhcnRJZHggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRDZWxsID0gaGVhZGVyUm93NS5nZXRDZWxsKGdyb3VwU3RhcnRJZHggKyAxKTtcbiAgICAgICAgICAgICAgICAgICBjb25zdCBlbmRDZWxsID0gaGVhZGVyUm93NS5nZXRDZWxsKGluZGV4KTtcbiAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRDZWxsLmFkZHJlc3MgIT09IGVuZENlbGwuYWRkcmVzcykgc2hlZXQubWVyZ2VDZWxscyhgJHtzdGFydENlbGwuYWRkcmVzc306JHtlbmRDZWxsLmFkZHJlc3N9YCk7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICBjdXJyZW50R3JvdXAgPSBjb2wuZ3JvdXBOYW1lO1xuICAgICAgICAgICAgICAgZ3JvdXBTdGFydElkeCA9IGluZGV4O1xuICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgIGlmIChjdXJyZW50R3JvdXAgJiYgZ3JvdXBTdGFydElkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0Q2VsbCA9IGhlYWRlclJvdzUuZ2V0Q2VsbChncm91cFN0YXJ0SWR4ICsgMSk7XG4gICAgICAgICAgICAgICBjb25zdCBlbmRDZWxsID0gaGVhZGVyUm93NS5nZXRDZWxsKGluZGV4KTtcbiAgICAgICAgICAgICAgIGlmIChzdGFydENlbGwuYWRkcmVzcyAhPT0gZW5kQ2VsbC5hZGRyZXNzKSBzaGVldC5tZXJnZUNlbGxzKGAke3N0YXJ0Q2VsbC5hZGRyZXNzfToke2VuZENlbGwuYWRkcmVzc31gKTtcbiAgICAgICAgICAgICAgIGN1cnJlbnRHcm91cCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgIGdyb3VwU3RhcnRJZHggPSAtMTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICBjb25zdCBjZWxsNSA9IGhlYWRlclJvdzUuZ2V0Q2VsbChpbmRleCArIDEpO1xuICAgICAgICAgICBjb25zdCBjZWxsNiA9IGhlYWRlclJvdzYuZ2V0Q2VsbChpbmRleCArIDEpO1xuICAgICAgICAgICBzaGVldC5tZXJnZUNlbGxzKGAke2NlbGw1LmFkZHJlc3N9OiR7Y2VsbDYuYWRkcmVzc31gKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoY3VycmVudEdyb3VwICYmIGdyb3VwU3RhcnRJZHggIT09IC0xKSB7XG4gICAgICAgICAgY29uc3Qgc3RhcnRDZWxsID0gaGVhZGVyUm93NS5nZXRDZWxsKGdyb3VwU3RhcnRJZHggKyAxKTtcbiAgICAgICAgICBjb25zdCBlbmRDZWxsID0gaGVhZGVyUm93NS5nZXRDZWxsKGNvbHVtbnMubGVuZ3RoKTtcbiAgICAgICAgICBpZiAoc3RhcnRDZWxsLmFkZHJlc3MgIT09IGVuZENlbGwuYWRkcmVzcykgc2hlZXQubWVyZ2VDZWxscyhgJHtzdGFydENlbGwuYWRkcmVzc306JHtlbmRDZWxsLmFkZHJlc3N9YCk7XG4gICAgICB9XG5cbiAgICAgIHNoZWV0LmF1dG9GaWx0ZXIgPSBgQTY6JHtsYXN0Q29sTGV0dGVyfTZgO1xuXG4gICAgICAvLyAzLiDrjbDsnbTthLAg7IK97J6FIOuwjyDsiqTtg4DsnbzsoIHsmqlcbiAgICAgIHJlcXVpcmVtZW50cy5mb3JFYWNoKChyZXEsIGkpID0+IHtcbiAgICAgICAgY29uc3Qgcm93SW5kZXggPSA3ICsgaTtcbiAgICAgICAgY29uc3Qgcm93ID0gc2hlZXQuZ2V0Um93KHJvd0luZGV4KTtcbiAgICAgICAgXG4gICAgICAgIGxldCBpc1dhcm5pbmcgPSByZXEuc3RhdHVzID09PSAnVE9ETyc7XG4gICAgICAgIGxldCBpc1Jvb3QgPSByZXEucHJpb3JpdHkgPT09ICdISUdIJztcbiAgICAgICAgXG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sLCBjb2xJZHgpID0+IHtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmdldENlbGwoY29sSWR4ICsgMSk7XG4gICAgICAgICAgbGV0IHZhbDogYW55ID0gJyc7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGNvbC5pZCA9PT0gJ2lkJykgdmFsID0gcmVxLmlkO1xuICAgICAgICAgIGVsc2UgaWYgKGNvbC5pZCA9PT0gJ3RpdGxlJykgdmFsID0gcmVxLnRpdGxlIHx8ICcnO1xuICAgICAgICAgIGVsc2UgaWYgKGNvbC5pZCA9PT0gJ3ByaW9yaXR5JykgdmFsID0gcmVxLnByaW9yaXR5IHx8ICcnO1xuICAgICAgICAgIGVsc2UgaWYgKGNvbC5pZCA9PT0gJ2Fzc2lnbmVlcycpIHZhbCA9IChyZXEuYXNzaWduZWVzIHx8IFtdKS5tYXAoYSA9PiBhLm5hbWUpLmpvaW4oJywgJyk7XG4gICAgICAgICAgZWxzZSBpZiAoY29sLmlkID09PSAnZHVlRGF0ZScpIHZhbCA9IHJlcS5kdWVEYXRlIHx8ICcnO1xuICAgICAgICAgIGVsc2UgaWYgKGNvbC5pZCA9PT0gJ3N0YXR1cycpIHZhbCA9IHJlcS5zdGF0dXMgfHwgJyc7XG4gICAgICAgICAgZWxzZSBpZiAoY29sLnR5cGUgPT09ICdidXR0b24nKSB2YWwgPSBjb2wuYnV0dG9uTGFiZWw7XG4gICAgICAgICAgZWxzZSBpZiAoY29sLnR5cGUgPT09ICdjdXJyZW5jeV91c2QnKSB7XG4gICAgICAgICAgICAgY29uc3QgYW1vdW50Q29sID0gY29sLmN1cnJlbmN5QW1vdW50Q29sSWQgPyBjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBjb2wuY3VycmVuY3lBbW91bnRDb2xJZCkgOiBjb2x1bW5zLmZpbmQoYyA9PiBjLmxhYmVsLmluY2x1ZGVzKCfquIjslaEnKSk7XG4gICAgICAgICAgICAgY29uc3QgY3VycmVuY3lDb2wgPSBjb2wuY3VycmVuY3lDb2RlQ29sSWQgPyBjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBjb2wuY3VycmVuY3lDb2RlQ29sSWQpIDogY29sdW1ucy5maW5kKGMgPT4gYy5sYWJlbC5pbmNsdWRlcygn7ZmU7Y+QJykpO1xuICAgICAgICAgICAgIGlmIChhbW91bnRDb2wgJiYgY3VycmVuY3lDb2wpIHtcbiAgICAgICAgICAgICAgIGNvbnN0IHJhd0Ftb3VudFN0ciA9IFN0cmluZyhyZXEuY3VzdG9tQ29sdW1ucz8uW2Ftb3VudENvbC5pZF0gfHwgJzAnKS5yZXBsYWNlKC9bXjAtOS4tXSsvZywgXCJcIik7XG4gICAgICAgICAgICAgICBjb25zdCBhbW91bnQgPSBOdW1iZXIocmF3QW1vdW50U3RyKSB8fCAwO1xuICAgICAgICAgICAgICAgY29uc3QgY3VyciA9IFN0cmluZyhyZXEuY3VzdG9tQ29sdW1ucz8uW2N1cnJlbmN5Q29sLmlkXSB8fCAnJykudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgIGxldCBrcndWYWx1ZSA9IGFtb3VudDtcbiAgICAgICAgICAgICAgIGlmIChjdXJyLmluY2x1ZGVzKCdXT04nKSB8fCBjdXJyLmluY2x1ZGVzKCdLUlcnKSkge1xuICAgICAgICAgICAgICAgICBrcndWYWx1ZSA9IGFtb3VudDsgLy8gQXNzdW1pbmcgYW1vdW50IGlzIGluIEtSVyB3aGVuIGN1cnJlbmN5IGlzIFdPTi9LUldcbiAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3Vyci5pbmNsdWRlcygnRVVSJykpIHtcbiAgICAgICAgICAgICAgICAga3J3VmFsdWUgPSBhbW91bnQgKiBleGNoYW5nZVJhdGVzLkVVUjtcbiAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3Vyci5pbmNsdWRlcygnVVMnKSB8fCBjdXJyLmluY2x1ZGVzKCdVU0QnKSkge1xuICAgICAgICAgICAgICAgICBrcndWYWx1ZSA9IGFtb3VudCAqIGV4Y2hhbmdlUmF0ZXMuVVNEO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgY29uc3QgdXNkVmFsdWUgPSBrcndWYWx1ZSAvIGV4Y2hhbmdlUmF0ZXMuVVNEO1xuICAgICAgICAgICAgICAgY29uc3QgZnJhY3Rpb25EaWdpdHMgPSBjb2wuY3VycmVuY3lEZWNpbWFsUGxhY2VzICE9PSB1bmRlZmluZWQgPyBjb2wuY3VycmVuY3lEZWNpbWFsUGxhY2VzIDogMDtcbiAgICAgICAgICAgICAgIHZhbCA9IGlzTmFOKHVzZFZhbHVlKSA/ICdOL0EnIDogJyQnICsgdXNkVmFsdWUudG9Mb2NhbGVTdHJpbmcodW5kZWZpbmVkLCB7IG1pbmltdW1GcmFjdGlvbkRpZ2l0czogZnJhY3Rpb25EaWdpdHMsIG1heGltdW1GcmFjdGlvbkRpZ2l0czogZnJhY3Rpb25EaWdpdHMgfSk7XG4gICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgIHZhbCA9ICdOL0EnO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoY29sLnR5cGUgPT09ICdmb3JtdWxhJykge1xuICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgICAgICAgICAgICAgY29uc3QgZnVuYyA9IGdldEZvcm11bGFGbihjb2wuZm9ybXVsYSB8fCAnXCJcIicsIGNvbHVtbnMpO1xuICAgICAgICAgICAgICAgdmFsID0gU3RyaW5nKGZ1bmMocmVxLCB0b2RheSwgU1VNLCBBVkVSQUdFLCBJRiwgREFZUywgTU9OVEhTLCBleGNoYW5nZVJhdGVzLktSVywgZXhjaGFuZ2VSYXRlcy5VU0QsIGV4Y2hhbmdlUmF0ZXMuRVVSKSk7XG4gICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgdmFsID0gJ0Vycm9yJztcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGNvbC50eXBlID09PSAnbG9va3VwJykge1xuICAgICAgICAgICAgIGNvbnN0IHRhcmdldFRhYiA9IHRhYkRhdGFNYXA/Lltjb2wubG9va3VwVGFiSWQgfHwgJyddO1xuICAgICAgICAgICAgIGlmICh0YXJnZXRUYWIgJiYgY29sLmxvb2t1cE1hdGNoTXlDb2xJZCAmJiBjb2wubG9va3VwTWF0Y2hUYXJnZXRDb2xJZCAmJiBjb2wubG9va3VwUmV0dXJuVGFyZ2V0Q29sSWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBteVZhbCA9IGNvbC5sb29rdXBNYXRjaE15Q29sSWQgPT09ICd0aXRsZScgPyByZXEudGl0bGUgOiByZXEuY3VzdG9tQ29sdW1ucz8uW2NvbC5sb29rdXBNYXRjaE15Q29sSWRdO1xuICAgICAgICAgICAgICAgIGlmIChteVZhbCkge1xuICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZWRSZXEgPSB0YXJnZXRUYWI/LnJlcXVpcmVtZW50cz8uZmluZCgocjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdFZhbCA9IGNvbC5sb29rdXBNYXRjaFRhcmdldENvbElkID09PSAndGl0bGUnID8gci50aXRsZSA6IHIuY3VzdG9tQ29sdW1ucz8uW2NvbC5sb29rdXBNYXRjaFRhcmdldENvbElkIV07XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRWYWwgPT09IG15VmFsO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGVkUmVxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgdmFsID0gY29sLmxvb2t1cFJldHVyblRhcmdldENvbElkID09PSAndGl0bGUnID8gbWF0Y2hlZFJlcS50aXRsZSA6IG1hdGNoZWRSZXEuY3VzdG9tQ29sdW1ucz8uW2NvbC5sb29rdXBSZXR1cm5UYXJnZXRDb2xJZF0gfHwgJyc7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAmJiAhaXNOYU4oTnVtYmVyKHZhbCkpICYmIGNvbC5kZWNpbWFsUGxhY2VzICE9PSB1bmRlZmluZWQpIHZhbCA9IFN0cmluZyhOdW1iZXIodmFsKS50b0ZpeGVkKGNvbC5kZWNpbWFsUGxhY2VzKSk7XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGNvbC50eXBlID09PSAncmVsYXRpb24nKSB7XG4gICAgICAgICAgICAgdmFsID0gcmVxLmN1c3RvbUNvbHVtbnM/Lltjb2wuaWRdIHx8ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChjb2wudHlwZSA9PT0gJ3JvbGx1cCcpIHtcbiAgICAgICAgICAgICBjb25zdCByZWxDb2xWYWwgPSByZXEuY3VzdG9tQ29sdW1ucz8uW2NvbC5yb2xsdXBSZWxJZCB8fCAnJ10gfHwgJyc7XG4gICAgICAgICAgICAgY29uc3QgcmVsSWRzID0gcmVsQ29sVmFsLnNwbGl0KCcsJykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICAgICBjb25zdCBsaW5rZWRSZXFzID0gcmVsSWRzLm1hcChyaWQgPT4gcmVxdWlyZW1lbnRzLmZpbmQociA9PiByLmlkID09PSByaWQpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICAgaWYgKGxpbmtlZFJlcXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgaWYgKGNvbC5yb2xsdXBBZ2dUeXBlID09PSAnY291bnQnKSB7XG4gICAgICAgICAgICAgICAgIHZhbCA9IGxpbmtlZFJlcXMubGVuZ3RoLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbC5yb2xsdXBBZ2dUeXBlID09PSAncGVyY2VudF9kb25lJykge1xuICAgICAgICAgICAgICAgICBjb25zdCBkb25lQ291bnQgPSBsaW5rZWRSZXFzLmZpbHRlcihyID0+IHIuc3RhdHVzID09PSAnRE9ORScpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgdmFsID0gYCR7TWF0aC5yb3VuZCgoZG9uZUNvdW50IC8gbGlua2VkUmVxcy5sZW5ndGgpICogMTAwKX0lYDtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgdmFsID0gJy0nO1xuICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoY29sLnR5cGUgPT09ICdzdGF0dXMnKSB7XG4gICAgICAgICAgICAgdmFsID0gcmVxLmN1c3RvbUNvbHVtbnM/Lltjb2wuaWRdIHx8ICcnO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChjb2wuaXNDdXN0b20pIHZhbCA9IHJlcS5jdXN0b21Db2x1bW5zPy5bY29sLmlkXSB8fCAnJztcblxuICAgICAgICAgIC8vIOyIq+yekCDtg4DsnoUg7J6Q64+ZIO2MjOyLsVxuICAgICAgICAgIGlmICgvXlxcLT9cXGQrKFxcLlxcZCspPyQvLnRlc3QoU3RyaW5nKHZhbCkpKSB7XG4gICAgICAgICAgICBjZWxsLnZhbHVlID0gTnVtYmVyKHZhbCk7XG4gICAgICAgICAgICBpZiAoY29sLmRlY2ltYWxQbGFjZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBjb25zdCBtYXNrID0gY29sLmRlY2ltYWxQbGFjZXMgPT09IDAgPyBcIjBcIiA6IFwiMC5cIiArIFwiMFwiLnJlcGVhdChjb2wuZGVjaW1hbFBsYWNlcyk7XG4gICAgICAgICAgICAgIGNlbGwubnVtRm10ID0gbWFzaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2VsbC52YWx1ZSA9IFN0cmluZyh2YWwpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIOuPmeyggSDtlokg64aS7J20IOyhsOygiFxuICAgICAgICAgIGNvbnN0IGxpbmVzID0gU3RyaW5nKHZhbCkuc3BsaXQoJ1xcbicpLmxlbmd0aDtcbiAgICAgICAgICBpZiAobGluZXMgPiAxKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdIZWlnaHQgPSBsaW5lcyA+PSAzID8gNDUgOiAzMDtcbiAgICAgICAgICAgIGlmICgocm93LmhlaWdodCB8fCAyMikgPCBuZXdIZWlnaHQpIHJvdy5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICBpZiAoKHJvdy5oZWlnaHQgfHwgMCkgPCAyMikgcm93LmhlaWdodCA9IDIyO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNlbGwuYWxpZ25tZW50ID0geyB3cmFwVGV4dDogdHJ1ZSwgdmVydGljYWw6ICdtaWRkbGUnIH07XG4gICAgICAgICAgY2VsbC5mb250ID0geyBuYW1lOiAnSEQgTWVkaXVtJywgc2l6ZTogOCB9O1xuXG4gICAgICAgICAgaWYgKGlzUm9vdCkge1xuICAgICAgICAgICAgY2VsbC5maWxsID0ge1xuICAgICAgICAgICAgICAgdHlwZTogJ2dyYWRpZW50JywgZ3JhZGllbnQ6ICdhbmdsZScsIGRlZ3JlZTogOTAsXG4gICAgICAgICAgICAgICBzdG9wczogW3sgcG9zaXRpb246IDAsIGNvbG9yOiB7IGFyZ2I6ICdGRjQ3NTU2OScgfSB9LCB7IHBvc2l0aW9uOiAxLCBjb2xvcjogeyBhcmdiOiAnRkYzMzQxNTUnIH0gfV1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjZWxsLmZvbnQgPSB7IC4uLmNlbGwuZm9udCBhcyBhbnksIGJvbGQ6IHRydWUsIGNvbG9yOiB7IGFyZ2I6ICdGRkZGRkZGRicgfSB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjZWxsLmZpbGwgPSB7IHR5cGU6ICdwYXR0ZXJuJywgcGF0dGVybjogJ3NvbGlkJywgZmdDb2xvcjogeyBhcmdiOiAnRkZGMUY1RjknIH0gfTsgXG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNlbGwuYm9yZGVyID0ge1xuICAgICAgICAgICAgdG9wOiB7IHN0eWxlOiAndGhpbicsIGNvbG9yOiB7IGFyZ2I6ICdGRkNCRDVFMScgfSB9LFxuICAgICAgICAgICAgYm90dG9tOiB7IHN0eWxlOiAndGhpbicsIGNvbG9yOiB7IGFyZ2I6ICdGRkNCRDVFMScgfSB9LFxuICAgICAgICAgICAgbGVmdDogeyBzdHlsZTogJ3RoaW4nLCBjb2xvcjogeyBhcmdiOiAnRkZDQkQ1RTEnIH0gfSxcbiAgICAgICAgICAgIHJpZ2h0OiB7IHN0eWxlOiAndGhpbicsIGNvbG9yOiBjb2xJZHggPT09IGNvbHVtbnMubGVuZ3RoIC0gMSA/IHsgYXJnYjogJ0ZGQ0JENUUxJyB9IDogdW5kZWZpbmVkIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBidWZmZXIgPSBhd2FpdCB3b3JrYm9vay54bHN4LndyaXRlQnVmZmVyKCk7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBjb25zdCBpc1RhdXJpID0gd2luZG93Ll9fVEFVUklfSU5URVJOQUxTX187XG4gICAgICBcbiAgICAgIGlmIChpc1RhdXJpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgeyBzYXZlIH0gPSBhd2FpdCBpbXBvcnQoJ0B0YXVyaS1hcHBzL3BsdWdpbi1kaWFsb2cnKTtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBjb25zdCB7IHdyaXRlRmlsZSwgQmFzZURpcmVjdG9yeSB9ID0gYXdhaXQgaW1wb3J0KCdAdGF1cmktYXBwcy9wbHVnaW4tZnMnKTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBhd2FpdCBzYXZlKHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFt7IG5hbWU6ICdFeGNlbCBXb3JrYm9vaycsIGV4dGVuc2lvbnM6IFsneGxzeCddIH1dLFxuICAgICAgICAgICAgZGVmYXVsdFBhdGg6IGBSZXF1aXJlbWVudHNfRXhwb3J0XyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF19Lnhsc3hgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKGZpbGVQYXRoKSB7XG4gICAgICAgICAgICBsZXQgdWludDhEYXRhOiBVaW50OEFycmF5O1xuICAgICAgICAgICAgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgdWludDhEYXRhID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYnVmZmVyICYmIHR5cGVvZiAoYnVmZmVyIGFzIGFueSkubGVuZ3RoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHVpbnQ4RGF0YSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlciBhcyBhbnkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJ1ZmZlciB0eXBlIHJldHVybmVkIGZyb20gRXhjZWxKU1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgeyBpbnZva2UgfSA9IGF3YWl0IGltcG9ydCgnQHRhdXJpLWFwcHMvYXBpL2NvcmUnKTtcbiAgICAgICAgICAgIGF3YWl0IGludm9rZSgnc2F2ZV9iaW5hcnlfZmlsZScsIHsgcGF0aDogZmlsZVBhdGgsIGNvbnRlbnRzOiBBcnJheS5mcm9tKHVpbnQ4RGF0YSkgfSk7XG4gICAgICAgICAgICBhbGVydChgRXhjZWwg64K067O064K06riwIOyEseqztSFcXG4ke2ZpbGVQYXRofWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZGlhbG9nRXJyOiBhbnkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ09TIO2MjOydvCDrjIDtmZTsg4HsnpAv7KCA7J6lIOyLpO2MqDogJyArIChkaWFsb2dFcnI/Lm1lc3NhZ2UgfHwgU3RyaW5nKGRpYWxvZ0VycikpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCcgfSk7XG4gICAgICAgIHNhdmVBcyhibG9iLCBgUmVxdWlyZW1lbnRzX0V4cG9ydF8ke25ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdfS54bHN4YCk7XG4gICAgICAgIGFsZXJ0KCdFeGNlbCDrgrTrs7TrgrTquLAg64uk7Jq066Gc65Oc6rCAIOyLnOyekeuQmOyXiOyKteuLiOuLpC4nKTtcbiAgICAgIH1cblxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgY29uc29sZS5lcnJvcignRXhwb3J0IGZhaWxlZDogJywgZSk7XG4gICAgICBhbGVydChg7JeR7IWAIOuCtOuztOuCtOq4sCDspJEg66y47KCc6rCAIOuwnOyDne2WiOyKteuLiOuLpDpcXG4ke2UubWVzc2FnZSB8fCBTdHJpbmcoZSl9YCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIDcuIERyYWcgYW5kIERyb3AgJiBEdXBsaWNhdGlvbiBMb2dpY1xuICBjb25zdCBbZHJhZ2dlZENvbHVtbklkLCBzZXREcmFnZ2VkQ29sdW1uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkcmFnT3ZlckNvbHVtbklkLCBzZXREcmFnT3ZlckNvbHVtbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZHJhZ2dlZFJvd0lkLCBzZXREcmFnZ2VkUm93SWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtkcmFnT3ZlclJvd0lkLCBzZXREcmFnT3ZlclJvd0lkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbY29udGV4dE1lbnVDb2xJZCwgc2V0Q29udGV4dE1lbnVDb2xJZF0gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW3N1cGVyQ29udGV4dE1lbnVHcm91cCwgc2V0U3VwZXJDb250ZXh0TWVudUdyb3VwXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbY29udGV4dE1lbnVQb3MsIHNldENvbnRleHRNZW51UG9zXSA9IHVzZVN0YXRlPHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfT4oeyB4OiAwLCB5OiAwIH0pO1xuICBjb25zdCBbaG92ZXJlZENvbHVtbklkLCBzZXRIb3ZlcmVkQ29sdW1uSWRdID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtob3ZlclRpdGxlQ29vcmRzLCBzZXRIb3ZlclRpdGxlQ29vcmRzXSA9IHVzZVN0YXRlPHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZnJvemVuQ29sdW1uSWQsIHNldEZyb3plbkNvbHVtbklkXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuXG4gIGNvbnN0IGZyb3plbk9mZnNldHMgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoIWZyb3plbkNvbHVtbklkKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBmcm96ZW5JbmRleCA9IGNvbHVtbnMuZmluZEluZGV4KGMgPT4gYy5pZCA9PT0gZnJvemVuQ29sdW1uSWQpO1xuICAgIGlmIChmcm96ZW5JbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuXG4gICAgY29uc3Qgb2Zmc2V0czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGxldCBjdXJyZW50TGVmdCA9IDg0OyAvLyA0MHB4IChpbmRleCkgKyA0NHB4IChjaGVja2JveClcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGZyb3plbkluZGV4OyBpKyspIHtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbHVtbnNbaV07XG4gICAgICBvZmZzZXRzW2NvbC5pZF0gPSBjdXJyZW50TGVmdDtcbiAgICAgIGNvbnN0IGlzTWluaW1pemVkID0gbWluaW1pemVkQ29sdW1uc1tjb2wuaWRdO1xuICAgICAgY3VycmVudExlZnQgKz0gaXNNaW5pbWl6ZWQgPyAyNCA6IChjb2x1bW5XaWR0aHNbY29sLmlkXSB8fCAxNTApO1xuICAgIH1cbiAgICByZXR1cm4geyBvZmZzZXRzLCBmcm96ZW5JbmRleCwgbGFzdENvbElkOiBjb2x1bW5zW2Zyb3plbkluZGV4XS5pZCB9O1xuICB9LCBbZnJvemVuQ29sdW1uSWQsIGNvbHVtbnMsIG1pbmltaXplZENvbHVtbnMsIGNvbHVtbldpZHRoc10pO1xuXG4gIGNvbnN0IGhhbmRsZUNvbHVtbkNvbnRleHRNZW51ID0gKGU6IFJlYWN0Lk1vdXNlRXZlbnQsIGNvbElkOiBzdHJpbmcpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2V0Q29udGV4dE1lbnVDb2xJZChjb2xJZCk7XG4gICAgc2V0Q29udGV4dE1lbnVQb3MoeyB4OiBlLmNsaWVudFgsIHk6IGUuY2xpZW50WSB9KTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVDb2x1bW5EcmFnU3RhcnQgPSAoZTogUmVhY3QuRHJhZ0V2ZW50LCBjb2xJZDogc3RyaW5nKSA9PiB7XG4gICAgc2V0RHJhZ2dlZENvbHVtbklkKGNvbElkKTtcbiAgICBlLmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgY29sSWQpO1xuICB9O1xuICBjb25zdCBoYW5kbGVDb2x1bW5EcmFnT3ZlciA9IChlOiBSZWFjdC5EcmFnRXZlbnQsIGNvbElkOiBzdHJpbmcpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgc2V0RHJhZ092ZXJDb2x1bW5JZChjb2xJZCk7XG4gIH07XG4gIGNvbnN0IGhhbmRsZUNvbHVtbkRyb3AgPSAoZTogUmVhY3QuRHJhZ0V2ZW50LCB0YXJnZXRDb2xJZDogc3RyaW5nKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldERyYWdPdmVyQ29sdW1uSWQobnVsbCk7XG4gICAgaWYgKCFkcmFnZ2VkQ29sdW1uSWQgfHwgZHJhZ2dlZENvbHVtbklkID09PSB0YXJnZXRDb2xJZCkgcmV0dXJuO1xuXG4gICAgc2V0Q29sdW1ucyhwcmV2ID0+IHtcbiAgICAgIGNvbnN0IGRyYWZ0ID0gWy4uLnByZXZdO1xuICAgICAgY29uc3QgZnJvbUluZGV4ID0gZHJhZnQuZmluZEluZGV4KGMgPT4gYy5pZCA9PT0gZHJhZ2dlZENvbHVtbklkKTtcbiAgICAgIGNvbnN0IHRvSW5kZXggPSBkcmFmdC5maW5kSW5kZXgoYyA9PiBjLmlkID09PSB0YXJnZXRDb2xJZCk7XG4gICAgICBpZiAoZnJvbUluZGV4ID09PSAtMSB8fCB0b0luZGV4ID09PSAtMSkgcmV0dXJuIHByZXY7XG4gICAgICBjb25zdCBbcmVtb3ZlZF0gPSBkcmFmdC5zcGxpY2UoZnJvbUluZGV4LCAxKTtcbiAgICAgIGRyYWZ0LnNwbGljZSh0b0luZGV4LCAwLCByZW1vdmVkKTtcbiAgICAgIHJldHVybiBkcmFmdDtcbiAgICB9KTtcbiAgICBzZXREcmFnZ2VkQ29sdW1uSWQobnVsbCk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlRHVwbGljYXRlUm93ID0gdXNlQ2FsbGJhY2soKHNvdXJjZVJvd0lkOiBzdHJpbmcsIGluc2VydEFmdGVySWQ/OiBzdHJpbmcpID0+IHtcbiAgICBzZXRSZXF1aXJlbWVudHMoKHByZXY6IFJlcXVpcmVtZW50W10pID0+IHtcbiAgICAgIGNvbnN0IHNvdXJjZVJvdyA9IHByZXYuZmluZChyID0+IHIuaWQgPT09IHNvdXJjZVJvd0lkKTtcbiAgICAgIGlmICghc291cmNlUm93KSByZXR1cm4gcHJldjtcblxuICAgICAgY29uc3QgbWF4TnVtZXJpY0lkID0gcHJldi5yZWR1Y2UoKG1heCwgcikgPT4ge1xuICAgICAgICBjb25zdCBtYXRjaCA9IHIuaWQubWF0Y2goL1JFUS0oXFxkKykvKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoID8gTWF0aC5tYXgobWF4LCBwYXJzZUludChtYXRjaFsxXSwgMTApKSA6IG1heDtcbiAgICAgIH0sIDApO1xuICAgICAgY29uc3QgbmV4dElkID0gYFJFUS0ke1N0cmluZyhtYXhOdW1lcmljSWQgKyAxKS5wYWRTdGFydCgzLCAnMCcpfWA7XG5cbiAgICAgIGNvbnN0IGNsb25lOiBSZXF1aXJlbWVudCA9IHtcbiAgICAgICAgLi4uc291cmNlUm93LFxuICAgICAgICBpZDogbmV4dElkLFxuICAgICAgICB0aXRsZTogYCR7c291cmNlUm93LnRpdGxlfSAo67O17IKs67O4KWAsXG4gICAgICAgIGFzc2lnbmVlczogWy4uLnNvdXJjZVJvdy5hc3NpZ25lZXNdLFxuICAgICAgICBjdXN0b21Db2x1bW5zOiB7IC4uLnNvdXJjZVJvdy5jdXN0b21Db2x1bW5zIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGRyYWZ0ID0gWy4uLnByZXZdO1xuICAgICAgY29uc3QgdGFyZ2V0SW5kZXggPSBkcmFmdC5maW5kSW5kZXgociA9PiByLmlkID09PSAoaW5zZXJ0QWZ0ZXJJZCB8fCBzb3VyY2VSb3dJZCkpO1xuICAgICAgaWYgKHRhcmdldEluZGV4ICE9PSAtMSkge1xuICAgICAgICBkcmFmdC5zcGxpY2UodGFyZ2V0SW5kZXggKyAxLCAwLCBjbG9uZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkcmFmdC5wdXNoKGNsb25lKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkcmFmdDtcbiAgICB9KTtcbiAgfSwgW3NldFJlcXVpcmVtZW50c10pO1xuXG4gIGNvbnN0IGhhbmRsZVJvd0RyYWdTdGFydCA9IHVzZUNhbGxiYWNrKChlOiBSZWFjdC5EcmFnRXZlbnQsIHJvd0lkOiBzdHJpbmcpID0+IHtcbiAgICBzZXREcmFnZ2VkUm93SWQocm93SWQpO1xuICAgIGUuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcImNvcHlNb3ZlXCI7XG4gICAgZS5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIHJvd0lkKTtcbiAgfSwgW10pO1xuICBcbiAgY29uc3QgaGFuZGxlUm93RHJhZ092ZXIgPSB1c2VDYWxsYmFjaygoZTogUmVhY3QuRHJhZ0V2ZW50LCByb3dJZDogc3RyaW5nKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldERyYWdPdmVyUm93SWQocm93SWQpO1xuICAgIGUuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBlLmFsdEtleSA/IFwiY29weVwiIDogXCJtb3ZlXCI7XG4gIH0sIFtdKTtcbiAgXG4gIGNvbnN0IGhhbmRsZVJvd0Ryb3AgPSB1c2VDYWxsYmFjaygoZTogUmVhY3QuRHJhZ0V2ZW50LCB0YXJnZXRSb3dJZDogc3RyaW5nKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHNldERyYWdPdmVyUm93SWQobnVsbCk7XG4gICAgaWYgKCFkcmFnZ2VkUm93SWQpIHJldHVybjtcblxuICAgIGlmIChlLmFsdEtleSkge1xuICAgICAgaGFuZGxlRHVwbGljYXRlUm93KGRyYWdnZWRSb3dJZCwgdGFyZ2V0Um93SWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZHJhZ2dlZFJvd0lkID09PSB0YXJnZXRSb3dJZCkge1xuICAgICAgICBzZXREcmFnZ2VkUm93SWQobnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNldFJlcXVpcmVtZW50cyhwcmV2ID0+IHtcbiAgICAgICAgY29uc3QgZHJhZnQgPSBbLi4ucHJldl07XG4gICAgICAgIGNvbnN0IGZyb21JbmRleCA9IGRyYWZ0LmZpbmRJbmRleChyID0+IHIuaWQgPT09IGRyYWdnZWRSb3dJZCk7XG4gICAgICAgIGNvbnN0IHRvSW5kZXggPSBkcmFmdC5maW5kSW5kZXgociA9PiByLmlkID09PSB0YXJnZXRSb3dJZCk7XG4gICAgICAgIGlmIChmcm9tSW5kZXggPT09IC0xIHx8IHRvSW5kZXggPT09IC0xKSByZXR1cm4gcHJldjtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IFtyZW1vdmVkXSA9IGRyYWZ0LnNwbGljZShmcm9tSW5kZXgsIDEpO1xuICAgICAgICBkcmFmdC5zcGxpY2UodG9JbmRleCwgMCwgcmVtb3ZlZCk7XG4gICAgICAgIHJldHVybiBkcmFmdDtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBzZXREcmFnZ2VkUm93SWQobnVsbCk7XG4gIH0sIFtkcmFnZ2VkUm93SWQsIGhhbmRsZUR1cGxpY2F0ZVJvdywgc2V0UmVxdWlyZW1lbnRzXSk7XG5cbiAgLy8gOC4gRXhjZWwgUGFzdGUgTG9naWNcbiAgY29uc3QgaGFuZGxlR3JpZFBhc3RlID0gdXNlQ2FsbGJhY2soKGU6IFJlYWN0LkNsaXBib2FyZEV2ZW50LCBzdGFydFJvd0lkOiBzdHJpbmcsIHN0YXJ0Q29sSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBlLmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpO1xuICAgIGlmICghdGV4dCkgcmV0dXJuO1xuXG4gICAgLy8gT25seSBwcm9jZXNzIGlmIGl0IGZlZWxzIGxpa2UgZ3JpZCBwYXN0ZSAoaGFzIHRhYnMgb3IgbmV3bGluZXMpXG4gICAgaWYgKCF0ZXh0LmluY2x1ZGVzKCdcXHQnKSAmJiAhdGV4dC5pbmNsdWRlcygnXFxuJykpIHtcbiAgICAgIC8vIE5hdHVyYWwgc2luZ2xlIGNlbGwgcGFzdGUgLSBsZXQgbmF0aXZlIGlucHV0IGhhbmRsZSBpdFxuICAgICAgcmV0dXJuOyBcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIC8vIFBhcnNlIFRTViB0YWtpbmcgcXVvdGVzIGludG8gYWNjb3VudCAoRXhjZWwgd3JhcHMgY2VsbHMgd2l0aCBuZXdsaW5lcyBpbiBxdW90ZXMpXG4gICAgY29uc3QgcGFyc2VUU1YgPSAoc3RyOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IHJvd3M6IHN0cmluZ1tdW10gPSBbXTtcbiAgICAgIGxldCBjdXJyZW50Um93OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgbGV0IGN1cnJlbnRDZWxsID0gJyc7XG4gICAgICBsZXQgaW5RdW90ZXMgPSBmYWxzZTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hhciA9IHN0cltpXTtcbiAgICAgICAgY29uc3QgbmV4dENoYXIgPSBzdHJbaSArIDFdO1xuXG4gICAgICAgIGlmIChjaGFyID09PSAnXCInKSB7XG4gICAgICAgICAgaWYgKGluUXVvdGVzICYmIG5leHRDaGFyID09PSAnXCInKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2VsbCArPSAnXCInOyAvLyB1bmVzY2FwZSBkb3VibGUgcXVvdGVzXG4gICAgICAgICAgICBpKys7IC8vIHNraXAgbmV4dCBxdW90ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpblF1b3RlcyA9ICFpblF1b3RlcztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gJ1xcdCcgJiYgIWluUXVvdGVzKSB7XG4gICAgICAgICAgY3VycmVudFJvdy5wdXNoKGN1cnJlbnRDZWxsKTtcbiAgICAgICAgICBjdXJyZW50Q2VsbCA9ICcnO1xuICAgICAgICB9IGVsc2UgaWYgKGNoYXIgPT09ICdcXHInICYmIG5leHRDaGFyID09PSAnXFxuJyAmJiAhaW5RdW90ZXMpIHtcbiAgICAgICAgICBjdXJyZW50Um93LnB1c2goY3VycmVudENlbGwpO1xuICAgICAgICAgIHJvd3MucHVzaChjdXJyZW50Um93KTtcbiAgICAgICAgICBjdXJyZW50Um93ID0gW107XG4gICAgICAgICAgY3VycmVudENlbGwgPSAnJztcbiAgICAgICAgICBpKys7IC8vIHNraXAgXFxuXG4gICAgICAgIH0gZWxzZSBpZiAoY2hhciA9PT0gJ1xcbicgJiYgIWluUXVvdGVzKSB7XG4gICAgICAgICAgY3VycmVudFJvdy5wdXNoKGN1cnJlbnRDZWxsKTtcbiAgICAgICAgICByb3dzLnB1c2goY3VycmVudFJvdyk7XG4gICAgICAgICAgY3VycmVudFJvdyA9IFtdO1xuICAgICAgICAgIGN1cnJlbnRDZWxsID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudENlbGwgKz0gY2hhcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY3VycmVudENlbGwgIT09ICcnIHx8IGN1cnJlbnRSb3cubGVuZ3RoID4gMCkge1xuICAgICAgICBjdXJyZW50Um93LnB1c2goY3VycmVudENlbGwpO1xuICAgICAgICAvLyBBdm9pZCBhZGRpbmcgYSBzaW5nbGUgZW1wdHkgcm93IGF0IHRoZSBlbmQgaWYgdGhlIHRleHQgZW5kZWQgd2l0aCBhIG5ld2xpbmVcbiAgICAgICAgaWYgKGN1cnJlbnRSb3cubGVuZ3RoICE9PSAxIHx8IGN1cnJlbnRSb3dbMF0gIT09ICcnKSB7XG4gICAgICAgICAgcm93cy5wdXNoKGN1cnJlbnRSb3cpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcm93cztcbiAgICB9O1xuXG4gICAgY29uc3QgcGFzdGVEYXRhID0gcGFyc2VUU1YodGV4dCk7XG4gICAgaWYgKHBhc3RlRGF0YS5sZW5ndGggPT09IDAgfHwgKHBhc3RlRGF0YS5sZW5ndGggPT09IDEgJiYgcGFzdGVEYXRhWzBdLmxlbmd0aCA8PSAxKSkgcmV0dXJuOyAvLyBGYWxsYmFjayB0byBub3JtYWwgaWYganVzdCB0ZXh0XG5cbiAgICBjb25zdCBzdGFydFJvd0luZGV4ID0gZmlsdGVyZWRBbmRTb3J0ZWRSZXF1aXJlbWVudHMuZmluZEluZGV4KHIgPT4gci5pZCA9PT0gc3RhcnRSb3dJZCk7XG4gICAgLy8gRXhjbHVkZSAnaWQnIGNvbCwgYnV0IGFsbG93IHBhc3RpbmcgdG8gJ2Fzc2lnbmVlcydcbiAgICBjb25zdCB1c2FibGVDb2xzID0gY29sdW1ucy5maWx0ZXIoYyA9PiBjLmlkICE9PSAnaWQnKTtcbiAgICBjb25zdCBzdGFydENvbEluZGV4ID0gdXNhYmxlQ29scy5maW5kSW5kZXgoYyA9PiBjLmlkID09PSBzdGFydENvbElkKTtcblxuICAgIGlmIChzdGFydFJvd0luZGV4ID09PSAtMSB8fCBzdGFydENvbEluZGV4ID09PSAtMSkgcmV0dXJuO1xuXG4gICAgbGV0IG5ld0Fzc2lnbmVlc1RvQWRkOiBBc3NpZ25lZVtdID0gW107XG5cbiAgICBzZXRSZXF1aXJlbWVudHMocHJldiA9PiB7XG4gICAgICBjb25zdCBkcmFmdCA9IFsuLi5wcmV2XTtcbiAgICAgIFxuICAgICAgY29uc3QgY3VycmVudFJvd3NDb3VudCA9IGZpbHRlcmVkQW5kU29ydGVkUmVxdWlyZW1lbnRzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0TnVtZXJpY0lkID0gZHJhZnQucmVkdWNlKChtYXgsIHIpID0+IHtcbiAgICAgICAgY29uc3QgbWF0Y2ggPSByLmlkLm1hdGNoKC9SRVEtKFxcZCspLyk7XG4gICAgICAgIHJldHVybiBtYXRjaCA/IE1hdGgubWF4KG1heCwgcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSkgOiBtYXg7XG4gICAgICB9LCAwKSArIDE7XG4gICAgICBcbiAgICAgIGNvbnN0IGRlZmF1bHRBc3NpZ25lZSA9IGFzc2lnbmVlc1Bvb2wubGVuZ3RoID4gMCA/IGFzc2lnbmVlc1Bvb2xbMF0gOiB7IGlkOiAnVVNSLTAwMCcsIG5hbWU6ICfrr7jsp4DsoJUnLCBhdmF0YXJVcmw6ICcnIH07XG5cbiAgICAgIHBhc3RlRGF0YS5mb3JFYWNoKChyb3dEYXRhLCBpKSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldFJlcUluZGV4ID0gc3RhcnRSb3dJbmRleCArIGk7XG4gICAgICAgIGxldCBjdXJyZW50UmVxOiBSZXF1aXJlbWVudDtcbiAgICAgICAgbGV0IHJlYWxJbmRleCA9IC0xO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRhcmdldFJlcUluZGV4IDwgY3VycmVudFJvd3NDb3VudCkge1xuICAgICAgICAgIGNvbnN0IHRhcmdldFJlcUlkID0gZmlsdGVyZWRBbmRTb3J0ZWRSZXF1aXJlbWVudHNbdGFyZ2V0UmVxSW5kZXhdLmlkO1xuICAgICAgICAgIHJlYWxJbmRleCA9IGRyYWZ0LmZpbmRJbmRleChyID0+IHIuaWQgPT09IHRhcmdldFJlcUlkKTtcbiAgICAgICAgICBpZiAocmVhbEluZGV4ID09PSAtMSkgcmV0dXJuO1xuICAgICAgICAgIGN1cnJlbnRSZXEgPSB7IC4uLmRyYWZ0W3JlYWxJbmRleF0sIGN1c3RvbUNvbHVtbnM6IHsgLi4uZHJhZnRbcmVhbEluZGV4XS5jdXN0b21Db2x1bW5zIH0gfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDcmVhdGUgbmV3IHJvdyB3aGVuIHBhc3RpbmcgYmV5b25kIGV4aXN0aW5nIHJvd3NcbiAgICAgICAgICBjb25zdCBuZXdJZCA9IGBSRVEtJHtTdHJpbmcobmV4dE51bWVyaWNJZCsrKS5wYWRTdGFydCgzLCAnMCcpfWA7XG4gICAgICAgICAgY3VycmVudFJlcSA9IHtcbiAgICAgICAgICAgIGlkOiBuZXdJZCxcbiAgICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAnTUVESVVNJyxcbiAgICAgICAgICAgIGFzc2lnbmVlczogW10sIC8vIHdpbGwgYmUgcG9wdWxhdGVkIG9yIHN0YXkgZW1wdHksIHdlIHJlbW92ZSBkZWZhdWx0IGhlcmUgdG8gcHJldmVudCBtaXhpbmdcbiAgICAgICAgICAgIGR1ZURhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdLFxuICAgICAgICAgICAgc3RhdHVzOiAnVE9ETycsXG4gICAgICAgICAgICBjdXN0b21Db2x1bW5zOiB7fVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByb3dEYXRhLmZvckVhY2goKGNlbGxUZXh0LCBqKSA9PiB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0Q29sSW5kZXggPSBzdGFydENvbEluZGV4ICsgajtcbiAgICAgICAgICBpZiAodGFyZ2V0Q29sSW5kZXggPj0gdXNhYmxlQ29scy5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICBjb25zdCBjb2xJZCA9IHVzYWJsZUNvbHNbdGFyZ2V0Q29sSW5kZXhdLmlkO1xuXG4gICAgICAgICAgY29uc3QgY2xlYW5lZFRleHQgPSBjZWxsVGV4dC50cmltKCk7XG5cbiAgICAgICAgICBpZiAoY29sSWQgPT09ICd0aXRsZScpIGN1cnJlbnRSZXEudGl0bGUgPSBjbGVhbmVkVGV4dDtcbiAgICAgICAgICBlbHNlIGlmIChjb2xJZCA9PT0gJ3ByaW9yaXR5Jykge1xuICAgICAgICAgICAgY29uc3QgdXAgPSBjbGVhbmVkVGV4dC50b1VwcGVyQ2FzZSgpIGFzIFByaW9yaXR5O1xuICAgICAgICAgICAgaWYgKFsnSElHSCcsICdNRURJVU0nLCAnTE9XJ10uaW5jbHVkZXModXApKSBjdXJyZW50UmVxLnByaW9yaXR5ID0gdXA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKGNvbElkID09PSAnc3RhdHVzJykge1xuICAgICAgICAgICAgY29uc3QgdXAgPSBjbGVhbmVkVGV4dC50b1VwcGVyQ2FzZSgpIGFzIFN0YXR1cztcbiAgICAgICAgICAgIGlmIChbJ1RPRE8nLCAnSU5fUFJPR1JFU1MnLCAnRE9ORSddLmluY2x1ZGVzKHVwKSkgY3VycmVudFJlcS5zdGF0dXMgPSB1cDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAoY29sSWQgPT09ICdkdWVEYXRlJykge1xuICAgICAgICAgICAgY3VycmVudFJlcS5kdWVEYXRlID0gY2xlYW5lZFRleHQgfHwgY3VycmVudFJlcS5kdWVEYXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChjb2xJZCA9PT0gJ2Fzc2lnbmVlcycpIHtcbiAgICAgICAgICAgICBjb25zdCBuYW1lcyA9IGNsZWFuZWRUZXh0LnNwbGl0KCcsJykubWFwKG4gPT4gbi50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICAgICBjb25zdCBtYXRjaGVkQXNzaWduZWVzID0gW107XG4gICAgICAgICAgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmRQb29sID0gYXNzaWduZWVzUG9vbC5maW5kKGEgPT4gYS5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmROZXcgPSBuZXdBc3NpZ25lZXNUb0FkZC5maW5kKGEgPT4gYS5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kUG9vbCkge1xuICAgICAgICAgICAgICAgICAgbWF0Y2hlZEFzc2lnbmVlcy5wdXNoKGZvdW5kUG9vbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmb3VuZE5ldykge1xuICAgICAgICAgICAgICAgICAgbWF0Y2hlZEFzc2lnbmVlcy5wdXNoKGZvdW5kTmV3KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyBhc3NpZ25lZSBvbiB0aGUgZmx5XG4gICAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NpZ25lZUlkID0gYFVTUi0ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNil9LSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjEwMDApfWA7XG4gICAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NpZ25lZSA9IHsgaWQ6IG5ld0Fzc2lnbmVlSWQsIG5hbWU6IG5hbWUsIGF2YXRhclVybDogJycgfTtcbiAgICAgICAgICAgICAgICAgIG5ld0Fzc2lnbmVlc1RvQWRkLnB1c2gobmV3QXNzaWduZWUpO1xuICAgICAgICAgICAgICAgICAgbWF0Y2hlZEFzc2lnbmVlcy5wdXNoKG5ld0Fzc2lnbmVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIGlmIChtYXRjaGVkQXNzaWduZWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UmVxLmFzc2lnbmVlcyA9IG1hdGNoZWRBc3NpZ25lZXM7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmICh1c2FibGVDb2xzW3RhcmdldENvbEluZGV4XS5pc0N1c3RvbSkge1xuICAgICAgICAgICAgY3VycmVudFJlcS5jdXN0b21Db2x1bW5zW2NvbElkXSA9IGNsZWFuZWRUZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRSZXEuYXNzaWduZWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGN1cnJlbnRSZXEuYXNzaWduZWVzID0gW2RlZmF1bHRBc3NpZ25lZV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0UmVxSW5kZXggPCBjdXJyZW50Um93c0NvdW50KSB7XG4gICAgICAgICAgZHJhZnRbcmVhbEluZGV4XSA9IGN1cnJlbnRSZXE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZHJhZnQucHVzaChjdXJyZW50UmVxKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBkcmFmdDtcbiAgICB9KTtcblxuICAgIGlmIChuZXdBc3NpZ25lZXNUb0FkZC5sZW5ndGggPiAwKSB7XG4gICAgICBzZXRBc3NpZ25lZXNQb29sKHByZXYgPT4gWy4uLnByZXYsIC4uLm5ld0Fzc2lnbmVlc1RvQWRkXSk7XG4gICAgfVxuXG4gICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgfSwgW2NvbHVtbnMsIGZpbHRlcmVkQW5kU29ydGVkUmVxdWlyZW1lbnRzLCBhc3NpZ25lZXNQb29sLCBzZXRSZXF1aXJlbWVudHMsIHNldEFzc2lnbmVlc1Bvb2wsIHNldEFjdGl2ZUNlbGxFZGl0b3JdKTtcblxuXG5cbiAgY29uc3QgZ2V0U3RpY2t5U3R5bGUgPSB1c2VDYWxsYmFjaygoaXNIZWFkZXIgPSBmYWxzZSk6IFJlYWN0LkNTU1Byb3BlcnRpZXMgPT4ge1xuICAgIGlmIChpc0hlYWRlcikge1xuICAgICAgcmV0dXJuIHsgXG4gICAgICAgIHBvc2l0aW9uOiAnc3RpY2t5JywgXG4gICAgICAgIHRvcDogMCwgXG4gICAgICAgIHpJbmRleDogMjAsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3ZhcigtLWNvbG9yLWJyYW5kLXN1cmZhY2UtbG93ZXN0KSdcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGdldENlbGxTdGlja3lTdHlsZSA9IHVzZUNhbGxiYWNrKChjb2xJZDogc3RyaW5nIHwgJ2luZGV4JyB8ICdjaGVja2JveCcsIGlzSGVhZGVyID0gZmFsc2UpOiBSZWFjdC5DU1NQcm9wZXJ0aWVzID0+IHtcbiAgICBsZXQgYmFzZSA9IGdldFN0aWNreVN0eWxlKGlzSGVhZGVyKTtcblxuICAgIGlmIChmcm96ZW5PZmZzZXRzKSB7XG4gICAgICBjb25zdCBpc0Zyb3plbiA9IGNvbElkID09PSAnaW5kZXgnIHx8IGNvbElkID09PSAnY2hlY2tib3gnIHx8IGZyb3plbk9mZnNldHMub2Zmc2V0c1tjb2xJZCBhcyBzdHJpbmddICE9PSB1bmRlZmluZWQ7XG4gICAgICBpZiAoaXNGcm96ZW4pIHtcbiAgICAgICAgY29uc3QgbGVmdCA9IGNvbElkID09PSAnaW5kZXgnID8gMCA6IGNvbElkID09PSAnY2hlY2tib3gnID8gNDAgOiBmcm96ZW5PZmZzZXRzLm9mZnNldHNbY29sSWQgYXMgc3RyaW5nXTtcbiAgICAgICAgY29uc3QgaXNMYXN0RnJvemVuID0gKGNvbElkID09PSAnY2hlY2tib3gnICYmIGZyb3plbk9mZnNldHMuZnJvemVuSW5kZXggPT09IC0xKSB8fCBjb2xJZCA9PT0gZnJvemVuT2Zmc2V0cy5sYXN0Q29sSWQ7XG4gICAgICAgIFxuICAgICAgICBiYXNlID0geyBcbiAgICAgICAgICAuLi5iYXNlLCBcbiAgICAgICAgICBwb3NpdGlvbjogJ3N0aWNreScsIFxuICAgICAgICAgIGxlZnQsIFxuICAgICAgICAgIHpJbmRleDogaXNIZWFkZXIgPyAzMCA6IDEwLCBcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGlzSGVhZGVyID8gJ3ZhcigtLWNvbG9yLWJyYW5kLXN1cmZhY2UtaGlnaCknIDogJ3ZhcigtLWNvbG9yLWJyYW5kLXN1cmZhY2UtbG93KScgXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGlzTGFzdEZyb3plbikge1xuICAgICAgICAgIGJhc2UuYm94U2hhZG93ID0gJzZweCAwcHggMTBweCAtM3B4IHJnYmEoMCwwLDAsMC41KSc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJhc2U7XG4gIH0sIFtmcm96ZW5PZmZzZXRzLCBnZXRTdGlja3lTdHlsZV0pO1xuXG4gIGNvbnN0IGdldFN0aWNreVNoYWRvd0NsYXNzID0gKCkgPT4gJyc7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UvNzAgYmFja2Ryb3AtYmx1ci1tZCBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUgcm91bmRlZC1bMnJlbV0gc2hhZG93LXhsIG92ZXJmbG93LWhpZGRlbiBmbGV4IGZsZXgtY29sIGZsZXgtMSBtaW4taC0wIGFuaW1hdGUtZmFkZS1zbGlkZS11cCBkZWxheS0xMDBcIj5cbiAgICAgIFxuICAgICAgey8qIDEuIFNwcmVhZFNoZWV0IFRvb2xiYXIgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTUgcHktNCBib3JkZXItYiBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IGJnLWJyYW5kLXN1cmZhY2UtbG93IGZsZXggZmxleC1jb2wgc206ZmxleC1yb3cganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICBcbiAgICAgICAgey8qIExlZnQgU2lkZSBBY3Rpb25zICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICB7LyogQWN0aW9uIEJ1dHRvbnMgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gc2hyaW5rLTAgaC1bMzZweF1cIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlVW5kb31cbiAgICAgICAgICAgICAgZGlzYWJsZWQ9e2hpc3RvcnlSZWYuY3VycmVudC5sZW5ndGggPT09IDB9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgJHtoaXN0b3J5UmVmLmN1cnJlbnQubGVuZ3RoID09PSAwID8gJ29wYWNpdHktMzAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICdob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2ggY3Vyc29yLXBvaW50ZXIgdGV4dC1icmFuZC1vbi1zdXJmYWNlJ31gfVxuICAgICAgICAgICAgICB0aXRsZT1cIuuQmOuPjOumrOq4sCAoQ3RybCtaKVwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxVbmRvMiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LVsxcHhdIGJnLWJyYW5kLW91dGxpbmUtdmFyaWFudFwiPjwvZGl2PlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVSZWRvfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17cmVkb1N0YWNrUmVmLmN1cnJlbnQubGVuZ3RoID09PSAwfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0zIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRyYW5zaXRpb24tY29sb3JzICR7cmVkb1N0YWNrUmVmLmN1cnJlbnQubGVuZ3RoID09PSAwID8gJ29wYWNpdHktMzAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICdob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2ggY3Vyc29yLXBvaW50ZXIgdGV4dC1icmFuZC1vbi1zdXJmYWNlJ31gfVxuICAgICAgICAgICAgICB0aXRsZT1cIuuLpOyLnCDsi6TtlokgKEN0cmwrU2hpZnQrWilcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8UmVkbzIgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBpZD1cImJ0bi1zcHJlYWRzaGVldC1hZGQtcm93XCJcbiAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUFkZFJvd31cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXgtMSBzbTpmbGV4LWluaXRpYWwgcHgtNCBweS0yIGJnLWJyYW5kLXByaW1hcnkgdGV4dC1icmFuZC1vbi1wcmltYXJ5IHRleHQtc20gZm9udC1zZW1pYm9sZCByb3VuZGVkLWxnIGhvdmVyOm9wYWNpdHktOTUgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHNoYWRvdy1tZCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICDsg4gg7JqU6rWs7IKs7ZWtXG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICB7cmVxdWlyZW1lbnRzLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICBpZD1cImJ0bi1zcHJlYWRzaGVldC1sb2FkLWV4YW1wbGVzXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFJlcXVpcmVtZW50cyhJTklUSUFMX1JFUVVJUkVNRU5UUyk7XG4gICAgICAgICAgICAgICAgc2V0QXNzaWduZWVzUG9vbChJTklUSUFMX0FTU0lHTkVFUyk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiBiZy1icmFuZC10ZXJ0aWFyeSB0ZXh0LXdoaXRlIHRleHQtc20gZm9udC1tZWRpdW0gcm91bmRlZC1sZyBob3ZlcjpvcGFjaXR5LTkwIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIOyYiOyLnCDrjbDsnbTthLAg66Gc65OcXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICAgIFxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBpZD1cImJ0bi1zcHJlYWRzaGVldC1leHBvcnRcIlxuICAgICAgICAgICAgb25DbGljaz17aGFuZGxlRXhwb3J0RXhjZWx9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctYnJhbmQtc3VyZmFjZSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgdGV4dC1zbSBmb250LW1lZGl1bSByb3VuZGVkLWxnIGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UtaGlnaCBob3Zlcjp0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgYWN0aXZlOnNjYWxlLTk1IHRyYW5zaXRpb24tYWxsIGR1cmF0aW9uLTIwMCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8RG93bmxvYWQgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICBFeGNlbCDrgrTrs7TrgrTquLBcbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBpZD1cImJ0bi1zcHJlYWRzaGVldC1tYW5hZ2UtYXNzaWduZWVzXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICBjb25zdCByZWN0ID0gZS5jdXJyZW50VGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgc2V0QXNzaWduZWVNYW5hZ2VyUG9zKHsgeDogcmVjdC5yaWdodCArIDEwLCB5OiByZWN0LnRvcCB9KTtcbiAgICAgICAgICAgICAgIHNldFNob3dBc3NpZ25lZU1hbmFnZXIodHJ1ZSk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdGV4dC1icmFuZC1vbi1zdXJmYWNlIHRleHQtc20gZm9udC1tZWRpdW0gcm91bmRlZC1sZyBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2ggaG92ZXI6dGV4dC1icmFuZC1vbi1zdXJmYWNlIGFjdGl2ZTpzY2FsZS05NSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFVzZXJzIGNsYXNzTmFtZT1cInctNCBoLTQgdGV4dC1icmFuZC1wcmltYXJ5XCIgLz5cbiAgICAgICAgICAgIOuLtOuLueyekCDqtIDrpqxcbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIHsvKiBCdWxrIGRlbGV0aW9uIGNvbnRleHQgYm94ICovfVxuICAgICAgICAgIHtzZWxlY3RlZElkcy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgIGlkPVwiYnRuLXNwcmVhZHNoZWV0LWRlbGV0ZS1idWxrXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlRGVsZXRlU2VsZWN0ZWR9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiBiZy1icmFuZC1lcnJvci1jb250YWluZXIgdGV4dC1icmFuZC1vbi1lcnJvci1jb250YWluZXIgdGV4dC1zbSBmb250LXNlbWlib2xkIHJvdW5kZWQtbGcgaG92ZXI6Ymctb3BhY2l0eS05MCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXIgYm9yZGVyIGJvcmRlci1icmFuZC1lcnJvci8yMCBhbmltYXRlLXB1bHNlXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPFRyYXNoMiBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAg7ISg7YOdIOyCreygnCAoe3NlbGVjdGVkSWRzLmxlbmd0aH0pXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogUmlnaHQgU2lkZSBGaWx0ZXJzICYgU2VhcmNoICYgRXhjaGFuZ2UgUmF0ZXMgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCAyeGw6ZmxleC1yb3cgaXRlbXMtZW5kIDJ4bDppdGVtcy1jZW50ZXIgZ2FwLTMgdy1mdWxsIGxnOnctYXV0b1wiPlxuICAgICAgICAgIHsvKiBFeGNoYW5nZSBSYXRlcyAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbWQgcHgtMyBweS0xLjUgdy1mdWxsIHNtOnctYXV0byBvdmVyZmxvdy14LWF1dG8gd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGQgdGV4dC1icmFuZC1wcmltYXJ5XCI+7ZmY7JyoIOyXsOuPmTwvc3Bhbj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWwtMVwiPlxuICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwidGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW1cIj5LUlc6PC9sYWJlbD5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBjbGFzc05hbWU9XCJ3LTE2IGJnLWJyYW5kLXN1cmZhY2UgdGV4dC1icmFuZC1vbi1zdXJmYWNlIHB4LTEuNSBweS0wLjUgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSB0ZXh0LXJpZ2h0XCIgdmFsdWU9e2V4Y2hhbmdlUmF0ZXMuS1JXfSBvbkNoYW5nZT17ZSA9PiBzZXRFeGNoYW5nZVJhdGVzKHsuLi5leGNoYW5nZVJhdGVzLCBLUlc6IE51bWJlcihlLnRhcmdldC52YWx1ZSl9KX0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBtbC0yXCI+XG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LW1lZGl1bVwiPlVTRDo8L2xhYmVsPlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIGNsYXNzTmFtZT1cInctMTYgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgcHgtMS41IHB5LTAuNSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IHRleHQtcmlnaHRcIiB2YWx1ZT17ZXhjaGFuZ2VSYXRlcy5VU0R9IG9uQ2hhbmdlPXtlID0+IHNldEV4Y2hhbmdlUmF0ZXMoey4uLmV4Y2hhbmdlUmF0ZXMsIFVTRDogTnVtYmVyKGUudGFyZ2V0LnZhbHVlKX0pfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG1sLTJcIj5cbiAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtXCI+RVVSOjwvbGFiZWw+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwibnVtYmVyXCIgY2xhc3NOYW1lPVwidy0xNiBiZy1icmFuZC1zdXJmYWNlIHRleHQtYnJhbmQtb24tc3VyZmFjZSBweC0xLjUgcHktMC41IGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgdGV4dC1yaWdodFwiIHZhbHVlPXtleGNoYW5nZVJhdGVzLkVVUn0gb25DaGFuZ2U9e2UgPT4gc2V0RXhjaGFuZ2VSYXRlcyh7Li4uZXhjaGFuZ2VSYXRlcywgRVVSOiBOdW1iZXIoZS50YXJnZXQudmFsdWUpfSl9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBmbGV4LXdyYXAgc206ZmxleC1yb3cgaXRlbXMtY2VudGVyIGdhcC0zIHctZnVsbCBzbTp3LWF1dG8ganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgIHsvKiBQcmlvcml0eSBmaWx0ZXIgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IHctZnVsbCBzbTp3LWF1dG9cIj5cbiAgICAgICAgICAgIDxzcGFuPuyasOyEoOyInOychDo8L3NwYW4+XG4gICAgICAgICAgICA8c2VsZWN0IFxuICAgICAgICAgICAgICB2YWx1ZT17cHJpb3JpdHlGaWx0ZXJ9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFByaW9yaXR5RmlsdGVyKGUudGFyZ2V0LnZhbHVlIGFzIFByaW9yaXR5IHwgJ0FMTCcpfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1icmFuZC1zdXJmYWNlLWhpZ2ggYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1tZCBweC0yIHB5LTEgdGV4dC1icmFuZC1vbi1zdXJmYWNlIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGN1cnNvci1wb2ludGVyIHRleHQteHNcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiQUxMXCI+7KCE7LK0PC9vcHRpb24+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJISUdIXCI+64aS7J2MPC9vcHRpb24+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJNRURJVU1cIj7spJHqsIQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkxPV1wiPuuCruydjDwvb3B0aW9uPlxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogU3RhdHVzIGZpbHRlciAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgdy1mdWxsIHNtOnctYXV0b1wiPlxuICAgICAgICAgICAgPHNwYW4+7IOB7YOcOjwvc3Bhbj5cbiAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgIHZhbHVlPXtzdGF0dXNGaWx0ZXJ9XG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFN0YXR1c0ZpbHRlcihlLnRhcmdldC52YWx1ZSBhcyBTdGF0dXMgfCAnQUxMJyl9XG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UtaGlnaCBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLW1kIHB4LTIgcHktMSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgY3Vyc29yLXBvaW50ZXIgdGV4dC14c1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJBTExcIj7soITssrQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlRPRE9cIj7rr7jqsoDthqA8L29wdGlvbj5cbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIklOX1BST0dSRVNTXCI+6rKA7Yag7KSRPC9vcHRpb24+XG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJET05FXCI+6rKA7Yag7JmE66OMPC9vcHRpb24+XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBDb3JlIFNlYXJjaCAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBzbTp3LTY0XCI+XG4gICAgICAgICAgICA8U2VhcmNoIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMyB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdy00LjUgaC00LjVcIiAvPlxuICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hUZXJtfVxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRTZWFyY2hUZXJtKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLqsoDsg4kgKElELCDrqoXsua0sIOuLtOuLueyekC4uLilcIlxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcGwtOSBwci04IHB5LTIgYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLWxnIHRleHQtYnJhbmQtb24tc3VyZmFjZSBwbGFjZWhvbGRlcjp0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6Ym9yZGVyLWJyYW5kLXByaW1hcnkgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDBcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIHtzZWFyY2hUZXJtICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTZWFyY2hUZXJtKCcnKX1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSByaWdodC0yLjUgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIGhvdmVyOnRleHQtYnJhbmQtb24tc3VyZmFjZSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XCJ3LTQgaC00XCIgLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIFxuICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICBvbkNsaWNrPXtjbGVhckFsbEZpbHRlcnN9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBob3Zlcjp0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgdGV4dC1zbSBmb250LW1lZGl1bSByb3VuZGVkLWxnIGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UtaGlnaCBhY3RpdmU6c2NhbGUtOTUgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgdGl0bGU9XCLrqqjrk6Ag6rKA7IOJIOuwjyDtlYTthLAg7KeA7Jqw6riwXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICDtlYTthLAg7LSI6riw7ZmUXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIDIuIFNwcmVhZFNoZWV0IENvcmUgR3JpZCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvIG92ZXJmbG93LXktYXV0byBmbGV4LTEgbWluLWgtMCB3LWZ1bGwgcmVsYXRpdmVcIj5cbiAgICAgICAgPHRhYmxlIGNsYXNzTmFtZT1cInctbWF4IHRhYmxlLWZpeGVkIGJvcmRlci1zZXBhcmF0ZSBib3JkZXItc3BhY2luZy0wIHRleHQtbGVmdCBzZWxlY3Qtbm9uZSBiZy1icmFuZC1zdXJmYWNlIFsmX3RoXTpib3JkZXItYiBbJl90ZF06Ym9yZGVyLWIgWyZfdGhdOmJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgWyZfdGRdOmJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIj5cbiAgICAgICAgICA8Y29sZ3JvdXA+XG4gICAgICAgICAgICA8Y29sIHN0eWxlPXt7IHdpZHRoOiAnNDBweCcsIG1pbldpZHRoOiAnNDBweCcsIG1heFdpZHRoOiAnNDBweCcgfX0gLz5cbiAgICAgICAgICAgIDxjb2wgc3R5bGU9e3sgd2lkdGg6ICc0NHB4JywgbWluV2lkdGg6ICc0NHB4JywgbWF4V2lkdGg6ICc0NHB4JyB9fSAvPlxuICAgICAgICAgICAge2NvbHVtbnMubWFwKGNvbCA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gbWluaW1pemVkQ29sdW1uc1tjb2wuaWRdID8gMjQgOiAoY29sdW1uV2lkdGhzW2NvbC5pZF0gfHwgMTUwKTtcbiAgICAgICAgICAgICAgcmV0dXJuIDxjb2wga2V5PXtjb2wuaWR9IHN0eWxlPXt7IHdpZHRoOiBgJHt3aWR0aH1weGAsIG1pbldpZHRoOiBgJHt3aWR0aH1weGAsIG1heFdpZHRoOiBgJHt3aWR0aH1weGAgfX0gLz47XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDxjb2wgc3R5bGU9e3sgd2lkdGg6ICcxNTBweCcsIG1pbldpZHRoOiAnMTUwcHgnLCBtYXhXaWR0aDogJzE1MHB4JyB9fSAvPlxuICAgICAgICAgIDwvY29sZ3JvdXA+XG4gICAgICAgICAgXG4gICAgICAgICAgey8qIEhlYWRlciBCbG9jayAqL31cbiAgICAgICAgICA8dGhlYWQ+XG4gICAgICAgICAgICB7LyogU2l6aW5nIFJvdyB0byBmaXggU2FmYXJpL1dlYktpdCBjb2xsYXBzZWQgd2lkdGhzIG9uIGNvbFNwYW4gKi99XG4gICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiaC0wIHAtMCBib3JkZXItMCBtLTAgaW52aXNpYmxlXCI+XG4gICAgICAgICAgICAgIDx0aCBzdHlsZT17eyB3aWR0aDogJzQwcHgnLCBtaW5XaWR0aDogJzQwcHgnLCBtYXhXaWR0aDogJzQwcHgnLCBwYWRkaW5nOiAwLCBib3JkZXI6IDAgfX0+PC90aD5cbiAgICAgICAgICAgICAgPHRoIHN0eWxlPXt7IHdpZHRoOiAnNDRweCcsIG1pbldpZHRoOiAnNDRweCcsIG1heFdpZHRoOiAnNDRweCcsIHBhZGRpbmc6IDAsIGJvcmRlcjogMCB9fT48L3RoPlxuICAgICAgICAgICAgICB7Y29sdW1ucy5tYXAoY29sID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB3ID0gbWluaW1pemVkQ29sdW1uc1tjb2wuaWRdID8gMjQgOiAoY29sdW1uV2lkdGhzW2NvbC5pZF0gfHwgMTUwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gPHRoIGtleT17Y29sLmlkfSBzdHlsZT17eyB3aWR0aDogYCR7d31weGAsIG1pbldpZHRoOiBgJHt3fXB4YCwgbWF4V2lkdGg6IGAke3d9cHhgLCBwYWRkaW5nOiAwLCBib3JkZXI6IDAgfX0+PC90aD47XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgICA8dGggc3R5bGU9e3sgd2lkdGg6ICcxNTBweCcsIG1pbldpZHRoOiAnMTUwcHgnLCBtYXhXaWR0aDogJzE1MHB4JywgcGFkZGluZzogMCwgYm9yZGVyOiAwIH19PjwvdGg+XG4gICAgICAgICAgICA8L3RyPlxuXG4gICAgICAgICAgICB7LyogTFYuMSBHcm91cCBIZWFkZXIgUm93ICovfVxuICAgICAgICAgICAge2NvbHVtbnMuc29tZShjID0+IGMuZ3JvdXBOYW1lKSAmJiAoXG4gICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy1icmFuZC1zdXJmYWNlLWxvd2VzdCBib3JkZXItYiBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtWzEycHhdIGZvbnQtc2VtaWJvbGQgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgc2VsZWN0LW5vbmVcIj5cbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy0xMCBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50XCIgc3R5bGU9e2dldENlbGxTdGlja3lTdHlsZSgnaW5kZXgnLCB0cnVlKX0+PC90aD5cbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy0xMSBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50XCIgc3R5bGU9e2dldENlbGxTdGlja3lTdHlsZSgnY2hlY2tib3gnLCB0cnVlKX0+PC90aD5cbiAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRocyA9IFtdO1xuICAgICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRHcm91cDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgbGV0IGNvbFNwYW4gPSAwO1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBwdXNoR3JvdXAgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xTcGFuID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRocy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIFxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2Bncm91cC0ke3Rocy5sZW5ndGh9YH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbFNwYW49e2NvbFNwYW59IFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweS0xIHRleHQtY2VudGVyICR7Y3VycmVudEdyb3VwID8gJ2JvcmRlci14IGJvcmRlci10LTIgYm9yZGVyLWItMCBib3JkZXItYnJhbmQtcHJpbWFyeS81MCB0ZXh0LWJyYW5kLXByaW1hcnkgZm9udC1ib2xkIHNoYWRvdy1zbSBjdXJzb3ItY29udGV4dC1tZW51JyA6ICdib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50J31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50R3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFN1cGVyQ29udGV4dE1lbnVHcm91cChjdXJyZW50R3JvdXApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnVQb3MoeyB4OiBlLmNsaWVudFgsIHk6IGUuY2xpZW50WSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtjdXJyZW50R3JvdXAgfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sLCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC5ncm91cE5hbWUgPT09IGN1cnJlbnRHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbFNwYW4rKztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICBwdXNoR3JvdXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50R3JvdXAgPSBjb2wuZ3JvdXBOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbFNwYW4gPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIHB1c2hHcm91cCgpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRocztcbiAgICAgICAgICAgICAgICB9KSgpfVxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJ3LVsxNTBweF0gYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudFwiPjwvdGg+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8dHIgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgYm9yZGVyLWIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LVsxMnB4XSBmb250LXNlbWlib2xkIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IHNlbGVjdC1ub25lXCI+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwidy0xMCBweC0yIHB5LTMgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LWNlbnRlclwiIHN0eWxlPXtnZXRDZWxsU3RpY2t5U3R5bGUoJ2luZGV4JywgdHJ1ZSl9PjwvdGg+XG5cbiAgICAgICAgICAgICAgey8qIENoZWNrYm94IENvbHVtbiAqL31cbiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT17YHAtMyBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHctMTEgdGV4dC1jZW50ZXJgfSBzdHlsZT17eyAuLi5nZXRDZWxsU3RpY2t5U3R5bGUoJ2NoZWNrYm94JywgdHJ1ZSksIHZlcnRpY2FsQWxpZ246ICdtaWRkbGUnIH19PlxuICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTQgaC00IGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkIGJvcmRlciBib3JkZXItZ3JheS01MDAgYmctdHJhbnNwYXJlbnQgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi1jb2xvcnMgbWItWzJweF1cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU2VsZWN0QWxsKGZpbHRlcmVkQW5kU29ydGVkUmVxdWlyZW1lbnRzLmxlbmd0aCA+IDAgJiYgc2VsZWN0ZWRJZHMubGVuZ3RoICE9PSBmaWx0ZXJlZEFuZFNvcnRlZFJlcXVpcmVtZW50cy5sZW5ndGgpfVxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIHsoZmlsdGVyZWRBbmRTb3J0ZWRSZXF1aXJlbWVudHMubGVuZ3RoID4gMCAmJiBzZWxlY3RlZElkcy5sZW5ndGggPT09IGZpbHRlcmVkQW5kU29ydGVkUmVxdWlyZW1lbnRzLmxlbmd0aCkgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8Q2hlY2sgY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2VcIiBzdHJva2VXaWR0aD17NH0gLz5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGg+XG5cbiAgICAgICAgICAgICAgey8qIER5bmFtaWMgQ29sdW1ucyBSZW5kZXJlZCAqL31cbiAgICAgICAgICAgICAge2NvbHVtbnMubWFwKGNvbCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNNaW5pbWl6ZWQgPSBtaW5pbWl6ZWRDb2x1bW5zW2NvbC5pZF07XG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBpc01pbmltaXplZCA/IDI0IDogKGNvbHVtbldpZHRoc1tjb2wuaWRdIHx8IDE1MCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8dGggXG4gICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH1cbiAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZVxuICAgICAgICAgICAgICAgICAgb25EcmFnU3RhcnQ9eyhlKSA9PiBoYW5kbGVDb2x1bW5EcmFnU3RhcnQoZSwgY29sLmlkKX1cbiAgICAgICAgICAgICAgICAgIG9uRHJhZ092ZXI9eyhlKSA9PiBoYW5kbGVDb2x1bW5EcmFnT3ZlcihlLCBjb2wuaWQpfVxuICAgICAgICAgICAgICAgICAgb25EcmFnRW50ZXI9eyhlKSA9PiBlLnByZXZlbnREZWZhdWx0KCl9XG4gICAgICAgICAgICAgICAgICBvbkRyb3A9eyhlKSA9PiBoYW5kbGVDb2x1bW5Ecm9wKGUsIGNvbC5pZCl9XG4gICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXsoZSkgPT4gaGFuZGxlQ29sdW1uQ29udGV4dE1lbnUoZSwgY29sLmlkKX1cbiAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoLCBtaW5XaWR0aDogd2lkdGgsIG1heFdpZHRoOiB3aWR0aCwgLi4uZ2V0Q2VsbFN0aWNreVN0eWxlKGNvbC5pZCwgdHJ1ZSkgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHBsLTEuNSBwci0xIHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LVsxM3B4XSBncm91cCByZWxhdGl2ZSAke2lzTWluaW1pemVkID8gJ2N1cnNvci1wb2ludGVyJyA6ICdjdXJzb3ItZ3JhYiBhY3RpdmU6Y3Vyc29yLWdyYWJiaW5nJ30gdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwICR7XG4gICAgICAgICAgICAgICAgICAgIGRyYWdPdmVyQ29sdW1uSWQgPT09IGNvbC5pZCA/ICdiZy1icmFuZC1zdXJmYWNlLWhpZ2gvNTAgYm9yZGVyLWwtMiBib3JkZXItbC1icmFuZC1wcmltYXJ5JyA6ICcnXG4gICAgICAgICAgICAgICAgICB9ICR7c2VsZWN0ZWRDb2x1bW5JZHMuaW5jbHVkZXMoY29sLmlkKSA/ICdiZy1icmFuZC1wcmltYXJ5LzEwJyA6ICcnfWB9XG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNNaW5pbWl6ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRNaW5pbWl6ZWRDb2x1bW5zKHAgPT4gKHsgLi4ucCwgW2NvbC5pZF06IGZhbHNlIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlLnNoaWZ0S2V5IHx8IGUubWV0YUtleSB8fCBlLmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZENvbHVtbklkcyhwcmV2ID0+IHByZXYuaW5jbHVkZXMoY29sLmlkKSA/IHByZXYuZmlsdGVyKGlkID0+IGlkICE9PSBjb2wuaWQpIDogWy4uLnByZXYsIGNvbC5pZF0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkQ29sdW1uSWRzKFtjb2wuaWRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgaC1mdWxsIHJlbGF0aXZlXCIgdGl0bGU9e2lzTWluaW1pemVkID8gY29sLmxhYmVsIDogdW5kZWZpbmVkfT5cbiAgICAgICAgICAgICAgICAgICAgeyFpc01pbmltaXplZCA/IChcbiAgICAgICAgICAgICAgICAgICAgICBlZGl0aW5nQ29sdW1uTmFtZUlkID09PSBjb2wuaWQgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29sLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByb3dzPXsyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIGZsZXgtMSBtci0wLjUgYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgYm9yZGVyIGJvcmRlci1icmFuZC1wcmltYXJ5IHRleHQtYnJhbmQtb24tc3VyZmFjZSBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSByb3VuZGVkIHB4LTEgdy1mdWxsIHRleHQtWzEzcHhdIHJlc2l6ZS1ub25lIG92ZXJmbG93LWhpZGRlblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBlLnRhcmdldC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29sdW1ucyhwcmV2ID0+IHByZXYubWFwKGMgPT4gYy5pZCA9PT0gY29sLmlkID8geyAuLi5jLCBsYWJlbDogdmFsIH0gOiBjKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRpbmdDb2x1bW5OYW1lSWQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGUuY3VycmVudFRhcmdldC52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldENvbHVtbnMocHJldiA9PiBwcmV2Lm1hcChjID0+IGMuaWQgPT09IGNvbC5pZCA/IHsgLi4uYywgbGFiZWw6IHZhbCB9IDogYykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0NvbHVtbk5hbWVJZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0NvbHVtbk5hbWVJZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIGxpbmUtY2xhbXAtMiBsZWFkaW5nLVsxLjE1XSBicmVhay13b3JkcyBmbGV4LTEgbXItMC41IGN1cnNvci10ZXh0IHdoaXRlc3BhY2UtcHJlLXdyYXAgdGV4dC1jZW50ZXJcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZUVudGVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wuZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY3QgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIb3ZlclRpdGxlQ29vcmRzKHsgeDogcmVjdC5sZWZ0LCB5OiByZWN0LmJvdHRvbSArIDUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRIb3ZlcmVkQ29sdW1uSWQoY29sLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uTW91c2VMZWF2ZT17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEhvdmVyZWRDb2x1bW5JZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17KCkgPT4gc2V0RWRpdGluZ0NvbHVtbk5hbWVJZChjb2wuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29sLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtb3V0bGluZS12YXJpYW50IGZvbnQtYm9sZCBteC1hdXRvIHRleHQtWzEwcHhdIHRyYWNraW5nLXdpZGVzdCBjdXJzb3ItcG9pbnRlciBncm91cC1ob3Zlcjp0ZXh0LWJyYW5kLXByaW1hcnlcIiB0aXRsZT17YOyXtCDsiKjquYA6ICR7Y29sLmxhYmVsfSAo7Jqw7YG066at7ZWY7JesIO2ZleyepSlgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLlxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICAgICAgICB7IWlzTWluaW1pemVkICYmIGNvbHVtblNlYXJjaFRlcm1zW2NvbC5pZF0gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgIDxGaWx0ZXIgY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LWJyYW5kLXByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgey8qIENvbHVtbiBSZXNpemUgSGFuZGxlICovfVxuICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgb25Nb3VzZURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVzaXppbmdDb2xJZChjb2wuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0UmVzaXplU3RhcnRYKGUuY2xpZW50WCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSZXNpemVTdGFydFdpZHRoKGNvbHVtbldpZHRoc1tjb2wuaWRdIHx8IDE1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSAtcmlnaHQtNCB0b3AtMCBib3R0b20tMCB3LTQgY3Vyc29yLWNvbC1yZXNpemUgaG92ZXI6YmctYnJhbmQtcHJpbWFyeS8yMCBncm91cC1ob3ZlcjpiZy1icmFuZC1vdXRsaW5lLXZhcmlhbnQvMTAgei0xMCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLtgazquLAg7KGw7KCIXCJcbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICl9KX1cblxuICAgICAgICAgICAgICB7LyogQ2xpY2thYmxlIEhlYWRlciBmb3IgQ29sdW1uIGNyZWF0aW9uIChcIuyXtCDstpTqsIBcIikgKi99XG4gICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC00IHB5LTMgdy1bMTUwcHhdIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgZm9udC1tZWRpdW1cIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tYWRkLWN1c3RvbS1jb2x1bW5cIlxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0FkZENvbHVtbk1vZGFsKHRydWUpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LXhzIGJvcmRlciBib3JkZXItZGFzaGVkIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdGV4dC1icmFuZC1vdXRsaW5lIGhvdmVyOnRleHQtYnJhbmQtcHJpbWFyeSBob3Zlcjpib3JkZXItYnJhbmQtcHJpbWFyeSBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2gvMzUgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwIGN1cnNvci1wb2ludGVyIHctZnVsbCB0ZXh0LWxlZnRcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgIOyXtCDstpTqsIBcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC90aD5cblxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3RoZWFkPlxuXG4gICAgICAgICAgey8qIEJvZHkgQmxvY2sgKi99XG4gICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1icmFuZC1vbi1zdXJmYWNlIGRpdmlkZS15IGRpdmlkZS1icmFuZC1vdXRsaW5lLXZhcmlhbnQvNjAgbGVhZGluZy1bMS4zNV1cIj5cbiAgICAgICAgICAgIHtmaWx0ZXJlZEFuZFNvcnRlZFJlcXVpcmVtZW50cy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgY29sU3Bhbj17Y29sdW1ucy5sZW5ndGggKyAzfSBjbGFzc05hbWU9XCJweC02IHB5LTEyIHRleHQtY2VudGVyIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxDaXJjbGVEb3QgY2xhc3NOYW1lPVwidy04IGgtOCB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbmltYXRlLXB1bHNlXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPuu2gO2Vqe2VmOuKlCDsmpTqtazsgqztla3snbQg7JeG7Iq164uI64ukLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBvcGFjaXR5LTcwXCI+7IOIIOyalOq1rOyCrO2VreydhCDrp4zrk6TquLAg7JyE7ZW0IOyDgeuLqOydmCAn7IOIIOyalOq1rOyCrO2VrScg65iQ64qUIO2VmOuLqOydmCAn7ZaJIOy2lOqwgCcg67KE7Yq87J2EIOuIjOufrOyjvOyEuOyalC48L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgZmlsdGVyZWRBbmRTb3J0ZWRSZXF1aXJlbWVudHMubWFwKChyZXEpID0+IChcbiAgICAgICAgICAgICAgICA8U3ByZWFkc2hlZXRSb3cgXG4gICAgICAgICAgICAgICAgICBrZXk9e3JlcS5pZH1cbiAgICAgICAgICAgICAgICAgIHJlcT17cmVxfVxuICAgICAgICAgICAgICAgICAgaXNTZWxlY3RlZD17c2VsZWN0ZWRJZHMuaW5jbHVkZXMocmVxLmlkKX1cbiAgICAgICAgICAgICAgICAgIGRyYWdPdmVyUm93SWQ9e2RyYWdPdmVyUm93SWR9XG4gICAgICAgICAgICAgICAgICBjb2x1bW5zPXtjb2x1bW5zfVxuICAgICAgICAgICAgICAgICAgbWluaW1pemVkQ29sdW1ucz17bWluaW1pemVkQ29sdW1uc31cbiAgICAgICAgICAgICAgICAgIGNvbHVtbldpZHRocz17Y29sdW1uV2lkdGhzfVxuICAgICAgICAgICAgICAgICAgaXNBY3RpdmU9e2FjdGl2ZUNlbGxFZGl0b3I/LnJvd0lkID09PSByZXEuaWR9XG4gICAgICAgICAgICAgICAgICBhY3RpdmVGaWVsZD17YWN0aXZlQ2VsbEVkaXRvcj8ucm93SWQgPT09IHJlcS5pZCA/IGFjdGl2ZUNlbGxFZGl0b3IuZmllbGQgOiBudWxsfVxuICAgICAgICAgICAgICAgICAgaXNMb2NrZWRCeU90aGVyPXshIWFjdGl2ZUxvY2tzW3JlcS5pZF0gJiYgYWN0aXZlTG9ja3NbcmVxLmlkXS51c2VySWQgIT09IGN1cnJlbnRVc2VyPy5pZH1cbiAgICAgICAgICAgICAgICAgIGxvY2tlZEJ5TmFtZT17YWN0aXZlTG9ja3NbcmVxLmlkXT8udXNlck5hbWUgPz8gbnVsbH1cbiAgICAgICAgICAgICAgICAgIGlzUHJpb3JpdHlPcGVuPXtzaG93UHJpb3JpdHlEcm9wZG93bklkID09PSByZXEuaWR9XG4gICAgICAgICAgICAgICAgICBpc0Fzc2lnbmVlT3Blbj17c2hvd0Fzc2lnbmVlRHJvcGRvd25JZCA9PT0gcmVxLmlkfVxuICAgICAgICAgICAgICAgICAgaXNTdGF0dXNPcGVuPXtzaG93U3RhdHVzRHJvcGRvd25JZCA9PT0gcmVxLmlkfVxuICAgICAgICAgICAgICAgICAgY3VycmVudFVzZXI9e2N1cnJlbnRVc2VyfVxuICAgICAgICAgICAgICAgICAgYXNzaWduZWVzUG9vbD17YXNzaWduZWVzUG9vbH1cbiAgICAgICAgICAgICAgICAgIHJlcUJ5SWQ9e3JlcUJ5SWR9XG4gICAgICAgICAgICAgICAgICBleGNoYW5nZVJhdGVzPXtleGNoYW5nZVJhdGVzfVxuICAgICAgICAgICAgICAgICAgYWN0aXZlQ2VsbEVkaXRvcj17YWN0aXZlQ2VsbEVkaXRvcn1cbiAgICAgICAgICAgICAgICAgIHRhYkRhdGFNYXA9e3RhYkRhdGFNYXB9XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIGhhbmRsZVJvd0RyYWdPdmVyPXtoYW5kbGVSb3dEcmFnT3Zlcn1cbiAgICAgICAgICAgICAgICAgIGhhbmRsZVJvd0Ryb3A9e2hhbmRsZVJvd0Ryb3B9XG4gICAgICAgICAgICAgICAgICBoYW5kbGVEdXBsaWNhdGVSb3c9e2hhbmRsZUR1cGxpY2F0ZVJvd31cbiAgICAgICAgICAgICAgICAgIGhhbmRsZVJvd0RyYWdTdGFydD17aGFuZGxlUm93RHJhZ1N0YXJ0fVxuICAgICAgICAgICAgICAgICAgaGFuZGxlU2VsZWN0Um93PXtoYW5kbGVTZWxlY3RSb3d9XG4gICAgICAgICAgICAgICAgICBzZXRNaW5pbWl6ZWRDb2x1bW5zPXtzZXRNaW5pbWl6ZWRDb2x1bW5zfVxuICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcj17c2V0QWN0aXZlQ2VsbEVkaXRvcn1cbiAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQ9e3VwZGF0ZVJlcXVpcmVtZW50RmllbGR9XG4gICAgICAgICAgICAgICAgICBoYW5kbGVHcmlkUGFzdGU9e2hhbmRsZUdyaWRQYXN0ZX1cbiAgICAgICAgICAgICAgICAgIHNldFNob3dQcmlvcml0eURyb3Bkb3duSWQ9e3NldFNob3dQcmlvcml0eURyb3Bkb3duSWR9XG4gICAgICAgICAgICAgICAgICBwcmlvcml0eVJlZj17cHJpb3JpdHlSZWZ9XG4gICAgICAgICAgICAgICAgICBzZXRTaG93QXNzaWduZWVEcm9wZG93bklkPXtzZXRTaG93QXNzaWduZWVEcm9wZG93bklkfVxuICAgICAgICAgICAgICAgICAgb3JpZ2luYWxTZXRSZXF1aXJlbWVudHM9e29yaWdpbmFsU2V0UmVxdWlyZW1lbnRzfVxuICAgICAgICAgICAgICAgICAgYXNzaWduZWVSZWY9e2Fzc2lnbmVlUmVmfVxuICAgICAgICAgICAgICAgICAgc2V0U2hvd1N0YXR1c0Ryb3Bkb3duSWQ9e3NldFNob3dTdGF0dXNEcm9wZG93bklkfVxuICAgICAgICAgICAgICAgICAgc3RhdHVzUmVmPXtzdGF0dXNSZWZ9XG4gICAgICAgICAgICAgICAgICBzZXRSZXF1aXJlbWVudHM9e3NldFJlcXVpcmVtZW50c31cbiAgICAgICAgICAgICAgICAgIHNldENvbHVtbnM9e3NldENvbHVtbnN9XG4gICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZElkcz17c2V0U2VsZWN0ZWRJZHN9XG4gICAgICAgICAgICAgICAgICBnZXRDZWxsU3RpY2t5U3R5bGU9e2dldENlbGxTdGlja3lTdHlsZX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgey8qIEJvdHRvbSBSb3cgQWRkIEJ1dHRvbiBcIu2WiSDstpTqsIBcIiAqL31cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMCBib3JkZXItdCBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50XCIgY29sU3Bhbj17Y29sdW1ucy5sZW5ndGggKyAzfT5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgaWQ9XCJidG4tc3ByZWFkc2hlZXQtYWRkLWJvdHRvbVwiXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVBZGRSb3d9XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTIgcHgtNSBweS0zIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGhvdmVyOnRleHQtYnJhbmQtcHJpbWFyeSBob3ZlcjpiZy1icmFuZC1wcmltYXJ5LWNvbnRhaW5lci81IHRyYW5zaXRpb24tY29sb3JzIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWxlZnQgc2VsZWN0LW5vbmUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxQbHVzIGNsYXNzTmFtZT1cInctNCBoLTRcIiAvPlxuICAgICAgICAgICAgICAgICAg7ZaJIOy2lOqwgFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cblxuICAgICAgICAgIDwvdGJvZHk+XG4gICAgICAgIDwvdGFibGU+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIDMuIEhlbHBlciBCYWNrZHJvcCBNb2RhbCBmb3IgQWRkIEN1c3RvbSBDb2x1bW4gXCLsl7Qg7LaU6rCAIOuqqOuLrFwiICovfVxuICAgICAge3Nob3dBZGRDb2x1bW5Nb2RhbCAmJiAoXG4gICAgICAgIDxEcmFnZ2FibGVNb2RhbFxuICAgICAgICAgIGlzT3Blbj17c2hvd0FkZENvbHVtbk1vZGFsfVxuICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHtcbiAgICAgICAgICAgIHNldFNob3dBZGRDb2x1bW5Nb2RhbChmYWxzZSk7XG4gICAgICAgICAgICBzZXRFZGl0aW5nQ29sdW1uRGVmSWQobnVsbCk7XG4gICAgICAgICAgICBzZXROZXdDb2x1bW5OYW1lKCcnKTtcbiAgICAgICAgICAgIHNldE5ld0NvbHVtblR5cGUoJ3RleHQnKTtcbiAgICAgICAgICAgIHNldE5ld0NvbHVtbk9wdGlvbnNJbnB1dCgnJyk7XG4gICAgICAgICAgfX1cbiAgICAgICAgICB0aXRsZT17ZWRpdGluZ0NvbHVtbkRlZklkID8gXCLsl7Qg7IaN7ISxIOuzgOqyvVwiIDogXCLsg4gg7Lus65+8KOyXtCkg7KCV7J2YXCJ9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+7Je0IOuqhey5rSAo7JiIOiDqsoDspp0g6rKw6rO8LCDrqZTrqqgsIOuLtOuLueu2gOyEnCk8L2xhYmVsPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bmV3Q29sdW1uTmFtZX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5ld0NvbHVtbk5hbWUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLsl7Qg7J2066aEIOyeheugpS4uLlwiXG4gICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17ZSA9PiBlLmtleSA9PT0gJ0VudGVyJyAmJiBoYW5kbGVBZGRPckVkaXRDdXN0b21Db2x1bW4oKX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+7Je0IOyGjeyEsSDsnKDtmJUgKE5vdGlvbiDsiqTtg4DsnbwpPC9sYWJlbD5cbiAgICAgICAgICAgICAgICA8c2VsZWN0IFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld0NvbHVtblR5cGV9XG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXROZXdDb2x1bW5UeXBlKGUudGFyZ2V0LnZhbHVlIGFzIENvbHVtblR5cGUpfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInRleHRcIj7thY3siqTtirggKFRleHQpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibnVtYmVyXCI+7Iir7J6QIChOdW1iZXIpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZGF0ZVwiPuuCoOynnCAoRGF0ZSk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjaGVja2JveFwiPuyytO2BrOuwleyKpCAoQ2hlY2tib3gpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2VsZWN0XCI+7ISg7YOdIChTZWxlY3QpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic3RhdHVzXCI+7IOB7YOcIChTdGF0dXMpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicmVsYXRpb25cIj7qtIDqs4TtmJUgKFJlbGF0aW9uKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInJvbGx1cFwiPuuhpOyXhSAoUm9sbHVwKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImZvcm11bGFcIj7siJjsi50gKEZvcm11bGEpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibG9va3VwXCI+6rWQ7LCoIO2DrSDssLjsobAgKExvb2t1cCk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjdXJyZW5jeV91c2RcIj7smbjtmZQg7ZmY7IKwIChVU0QpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYnV0dG9uXCI+67KE7Yq8IChCdXR0b24pPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHtuZXdDb2x1bW5UeXBlID09PSAnbG9va3VwJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPuuMgOyDgSDtg60gKOyEoO2DnSDsi5wg6rCA7KC47JisIO2DrSk8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb29rdXBUYWJJZElucHV0fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvb2t1cFRhYklkSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPu2DreydhCDshKDtg53tlZjshLjsmpQ8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICB7dGFicy5tYXAodCA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17dC5pZH0gdmFsdWU9e3QuaWR9Pnt0LnNpZGViYXJMYWJlbH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPu2YhOyerCDtg63snZgg6riw7KSAIOyXtCAo7JiIOiDquLDspIAv6rKs7KCBKTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2xvb2t1cE1hdGNoTXlDb2xJZElucHV0fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvb2t1cE1hdGNoTXlDb2xJZElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMyBweS0yIGJnLWJyYW5kLXN1cmZhY2UgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7quLDspIAg7Je0IOyEoO2DnTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ0aXRsZVwiPu2YuOyEoOuqhShUaXRsZSk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICB7Y29sdW1ucy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17Yy5pZH0gdmFsdWU9e2MuaWR9PntjLmxhYmVsfTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+64yA7IOBIO2DreydmCDruYTqtZDtlaAg7Je0ICjsnIQg7Je06rO8IOqwkuydtCDqsJnsnYDsp4Ag67mE6rWQKTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2xvb2t1cE1hdGNoVGFyZ2V0Q29sSWRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRMb29rdXBNYXRjaFRhcmdldENvbElkSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbG9va3VwVGFiSWRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7ruYTqtZAg64yA7IOBIOyXtCDshKDtg508L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwidGl0bGVcIj7tmLjshKDrqoUoVGl0bGUpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAge2xvb2t1cFRhYklkSW5wdXQgJiYgdGFiRGF0YU1hcD8uW2xvb2t1cFRhYklkSW5wdXRdPy5jb2x1bW5zPy5tYXAoKGM6IGFueSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2MuaWR9IHZhbHVlPXtjLmlkfT57Yy5sYWJlbH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPuuMgOyDgSDtg63sl5DshJwg6rCA7KC47JisIOyXtOydmCDqsJIgKOqysOqzvOqwkik8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0fVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldExvb2t1cFJldHVyblRhcmdldENvbElkSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshbG9va3VwVGFiSWRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7qsIDsoLjsmKwg7Je0IOyEoO2DnTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ0aXRsZVwiPu2YuOyEoOuqhShUaXRsZSk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICB7bG9va3VwVGFiSWRJbnB1dCAmJiB0YWJEYXRhTWFwPy5bbG9va3VwVGFiSWRJbnB1dF0/LmNvbHVtbnM/Lm1hcCgoYzogYW55KSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17Yy5pZH0gdmFsdWU9e2MuaWR9PntjLmxhYmVsfTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHtuZXdDb2x1bW5UeXBlID09PSAnZm9ybXVsYScgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBtYi0xLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW1cIj7siJjsi50gKEV4Y2VsIOyKpO2DgOydvCDsp4Dsm5ApPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93Rm9ybXVsYUhlbHAodHJ1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWJyYW5kLXByaW1hcnkgaG92ZXI6dW5kZXJsaW5lIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxIZWxwQ2lyY2xlIGNsYXNzTmFtZT1cInctMy41IGgtMy41XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICDsiJjsi50g64+E7JuA66eQXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtdWxhSW5wdXR9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEZvcm11bGFJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi7JiIOiBTVU0oW+uLqOqwgF0sIFvsiJjshKDruYRdKSDrmJDripQgW+yDge2DnF0gPT09ICfsmYTro4wnID8gJ+KchScgOiAn8J+aqCdcIlxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMyBweS0yIGJnLWJyYW5kLXN1cmZhY2UgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lXCJcbiAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCBtdC0xIGxlYWRpbmctcmVsYXhlZFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3Ryb25nPlvsu6zrn7zrqoVdPC9zdHJvbmc+IO2YleyLneycvOuhnCDqsJLsnYQg7LC47KGw7ZWY6rOgLCDsl5HshYAg7ZWo7IiYKFNVTSwgQVZFUkFHRSwgSUYg65OxKeulvCDsgqzsmqntlaAg7IiYIOyeiOyKteuLiOuLpC5cbiAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7bmV3Q29sdW1uVHlwZSA9PT0gJ2J1dHRvbicgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LW1lZGl1bSBtYi0xLjVcIj7rsoTtirwg652867KoPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2J1dHRvbkxhYmVsSW5wdXR9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEJ1dHRvbkxhYmVsSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIuyYiDog64K06rCAIOunoeq4sFwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmUgbWItMlwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+64+Z7J6RPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtidXR0b25BY3Rpb25JbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0QnV0dG9uQWN0aW9uSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMyBweS0yIGJnLWJyYW5kLXN1cmZhY2UgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInN0YXJ0X3dvcmtcIj7ri7Tri7kg64KY66GcIOuzgOqyvSAmIOynhO2WiSDspJE8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImZpbmlzaF93b3JrXCI+7IOB7YOcIOyZhOujjOuhnCDrs4Dqsr08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHtuZXdDb2x1bW5UeXBlID09PSAnY3VycmVuY3lfdXNkJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYnJhbmQtb3V0bGluZS12YXJpYW50IG10LTEgbWItMlwiPuyZuO2ZmCDquIjslaHsnYQg7ZmY7JyoIOygleuztOulvCDthrXtlbQg7ZmY7IKw7ZWp64uI64ukLiDquLDspIDsnbQg65CY64qUIOq4iOyVoSDsl7Tqs7wg7ZmU7Y+QIOyXtOydhCDshKDtg53tlZjshLjsmpQuPC9wPlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+6riI7JWhIOuMgOyDgSDsl7QgKEFtb3VudCk8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VycmVuY3lBbW91bnRDb2xJZElucHV0fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRDdXJyZW5jeUFtb3VudENvbElkSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtMyBweS0yIGJnLWJyYW5kLXN1cmZhY2UgdGV4dC1zbSBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkLWxnIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lIGN1cnNvci1wb2ludGVyIG1iLTJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+LS0g7Lus65+8IOyEoO2DnSAtLTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICB7Y29sdW1ucy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2MuaWR9IHZhbHVlPXtjLmlkfT57Yy5sYWJlbH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPu2ZlO2PkCDrjIDsg4Eg7Je0IChDdXJyZW5jeSk8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VycmVuY3lDb2RlQ29sSWRJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q3VycmVuY3lDb2RlQ29sSWRJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmUgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+LS0g7Lus65+8IOyEoO2DnSAtLTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICB7Y29sdW1ucy5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2MuaWR9IHZhbHVlPXtjLmlkfT57Yy5sYWJlbH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNSBtdC0yXCI+7IaM7IiY7KCQIOyekOumrOyImDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgICAgICBtYXg9XCIxMFwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjdXJyZW5jeURlY2ltYWxQbGFjZXNJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Q3VycmVuY3lEZWNpbWFsUGxhY2VzSW5wdXQoTnVtYmVyKGUudGFyZ2V0LnZhbHVlKSl9XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7bmV3Q29sdW1uVHlwZSA9PT0gJ3NlbGVjdCcgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCBtdC0xIG1iLTJcIj7shKDtg50g6rCA64ql7ZWcIOyYteyFmOuTpOydhCDsibztkZwoLCnroZwg6rWs67aE7ZWY7JesIOyeheugpe2VmOyEuOyalC48L3A+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LW1lZGl1bSBtYi0xLjVcIj7smLXshZgg7ZWt66qpICjsmIg6IEZDLCBORkMsIFRCRCk8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17bmV3Q29sdW1uT3B0aW9uc0lucHV0fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXROZXdDb2x1bW5PcHRpb25zSW5wdXQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIkZDLCBORkMsIFRCRFwiXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC0zIHB5LTIgYmctYnJhbmQtc3VyZmFjZSB0ZXh0LXNtIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgZm9jdXM6cmluZy0xIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgICB7bmV3Q29sdW1uVHlwZSA9PT0gJ3N0YXR1cycgJiYgKFxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCBtdC0xIG1iLTJcIj7tlaAg7J28LCDsp4Ttlokg7KSRLCDsmYTro4zsnZggM+uLqOqzhCDrjIDrtoTrpZgg7JWE656YIOyEuOu2gCDri6jqs4Trpbwg7LaU6rCA7ZWY7JesIOq0gOumrO2VqeuLiOuLpC48L3A+XG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LW1lZGl1bSBtYi0xLjVcIj7shLjrtoAg64uo6rOEIOyJvO2RnCDqtazrtoQgKOyYiDog6riw7ZqNLOuUlOyekOyduCzqsJzrsJwsUUEpPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIiBcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3N0YXR1c09wdGlvbnNJbnB1dH1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0U3RhdHVzT3B0aW9uc0lucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLquLDtmo0sIOuUlOyekOyduCwg6rCc67CcLCBRQSwg67Cw7Y+sXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZVwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHtuZXdDb2x1bW5UeXBlID09PSAncmVsYXRpb24nICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnQgbXQtMSBtYi0yXCI+64uk66W4IOyalOq1rOyCrO2VrShJRCnrk6TsnYQg7Jew6rKw7ZWY7JesIOuNsOydtO2EsOulvCDssLjsobDtlanri4jri6QuPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIHtuZXdDb2x1bW5UeXBlID09PSAncm9sbHVwJyAmJiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPuuMgOyDgSDqtIDqs4TtmJUg7Lus65+8IElEPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtyb2xsdXBSZWxJZElucHV0fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRSb2xsdXBSZWxJZElucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7shKDtg508L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAge2NvbHVtbnMuZmlsdGVyKGMgPT4gYy50eXBlID09PSAncmVsYXRpb24nKS5tYXAoYyA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2MuaWR9IHZhbHVlPXtjLmlkfT57Yy5sYWJlbH08L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+7KeR6rOEIOyXsOyCsDwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8c2VsZWN0IFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cm9sbHVwQWdnVHlwZUlucHV0fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRSb2xsdXBBZ2dUeXBlSW5wdXQoZS50YXJnZXQudmFsdWUgYXMgYW55KX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJjb3VudFwiPuqwnOyImCDshLjquLA8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInBlcmNlbnRfZG9uZVwiPuyZhOujjCDruYTsnKgoJSk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG5cbiAgICAgICAgICAgICAge1snbnVtYmVyJywgJ2Zvcm11bGEnLCAncm9sbHVwJywgJ2xvb2t1cCddLmluY2x1ZGVzKG5ld0NvbHVtblR5cGUpICYmIChcbiAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gbWItMS41XCI+7ZGc7Iuc7ZWgIOyGjOyImOygkCDsnpDrpr/siJggKOyIq+yekOydmCDqsr3smrAsIOqzteuegCDsi5wg6riw67O46rCSKTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXG4gICAgICAgICAgICAgICAgICAgIG1pbj1cIjBcIlxuICAgICAgICAgICAgICAgICAgICBtYXg9XCIxMFwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtkZWNpbWFsUGxhY2VzSW5wdXR9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldERlY2ltYWxQbGFjZXNJbnB1dChlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi7JiIOiAyXCJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZVwiXG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICApfVxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMiBqdXN0aWZ5LWVuZCBwdC0yXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0U2hvd0FkZENvbHVtbk1vZGFsKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RWRpdGluZ0NvbHVtbkRlZklkKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICBzZXROZXdDb2x1bW5OYW1lKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0TmV3Q29sdW1uVHlwZSgndGV4dCcpO1xuICAgICAgICAgICAgICAgICAgICBzZXROZXdDb2x1bW5PcHRpb25zSW5wdXQoJycpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMS44IGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UgdGV4dC14cyByb3VuZGVkLWxnIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICDst6jshoxcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQWRkT3JFZGl0Q3VzdG9tQ29sdW1ufVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0xLjggYmctYnJhbmQtcHJpbWFyeSB0ZXh0LWJyYW5kLW9uLXByaW1hcnkgdGV4dC14cyBmb250LXNlbWlib2xkIHJvdW5kZWQtbGcgaG92ZXI6b3BhY2l0eS05MCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge2VkaXRpbmdDb2x1bW5EZWZJZCA/IFwi7KCA7J6lXCIgOiBcIuyXtCDsg53shLFcIn1cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9EcmFnZ2FibGVNb2RhbD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBEZWxldGUgQ29sdW1uIENvbmZpcm1hdGlvbiBNb2RhbCAqL31cbiAgICAgIHtjb2x1bW5Ub0RlbGV0ZSAmJiAoXG4gICAgICAgIDxEcmFnZ2FibGVNb2RhbFxuICAgICAgICAgIGlzT3Blbj17ISFjb2x1bW5Ub0RlbGV0ZX1cbiAgICAgICAgICBvbkNsb3NlPXsoKSA9PiBzZXRDb2x1bW5Ub0RlbGV0ZShudWxsKX1cbiAgICAgICAgICB0aXRsZT17PHNwYW4gY2xhc3NOYW1lPVwidGV4dC1icmFuZC1lcnJvclwiPuyXtCDsgq3soJwg6rK96rOgPC9zcGFuPn1cbiAgICAgICAgICBpY29uPXs8QWxlcnRDaXJjbGUgY2xhc3NOYW1lPVwidy01IGgtNSB0ZXh0LWJyYW5kLWVycm9yXCIgLz59XG4gICAgICAgID5cbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgbWItNSBsZWFkaW5nLXJlbGF4ZWRcIj5cbiAgICAgICAgICAgICAgPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLW9uLXN1cmZhY2VcIj4ne2NvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IGNvbHVtblRvRGVsZXRlKT8ubGFiZWx9Jzwvc3Ryb25nPiDsl7TsnYQg7IKt7KCc7ZWY7Iuc6rKg7Iq164uI6rmMPyDqtIDroKgg642w7J207YSw6rCAIOuqqOuRkCDsmIHqtazsoIHsnLzroZwg7IaM66m465CY66mwIOuzteq1rO2VoCDsiJgg7JeG7Iq164uI64ukLlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kIGdhcC0yXCI+XG4gICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q29sdW1uVG9EZWxldGUobnVsbCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UtaGlnaCB0ZXh0LXhzIHJvdW5kZWQtbGcgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg7Leo7IaMXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2V4ZWN1dGVEZWxldGVDb2x1bW59XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0yIGJnLWJyYW5kLWVycm9yIHRleHQtd2hpdGUgdGV4dC14cyBmb250LXNlbWlib2xkIHJvdW5kZWQtbGcgaG92ZXI6b3BhY2l0eS05MCBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLW9wYWNpdHlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg7JiB6rWsIOyCreygnFxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0RyYWdnYWJsZU1vZGFsPlxuICAgICAgKX1cblxuICAgICAgey8qIDQuIEFzc2lnbmVlIFBvb2wgTWFuYWdlbWVudCBNb2RhbCAqL31cbiAgICAgIHtzaG93QXNzaWduZWVNYW5hZ2VyICYmIChcbiAgICAgICAgPERyYWdnYWJsZU1vZGFsXG4gICAgICAgICAgaXNPcGVuPXtzaG93QXNzaWduZWVNYW5hZ2VyfVxuICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dBc3NpZ25lZU1hbmFnZXIoZmFsc2UpfVxuICAgICAgICAgIHRpdGxlPVwi64u064u57J6QIO2SgCDqtIDrpqxcIlxuICAgICAgICAgIGljb249ezxVc2VycyBjbGFzc05hbWU9XCJ3LTQuNSBoLTQuNSB0ZXh0LWJyYW5kLXByaW1hcnlcIiAvPn1cbiAgICAgICAgICBkZWZhdWx0UG9zPXthc3NpZ25lZU1hbmFnZXJQb3N9XG4gICAgICAgID5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgICA8aW5wdXQgXG4gICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiIFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e25ld0Fzc2lnbmVlTmFtZX1cbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldE5ld0Fzc2lnbmVlTmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIuyDiCDri7Tri7nsnpAg7J2066aEIOyeheugpVwiXG4gICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgbmV3QXNzaWduZWVOYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0lkID0gYFVTUi0ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNil9YDtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRBc3NpZ25lZXNQb29sKHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IG5ld0lkLCBuYW1lOiBuZXdBc3NpZ25lZU5hbWUudHJpbSgpLCBhdmF0YXJVcmw6ICcnIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICBzZXROZXdBc3NpZ25lZU5hbWUoJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleC0xIHB4LTMgcHktMS41IGJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0IHRleHQteHMgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZSBwbGFjZWhvbGRlcjp0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudFwiXG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV3QXNzaWduZWVOYW1lLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld0lkID0gYFVTUi0ke0RhdGUubm93KCkudG9TdHJpbmcoKS5zbGljZSgtNil9YDtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRBc3NpZ25lZXNQb29sKHByZXYgPT4gWy4uLnByZXYsIHsgaWQ6IG5ld0lkLCBuYW1lOiBuZXdBc3NpZ25lZU5hbWUudHJpbSgpLCBhdmF0YXJVcmw6ICcnIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICBzZXROZXdBc3NpZ25lZU5hbWUoJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgYmctYnJhbmQtcHJpbWFyeSB0ZXh0LWJyYW5kLW9uLXByaW1hcnkgcm91bmRlZC1sZyBmb250LXNlbWlib2xkIHRleHQteHMgaG92ZXI6b3BhY2l0eS05MCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFBsdXMgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgaW5saW5lLWJsb2NrXCIgLz4g7LaU6rCAXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWF4LWgtNjAgb3ZlcmZsb3cteS1hdXRvIHNwYWNlLXktMS41IGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgcC0yIGJnLWJyYW5kLXN1cmZhY2UtbG93XCI+XG4gICAgICAgICAgICAgICAge2Fzc2lnbmVlc1Bvb2wubGVuZ3RoID09PSAwICYmIChcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1jZW50ZXIgcC0zIHRleHQtYnJhbmQtb3V0bGluZS12YXJpYW50XCI+65Ox66Gd65CcIOuLtOuLueyekOqwgCDsl4bsirXri4jri6QuPC9wPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAge2Fzc2lnbmVlc1Bvb2wubWFwKGEgPT4gKFxuICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2EuaWR9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwLTIgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBob3ZlcjpzaGFkb3ctc20gcm91bmRlZCB0cmFuc2l0aW9uLWNvbG9ycyBncm91cCBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50IGhvdmVyOmJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgYmctYnJhbmQtc3VyZmFjZS1sb3dlc3RcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy02IGgtNiByb3VuZGVkLWZ1bGwgYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHthLm5hbWUuY2hhckF0KDApfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudFwiPnthLm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgJyR7YS5uYW1lfScg64uY7J2EIO2SgOyXkOyEnCDsgq3soJztlZjsi5zqsqDsirXri4jquYw/XFxu7J20IOuLtOuLueyekOqwgCDrsLDsoJXrkJwg66qo65OgIOyalOq1rOyCrO2VreyXkOyEnOuPhCDri7Tri7nsnpDqsIAg7J286rSEIOyCreygnOuQqeuLiOuLpC5gKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBc3NpZ25lZXNQb29sKHByZXYgPT4gcHJldi5maWx0ZXIoeCA9PiB4LmlkICE9PSBhLmlkKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldFJlcXVpcmVtZW50cyhwcmV2ID0+IHByZXYubWFwKHJlcSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnJlcSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NpZ25lZXM6IHJlcS5hc3NpZ25lZXMuZmlsdGVyKHggPT4geC5pZCAhPT0gYS5pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtZXJyb3Igb3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRyYW5zaXRpb24tb3BhY2l0eSBwLTEgYmctYnJhbmQtZXJyb3ItY29udGFpbmVyLzIwIHJvdW5kZWQgaG92ZXI6YmctYnJhbmQtZXJyb3ItY29udGFpbmVyIGN1cnNvci1wb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L0RyYWdnYWJsZU1vZGFsPlxuICAgICAgKX1cblxuICAgICAgey8qIEhvdmVyZWQgQ29sdW1uIERlc2NyaXB0aW9uIFRvb2x0aXAgKi99XG4gICAgICB7aG92ZXJlZENvbHVtbklkICYmIGhvdmVyVGl0bGVDb29yZHMgJiYgY3JlYXRlUG9ydGFsKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgIHN0eWxlPXt7IHRvcDogaG92ZXJUaXRsZUNvb3Jkcy55LCBsZWZ0OiBob3ZlclRpdGxlQ29vcmRzLngsIHBvc2l0aW9uOiAnZml4ZWQnIH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHNoYWRvdy1sZyB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZSBweC0zIHB5LTIgcm91bmRlZC1sZyBtYXgtdy14cyB6LVs5OTk5XSBwb2ludGVyLWV2ZW50cy1ub25lIHdoaXRlc3BhY2UtcHJlLXdyYXAgYW5pbWF0ZS1mYWRlLXNsaWRlLXVwXCJcbiAgICAgICAgPlxuICAgICAgICAgIHtjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBob3ZlcmVkQ29sdW1uSWQpPy5kZXNjcmlwdGlvbn1cbiAgICAgICAgPC9kaXY+LFxuICAgICAgICBkb2N1bWVudC5ib2R5XG4gICAgICApfVxuXG4gICAgICB7LyogRmlsdGVyIFBvcHVwIFBvcnRhbCAqL31cbiAgICAgIHtzaG93RmlsdGVyQ29sdW1uSWQgJiYgZmlsdGVyUG9wdXBDb29yZHMgJiYgY3JlYXRlUG9ydGFsKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgIHJlZj17ZmlsdGVyUG9wdXBSZWZ9XG4gICAgICAgICAgc3R5bGU9e3sgdG9wOiBmaWx0ZXJQb3B1cENvb3Jkcy50b3AsIGxlZnQ6IGZpbHRlclBvcHVwQ29vcmRzLmxlZnQsIHBvc2l0aW9uOiAnZml4ZWQnIH19XG4gICAgICAgICAgY2xhc3NOYW1lPVwibXQtMiB3LTQ4IGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBzaGFkb3cteGwgcC0yIHotWzk5OTldIGFuaW1hdGUtZmFkZS1zbGlkZS11cFwiXG4gICAgICAgICAgb25Nb3VzZURvd249eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICA+XG4gICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICB2YWx1ZT17Y29sdW1uU2VhcmNoVGVybXNbc2hvd0ZpbHRlckNvbHVtbklkXSB8fCAnJ31cbiAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q29sdW1uU2VhcmNoVGVybXMocHJldiA9PiAoeyAuLi5wcmV2LCBbc2hvd0ZpbHRlckNvbHVtbklkXTogZS50YXJnZXQudmFsdWUgfSkpfVxuICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2Ake2NvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IHNob3dGaWx0ZXJDb2x1bW5JZCk/LmxhYmVsIHx8ICcnfSDtlYTthLAuLi5gfVxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0IGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQgcC0xLjUgdGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnlcIlxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PixcbiAgICAgICAgZG9jdW1lbnQuYm9keVxuICAgICAgKX1cblxuICAgICAgey8qIERlc2NyaXB0aW9uIEVkaXQgTW9kYWwgKi99XG4gICAgICB7c2hvd0Rlc2NyaXB0aW9uRWRpdENvbElkICYmIChcbiAgICAgICAgPERyYWdnYWJsZU1vZGFsXG4gICAgICAgICAgaXNPcGVuPXt0cnVlfVxuICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dEZXNjcmlwdGlvbkVkaXRDb2xJZChudWxsKX1cbiAgICAgICAgICB0aXRsZT1cIuy7rOufvCDshKTrqoUo66mU66qoKSDsiJjsoJVcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGZvbnQtbWVkaXVtIG1iLTEuNVwiPuyEpOuqhSDrgrTsmqkg7KeA7IucICjrp4jsmrDsiqQg7Jik67KEIOyLnCDtjJ3sl4Xsl5Ag7ZGc7Iuc65CoKTwvbGFiZWw+XG4gICAgICAgICAgICAgIDx0ZXh0YXJlYSBcbiAgICAgICAgICAgICAgICB2YWx1ZT17ZGVzY3JpcHRpb25JbnB1dH1cbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXREZXNjcmlwdGlvbklucHV0KGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIuy7rOufvOyXkCDrjIDtlZwg67O07LapIOyEpOuqhS4uLlwiXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1icmFuZC1zdXJmYWNlIHRleHQtc20gYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZSBoLTI0IHJlc2l6ZS1ub25lXCJcbiAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yIGp1c3RpZnktZW5kIHB0LTJcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93RGVzY3JpcHRpb25FZGl0Q29sSWQobnVsbCl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0xLjggYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSB0ZXh0LXhzIHJvdW5kZWQtbGcgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg7Leo7IaMXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgIHNldENvbHVtbnMocHJldiA9PiBwcmV2Lm1hcChjID0+IGMuaWQgPT09IHNob3dEZXNjcmlwdGlvbkVkaXRDb2xJZCA/IHsgLi4uYywgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uSW5wdXQgfSA6IGMpKTtcbiAgICAgICAgICAgICAgICAgIHNldFNob3dEZXNjcmlwdGlvbkVkaXRDb2xJZChudWxsKTtcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMS44IGJnLWJyYW5kLXByaW1hcnkgdGV4dC1icmFuZC1vbi1wcmltYXJ5IHRleHQteHMgZm9udC1zZW1pYm9sZCByb3VuZGVkLWxnIGhvdmVyOm9wYWNpdHktOTAgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg7KCA7J6lXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvRHJhZ2dhYmxlTW9kYWw+XG4gICAgICApfVxuXG4gICAgICB7c2hvd0Zvcm11bGFIZWxwICYmIChcbiAgICAgICAgPERyYWdnYWJsZU1vZGFsXG4gICAgICAgICAgaXNPcGVuPXtzaG93Rm9ybXVsYUhlbHB9XG4gICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd0Zvcm11bGFIZWxwKGZhbHNlKX1cbiAgICAgICAgICB0aXRsZT1cIuyImOyLnShGb3JtdWxhKSDsnpHshLEg64+E7JuA66eQXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00IHRleHQtc20gdGV4dC1icmFuZC1vbi1zdXJmYWNlXCI+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWJyYW5kLXByaW1hcnkgbWItMVwiPjEuIOy7rOufvCjsl7QpIOywuOyhsCDrsKnrspU8L2g0PlxuICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50XCI+XG4gICAgICAgICAgICAgICAg64yA6rSE7Zi466W8IOyCrOyaqe2VmOyXrCDtmITsnqwg7ZaJKFJvdynsnZgg64uk66W4IOy7rOufvCDqsJLsnYQg6rCA7KC47Ji164uI64ukLjxici8+XG4gICAgICAgICAgICAgICAg7JiI66W8IOuTpOyWtCwgXCLsiJjrn4lcIuydtOudvOuKlCDsl7TsnbQg7J6I64uk66m0IDxjb2RlIGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UtaGlnaGVzdCBweC0xIHJvdW5kZWQgdGV4dC1icmFuZC1wcmltYXJ5XCI+W+yImOufiV08L2NvZGU+IOqzvCDqsJnsnbQg7J6R7ISx7ZWp64uI64ukLlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGQgdGV4dC1icmFuZC1wcmltYXJ5IG1iLTFcIj4yLiDsgqzsmqkg6rCA64ql7ZWcIOyXkeyFgCDtlajsiJg8L2g0PlxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBsaXN0LWRpc2MgbGlzdC1pbnNpZGUgc3BhY2UteS0xXCI+XG4gICAgICAgICAgICAgICAgPGxpPjxjb2RlIGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UtaGlnaGVzdCBweC0xIHJvdW5kZWQgZm9udC1tb25vXCI+U1VNKOqwkjEsIOqwkjIsIC4uLik8L2NvZGU+IDog7ZWp6rOEPC9saT5cbiAgICAgICAgICAgICAgICA8bGk+PGNvZGUgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEgcm91bmRlZCBmb250LW1vbm9cIj5BVkVSQUdFKOqwkjEsIOqwkjIsIC4uLik8L2NvZGU+IDog7Y+J6regPC9saT5cbiAgICAgICAgICAgICAgICA8bGk+PGNvZGUgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEgcm91bmRlZCBmb250LW1vbm9cIj5JRijsobDqsbQsIOywuOydvOuVjCwg6rGw7KeT7J2865WMKTwvY29kZT4gOiDsobDqsbTrrLg8L2xpPlxuICAgICAgICAgICAgICAgIDxsaT48Y29kZSBjbGFzc05hbWU9XCJiZy1icmFuZC1zdXJmYWNlLWhpZ2hlc3QgcHgtMSByb3VuZGVkIGZvbnQtbW9ub1wiPkRBWVMo7KKF66OM7J28LCDsi5zsnpHsnbwpPC9jb2RlPiA6IOuCoOynnCDssKjsnbQgKOydvOyImCDqs4TsgrApPC9saT5cbiAgICAgICAgICAgICAgICA8bGk+PGNvZGUgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEgcm91bmRlZCBmb250LW1vbm9cIj5NT05USFMo7KKF66OM7J28LCDsi5zsnpHsnbwpPC9jb2RlPiA6IOuCoOynnCDssKjsnbQgKOqwnOyblOyImCDqs4TsgrApPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWJyYW5kLXByaW1hcnkgbWItMVwiPjMuIO2ZmOycqCDrsI8g6riw67O4IOyGjeyEsTwvaDQ+XG4gICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgbWItMVwiPlxuICAgICAgICAgICAgICAgIOyDgeuLqOyXkOyEnCDsnoXroKXtlZwg7ZmY7Jyo7J2EIDxjb2RlIGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UtaGlnaGVzdCBweC0xIHJvdW5kZWRcIj5LUlc8L2NvZGU+LCA8Y29kZSBjbGFzc05hbWU9XCJiZy1icmFuZC1zdXJmYWNlLWhpZ2hlc3QgcHgtMSByb3VuZGVkXCI+VVNEPC9jb2RlPiwgPGNvZGUgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEgcm91bmRlZFwiPkVVUjwvY29kZT4g67OA7IiY66GcIOymieyLnCDqs7HtlZjsl6wg7IKs7Jqp7ZWgIOyImCDsnojsirXri4jri6QuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudFwiPlxuICAgICAgICAgICAgICAgIDxjb2RlIGNsYXNzTmFtZT1cImJnLWJyYW5kLXN1cmZhY2UtaGlnaGVzdCBweC0xIHJvdW5kZWRcIj5yZXE8L2NvZGU+IOuNsOydtO2EsCDqsJ3ssrTrgpggPGNvZGUgY2xhc3NOYW1lPVwiYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEgcm91bmRlZFwiPnRvZGF5PC9jb2RlPiDrs4DsiJjrj4Qg7IKs7Jqp7ZWgIOyImCDsnojsirXri4jri6QuXG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB0LTIgYm9yZGVyLXQgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudFwiPlxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiZm9udC1tZWRpdW0gdGV4dC14cyBtYi0yXCI+7Iuk7KCEIOyYiOyLnCDrqqjsnYw8L2g0PlxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwidGV4dC14cyBzcGFjZS15LTIgZm9udC1tb25vIGJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0IHAtMiBib3JkZXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3VuZGVkXCI+XG4gICAgICAgICAgICAgICAgPGxpPjxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50XCI+Ly8g65GQIOyXtOydmCDtlanqs4QgKFNVTSDtlajsiJgpPC9zcGFuPjxici8+U1VNKFvqsJzrsJwg6rO17IiYXSwgW+uUlOyekOyduCDqs7XsiJhdKTwvbGk+XG4gICAgICAgICAgICAgICAgPGxpPjxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50XCI+Ly8g7ZmY7JyoIOqzse2VmOq4sCAoVVNEKTwvc3Bhbj48YnIvPlvri6jqsIBdICogVVNEPC9saT5cbiAgICAgICAgICAgICAgICA8bGk+PHNwYW4gY2xhc3NOYW1lPVwidGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnRcIj4vLyDqsITri6jtlZwg7IKs7LmZ7Jew7IKwPC9zcGFuPjxici8+W+uLqOqwgF0gKiBb7IiY65+JXSAqIDEuMTwvbGk+XG4gICAgICAgICAgICAgICAgPGxpPjxzcGFuIGNsYXNzTmFtZT1cInRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50XCI+Ly8g7KGw6rG07IudIO2RnO2YhCAoSUYg7ZWo7IiYKTwvc3Bhbj48YnIvPklGKFvsmrDshKDsiJzsnIRdID09PSAn6ri06riJJywgJ/CfmqgnLCAn4pyFJyk8L2xpPlxuICAgICAgICAgICAgICAgIDxsaT48c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudFwiPi8vIOq4sOuzuCDtlYTrk5woc3RhdHVzKSDtmZzsmqk8L3NwYW4+PGJyLz5yZXEuc3RhdHVzID09PSAnRE9ORScgPyAxMDAgOiAwPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgcHQtMlwiPlxuICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dGb3JtdWxhSGVscChmYWxzZSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtNCBweS0xLjggYmctYnJhbmQtcHJpbWFyeSB0ZXh0LWJyYW5kLW9uLXByaW1hcnkgdGV4dC14cyBmb250LXNlbWlib2xkIHJvdW5kZWQtbGcgaG92ZXI6b3BhY2l0eS05MCBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDri6vquLBcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9EcmFnZ2FibGVNb2RhbD5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBTdXBlciBIZWFkZXIgQ29udGV4dCBNZW51IFBvcnRhbCAqL31cbiAgICAgIHtzdXBlckNvbnRleHRNZW51R3JvdXAgJiYgY3JlYXRlUG9ydGFsKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgIHN0eWxlPXt7IHRvcDogY29udGV4dE1lbnVQb3MueSwgbGVmdDogY29udGV4dE1lbnVQb3MueCwgcG9zaXRpb246ICdmaXhlZCcgfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xIHctNDggYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgc2hhZG93LTJ4bCBweS0xLjUgei1bOTk5OV0gYW5pbWF0ZS1mYWRlLXNsaWRlLXVwIGZsZXggZmxleC1jb2wgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtYnJhbmQtb24tc3VyZmFjZVwiXG4gICAgICAgICAgb25Nb3VzZURvd249eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICA+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldENvbHVtbnMocHJldiA9PiBwcmV2Lm1hcChjID0+IGMuZ3JvdXBOYW1lID09PSBzdXBlckNvbnRleHRNZW51R3JvdXAgPyB7IC4uLmMsIGdyb3VwTmFtZTogdW5kZWZpbmVkIH0gOiBjKSk7XG4gICAgICAgICAgICAgIHNldFN1cGVyQ29udGV4dE1lbnVHcm91cChudWxsKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEdyaWQgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIiAvPlxuICAgICAgICAgICAg7IOB7JyE7KCc66qp7Je0IO2VtOygnFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj4sXG4gICAgICAgIGRvY3VtZW50LmJvZHlcbiAgICAgICl9XG5cbiAgICAgIHsvKiBDb2x1bW4gQ29udGV4dCBNZW51IFBvcnRhbCAqL31cbiAgICAgIHtjb250ZXh0TWVudUNvbElkICYmICFzdXBlckNvbnRleHRNZW51R3JvdXAgJiYgY3JlYXRlUG9ydGFsKFxuICAgICAgICA8ZGl2IFxuICAgICAgICAgIHN0eWxlPXt7IHRvcDogY29udGV4dE1lbnVQb3MueSwgbGVmdDogY29udGV4dE1lbnVQb3MueCwgcG9zaXRpb246ICdmaXhlZCcgfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJtdC0xIHctNDggYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgc2hhZG93LTJ4bCBweS0xLjUgei1bOTk5OV0gYW5pbWF0ZS1mYWRlLXNsaWRlLXVwIGZsZXggZmxleC1jb2wgdGV4dC14cyBmb250LXNlbWlib2xkIHRleHQtYnJhbmQtb24tc3VyZmFjZVwiXG4gICAgICAgICAgb25Nb3VzZURvd249eyhlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpfVxuICAgICAgICA+XG4gICAgICAgICAgeygoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50TWVudUNvbCA9IGNvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IGNvbnRleHRNZW51Q29sSWQpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRNZW51Q29sICYmIGN1cnJlbnRNZW51Q29sLmlzQ3VzdG9tKSB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC00IHB5LTIgYm9yZGVyLWIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudC82MCBmbGV4IGZsZXgtY29sIGdhcC0xLjUgbWItMVwiIG9uQ2xpY2s9e2UgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX0+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LW1lZGl1bVwiPuyXtCDsho3shLEg7KeA7KCVPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPHNlbGVjdFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Y3VycmVudE1lbnVDb2wudHlwZSB8fCAndGV4dCd9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICBzZXRDb2x1bW5zKHByZXYgPT4gcHJldi5tYXAoYyA9PiBjLmlkID09PSBjb250ZXh0TWVudUNvbElkID8geyAuLi5jLCB0eXBlOiBlLnRhcmdldC52YWx1ZSBhcyBhbnkgfSA6IGMpKTtcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZCBweC0yIHB5LTEgdGV4dC14cyBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1icmFuZC1wcmltYXJ5IG91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJ0ZXh0XCI+7YWN7Iqk7Yq4IChUZXh0KTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibnVtYmVyXCI+7Iir7J6QIChOdW1iZXIpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJkYXRlXCI+64Kg7KecIChEYXRlKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY2hlY2tib3hcIj7ssrTtgazrsJXsiqQgKENoZWNrYm94KTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwic2VsZWN0XCI+7ISg7YOdIChTZWxlY3QpPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJzdGF0dXNcIj7sg4Htg5wgKFN0YXR1cyk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInJlbGF0aW9uXCI+6rSA6rOE7ZiVIChSZWxhdGlvbik8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cInJvbGx1cFwiPuuhpOyXhSAoUm9sbHVwKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiZm9ybXVsYVwiPuyImOyLnSAoRm9ybXVsYSk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImN1cnJlbmN5X3VzZFwiPuyZuO2ZlCDtmZjsgrAgKFVTRCk8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImJ1dHRvblwiPuuyhO2KvCAoQnV0dG9uKTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9KSgpfVxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGJsayA9IHByb21wdChgJyR7Y29sdW1ucy5maW5kKGMgPT4gYy5pZCA9PT0gY29udGV4dE1lbnVDb2xJZCk/LmxhYmVsfScg7Je07JeQIOydvOq0hCDsnoXroKXtlaAg6rCS7J2EIOyeheugpe2VmOyEuOyalDpcXG7snbQg7J6R7JeF7J2AIOuqqOuToCDtlonsl5Ag7KCB7Jqp65Cp64uI64ukLmApO1xuICAgICAgICAgICAgICBpZiAoYmxrICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdXBkYXRlZFJlcXMgPSByZXF1aXJlbWVudHMubWFwKHJlcSA9PiB7XG4gICAgICAgICAgICAgICAgICAgaWYgKFsnaWQnLCAndGl0bGUnLCAncHJpb3JpdHknLCAnc3RhdHVzJywgJ2R1ZURhdGUnXS5pbmNsdWRlcyhjb250ZXh0TWVudUNvbElkKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLnJlcSwgW2NvbnRleHRNZW51Q29sSWRdOiBibGsgfTtcbiAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHRNZW51Q29sSWQgPT09ICdhc3NpZ25lZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcTsgLy8gVW5zdXBwb3J0ZWQgZm9yIG5vd1xuICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgLi4ucmVxLCBjdXN0b21Db2x1bW5zOiB7IC4uLnJlcS5jdXN0b21Db2x1bW5zLCBbY29udGV4dE1lbnVDb2xJZF06IGJsayB9IH07XG4gICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsU2V0UmVxdWlyZW1lbnRzKHVwZGF0ZWRSZXFzKTtcbiAgICAgICAgICAgICAgICBzYXZlU3RhdGUodXBkYXRlZFJlcXMpO1xuICAgICAgICAgICAgICAgIHNldENvbnRleHRNZW51Q29sSWQobnVsbCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPEVkaXQyIGNsYXNzTmFtZT1cInctMy41IGgtMy41IHRleHQtYnJhbmQtb3V0bGluZS12YXJpYW50XCIgLz5cbiAgICAgICAgICAgIOydvOq0hCDrjbDsnbTthLAg7J6F66ClXG4gICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIHRleHQtbGVmdCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGN1cnNvci1wb2ludGVyIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgc2V0Q29sdW1ucyhwcmV2ID0+IHByZXYubWFwKGMgPT4gXG4gICAgICAgICAgICAgICAgIGMuaWQgPT09IGNvbnRleHRNZW51Q29sSWQgXG4gICAgICAgICAgICAgICAgICAgPyB7IC4uLmMsIGFsaWdubWVudDogYy5hbGlnbm1lbnQgPT09ICdjZW50ZXInID8gJ2xlZnQnIDogJ2NlbnRlcicgfSBcbiAgICAgICAgICAgICAgICAgICA6IGNcbiAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICAgIHNldENvbnRleHRNZW51Q29sSWQobnVsbCk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxBbGlnbkp1c3RpZnkgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIiAvPlxuICAgICAgICAgICAge2NvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IGNvbnRleHRNZW51Q29sSWQpPy5hbGlnbm1lbnQgPT09ICdjZW50ZXInID8gXCLquLDrs7gg7KCV66CsICjsoozsuKEpXCIgOiBcIuqwgOyatOuNsCDsoJXroKxcIn1cbiAgICAgICAgICA8L2J1dHRvbj5cblxuICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgIGNsYXNzTmFtZT1cInctZnVsbCBweC00IHB5LTIgdGV4dC1sZWZ0IGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBzZXRNaW5pbWl6ZWRDb2x1bW5zKHAgPT4gKHsgLi4ucCwgW2NvbnRleHRNZW51Q29sSWRdOiAhcFtjb250ZXh0TWVudUNvbElkXSB9KSk7XG4gICAgICAgICAgICAgIHNldENvbnRleHRNZW51Q29sSWQobnVsbCk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxBcnJvd1VwRG93biBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudCByb3RhdGUtOTBcIiAvPlxuICAgICAgICAgICAge21pbmltaXplZENvbHVtbnNbY29udGV4dE1lbnVDb2xJZF0gPyBcIuyXtCDtjrzsuZjquLBcIiA6IFwi7Je0IOyIqOq4sOq4sFwifVxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChmcm96ZW5Db2x1bW5JZCA9PT0gY29udGV4dE1lbnVDb2xJZCkge1xuICAgICAgICAgICAgICAgIHNldEZyb3plbkNvbHVtbklkKG51bGwpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNldEZyb3plbkNvbHVtbklkKGNvbnRleHRNZW51Q29sSWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNldENvbnRleHRNZW51Q29sSWQobnVsbCk7XG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxNYXhpbWl6ZTIgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIiAvPlxuICAgICAgICAgICAge2Zyb3plbkNvbHVtbklkID09PSBjb250ZXh0TWVudUNvbElkID8gXCLqs6DsoJUg7ZW07KCcXCIgOiBcIuyXrOq4sOq5jOyngCDti4Ag6rOg7KCVXCJ9XG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGhhbmRsZVNvcnQoY29udGV4dE1lbnVDb2xJZCBhcyBhbnkpO1xuICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudUNvbElkKG51bGwpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8QXJyb3dVcERvd24gY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIiAvPlxuICAgICAgICAgICAg7KCV66CsXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNob3dGaWx0ZXJDb2x1bW5JZChjb250ZXh0TWVudUNvbElkKTtcbiAgICAgICAgICAgICAgc2V0RmlsdGVyUG9wdXBDb29yZHMoeyB0b3A6IGNvbnRleHRNZW51UG9zLnkgKyAxMCwgbGVmdDogY29udGV4dE1lbnVQb3MueCArIDEwIH0pO1xuICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudUNvbElkKG51bGwpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8RmlsdGVyIGNsYXNzTmFtZT1cInctMy41IGgtMy41IHRleHQtYnJhbmQtb3V0bGluZS12YXJpYW50XCIgLz5cbiAgICAgICAgICAgIO2VhO2EsFxuICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAge3NlbGVjdGVkQ29sdW1uSWRzLmxlbmd0aCA+IDEgJiYgc2VsZWN0ZWRDb2x1bW5JZHMuaW5jbHVkZXMoY29udGV4dE1lbnVDb2xJZCkgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIHRleHQtbGVmdCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGN1cnNvci1wb2ludGVyIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdycCA9IHByb21wdChcIuuzke2Vqe2VoCDsg4HsnIQg7Lus65+866qFKExWLjEp7J2EIOyeheugpe2VmOyEuOyalDpcIik7XG4gICAgICAgICAgICAgICAgaWYgKGdycCAhPT0gbnVsbCAmJiBncnAudHJpbSgpICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICBzZXRDb2x1bW5zKHByZXYgPT4gcHJldi5tYXAoYyA9PiBzZWxlY3RlZENvbHVtbklkcy5pbmNsdWRlcyhjLmlkKSA/IHsgLi4uYywgZ3JvdXBOYW1lOiBncnAudHJpbSgpIH0gOiBjKSk7XG4gICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZENvbHVtbklkcyhbXSk7XG4gICAgICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudUNvbElkKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPEdyaWQgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1wcmltYXJ5XCIgLz5cbiAgICAgICAgICAgICAg7IOB7JyEIOy7rOufvOycvOuhnCDrs5HtlakgKExWLjEpXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAge2NvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IGNvbnRleHRNZW51Q29sSWQpPy5ncm91cE5hbWUgJiYgKFxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIHRleHQtbGVmdCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGN1cnNvci1wb2ludGVyIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldENvbHVtbnMocHJldiA9PiBwcmV2Lm1hcChjID0+IGMuaWQgPT09IGNvbnRleHRNZW51Q29sSWQgPyB7IC4uLmMsIGdyb3VwTmFtZTogdW5kZWZpbmVkIH0gOiBjKSk7XG4gICAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnVDb2xJZChudWxsKTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPEdyaWQgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnRcIiAvPlxuICAgICAgICAgICAgICDrs5Htlakg7ZW07KCcXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIHNldFNob3dEZXNjcmlwdGlvbkVkaXRDb2xJZChjb250ZXh0TWVudUNvbElkKTtcbiAgICAgICAgICAgICAgc2V0RGVzY3JpcHRpb25JbnB1dChjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBjb250ZXh0TWVudUNvbElkKT8uZGVzY3JpcHRpb24gfHwgJycpO1xuICAgICAgICAgICAgICBzZXRDb250ZXh0TWVudUNvbElkKG51bGwpO1xuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8SGVscENpcmNsZSBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNSB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudFwiIC8+XG4gICAgICAgICAgICDsl7Qg7ISk66qFKOuplOuqqCkg7IiY7KCVXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgXG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTQgcHktMiB0ZXh0LWxlZnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9ycyB0ZXh0LWJyYW5kLXByaW1hcnlcIlxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjb2wgPSBjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBjb250ZXh0TWVudUNvbElkKTtcbiAgICAgICAgICAgICAgaWYgKGNvbCkge1xuICAgICAgICAgICAgICAgIHNldEVkaXRpbmdDb2x1bW5EZWZJZChjb2wuaWQpO1xuICAgICAgICAgICAgICAgIHNldE5ld0NvbHVtbk5hbWUoY29sLmxhYmVsKTtcbiAgICAgICAgICAgICAgICBzZXROZXdDb2x1bW5UeXBlKGNvbC50eXBlIHx8ICd0ZXh0Jyk7XG4gICAgICAgICAgICAgICAgc2V0TmV3Q29sdW1uT3B0aW9uc0lucHV0KGNvbC5vcHRpb25zPy5qb2luKCcsICcpIHx8ICcnKTtcbiAgICAgICAgICAgICAgICBzZXRGb3JtdWxhSW5wdXQoY29sLmZvcm11bGEgfHwgJycpO1xuICAgICAgICAgICAgICAgIHNldEJ1dHRvbkxhYmVsSW5wdXQoY29sLmJ1dHRvbkxhYmVsIHx8ICcnKTtcbiAgICAgICAgICAgICAgICBzZXRCdXR0b25BY3Rpb25JbnB1dChjb2wuYnV0dG9uQWN0aW9uIHx8ICdzdGFydF93b3JrJyk7XG4gICAgICAgICAgICAgICAgc2V0Q3VycmVuY3lBbW91bnRDb2xJZElucHV0KGNvbC5jdXJyZW5jeUFtb3VudENvbElkIHx8ICcnKTtcbiAgICAgICAgICAgICAgICBzZXRDdXJyZW5jeUNvZGVDb2xJZElucHV0KGNvbC5jdXJyZW5jeUNvZGVDb2xJZCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgc2V0Q3VycmVuY3lEZWNpbWFsUGxhY2VzSW5wdXQoY29sLmN1cnJlbmN5RGVjaW1hbFBsYWNlcyB8fCAwKTtcbiAgICAgICAgICAgICAgICBzZXRSb2xsdXBSZWxJZElucHV0KGNvbC5yb2xsdXBSZWxJZCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgc2V0Um9sbHVwQWdnVHlwZUlucHV0KGNvbC5yb2xsdXBBZ2dUeXBlIHx8ICdjb3VudCcpO1xuICAgICAgICAgICAgICAgIHNldFN0YXR1c09wdGlvbnNJbnB1dChjb2wudHlwZSA9PT0gJ3N0YXR1cycgPyAoY29sLm9wdGlvbnM/LmpvaW4oJywgJykgfHwgJycpIDogJ+yVhOydtOuUlOyWtCzquLDtmo0s65SU7J6Q7J24LOqwnOuwnCxRQSzrsLDtj6wnKTtcbiAgICAgICAgICAgICAgICBzZXRMb29rdXBUYWJJZElucHV0KGNvbC5sb29rdXBUYWJJZCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgc2V0TG9va3VwTWF0Y2hNeUNvbElkSW5wdXQoY29sLmxvb2t1cE1hdGNoTXlDb2xJZCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgc2V0TG9va3VwTWF0Y2hUYXJnZXRDb2xJZElucHV0KGNvbC5sb29rdXBNYXRjaFRhcmdldENvbElkIHx8ICcnKTtcbiAgICAgICAgICAgICAgICBzZXRMb29rdXBSZXR1cm5UYXJnZXRDb2xJZElucHV0KGNvbC5sb29rdXBSZXR1cm5UYXJnZXRDb2xJZCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgc2V0RGVjaW1hbFBsYWNlc0lucHV0KGNvbC5kZWNpbWFsUGxhY2VzICE9PSB1bmRlZmluZWQgPyBTdHJpbmcoY29sLmRlY2ltYWxQbGFjZXMpIDogJycpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHNldFNob3dBZGRDb2x1bW5Nb2RhbCh0cnVlKTtcbiAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnVDb2xJZChudWxsKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPExheWVycyBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNVwiIC8+XG4gICAgICAgICAgICDsl7Qg7IaN7ISxIOuzgOqyvVxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaC1weCBiZy1icmFuZC1vdXRsaW5lLXZhcmlhbnQgbXktMSBteC0yXCIgLz5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgcHgtNCBweS0yIHRleHQtbGVmdCBob3ZlcjpiZy1icmFuZC1lcnJvci1jb250YWluZXIgdGV4dC1icmFuZC1lcnJvciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGhhbmRsZURlbGV0ZUN1c3RvbUNvbHVtbihjb250ZXh0TWVudUNvbElkKTtcbiAgICAgICAgICAgICAgc2V0Q29udGV4dE1lbnVDb2xJZChudWxsKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPFggY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAg7Je0IOyCreygnFxuICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8L2Rpdj4sXG4gICAgICAgIGRvY3VtZW50LmJvZHlcbiAgICAgICl9XG5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuXG5jb25zdCBmb3JtdWxhQ2FjaGUgPSBuZXcgTWFwKCk7XG5cbmNvbnN0IFNVTSA9ICguLi5hcmdzOiBhbnlbXSkgPT4gYXJncy5yZWR1Y2UoKGEsIGIpID0+IGEgKyAoTnVtYmVyKGIpIHx8IDApLCAwKTtcbmNvbnN0IEFWRVJBR0UgPSAoLi4uYXJnczogYW55W10pID0+IGFyZ3MubGVuZ3RoID8gU1VNKC4uLmFyZ3MpIC8gYXJncy5sZW5ndGggOiAwO1xuY29uc3QgSUYgPSAoY29uZGl0aW9uOiBib29sZWFuLCB0cnVlVmFsOiBhbnksIGZhbHNlVmFsOiBhbnkpID0+IGNvbmRpdGlvbiA/IHRydWVWYWwgOiBmYWxzZVZhbDtcbmNvbnN0IERBWVMgPSAoZDE6IGFueSwgZDI6IGFueSkgPT4ge1xuICBpZiAoIWQxIHx8ICFkMikgcmV0dXJuICcnO1xuICBjb25zdCBkYXRlMSA9IG5ldyBEYXRlKGQxKTtcbiAgY29uc3QgZGF0ZTIgPSBuZXcgRGF0ZShkMik7XG4gIGlmIChpc05hTihkYXRlMS5nZXRUaW1lKCkpIHx8IGlzTmFOKGRhdGUyLmdldFRpbWUoKSkpIHJldHVybiAnJztcbiAgcmV0dXJuIE1hdGgucm91bmQoKGRhdGUxLmdldFRpbWUoKSAtIGRhdGUyLmdldFRpbWUoKSkgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpO1xufTtcbmNvbnN0IE1PTlRIUyA9IChkMTogYW55LCBkMjogYW55KSA9PiB7XG4gIGlmICghZDEgfHwgIWQyKSByZXR1cm4gJyc7XG4gIGNvbnN0IGRhdGUxID0gbmV3IERhdGUoZDEpO1xuICBjb25zdCBkYXRlMiA9IG5ldyBEYXRlKGQyKTtcbiAgaWYgKGlzTmFOKGRhdGUxLmdldFRpbWUoKSkgfHwgaXNOYU4oZGF0ZTIuZ2V0VGltZSgpKSkgcmV0dXJuICcnO1xuICBjb25zdCBkaWZmTW9udGhzID0gKGRhdGUxLmdldEZ1bGxZZWFyKCkgLSBkYXRlMi5nZXRGdWxsWWVhcigpKSAqIDEyICsgKGRhdGUxLmdldE1vbnRoKCkgLSBkYXRlMi5nZXRNb250aCgpKTtcbiAgcmV0dXJuIGRpZmZNb250aHM7XG59O1xuXG5jb25zdCBnZXRGb3JtdWxhRm4gPSAoZjogc3RyaW5nLCBjb2x1bW5zOiBhbnlbXSkgPT4ge1xuICBjb25zdCBjYWNoZUtleSA9IGYgKyAnfCcgKyBjb2x1bW5zLm1hcChjID0+IGMuaWQpLmpvaW4oJywnKTtcbiAgaWYgKCFmb3JtdWxhQ2FjaGUuaGFzKGNhY2hlS2V5KSkge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcGFyc2VkID0gZjtcbiAgICAgIGNvbHVtbnMuZm9yRWFjaChjID0+IHtcbiAgICAgICAgIGNvbnN0IHNhZmVMYWJlbCA9IGMubGFiZWwucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcbiAgICAgICAgIGNvbnN0IHJlID0gbmV3IFJlZ0V4cChgXFxcXFske3NhZmVMYWJlbH1cXFxcXWAsICdnJyk7XG4gICAgICAgICAvLyBVc2UgTnVtYmVyKCkgZm9yIGN1c3RvbSBjb2x1bW5zIGJ5IGRlZmF1bHQgdG8gbWFrZSBtYXRoIGVhc2llciwgZmFsbGJhY2sgdG8gc3RyaW5nIGlmIE5hTiBtYXliZT9cbiAgICAgICAgIC8vIEFjdHVhbGx5LCBpZiB3ZSBqdXN0IGluamVjdCB0aGUgcmF3IHZhbHVlLCBKUyB3aWxsIGRvIHR5cGUgY29lcmNpb24gaWYgdGhleSB1c2UgKiwgLywgLS5cbiAgICAgICAgIC8vIEZvciArIHdlIG1pZ2h0IG5lZWQgTnVtYmVyKCkgdG8gYXZvaWQgc3RyaW5nIGNvbmNhdGVuYXRpb24uIExldCdzIHdyYXAgaW4gTnVtYmVyKCkgaWYgaXQgbG9va3MgbGlrZSBhIG1hdGggb3BlcmF0aW9uLCBvciBqdXN0IGxldCB1c2VycyB1c2UgTnVtYmVyKCkuXG4gICAgICAgICAvLyBBY3R1YWxseSwgaWYgd2UgZG8gKE51bWJlcihyZXEuY3VzdG9tQ29sdW1ucz8uWycke2MuaWR9J10pIHx8IDApLCBpdCdzIHZlcnkgc2FmZSBmb3IgbWF0aCFcbiAgICAgICAgIGlmIChbJ3RpdGxlJywgJ2R1ZURhdGUnLCAnY3JlYXRlZEF0JywgJ3N0YXR1cycsICdwcmlvcml0eSddLmluY2x1ZGVzKGMuaWQpKSB7XG4gICAgICAgICAgICBwYXJzZWQgPSBwYXJzZWQucmVwbGFjZShyZSwgYChyZXEuJHtjLmlkfSB8fCAnJylgKTtcbiAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzZWQgPSBwYXJzZWQucmVwbGFjZShyZSwgYChpc05hTihOdW1iZXIocmVxLmN1c3RvbUNvbHVtbnM/LlsnJHtjLmlkfSddKSkgPyAocmVxLmN1c3RvbUNvbHVtbnM/LlsnJHtjLmlkfSddIHx8ICcnKSA6IE51bWJlcihyZXEuY3VzdG9tQ29sdW1ucz8uWycke2MuaWR9J10pKWApO1xuICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmb3JtdWxhQ2FjaGUuc2V0KGNhY2hlS2V5LCBuZXcgRnVuY3Rpb24oJ3JlcScsICd0b2RheScsICdTVU0nLCAnQVZFUkFHRScsICdJRicsICdEQVlTJywgJ01PTlRIUycsICdLUlcnLCAnVVNEJywgJ0VVUicsIGB0cnkgeyByZXR1cm4gJHtwYXJzZWQgfHwgJ1wiXCInfTsgfSBjYXRjaChlKSB7IHJldHVybiBcIkVycm9yXCI7IH1gKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBmb3JtdWxhQ2FjaGUuc2V0KGNhY2hlS2V5LCAoKSA9PiAnRXJyb3InKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvcm11bGFDYWNoZS5nZXQoY2FjaGVLZXkpO1xufTtcblxuY29uc3QgU3ByZWFkc2hlZXRSb3cgPSBSZWFjdC5tZW1vKGZ1bmN0aW9uIFNwcmVhZHNoZWV0Um93KHtcbiAgcmVxLFxuICBpc1NlbGVjdGVkLFxuICBkcmFnT3ZlclJvd0lkLFxuICBjb2x1bW5zLFxuICBtaW5pbWl6ZWRDb2x1bW5zLFxuICBjb2x1bW5XaWR0aHMsXG4gIGlzQWN0aXZlLFxuICBhY3RpdmVGaWVsZCxcbiAgaXNMb2NrZWRCeU90aGVyLFxuICBsb2NrZWRCeU5hbWUsXG4gIGlzUHJpb3JpdHlPcGVuLFxuICBpc0Fzc2lnbmVlT3BlbixcbiAgaXNTdGF0dXNPcGVuLFxuICBjdXJyZW50VXNlcixcbiAgYXNzaWduZWVzUG9vbCxcbiAgcmVxQnlJZCxcbiAgZXhjaGFuZ2VSYXRlcyxcbiAgYWN0aXZlQ2VsbEVkaXRvcixcbiAgdGFiRGF0YU1hcCxcbiAgXG4gIGhhbmRsZVJvd0RyYWdPdmVyLFxuICBoYW5kbGVSb3dEcm9wLFxuICBoYW5kbGVEdXBsaWNhdGVSb3csXG4gIGhhbmRsZVJvd0RyYWdTdGFydCxcbiAgaGFuZGxlU2VsZWN0Um93LFxuICBzZXRNaW5pbWl6ZWRDb2x1bW5zLFxuICBzZXRBY3RpdmVDZWxsRWRpdG9yLFxuICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkLFxuICBoYW5kbGVHcmlkUGFzdGUsXG4gIHNldFNob3dQcmlvcml0eURyb3Bkb3duSWQsXG4gIHByaW9yaXR5UmVmLFxuICBzZXRTaG93QXNzaWduZWVEcm9wZG93bklkLFxuICBvcmlnaW5hbFNldFJlcXVpcmVtZW50cyxcbiAgYXNzaWduZWVSZWYsXG4gIHNldFNob3dTdGF0dXNEcm9wZG93bklkLFxuICBzdGF0dXNSZWYsXG4gIHNldFJlcXVpcmVtZW50cyxcbiAgc2V0Q29sdW1ucyxcbiAgc2V0U2VsZWN0ZWRJZHMsXG4gIGdldENlbGxTdGlja3lTdHlsZVxufTogYW55KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXNEb25lID0gcmVxLnN0YXR1cyA9PT0gJ0RPTkUnO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGxldCByb3dUZXh0Q29sb3JDbGFzcyA9ICd0ZXh0LWJyYW5kLW9uLXN1cmZhY2UnO1xuICAgICAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAnRE9ORScpIHJvd1RleHRDb2xvckNsYXNzID0gJ3RleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50LzUwJztcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChyZXEuc3RhdHVzID09PSAnSU5fUFJPR1JFU1MnKSByb3dUZXh0Q29sb3JDbGFzcyA9ICd0ZXh0LWdyZWVuLTcwMCBmb250LW1lZGl1bSc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgPHRyIFxuICAgICAgICAgICAgICAgICAgICBrZXk9e3JlcS5pZH0gXG4gICAgICAgICAgICAgICAgICAgIGlkPXtgcmVxLXJvdy0ke3JlcS5pZH1gfVxuICAgICAgICAgICAgICAgICAgICBvbkRyYWdPdmVyPXsoZSkgPT4gaGFuZGxlUm93RHJhZ092ZXIoZSwgcmVxLmlkKX1cbiAgICAgICAgICAgICAgICAgICAgb25Ecm9wPXsoZSkgPT4gaGFuZGxlUm93RHJvcChlLCByZXEuaWQpfVxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BzcHJlYWRzaGVldC1yb3cgaG92ZXI6YmctYnJhbmQtc3VyZmFjZS1sb3cgYm9yZGVyLWIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0cmFuc2l0aW9uLWNvbG9ycyBkdXJhdGlvbi0xNTAgZ3JvdXAgJHtyb3dUZXh0Q29sb3JDbGFzc30gJHtcbiAgICAgICAgICAgICAgICAgICAgICBpc1NlbGVjdGVkID8gJ2JnLWJyYW5kLXByaW1hcnktY29udGFpbmVyLzEwJyA6ICcnXG4gICAgICAgICAgICAgICAgICAgIH0gJHtkcmFnT3ZlclJvd0lkID09PSByZXEuaWQgPyAnYm9yZGVyLXQtMiBib3JkZXItdC1icmFuZC1wcmltYXJ5IGJnLWJyYW5kLXN1cmZhY2UtaGlnaC8zMCcgOiAnJ31gfVxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgey8qIEdyaXAvQ29weSBBY3Rpb25zIChPbiBIb3ZlcikgKi99XG4gICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT17Z2V0Q2VsbFN0aWNreVN0eWxlKCdpbmRleCcpfSBjbGFzc05hbWU9e2BwLTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LWNlbnRlciB3LTEwIHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50LzQwYH0+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGZsZXgtd3JhcCBqdXN0aWZ5LWNlbnRlciBpdGVtcy1jZW50ZXIgZ2FwLTEgb3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHRyYW5zaXRpb24tb3BhY2l0eVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHsgZS5zdG9wUHJvcGFnYXRpb24oKTsgaGFuZGxlRHVwbGljYXRlUm93KHJlcS5pZCwgcmVxLmlkKTsgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaG92ZXI6dGV4dC1icmFuZC1wcmltYXJ5IGN1cnNvci1wb2ludGVyIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLthZztlIzrpr8g67O17KCcXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPENvcHkgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRyYWdnYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRyYWdTdGFydD17KGUpID0+IGhhbmRsZVJvd0RyYWdTdGFydChlLCByZXEuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJjdXJzb3ItZ3JhYiBhY3RpdmU6Y3Vyc29yLWdyYWJiaW5nIGhvdmVyOnRleHQtYnJhbmQtcHJpbWFyeSB0cmFuc2l0aW9uLWNvbG9ycyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBwLTAuNVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi65Oc656Y6re47ZWY7JesIO2WiSDsnbTrj5kgKEFsdCDtgqTrpbwg64iE66W06rOgIOuTnOuemOq3uCDsi5wg67O17KCcKVwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxHcmlwVmVydGljYWwgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICB7LyogQ2hlY2tib3ggY2VsbCAqL31cbiAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPXtnZXRDZWxsU3RpY2t5U3R5bGUoJ2NoZWNrYm94Jyl9IGNsYXNzTmFtZT17YHAtMyBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtY2VudGVyIHNlbGVjdC1ub25lIGFsaWduLW1pZGRsZWB9PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTQgaC00IG14LWF1dG8gaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQgYm9yZGVyIGJvcmRlci1ncmF5LTUwMCBiZy10cmFuc3BhcmVudCBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVTZWxlY3RSb3cocmVxLmlkLCAhaXNTZWxlY3RlZCl9XG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAge2lzU2VsZWN0ZWQgJiYgPENoZWNrIGNsYXNzTmFtZT1cInctMyBoLTMgdGV4dC1icmFuZC1vbi1zdXJmYWNlXCIgc3Ryb2tlV2lkdGg9ezR9IC8+fVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBSZW5kZXIgQ29sdW1ucyBjZWxsIGJhc2VkIG9uIGNvbC5pZCAqL31cbiAgICAgICAgICAgICAgICAgICAge2NvbHVtbnMubWFwKGNvbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNNaW5pbWl6ZWQgPSBtaW5pbWl6ZWRDb2x1bW5zW2NvbC5pZF07XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBpc01pbmltaXplZCA/IDI0IDogKGNvbHVtbldpZHRoc1tjb2wuaWRdIHx8IDE1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZVN0aWNreVN0eWxlID0gZ2V0Q2VsbFN0aWNreVN0eWxlKGNvbC5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dEFsaWduU3R5bGUgPSBjb2wuYWxpZ25tZW50ID8geyB0ZXh0QWxpZ246IGNvbC5hbGlnbm1lbnQgfSA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbGxTdHlsZTogUmVhY3QuQ1NTUHJvcGVydGllcyA9IHsgd2lkdGgsIG1pbldpZHRoOiB3aWR0aCwgbWF4V2lkdGg6IHdpZHRoLCAuLi5iYXNlU3RpY2t5U3R5bGUsIC4uLnRleHRBbGlnblN0eWxlIH07XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2hhZG93Q2xhc3MgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNNaW5pbWl6ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2NlbGxTdHlsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0wIHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbGlnbi1taWRkbGUgdGV4dC1jZW50ZXIgaG92ZXI6YmctYnJhbmQtc3VyZmFjZS1oaWdoLzIwIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyICR7c2hhZG93Q2xhc3N9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRNaW5pbWl6ZWRDb2x1bW5zKHAgPT4gKHsgLi4ucCwgW2NvbC5pZF06IGZhbHNlIH0pKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT1cIuyXtCDtjrzsuZjquLAgKO2BtOumrSlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnQgc2VsZWN0LW5vbmUgdHJhY2tpbmctd2lkZXN0IHRleHQtWzEwcHhdIGZvbnQtYm9sZCBteC1hdXRvIGZsZXgganVzdGlmeS1jZW50ZXIgdy1mdWxsXCI+Li4uPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAvLyAxLiBJRCBDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLmlkID09PSAnaWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSBpc0FjdGl2ZSAmJiBhY3RpdmVGaWVsZCA9PT0gJ2lkJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNMb2NrZWRCeU90aGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoYO2YhOyerCAke2xvY2tlZEJ5TmFtZX0g64uY7J20IO2OuOynkSDspJHsnbTrr4DroZwg7KCR6re87ZWgIOyImCDsl4bsirXri4jri6QuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKHsgcm93SWQ6IHJlcS5pZCwgZmllbGQ6ICdpZCcgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBmb250LW1vbm8gdGV4dC1bMTNweF0gdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgZm9udC1tZWRpdW0gJHtpc0xvY2tlZEJ5T3RoZXIgPyAnY3Vyc29yLW5vdC1hbGxvd2VkIGJnLWJyYW5kLXN1cmZhY2UtaGlnaC8zMCcgOiAnY3Vyc29yLXRleHQgaG92ZXI6YmctYnJhbmQtcHJpbWFyeS81J30gdHJhbnNpdGlvbi1jb2xvcnMgd2hpdGVzcGFjZS1ub3JtYWwgYnJlYWstd29yZHMgYWxpZ24tdG9wIHJlbGF0aXZlICR7c2hhZG93Q2xhc3N9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17aXNMb2NrZWRCeU90aGVyID8gYCR7bG9ja2VkQnlOYW1lfSDri5jsnbQg7Y647KeRIOykkWAgOiB1bmRlZmluZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNMb2NrZWRCeU90aGVyICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTEgcmlnaHQtMSBvcGFjaXR5LTcwXCIgdGl0bGU9e2Ake2xvY2tlZEJ5TmFtZX0g64uY7J20IO2OuOynkSDspJFgfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPExvY2sgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgdGV4dC1icmFuZC1lcnJvclwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmcgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17cmVxLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAnaWQnLCBlLnRhcmdldC52YWx1ZS50cmltKCkgfHwgcmVxLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgJ2lkJywgZS5jdXJyZW50VGFyZ2V0LnZhbHVlLnRyaW0oKSB8fCByZXEuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgLWluc2V0LVsxcHhdIHotMjAgdy1bY2FsYygxMDAlKzJweCldIGgtW2NhbGMoMTAwJSsycHgpXSBiZy1icmFuZC1zdXJmYWNlLWxvd2VzdCBib3JkZXItMiBib3JkZXItYnJhbmQtcHJpbWFyeSB0ZXh0LVsxM3B4XSBweC1bMTVweF0gcHktWzdweF0gdGV4dC1icmFuZC1vbi1zdXJmYWNlIGZvY3VzOm91dGxpbmUtbm9uZSBzaGFkb3ctbWQgdXBwZXJjYXNlIGZvbnQtbW9ubyBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2lzRWRpdGluZyA/ICdvcGFjaXR5LTAnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlcS5pZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gMi4gVGl0bGUgQ29sdW1uICh3aXRoIGlubGluZSBlZGl0YWJsZSBFeGNlbCBzdHlsZSlcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLmlkID09PSAndGl0bGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSBpc0FjdGl2ZSAmJiBhY3RpdmVGaWVsZCA9PT0gJ3RpdGxlJztcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNMb2NrZWRCeU90aGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoYO2YhOyerCAke2xvY2tlZEJ5TmFtZX0g64uY7J20IO2OuOynkSDspJHsnbTrr4DroZwg7KCR6re87ZWgIOyImCDsl4bsirXri4jri6QuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKHsgcm93SWQ6IHJlcS5pZCwgZmllbGQ6ICd0aXRsZScgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBkdXJhdGlvbi0zMDAgJHtpc0xvY2tlZEJ5T3RoZXIgPyAnY3Vyc29yLW5vdC1hbGxvd2VkIGJnLWJyYW5kLXN1cmZhY2UtaGlnaC8zMCcgOiAnY3Vyc29yLXRleHQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZS1oaWdoLzIwJ30gdHJhbnNpdGlvbi1jb2xvcnMgd2hpdGVzcGFjZS1wcmUtd3JhcCBicmVhay13b3JkcyBhbGlnbi10b3AgcmVsYXRpdmUgJHtzaGFkb3dDbGFzc31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtpc0xvY2tlZEJ5T3RoZXIgPyBgJHtsb2NrZWRCeU5hbWV9IOuLmOydtCDtjrjsp5Eg7KSRYCA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc0xvY2tlZEJ5T3RoZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB0b3AtMSByaWdodC0xIG9wYWNpdHktNzBcIiB0aXRsZT17YCR7bG9ja2VkQnlOYW1lfSDri5jsnbQg7Y647KeRIOykkWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TG9jayBjbGFzc05hbWU9XCJ3LTMuNSBoLTMuNSB0ZXh0LWJyYW5kLWVycm9yXCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWEgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17cmVxLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25QYXN0ZT17KGUpID0+IGhhbmRsZUdyaWRQYXN0ZShlLCByZXEuaWQsIGNvbC5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgJ3RpdGxlJywgZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZUNlbGxFZGl0b3IobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAndGl0bGUnLCBlLmN1cnJlbnRUYXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgLWluc2V0LVsxcHhdIHotMjAgdy1bY2FsYygxMDAlKzJweCldIGgtW2NhbGMoMTAwJSsycHgpXSBiZy1icmFuZC1zdXJmYWNlLWxvd2VzdCBib3JkZXItMiBib3JkZXItYnJhbmQtcHJpbWFyeSB0ZXh0LXNtIHB4LVsxNXB4XSBweS1bN3B4XSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgZm9jdXM6b3V0bGluZS1ub25lIHNoYWRvdy1tZCByZXNpemUtbm9uZSBmb250LW1lZGl1bVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2Bmb250LW1lZGl1bSBoLWZ1bGwgdy1mdWxsICR7aXNFZGl0aW5nID8gJ29wYWNpdHktMCcgOiAnJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXEudGl0bGUgfHwgPHNwYW4gY2xhc3NOYW1lPVwib3BhY2l0eS0wXCI+LTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIC8vIDMuIFByaW9yaXR5IENvbHVtblxuICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wuaWQgPT09ICdwcmlvcml0eScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhZGdlQ29sb3JzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBISUdIOiAnYmctYnJhbmQtZXJyb3ItY29udGFpbmVyIHRleHQtYnJhbmQtb24tZXJyb3ItY29udGFpbmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgTUVESVVNOiAnYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgTE9XOiAnYmctYnJhbmQtc3VyZmFjZS1oaWdoIHRleHQtYnJhbmQtb3V0bGluZS84MCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsYWJlbHMgPSB7IEhJR0g6ICfrhpLsnYwnLCBNRURJVU06ICfspJHqsIQnLCBMT1c6ICfrgq7snYwnIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e2NvbC5pZH0gc3R5bGU9e2NlbGxTdHlsZX0gY2xhc3NOYW1lPXtgcHgtNCBweS0yIGJvcmRlci1yIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcmVsYXRpdmUgYWxpZ24tdG9wICR7c2hhZG93Q2xhc3N9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNob3dQcmlvcml0eURyb3Bkb3duSWQoaXNQcmlvcml0eU9wZW4gPyBudWxsIDogcmVxLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtWzExcHhdIHB4LTIgcHktMC41IHJvdW5kZWQgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi10cmFuc2Zvcm0gaG92ZXI6c2NhbGUtMTA1IGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMiBweS0wLjUgcm91bmRlZCAke2JhZGdlQ29sb3JzW3JlcS5wcmlvcml0eV0gfHwgYmFkZ2VDb2xvcnMuTUVESVVNfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bGFiZWxzW3JlcS5wcmlvcml0eV0gfHwgJ+ykkeqwhCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LWJyYW5kLW91dGxpbmUtdmFyaWFudFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogRHJvcGRvd24gTWVudSAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNQcmlvcml0eU9wZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmPXtwcmlvcml0eVJlZn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC00IG10LTEgdy0yNCBiZy1icmFuZC1zdXJmYWNlLWhpZ2ggYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1sZyBzaGFkb3cteGwgcHktMSB6LTMwIGFuaW1hdGUtZmFkZS1zbGlkZS11cCB0ZXh0LXhzIGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyhbJ0hJR0gnLCAnTUVESVVNJywgJ0xPVyddIGFzIFByaW9yaXR5W10pLm1hcChwID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e3B9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAncHJpb3JpdHknLCBwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2hvd1ByaW9yaXR5RHJvcGRvd25JZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1sZWZ0IHB4LTMgcHktMS41IHRleHQtYnJhbmQtb24tc3VyZmFjZSBob3ZlcjpiZy1icmFuZC1zdXJmYWNlIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBjdXJzb3ItcG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2xhYmVsc1twXX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVxLnByaW9yaXR5ID09PSBwICYmIDxDaGVjayBjbGFzc05hbWU9XCJ3LTMgaC0zIHRleHQtYnJhbmQtcHJpbWFyeVwiIC8+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIC8vIDQuIEFzc2lnbmVlcyBTdGFjayBDb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLmlkID09PSAnYXNzaWduZWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17Y29sLmlkfSBzdHlsZT17Y2VsbFN0eWxlfSBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCByZWxhdGl2ZSBhbGlnbi10b3Agd2hpdGVzcGFjZS1ub3JtYWwgJHtzaGFkb3dDbGFzc31gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0Fzc2lnbmVlRHJvcGRvd25JZChpc0Fzc2lnbmVlT3BlbiA/IG51bGwgOiByZXEuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2gvMzAgcC0xLjUgcm91bmRlZCB0cmFuc2l0aW9uLWNvbG9ycyB3LWZ1bGwgbWluLWgtWzQwcHhdXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVxLmFzc2lnbmVlcy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1icmFuZC1vdXRsaW5lLXZhcmlhbnQgaXRhbGljXCI+64u064u57J6QIOyXhuydjDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxLmFzc2lnbmVlcy5tYXAoKGEsIGlkeCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2EuaWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcHgtMiBweS0xIGJnLWJyYW5kLXN1cmZhY2UtaGlnaGVzdCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC1mdWxsIHRleHQtWzExcHhdIGZvbnQtc2VtaWJvbGQgdHJhY2tpbmctd2lkZSB3LWZ1bGwgaC1hdXRvIHdoaXRlc3BhY2Utbm9ybWFsIGJyZWFrLXdvcmRzIHRleHQtY2VudGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXthLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2EubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogQXNzaWduZWUgRGlyZWN0b3J5IFBpY2tlciBEcm9wZG93biAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNBc3NpZ25lZU9wZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmPXthc3NpZ25lZVJlZn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgbGVmdC02IG10LTEgdy01MiBiZy1icmFuZC1zdXJmYWNlLWhpZ2ggYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgcm91bmRlZC14bCBzaGFkb3cteGwgcC0zIHotMzAgYW5pbWF0ZS1mYWRlLXNsaWRlLXVwIHRleHQteHMgZm9udC1zZW1pYm9sZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtYnJhbmQtb3V0bGluZSBtYi0yIHBiLTEgYm9yZGVyLWIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIOuLtOuLueyekCDrsLDsoJUgKHtyZXEuYXNzaWduZWVzLmxlbmd0aH3rqoUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNSBtYXgtaC00OCBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7YXNzaWduZWVzUG9vbC5tYXAobWVtYmVyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzQXNzaWduZWQgPSByZXEuYXNzaWduZWVzLnNvbWUoYSA9PiBhLmlkID09PSBtZW1iZXIuaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17bWVtYmVyLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBwLTEuNSBob3ZlcjpiZy1icmFuZC1zdXJmYWNlIHJvdW5kZWQgY3Vyc29yLXBvaW50ZXIgdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgaG92ZXI6dGV4dC1icmFuZC1vbi1zdXJmYWNlIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0zLjUgaC0zLjUgc2hyaW5rLTAgaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQgYm9yZGVyIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNBc3NpZ25lZCAmJiA8Q2hlY2sgY2xhc3NOYW1lPVwidy0yLjUgaC0yLjUgdGV4dC1icmFuZC1vbi1zdXJmYWNlXCIgc3Ryb2tlV2lkdGg9ezR9IC8+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogSGlkZGVuIHJlYWwgY2hlY2tib3ggZm9yIGFjY2Vzc2liaWxpdHkgLyBsYWJlbCBsaW5raW5nICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoaWRkZW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXtpc0Fzc2lnbmVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3QXNzaWduZWVzID0gWy4uLnJlcS5hc3NpZ25lZXMsIG1lbWJlcl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFNldFJlcXVpcmVtZW50cyhwcmV2ID0+IHByZXYubWFwKHIgPT4gci5pZCA9PT0gcmVxLmlkID8geyAuLi5yLCBhc3NpZ25lZXM6IG5ld0Fzc2lnbmVlcyB9IDogcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdBc3NpZ25lZXMgPSByZXEuYXNzaWduZWVzLmZpbHRlcihhID0+IGEuaWQgIT09IG1lbWJlci5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFNldFJlcXVpcmVtZW50cyhwcmV2ID0+IHByZXYubWFwKHIgPT4gci5pZCA9PT0gcmVxLmlkID8geyAuLi5yLCBhc3NpZ25lZXM6IG5ld0Fzc2lnbmVlcyB9IDogcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e21lbWJlci5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gNS4gRHVlIERhdGUgQ29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC5pZCA9PT0gJ2R1ZURhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0VkaXRpbmcgPSBpc0FjdGl2ZSAmJiBhY3RpdmVGaWVsZCA9PT0gJ2R1ZURhdGUnO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjb2wuaWR9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjZWxsU3R5bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlQ2VsbEVkaXRvcih7IHJvd0lkOiByZXEuaWQsIGZpZWxkOiAnZHVlRGF0ZScgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNCBweS0yIGJvcmRlci1yIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgdGV4dC1bMTNweF0gdGV4dC1icmFuZC1vbi1zdXJmYWNlLXZhcmlhbnQgaG92ZXI6YmctYnJhbmQtc3VyZmFjZS1oaWdoLzEwIGN1cnNvci1wb2ludGVyIGFsaWduLXRvcCByZWxhdGl2ZSAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImRhdGVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3JlcS5kdWVEYXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvRm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25QYXN0ZT17KGUpID0+IGhhbmRsZUdyaWRQYXN0ZShlLCByZXEuaWQsIGNvbC5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgJ2R1ZURhdGUnLCBlLnRhcmdldC52YWx1ZSB8fCByZXEuZHVlRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVxdWlyZW1lbnRGaWVsZChyZXEuaWQsICdkdWVEYXRlJywgZS5jdXJyZW50VGFyZ2V0LnZhbHVlIHx8IHJlcS5kdWVEYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZUNlbGxFZGl0b3IobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VzY2FwZScpIHNldEFjdGl2ZUNlbGxFZGl0b3IobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIC1pbnNldC1bMXB4XSB6LTIwIHctW2NhbGMoMTAwJSsycHgpXSBoLVtjYWxjKDEwMCUrMnB4KV0gYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgYm9yZGVyLTIgYm9yZGVyLWJyYW5kLXByaW1hcnkgdGV4dC1bMTNweF0gcHgtWzE1cHhdIHB5LVs3cHhdIHRleHQtYnJhbmQtb24tc3VyZmFjZSBmb2N1czpvdXRsaW5lLW5vbmUgc2hhZG93LW1kIGZvbnQtbW9ub1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2lzRWRpdGluZyA/ICdvcGFjaXR5LTAnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3JlcS5kdWVEYXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAvLyA2LiBTdGF0dXMgQmFkZ2UgQ29sdW1uXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC5pZCA9PT0gJ3N0YXR1cycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1c0NvbG9ycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgVE9ETzogJ2JvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtYnJhbmQtb24tc3VyZmFjZS12YXJpYW50IGJnLWJyYW5kLXN1cmZhY2UvNDAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBJTl9QUk9HUkVTUzogJ2JnLWJyYW5kLXByaW1hcnktY29udGFpbmVyLzIwIHRleHQtYnJhbmQtcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIERPTkU6ICdiZy1icmFuZC1zdWNjZXNzLWNvbnRhaW5lci8zMCB0ZXh0LWJyYW5kLXN1Y2Nlc3MnXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGFiZWxzID0geyBUT0RPOiAn66+46rKA7YagJywgSU5fUFJPR1JFU1M6ICfqsoDthqDspJEnLCBET05FOiAn6rKA7Yag7JmE66OMJyB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQga2V5PXtjb2wuaWR9IHN0eWxlPXtjZWxsU3R5bGV9IGNsYXNzTmFtZT17YHB4LTQgcHktMiBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJlbGF0aXZlIGFsaWduLXRvcCAke3NoYWRvd0NsYXNzfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0U2hvd1N0YXR1c0Ryb3Bkb3duSWQoaXNTdGF0dXNPcGVuID8gbnVsbCA6IHJlcS5pZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi10cmFuc2Zvcm0gaG92ZXI6c2NhbGUtMTA1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBweC0yIHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LW1lZGl1bSBsZWFkaW5nLW5vbmUgJHtzdGF0dXNDb2xvcnNbcmVxLnN0YXR1c10gfHwgc3RhdHVzQ29sb3JzLlRPRE99YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXEuc3RhdHVzID09PSAnRE9ORScgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInctMS41IGgtMS41IGJnLWJyYW5kLXN1Y2Nlc3Mgcm91bmRlZC1mdWxsXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVxLnN0YXR1cyA9PT0gJ0lOX1BST0dSRVNTJyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidy0xLjUgaC0xLjUgYmctYnJhbmQtcHJpbWFyeSByb3VuZGVkLWZ1bGwgYW5pbWF0ZS1waW5nXCI+PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVxLnN0YXR1cyA9PT0gJ1RPRE8nICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTEuNSBoLTEuNSBiZy1icmFuZC1icmFuZC1vdXRsaW5lIHJvdW5kZWQtZnVsbCBiZy1icmFuZC1vdXRsaW5lIG9wYWNpdHktNjBcIj48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtsYWJlbHNbcmVxLnN0YXR1c10gfHwgJ+uMgOq4sCDspJEnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Q2hldnJvbkRvd24gY2xhc3NOYW1lPVwidy0zIGgtMyBvcGFjaXR5LTYwIG1sLTAuNVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogU3RhdHVzIFNlbGVjdG9yIERyb3Bkb3duICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpc1N0YXR1c09wZW4gJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmPXtzdGF0dXNSZWZ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtNCBtdC0xIHctMjggYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHJvdW5kZWQtbGcgc2hhZG93LXhsIHB5LTEgei0zMCBhbmltYXRlLWZhZGUtc2xpZGUtdXAgdGV4dC14cyBmb250LXNlbWlib2xkXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyhbJ1RPRE8nLCAnSU5fUFJPR1JFU1MnLCAnRE9ORSddIGFzIFN0YXR1c1tdKS5tYXAoc3QgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17c3R9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAnc3RhdHVzJywgc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRTaG93U3RhdHVzRHJvcGRvd25JZChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1sZWZ0IHB4LTMgcHktMiB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgaG92ZXI6YmctYnJhbmQtc3VyZmFjZSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntsYWJlbHNbc3RdfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZXEuc3RhdHVzID09PSBzdCAmJiA8Q2hlY2sgY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LWJyYW5kLXByaW1hcnlcIiAvPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAvLyA3LiBDdXN0b20gQ29sdW1uIFJlbmRlclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wuaXNDdXN0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjZWxsVmFsID0gcmVxLmN1c3RvbUNvbHVtbnM/Lltjb2wuaWRdIHx8ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNFZGl0aW5nID0gaXNBY3RpdmUgJiYgYWN0aXZlRmllbGQgPT09IGNvbC5pZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2tib3ggZG9lc24ndCBuZWVkIGlubGluZSBlZGl0IHN0YXRlLCBqdXN0IHRvZ2dsZXMgb24gY2xpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wudHlwZSA9PT0gJ2NoZWNrYm94Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0NoZWNrZWQgPSBjZWxsVmFsID09PSAndHJ1ZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjb2wuaWR9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2NlbGxTdHlsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMiBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtY2VudGVyIGFsaWduLW1pZGRsZSAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy00IGgtNCBteC1hdXRvIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkIGJvcmRlciBib3JkZXItZ3JheS01MDAgYmctdHJhbnNwYXJlbnQgY3Vyc29yLXBvaW50ZXIgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgY29sLmlkLCBpc0NoZWNrZWQgPyAnZmFsc2UnIDogJ3RydWUnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzQ2hlY2tlZCAmJiA8Q2hlY2sgY2xhc3NOYW1lPVwidy0zIGgtMyB0ZXh0LWJyYW5kLW9uLXN1cmZhY2VcIiBzdHJva2VXaWR0aD17NH0gLz59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLnR5cGUgPT09ICdidXR0b24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjb2wuaWR9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2NlbGxTdHlsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMiBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IHRleHQtY2VudGVyIGFsaWduLW1pZGRsZSAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wuYnV0dG9uQWN0aW9uID09PSAnc3RhcnRfd29yaycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXEuYXNzaWduZWVzLmxlbmd0aCA9PT0gMCAmJiBhc3NpZ25lZXNQb29sLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAnYXNzaWduZWVzJywgW2Fzc2lnbmVlc1Bvb2xbMF1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCAnc3RhdHVzJywgJ0lOX1BST0dSRVNTJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb2wuYnV0dG9uQWN0aW9uID09PSAnZmluaXNoX3dvcmsnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgJ3N0YXR1cycsICdET05FJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0zIHB5LTEgYmctYnJhbmQtc3VyZmFjZS1oaWdoIGJvcmRlciBib3JkZXItYnJhbmQtb3V0bGluZSBob3ZlcjpiZy1icmFuZC1wcmltYXJ5LzEwIGhvdmVyOnRleHQtYnJhbmQtcHJpbWFyeSBob3Zlcjpib3JkZXItYnJhbmQtcHJpbWFyeSByb3VuZGVkIHRleHQteHMgdHJhbnNpdGlvbi1jb2xvcnMgd2hpdGVzcGFjZS1ub3dyYXBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29sLmJ1dHRvbkxhYmVsIHx8ICfsi6TtloknfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC50eXBlID09PSAnY3VycmVuY3lfdXNkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhbW91bnRDb2wgPSBjb2wuY3VycmVuY3lBbW91bnRDb2xJZCA/IGNvbHVtbnMuZmluZChjID0+IGMuaWQgPT09IGNvbC5jdXJyZW5jeUFtb3VudENvbElkKSA6IGNvbHVtbnMuZmluZChjID0+IGMubGFiZWwuaW5jbHVkZXMoJ+q4iOyVoScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVuY3lDb2wgPSBjb2wuY3VycmVuY3lDb2RlQ29sSWQgPyBjb2x1bW5zLmZpbmQoYyA9PiBjLmlkID09PSBjb2wuY3VycmVuY3lDb2RlQ29sSWQpIDogY29sdW1ucy5maW5kKGMgPT4gYy5sYWJlbC5pbmNsdWRlcygn7ZmU7Y+QJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbW91bnRDb2wgJiYgY3VycmVuY3lDb2wpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmF3QW1vdW50U3RyID0gU3RyaW5nKHJlcS5jdXN0b21Db2x1bW5zPy5bYW1vdW50Q29sLmlkXSB8fCAnMCcpLnJlcGxhY2UoL1teMC05Li1dKy9nLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYW1vdW50ID0gTnVtYmVyKHJhd0Ftb3VudFN0cikgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyciA9IFN0cmluZyhyZXEuY3VzdG9tQ29sdW1ucz8uW2N1cnJlbmN5Q29sLmlkXSB8fCAnJykudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGtyd1ZhbHVlID0gYW1vdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3Vyci5pbmNsdWRlcygnV09OJykgfHwgY3Vyci5pbmNsdWRlcygnS1JXJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrcndWYWx1ZSA9IGFtb3VudDsgLy8gQXNzdW1pbmcgYW1vdW50IGlzIGluIEtSVyB3aGVuIGN1cnJlbmN5IGlzIFdPTi9LUldcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjdXJyLmluY2x1ZGVzKCdFVVInKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtyd1ZhbHVlID0gYW1vdW50ICogZXhjaGFuZ2VSYXRlcy5FVVI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY3Vyci5pbmNsdWRlcygnVVMnKSB8fCBjdXJyLmluY2x1ZGVzKCdVU0QnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtyd1ZhbHVlID0gYW1vdW50ICogZXhjaGFuZ2VSYXRlcy5VU0Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdXNkVmFsdWUgPSBrcndWYWx1ZSAvIGV4Y2hhbmdlUmF0ZXMuVVNEO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmcmFjdGlvbkRpZ2l0cyA9IGNvbC5jdXJyZW5jeURlY2ltYWxQbGFjZXMgIT09IHVuZGVmaW5lZCA/IGNvbC5jdXJyZW5jeURlY2ltYWxQbGFjZXMgOiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBpc05hTih1c2RWYWx1ZSkgPyAnTi9BJyA6ICckJyArIHVzZFZhbHVlLnRvTG9jYWxlU3RyaW5nKHVuZGVmaW5lZCwgeyBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IGZyYWN0aW9uRGlnaXRzLCBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IGZyYWN0aW9uRGlnaXRzIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAnTi9BICjquIjslaEv7ZmU7Y+QIOyXtCDtlYTsmpQpJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjZWxsU3R5bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbGlnbi10b3AgdGV4dC1icmFuZC1wcmltYXJ5IGZvbnQtYm9sZCBiZy1icmFuZC1zdXJmYWNlLWxvd2VzdC81MCAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Jlc3VsdH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLnR5cGUgPT09ICdsb29rdXAnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0VGFiID0gdGFiRGF0YU1hcD8uW2NvbC5sb29rdXBUYWJJZCB8fCAnJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXRUYWIgJiYgY29sLmxvb2t1cE1hdGNoTXlDb2xJZCAmJiBjb2wubG9va3VwTWF0Y2hUYXJnZXRDb2xJZCAmJiBjb2wubG9va3VwUmV0dXJuVGFyZ2V0Q29sSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbXlWYWwgPSBjb2wubG9va3VwTWF0Y2hNeUNvbElkID09PSAndGl0bGUnID8gcmVxLnRpdGxlIDogcmVxLmN1c3RvbUNvbHVtbnM/Lltjb2wubG9va3VwTWF0Y2hNeUNvbElkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG15VmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoZWRSZXEgPSB0YXJnZXRUYWI/LnJlcXVpcmVtZW50cz8uZmluZCgocjogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRWYWwgPSBjb2wubG9va3VwTWF0Y2hUYXJnZXRDb2xJZCA9PT0gJ3RpdGxlJyA/IHIudGl0bGUgOiByLmN1c3RvbUNvbHVtbnM/Lltjb2wubG9va3VwTWF0Y2hUYXJnZXRDb2xJZCFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdFZhbCA9PT0gbXlWYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hlZFJlcSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBjb2wubG9va3VwUmV0dXJuVGFyZ2V0Q29sSWQgPT09ICd0aXRsZScgPyBtYXRjaGVkUmVxLnRpdGxlIDogbWF0Y2hlZFJlcS5jdXN0b21Db2x1bW5zPy5bY29sLmxvb2t1cFJldHVyblRhcmdldENvbElkXSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAhaXNOYU4oTnVtYmVyKHJlc3VsdCkpICYmIGNvbC5kZWNpbWFsUGxhY2VzICE9PSB1bmRlZmluZWQpIHJlc3VsdCA9IFN0cmluZyhOdW1iZXIocmVzdWx0KS50b0ZpeGVkKGNvbC5kZWNpbWFsUGxhY2VzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNCBweS0yIGJvcmRlci1yIGJvcmRlci1icmFuZC1vdXRsaW5lLXZhcmlhbnQgYWxpZ24tdG9wIHRleHQtYnJhbmQtb24tc3VyZmFjZSBiZy1icmFuZC1zdXJmYWNlLWxvd2VzdC8zMCByZWxhdGl2ZSAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IG9wYWNpdHktODBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gYmctYnJhbmQtc3VyZmFjZS1oaWdoZXN0IHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCB3aGl0ZXNwYWNlLW5vd3JhcCBvdmVyZmxvdy1oaWRkZW4gdGV4dC1lbGxpcHNpcyBmbGV4LTFcIj57cmVzdWx0IHx8ICctJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sLnR5cGUgPT09ICdmb3JtdWxhJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG9kYXkgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmdW5jID0gZ2V0Rm9ybXVsYUZuKGNvbC5mb3JtdWxhIHx8ICdcIlwiJywgY29sdW1ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gU3RyaW5nKGZ1bmMocmVxLCB0b2RheSwgU1VNLCBBVkVSQUdFLCBJRiwgREFZUywgTU9OVEhTLCBleGNoYW5nZVJhdGVzLktSVywgZXhjaGFuZ2VSYXRlcy5VU0QsIGV4Y2hhbmdlUmF0ZXMuRVVSKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAnRXJyb3InO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gJ0Vycm9yJyAmJiByZXN1bHQgIT09ICcnICYmICFpc05hTihOdW1iZXIocmVzdWx0KSkgJiYgY29sLmRlY2ltYWxQbGFjZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IE51bWJlcihyZXN1bHQpLnRvRml4ZWQoY29sLmRlY2ltYWxQbGFjZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNGb3JtdWxhRWRpdGluZyA9IGFjdGl2ZUNlbGxFZGl0b3I/LnJvd0lkID09PSAnRk9STVVMQV8nICsgY29sLmlkICYmIGFjdGl2ZUNlbGxFZGl0b3I/LmZpZWxkID09PSBjb2wuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtjb2wuaWR9IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2NlbGxTdHlsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcih7IHJvd0lkOiAnRk9STVVMQV8nICsgY29sLmlkLCBmaWVsZDogY29sLmlkIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi7YG066at7ZWY7JesIO2VtOuLuSDsl7TsnZgg7IiY7Iud7J2EIOyImOygle2VqeuLiOuLpFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbGlnbi10b3AgdGV4dC1icmFuZC1wcmltYXJ5IGZvbnQtbWVkaXVtIGJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0LzUwIGN1cnNvci10ZXh0IGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UtaGlnaC8yMCB0cmFuc2l0aW9uLWNvbG9ycyByZWxhdGl2ZSAke3NoYWRvd0NsYXNzfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRm9ybXVsYUVkaXRpbmcgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29sLmZvcm11bGEgfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Rm9ybXVsYSA9IGUudGFyZ2V0LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29sdW1ucyhwcmV2ID0+IHByZXYubWFwKGMgPT4gYy5pZCA9PT0gY29sLmlkID8geyAuLi5jLCBmb3JtdWxhOiBuZXdGb3JtdWxhIH0gOiBjKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3Rm9ybXVsYSA9IGUuY3VycmVudFRhcmdldC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Q29sdW1ucyhwcmV2ID0+IHByZXYubWFwKGMgPT4gYy5pZCA9PT0gY29sLmlkID8geyAuLi5jLCBmb3JtdWxhOiBuZXdGb3JtdWxhIH0gOiBjKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZUNlbGxFZGl0b3IobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSAnRXNjYXBlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGgtZnVsbCBiZy1icmFuZC1zdXJmYWNlIGJvcmRlciBib3JkZXItYnJhbmQtcHJpbWFyeSBhYnNvbHV0ZSBpbnNldC0wIHotMTAgcC0yIHRleHQtYnJhbmQtb24tc3VyZmFjZSBmb250LW1vbm8gdGV4dC14cyBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctYnJhbmQtcHJpbWFyeS81MCB0ZXh0LWxlZnQgcmVzaXplLW5vbmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wudHlwZSA9PT0gJ3JlbGF0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWxJZHMgPSBjZWxsVmFsLnNwbGl0KCcsJykubWFwKHMgPT4gcy50cmltKCkpLmZpbHRlcihCb29sZWFuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlQ2VsbEVkaXRvcih7IHJvd0lkOiByZXEuaWQsIGZpZWxkOiBjb2wuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBjdXJzb3ItdGV4dCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2gvMjAgdHJhbnNpdGlvbi1jb2xvcnMgYWxpZ24tdG9wIHJlbGF0aXZlICR7c2hhZG93Q2xhc3N9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NlbGxWYWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVxdWlyZW1lbnRGaWVsZChyZXEuaWQsIGNvbC5pZCwgZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgY29sLmlkLCBlLmN1cnJlbnRUYXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUkVRLTAwMiwgUkVRLTAwMy4uLlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYWJzb2x1dGUgLWluc2V0LVsxcHhdIHotMjAgdy1bY2FsYygxMDAlKzJweCldIGgtW2NhbGMoMTAwJSsycHgpXSBiZy1icmFuZC1zdXJmYWNlLWxvd2VzdCBib3JkZXItMiBib3JkZXItYnJhbmQtcHJpbWFyeSB0ZXh0LXhzIHB4LVsxNXB4XSBweS1bN3B4XSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgZm9jdXM6b3V0bGluZS1ub25lIHNoYWRvdy1tZCBmb250LW1vbm9cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgZmxleCBmbGV4LXdyYXAgZ2FwLTEgJHtpc0VkaXRpbmcgPyAnb3BhY2l0eS0wJyA6ICcnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVsSWRzLmxlbmd0aCA9PT0gMCAmJiA8c3BhbiBjbGFzc05hbWU9XCJvcGFjaXR5LTM1IGl0YWxpYyBmb250LWxpZ2h0XCI+LTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZWxJZHMubWFwKHJpZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGlua2VkUmVxID0gcmVxQnlJZC5nZXQocmlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmtlZFJlcSkgcmV0dXJuIDxzcGFuIGtleT17cmlkfSBjbGFzc05hbWU9XCJ0ZXh0LWJyYW5kLWVycm9yIHRleHQtWzEwcHhdIGJvcmRlciBib3JkZXItYnJhbmQtZXJyb3IvMjAgYmctYnJhbmQtZXJyb3IvMTAgcHgtMSByb3VuZGVkXCI+e3JpZH0g7JeG7J2MPC9zcGFuPjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4ga2V5PXtyaWR9IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtbWVkaXVtIGJnLWJyYW5kLXRlcnRpYXJ5LzEwIHRleHQtYnJhbmQtdGVydGlhcnkgYm9yZGVyIGJvcmRlci1icmFuZC10ZXJ0aWFyeS8zMCBweC0xIHB5LTAuNSByb3VuZGVkIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGxlYWRpbmctbm9uZSBzaGFkb3ctc21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg8J+UlyB7bGlua2VkUmVxLnRpdGxlLnNsaWNlKDAsIDEwKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wudHlwZSA9PT0gJ3JvbGx1cCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbENvbFZhbCA9IHJlcS5jdXN0b21Db2x1bW5zPy5bY29sLnJvbGx1cFJlbElkIHx8ICcnXSB8fCAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbElkcyA9IHJlbENvbFZhbC5zcGxpdCgnLCcpLm1hcChzID0+IHMudHJpbSgpKS5maWx0ZXIoQm9vbGVhbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5rZWRSZXFzID0gcmVsSWRzLm1hcChyaWQgPT4gcmVxQnlJZC5nZXQocmlkKSkuZmlsdGVyKEJvb2xlYW4pIGFzIFJlcXVpcmVtZW50W107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHRTdHIgPSAnLSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGlua2VkUmVxcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wucm9sbHVwQWdnVHlwZSA9PT0gJ2NvdW50Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdFN0ciA9IGxpbmtlZFJlcXMubGVuZ3RoLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29sLnJvbGx1cEFnZ1R5cGUgPT09ICdwZXJjZW50X2RvbmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9uZUNvdW50ID0gbGlua2VkUmVxcy5maWx0ZXIociA9PiByLnN0YXR1cyA9PT0gJ0RPTkUnKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0U3RyID0gYCR7TWF0aC5yb3VuZCgoZG9uZUNvdW50IC8gbGlua2VkUmVxcy5sZW5ndGgpICogMTAwKX0lYDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0U3RyICE9PSAnLScgJiYgIXJlc3VsdFN0ci5pbmNsdWRlcygnJScpICYmICFpc05hTihOdW1iZXIocmVzdWx0U3RyKSkgJiYgY29sLmRlY2ltYWxQbGFjZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRTdHIgPSBOdW1iZXIocmVzdWx0U3RyKS50b0ZpeGVkKGNvbC5kZWNpbWFsUGxhY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMiBib3JkZXItciBib3JkZXItYnJhbmQtb3V0bGluZS12YXJpYW50IGFsaWduLXRvcCB0ZXh0LVsxM3B4XSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBmb250LWJvbGQgYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QvNTAgJHtzaGFkb3dDbGFzc31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Jlc3VsdFN0cn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2wudHlwZSA9PT0gJ3N0YXR1cycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGNvbC5vcHRpb25zIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjZWxsU3R5bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbGlnbi10b3AgcmVsYXRpdmUgJHtzaGFkb3dDbGFzc31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjZWxsVmFsfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCBjb2wuaWQsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBob3Zlcjpib3JkZXItYnJhbmQtcHJpbWFyeSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgdGV4dC1bMTNweF0gdGV4dC1jZW50ZXIgZm9udC1tZWRpdW0gcm91bmRlZCBweC0yIHB5LTEgY3Vyc29yLXBvaW50ZXIgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgYXBwZWFyYW5jZS1ub25lIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPi0g7IOB7YOcIOyEoO2DnSAtPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRncm91cCBsYWJlbD1cIu2VoCDsnbwgKFRPRE8pXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge29wdGlvbnMuZmlsdGVyKChfLCBpKSA9PiBpIDwgb3B0aW9ucy5sZW5ndGggLyAzKS5tYXAob3B0ID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXtvcHR9IHZhbHVlPXtvcHR9PntvcHR9PC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvb3B0Z3JvdXA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRncm91cCBsYWJlbD1cIuynhO2WiSDspJEgKElOIFBST0dSRVNTKVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtvcHRpb25zLmZpbHRlcigoXywgaSkgPT4gaSA+PSBvcHRpb25zLmxlbmd0aCAvIDMgJiYgaSA8IChvcHRpb25zLmxlbmd0aCAvIDMpICogMikubWFwKG9wdCA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17b3B0fSB2YWx1ZT17b3B0fT57b3B0fTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29wdGdyb3VwPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0Z3JvdXAgbGFiZWw9XCLsmYTro4wgKERPTkUpXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge29wdGlvbnMuZmlsdGVyKChfLCBpKSA9PiBpID49IChvcHRpb25zLmxlbmd0aCAvIDMpICogMikubWFwKG9wdCA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17b3B0fSB2YWx1ZT17b3B0fT57b3B0fTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29wdGdyb3VwPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC50eXBlID09PSAnc2VsZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gY29sLm9wdGlvbnMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc1ZhbHVlID0gY2VsbFZhbCAhPT0gdW5kZWZpbmVkICYmIGNlbGxWYWwgIT09IG51bGwgJiYgY2VsbFZhbCAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzVmFsdWVJbk9wdGlvbnMgPSBvcHRpb25zLmluY2x1ZGVzKGNlbGxWYWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17Y29sLmlkfSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXtjZWxsU3R5bGV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBhbGlnbi10b3AgcmVsYXRpdmUgJHtzaGFkb3dDbGFzc31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtjZWxsVmFsIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCBjb2wuaWQsIGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWJyYW5kLXN1cmZhY2UgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBob3Zlcjpib3JkZXItYnJhbmQtcHJpbWFyeSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UgdGV4dC1bMTNweF0gdGV4dC1jZW50ZXIgZm9udC1tZWRpdW0gcm91bmRlZCBweC0yIHB5LTEgY3Vyc29yLXBvaW50ZXIgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMSBmb2N1czpyaW5nLWJyYW5kLXByaW1hcnkgYXBwZWFyYW5jZS1ub25lIHRyYW5zaXRpb24tY29sb3JzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPjwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7b3B0aW9ucy5tYXAob3B0ID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17b3B0fSB2YWx1ZT17b3B0fT57b3B0fTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2hhc1ZhbHVlICYmICFpc1ZhbHVlSW5PcHRpb25zICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIGtleT17Y2VsbFZhbH0gdmFsdWU9e2NlbGxWYWx9PntjZWxsVmFsfTwvb3B0aW9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC50eXBlID09PSAnZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17Y2VsbFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlQ2VsbEVkaXRvcih7IHJvd0lkOiByZXEuaWQsIGZpZWxkOiBjb2wuaWQgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCB0ZXh0LVsxM3B4XSB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2gvMTAgY3Vyc29yLXBvaW50ZXIgYWxpZ24tdG9wIHJlbGF0aXZlICR7c2hhZG93Q2xhc3N9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXNFZGl0aW5nICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJkYXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NlbGxWYWx9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25QYXN0ZT17KGUpID0+IGhhbmRsZUdyaWRQYXN0ZShlLCByZXEuaWQsIGNvbC5pZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVxdWlyZW1lbnRGaWVsZChyZXEuaWQsIGNvbC5pZCwgZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVSZXF1aXJlbWVudEZpZWxkKHJlcS5pZCwgY29sLmlkLCBlLmN1cnJlbnRUYXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRXNjYXBlJykgc2V0QWN0aXZlQ2VsbEVkaXRvcihudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImFic29sdXRlIC1pbnNldC1bMXB4XSB6LTIwIHctW2NhbGMoMTAwJSsycHgpXSBoLVtjYWxjKDEwMCUrMnB4KV0gYmctYnJhbmQtc3VyZmFjZS1sb3dlc3QgYm9yZGVyLTIgYm9yZGVyLWJyYW5kLXByaW1hcnkgdGV4dC1bMTNweF0gcHgtWzE1cHhdIHB5LVs3cHhdIHRleHQtYnJhbmQtb24tc3VyZmFjZSBmb2N1czpvdXRsaW5lLW5vbmUgc2hhZG93LW1kIGZvbnQtbW9ub1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2lzRWRpdGluZyA/ICdvcGFjaXR5LTAnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y2VsbFZhbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERldGVybWluZSBpbnB1dCB0eXBlXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaW5wdXRUeXBlID0gJ3RleHQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbC50eXBlID09PSAnbnVtYmVyJykgaW5wdXRUeXBlID0gJ251bWJlcic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2NvbC5pZH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e2NlbGxTdHlsZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBY3RpdmVDZWxsRWRpdG9yKHsgcm93SWQ6IHJlcS5pZCwgZmllbGQ6IGNvbC5pZCB9KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC00IHB5LTIgYm9yZGVyLXIgYm9yZGVyLWJyYW5kLW91dGxpbmUtdmFyaWFudCBjdXJzb3ItdGV4dCBob3ZlcjpiZy1icmFuZC1zdXJmYWNlLWhpZ2gvMjAgdHJhbnNpdGlvbi1jb2xvcnMgd2hpdGVzcGFjZS1wcmUtd3JhcCBicmVhay13b3JkcyBhbGlnbi10b3AgcmVsYXRpdmUgJHtzaGFkb3dDbGFzc31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGV4dGFyZWEgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y2VsbFZhbH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUGFzdGU9eyhlKSA9PiBoYW5kbGVHcmlkUGFzdGUoZSwgcmVxLmlkLCBjb2wuaWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlUmVxdWlyZW1lbnRGaWVsZChyZXEuaWQsIGNvbC5pZCwgZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEFjdGl2ZUNlbGxFZGl0b3IobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVJlcXVpcmVtZW50RmllbGQocmVxLmlkLCBjb2wuaWQsIGUuY3VycmVudFRhcmdldC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFc2NhcGUnKSBzZXRBY3RpdmVDZWxsRWRpdG9yKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSAtaW5zZXQtWzFweF0gei0yMCB3LVtjYWxjKDEwMCUrMnB4KV0gaC1bY2FsYygxMDAlKzJweCldIGJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0IGJvcmRlci0yIGJvcmRlci1icmFuZC1wcmltYXJ5IHRleHQtc20gcHgtWzE1cHhdIHB5LVs3cHhdIHRleHQtYnJhbmQtb24tc3VyZmFjZSBmb2N1czpvdXRsaW5lLW5vbmUgc2hhZG93LW1kIHJlc2l6ZS1ub25lIGZvbnQtbWVkaXVtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGZvbnQtbWVkaXVtIGJyZWFrLXdvcmRzIHdoaXRlc3BhY2UtcHJlLXdyYXAgaC1mdWxsIHctZnVsbCAke2lzRWRpdGluZyA/ICdvcGFjaXR5LTAnIDogJyd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW5wdXRUeXBlID09PSAnbnVtYmVyJyAmJiBjb2wuZGVjaW1hbFBsYWNlcyAhPT0gdW5kZWZpbmVkICYmIGNlbGxWYWwgJiYgIWlzTmFOKE51bWJlcihjZWxsVmFsKSkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gTnVtYmVyKGNlbGxWYWwpLnRvRml4ZWQoY29sLmRlY2ltYWxQbGFjZXMpIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IChjZWxsVmFsIHx8IDxzcGFuIGNsYXNzTmFtZT1cIm9wYWNpdHktMFwiPi08L3NwYW4+KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0pfVxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBTaW5nbGUgUm93IGFjdGlvbnMgY2VsbCAqL31cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTQgcHktMiB0ZXh0LWNlbnRlciB0ZXh0LWJyYW5kLW9uLXN1cmZhY2UtdmFyaWFudCB3LVsxMDBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShgJyR7cmVxLmlkfScg7ZWt66qp7J2EIOymieqwgSDsgq3soJztlZjsi5zqsqDsirXri4jquYw/YCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRSZXF1aXJlbWVudHMocHJldiA9PiBwcmV2LmZpbHRlcihyID0+IHIuaWQgIT09IHJlcS5pZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkSWRzKHByZXYgPT4gcHJldi5maWx0ZXIoaWQgPT4gaWQgIT09IHJlcS5pZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwib3BhY2l0eS0wIGdyb3VwLWhvdmVyOm9wYWNpdHktMTAwIHAtMS41IHRleHQtYnJhbmQtb3V0bGluZSBob3Zlcjp0ZXh0LWJyYW5kLWVycm9yIGhvdmVyOmJnLWJyYW5kLXN1cmZhY2UtbG93ZXN0IHJvdW5kZWQtbGcgdHJhbnNpdGlvbi1hbGwgY3Vyc29yLXBvaW50ZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLsgq3soJxcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUcmFzaDIgY2xhc3NOYW1lPVwidy00IGgtNFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgKTtcblxufSwgKHByZXYsIG5leHQpID0+IHtcbiAgcmV0dXJuIChcbiAgICBwcmV2LnJlcSA9PT0gbmV4dC5yZXEgJiZcbiAgICBwcmV2LmlzU2VsZWN0ZWQgPT09IG5leHQuaXNTZWxlY3RlZCAmJlxuICAgIHByZXYuaXNBY3RpdmUgPT09IG5leHQuaXNBY3RpdmUgJiZcbiAgICBwcmV2LmFjdGl2ZUZpZWxkID09PSBuZXh0LmFjdGl2ZUZpZWxkICYmXG4gICAgcHJldi5pc0xvY2tlZEJ5T3RoZXIgPT09IG5leHQuaXNMb2NrZWRCeU90aGVyICYmXG4gICAgcHJldi5sb2NrZWRCeU5hbWUgPT09IG5leHQubG9ja2VkQnlOYW1lICYmXG4gICAgcHJldi5pc1ByaW9yaXR5T3BlbiA9PT0gbmV4dC5pc1ByaW9yaXR5T3BlbiAmJlxuICAgIHByZXYuaXNBc3NpZ25lZU9wZW4gPT09IG5leHQuaXNBc3NpZ25lZU9wZW4gJiZcbiAgICBwcmV2LmlzU3RhdHVzT3BlbiA9PT0gbmV4dC5pc1N0YXR1c09wZW4gJiZcbiAgICBwcmV2LmRyYWdPdmVyUm93SWQgPT09IG5leHQuZHJhZ092ZXJSb3dJZCAmJlxuICAgIHByZXYuY29sdW1ucyA9PT0gbmV4dC5jb2x1bW5zICYmXG4gICAgcHJldi5taW5pbWl6ZWRDb2x1bW5zID09PSBuZXh0Lm1pbmltaXplZENvbHVtbnMgJiZcbiAgICBwcmV2LmNvbHVtbldpZHRocyA9PT0gbmV4dC5jb2x1bW5XaWR0aHMgJiZcbiAgICBwcmV2LmFzc2lnbmVlc1Bvb2wgPT09IG5leHQuYXNzaWduZWVzUG9vbCAmJlxuICAgIHByZXYuY3VycmVudFVzZXIgPT09IG5leHQuY3VycmVudFVzZXIgJiZcbiAgICBwcmV2LmV4Y2hhbmdlUmF0ZXMgPT09IG5leHQuZXhjaGFuZ2VSYXRlcyAmJlxuICAgIHByZXYuYWN0aXZlQ2VsbEVkaXRvciA9PT0gbmV4dC5hY3RpdmVDZWxsRWRpdG9yICYmXG4gICAgcHJldi50YWJEYXRhTWFwID09PSBuZXh0LnRhYkRhdGFNYXAgJiZcbiAgICBwcmV2LmdldENlbGxTdGlja3lTdHlsZSA9PT0gbmV4dC5nZXRDZWxsU3RpY2t5U3R5bGVcbiAgKTtcbn0pO1xuIl0sIm1hcHBpbmdzIjoiQUF3ekNjO0FBeHpDZDtBQUFBO0FBQUE7QUFBQTtBQUtBLE9BQU8sU0FBUyxVQUFVLFFBQVEsV0FBVyxhQUFhLGVBQWU7QUFDekUsU0FBUyxvQkFBb0I7QUFFN0IsT0FBTyxhQUFhO0FBQ3BCLFNBQVMsY0FBYztBQUN2QjtBQUFBLEVBQ0U7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBRUE7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxPQUNLO0FBRVAsU0FBUyxzQkFBc0IseUJBQXlCO0FBQ3hELE9BQU8sb0JBQW9CO0FBa0IzQixJQUFJLGVBQW9CO0FBQ3hCLE1BQU0saUJBQWlCLFlBQVk7QUFDL0IsTUFBSSxhQUFjLFFBQU87QUFFekIsTUFBSSxPQUFPLHFCQUFxQjtBQUM1QixVQUFNLEVBQUUsT0FBTyxJQUFJLE1BQU0sT0FBTyxzQkFBc0I7QUFDdEQsbUJBQWU7QUFDZixXQUFPO0FBQUEsRUFDWDtBQUNBLFNBQU87QUFDWDtBQUVBLHdCQUF3QixZQUFZLEVBQUUsY0FBYyxpQkFBaUIseUJBQXlCLGVBQWUsa0JBQWtCLFNBQVMsWUFBWSxxQkFBcUIsUUFBUSxRQUFRLGFBQWEsY0FBYyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsYUFBYSxDQUFDLEVBQUUsR0FBcUI7QUFHdFEsUUFBTSxjQUFjO0FBQ3BCLFFBQU0sYUFBYSxPQUF3QixDQUFDLENBQUM7QUFDN0MsUUFBTSxlQUFlLE9BQXdCLENBQUMsQ0FBQztBQUcvQyxRQUFNLGtCQUFrQixZQUFZLENBQUMsV0FBZ0Q7QUFDbkYsNEJBQXdCLFVBQVE7QUFDOUIsWUFBTSxPQUFPLE9BQU8sV0FBVyxhQUFjLE9BQWUsSUFBSSxJQUFJO0FBR3BFLFVBQUksU0FBUyxNQUFNO0FBQ2pCLG1CQUFXLFFBQVEsS0FBSyxJQUFJO0FBQzVCLFlBQUksV0FBVyxRQUFRLFNBQVMsYUFBYTtBQUMzQyxxQkFBVyxRQUFRLE1BQU07QUFBQSxRQUMzQjtBQUNBLHFCQUFhLFVBQVUsQ0FBQztBQUFBLE1BQzFCO0FBQ0EsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUFBLEVBQ0gsR0FBRyxDQUFDLHVCQUF1QixDQUFDO0FBRTVCLFFBQU0sYUFBYSxZQUFZLE1BQU07QUFDbkMsUUFBSSxXQUFXLFFBQVEsU0FBUyxHQUFHO0FBQ2pDLDhCQUF3QixVQUFRO0FBQzlCLGNBQU0sZ0JBQWdCLFdBQVcsUUFBUSxJQUFJO0FBQzdDLHFCQUFhLFFBQVEsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25DLGVBQU87QUFBQSxNQUNULENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRixHQUFHLENBQUMsdUJBQXVCLENBQUM7QUFFNUIsUUFBTSxhQUFhLFlBQVksTUFBTTtBQUNuQyxRQUFJLGFBQWEsUUFBUSxTQUFTLEdBQUc7QUFDbkMsOEJBQXdCLFVBQVE7QUFDOUIsY0FBTSxZQUFZLGFBQWEsUUFBUSxJQUFJO0FBQzNDLG1CQUFXLFFBQVEsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLGVBQU87QUFBQSxNQUNULENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRixHQUFHLENBQUMsdUJBQXVCLENBQUM7QUFHNUIsWUFBVSxNQUFNO0FBQ2QsVUFBTSxnQkFBZ0IsQ0FBQyxNQUFxQjtBQUUxQyxXQUFLLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxJQUFJLFlBQVksTUFBTSxPQUFPLENBQUMsRUFBRSxVQUFVO0FBQzFFLFVBQUUsZUFBZTtBQUNqQixtQkFBVztBQUFBLE1BQ2I7QUFFQSxXQUFLLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxJQUFJLFlBQVksTUFBTSxPQUFRLEVBQUUsSUFBSSxZQUFZLE1BQU0sT0FBTyxFQUFFLFdBQVk7QUFDNUcsVUFBRSxlQUFlO0FBQ2pCLG1CQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0Y7QUFDQSxXQUFPLGlCQUFpQixXQUFXLGFBQWE7QUFDaEQsV0FBTyxNQUFNLE9BQU8sb0JBQW9CLFdBQVcsYUFBYTtBQUFBLEVBQ2xFLEdBQUcsQ0FBQyxZQUFZLFVBQVUsQ0FBQztBQUczQixRQUFNLENBQUMsWUFBWSxhQUFhLElBQUksU0FBUyxFQUFFO0FBQy9DLFFBQU0sQ0FBQyxnQkFBZ0IsaUJBQWlCLElBQUksU0FBMkIsS0FBSztBQUM1RSxRQUFNLENBQUMsY0FBYyxlQUFlLElBQUksU0FBeUIsS0FBSztBQUd0RSxRQUFNLENBQUMsV0FBVyxZQUFZLElBQUksU0FBdUQsSUFBSTtBQUM3RixRQUFNLENBQUMsZUFBZSxnQkFBZ0IsSUFBSSxTQUF5QixLQUFLO0FBR3hFLFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLElBQUksU0FBUyxLQUFLO0FBQ2xFLFFBQU0sQ0FBQyxpQkFBaUIsa0JBQWtCLElBQUksU0FBUyxLQUFLO0FBQzVELFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLElBQUksU0FBd0IsSUFBSTtBQUNoRixRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixJQUFJLFNBQXdCLElBQUk7QUFDeEUsUUFBTSxDQUFDLGVBQWUsZ0JBQWdCLElBQUksU0FBUyxFQUFFO0FBQ3JELFFBQU0sQ0FBQyxlQUFlLGdCQUFnQixJQUFJLFNBQXFCLE1BQU07QUFDckUsUUFBTSxDQUFDLHFCQUFxQixzQkFBc0IsSUFBSSxTQUF3QixJQUFJO0FBR2xGLFFBQU0sQ0FBQyxjQUFjLGVBQWUsSUFBSSxTQUFTLEVBQUU7QUFDbkQsUUFBTSxDQUFDLGtCQUFrQixtQkFBbUIsSUFBSSxTQUFTLEVBQUU7QUFDM0QsUUFBTSxDQUFDLG1CQUFtQixvQkFBb0IsSUFBSSxTQUFTLFlBQVk7QUFDdkUsUUFBTSxDQUFDLDBCQUEwQiwyQkFBMkIsSUFBSSxTQUFTLEVBQUU7QUFDM0UsUUFBTSxDQUFDLHdCQUF3Qix5QkFBeUIsSUFBSSxTQUFTLEVBQUU7QUFDdkUsUUFBTSxDQUFDLDRCQUE0Qiw2QkFBNkIsSUFBSSxTQUFpQixDQUFDO0FBQ3RGLFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLElBQUksU0FBaUIsRUFBRTtBQUN2RSxRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixJQUFJLFNBQVMsRUFBRTtBQUMzRCxRQUFNLENBQUMsb0JBQW9CLHFCQUFxQixJQUFJLFNBQW1DLE9BQU87QUFDOUYsUUFBTSxDQUFDLG9CQUFvQixxQkFBcUIsSUFBSSxTQUFTLHNCQUFzQjtBQUduRixRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixJQUFJLFNBQVMsRUFBRTtBQUMzRCxRQUFNLENBQUMseUJBQXlCLDBCQUEwQixJQUFJLFNBQVMsRUFBRTtBQUN6RSxRQUFNLENBQUMsNkJBQTZCLDhCQUE4QixJQUFJLFNBQVMsRUFBRTtBQUNqRixRQUFNLENBQUMsOEJBQThCLCtCQUErQixJQUFJLFNBQVMsRUFBRTtBQUluRixRQUFNLENBQUMsZUFBZSxnQkFBZ0IsSUFBSSxTQUFTLE1BQU07QUFDdkQsVUFBTSxRQUFRLGFBQWEsUUFBUSxvQkFBb0I7QUFDdkQsV0FBTyxRQUFRLEtBQUssTUFBTSxLQUFLLElBQUksRUFBRSxLQUFLLEdBQUcsS0FBSyxNQUFNLEtBQUssS0FBSztBQUFBLEVBQ3BFLENBQUM7QUFFRCxZQUFVLE1BQU07QUFDZCxpQkFBYSxRQUFRLHNCQUFzQixLQUFLLFVBQVUsYUFBYSxDQUFDO0FBQUEsRUFDMUUsR0FBRyxDQUFDLGFBQWEsQ0FBQztBQUdsQixRQUFNLENBQUMsY0FBYyxlQUFlLElBQUksU0FBaUMsTUFBTTtBQUM3RSxVQUFNLFFBQVEsYUFBYSxRQUFRLHFCQUFxQjtBQUN4RCxVQUFNLE9BQU8sUUFBUSxLQUFLLE1BQU0sS0FBSyxJQUFJO0FBQUEsTUFDdkMsY0FBYztBQUFBLE1BQ2QsWUFBWTtBQUFBLE1BQ1osWUFBWTtBQUFBLE1BQ1osSUFBSTtBQUFBLE1BQ0osT0FBTztBQUFBLE1BQ1AsYUFBYTtBQUFBLE1BQ2IsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsVUFBVTtBQUFBLE1BQ1YsUUFBUTtBQUFBLElBQ1Y7QUFDQSxZQUFRLFFBQVEsT0FBSztBQUNuQixVQUFJLEVBQUUsTUFBTyxNQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFBQSxJQUM5QixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1QsQ0FBQztBQUVELFlBQVUsTUFBTTtBQUNkLG9CQUFnQixVQUFRO0FBQ3RCLFVBQUksVUFBVTtBQUNkLFlBQU0sT0FBTyxFQUFFLEdBQUcsS0FBSztBQUN2QixjQUFRLFFBQVEsT0FBSztBQUNuQixZQUFJLEVBQUUsU0FBUyxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTztBQUNyQyxlQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFDZixvQkFBVTtBQUFBLFFBQ1o7QUFBQSxNQUNGLENBQUM7QUFDRCxhQUFPLFVBQVUsT0FBTztBQUFBLElBQzFCLENBQUM7QUFBQSxFQUNILEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFFWixZQUFVLE1BQU07QUFDZCxpQkFBYSxRQUFRLHVCQUF1QixLQUFLLFVBQVUsWUFBWSxDQUFDO0FBQUEsRUFDMUUsR0FBRyxDQUFDLFlBQVksQ0FBQztBQUVqQixRQUFNLENBQUMsZUFBZSxnQkFBZ0IsSUFBSSxTQUF3QixJQUFJO0FBQ3RFLFFBQU0sQ0FBQyxjQUFjLGVBQWUsSUFBSSxTQUFTLENBQUM7QUFDbEQsUUFBTSxDQUFDLGtCQUFrQixtQkFBbUIsSUFBSSxTQUFTLENBQUM7QUFFMUQsWUFBVSxNQUFNO0FBQ2QsUUFBSSxDQUFDLGNBQWU7QUFFcEIsVUFBTSxrQkFBa0IsQ0FBQyxNQUFrQjtBQUN6QyxZQUFNLFNBQVMsRUFBRSxVQUFVO0FBQzNCLFlBQU0sV0FBVyxLQUFLLElBQUksSUFBSSxtQkFBbUIsTUFBTTtBQUN2RCxzQkFBZ0IsV0FBUyxFQUFFLEdBQUcsTUFBTSxDQUFDLGFBQWEsR0FBRyxTQUFTLEVBQUU7QUFBQSxJQUNsRTtBQUVBLFVBQU0sZ0JBQWdCLE1BQU07QUFDMUIsc0JBQWdCLGdCQUFjO0FBQzVCLGNBQU0sYUFBYSxXQUFXLGFBQWE7QUFDM0MsWUFBSSxZQUFZO0FBQ2QscUJBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sZ0JBQWdCLEVBQUUsR0FBRyxHQUFHLE9BQU8sV0FBVyxJQUFJLENBQUMsQ0FBQztBQUFBLFFBQzVGO0FBQ0EsZUFBTztBQUFBLE1BQ1QsQ0FBQztBQUNELHVCQUFpQixJQUFJO0FBQUEsSUFDdkI7QUFFQSxXQUFPLGlCQUFpQixhQUFhLGVBQWU7QUFDcEQsV0FBTyxpQkFBaUIsV0FBVyxhQUFhO0FBQ2hELFdBQU8sTUFBTTtBQUNYLGFBQU8sb0JBQW9CLGFBQWEsZUFBZTtBQUN2RCxhQUFPLG9CQUFvQixXQUFXLGFBQWE7QUFBQSxJQUNyRDtBQUFBLEVBQ0YsR0FBRyxDQUFDLGVBQWUsY0FBYyxrQkFBa0IsVUFBVSxDQUFDO0FBRzlELFFBQU0sQ0FBQyxxQkFBcUIsc0JBQXNCLElBQUksU0FBUyxLQUFLO0FBQ3BFLFFBQU0sQ0FBQyxvQkFBb0IscUJBQXFCLElBQUksU0FBK0MsTUFBUztBQUM1RyxRQUFNLENBQUMsaUJBQWlCLGtCQUFrQixJQUFJLFNBQVMsRUFBRTtBQUd6RCxRQUFNLENBQUMsbUJBQW1CLG9CQUFvQixJQUFJLFNBQWlDLENBQUMsQ0FBQztBQUNyRixRQUFNLENBQUMsb0JBQW9CLHFCQUFxQixJQUFJLFNBQXdCLElBQUk7QUFDaEYsUUFBTSxDQUFDLG1CQUFtQixvQkFBb0IsSUFBSSxTQUErQyxJQUFJO0FBQ3JHLFFBQU0saUJBQWlCLE9BQXVCLElBQUk7QUFFbEQsUUFBTSxDQUFDLGtCQUFrQixtQkFBbUIsSUFBSSxTQUFrQyxDQUFDLENBQUM7QUFHcEYsWUFBVSxNQUFNO0FBQ2QsVUFBTSxvQkFBb0IsQ0FBQyxNQUFrQjtBQUUzQyxVQUFJLGVBQWUsV0FBVyxDQUFDLGVBQWUsUUFBUSxTQUFTLEVBQUUsTUFBYyxHQUFHO0FBQ2hGLDhCQUFzQixJQUFJO0FBQzFCLDZCQUFxQixJQUFJO0FBQUEsTUFDM0I7QUFFQSwwQkFBb0IsSUFBSTtBQUN4QiwrQkFBeUIsSUFBSTtBQUFBLElBQy9CO0FBQ0EsV0FBTyxpQkFBaUIsYUFBYSxpQkFBaUI7QUFDdEQsV0FBTyxNQUFNLE9BQU8sb0JBQW9CLGFBQWEsaUJBQWlCO0FBQUEsRUFDeEUsR0FBRyxDQUFDLENBQUM7QUFFTCxRQUFNLENBQUMsYUFBYSxjQUFjLElBQUksU0FBbUIsQ0FBQyxDQUFDO0FBQzNELFFBQU0sQ0FBQyxtQkFBbUIsb0JBQW9CLElBQUksU0FBbUIsQ0FBQyxDQUFDO0FBQ3ZFLFFBQU0sQ0FBQywwQkFBMEIsMkJBQTJCLElBQUksU0FBd0IsSUFBSTtBQUM1RixRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixJQUFJLFNBQVMsRUFBRTtBQUMzRCxRQUFNLENBQUMsdUJBQXVCLHdCQUF3QixJQUFJLFNBQVMsRUFBRTtBQUdyRSxRQUFNLENBQUMsa0JBQWtCLHdCQUF3QixJQUFJLFNBQWtELElBQUk7QUFDM0csUUFBTSxVQUFVLE9BQWdELElBQUk7QUFDcEUsUUFBTSxXQUFXLE9BQVksSUFBSTtBQUVqQyxZQUFVLE1BQU07QUFDZCxZQUFRLFVBQVU7QUFDbEIsYUFBUyxVQUFVO0FBQUEsRUFDckIsQ0FBQztBQUdELFFBQU0sc0JBQXNCLFlBQVksT0FBTyxRQUFpRDtBQUM5RixVQUFNLGFBQWEsUUFBUTtBQUczQixRQUFJLFFBQVEsUUFBUSxZQUFZO0FBRTdCLFVBQUksT0FBTyx1QkFBdUIsVUFBVSxhQUFhO0FBQ3RELFlBQUk7QUFFRCxnQkFBTSxhQUFhLE1BQU0sZUFBZTtBQUN4QyxnQkFBTSxXQUFXLHFCQUFxQjtBQUFBLFlBQ25DLGFBQWE7QUFBQSxZQUFRLFFBQVEsV0FBVztBQUFBLFlBQU8sUUFBUSxZQUFZO0FBQUEsVUFDdEUsQ0FBQztBQUFBLFFBQ0osU0FBUSxHQUFHO0FBQUEsUUFBQztBQUFBLE1BQ2Y7QUFDQSwrQkFBeUIsSUFBSTtBQUM3QjtBQUFBLElBQ0g7QUFFQSxRQUFJLEtBQUs7QUFFTiwrQkFBeUIsR0FBRztBQUU1QixVQUFJLE9BQU8sdUJBQXVCLFVBQVUsYUFBYTtBQUN0RCxZQUFJO0FBRUQsZ0JBQU0sYUFBYSxNQUFNLGVBQWU7QUFDeEMsZ0JBQU0sV0FBVyxxQkFBcUI7QUFBQSxZQUNuQyxhQUFhO0FBQUEsWUFBUSxRQUFRLElBQUk7QUFBQSxZQUFPLFFBQVEsWUFBWTtBQUFBLFlBQUksVUFBVSxZQUFZO0FBQUEsVUFDekYsQ0FBQztBQUFBLFFBQ0osU0FBUyxHQUFRO0FBRWQsbUNBQXlCLElBQUk7QUFDN0IsZ0JBQU0sU0FBUyxTQUFTLFFBQVEsSUFBSSxLQUFLO0FBQ3pDLGdCQUFNLGFBQWEsU0FBUyxPQUFPLFdBQVc7QUFDOUMsZ0JBQU07QUFBQSxLQUFlLFVBQVU7QUFBQSxxQkFBNEM7QUFBQSxRQUM5RTtBQUNBO0FBQUEsTUFDSDtBQUFBLElBQ0g7QUFFQSw2QkFBeUIsR0FBRztBQUFBLEVBQzlCLEdBQUcsQ0FBQyxRQUFRLFdBQVcsQ0FBQztBQUd4QixRQUFNLENBQUMsd0JBQXdCLHlCQUF5QixJQUFJLFNBQXdCLElBQUk7QUFDeEYsUUFBTSxDQUFDLHNCQUFzQix1QkFBdUIsSUFBSSxTQUF3QixJQUFJO0FBQ3BGLFFBQU0sQ0FBQyx3QkFBd0IseUJBQXlCLElBQUksU0FBd0IsSUFBSTtBQUd4RixRQUFNLGNBQWMsT0FBdUIsSUFBSTtBQUMvQyxRQUFNLFlBQVksT0FBdUIsSUFBSTtBQUM3QyxRQUFNLGNBQWMsT0FBdUIsSUFBSTtBQUcvQyxZQUFVLE1BQU07QUFDZCxhQUFTLG1CQUFtQixPQUFtQjtBQUM3QyxVQUFJLFlBQVksV0FBVyxDQUFDLFlBQVksUUFBUSxTQUFTLE1BQU0sTUFBYyxHQUFHO0FBQzlFLGtDQUEwQixJQUFJO0FBQUEsTUFDaEM7QUFDQSxVQUFJLFVBQVUsV0FBVyxDQUFDLFVBQVUsUUFBUSxTQUFTLE1BQU0sTUFBYyxHQUFHO0FBQzFFLGdDQUF3QixJQUFJO0FBQUEsTUFDOUI7QUFDQSxVQUFJLFlBQVksV0FBVyxDQUFDLFlBQVksUUFBUSxTQUFTLE1BQU0sTUFBYyxHQUFHO0FBQzlFLGtDQUEwQixJQUFJO0FBQUEsTUFDaEM7QUFDQSxVQUFJLGVBQWUsV0FBVyxDQUFDLGVBQWUsUUFBUSxTQUFTLE1BQU0sTUFBYyxHQUFHO0FBQ3BGLDhCQUFzQixJQUFJO0FBQUEsTUFDNUI7QUFBQSxJQUNGO0FBQ0EsYUFBUyxpQkFBaUIsYUFBYSxrQkFBa0I7QUFDekQsV0FBTyxNQUFNLFNBQVMsb0JBQW9CLGFBQWEsa0JBQWtCO0FBQUEsRUFDM0UsR0FBRyxDQUFDLENBQUM7QUFFTCxRQUFNLGtCQUFrQixNQUFNO0FBQzVCLGtCQUFjLEVBQUU7QUFDaEIsc0JBQWtCLEtBQUs7QUFDdkIsb0JBQWdCLEtBQUs7QUFDckIseUJBQXFCLENBQUMsQ0FBQztBQUFBLEVBQ3pCO0FBRUEsUUFBTSxVQUFVLFFBQVEsTUFBTSxJQUFJLElBQUksYUFBYSxJQUFJLE9BQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztBQUV2RixRQUFNLFdBQVcsUUFBUSxNQUFNLElBQUksS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLENBQUM7QUFHMUQsUUFBTSxnQ0FBZ0MsUUFBUSxNQUFNLGFBQ2pELE9BQU8sU0FBTztBQUViLFFBQUksbUJBQW1CLFNBQVMsSUFBSSxhQUFhLGVBQWdCLFFBQU87QUFHeEUsUUFBSSxpQkFBaUIsU0FBUyxJQUFJLFdBQVcsYUFBYyxRQUFPO0FBR2xFLFFBQUksV0FBVyxLQUFLLE1BQU0sSUFBSTtBQUM1QixZQUFNLE9BQU8sV0FBVyxZQUFZO0FBQ3BDLFlBQU0sWUFBWSxJQUFJLEdBQUcsWUFBWSxFQUFFLFNBQVMsSUFBSTtBQUNwRCxZQUFNLGVBQWUsSUFBSSxNQUFNLFlBQVksRUFBRSxTQUFTLElBQUk7QUFDMUQsWUFBTSxtQkFBbUIsSUFBSSxVQUFVLEtBQUssT0FBSyxFQUFFLEtBQUssWUFBWSxFQUFFLFNBQVMsSUFBSSxDQUFDO0FBQ3BGLFlBQU0saUJBQWlCLElBQUksUUFBUSxZQUFZLEVBQUUsU0FBUyxJQUFJO0FBRTlELFVBQUksZ0JBQWdCO0FBQ3BCLFVBQUksSUFBSSxlQUFlO0FBQ3JCLHdCQUFnQixPQUFPLE9BQU8sSUFBSSxhQUFhLEVBQUUsS0FBSyxPQUFLLEVBQUUsWUFBWSxFQUFFLFNBQVMsSUFBSSxDQUFDO0FBQUEsTUFDM0Y7QUFFQSxVQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLGNBQWUsUUFBTztBQUFBLElBQ3BHO0FBR0EsZUFBVyxTQUFTLE9BQU8sS0FBSyxpQkFBaUIsR0FBRztBQUNsRCxZQUFNLFVBQVUsa0JBQWtCLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWTtBQUM1RCxVQUFJLFlBQVksR0FBSTtBQUVwQixVQUFJLFVBQVUsUUFBUSxDQUFDLElBQUksR0FBRyxZQUFZLEVBQUUsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUN0RSxVQUFJLFVBQVUsV0FBVyxDQUFDLElBQUksTUFBTSxZQUFZLEVBQUUsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUM1RSxVQUFJLFVBQVUsWUFBWSxDQUFDLElBQUksT0FBTyxZQUFZLEVBQUUsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUM5RSxVQUFJLFVBQVUsY0FBYyxDQUFDLElBQUksU0FBUyxZQUFZLEVBQUUsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUNsRixVQUFJLFVBQVUsYUFBYSxDQUFDLElBQUksUUFBUSxZQUFZLEVBQUUsU0FBUyxPQUFPLEVBQUcsUUFBTztBQUNoRixVQUFJLFVBQVUsZUFBZSxDQUFDLElBQUksVUFBVSxLQUFLLE9BQUssRUFBRSxLQUFLLFlBQVksRUFBRSxTQUFTLE9BQU8sQ0FBQyxFQUFHLFFBQU87QUFHdEcsVUFBSSxDQUFDLENBQUMsTUFBSyxTQUFRLFVBQVMsWUFBVyxXQUFVLFdBQVcsRUFBRSxTQUFTLEtBQUssR0FBRztBQUM1RSxjQUFNLE1BQU0sSUFBSSxnQkFBZ0IsS0FBSyxLQUFLO0FBQzFDLFlBQUksQ0FBQyxJQUFJLFlBQVksRUFBRSxTQUFTLE9BQU8sRUFBRyxRQUFPO0FBQUEsTUFDcEQ7QUFBQSxJQUNGO0FBRUEsV0FBTztBQUFBLEVBQ1QsQ0FBQyxFQUNBLEtBQUssQ0FBQyxHQUFHLE1BQU07QUFDZCxRQUFJLENBQUMsVUFBVyxRQUFPO0FBRXZCLFFBQUksT0FBTyxFQUFFLFNBQVMsS0FBSztBQUMzQixRQUFJLE9BQU8sRUFBRSxTQUFTLEtBQUs7QUFFM0IsUUFBSSxjQUFjLE1BQU07QUFFckIsWUFBTSxPQUFPLFNBQVMsT0FBTyxJQUFJLEVBQUUsUUFBUSxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUs7QUFDL0QsWUFBTSxPQUFPLFNBQVMsT0FBTyxJQUFJLEVBQUUsUUFBUSxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUs7QUFDL0QsYUFBTyxrQkFBa0IsUUFBUSxPQUFPLE9BQU8sT0FBTztBQUFBLElBQ3pEO0FBRUEsUUFBSSxjQUFjLFdBQVc7QUFDM0IsWUFBTSxRQUFRLElBQUksS0FBSyxJQUFjLEVBQUUsUUFBUTtBQUMvQyxZQUFNLFFBQVEsSUFBSSxLQUFLLElBQWMsRUFBRSxRQUFRO0FBQy9DLGFBQU8sa0JBQWtCLFFBQVEsUUFBUSxRQUFRLFFBQVE7QUFBQSxJQUMzRDtBQUVBLFVBQU0sT0FBTyxPQUFPLElBQUksRUFBRSxZQUFZO0FBQ3RDLFVBQU0sT0FBTyxPQUFPLElBQUksRUFBRSxZQUFZO0FBRXRDLFdBQU8sa0JBQWtCLFFBQVEsU0FBUyxRQUFRLE1BQU0sSUFBSSxJQUFJLFNBQVMsUUFBUSxNQUFNLElBQUk7QUFBQSxFQUM3RixDQUFDLEdBQUcsQ0FBQyxjQUFjLGdCQUFnQixjQUFjLFlBQVksbUJBQW1CLFdBQVcsZUFBZSxRQUFRLENBQUM7QUFHckgsUUFBTSxrQkFBa0IsQ0FBQyxZQUFxQjtBQUM1QyxRQUFJLFNBQVM7QUFDWCxZQUFNLGlCQUFpQiw4QkFBOEIsSUFBSSxPQUFLLEVBQUUsRUFBRTtBQUNsRSxxQkFBZSxjQUFjO0FBQUEsSUFDL0IsT0FBTztBQUNMLHFCQUFlLENBQUMsQ0FBQztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUVBLFFBQU0sa0JBQWtCLFlBQVksQ0FBQyxJQUFZLFlBQXFCO0FBQ3BFLFFBQUksU0FBUztBQUNYLHFCQUFlLFVBQVEsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDO0FBQUEsSUFDdEMsT0FBTztBQUNMLHFCQUFlLFVBQVEsS0FBSyxPQUFPLE9BQUssTUFBTSxFQUFFLENBQUM7QUFBQSxJQUNuRDtBQUFBLEVBQ0YsR0FBRyxDQUFDLENBQUM7QUFHTCxRQUFNLGFBQWEsQ0FBQyxVQUFpRDtBQUNuRSxRQUFJLGNBQWMsT0FBTztBQUN2Qix1QkFBaUIsVUFBUyxTQUFTLFFBQVEsU0FBUyxLQUFNO0FBQUEsSUFDNUQsT0FBTztBQUNMLG1CQUFhLEtBQUs7QUFDbEIsdUJBQWlCLEtBQUs7QUFBQSxJQUN4QjtBQUFBLEVBQ0Y7QUFHQSxRQUFNLGVBQWUsTUFBTTtBQUV6QixVQUFNLGVBQWUsYUFBYSxPQUFPLENBQUMsS0FBSyxNQUFNO0FBQ25ELFlBQU0sUUFBUSxFQUFFLEdBQUcsTUFBTSxXQUFXO0FBQ3BDLFVBQUksT0FBTztBQUNULGNBQU0sTUFBTSxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUU7QUFDakMsZUFBTyxNQUFNLE1BQU0sTUFBTTtBQUFBLE1BQzNCO0FBQ0EsYUFBTztBQUFBLElBQ1QsR0FBRyxDQUFDO0FBRUosVUFBTSxTQUFTLE9BQU8sT0FBTyxlQUFlLENBQUMsRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBRy9ELFVBQU0sa0JBQWtCLGNBQWMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxXQUFXLE1BQU0sT0FBTyxXQUFXLEdBQUc7QUFFbEgsVUFBTSxTQUFzQjtBQUFBLE1BQzFCLElBQUk7QUFBQSxNQUNKLE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxNQUNWLFdBQVcsQ0FBQyxlQUFlO0FBQUE7QUFBQSxNQUMzQixVQUFTLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUFBLE1BQzlDLFFBQVE7QUFBQSxNQUNSLGVBQWUsQ0FBQztBQUFBLElBQ2xCO0FBRUEsb0JBQWdCLFVBQVEsQ0FBQyxHQUFHLE1BQU0sTUFBTSxDQUFDO0FBRXpDLHdCQUFvQixFQUFFLE9BQU8sUUFBUSxPQUFPLFFBQVEsQ0FBQztBQUFBLEVBQ3ZEO0FBR0EsUUFBTSx1QkFBdUIsWUFBWSxNQUFNO0FBQzdDLFFBQUksWUFBWSxXQUFXLEVBQUc7QUFDOUIsUUFBSSxRQUFRLE9BQU8sWUFBWSxNQUFNLGdDQUFnQyxHQUFHO0FBQ3JFLHNCQUFnQixVQUFRLEtBQUssT0FBTyxPQUFLLENBQUMsWUFBWSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDckUscUJBQWUsQ0FBQyxDQUFDO0FBQUEsSUFDcEI7QUFBQSxFQUNGLEdBQUcsQ0FBQyxhQUFhLGVBQWUsQ0FBQztBQUdqQyxRQUFNLHlCQUF5QixZQUFZLENBQUMsT0FBZSxPQUFlLFVBQWU7QUFDdkYsb0JBQWdCLFVBQVEsS0FBSyxJQUFJLFNBQU87QUFDdEMsVUFBSSxJQUFJLE9BQU8sT0FBTztBQUVwQixZQUFJLFVBQVUsTUFBTTtBQUNsQixjQUFJLEtBQUssS0FBSyxPQUFLLEVBQUUsT0FBTyxTQUFTLEVBQUUsT0FBTyxLQUFLLEdBQUc7QUFDcEQsa0JBQU0sZ0JBQWdCO0FBQ3RCLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPLEVBQUUsR0FBRyxLQUFLLElBQUksTUFBTTtBQUFBLFFBQzdCO0FBQ0EsWUFBSSxVQUFVLFFBQVMsUUFBTyxFQUFFLEdBQUcsS0FBSyxPQUFPLE1BQU07QUFDckQsWUFBSSxVQUFVLFdBQVksUUFBTyxFQUFFLEdBQUcsS0FBSyxVQUFVLE1BQWtCO0FBQ3ZFLFlBQUksVUFBVSxTQUFVLFFBQU8sRUFBRSxHQUFHLEtBQUssUUFBUSxNQUFnQjtBQUNqRSxZQUFJLFVBQVUsVUFBVyxRQUFPLEVBQUUsR0FBRyxLQUFLLFNBQVMsTUFBTTtBQUd6RCxjQUFNLGdCQUFnQixFQUFFLEdBQUcsSUFBSSxlQUFlLENBQUMsS0FBSyxHQUFHLE1BQU07QUFDN0QsZUFBTyxFQUFFLEdBQUcsS0FBSyxlQUFlLGNBQWM7QUFBQSxNQUNoRDtBQUNBLGFBQU87QUFBQSxJQUNULENBQUMsQ0FBQztBQUFBLEVBQ0osR0FBRyxDQUFDLGVBQWUsQ0FBQztBQUdwQixRQUFNLDhCQUE4QixNQUFNO0FBQ3hDLFFBQUksQ0FBQyxjQUFjLEtBQUssRUFBRztBQUUzQixRQUFJLG9CQUFvQjtBQUN0QixpQkFBVyxVQUFRLEtBQUssSUFBSSxPQUFLO0FBQzlCLFlBQUksRUFBRSxPQUFPLG9CQUFvQjtBQUM5QixjQUFJLFVBQVcsa0JBQWtCLFlBQVksa0JBQWtCLFlBQWEsa0JBQWtCLFdBQVcsd0JBQXdCLG9CQUFvQixNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU8sSUFBSTtBQUVyTSxjQUFJLGtCQUFrQixVQUFVO0FBQzdCLGtCQUFNLGlCQUFpQixvQkFBSSxJQUFZO0FBQ3ZDLHlCQUFhLFFBQVEsU0FBTztBQUN6QixvQkFBTSxNQUFNLElBQUksZ0JBQWdCLGtCQUFrQjtBQUNsRCxrQkFBSSxLQUFLO0FBQ04sK0JBQWUsSUFBSSxJQUFJLEtBQUssQ0FBQztBQUFBLGNBQ2hDO0FBQUEsWUFDSCxDQUFDO0FBQ0QsZ0JBQUksU0FBUztBQUNYLDZCQUFlLFFBQVEsU0FBTztBQUMzQixvQkFBSSxDQUFDLFFBQVMsU0FBUyxHQUFHLEdBQUc7QUFDMUIsMEJBQVMsS0FBSyxHQUFHO0FBQUEsZ0JBQ3BCO0FBQUEsY0FDSCxDQUFDO0FBQUEsWUFDSDtBQUFBLFVBQ0g7QUFFQSxpQkFBTztBQUFBLFlBQ0osR0FBRztBQUFBLFlBQ0gsT0FBTyxjQUFjLEtBQUs7QUFBQSxZQUMxQixNQUFNO0FBQUEsWUFDTjtBQUFBLFlBQ0EsU0FBUyxrQkFBa0IsWUFBWSxlQUFlO0FBQUEsWUFDdEQsY0FBYyxrQkFBa0IsV0FBVyxvQkFBb0I7QUFBQSxZQUMvRCxhQUFhLGtCQUFrQixXQUFXLG1CQUFtQjtBQUFBLFlBQzdELHFCQUFxQixrQkFBa0IsaUJBQWlCLDJCQUEyQjtBQUFBLFlBQ25GLG1CQUFtQixrQkFBa0IsaUJBQWlCLHlCQUF5QjtBQUFBLFlBQy9FLHVCQUF1QixrQkFBa0IsaUJBQWlCLDZCQUE2QjtBQUFBLFlBQ3ZGLGFBQWEsa0JBQWtCLFdBQVcsbUJBQW1CO0FBQUEsWUFDN0QsZUFBZSxrQkFBa0IsV0FBVyxxQkFBcUI7QUFBQSxZQUNqRSxhQUFhLGtCQUFrQixXQUFXLG1CQUFtQjtBQUFBLFlBQzdELG9CQUFvQixrQkFBa0IsV0FBVywwQkFBMEI7QUFBQSxZQUMzRSx3QkFBd0Isa0JBQWtCLFdBQVcsOEJBQThCO0FBQUEsWUFDbkYseUJBQXlCLGtCQUFrQixXQUFXLCtCQUErQjtBQUFBLFlBQ3JGLGVBQWUsdUJBQXVCLEtBQUssT0FBTyxrQkFBa0IsSUFBSTtBQUFBLFVBQzNFO0FBQUEsUUFDSDtBQUNBLGVBQU87QUFBQSxNQUNWLENBQUMsQ0FBQztBQUNGLDRCQUFzQixLQUFLO0FBQzNCLDRCQUFzQixJQUFJO0FBRTFCLHVCQUFpQixFQUFFO0FBQ25CLHVCQUFpQixNQUFNO0FBQ3ZCLHNCQUFnQixFQUFFO0FBQ2xCLDBCQUFvQixFQUFFO0FBQ3RCLDJCQUFxQixZQUFZO0FBQ2pDLDBCQUFvQixFQUFFO0FBQ3RCLDRCQUFzQixPQUFPO0FBQzdCLCtCQUF5QixFQUFFO0FBQzNCLG9DQUE4QixDQUFDO0FBQy9CLDRCQUFzQixFQUFFO0FBQ3hCLDBCQUFvQixFQUFFO0FBQ3RCLGlDQUEyQixFQUFFO0FBQzdCLHFDQUErQixFQUFFO0FBQ2pDLHNDQUFnQyxFQUFFO0FBQ2xDO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxVQUFVLGNBQWMsS0FBSyxFQUFFLFFBQVEsUUFBUSxHQUFHLENBQUM7QUFHakUsUUFBSSxRQUFRLEtBQUssT0FBSyxFQUFFLFVBQVUsY0FBYyxLQUFLLEtBQUssRUFBRSxPQUFPLEtBQUssR0FBRztBQUN6RSxZQUFNLGtCQUFrQjtBQUN4QjtBQUFBLElBQ0Y7QUFFQSxlQUFXLFVBQVEsQ0FBQyxHQUFHLE1BQU07QUFBQSxNQUMzQixJQUFJO0FBQUEsTUFDSixPQUFPLGNBQWMsS0FBSztBQUFBLE1BQzFCLFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLFNBQVUsa0JBQWtCLFlBQVksa0JBQWtCLFlBQWEsa0JBQWtCLFdBQVcsd0JBQXdCLG9CQUFvQixNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU8sSUFBSTtBQUFBLE1BQ2hNLFNBQVMsa0JBQWtCLFlBQVksZUFBZTtBQUFBLE1BQ3RELGNBQWMsa0JBQWtCLFdBQVcsb0JBQW9CO0FBQUEsTUFDL0QsYUFBYSxrQkFBa0IsV0FBVyxtQkFBbUI7QUFBQSxNQUM3RCxxQkFBcUIsa0JBQWtCLGlCQUFpQiwyQkFBMkI7QUFBQSxNQUNuRixtQkFBbUIsa0JBQWtCLGlCQUFpQix5QkFBeUI7QUFBQSxNQUMvRSx1QkFBdUIsa0JBQWtCLGlCQUFpQiw2QkFBNkI7QUFBQSxNQUN2RixhQUFhLGtCQUFrQixXQUFXLG1CQUFtQjtBQUFBLE1BQzdELGVBQWUsa0JBQWtCLFdBQVcscUJBQXFCO0FBQUEsTUFDakUsYUFBYSxrQkFBa0IsV0FBVyxtQkFBbUI7QUFBQSxNQUM3RCxvQkFBb0Isa0JBQWtCLFdBQVcsMEJBQTBCO0FBQUEsTUFDM0Usd0JBQXdCLGtCQUFrQixXQUFXLDhCQUE4QjtBQUFBLE1BQ25GLHlCQUF5QixrQkFBa0IsV0FBVywrQkFBK0I7QUFBQSxNQUNyRixlQUFlLHVCQUF1QixLQUFLLE9BQU8sa0JBQWtCLElBQUk7QUFBQSxJQUMxRSxDQUFDLENBQUM7QUFHRixxQkFBaUIsRUFBRTtBQUNuQixxQkFBaUIsTUFBTTtBQUN2QixvQkFBZ0IsRUFBRTtBQUNsQix3QkFBb0IsRUFBRTtBQUN0Qix5QkFBcUIsWUFBWTtBQUNqQyx3QkFBb0IsRUFBRTtBQUN0QiwwQkFBc0IsT0FBTztBQUM3QixrQ0FBOEIsQ0FBQztBQUMvQiwwQkFBc0IsRUFBRTtBQUN4Qix3QkFBb0IsRUFBRTtBQUN0QiwrQkFBMkIsRUFBRTtBQUM3QixtQ0FBK0IsRUFBRTtBQUNqQyxvQ0FBZ0MsRUFBRTtBQUNsQywwQkFBc0IsS0FBSztBQUFBLEVBQzdCO0FBR0EsUUFBTSwyQkFBMkIsQ0FBQyxVQUFrQjtBQUNsRCxzQkFBa0IsS0FBSztBQUFBLEVBQ3pCO0FBRUEsUUFBTSxzQkFBc0IsTUFBTTtBQUNoQyxRQUFJLENBQUMsZUFBZ0I7QUFDckIsZUFBVyxVQUFRLEtBQUssT0FBTyxPQUFLLEVBQUUsT0FBTyxjQUFjLENBQUM7QUFFNUQsb0JBQWdCLFVBQVEsS0FBSyxJQUFJLFNBQU87QUFDdEMsVUFBSSxJQUFJLGVBQWU7QUFDckIsY0FBTSxPQUFPLEVBQUUsR0FBRyxJQUFJLGNBQWM7QUFDcEMsZUFBTyxLQUFLLGNBQWM7QUFDMUIsZUFBTyxFQUFFLEdBQUcsS0FBSyxlQUFlLEtBQUs7QUFBQSxNQUN2QztBQUNBLGFBQU87QUFBQSxJQUNULENBQUMsQ0FBQztBQUNGLHNCQUFrQixJQUFJO0FBQUEsRUFDeEI7QUFHQSxRQUFNLG9CQUFvQixZQUFZO0FBQ3BDLFFBQUk7QUFDRixZQUFNLFdBQVcsSUFBSSxRQUFRLFNBQVM7QUFDdEMsWUFBTSxRQUFRLFNBQVMsYUFBYSxXQUFXO0FBQUEsUUFDN0MsT0FBTyxDQUFDLEVBQUUsT0FBTyxVQUFVLFFBQVEsR0FBRyxRQUFRLEVBQUUsQ0FBQztBQUFBLE1BQ25ELENBQUM7QUFFRCxZQUFNLFdBQVcsUUFBUTtBQUN6QixZQUFNLGdCQUFnQixNQUFNLFVBQVUsUUFBUSxFQUFFO0FBR2hELFlBQU0sT0FBTyxDQUFDLEVBQUUsU0FBUztBQUN6QixZQUFNLFdBQVcsTUFBTSxhQUFhLEdBQUc7QUFDdkMsWUFBTSxZQUFZLE1BQU0sUUFBUSxJQUFJO0FBQ3BDLGdCQUFVLFFBQVE7QUFDbEIsZ0JBQVUsT0FBTyxFQUFFLE1BQU0sYUFBYSxNQUFNLElBQUksTUFBTSxNQUFNLE9BQU8sRUFBRSxNQUFNLFdBQVcsRUFBRTtBQUN4RixnQkFBVSxZQUFZLEVBQUUsWUFBWSxVQUFVLFVBQVUsU0FBUztBQUNqRSxnQkFBVSxPQUFPO0FBQUEsUUFDZixNQUFNO0FBQUEsUUFDTixVQUFVO0FBQUEsUUFDVixRQUFRO0FBQUEsUUFDUixPQUFPO0FBQUEsVUFDTCxFQUFFLFVBQVUsR0FBRyxPQUFPLEVBQUUsTUFBTSxXQUFXLEVBQUU7QUFBQSxVQUMzQyxFQUFFLFVBQVUsR0FBRyxPQUFPLEVBQUUsTUFBTSxXQUFXLEVBQUU7QUFBQSxRQUM3QztBQUFBLE1BQ0Y7QUFFQSxVQUFJLFlBQVksR0FBRztBQUNqQixjQUFNLGNBQWMsTUFBTSxVQUFVLFdBQVcsQ0FBQyxFQUFFO0FBQ2xELGNBQU0sV0FBVyxHQUFHLFdBQVcsS0FBSyxhQUFhLEdBQUc7QUFDcEQsY0FBTSxXQUFXLEdBQUcsV0FBVyxLQUFLLGFBQWEsR0FBRztBQUVwRCxjQUFNLFFBQVEsTUFBTSxRQUFRLEdBQUcsV0FBVyxHQUFHO0FBQzdDLGNBQU0sWUFBWSxhQUFhLE9BQU8sT0FBSyxFQUFFLFdBQVcsTUFBTSxFQUFFO0FBQ2hFLGNBQU0sV0FBVyxLQUFLLE1BQU8sWUFBWSxhQUFhLFNBQVUsR0FBRyxLQUFLO0FBQ3hFLGNBQU0sUUFBUSxpQkFBaUIsUUFBUTtBQUN2QyxjQUFNLE9BQU8sRUFBRSxNQUFNLGFBQWEsT0FBTyxFQUFFLE1BQU0sV0FBVyxHQUFHLE1BQU0sS0FBSztBQUMxRSxjQUFNLFlBQVksRUFBRSxZQUFZLFNBQVMsVUFBVSxTQUFTO0FBRTVELGNBQU0sUUFBUSxNQUFNLFFBQVEsR0FBRyxXQUFXLEdBQUc7QUFDN0MsY0FBTSxlQUFlLGFBQWEsT0FBTyxPQUFLLEVBQUUsV0FBVyxVQUFVLEVBQUUsV0FBVyxhQUFhLEVBQUU7QUFDakcsY0FBTSxRQUFRLG1CQUFtQixZQUFZO0FBQzdDLGNBQU0sT0FBTyxFQUFFLE1BQU0sYUFBYSxPQUFPLEVBQUUsTUFBTSxXQUFXLEdBQUcsTUFBTSxLQUFLO0FBQzFFLGNBQU0sWUFBWSxFQUFFLFlBQVksU0FBUyxVQUFVLFNBQVM7QUFBQSxNQUM5RDtBQUdBLFlBQU0sYUFBYSxNQUFNLE9BQU8sQ0FBQztBQUNqQyxZQUFNLGFBQWEsTUFBTSxPQUFPLENBQUM7QUFFakMsVUFBSSxlQUFtQztBQUN2QyxVQUFJLGdCQUFnQjtBQUdwQixjQUFRLFFBQVEsQ0FBQyxLQUFLLFVBQVU7QUFDOUIsY0FBTSxRQUFRLFdBQVcsUUFBUSxRQUFRLENBQUM7QUFDMUMsY0FBTSxRQUFRLFdBQVcsUUFBUSxRQUFRLENBQUM7QUFFMUMsWUFBSSxJQUFJLFdBQVc7QUFDaEIsZ0JBQU0sUUFBUSxJQUFJO0FBQ2xCLGdCQUFNLFFBQVEsSUFBSTtBQUFBLFFBQ3JCLE9BQU87QUFDSixnQkFBTSxRQUFRLElBQUk7QUFDbEIsZ0JBQU0sUUFBUSxJQUFJO0FBQUEsUUFDckI7QUFFQSxjQUFNLE9BQU87QUFBQSxVQUNYLE1BQU07QUFBQSxVQUFZLFVBQVU7QUFBQSxVQUFTLFFBQVE7QUFBQSxVQUM3QyxPQUFPLENBQUMsRUFBRSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLEdBQUcsRUFBRSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLENBQUM7QUFBQSxRQUNwRztBQUNBLGNBQU0sT0FBTyxFQUFFLE1BQU0sTUFBTSxPQUFPLEVBQUUsTUFBTSxXQUFXLEdBQUcsTUFBTSxZQUFZO0FBQzFFLGNBQU0sWUFBWSxFQUFFLFlBQVksVUFBVSxVQUFVLFNBQVM7QUFFN0QsY0FBTSxPQUFPO0FBQUEsVUFDWCxNQUFNO0FBQUEsVUFBWSxVQUFVO0FBQUEsVUFBUyxRQUFRO0FBQUEsVUFDN0MsT0FBTyxDQUFDLEVBQUUsVUFBVSxHQUFHLE9BQU8sRUFBRSxNQUFNLFdBQVcsRUFBRSxHQUFHLEVBQUUsVUFBVSxHQUFHLE9BQU8sRUFBRSxNQUFNLFdBQVcsRUFBRSxDQUFDO0FBQUEsUUFDcEc7QUFDQSxjQUFNLE9BQU8sRUFBRSxNQUFNLE9BQU8sT0FBTyxFQUFFLE1BQU0sV0FBVyxHQUFHLE1BQU0sWUFBWTtBQUMzRSxjQUFNLFlBQVksRUFBRSxZQUFZLFVBQVUsVUFBVSxTQUFTO0FBRTdELGNBQU0sU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLFVBQVUsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLEdBQUcsS0FBSyxFQUFFLE9BQU8sVUFBVSxPQUFPLEVBQUUsTUFBTSxXQUFXLEVBQUUsRUFBQztBQUMvSCxjQUFNLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxVQUFVLE9BQU8sRUFBRSxNQUFNLFdBQVcsRUFBRSxHQUFHLFFBQVEsRUFBRSxPQUFPLFVBQVUsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLEVBQUU7QUFFbkksY0FBTSxVQUFVLFFBQVEsQ0FBQyxFQUFFLFFBQVEsS0FBSyxJQUFJLEtBQUssYUFBYSxJQUFJLEVBQUUsS0FBSyxPQUFPLEdBQUc7QUFBQSxNQUNyRixDQUFDO0FBR0QsY0FBUSxRQUFRLENBQUMsS0FBSyxVQUFVO0FBQzlCLFlBQUksSUFBSSxXQUFXO0FBQ2hCLGNBQUksSUFBSSxjQUFjLGNBQWM7QUFDaEMsZ0JBQUksZ0JBQWdCLGtCQUFrQixJQUFJO0FBQ3RDLG9CQUFNLFlBQVksV0FBVyxRQUFRLGdCQUFnQixDQUFDO0FBQ3RELG9CQUFNLFVBQVUsV0FBVyxRQUFRLEtBQUs7QUFDeEMsa0JBQUksVUFBVSxZQUFZLFFBQVEsUUFBUyxPQUFNLFdBQVcsR0FBRyxVQUFVLE9BQU8sSUFBSSxRQUFRLE9BQU8sRUFBRTtBQUFBLFlBQ3pHO0FBQ0EsMkJBQWUsSUFBSTtBQUNuQiw0QkFBZ0I7QUFBQSxVQUNwQjtBQUFBLFFBQ0gsT0FBTztBQUNKLGNBQUksZ0JBQWdCLGtCQUFrQixJQUFJO0FBQ3RDLGtCQUFNLFlBQVksV0FBVyxRQUFRLGdCQUFnQixDQUFDO0FBQ3RELGtCQUFNLFVBQVUsV0FBVyxRQUFRLEtBQUs7QUFDeEMsZ0JBQUksVUFBVSxZQUFZLFFBQVEsUUFBUyxPQUFNLFdBQVcsR0FBRyxVQUFVLE9BQU8sSUFBSSxRQUFRLE9BQU8sRUFBRTtBQUNyRywyQkFBZTtBQUNmLDRCQUFnQjtBQUFBLFVBQ3BCO0FBQ0EsZ0JBQU0sUUFBUSxXQUFXLFFBQVEsUUFBUSxDQUFDO0FBQzFDLGdCQUFNLFFBQVEsV0FBVyxRQUFRLFFBQVEsQ0FBQztBQUMxQyxnQkFBTSxXQUFXLEdBQUcsTUFBTSxPQUFPLElBQUksTUFBTSxPQUFPLEVBQUU7QUFBQSxRQUN2RDtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksZ0JBQWdCLGtCQUFrQixJQUFJO0FBQ3RDLGNBQU0sWUFBWSxXQUFXLFFBQVEsZ0JBQWdCLENBQUM7QUFDdEQsY0FBTSxVQUFVLFdBQVcsUUFBUSxRQUFRLE1BQU07QUFDakQsWUFBSSxVQUFVLFlBQVksUUFBUSxRQUFTLE9BQU0sV0FBVyxHQUFHLFVBQVUsT0FBTyxJQUFJLFFBQVEsT0FBTyxFQUFFO0FBQUEsTUFDekc7QUFFQSxZQUFNLGFBQWEsTUFBTSxhQUFhO0FBR3RDLG1CQUFhLFFBQVEsQ0FBQyxLQUFLLE1BQU07QUFDL0IsY0FBTSxXQUFXLElBQUk7QUFDckIsY0FBTSxNQUFNLE1BQU0sT0FBTyxRQUFRO0FBRWpDLFlBQUksWUFBWSxJQUFJLFdBQVc7QUFDL0IsWUFBSSxTQUFTLElBQUksYUFBYTtBQUU5QixnQkFBUSxRQUFRLENBQUMsS0FBSyxXQUFXO0FBQy9CLGdCQUFNLE9BQU8sSUFBSSxRQUFRLFNBQVMsQ0FBQztBQUNuQyxjQUFJLE1BQVc7QUFFZixjQUFJLElBQUksT0FBTyxLQUFNLE9BQU0sSUFBSTtBQUFBLG1CQUN0QixJQUFJLE9BQU8sUUFBUyxPQUFNLElBQUksU0FBUztBQUFBLG1CQUN2QyxJQUFJLE9BQU8sV0FBWSxPQUFNLElBQUksWUFBWTtBQUFBLG1CQUM3QyxJQUFJLE9BQU8sWUFBYSxRQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxPQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssSUFBSTtBQUFBLG1CQUM5RSxJQUFJLE9BQU8sVUFBVyxPQUFNLElBQUksV0FBVztBQUFBLG1CQUMzQyxJQUFJLE9BQU8sU0FBVSxPQUFNLElBQUksVUFBVTtBQUFBLG1CQUN6QyxJQUFJLFNBQVMsU0FBVSxPQUFNLElBQUk7QUFBQSxtQkFDakMsSUFBSSxTQUFTLGdCQUFnQjtBQUNuQyxrQkFBTSxZQUFZLElBQUksc0JBQXNCLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxJQUFJLG1CQUFtQixJQUFJLFFBQVEsS0FBSyxPQUFLLEVBQUUsTUFBTSxTQUFTLElBQUksQ0FBQztBQUMxSSxrQkFBTSxjQUFjLElBQUksb0JBQW9CLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxJQUFJLGlCQUFpQixJQUFJLFFBQVEsS0FBSyxPQUFLLEVBQUUsTUFBTSxTQUFTLElBQUksQ0FBQztBQUN4SSxnQkFBSSxhQUFhLGFBQWE7QUFDNUIsb0JBQU0sZUFBZSxPQUFPLElBQUksZ0JBQWdCLFVBQVUsRUFBRSxLQUFLLEdBQUcsRUFBRSxRQUFRLGNBQWMsRUFBRTtBQUM5RixvQkFBTSxTQUFTLE9BQU8sWUFBWSxLQUFLO0FBQ3ZDLG9CQUFNLE9BQU8sT0FBTyxJQUFJLGdCQUFnQixZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBWTtBQUMzRSxrQkFBSSxXQUFXO0FBQ2Ysa0JBQUksS0FBSyxTQUFTLEtBQUssS0FBSyxLQUFLLFNBQVMsS0FBSyxHQUFHO0FBQ2hELDJCQUFXO0FBQUEsY0FDYixXQUFXLEtBQUssU0FBUyxLQUFLLEdBQUc7QUFDL0IsMkJBQVcsU0FBUyxjQUFjO0FBQUEsY0FDcEMsV0FBVyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssU0FBUyxLQUFLLEdBQUc7QUFDdEQsMkJBQVcsU0FBUyxjQUFjO0FBQUEsY0FDcEM7QUFDQSxvQkFBTSxXQUFXLFdBQVcsY0FBYztBQUMxQyxvQkFBTSxpQkFBaUIsSUFBSSwwQkFBMEIsU0FBWSxJQUFJLHdCQUF3QjtBQUM3RixvQkFBTSxNQUFNLFFBQVEsSUFBSSxRQUFRLE1BQU0sU0FBUyxlQUFlLFFBQVcsRUFBRSx1QkFBdUIsZ0JBQWdCLHVCQUF1QixlQUFlLENBQUM7QUFBQSxZQUMzSixPQUFPO0FBQ0wsb0JBQU07QUFBQSxZQUNSO0FBQUEsVUFDSCxXQUNTLElBQUksU0FBUyxXQUFXO0FBQzlCLGdCQUFJO0FBQ0Ysb0JBQU0sU0FBUSxvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbkQsb0JBQU0sT0FBTyxhQUFhLElBQUksV0FBVyxNQUFNLE9BQU87QUFDdEQsb0JBQU0sT0FBTyxLQUFLLEtBQUssT0FBTyxLQUFLLFNBQVMsSUFBSSxNQUFNLFFBQVEsY0FBYyxLQUFLLGNBQWMsS0FBSyxjQUFjLEdBQUcsQ0FBQztBQUFBLFlBQ3hILFNBQVMsR0FBRztBQUNWLG9CQUFNO0FBQUEsWUFDUjtBQUFBLFVBQ0gsV0FDUyxJQUFJLFNBQVMsVUFBVTtBQUM3QixrQkFBTSxZQUFZLGFBQWEsSUFBSSxlQUFlLEVBQUU7QUFDcEQsZ0JBQUksYUFBYSxJQUFJLHNCQUFzQixJQUFJLDBCQUEwQixJQUFJLHlCQUF5QjtBQUNuRyxvQkFBTSxRQUFRLElBQUksdUJBQXVCLFVBQVUsSUFBSSxRQUFRLElBQUksZ0JBQWdCLElBQUksa0JBQWtCO0FBQ3pHLGtCQUFJLE9BQU87QUFDUixzQkFBTSxhQUFhLFdBQVcsY0FBYyxLQUFLLENBQUMsTUFBVztBQUMxRCx3QkFBTSxPQUFPLElBQUksMkJBQTJCLFVBQVUsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLElBQUksc0JBQXVCO0FBQzdHLHlCQUFPLFNBQVM7QUFBQSxnQkFDbkIsQ0FBQztBQUNELG9CQUFJLFlBQVk7QUFDYix3QkFBTSxJQUFJLDRCQUE0QixVQUFVLFdBQVcsUUFBUSxXQUFXLGdCQUFnQixJQUFJLHVCQUF1QixLQUFLO0FBQzlILHNCQUFJLE9BQU8sQ0FBQyxNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQUssSUFBSSxrQkFBa0IsT0FBVyxPQUFNLE9BQU8sT0FBTyxHQUFHLEVBQUUsUUFBUSxJQUFJLGFBQWEsQ0FBQztBQUFBLGdCQUN6SDtBQUFBLGNBQ0g7QUFBQSxZQUNIO0FBQUEsVUFDSCxXQUNTLElBQUksU0FBUyxZQUFZO0FBQy9CLGtCQUFNLElBQUksZ0JBQWdCLElBQUksRUFBRSxLQUFLO0FBQUEsVUFDeEMsV0FDUyxJQUFJLFNBQVMsVUFBVTtBQUM3QixrQkFBTSxZQUFZLElBQUksZ0JBQWdCLElBQUksZUFBZSxFQUFFLEtBQUs7QUFDaEUsa0JBQU0sU0FBUyxVQUFVLE1BQU0sR0FBRyxFQUFFLElBQUksT0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUNyRSxrQkFBTSxhQUFhLE9BQU8sSUFBSSxTQUFPLGFBQWEsS0FBSyxPQUFLLEVBQUUsT0FBTyxHQUFHLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDekYsZ0JBQUksV0FBVyxTQUFTLEdBQUc7QUFDekIsa0JBQUksSUFBSSxrQkFBa0IsU0FBUztBQUNqQyxzQkFBTSxXQUFXLE9BQU8sU0FBUztBQUFBLGNBQ25DLFdBQVcsSUFBSSxrQkFBa0IsZ0JBQWdCO0FBQy9DLHNCQUFNLFlBQVksV0FBVyxPQUFPLE9BQUssRUFBRSxXQUFXLE1BQU0sRUFBRTtBQUM5RCxzQkFBTSxHQUFHLEtBQUssTUFBTyxZQUFZLFdBQVcsU0FBVSxHQUFHLENBQUM7QUFBQSxjQUM1RDtBQUFBLFlBQ0YsT0FBTztBQUNMLG9CQUFNO0FBQUEsWUFDUjtBQUFBLFVBQ0gsV0FDUyxJQUFJLFNBQVMsVUFBVTtBQUM3QixrQkFBTSxJQUFJLGdCQUFnQixJQUFJLEVBQUUsS0FBSztBQUFBLFVBQ3hDLFdBQ1MsSUFBSSxTQUFVLE9BQU0sSUFBSSxnQkFBZ0IsSUFBSSxFQUFFLEtBQUs7QUFHNUQsY0FBSSxtQkFBbUIsS0FBSyxPQUFPLEdBQUcsQ0FBQyxHQUFHO0FBQ3hDLGlCQUFLLFFBQVEsT0FBTyxHQUFHO0FBQ3ZCLGdCQUFJLElBQUksa0JBQWtCLFFBQVc7QUFDbkMsb0JBQU0sT0FBTyxJQUFJLGtCQUFrQixJQUFJLE1BQU0sT0FBTyxJQUFJLE9BQU8sSUFBSSxhQUFhO0FBQ2hGLG1CQUFLLFNBQVM7QUFBQSxZQUNoQjtBQUFBLFVBQ0YsT0FBTztBQUNMLGlCQUFLLFFBQVEsT0FBTyxHQUFHO0FBQUEsVUFDekI7QUFHQSxnQkFBTSxRQUFRLE9BQU8sR0FBRyxFQUFFLE1BQU0sSUFBSSxFQUFFO0FBQ3RDLGNBQUksUUFBUSxHQUFHO0FBQ2Isa0JBQU0sWUFBWSxTQUFTLElBQUksS0FBSztBQUNwQyxpQkFBSyxJQUFJLFVBQVUsTUFBTSxVQUFXLEtBQUksU0FBUztBQUFBLFVBQ25ELE9BQU87QUFDSixpQkFBSyxJQUFJLFVBQVUsS0FBSyxHQUFJLEtBQUksU0FBUztBQUFBLFVBQzVDO0FBRUEsZUFBSyxZQUFZLEVBQUUsVUFBVSxNQUFNLFVBQVUsU0FBUztBQUN0RCxlQUFLLE9BQU8sRUFBRSxNQUFNLGFBQWEsTUFBTSxFQUFFO0FBRXpDLGNBQUksUUFBUTtBQUNWLGlCQUFLLE9BQU87QUFBQSxjQUNULE1BQU07QUFBQSxjQUFZLFVBQVU7QUFBQSxjQUFTLFFBQVE7QUFBQSxjQUM3QyxPQUFPLENBQUMsRUFBRSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLEdBQUcsRUFBRSxVQUFVLEdBQUcsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFLENBQUM7QUFBQSxZQUNyRztBQUNBLGlCQUFLLE9BQU8sRUFBRSxHQUFHLEtBQUssTUFBYSxNQUFNLE1BQU0sT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFO0FBQUEsVUFDN0UsT0FBTztBQUNMLGlCQUFLLE9BQU8sRUFBRSxNQUFNLFdBQVcsU0FBUyxTQUFTLFNBQVMsRUFBRSxNQUFNLFdBQVcsRUFBRTtBQUFBLFVBQ2pGO0FBRUEsZUFBSyxTQUFTO0FBQUEsWUFDWixLQUFLLEVBQUUsT0FBTyxRQUFRLE9BQU8sRUFBRSxNQUFNLFdBQVcsRUFBRTtBQUFBLFlBQ2xELFFBQVEsRUFBRSxPQUFPLFFBQVEsT0FBTyxFQUFFLE1BQU0sV0FBVyxFQUFFO0FBQUEsWUFDckQsTUFBTSxFQUFFLE9BQU8sUUFBUSxPQUFPLEVBQUUsTUFBTSxXQUFXLEVBQUU7QUFBQSxZQUNuRCxPQUFPLEVBQUUsT0FBTyxRQUFRLE9BQU8sV0FBVyxRQUFRLFNBQVMsSUFBSSxFQUFFLE1BQU0sV0FBVyxJQUFJLE9BQVU7QUFBQSxVQUNsRztBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0gsQ0FBQztBQUVELFlBQU0sU0FBUyxNQUFNLFNBQVMsS0FBSyxZQUFZO0FBRS9DLFlBQU0sVUFBVSxPQUFPO0FBRXZCLFVBQUksU0FBUztBQUVYLGNBQU0sRUFBRSxLQUFLLElBQUksTUFBTSxPQUFPLDJCQUEyQjtBQUV6RCxjQUFNLEVBQUUsV0FBVyxjQUFjLElBQUksTUFBTSxPQUFPLHVCQUF1QjtBQUV6RSxZQUFJO0FBQ0YsZ0JBQU0sV0FBVyxNQUFNLEtBQUs7QUFBQSxZQUMxQixTQUFTLENBQUMsRUFBRSxNQUFNLGtCQUFrQixZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7QUFBQSxZQUMxRCxhQUFhLHdCQUF1QixvQkFBSSxLQUFLLEdBQUUsWUFBWSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUFBLFVBQzVFLENBQUM7QUFFRCxjQUFJLFVBQVU7QUFDWixnQkFBSTtBQUNKLGdCQUFJLGtCQUFrQixhQUFhO0FBQy9CLDBCQUFZLElBQUksV0FBVyxNQUFNO0FBQUEsWUFDckMsV0FBVyxVQUFVLE9BQVEsT0FBZSxXQUFXLGFBQWE7QUFDaEUsMEJBQVksSUFBSSxXQUFXLE1BQWE7QUFBQSxZQUM1QyxPQUFPO0FBQ0gsb0JBQU0sSUFBSSxNQUFNLDJDQUEyQztBQUFBLFlBQy9EO0FBR0Esa0JBQU0sRUFBRSxPQUFPLElBQUksTUFBTSxPQUFPLHNCQUFzQjtBQUN0RCxrQkFBTSxPQUFPLG9CQUFvQixFQUFFLE1BQU0sVUFBVSxVQUFVLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztBQUNwRixrQkFBTTtBQUFBLEVBQW1CLFFBQVEsRUFBRTtBQUFBLFVBQ3JDO0FBQUEsUUFDRixTQUFTLFdBQWdCO0FBQ3ZCLGdCQUFNLElBQUksTUFBTSx3QkFBd0IsV0FBVyxXQUFXLE9BQU8sU0FBUyxFQUFFO0FBQUEsUUFDbEY7QUFBQSxNQUNGLE9BQU87QUFDTCxjQUFNLE9BQU8sSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsTUFBTSxvRUFBb0UsQ0FBQztBQUM3RyxlQUFPLE1BQU0sd0JBQXVCLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU87QUFDakYsY0FBTSwyQkFBMkI7QUFBQSxNQUNuQztBQUFBLElBRUYsU0FBUyxHQUFRO0FBQ2YsY0FBUSxNQUFNLG1CQUFtQixDQUFDO0FBQ2xDLFlBQU07QUFBQSxFQUEwQixFQUFFLFdBQVcsT0FBTyxDQUFDLENBQUMsRUFBRTtBQUFBLElBQzFEO0FBQUEsRUFDRjtBQUdBLFFBQU0sQ0FBQyxpQkFBaUIsa0JBQWtCLElBQUksU0FBd0IsSUFBSTtBQUMxRSxRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixJQUFJLFNBQXdCLElBQUk7QUFDNUUsUUFBTSxDQUFDLGNBQWMsZUFBZSxJQUFJLFNBQXdCLElBQUk7QUFDcEUsUUFBTSxDQUFDLGVBQWUsZ0JBQWdCLElBQUksU0FBd0IsSUFBSTtBQUN0RSxRQUFNLENBQUMsa0JBQWtCLG1CQUFtQixJQUFJLFNBQXdCLElBQUk7QUFDNUUsUUFBTSxDQUFDLHVCQUF1Qix3QkFBd0IsSUFBSSxTQUF3QixJQUFJO0FBQ3RGLFFBQU0sQ0FBQyxnQkFBZ0IsaUJBQWlCLElBQUksU0FBbUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDN0YsUUFBTSxDQUFDLGlCQUFpQixrQkFBa0IsSUFBSSxTQUF3QixJQUFJO0FBQzFFLFFBQU0sQ0FBQyxrQkFBa0IsbUJBQW1CLElBQUksU0FBMEMsSUFBSTtBQUM5RixRQUFNLENBQUMsZ0JBQWdCLGlCQUFpQixJQUFJLFNBQXdCLElBQUk7QUFFeEUsUUFBTSxnQkFBZ0IsUUFBUSxNQUFNO0FBQ2xDLFFBQUksQ0FBQyxlQUFnQixRQUFPO0FBQzVCLFVBQU0sY0FBYyxRQUFRLFVBQVUsT0FBSyxFQUFFLE9BQU8sY0FBYztBQUNsRSxRQUFJLGdCQUFnQixHQUFJLFFBQU87QUFFL0IsVUFBTSxVQUFrQyxDQUFDO0FBQ3pDLFFBQUksY0FBYztBQUVsQixhQUFTLElBQUksR0FBRyxLQUFLLGFBQWEsS0FBSztBQUNyQyxZQUFNLE1BQU0sUUFBUSxDQUFDO0FBQ3JCLGNBQVEsSUFBSSxFQUFFLElBQUk7QUFDbEIsWUFBTSxjQUFjLGlCQUFpQixJQUFJLEVBQUU7QUFDM0MscUJBQWUsY0FBYyxLQUFNLGFBQWEsSUFBSSxFQUFFLEtBQUs7QUFBQSxJQUM3RDtBQUNBLFdBQU8sRUFBRSxTQUFTLGFBQWEsV0FBVyxRQUFRLFdBQVcsRUFBRSxHQUFHO0FBQUEsRUFDcEUsR0FBRyxDQUFDLGdCQUFnQixTQUFTLGtCQUFrQixZQUFZLENBQUM7QUFFNUQsUUFBTSwwQkFBMEIsQ0FBQyxHQUFxQixVQUFrQjtBQUN0RSxNQUFFLGVBQWU7QUFDakIsd0JBQW9CLEtBQUs7QUFDekIsc0JBQWtCLEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxFQUFFLFFBQVEsQ0FBQztBQUFBLEVBQ2xEO0FBRUEsUUFBTSx3QkFBd0IsQ0FBQyxHQUFvQixVQUFrQjtBQUNuRSx1QkFBbUIsS0FBSztBQUN4QixNQUFFLGFBQWEsUUFBUSxjQUFjLEtBQUs7QUFBQSxFQUM1QztBQUNBLFFBQU0sdUJBQXVCLENBQUMsR0FBb0IsVUFBa0I7QUFDbEUsTUFBRSxlQUFlO0FBQ2pCLHdCQUFvQixLQUFLO0FBQUEsRUFDM0I7QUFDQSxRQUFNLG1CQUFtQixDQUFDLEdBQW9CLGdCQUF3QjtBQUNwRSxNQUFFLGVBQWU7QUFDakIsd0JBQW9CLElBQUk7QUFDeEIsUUFBSSxDQUFDLG1CQUFtQixvQkFBb0IsWUFBYTtBQUV6RCxlQUFXLFVBQVE7QUFDakIsWUFBTSxRQUFRLENBQUMsR0FBRyxJQUFJO0FBQ3RCLFlBQU0sWUFBWSxNQUFNLFVBQVUsT0FBSyxFQUFFLE9BQU8sZUFBZTtBQUMvRCxZQUFNLFVBQVUsTUFBTSxVQUFVLE9BQUssRUFBRSxPQUFPLFdBQVc7QUFDekQsVUFBSSxjQUFjLE1BQU0sWUFBWSxHQUFJLFFBQU87QUFDL0MsWUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLE9BQU8sV0FBVyxDQUFDO0FBQzNDLFlBQU0sT0FBTyxTQUFTLEdBQUcsT0FBTztBQUNoQyxhQUFPO0FBQUEsSUFDVCxDQUFDO0FBQ0QsdUJBQW1CLElBQUk7QUFBQSxFQUN6QjtBQUVBLFFBQU0scUJBQXFCLFlBQVksQ0FBQyxhQUFxQixrQkFBMkI7QUFDdEYsb0JBQWdCLENBQUMsU0FBd0I7QUFDdkMsWUFBTSxZQUFZLEtBQUssS0FBSyxPQUFLLEVBQUUsT0FBTyxXQUFXO0FBQ3JELFVBQUksQ0FBQyxVQUFXLFFBQU87QUFFdkIsWUFBTSxlQUFlLEtBQUssT0FBTyxDQUFDLEtBQUssTUFBTTtBQUMzQyxjQUFNLFFBQVEsRUFBRSxHQUFHLE1BQU0sV0FBVztBQUNwQyxlQUFPLFFBQVEsS0FBSyxJQUFJLEtBQUssU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSTtBQUFBLE1BQ3pELEdBQUcsQ0FBQztBQUNKLFlBQU0sU0FBUyxPQUFPLE9BQU8sZUFBZSxDQUFDLEVBQUUsU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUUvRCxZQUFNLFFBQXFCO0FBQUEsUUFDekIsR0FBRztBQUFBLFFBQ0gsSUFBSTtBQUFBLFFBQ0osT0FBTyxHQUFHLFVBQVUsS0FBSztBQUFBLFFBQ3pCLFdBQVcsQ0FBQyxHQUFHLFVBQVUsU0FBUztBQUFBLFFBQ2xDLGVBQWUsRUFBRSxHQUFHLFVBQVUsY0FBYztBQUFBLE1BQzlDO0FBRUEsWUFBTSxRQUFRLENBQUMsR0FBRyxJQUFJO0FBQ3RCLFlBQU0sY0FBYyxNQUFNLFVBQVUsT0FBSyxFQUFFLFFBQVEsaUJBQWlCLFlBQVk7QUFDaEYsVUFBSSxnQkFBZ0IsSUFBSTtBQUN0QixjQUFNLE9BQU8sY0FBYyxHQUFHLEdBQUcsS0FBSztBQUFBLE1BQ3hDLE9BQU87QUFDTCxjQUFNLEtBQUssS0FBSztBQUFBLE1BQ2xCO0FBQ0EsYUFBTztBQUFBLElBQ1QsQ0FBQztBQUFBLEVBQ0gsR0FBRyxDQUFDLGVBQWUsQ0FBQztBQUVwQixRQUFNLHFCQUFxQixZQUFZLENBQUMsR0FBb0IsVUFBa0I7QUFDNUUsb0JBQWdCLEtBQUs7QUFDckIsTUFBRSxhQUFhLGdCQUFnQjtBQUMvQixNQUFFLGFBQWEsUUFBUSxjQUFjLEtBQUs7QUFBQSxFQUM1QyxHQUFHLENBQUMsQ0FBQztBQUVMLFFBQU0sb0JBQW9CLFlBQVksQ0FBQyxHQUFvQixVQUFrQjtBQUMzRSxNQUFFLGVBQWU7QUFDakIscUJBQWlCLEtBQUs7QUFDdEIsTUFBRSxhQUFhLGFBQWEsRUFBRSxTQUFTLFNBQVM7QUFBQSxFQUNsRCxHQUFHLENBQUMsQ0FBQztBQUVMLFFBQU0sZ0JBQWdCLFlBQVksQ0FBQyxHQUFvQixnQkFBd0I7QUFDN0UsTUFBRSxlQUFlO0FBQ2pCLHFCQUFpQixJQUFJO0FBQ3JCLFFBQUksQ0FBQyxhQUFjO0FBRW5CLFFBQUksRUFBRSxRQUFRO0FBQ1oseUJBQW1CLGNBQWMsV0FBVztBQUFBLElBQzlDLE9BQU87QUFDTCxVQUFJLGlCQUFpQixhQUFhO0FBQ2hDLHdCQUFnQixJQUFJO0FBQ3BCO0FBQUEsTUFDRjtBQUNBLHNCQUFnQixVQUFRO0FBQ3RCLGNBQU0sUUFBUSxDQUFDLEdBQUcsSUFBSTtBQUN0QixjQUFNLFlBQVksTUFBTSxVQUFVLE9BQUssRUFBRSxPQUFPLFlBQVk7QUFDNUQsY0FBTSxVQUFVLE1BQU0sVUFBVSxPQUFLLEVBQUUsT0FBTyxXQUFXO0FBQ3pELFlBQUksY0FBYyxNQUFNLFlBQVksR0FBSSxRQUFPO0FBRS9DLGNBQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxPQUFPLFdBQVcsQ0FBQztBQUMzQyxjQUFNLE9BQU8sU0FBUyxHQUFHLE9BQU87QUFDaEMsZUFBTztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0g7QUFDQSxvQkFBZ0IsSUFBSTtBQUFBLEVBQ3RCLEdBQUcsQ0FBQyxjQUFjLG9CQUFvQixlQUFlLENBQUM7QUFHdEQsUUFBTSxrQkFBa0IsWUFBWSxDQUFDLEdBQXlCLFlBQW9CLGVBQXVCO0FBQ3ZHLFVBQU0sT0FBTyxFQUFFLGNBQWMsUUFBUSxNQUFNO0FBQzNDLFFBQUksQ0FBQyxLQUFNO0FBR1gsUUFBSSxDQUFDLEtBQUssU0FBUyxHQUFJLEtBQUssQ0FBQyxLQUFLLFNBQVMsSUFBSSxHQUFHO0FBRWhEO0FBQUEsSUFDRjtBQUVBLE1BQUUsZUFBZTtBQUNqQixNQUFFLGdCQUFnQjtBQUdsQixVQUFNLFdBQVcsQ0FBQyxRQUFnQjtBQUNoQyxZQUFNLE9BQW1CLENBQUM7QUFDMUIsVUFBSSxhQUF1QixDQUFDO0FBQzVCLFVBQUksY0FBYztBQUNsQixVQUFJLFdBQVc7QUFFZixlQUFTLElBQUksR0FBRyxJQUFJLElBQUksUUFBUSxLQUFLO0FBQ25DLGNBQU0sT0FBTyxJQUFJLENBQUM7QUFDbEIsY0FBTSxXQUFXLElBQUksSUFBSSxDQUFDO0FBRTFCLFlBQUksU0FBUyxLQUFLO0FBQ2hCLGNBQUksWUFBWSxhQUFhLEtBQUs7QUFDaEMsMkJBQWU7QUFDZjtBQUFBLFVBQ0YsT0FBTztBQUNMLHVCQUFXLENBQUM7QUFBQSxVQUNkO0FBQUEsUUFDRixXQUFXLFNBQVMsT0FBUSxDQUFDLFVBQVU7QUFDckMscUJBQVcsS0FBSyxXQUFXO0FBQzNCLHdCQUFjO0FBQUEsUUFDaEIsV0FBVyxTQUFTLFFBQVEsYUFBYSxRQUFRLENBQUMsVUFBVTtBQUMxRCxxQkFBVyxLQUFLLFdBQVc7QUFDM0IsZUFBSyxLQUFLLFVBQVU7QUFDcEIsdUJBQWEsQ0FBQztBQUNkLHdCQUFjO0FBQ2Q7QUFBQSxRQUNGLFdBQVcsU0FBUyxRQUFRLENBQUMsVUFBVTtBQUNyQyxxQkFBVyxLQUFLLFdBQVc7QUFDM0IsZUFBSyxLQUFLLFVBQVU7QUFDcEIsdUJBQWEsQ0FBQztBQUNkLHdCQUFjO0FBQUEsUUFDaEIsT0FBTztBQUNMLHlCQUFlO0FBQUEsUUFDakI7QUFBQSxNQUNGO0FBRUEsVUFBSSxnQkFBZ0IsTUFBTSxXQUFXLFNBQVMsR0FBRztBQUMvQyxtQkFBVyxLQUFLLFdBQVc7QUFFM0IsWUFBSSxXQUFXLFdBQVcsS0FBSyxXQUFXLENBQUMsTUFBTSxJQUFJO0FBQ25ELGVBQUssS0FBSyxVQUFVO0FBQUEsUUFDdEI7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLFlBQVksU0FBUyxJQUFJO0FBQy9CLFFBQUksVUFBVSxXQUFXLEtBQU0sVUFBVSxXQUFXLEtBQUssVUFBVSxDQUFDLEVBQUUsVUFBVSxFQUFJO0FBRXBGLFVBQU0sZ0JBQWdCLDhCQUE4QixVQUFVLE9BQUssRUFBRSxPQUFPLFVBQVU7QUFFdEYsVUFBTSxhQUFhLFFBQVEsT0FBTyxPQUFLLEVBQUUsT0FBTyxJQUFJO0FBQ3BELFVBQU0sZ0JBQWdCLFdBQVcsVUFBVSxPQUFLLEVBQUUsT0FBTyxVQUFVO0FBRW5FLFFBQUksa0JBQWtCLE1BQU0sa0JBQWtCLEdBQUk7QUFFbEQsUUFBSSxvQkFBZ0MsQ0FBQztBQUVyQyxvQkFBZ0IsVUFBUTtBQUN0QixZQUFNLFFBQVEsQ0FBQyxHQUFHLElBQUk7QUFFdEIsWUFBTSxtQkFBbUIsOEJBQThCO0FBQ3ZELFVBQUksZ0JBQWdCLE1BQU0sT0FBTyxDQUFDLEtBQUssTUFBTTtBQUMzQyxjQUFNLFFBQVEsRUFBRSxHQUFHLE1BQU0sV0FBVztBQUNwQyxlQUFPLFFBQVEsS0FBSyxJQUFJLEtBQUssU0FBUyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSTtBQUFBLE1BQ3pELEdBQUcsQ0FBQyxJQUFJO0FBRVIsWUFBTSxrQkFBa0IsY0FBYyxTQUFTLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLFdBQVcsTUFBTSxPQUFPLFdBQVcsR0FBRztBQUVsSCxnQkFBVSxRQUFRLENBQUMsU0FBUyxNQUFNO0FBQ2hDLGNBQU0saUJBQWlCLGdCQUFnQjtBQUN2QyxZQUFJO0FBQ0osWUFBSSxZQUFZO0FBRWhCLFlBQUksaUJBQWlCLGtCQUFrQjtBQUNyQyxnQkFBTSxjQUFjLDhCQUE4QixjQUFjLEVBQUU7QUFDbEUsc0JBQVksTUFBTSxVQUFVLE9BQUssRUFBRSxPQUFPLFdBQVc7QUFDckQsY0FBSSxjQUFjLEdBQUk7QUFDdEIsdUJBQWEsRUFBRSxHQUFHLE1BQU0sU0FBUyxHQUFHLGVBQWUsRUFBRSxHQUFHLE1BQU0sU0FBUyxFQUFFLGNBQWMsRUFBRTtBQUFBLFFBQzNGLE9BQU87QUFFTCxnQkFBTSxRQUFRLE9BQU8sT0FBTyxlQUFlLEVBQUUsU0FBUyxHQUFHLEdBQUcsQ0FBQztBQUM3RCx1QkFBYTtBQUFBLFlBQ1gsSUFBSTtBQUFBLFlBQ0osT0FBTztBQUFBLFlBQ1AsVUFBVTtBQUFBLFlBQ1YsV0FBVyxDQUFDO0FBQUE7QUFBQSxZQUNaLFVBQVMsb0JBQUksS0FBSyxHQUFFLFlBQVksRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsWUFDOUMsUUFBUTtBQUFBLFlBQ1IsZUFBZSxDQUFDO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBRUEsZ0JBQVEsUUFBUSxDQUFDLFVBQVUsTUFBTTtBQUMvQixnQkFBTSxpQkFBaUIsZ0JBQWdCO0FBQ3ZDLGNBQUksa0JBQWtCLFdBQVcsT0FBUTtBQUN6QyxnQkFBTSxRQUFRLFdBQVcsY0FBYyxFQUFFO0FBRXpDLGdCQUFNLGNBQWMsU0FBUyxLQUFLO0FBRWxDLGNBQUksVUFBVSxRQUFTLFlBQVcsUUFBUTtBQUFBLG1CQUNqQyxVQUFVLFlBQVk7QUFDN0Isa0JBQU0sS0FBSyxZQUFZLFlBQVk7QUFDbkMsZ0JBQUksQ0FBQyxRQUFRLFVBQVUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFHLFlBQVcsV0FBVztBQUFBLFVBQ3BFLFdBQ1MsVUFBVSxVQUFVO0FBQzNCLGtCQUFNLEtBQUssWUFBWSxZQUFZO0FBQ25DLGdCQUFJLENBQUMsUUFBUSxlQUFlLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRyxZQUFXLFNBQVM7QUFBQSxVQUN4RSxXQUNTLFVBQVUsV0FBVztBQUM1Qix1QkFBVyxVQUFVLGVBQWUsV0FBVztBQUFBLFVBQ2pELFdBQ1MsVUFBVSxhQUFhO0FBQzdCLGtCQUFNLFFBQVEsWUFBWSxNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDdEUsa0JBQU0sbUJBQW1CLENBQUM7QUFDMUIsdUJBQVcsUUFBUSxPQUFPO0FBQ3ZCLG9CQUFNLFlBQVksY0FBYyxLQUFLLE9BQUssRUFBRSxLQUFLLFlBQVksTUFBTSxLQUFLLFlBQVksQ0FBQztBQUNyRixvQkFBTSxXQUFXLGtCQUFrQixLQUFLLE9BQUssRUFBRSxLQUFLLFlBQVksTUFBTSxLQUFLLFlBQVksQ0FBQztBQUN4RixrQkFBSSxXQUFXO0FBQ2IsaUNBQWlCLEtBQUssU0FBUztBQUFBLGNBQ2pDLFdBQVcsVUFBVTtBQUNuQixpQ0FBaUIsS0FBSyxRQUFRO0FBQUEsY0FDaEMsT0FBTztBQUVMLHNCQUFNLGdCQUFnQixPQUFPLEtBQUssSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxJQUFJLEtBQUssTUFBTSxLQUFLLE9BQU8sSUFBRSxHQUFJLENBQUM7QUFDOUYsc0JBQU0sY0FBYyxFQUFFLElBQUksZUFBZSxNQUFZLFdBQVcsR0FBRztBQUNuRSxrQ0FBa0IsS0FBSyxXQUFXO0FBQ2xDLGlDQUFpQixLQUFLLFdBQVc7QUFBQSxjQUNuQztBQUFBLFlBQ0g7QUFDQSxnQkFBSSxpQkFBaUIsU0FBUyxHQUFHO0FBQzlCLHlCQUFXLFlBQVk7QUFBQSxZQUMxQjtBQUFBLFVBQ0gsV0FDUyxXQUFXLGNBQWMsRUFBRSxVQUFVO0FBQzVDLHVCQUFXLGNBQWMsS0FBSyxJQUFJO0FBQUEsVUFDcEM7QUFBQSxRQUNGLENBQUM7QUFFRCxZQUFJLFdBQVcsVUFBVSxXQUFXLEdBQUc7QUFDckMscUJBQVcsWUFBWSxDQUFDLGVBQWU7QUFBQSxRQUN6QztBQUVBLFlBQUksaUJBQWlCLGtCQUFrQjtBQUNyQyxnQkFBTSxTQUFTLElBQUk7QUFBQSxRQUNyQixPQUFPO0FBQ0wsZ0JBQU0sS0FBSyxVQUFVO0FBQUEsUUFDdkI7QUFBQSxNQUNGLENBQUM7QUFFRCxhQUFPO0FBQUEsSUFDVCxDQUFDO0FBRUQsUUFBSSxrQkFBa0IsU0FBUyxHQUFHO0FBQ2hDLHVCQUFpQixVQUFRLENBQUMsR0FBRyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7QUFBQSxJQUMxRDtBQUVBLHdCQUFvQixJQUFJO0FBQUEsRUFDMUIsR0FBRyxDQUFDLFNBQVMsK0JBQStCLGVBQWUsaUJBQWlCLGtCQUFrQixtQkFBbUIsQ0FBQztBQUlsSCxRQUFNLGlCQUFpQixZQUFZLENBQUMsV0FBVyxVQUErQjtBQUM1RSxRQUFJLFVBQVU7QUFDWixhQUFPO0FBQUEsUUFDTCxVQUFVO0FBQUEsUUFDVixLQUFLO0FBQUEsUUFDTCxRQUFRO0FBQUEsUUFDUixpQkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFDQSxXQUFPLENBQUM7QUFBQSxFQUNWLEdBQUcsQ0FBQyxDQUFDO0FBRUwsUUFBTSxxQkFBcUIsWUFBWSxDQUFDLE9BQXNDLFdBQVcsVUFBK0I7QUFDdEgsUUFBSSxPQUFPLGVBQWUsUUFBUTtBQUVsQyxRQUFJLGVBQWU7QUFDakIsWUFBTSxXQUFXLFVBQVUsV0FBVyxVQUFVLGNBQWMsY0FBYyxRQUFRLEtBQWUsTUFBTTtBQUN6RyxVQUFJLFVBQVU7QUFDWixjQUFNLE9BQU8sVUFBVSxVQUFVLElBQUksVUFBVSxhQUFhLEtBQUssY0FBYyxRQUFRLEtBQWU7QUFDdEcsY0FBTSxlQUFnQixVQUFVLGNBQWMsY0FBYyxnQkFBZ0IsTUFBTyxVQUFVLGNBQWM7QUFFM0csZUFBTztBQUFBLFVBQ0wsR0FBRztBQUFBLFVBQ0gsVUFBVTtBQUFBLFVBQ1Y7QUFBQSxVQUNBLFFBQVEsV0FBVyxLQUFLO0FBQUEsVUFDeEIsaUJBQWlCLFdBQVcsb0NBQW9DO0FBQUEsUUFDbEU7QUFFQSxZQUFJLGNBQWM7QUFDaEIsZUFBSyxZQUFZO0FBQUEsUUFDbkI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNULEdBQUcsQ0FBQyxlQUFlLGNBQWMsQ0FBQztBQUVsQyxRQUFNLHVCQUF1QixNQUFNO0FBRW5DLFNBQ0UsdUJBQUMsU0FBSSxXQUFVLDBLQUdiO0FBQUEsMkJBQUMsU0FBSSxXQUFVLHFJQUdiO0FBQUEsNkJBQUMsU0FBSSxXQUFVLDRDQUViO0FBQUEsK0JBQUMsU0FBSSxXQUFVLDBHQUNiO0FBQUE7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLFNBQVM7QUFBQSxjQUNULFVBQVUsV0FBVyxRQUFRLFdBQVc7QUFBQSxjQUN4QyxXQUFXLDJEQUEyRCxXQUFXLFFBQVEsV0FBVyxJQUFJLGtDQUFrQyxrRUFBa0U7QUFBQSxjQUM1TSxPQUFNO0FBQUEsY0FFTixpQ0FBQyxTQUFNLFdBQVUsYUFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBMkI7QUFBQTtBQUFBLFlBTjdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQU9BO0FBQUEsVUFDQSx1QkFBQyxTQUFJLFdBQVUsc0NBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBa0Q7QUFBQSxVQUNsRDtBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsU0FBUztBQUFBLGNBQ1QsVUFBVSxhQUFhLFFBQVEsV0FBVztBQUFBLGNBQzFDLFdBQVcsMkRBQTJELGFBQWEsUUFBUSxXQUFXLElBQUksa0NBQWtDLGtFQUFrRTtBQUFBLGNBQzlNLE9BQU07QUFBQSxjQUVOLGlDQUFDLFNBQU0sV0FBVSxhQUFqQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUEyQjtBQUFBO0FBQUEsWUFON0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFVBT0E7QUFBQSxhQWpCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBa0JBO0FBQUEsUUFFQTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsSUFBRztBQUFBLFlBQ0gsU0FBUztBQUFBLFlBQ1QsV0FBVTtBQUFBLFlBRVY7QUFBQSxxQ0FBQyxRQUFLLFdBQVUsYUFBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBMEI7QUFBQSxjQUFFO0FBQUE7QUFBQTtBQUFBLFVBTDlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU9BO0FBQUEsUUFFQyxhQUFhLFdBQVcsS0FDdkI7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLElBQUc7QUFBQSxZQUNILFNBQVMsTUFBTTtBQUNiLDhCQUFnQixvQkFBb0I7QUFDcEMsK0JBQWlCLGlCQUFpQjtBQUFBLFlBQ3BDO0FBQUEsWUFDQSxXQUFVO0FBQUEsWUFDWDtBQUFBO0FBQUEsVUFQRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFTQTtBQUFBLFFBR0Y7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLElBQUc7QUFBQSxZQUNILFNBQVM7QUFBQSxZQUNULFdBQVU7QUFBQSxZQUVWO0FBQUEscUNBQUMsWUFBUyxXQUFVLGFBQXBCO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQThCO0FBQUEsY0FBRTtBQUFBO0FBQUE7QUFBQSxVQUxsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFPQTtBQUFBLFFBRUE7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLElBQUc7QUFBQSxZQUNILFNBQVMsQ0FBQyxNQUFNO0FBQ2Isb0JBQU0sT0FBTyxFQUFFLGNBQWMsc0JBQXNCO0FBQ25ELG9DQUFzQixFQUFFLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxLQUFLLElBQUksQ0FBQztBQUN6RCxxQ0FBdUIsSUFBSTtBQUFBLFlBQzlCO0FBQUEsWUFDQSxXQUFVO0FBQUEsWUFFVjtBQUFBLHFDQUFDLFNBQU0sV0FBVSxnQ0FBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBOEM7QUFBQSxjQUFFO0FBQUE7QUFBQTtBQUFBLFVBVGxEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQVdBO0FBQUEsUUFHQyxZQUFZLFNBQVMsS0FDcEI7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUNDLElBQUc7QUFBQSxZQUNILFNBQVM7QUFBQSxZQUNULFdBQVU7QUFBQSxZQUVWO0FBQUEscUNBQUMsVUFBTyxXQUFVLGFBQWxCO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQTRCO0FBQUEsY0FBRTtBQUFBLGNBQ3RCLFlBQVk7QUFBQSxjQUFPO0FBQUE7QUFBQTtBQUFBLFVBTjdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU9BO0FBQUEsV0EzRUo7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQTZFQTtBQUFBLE1BR0EsdUJBQUMsU0FBSSxXQUFVLGdGQUViO0FBQUEsK0JBQUMsU0FBSSxXQUFVLHVLQUNiO0FBQUEsaUNBQUMsVUFBSyxXQUFVLG9DQUFtQyxxQkFBbkQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBd0Q7QUFBQSxVQUN4RCx1QkFBQyxTQUFJLFdBQVUsZ0NBQ2I7QUFBQSxtQ0FBQyxXQUFNLFdBQVUsNkNBQTRDLG9CQUE3RDtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFpRTtBQUFBLFlBQ2pFLHVCQUFDLFdBQU0sTUFBSyxVQUFTLFdBQVUsNktBQTRLLE9BQU8sY0FBYyxLQUFLLFVBQVUsT0FBSyxpQkFBaUIsRUFBQyxHQUFHLGVBQWUsS0FBSyxPQUFPLEVBQUUsT0FBTyxLQUFLLEVBQUMsQ0FBQyxLQUFwVDtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUF1VDtBQUFBLGVBRnpUO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBR0E7QUFBQSxVQUNBLHVCQUFDLFNBQUksV0FBVSxnQ0FDYjtBQUFBLG1DQUFDLFdBQU0sV0FBVSw2Q0FBNEMsb0JBQTdEO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQWlFO0FBQUEsWUFDakUsdUJBQUMsV0FBTSxNQUFLLFVBQVMsV0FBVSw2S0FBNEssT0FBTyxjQUFjLEtBQUssVUFBVSxPQUFLLGlCQUFpQixFQUFDLEdBQUcsZUFBZSxLQUFLLE9BQU8sRUFBRSxPQUFPLEtBQUssRUFBQyxDQUFDLEtBQXBUO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQXVUO0FBQUEsZUFGelQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFHQTtBQUFBLFVBQ0EsdUJBQUMsU0FBSSxXQUFVLGdDQUNiO0FBQUEsbUNBQUMsV0FBTSxXQUFVLDZDQUE0QyxvQkFBN0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBaUU7QUFBQSxZQUNqRSx1QkFBQyxXQUFNLE1BQUssVUFBUyxXQUFVLDZLQUE0SyxPQUFPLGNBQWMsS0FBSyxVQUFVLE9BQUssaUJBQWlCLEVBQUMsR0FBRyxlQUFlLEtBQUssT0FBTyxFQUFFLE9BQU8sS0FBSyxFQUFDLENBQUMsS0FBcFQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBdVQ7QUFBQSxlQUZ6VDtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUdBO0FBQUEsYUFiRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBY0E7QUFBQSxRQUVBLHVCQUFDLFNBQUksV0FBVSx1RkFFZjtBQUFBLGlDQUFDLFNBQUksV0FBVSxrRkFDYjtBQUFBLG1DQUFDLFVBQUsscUJBQU47QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBVztBQUFBLFlBQ1g7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLGtCQUFrQixFQUFFLE9BQU8sS0FBeUI7QUFBQSxnQkFDbkUsV0FBVTtBQUFBLGdCQUVWO0FBQUEseUNBQUMsWUFBTyxPQUFNLE9BQU0sa0JBQXBCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQXNCO0FBQUEsa0JBQ3RCLHVCQUFDLFlBQU8sT0FBTSxRQUFPLGtCQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUF1QjtBQUFBLGtCQUN2Qix1QkFBQyxZQUFPLE9BQU0sVUFBUyxrQkFBdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBeUI7QUFBQSxrQkFDekIsdUJBQUMsWUFBTyxPQUFNLE9BQU0sa0JBQXBCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQXNCO0FBQUE7QUFBQTtBQUFBLGNBUnhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVNBO0FBQUEsZUFYRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVlBO0FBQUEsVUFHQSx1QkFBQyxTQUFJLFdBQVUsa0ZBQ2I7QUFBQSxtQ0FBQyxVQUFLLG1CQUFOO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQVM7QUFBQSxZQUNUO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsT0FBTztBQUFBLGdCQUNQLFVBQVUsT0FBSyxnQkFBZ0IsRUFBRSxPQUFPLEtBQXVCO0FBQUEsZ0JBQy9ELFdBQVU7QUFBQSxnQkFFVjtBQUFBLHlDQUFDLFlBQU8sT0FBTSxPQUFNLGtCQUFwQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFzQjtBQUFBLGtCQUN0Qix1QkFBQyxZQUFPLE9BQU0sUUFBTyxtQkFBckI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBd0I7QUFBQSxrQkFDeEIsdUJBQUMsWUFBTyxPQUFNLGVBQWMsbUJBQTVCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQStCO0FBQUEsa0JBQy9CLHVCQUFDLFlBQU8sT0FBTSxRQUFPLG9CQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUF5QjtBQUFBO0FBQUE7QUFBQSxjQVIzQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFTQTtBQUFBLGVBWEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFZQTtBQUFBLFVBR0EsdUJBQUMsU0FBSSxXQUFVLDJCQUNiO0FBQUEsbUNBQUMsVUFBTyxXQUFVLHFGQUFsQjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFvRztBQUFBLFlBQ3BHO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsTUFBSztBQUFBLGdCQUNMLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssY0FBYyxFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUMzQyxhQUFZO0FBQUEsZ0JBQ1osV0FBVTtBQUFBO0FBQUEsY0FMWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLFlBQ0MsY0FDQztBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFNBQVMsTUFBTSxjQUFjLEVBQUU7QUFBQSxnQkFDL0IsV0FBVTtBQUFBLGdCQUVWLGlDQUFDLEtBQUUsV0FBVSxhQUFiO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQXVCO0FBQUE7QUFBQSxjQUp6QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFLQTtBQUFBLGVBZko7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFpQkE7QUFBQSxVQUVBO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxTQUFTO0FBQUEsY0FDVCxXQUFVO0FBQUEsY0FDVixPQUFNO0FBQUEsY0FDUDtBQUFBO0FBQUEsWUFKRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFNQTtBQUFBLGFBekRBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUEwREE7QUFBQSxXQTVFRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBNkVBO0FBQUEsU0FoS0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQWtLQTtBQUFBLElBR0EsdUJBQUMsU0FBSSxXQUFVLGtFQUNiLGlDQUFDLFdBQU0sV0FBVSxxTUFDZjtBQUFBLDZCQUFDLGNBQ0M7QUFBQSwrQkFBQyxTQUFJLE9BQU8sRUFBRSxPQUFPLFFBQVEsVUFBVSxRQUFRLFVBQVUsT0FBTyxLQUFoRTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQW1FO0FBQUEsUUFDbkUsdUJBQUMsU0FBSSxPQUFPLEVBQUUsT0FBTyxRQUFRLFVBQVUsUUFBUSxVQUFVLE9BQU8sS0FBaEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFtRTtBQUFBLFFBQ2xFLFFBQVEsSUFBSSxTQUFPO0FBQ2xCLGdCQUFNLFFBQVEsaUJBQWlCLElBQUksRUFBRSxJQUFJLEtBQU0sYUFBYSxJQUFJLEVBQUUsS0FBSztBQUN2RSxpQkFBTyx1QkFBQyxTQUFpQixPQUFPLEVBQUUsT0FBTyxHQUFHLEtBQUssTUFBTSxVQUFVLEdBQUcsS0FBSyxNQUFNLFVBQVUsR0FBRyxLQUFLLEtBQUssS0FBckYsSUFBSSxJQUFkO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQWtHO0FBQUEsUUFDM0csQ0FBQztBQUFBLFFBQ0QsdUJBQUMsU0FBSSxPQUFPLEVBQUUsT0FBTyxTQUFTLFVBQVUsU0FBUyxVQUFVLFFBQVEsS0FBbkU7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFzRTtBQUFBLFdBUHhFO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFRQTtBQUFBLE1BR0EsdUJBQUMsV0FFQztBQUFBLCtCQUFDLFFBQUcsV0FBVSxrQ0FDWjtBQUFBLGlDQUFDLFFBQUcsT0FBTyxFQUFFLE9BQU8sUUFBUSxVQUFVLFFBQVEsVUFBVSxRQUFRLFNBQVMsR0FBRyxRQUFRLEVBQUUsS0FBdEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBeUY7QUFBQSxVQUN6Rix1QkFBQyxRQUFHLE9BQU8sRUFBRSxPQUFPLFFBQVEsVUFBVSxRQUFRLFVBQVUsUUFBUSxTQUFTLEdBQUcsUUFBUSxFQUFFLEtBQXRGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXlGO0FBQUEsVUFDeEYsUUFBUSxJQUFJLFNBQU87QUFDbEIsa0JBQU0sSUFBSSxpQkFBaUIsSUFBSSxFQUFFLElBQUksS0FBTSxhQUFhLElBQUksRUFBRSxLQUFLO0FBQ25FLG1CQUFPLHVCQUFDLFFBQWdCLE9BQU8sRUFBRSxPQUFPLEdBQUcsQ0FBQyxNQUFNLFVBQVUsR0FBRyxDQUFDLE1BQU0sVUFBVSxHQUFHLENBQUMsTUFBTSxTQUFTLEdBQUcsUUFBUSxFQUFFLEtBQWhHLElBQUksSUFBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUE0RztBQUFBLFVBQ3JILENBQUM7QUFBQSxVQUNELHVCQUFDLFFBQUcsT0FBTyxFQUFFLE9BQU8sU0FBUyxVQUFVLFNBQVMsVUFBVSxTQUFTLFNBQVMsR0FBRyxRQUFRLEVBQUUsS0FBekY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBNEY7QUFBQSxhQVA5RjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBUUE7QUFBQSxRQUdDLFFBQVEsS0FBSyxPQUFLLEVBQUUsU0FBUyxLQUM1Qix1QkFBQyxRQUFHLFdBQVUscUlBQ1o7QUFBQSxpQ0FBQyxRQUFHLFdBQVUsOENBQTZDLE9BQU8sbUJBQW1CLFNBQVMsSUFBSSxLQUFsRztBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFxRztBQUFBLFVBQ3JHLHVCQUFDLFFBQUcsV0FBVSw4Q0FBNkMsT0FBTyxtQkFBbUIsWUFBWSxJQUFJLEtBQXJHO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXdHO0FBQUEsV0FDdEcsTUFBTTtBQUNOLGtCQUFNLE1BQU0sQ0FBQztBQUNiLGdCQUFJLGVBQW1DO0FBQ3ZDLGdCQUFJLFVBQVU7QUFFZCxrQkFBTSxZQUFZLE1BQU07QUFDdEIsa0JBQUksVUFBVSxHQUFHO0FBQ2Ysb0JBQUk7QUFBQSxrQkFDRjtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFFQztBQUFBLHNCQUNBLFdBQVcsb0JBQW9CLGVBQWUsc0hBQXNILHVDQUF1QztBQUFBLHNCQUMzTSxlQUFlLENBQUMsTUFBTTtBQUNwQiw0QkFBSSxjQUFjO0FBQ2hCLDRCQUFFLGVBQWU7QUFDakIsbURBQXlCLFlBQVk7QUFDckMsNENBQWtCLEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxFQUFFLFFBQVEsQ0FBQztBQUFBLHdCQUNsRDtBQUFBLHNCQUNGO0FBQUEsc0JBRUMsMEJBQWdCO0FBQUE7QUFBQSxvQkFYWixTQUFTLElBQUksTUFBTTtBQUFBLG9CQUQxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQWFBO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUVBLG9CQUFRLFFBQVEsQ0FBQyxLQUFLLFFBQVE7QUFDNUIsa0JBQUksSUFBSSxjQUFjLGNBQWM7QUFDbEM7QUFBQSxjQUNGLE9BQU87QUFDTCwwQkFBVTtBQUNWLCtCQUFlLElBQUk7QUFDbkIsMEJBQVU7QUFBQSxjQUNaO0FBQUEsWUFDRixDQUFDO0FBQ0Qsc0JBQVU7QUFDVixtQkFBTztBQUFBLFVBQ1QsR0FBRztBQUFBLFVBQ0gsdUJBQUMsUUFBRyxXQUFVLDRDQUFkO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXVEO0FBQUEsYUF6Q3pEO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUEwQ0E7QUFBQSxRQUdGLHVCQUFDLFFBQUcsV0FBVSxxSUFFWjtBQUFBLGlDQUFDLFFBQUcsV0FBVSxvRUFBbUUsT0FBTyxtQkFBbUIsU0FBUyxJQUFJLEtBQXhIO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQTJIO0FBQUEsVUFHM0gsdUJBQUMsUUFBRyxXQUFXLDhEQUE4RCxPQUFPLEVBQUUsR0FBRyxtQkFBbUIsWUFBWSxJQUFJLEdBQUcsZUFBZSxTQUFTLEdBQ3JKO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxXQUFVO0FBQUEsY0FDVixTQUFTLE1BQU0sZ0JBQWdCLDhCQUE4QixTQUFTLEtBQUssWUFBWSxXQUFXLDhCQUE4QixNQUFNO0FBQUEsY0FFcEksd0NBQThCLFNBQVMsS0FBSyxZQUFZLFdBQVcsOEJBQThCLFVBQ2pHLHVCQUFDLFNBQU0sV0FBVSxpQ0FBZ0MsYUFBYSxLQUE5RDtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUFpRTtBQUFBO0FBQUEsWUFMckU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFVBT0EsS0FSRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVNBO0FBQUEsVUFHQyxRQUFRLElBQUksU0FBTztBQUNsQixrQkFBTSxjQUFjLGlCQUFpQixJQUFJLEVBQUU7QUFDM0Msa0JBQU0sUUFBUSxjQUFjLEtBQU0sYUFBYSxJQUFJLEVBQUUsS0FBSztBQUMxRCxtQkFDQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUVDLFdBQVM7QUFBQSxnQkFDVCxhQUFhLENBQUMsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEVBQUU7QUFBQSxnQkFDbkQsWUFBWSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxFQUFFO0FBQUEsZ0JBQ2pELGFBQWEsQ0FBQyxNQUFNLEVBQUUsZUFBZTtBQUFBLGdCQUNyQyxRQUFRLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEVBQUU7QUFBQSxnQkFDekMsZUFBZSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxFQUFFO0FBQUEsZ0JBQ3ZELE9BQU8sRUFBRSxPQUFPLFVBQVUsT0FBTyxVQUFVLE9BQU8sR0FBRyxtQkFBbUIsSUFBSSxJQUFJLElBQUksRUFBRTtBQUFBLGdCQUN0RixXQUFXLHFGQUFxRixjQUFjLG1CQUFtQixvQ0FBb0MsZ0NBQ25LLHFCQUFxQixJQUFJLEtBQUssK0RBQStELEVBQy9GLElBQUksa0JBQWtCLFNBQVMsSUFBSSxFQUFFLElBQUksd0JBQXdCLEVBQUU7QUFBQSxnQkFDbkUsU0FBUyxDQUFDLE1BQU07QUFDZCxzQkFBSSxhQUFhO0FBQ2Ysd0NBQW9CLFFBQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxNQUFNLEVBQUU7QUFBQSxrQkFDdEQsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUUsU0FBUztBQUMvQyx5Q0FBcUIsVUFBUSxLQUFLLFNBQVMsSUFBSSxFQUFFLElBQUksS0FBSyxPQUFPLFFBQU0sT0FBTyxJQUFJLEVBQUUsSUFBSSxDQUFDLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUFBLGtCQUMzRyxPQUFPO0FBQ0wseUNBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7QUFBQSxrQkFDL0I7QUFBQSxnQkFDRjtBQUFBLGdCQUVBLGlDQUFDLFNBQUksV0FBVSw0REFBMkQsT0FBTyxjQUFjLElBQUksUUFBUSxRQUN4RztBQUFBLG1CQUFDLGNBQ0Esd0JBQXdCLElBQUksS0FDMUI7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsV0FBUztBQUFBLHNCQUNULGNBQWMsSUFBSTtBQUFBLHNCQUNsQixNQUFNO0FBQUEsc0JBQ04sV0FBVTtBQUFBLHNCQUNWLFFBQVEsQ0FBQyxNQUFNO0FBQ2IsOEJBQU0sTUFBTSxFQUFFLE9BQU8sTUFBTSxLQUFLO0FBQ2hDLDRCQUFJLEtBQUs7QUFDUCxxQ0FBVyxVQUFRLEtBQUssSUFBSSxPQUFLLEVBQUUsT0FBTyxJQUFJLEtBQUssRUFBRSxHQUFHLEdBQUcsT0FBTyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQUEsd0JBQzlFO0FBQ0EsK0NBQXVCLElBQUk7QUFBQSxzQkFDN0I7QUFBQSxzQkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw0QkFBSSxFQUFFLFFBQVEsV0FBVyxDQUFDLEVBQUUsVUFBVTtBQUNwQyw0QkFBRSxlQUFlO0FBQ2pCLGdDQUFNLE1BQU0sRUFBRSxjQUFjLE1BQU0sS0FBSztBQUN2Qyw4QkFBSSxLQUFLO0FBQ1AsdUNBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQztBQUFBLDBCQUM5RTtBQUNBLGlEQUF1QixJQUFJO0FBQUEsd0JBQzdCO0FBQ0EsNEJBQUksRUFBRSxRQUFRLFVBQVU7QUFDdEIsaURBQXVCLElBQUk7QUFBQSx3QkFDN0I7QUFBQSxzQkFDRjtBQUFBO0FBQUEsb0JBeEJGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkF5QkEsSUFFQTtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFDQyxXQUFVO0FBQUEsc0JBQ1YsY0FBYyxDQUFDLE1BQU07QUFDbkIsNEJBQUksSUFBSSxhQUFhO0FBQ25CLGdDQUFNLE9BQU8sRUFBRSxjQUFjLHNCQUFzQjtBQUNuRCw4Q0FBb0IsRUFBRSxHQUFHLEtBQUssTUFBTSxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7QUFDeEQsNkNBQW1CLElBQUksRUFBRTtBQUFBLHdCQUMzQjtBQUFBLHNCQUNGO0FBQUEsc0JBQ0EsY0FBYyxNQUFNO0FBQ2xCLDJDQUFtQixJQUFJO0FBQUEsc0JBQ3pCO0FBQUEsc0JBQ0EsZUFBZSxNQUFNLHVCQUF1QixJQUFJLEVBQUU7QUFBQSxzQkFFakQsY0FBSTtBQUFBO0FBQUEsb0JBZFA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQWVBLElBR0YsdUJBQUMsVUFBSyxXQUFVLDBIQUF5SCxPQUFPLFNBQVMsSUFBSSxLQUFLLGVBQWUsbUJBQWpMO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBRUE7QUFBQSxrQkFHRCxDQUFDLGVBQWUsa0JBQWtCLElBQUksRUFBRSxLQUN2Qyx1QkFBQyxVQUFPLFdBQVUsZ0NBQWxCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQStDO0FBQUEsa0JBSWpEO0FBQUEsb0JBQUM7QUFBQTtBQUFBLHNCQUNDLGFBQWEsQ0FBQyxNQUFNO0FBQ2xCLDBCQUFFLGdCQUFnQjtBQUNsQiwwQkFBRSxlQUFlO0FBQ2pCLHlDQUFpQixJQUFJLEVBQUU7QUFDdkIsd0NBQWdCLEVBQUUsT0FBTztBQUN6Qiw0Q0FBb0IsYUFBYSxJQUFJLEVBQUUsS0FBSyxHQUFHO0FBQUEsc0JBQ2pEO0FBQUEsc0JBQ0EsV0FBVTtBQUFBLHNCQUNWLE9BQU07QUFBQTtBQUFBLG9CQVRSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFVQTtBQUFBLHFCQXBFRjtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQXFFQTtBQUFBO0FBQUEsY0ExRkssSUFBSTtBQUFBLGNBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQTRGQTtBQUFBLFVBQ0QsQ0FBQztBQUFBLFVBR0YsdUJBQUMsUUFBRyxXQUFVLHNIQUNaO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxJQUFHO0FBQUEsY0FDSCxTQUFTLE1BQU0sc0JBQXNCLElBQUk7QUFBQSxjQUN6QyxXQUFVO0FBQUEsY0FFVjtBQUFBLHVDQUFDLFFBQUssV0FBVSxpQkFBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBOEI7QUFBQSxnQkFBRTtBQUFBO0FBQUE7QUFBQSxZQUxsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFPQSxLQVJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBU0E7QUFBQSxhQTlIRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBZ0lBO0FBQUEsV0EzTEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQTRMQTtBQUFBLE1BR0EsdUJBQUMsV0FBTSxXQUFVLHlGQUNkO0FBQUEsc0NBQThCLFdBQVcsSUFDeEMsdUJBQUMsUUFDQyxpQ0FBQyxRQUFHLFNBQVMsUUFBUSxTQUFTLEdBQUcsV0FBVSx3REFDekMsaUNBQUMsU0FBSSxXQUFVLG9DQUNiO0FBQUEsaUNBQUMsYUFBVSxXQUFVLHNEQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUF3RTtBQUFBLFVBQ3hFLHVCQUFDLFVBQUssV0FBVSx1QkFBc0IsZ0NBQXRDO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXNEO0FBQUEsVUFDdEQsdUJBQUMsVUFBSyxXQUFVLHNCQUFxQixvRUFBckM7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBeUY7QUFBQSxhQUgzRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBSUEsS0FMRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBTUEsS0FQRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBUUEsSUFFQSw4QkFBOEIsSUFBSSxDQUFDLFFBQ2pDO0FBQUEsVUFBQztBQUFBO0FBQUEsWUFFQztBQUFBLFlBQ0EsWUFBWSxZQUFZLFNBQVMsSUFBSSxFQUFFO0FBQUEsWUFDdkM7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBLFVBQVUsa0JBQWtCLFVBQVUsSUFBSTtBQUFBLFlBQzFDLGFBQWEsa0JBQWtCLFVBQVUsSUFBSSxLQUFLLGlCQUFpQixRQUFRO0FBQUEsWUFDM0UsaUJBQWlCLENBQUMsQ0FBQyxZQUFZLElBQUksRUFBRSxLQUFLLFlBQVksSUFBSSxFQUFFLEVBQUUsV0FBVyxhQUFhO0FBQUEsWUFDdEYsY0FBYyxZQUFZLElBQUksRUFBRSxHQUFHLFlBQVk7QUFBQSxZQUMvQyxnQkFBZ0IsMkJBQTJCLElBQUk7QUFBQSxZQUMvQyxnQkFBZ0IsMkJBQTJCLElBQUk7QUFBQSxZQUMvQyxjQUFjLHlCQUF5QixJQUFJO0FBQUEsWUFDM0M7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBRUE7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUE7QUFBQSxVQXhDSyxJQUFJO0FBQUEsVUFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBMENBLENBQ0Q7QUFBQSxRQUlILHVCQUFDLFFBQ0MsaUNBQUMsUUFBRyxXQUFVLDZDQUE0QyxTQUFTLFFBQVEsU0FBUyxHQUNsRjtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsSUFBRztBQUFBLFlBQ0gsU0FBUztBQUFBLFlBQ1QsV0FBVTtBQUFBLFlBRVY7QUFBQSxxQ0FBQyxRQUFLLFdBQVUsYUFBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBMEI7QUFBQSxjQUFFO0FBQUE7QUFBQTtBQUFBLFVBTDlCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU9BLEtBUkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQVNBLEtBVkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQVdBO0FBQUEsV0F2RUY7QUFBQTtBQUFBO0FBQUE7QUFBQSxhQXlFQTtBQUFBLFNBcFJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FxUkEsS0F0UkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQXVSQTtBQUFBLElBR0Msc0JBQ0M7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLFFBQVE7QUFBQSxRQUNSLFNBQVMsTUFBTTtBQUNiLGdDQUFzQixLQUFLO0FBQzNCLGdDQUFzQixJQUFJO0FBQzFCLDJCQUFpQixFQUFFO0FBQ25CLDJCQUFpQixNQUFNO0FBQ3ZCLG1DQUF5QixFQUFFO0FBQUEsUUFDN0I7QUFBQSxRQUNBLE9BQU8scUJBQXFCLFlBQVk7QUFBQSxRQUV0QyxpQ0FBQyxTQUFJLFdBQVUsYUFDYjtBQUFBLGlDQUFDLFNBQ0M7QUFBQSxtQ0FBQyxXQUFNLFdBQVUsa0VBQWlFLHlDQUFsRjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUEyRztBQUFBLFlBQzNHO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsTUFBSztBQUFBLGdCQUNMLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssaUJBQWlCLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQzlDLGFBQVk7QUFBQSxnQkFDWixXQUFTO0FBQUEsZ0JBQ1QsV0FBVyxPQUFLLEVBQUUsUUFBUSxXQUFXLDRCQUE0QjtBQUFBLGdCQUNqRSxXQUFVO0FBQUE7QUFBQSxjQVBaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVFBO0FBQUEsZUFWRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVdBO0FBQUEsVUFFQSx1QkFBQyxTQUNDO0FBQUEsbUNBQUMsV0FBTSxXQUFVLGtFQUFpRSxvQ0FBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBc0c7QUFBQSxZQUN0RztBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssaUJBQWlCLEVBQUUsT0FBTyxLQUFtQjtBQUFBLGdCQUM1RCxXQUFVO0FBQUEsZ0JBRVY7QUFBQSx5Q0FBQyxZQUFPLE9BQU0sUUFBTywwQkFBckI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBK0I7QUFBQSxrQkFDL0IsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQWtDO0FBQUEsa0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxRQUFPLHlCQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUE4QjtBQUFBLGtCQUM5Qix1QkFBQyxZQUFPLE9BQU0sWUFBVywrQkFBekI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBd0M7QUFBQSxrQkFDeEMsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQWtDO0FBQUEsa0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxVQUFTLDJCQUF2QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFrQztBQUFBLGtCQUNsQyx1QkFBQyxZQUFPLE9BQU0sWUFBVyw4QkFBekI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBdUM7QUFBQSxrQkFDdkMsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQWtDO0FBQUEsa0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxXQUFVLDRCQUF4QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFvQztBQUFBLGtCQUNwQyx1QkFBQyxZQUFPLE9BQU0sVUFBUyxnQ0FBdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBdUM7QUFBQSxrQkFDdkMsdUJBQUMsWUFBTyxPQUFNLGdCQUFlLDJCQUE3QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUF3QztBQUFBLGtCQUN4Qyx1QkFBQyxZQUFPLE9BQU0sVUFBUywyQkFBdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBa0M7QUFBQTtBQUFBO0FBQUEsY0FoQnBDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQWlCQTtBQUFBLGVBbkJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBb0JBO0FBQUEsVUFFQyxrQkFBa0IsWUFDakIsdUJBQUMsU0FBSSxXQUFVLGFBQ2I7QUFBQSxtQ0FBQyxTQUNDO0FBQUEscUNBQUMsV0FBTSxXQUFVLGtFQUFpRSxpQ0FBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBbUc7QUFBQSxjQUNuRztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsa0JBQ1AsVUFBVSxPQUFLLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLGtCQUNqRCxXQUFVO0FBQUEsa0JBRVY7QUFBQSwyQ0FBQyxZQUFPLE9BQU0sSUFBRyx3QkFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBeUI7QUFBQSxvQkFDeEIsS0FBSyxJQUFJLE9BQ1IsdUJBQUMsWUFBa0IsT0FBTyxFQUFFLElBQUssWUFBRSxnQkFBdEIsRUFBRSxJQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBQWdELENBQ2pEO0FBQUE7QUFBQTtBQUFBLGdCQVJIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQVNBO0FBQUEsaUJBWEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFZQTtBQUFBLFlBQ0EsdUJBQUMsU0FDQztBQUFBLHFDQUFDLFdBQU0sV0FBVSxrRUFBaUUscUNBQWxGO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQXVHO0FBQUEsY0FDdkc7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsT0FBTztBQUFBLGtCQUNQLFVBQVUsT0FBSywyQkFBMkIsRUFBRSxPQUFPLEtBQUs7QUFBQSxrQkFDeEQsV0FBVTtBQUFBLGtCQUVWO0FBQUEsMkNBQUMsWUFBTyxPQUFNLElBQUcsdUJBQWpCO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBQXdCO0FBQUEsb0JBQ3hCLHVCQUFDLFlBQU8sT0FBTSxTQUFRLDBCQUF0QjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUFnQztBQUFBLG9CQUMvQixRQUFRLElBQUksT0FDWCx1QkFBQyxZQUFrQixPQUFPLEVBQUUsSUFBSyxZQUFFLFNBQXRCLEVBQUUsSUFBZjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUF5QyxDQUMxQztBQUFBO0FBQUE7QUFBQSxnQkFUSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FVQTtBQUFBLGlCQVpGO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBYUE7QUFBQSxZQUNBLHVCQUFDLFNBQ0M7QUFBQSxxQ0FBQyxXQUFNLFdBQVUsa0VBQWlFLDRDQUFsRjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUE4RztBQUFBLGNBQzlHO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLE9BQU87QUFBQSxrQkFDUCxVQUFVLE9BQUssK0JBQStCLEVBQUUsT0FBTyxLQUFLO0FBQUEsa0JBQzVELFdBQVU7QUFBQSxrQkFDVixVQUFVLENBQUM7QUFBQSxrQkFFWDtBQUFBLDJDQUFDLFlBQU8sT0FBTSxJQUFHLDBCQUFqQjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUEyQjtBQUFBLG9CQUMzQix1QkFBQyxZQUFPLE9BQU0sU0FBUSwwQkFBdEI7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBZ0M7QUFBQSxvQkFDL0Isb0JBQW9CLGFBQWEsZ0JBQWdCLEdBQUcsU0FBUyxJQUFJLENBQUMsTUFDakUsdUJBQUMsWUFBa0IsT0FBTyxFQUFFLElBQUssWUFBRSxTQUF0QixFQUFFLElBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBeUMsQ0FDMUM7QUFBQTtBQUFBO0FBQUEsZ0JBVkg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBV0E7QUFBQSxpQkFiRjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQWNBO0FBQUEsWUFDQSx1QkFBQyxTQUNDO0FBQUEscUNBQUMsV0FBTSxXQUFVLGtFQUFpRSxxQ0FBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBdUc7QUFBQSxjQUN2RztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxPQUFPO0FBQUEsa0JBQ1AsVUFBVSxPQUFLLGdDQUFnQyxFQUFFLE9BQU8sS0FBSztBQUFBLGtCQUM3RCxXQUFVO0FBQUEsa0JBQ1YsVUFBVSxDQUFDO0FBQUEsa0JBRVg7QUFBQSwyQ0FBQyxZQUFPLE9BQU0sSUFBRyx3QkFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBeUI7QUFBQSxvQkFDekIsdUJBQUMsWUFBTyxPQUFNLFNBQVEsMEJBQXRCO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBQWdDO0FBQUEsb0JBQy9CLG9CQUFvQixhQUFhLGdCQUFnQixHQUFHLFNBQVMsSUFBSSxDQUFDLE1BQ2pFLHVCQUFDLFlBQWtCLE9BQU8sRUFBRSxJQUFLLFlBQUUsU0FBdEIsRUFBRSxJQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBQXlDLENBQzFDO0FBQUE7QUFBQTtBQUFBLGdCQVZIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQVdBO0FBQUEsaUJBYkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFjQTtBQUFBLGVBekRGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBMERBO0FBQUEsVUFHRCxrQkFBa0IsYUFDakIsdUJBQUMsU0FDQztBQUFBLG1DQUFDLFNBQUksV0FBVSw0Q0FDYjtBQUFBLHFDQUFDLFdBQU0sV0FBVSwyREFBMEQsaUNBQTNFO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQTRGO0FBQUEsY0FDNUY7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsU0FBUyxNQUFNLG1CQUFtQixJQUFJO0FBQUEsa0JBQ3RDLFdBQVU7QUFBQSxrQkFFVjtBQUFBLDJDQUFDLGNBQVcsV0FBVSxpQkFBdEI7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBb0M7QUFBQSxvQkFBRTtBQUFBO0FBQUE7QUFBQSxnQkFKeEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBTUE7QUFBQSxpQkFSRjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQVNBO0FBQUEsWUFDQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE1BQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLGdCQUFnQixFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUM3QyxhQUFZO0FBQUEsZ0JBQ1osV0FBVTtBQUFBO0FBQUEsY0FMWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLFlBQ0EsdUJBQUMsT0FBRSxXQUFVLCtEQUNYO0FBQUEscUNBQUMsWUFBTyxxQkFBUjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUFhO0FBQUEsY0FBUztBQUFBLGlCQUR4QjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVBO0FBQUEsZUFwQkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFxQkE7QUFBQSxVQUdELGtCQUFrQixZQUNqQix1QkFBQyxTQUNDO0FBQUEsbUNBQUMsV0FBTSxXQUFVLGtFQUFpRSxxQkFBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBdUY7QUFBQSxZQUN2RjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE1BQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUNqRCxhQUFZO0FBQUEsZ0JBQ1osV0FBVTtBQUFBO0FBQUEsY0FMWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLFlBQ0EsdUJBQUMsV0FBTSxXQUFVLGtFQUFpRSxrQkFBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBb0Y7QUFBQSxZQUNwRjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUsscUJBQXFCLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQ2xELFdBQVU7QUFBQSxnQkFFVjtBQUFBLHlDQUFDLFlBQU8sT0FBTSxjQUFhLCtCQUEzQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUEwQztBQUFBLGtCQUMxQyx1QkFBQyxZQUFPLE9BQU0sZUFBYyx5QkFBNUI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBcUM7QUFBQTtBQUFBO0FBQUEsY0FOdkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBT0E7QUFBQSxlQWpCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQWtCQTtBQUFBLFVBR0Qsa0JBQWtCLGtCQUNqQix1QkFBQyxTQUNDO0FBQUEsbUNBQUMsT0FBRSxXQUFVLG9EQUFtRCxpRUFBaEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBaUg7QUFBQSxZQUNqSCx1QkFBQyxXQUFNLFdBQVUsa0VBQWlFLGdDQUFsRjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFrRztBQUFBLFlBQ2xHO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsT0FBTztBQUFBLGdCQUNQLFVBQVUsT0FBSyw0QkFBNEIsRUFBRSxPQUFPLEtBQUs7QUFBQSxnQkFDekQsV0FBVTtBQUFBLGdCQUVWO0FBQUEseUNBQUMsWUFBTyxPQUFNLElBQUcsMkJBQWpCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQTRCO0FBQUEsa0JBQzNCLFFBQVEsSUFBSSxPQUNYLHVCQUFDLFlBQWtCLE9BQU8sRUFBRSxJQUFLLFlBQUUsU0FBdEIsRUFBRSxJQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQXlDLENBQzFDO0FBQUE7QUFBQTtBQUFBLGNBUkg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBU0E7QUFBQSxZQUNBLHVCQUFDLFdBQU0sV0FBVSxrRUFBaUUsa0NBQWxGO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQW9HO0FBQUEsWUFDcEc7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLDBCQUEwQixFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUN2RCxXQUFVO0FBQUEsZ0JBRVY7QUFBQSx5Q0FBQyxZQUFPLE9BQU0sSUFBRywyQkFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBNEI7QUFBQSxrQkFDM0IsUUFBUSxJQUFJLE9BQ1gsdUJBQUMsWUFBa0IsT0FBTyxFQUFFLElBQUssWUFBRSxTQUF0QixFQUFFLElBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBeUMsQ0FDMUM7QUFBQTtBQUFBO0FBQUEsY0FSSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFTQTtBQUFBLFlBQ0EsdUJBQUMsV0FBTSxXQUFVLHVFQUFzRSx1QkFBdkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBOEY7QUFBQSxZQUM5RjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE1BQUs7QUFBQSxnQkFDTCxLQUFJO0FBQUEsZ0JBQ0osS0FBSTtBQUFBLGdCQUNKLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssOEJBQThCLE9BQU8sRUFBRSxPQUFPLEtBQUssQ0FBQztBQUFBLGdCQUNuRSxXQUFVO0FBQUE7QUFBQSxjQU5aO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU9BO0FBQUEsZUFoQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFpQ0E7QUFBQSxVQUdELGtCQUFrQixZQUNqQix1QkFBQyxTQUNDO0FBQUEsbUNBQUMsT0FBRSxXQUFVLG9EQUFtRCw4Q0FBaEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBOEY7QUFBQSxZQUM5Rix1QkFBQyxXQUFNLFdBQVUsa0VBQWlFLHVDQUFsRjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUF5RztBQUFBLFlBQ3pHO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsTUFBSztBQUFBLGdCQUNMLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUsseUJBQXlCLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQ3RELGFBQVk7QUFBQSxnQkFDWixXQUFVO0FBQUE7QUFBQSxjQUxaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU1BO0FBQUEsZUFURjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVVBO0FBQUEsVUFHRCxrQkFBa0IsWUFDakIsdUJBQUMsU0FDQztBQUFBLG1DQUFDLE9BQUUsV0FBVSxvREFBbUQsNERBQWhFO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQTRHO0FBQUEsWUFDNUcsdUJBQUMsV0FBTSxXQUFVLGtFQUFpRSw2Q0FBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBK0c7QUFBQSxZQUMvRztBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE1BQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLHNCQUFzQixFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUNuRCxhQUFZO0FBQUEsZ0JBQ1osV0FBVTtBQUFBO0FBQUEsY0FMWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFNQTtBQUFBLGVBVEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFVQTtBQUFBLFVBR0Qsa0JBQWtCLGNBQ2pCLHVCQUFDLFNBQ0MsaUNBQUMsT0FBRSxXQUFVLG9EQUFtRCw4Q0FBaEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBOEYsS0FEaEc7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFFQTtBQUFBLFVBR0Qsa0JBQWtCLFlBQ2pCLHVCQUFDLFNBQUksV0FBVSxhQUNiO0FBQUEsbUNBQUMsV0FBTSxXQUFVLGtFQUFpRSw0QkFBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBOEY7QUFBQSxZQUM5RjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssb0JBQW9CLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQ2pELFdBQVU7QUFBQSxnQkFFVjtBQUFBLHlDQUFDLFlBQU8sT0FBTSxJQUFHLGtCQUFqQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFtQjtBQUFBLGtCQUNsQixRQUFRLE9BQU8sT0FBSyxFQUFFLFNBQVMsVUFBVSxFQUFFLElBQUksT0FDOUMsdUJBQUMsWUFBa0IsT0FBTyxFQUFFLElBQUssWUFBRSxTQUF0QixFQUFFLElBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBeUMsQ0FDMUM7QUFBQTtBQUFBO0FBQUEsY0FSSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFTQTtBQUFBLFlBRUEsdUJBQUMsV0FBTSxXQUFVLGtFQUFpRSxxQkFBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBdUY7QUFBQSxZQUN2RjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssc0JBQXNCLEVBQUUsT0FBTyxLQUFZO0FBQUEsZ0JBQzFELFdBQVU7QUFBQSxnQkFFVjtBQUFBLHlDQUFDLFlBQU8sT0FBTSxTQUFRLHFCQUF0QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUEyQjtBQUFBLGtCQUMzQix1QkFBQyxZQUFPLE9BQU0sZ0JBQWUsd0JBQTdCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQXFDO0FBQUE7QUFBQTtBQUFBLGNBTnZDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU9BO0FBQUEsZUFyQkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFzQkE7QUFBQSxVQUlELENBQUMsVUFBVSxXQUFXLFVBQVUsUUFBUSxFQUFFLFNBQVMsYUFBYSxLQUMvRCx1QkFBQyxTQUNDO0FBQUEsbUNBQUMsV0FBTSxXQUFVLGtFQUFpRSw4Q0FBbEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBZ0g7QUFBQSxZQUNoSDtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLE1BQUs7QUFBQSxnQkFDTCxLQUFJO0FBQUEsZ0JBQ0osS0FBSTtBQUFBLGdCQUNKLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssc0JBQXNCLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQ25ELGFBQVk7QUFBQSxnQkFDWixXQUFVO0FBQUE7QUFBQSxjQVBaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVFBO0FBQUEsZUFWRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVdBO0FBQUEsVUFHRix1QkFBQyxTQUFJLFdBQVUsK0JBQ2I7QUFBQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFNBQVMsTUFBTTtBQUNiLHdDQUFzQixLQUFLO0FBQzNCLHdDQUFzQixJQUFJO0FBQzFCLG1DQUFpQixFQUFFO0FBQ25CLG1DQUFpQixNQUFNO0FBQ3ZCLDJDQUF5QixFQUFFO0FBQUEsZ0JBQzdCO0FBQUEsZ0JBQ0EsV0FBVTtBQUFBLGdCQUNYO0FBQUE7QUFBQSxjQVREO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVdBO0FBQUEsWUFDQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFNBQVM7QUFBQSxnQkFDVCxXQUFVO0FBQUEsZ0JBRVQsK0JBQXFCLE9BQU87QUFBQTtBQUFBLGNBSi9CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQUtBO0FBQUEsZUFsQkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFtQkE7QUFBQSxhQXJSRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBc1JBO0FBQUE7QUFBQSxNQWpTSjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFrU0E7QUFBQSxJQUlELGtCQUNDO0FBQUEsTUFBQztBQUFBO0FBQUEsUUFDQyxRQUFRLENBQUMsQ0FBQztBQUFBLFFBQ1YsU0FBUyxNQUFNLGtCQUFrQixJQUFJO0FBQUEsUUFDckMsT0FBTyx1QkFBQyxVQUFLLFdBQVUsb0JBQW1CLHVCQUFuQztBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQTBDO0FBQUEsUUFDakQsTUFBTSx1QkFBQyxlQUFZLFdBQVUsOEJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBa0Q7QUFBQSxRQUV0RDtBQUFBLGlDQUFDLE9BQUUsV0FBVSw4REFDWDtBQUFBLG1DQUFDLFlBQU8sV0FBVSx5QkFBd0I7QUFBQTtBQUFBLGNBQUUsUUFBUSxLQUFLLE9BQUssRUFBRSxPQUFPLGNBQWMsR0FBRztBQUFBLGNBQU07QUFBQSxpQkFBOUY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBK0Y7QUFBQSxZQUFTO0FBQUEsZUFEMUc7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFFQTtBQUFBLFVBQ0EsdUJBQUMsU0FBSSxXQUFVLDBCQUNiO0FBQUE7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxTQUFTLE1BQU0sa0JBQWtCLElBQUk7QUFBQSxnQkFDckMsV0FBVTtBQUFBLGdCQUNYO0FBQUE7QUFBQSxjQUhEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQUtBO0FBQUEsWUFDQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFNBQVM7QUFBQSxnQkFDVCxXQUFVO0FBQUEsZ0JBQ1g7QUFBQTtBQUFBLGNBSEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBS0E7QUFBQSxlQVpGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBYUE7QUFBQTtBQUFBO0FBQUEsTUF0Qko7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBdUJBO0FBQUEsSUFJRCx1QkFDQztBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsUUFBUTtBQUFBLFFBQ1IsU0FBUyxNQUFNLHVCQUF1QixLQUFLO0FBQUEsUUFDM0MsT0FBTTtBQUFBLFFBQ04sTUFBTSx1QkFBQyxTQUFNLFdBQVUsb0NBQWpCO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBa0Q7QUFBQSxRQUN4RCxZQUFZO0FBQUEsUUFFVixpQ0FBQyxTQUFJLFdBQVUsYUFDYjtBQUFBLGlDQUFDLFNBQUksV0FBVSwyQkFDYjtBQUFBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsTUFBSztBQUFBLGdCQUNMLE9BQU87QUFBQSxnQkFDUCxVQUFVLE9BQUssbUJBQW1CLEVBQUUsT0FBTyxLQUFLO0FBQUEsZ0JBQ2hELGFBQVk7QUFBQSxnQkFDWixXQUFXLE9BQUs7QUFDZCxzQkFBSSxFQUFFLFFBQVEsV0FBVyxnQkFBZ0IsS0FBSyxHQUFHO0FBQy9DLDBCQUFNLFFBQVEsT0FBTyxLQUFLLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLENBQUM7QUFDcEQscUNBQWlCLFVBQVEsQ0FBQyxHQUFHLE1BQU0sRUFBRSxJQUFJLE9BQU8sTUFBTSxnQkFBZ0IsS0FBSyxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDOUYsdUNBQW1CLEVBQUU7QUFBQSxrQkFDdkI7QUFBQSxnQkFDRjtBQUFBLGdCQUNBLFdBQVU7QUFBQTtBQUFBLGNBWlo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBYUE7QUFBQSxZQUNBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsU0FBUyxNQUFNO0FBQ2Isc0JBQUksZ0JBQWdCLEtBQUssR0FBRztBQUMxQiwwQkFBTSxRQUFRLE9BQU8sS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDO0FBQ3BELHFDQUFpQixVQUFRLENBQUMsR0FBRyxNQUFNLEVBQUUsSUFBSSxPQUFPLE1BQU0sZ0JBQWdCLEtBQUssR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQzlGLHVDQUFtQixFQUFFO0FBQUEsa0JBQ3ZCO0FBQUEsZ0JBQ0Y7QUFBQSxnQkFDQSxXQUFVO0FBQUEsZ0JBRVY7QUFBQSx5Q0FBQyxRQUFLLFdBQVUsOEJBQWhCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQTJDO0FBQUEsa0JBQUU7QUFBQTtBQUFBO0FBQUEsY0FWL0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBV0E7QUFBQSxlQTFCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQTJCQTtBQUFBLFVBRUEsdUJBQUMsU0FBSSxXQUFVLGdIQUNaO0FBQUEsMEJBQWMsV0FBVyxLQUN4Qix1QkFBQyxPQUFFLFdBQVUsc0RBQXFELDhCQUFsRTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFnRjtBQUFBLFlBRWpGLGNBQWMsSUFBSSxPQUNqQix1QkFBQyxTQUFlLFdBQVUscU1BQ3hCO0FBQUEscUNBQUMsU0FBSSxXQUFVLDJCQUNiO0FBQUEsdUNBQUMsU0FBSSxXQUFVLGtLQUNaLFlBQUUsS0FBSyxPQUFPLENBQUMsS0FEbEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFFQTtBQUFBLGdCQUNBLHVCQUFDLFVBQUssV0FBVSx1REFBdUQsWUFBRSxRQUF6RTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUE4RTtBQUFBLG1CQUpoRjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUtBO0FBQUEsY0FDQTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxTQUFTLE1BQU07QUFDYix3QkFBSSxRQUFRLElBQUksRUFBRSxJQUFJO0FBQUEscUNBQTBELEdBQUc7QUFDakYsdUNBQWlCLFVBQVEsS0FBSyxPQUFPLE9BQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDO0FBQ3hELHNDQUFnQixVQUFRLEtBQUssSUFBSSxVQUFRO0FBQUEsd0JBQ3ZDLEdBQUc7QUFBQSx3QkFDSCxXQUFXLElBQUksVUFBVSxPQUFPLE9BQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtBQUFBLHNCQUNwRCxFQUFFLENBQUM7QUFBQSxvQkFDTDtBQUFBLGtCQUNGO0FBQUEsa0JBQ0EsV0FBVTtBQUFBLGtCQUVWLGlDQUFDLFVBQU8sV0FBVSxpQkFBbEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBZ0M7QUFBQTtBQUFBLGdCQVpsQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FhQTtBQUFBLGlCQXBCUSxFQUFFLElBQVo7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFxQkEsQ0FDRDtBQUFBLGVBM0JIO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBNEJBO0FBQUEsYUExREY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQTJEQTtBQUFBO0FBQUEsTUFsRUo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBbUVBO0FBQUEsSUFJRCxtQkFBbUIsb0JBQW9CO0FBQUEsTUFDdEM7QUFBQSxRQUFDO0FBQUE7QUFBQSxVQUNDLE9BQU8sRUFBRSxLQUFLLGlCQUFpQixHQUFHLE1BQU0saUJBQWlCLEdBQUcsVUFBVSxRQUFRO0FBQUEsVUFDOUUsV0FBVTtBQUFBLFVBRVQsa0JBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxlQUFlLEdBQUc7QUFBQTtBQUFBLFFBSmhEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtBO0FBQUEsTUFDQSxTQUFTO0FBQUEsSUFDWDtBQUFBLElBR0Msc0JBQXNCLHFCQUFxQjtBQUFBLE1BQzFDO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDQyxLQUFLO0FBQUEsVUFDTCxPQUFPLEVBQUUsS0FBSyxrQkFBa0IsS0FBSyxNQUFNLGtCQUFrQixNQUFNLFVBQVUsUUFBUTtBQUFBLFVBQ3JGLFdBQVU7QUFBQSxVQUNWLGFBQWEsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCO0FBQUEsVUFFdEM7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLE1BQUs7QUFBQSxjQUNMLFdBQVM7QUFBQSxjQUNULE9BQU8sa0JBQWtCLGtCQUFrQixLQUFLO0FBQUEsY0FDaEQsVUFBVSxDQUFDLE1BQU0scUJBQXFCLFdBQVMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLE9BQU8sTUFBTSxFQUFFO0FBQUEsY0FDakcsYUFBYSxHQUFHLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxrQkFBa0IsR0FBRyxTQUFTLEVBQUU7QUFBQSxjQUMzRSxXQUFVO0FBQUE7QUFBQSxZQU5aO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQU9BO0FBQUE7QUFBQSxRQWJGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQWNBO0FBQUEsTUFDQSxTQUFTO0FBQUEsSUFDWDtBQUFBLElBR0MsNEJBQ0M7QUFBQSxNQUFDO0FBQUE7QUFBQSxRQUNDLFFBQVE7QUFBQSxRQUNSLFNBQVMsTUFBTSw0QkFBNEIsSUFBSTtBQUFBLFFBQy9DLE9BQU07QUFBQSxRQUVOLGlDQUFDLFNBQUksV0FBVSxhQUNiO0FBQUEsaUNBQUMsU0FDQztBQUFBLG1DQUFDLFdBQU0sV0FBVSxrRUFBaUUsMkNBQWxGO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQTZHO0FBQUEsWUFDN0c7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxPQUFPO0FBQUEsZ0JBQ1AsVUFBVSxPQUFLLG9CQUFvQixFQUFFLE9BQU8sS0FBSztBQUFBLGdCQUNqRCxhQUFZO0FBQUEsZ0JBQ1osV0FBVTtBQUFBLGdCQUNWLFdBQVM7QUFBQTtBQUFBLGNBTFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBTUE7QUFBQSxlQVJGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBU0E7QUFBQSxVQUNBLHVCQUFDLFNBQUksV0FBVSwrQkFDYjtBQUFBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsU0FBUyxNQUFNLDRCQUE0QixJQUFJO0FBQUEsZ0JBQy9DLFdBQVU7QUFBQSxnQkFDWDtBQUFBO0FBQUEsY0FIRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFLQTtBQUFBLFlBQ0E7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxTQUFTLE1BQU07QUFDYiw2QkFBVyxVQUFRLEtBQUssSUFBSSxPQUFLLEVBQUUsT0FBTywyQkFBMkIsRUFBRSxHQUFHLEdBQUcsYUFBYSxpQkFBaUIsSUFBSSxDQUFDLENBQUM7QUFDakgsOENBQTRCLElBQUk7QUFBQSxnQkFDbEM7QUFBQSxnQkFDQSxXQUFVO0FBQUEsZ0JBQ1g7QUFBQTtBQUFBLGNBTkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBUUE7QUFBQSxlQWZGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBZ0JBO0FBQUEsYUEzQkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQTRCQTtBQUFBO0FBQUEsTUFqQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBa0NBO0FBQUEsSUFHRCxtQkFDQztBQUFBLE1BQUM7QUFBQTtBQUFBLFFBQ0MsUUFBUTtBQUFBLFFBQ1IsU0FBUyxNQUFNLG1CQUFtQixLQUFLO0FBQUEsUUFDdkMsT0FBTTtBQUFBLFFBRU4saUNBQUMsU0FBSSxXQUFVLDJDQUNiO0FBQUEsaUNBQUMsU0FDQztBQUFBLG1DQUFDLFFBQUcsV0FBVSx5Q0FBd0MsOEJBQXREO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQW9FO0FBQUEsWUFDcEUsdUJBQUMsT0FBRSxXQUFVLHlDQUF3QztBQUFBO0FBQUEsY0FDZix1QkFBQyxVQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQUc7QUFBQSxjQUFFO0FBQUEsY0FDbkIsdUJBQUMsVUFBSyxXQUFVLDREQUEyRCxvQkFBM0U7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBK0U7QUFBQSxjQUFPO0FBQUEsaUJBRjlHO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBR0E7QUFBQSxlQUxGO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBTUE7QUFBQSxVQUVBLHVCQUFDLFNBQ0M7QUFBQSxtQ0FBQyxRQUFHLFdBQVUseUNBQXdDLCtCQUF0RDtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFxRTtBQUFBLFlBQ3JFLHVCQUFDLFFBQUcsV0FBVSx5RUFDWjtBQUFBLHFDQUFDLFFBQUc7QUFBQSx1Q0FBQyxVQUFLLFdBQVUsbURBQWtELGdDQUFsRTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFrRjtBQUFBLGdCQUFPO0FBQUEsbUJBQTdGO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQWtHO0FBQUEsY0FDbEcsdUJBQUMsUUFBRztBQUFBLHVDQUFDLFVBQUssV0FBVSxtREFBa0Qsb0NBQWxFO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQXNGO0FBQUEsZ0JBQU87QUFBQSxtQkFBakc7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBc0c7QUFBQSxjQUN0Ryx1QkFBQyxRQUFHO0FBQUEsdUNBQUMsVUFBSyxXQUFVLG1EQUFrRCxpQ0FBbEU7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBbUY7QUFBQSxnQkFBTztBQUFBLG1CQUE5RjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUFvRztBQUFBLGNBQ3BHLHVCQUFDLFFBQUc7QUFBQSx1Q0FBQyxVQUFLLFdBQVUsbURBQWtELDhCQUFsRTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFnRjtBQUFBLGdCQUFPO0FBQUEsbUJBQTNGO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQTJHO0FBQUEsY0FDM0csdUJBQUMsUUFBRztBQUFBLHVDQUFDLFVBQUssV0FBVSxtREFBa0QsZ0NBQWxFO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQWtGO0FBQUEsZ0JBQU87QUFBQSxtQkFBN0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBOEc7QUFBQSxpQkFMaEg7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFNQTtBQUFBLGVBUkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFTQTtBQUFBLFVBRUEsdUJBQUMsU0FDQztBQUFBLG1DQUFDLFFBQUcsV0FBVSx5Q0FBd0MsNkJBQXREO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQW1FO0FBQUEsWUFDbkUsdUJBQUMsT0FBRSxXQUFVLDhDQUE2QztBQUFBO0FBQUEsY0FDM0MsdUJBQUMsVUFBSyxXQUFVLHlDQUF3QyxtQkFBeEQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBMkQ7QUFBQSxjQUFPO0FBQUEsY0FBRSx1QkFBQyxVQUFLLFdBQVUseUNBQXdDLG1CQUF4RDtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUEyRDtBQUFBLGNBQU87QUFBQSxjQUFFLHVCQUFDLFVBQUssV0FBVSx5Q0FBd0MsbUJBQXhEO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQTJEO0FBQUEsY0FBTztBQUFBLGlCQUR6TjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVBO0FBQUEsWUFDQSx1QkFBQyxPQUFFLFdBQVUseUNBQ1g7QUFBQSxxQ0FBQyxVQUFLLFdBQVUseUNBQXdDLG1CQUF4RDtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUEyRDtBQUFBLGNBQU87QUFBQSxjQUFTLHVCQUFDLFVBQUssV0FBVSx5Q0FBd0MscUJBQXhEO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQTZEO0FBQUEsY0FBTztBQUFBLGlCQURqSjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVBO0FBQUEsZUFQRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQVFBO0FBQUEsVUFFQSx1QkFBQyxTQUFJLFdBQVUsOENBQ2I7QUFBQSxtQ0FBQyxRQUFHLFdBQVUsNEJBQTJCLHdCQUF6QztBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUFpRDtBQUFBLFlBQ2pELHVCQUFDLFFBQUcsV0FBVSx1R0FDWjtBQUFBLHFDQUFDLFFBQUc7QUFBQSx1Q0FBQyxVQUFLLFdBQVUsaUNBQWdDLG1DQUFoRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFtRTtBQUFBLGdCQUFPLHVCQUFDLFVBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBRztBQUFBLGdCQUFFO0FBQUEsbUJBQW5GO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQXlHO0FBQUEsY0FDekcsdUJBQUMsUUFBRztBQUFBLHVDQUFDLFVBQUssV0FBVSxpQ0FBZ0MsK0JBQWhEO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQStEO0FBQUEsZ0JBQU8sdUJBQUMsVUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFHO0FBQUEsZ0JBQUU7QUFBQSxtQkFBL0U7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBeUY7QUFBQSxjQUN6Rix1QkFBQyxRQUFHO0FBQUEsdUNBQUMsVUFBSyxXQUFVLGlDQUFnQywyQkFBaEQ7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBMkQ7QUFBQSxnQkFBTyx1QkFBQyxVQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQUc7QUFBQSxnQkFBRTtBQUFBLG1CQUEzRTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUE0RjtBQUFBLGNBQzVGLHVCQUFDLFFBQUc7QUFBQSx1Q0FBQyxVQUFLLFdBQVUsaUNBQWdDLGlDQUFoRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFpRTtBQUFBLGdCQUFPLHVCQUFDLFVBQUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBRztBQUFBLGdCQUFFO0FBQUEsbUJBQWpGO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQStHO0FBQUEsY0FDL0csdUJBQUMsUUFBRztBQUFBLHVDQUFDLFVBQUssV0FBVSxpQ0FBZ0MsbUNBQWhEO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQW1FO0FBQUEsZ0JBQU8sdUJBQUMsVUFBRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFHO0FBQUEsZ0JBQUU7QUFBQSxtQkFBbkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFBa0g7QUFBQSxpQkFMcEg7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFNQTtBQUFBLGVBUkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFTQTtBQUFBLFVBRUEsdUJBQUMsU0FBSSxXQUFVLHlCQUNiO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxTQUFTLE1BQU0sbUJBQW1CLEtBQUs7QUFBQSxjQUN2QyxXQUFVO0FBQUEsY0FDWDtBQUFBO0FBQUEsWUFIRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFLQSxLQU5GO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBT0E7QUFBQSxhQWhERjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBaURBO0FBQUE7QUFBQSxNQXRERjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUF1REE7QUFBQSxJQUlELHlCQUF5QjtBQUFBLE1BQ3hCO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDQyxPQUFPLEVBQUUsS0FBSyxlQUFlLEdBQUcsTUFBTSxlQUFlLEdBQUcsVUFBVSxRQUFRO0FBQUEsVUFDMUUsV0FBVTtBQUFBLFVBQ1YsYUFBYSxDQUFDLE1BQU0sRUFBRSxnQkFBZ0I7QUFBQSxVQUV0QztBQUFBLFlBQUM7QUFBQTtBQUFBLGNBQ0MsV0FBVTtBQUFBLGNBQ1YsU0FBUyxNQUFNO0FBQ2IsMkJBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLGNBQWMsd0JBQXdCLEVBQUUsR0FBRyxHQUFHLFdBQVcsT0FBVSxJQUFJLENBQUMsQ0FBQztBQUM1Ryx5Q0FBeUIsSUFBSTtBQUFBLGNBQy9CO0FBQUEsY0FFQTtBQUFBLHVDQUFDLFFBQUssV0FBVSw0Q0FBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBeUQ7QUFBQSxnQkFBRTtBQUFBO0FBQUE7QUFBQSxZQVA3RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFTQTtBQUFBO0FBQUEsUUFkRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFlQTtBQUFBLE1BQ0EsU0FBUztBQUFBLElBQ1g7QUFBQSxJQUdDLG9CQUFvQixDQUFDLHlCQUF5QjtBQUFBLE1BQzdDO0FBQUEsUUFBQztBQUFBO0FBQUEsVUFDQyxPQUFPLEVBQUUsS0FBSyxlQUFlLEdBQUcsTUFBTSxlQUFlLEdBQUcsVUFBVSxRQUFRO0FBQUEsVUFDMUUsV0FBVTtBQUFBLFVBQ1YsYUFBYSxDQUFDLE1BQU0sRUFBRSxnQkFBZ0I7QUFBQSxVQUVwQztBQUFBLG1CQUFNO0FBQ04sb0JBQU0saUJBQWlCLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxnQkFBZ0I7QUFDbEUsa0JBQUksa0JBQWtCLGVBQWUsVUFBVTtBQUM3Qyx1QkFDRSx1QkFBQyxTQUFJLFdBQVUsaUZBQWdGLFNBQVMsT0FBSyxFQUFFLGdCQUFnQixHQUM3SDtBQUFBLHlDQUFDLFVBQUssV0FBVSx5REFBd0QsdUJBQXhFO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQStFO0FBQUEsa0JBQy9FO0FBQUEsb0JBQUM7QUFBQTtBQUFBLHNCQUNDLE9BQU8sZUFBZSxRQUFRO0FBQUEsc0JBQzlCLFVBQVUsQ0FBQyxNQUFNO0FBQ2QsbUNBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sbUJBQW1CLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxPQUFPLE1BQWEsSUFBSSxDQUFDLENBQUM7QUFBQSxzQkFDMUc7QUFBQSxzQkFDQSxXQUFVO0FBQUEsc0JBRVY7QUFBQSwrQ0FBQyxZQUFPLE9BQU0sUUFBTywwQkFBckI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBK0I7QUFBQSx3QkFDL0IsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQWtDO0FBQUEsd0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxRQUFPLHlCQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUE4QjtBQUFBLHdCQUM5Qix1QkFBQyxZQUFPLE9BQU0sWUFBVywrQkFBekI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBd0M7QUFBQSx3QkFDeEMsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQWtDO0FBQUEsd0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxVQUFTLDJCQUF2QjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUFrQztBQUFBLHdCQUNsQyx1QkFBQyxZQUFPLE9BQU0sWUFBVyw4QkFBekI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBdUM7QUFBQSx3QkFDdkMsdUJBQUMsWUFBTyxPQUFNLFVBQVMsMkJBQXZCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQWtDO0FBQUEsd0JBQ2xDLHVCQUFDLFlBQU8sT0FBTSxXQUFVLDRCQUF4QjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUFvQztBQUFBLHdCQUNwQyx1QkFBQyxZQUFPLE9BQU0sZ0JBQWUsMkJBQTdCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQXdDO0FBQUEsd0JBQ3hDLHVCQUFDLFlBQU8sT0FBTSxVQUFTLDJCQUF2QjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUFrQztBQUFBO0FBQUE7QUFBQSxvQkFqQnBDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFrQkE7QUFBQSxxQkFwQkY7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFxQkE7QUFBQSxjQUVKO0FBQ0EscUJBQU87QUFBQSxZQUNULEdBQUc7QUFBQSxZQUVIO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLHdCQUFNLE1BQU0sT0FBTyxJQUFJLFFBQVEsS0FBSyxPQUFLLEVBQUUsT0FBTyxnQkFBZ0IsR0FBRyxLQUFLO0FBQUEsbUJBQTJDO0FBQ3JILHNCQUFJLFFBQVEsTUFBTTtBQUNoQiwwQkFBTSxjQUFjLGFBQWEsSUFBSSxTQUFPO0FBQ3pDLDBCQUFJLENBQUMsTUFBTSxTQUFTLFlBQVksVUFBVSxTQUFTLEVBQUUsU0FBUyxnQkFBZ0IsR0FBRztBQUM5RSwrQkFBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixHQUFHLElBQUk7QUFBQSxzQkFDNUMsV0FBVyxxQkFBcUIsYUFBYTtBQUMxQywrQkFBTztBQUFBLHNCQUNWLE9BQU87QUFDSiwrQkFBTyxFQUFFLEdBQUcsS0FBSyxlQUFlLEVBQUUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEVBQUU7QUFBQSxzQkFDckY7QUFBQSxvQkFDSCxDQUFDO0FBQ0QsNENBQXdCLFdBQVc7QUFDbkMsOEJBQVUsV0FBVztBQUNyQix3Q0FBb0IsSUFBSTtBQUFBLGtCQUMxQjtBQUFBLGdCQUNGO0FBQUEsZ0JBRUE7QUFBQSx5Q0FBQyxTQUFNLFdBQVUsNENBQWpCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQTBEO0FBQUEsa0JBQUU7QUFBQTtBQUFBO0FBQUEsY0FwQjlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQXNCQTtBQUFBLFlBRUE7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxXQUFVO0FBQUEsZ0JBQ1YsU0FBUyxNQUFNO0FBQ2IsNkJBQVcsVUFBUSxLQUFLO0FBQUEsb0JBQUksT0FDekIsRUFBRSxPQUFPLG1CQUNMLEVBQUUsR0FBRyxHQUFHLFdBQVcsRUFBRSxjQUFjLFdBQVcsU0FBUyxTQUFTLElBQ2hFO0FBQUEsa0JBQ1AsQ0FBQztBQUNELHNDQUFvQixJQUFJO0FBQUEsZ0JBQzFCO0FBQUEsZ0JBRUE7QUFBQSx5Q0FBQyxnQkFBYSxXQUFVLDRDQUF4QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFpRTtBQUFBLGtCQUNoRSxRQUFRLEtBQUssT0FBSyxFQUFFLE9BQU8sZ0JBQWdCLEdBQUcsY0FBYyxXQUFXLGVBQWU7QUFBQTtBQUFBO0FBQUEsY0FaekY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBYUE7QUFBQSxZQUVBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLHNDQUFvQixRQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEVBQUU7QUFDN0Usc0NBQW9CLElBQUk7QUFBQSxnQkFDMUI7QUFBQSxnQkFFQTtBQUFBLHlDQUFDLGVBQVksV0FBVSxzREFBdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBMEU7QUFBQSxrQkFDekUsaUJBQWlCLGdCQUFnQixJQUFJLFVBQVU7QUFBQTtBQUFBO0FBQUEsY0FSbEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBU0E7QUFBQSxZQUVBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLHNCQUFJLG1CQUFtQixrQkFBa0I7QUFDdkMsc0NBQWtCLElBQUk7QUFBQSxrQkFDeEIsT0FBTztBQUNMLHNDQUFrQixnQkFBZ0I7QUFBQSxrQkFDcEM7QUFDQSxzQ0FBb0IsSUFBSTtBQUFBLGdCQUMxQjtBQUFBLGdCQUVBO0FBQUEseUNBQUMsYUFBVSxXQUFVLDRDQUFyQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUE4RDtBQUFBLGtCQUM3RCxtQkFBbUIsbUJBQW1CLFVBQVU7QUFBQTtBQUFBO0FBQUEsY0FabkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBYUE7QUFBQSxZQUVBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLDZCQUFXLGdCQUF1QjtBQUNsQyxzQ0FBb0IsSUFBSTtBQUFBLGdCQUMxQjtBQUFBLGdCQUVBO0FBQUEseUNBQUMsZUFBWSxXQUFVLDRDQUF2QjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFnRTtBQUFBLGtCQUFFO0FBQUE7QUFBQTtBQUFBLGNBUHBFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVNBO0FBQUEsWUFFQTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFdBQVU7QUFBQSxnQkFDVixTQUFTLE1BQU07QUFDYix3Q0FBc0IsZ0JBQWdCO0FBQ3RDLHVDQUFxQixFQUFFLEtBQUssZUFBZSxJQUFJLElBQUksTUFBTSxlQUFlLElBQUksR0FBRyxDQUFDO0FBQ2hGLHNDQUFvQixJQUFJO0FBQUEsZ0JBQzFCO0FBQUEsZ0JBRUE7QUFBQSx5Q0FBQyxVQUFPLFdBQVUsNENBQWxCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQTJEO0FBQUEsa0JBQUU7QUFBQTtBQUFBO0FBQUEsY0FSL0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBVUE7QUFBQSxZQUVDLGtCQUFrQixTQUFTLEtBQUssa0JBQWtCLFNBQVMsZ0JBQWdCLEtBQzFFO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLHdCQUFNLE1BQU0sT0FBTywwQkFBMEI7QUFDN0Msc0JBQUksUUFBUSxRQUFRLElBQUksS0FBSyxNQUFNLElBQUk7QUFDckMsK0JBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxrQkFBa0IsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxXQUFXLElBQUksS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3hHLHlDQUFxQixDQUFDLENBQUM7QUFDdkIsd0NBQW9CLElBQUk7QUFBQSxrQkFDMUI7QUFBQSxnQkFDRjtBQUFBLGdCQUVBO0FBQUEseUNBQUMsUUFBSyxXQUFVLG9DQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUFpRDtBQUFBLGtCQUFFO0FBQUE7QUFBQTtBQUFBLGNBWHJEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQWFBO0FBQUEsWUFHRCxRQUFRLEtBQUssT0FBSyxFQUFFLE9BQU8sZ0JBQWdCLEdBQUcsYUFDN0M7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxXQUFVO0FBQUEsZ0JBQ1YsU0FBUyxNQUFNO0FBQ2IsNkJBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sbUJBQW1CLEVBQUUsR0FBRyxHQUFHLFdBQVcsT0FBVSxJQUFJLENBQUMsQ0FBQztBQUNoRyxzQ0FBb0IsSUFBSTtBQUFBLGdCQUMxQjtBQUFBLGdCQUVBO0FBQUEseUNBQUMsUUFBSyxXQUFVLDRDQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUF5RDtBQUFBLGtCQUFFO0FBQUE7QUFBQTtBQUFBLGNBUDdEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQVNBO0FBQUEsWUFHRjtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFdBQVU7QUFBQSxnQkFDVixTQUFTLE1BQU07QUFDYiw4Q0FBNEIsZ0JBQWdCO0FBQzVDLHNDQUFvQixRQUFRLEtBQUssT0FBSyxFQUFFLE9BQU8sZ0JBQWdCLEdBQUcsZUFBZSxFQUFFO0FBQ25GLHNDQUFvQixJQUFJO0FBQUEsZ0JBQzFCO0FBQUEsZ0JBRUE7QUFBQSx5Q0FBQyxjQUFXLFdBQVUsNENBQXRCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQStEO0FBQUEsa0JBQUU7QUFBQTtBQUFBO0FBQUEsY0FSbkU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBVUE7QUFBQSxZQUVBO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsV0FBVTtBQUFBLGdCQUNWLFNBQVMsTUFBTTtBQUNiLHdCQUFNLE1BQU0sUUFBUSxLQUFLLE9BQUssRUFBRSxPQUFPLGdCQUFnQjtBQUN2RCxzQkFBSSxLQUFLO0FBQ1AsMENBQXNCLElBQUksRUFBRTtBQUM1QixxQ0FBaUIsSUFBSSxLQUFLO0FBQzFCLHFDQUFpQixJQUFJLFFBQVEsTUFBTTtBQUNuQyw2Q0FBeUIsSUFBSSxTQUFTLEtBQUssSUFBSSxLQUFLLEVBQUU7QUFDdEQsb0NBQWdCLElBQUksV0FBVyxFQUFFO0FBQ2pDLHdDQUFvQixJQUFJLGVBQWUsRUFBRTtBQUN6Qyx5Q0FBcUIsSUFBSSxnQkFBZ0IsWUFBWTtBQUNyRCxnREFBNEIsSUFBSSx1QkFBdUIsRUFBRTtBQUN6RCw4Q0FBMEIsSUFBSSxxQkFBcUIsRUFBRTtBQUNyRCxrREFBOEIsSUFBSSx5QkFBeUIsQ0FBQztBQUM1RCx3Q0FBb0IsSUFBSSxlQUFlLEVBQUU7QUFDekMsMENBQXNCLElBQUksaUJBQWlCLE9BQU87QUFDbEQsMENBQXNCLElBQUksU0FBUyxXQUFZLElBQUksU0FBUyxLQUFLLElBQUksS0FBSyxLQUFNLHNCQUFzQjtBQUN0Ryx3Q0FBb0IsSUFBSSxlQUFlLEVBQUU7QUFDekMsK0NBQTJCLElBQUksc0JBQXNCLEVBQUU7QUFDdkQsbURBQStCLElBQUksMEJBQTBCLEVBQUU7QUFDL0Qsb0RBQWdDLElBQUksMkJBQTJCLEVBQUU7QUFDakUsMENBQXNCLElBQUksa0JBQWtCLFNBQVksT0FBTyxJQUFJLGFBQWEsSUFBSSxFQUFFO0FBQUEsa0JBQ3hGO0FBQ0Esd0NBQXNCLElBQUk7QUFDMUIsc0NBQW9CLElBQUk7QUFBQSxnQkFDMUI7QUFBQSxnQkFFQTtBQUFBLHlDQUFDLFVBQU8sV0FBVSxpQkFBbEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBZ0M7QUFBQSxrQkFBRTtBQUFBO0FBQUE7QUFBQSxjQTVCcEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBOEJBO0FBQUEsWUFDQSx1QkFBQyxTQUFJLFdBQVUsNkNBQWY7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBeUQ7QUFBQSxZQUN6RDtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLFdBQVU7QUFBQSxnQkFDVixTQUFTLE1BQU07QUFDYiwyQ0FBeUIsZ0JBQWdCO0FBQ3pDLHNDQUFvQixJQUFJO0FBQUEsZ0JBQzFCO0FBQUEsZ0JBRUE7QUFBQSx5Q0FBQyxLQUFFLFdBQVUsaUJBQWI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBMkI7QUFBQSxrQkFBRTtBQUFBO0FBQUE7QUFBQSxjQVAvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFTQTtBQUFBO0FBQUE7QUFBQSxRQS9NRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFnTkE7QUFBQSxNQUNBLFNBQVM7QUFBQSxJQUNYO0FBQUEsT0F0ckNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0F3ckNBO0FBRUo7QUFHQSxNQUFNLGVBQWUsb0JBQUksSUFBSTtBQUU3QixNQUFNLE1BQU0sSUFBSSxTQUFnQixLQUFLLE9BQU8sQ0FBQyxHQUFHLE1BQU0sS0FBSyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUM7QUFDN0UsTUFBTSxVQUFVLElBQUksU0FBZ0IsS0FBSyxTQUFTLElBQUksR0FBRyxJQUFJLElBQUksS0FBSyxTQUFTO0FBQy9FLE1BQU0sS0FBSyxDQUFDLFdBQW9CLFNBQWMsYUFBa0IsWUFBWSxVQUFVO0FBQ3RGLE1BQU0sT0FBTyxDQUFDLElBQVMsT0FBWTtBQUNqQyxNQUFJLENBQUMsTUFBTSxDQUFDLEdBQUksUUFBTztBQUN2QixRQUFNLFFBQVEsSUFBSSxLQUFLLEVBQUU7QUFDekIsUUFBTSxRQUFRLElBQUksS0FBSyxFQUFFO0FBQ3pCLE1BQUksTUFBTSxNQUFNLFFBQVEsQ0FBQyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUMsRUFBRyxRQUFPO0FBQzdELFNBQU8sS0FBSyxPQUFPLE1BQU0sUUFBUSxJQUFJLE1BQU0sUUFBUSxNQUFNLE1BQU8sS0FBSyxLQUFLLEdBQUc7QUFDL0U7QUFDQSxNQUFNLFNBQVMsQ0FBQyxJQUFTLE9BQVk7QUFDbkMsTUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFJLFFBQU87QUFDdkIsUUFBTSxRQUFRLElBQUksS0FBSyxFQUFFO0FBQ3pCLFFBQU0sUUFBUSxJQUFJLEtBQUssRUFBRTtBQUN6QixNQUFJLE1BQU0sTUFBTSxRQUFRLENBQUMsS0FBSyxNQUFNLE1BQU0sUUFBUSxDQUFDLEVBQUcsUUFBTztBQUM3RCxRQUFNLGNBQWMsTUFBTSxZQUFZLElBQUksTUFBTSxZQUFZLEtBQUssTUFBTSxNQUFNLFNBQVMsSUFBSSxNQUFNLFNBQVM7QUFDekcsU0FBTztBQUNUO0FBRUEsTUFBTSxlQUFlLENBQUMsR0FBVyxZQUFtQjtBQUNsRCxRQUFNLFdBQVcsSUFBSSxNQUFNLFFBQVEsSUFBSSxPQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssR0FBRztBQUMxRCxNQUFJLENBQUMsYUFBYSxJQUFJLFFBQVEsR0FBRztBQUMvQixRQUFJO0FBQ0YsVUFBSSxTQUFTO0FBQ2IsY0FBUSxRQUFRLE9BQUs7QUFDbEIsY0FBTSxZQUFZLEVBQUUsTUFBTSxRQUFRLHVCQUF1QixNQUFNO0FBQy9ELGNBQU0sS0FBSyxJQUFJLE9BQU8sTUFBTSxTQUFTLE9BQU8sR0FBRztBQUsvQyxZQUFJLENBQUMsU0FBUyxXQUFXLGFBQWEsVUFBVSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUUsR0FBRztBQUN6RSxtQkFBUyxPQUFPLFFBQVEsSUFBSSxRQUFRLEVBQUUsRUFBRSxTQUFTO0FBQUEsUUFDcEQsT0FBTztBQUNKLG1CQUFTLE9BQU8sUUFBUSxJQUFJLHNDQUFzQyxFQUFFLEVBQUUsZ0NBQWdDLEVBQUUsRUFBRSwyQ0FBMkMsRUFBRSxFQUFFLE1BQU07QUFBQSxRQUNsSztBQUFBLE1BQ0gsQ0FBQztBQUNELG1CQUFhLElBQUksVUFBVSxJQUFJLFNBQVMsT0FBTyxTQUFTLE9BQU8sV0FBVyxNQUFNLFFBQVEsVUFBVSxPQUFPLE9BQU8sT0FBTyxnQkFBZ0IsVUFBVSxJQUFJLGtDQUFrQyxDQUFDO0FBQUEsSUFDMUwsUUFBUTtBQUNOLG1CQUFhLElBQUksVUFBVSxNQUFNLE9BQU87QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFDQSxTQUFPLGFBQWEsSUFBSSxRQUFRO0FBQ2xDO0FBRUEsTUFBTSxpQkFBaUIsTUFBTSxLQUFLLFNBQVNBLGdCQUFlO0FBQUEsRUFDeEQ7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUVBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLEdBQVE7QUFDUSxRQUFNLFNBQVMsSUFBSSxXQUFXO0FBRTlCLE1BQUksb0JBQW9CO0FBQ3hCLE1BQUksSUFBSSxXQUFXLE9BQVEscUJBQW9CO0FBQUEsV0FDdEMsSUFBSSxXQUFXLGNBQWUscUJBQW9CO0FBRTNELFNBQ0U7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUVDLElBQUksV0FBVyxJQUFJLEVBQUU7QUFBQSxNQUNyQixZQUFZLENBQUMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEVBQUU7QUFBQSxNQUM5QyxRQUFRLENBQUMsTUFBTSxjQUFjLEdBQUcsSUFBSSxFQUFFO0FBQUEsTUFDdEMsV0FBVyx5SEFBeUgsaUJBQWlCLElBQ25KLGFBQWEsa0NBQWtDLEVBQ2pELElBQUksa0JBQWtCLElBQUksS0FBSywrREFBK0QsRUFBRTtBQUFBLE1BSWhHO0FBQUEsK0JBQUMsUUFBRyxPQUFPLG1CQUFtQixPQUFPLEdBQUcsV0FBVywrRkFDakQsaUNBQUMsU0FBSSxXQUFVLGtIQUNiO0FBQUE7QUFBQSxZQUFDO0FBQUE7QUFBQSxjQUNDLFNBQVMsQ0FBQyxNQUFNO0FBQUUsa0JBQUUsZ0JBQWdCO0FBQUcsbUNBQW1CLElBQUksSUFBSSxJQUFJLEVBQUU7QUFBQSxjQUFHO0FBQUEsY0FDM0UsV0FBVTtBQUFBLGNBQ1YsT0FBTTtBQUFBLGNBRU4saUNBQUMsUUFBSyxXQUFVLGlCQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUE4QjtBQUFBO0FBQUEsWUFMaEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFVBTUE7QUFBQSxVQUNBO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxXQUFTO0FBQUEsY0FDVCxhQUFhLENBQUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEVBQUU7QUFBQSxjQUNoRCxXQUFVO0FBQUEsY0FDVixPQUFNO0FBQUEsY0FFTixpQ0FBQyxnQkFBYSxXQUFVLGFBQXhCO0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBQWtDO0FBQUE7QUFBQSxZQU5wQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFPQTtBQUFBLGFBZkY7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQWdCQSxLQWpCRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBa0JBO0FBQUEsUUFHQSx1QkFBQyxRQUFHLE9BQU8sbUJBQW1CLFVBQVUsR0FBRyxXQUFXLGtGQUNwRDtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBQ0MsV0FBVTtBQUFBLFlBQ1YsU0FBUyxNQUFNLGdCQUFnQixJQUFJLElBQUksQ0FBQyxVQUFVO0FBQUEsWUFFakQsd0JBQWMsdUJBQUMsU0FBTSxXQUFVLGlDQUFnQyxhQUFhLEtBQTlEO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBQWlFO0FBQUE7QUFBQSxVQUpsRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFLQSxLQU5GO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFPQTtBQUFBLFFBR0MsUUFBUSxJQUFJLFNBQU87QUFDbEIsZ0JBQU0sY0FBYyxpQkFBaUIsSUFBSSxFQUFFO0FBQzNDLGdCQUFNLFFBQVEsY0FBYyxLQUFNLGFBQWEsSUFBSSxFQUFFLEtBQUs7QUFDMUQsZ0JBQU0sa0JBQWtCLG1CQUFtQixJQUFJLEVBQUU7QUFDakQsZ0JBQU0saUJBQWlCLElBQUksWUFBWSxFQUFFLFdBQVcsSUFBSSxVQUFVLElBQUksQ0FBQztBQUN2RSxnQkFBTSxZQUFpQyxFQUFFLE9BQU8sVUFBVSxPQUFPLFVBQVUsT0FBTyxHQUFHLGlCQUFpQixHQUFHLGVBQWU7QUFDeEgsZ0JBQU0sY0FBYztBQUVwQixjQUFJLGFBQWE7QUFDZixtQkFDRTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUVDLE9BQU87QUFBQSxnQkFDUCxXQUFXLDRJQUE0SSxXQUFXO0FBQUEsZ0JBQ2xLLFNBQVMsTUFBTSxvQkFBb0IsUUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLE1BQU0sRUFBRTtBQUFBLGdCQUNuRSxPQUFNO0FBQUEsZ0JBRU4saUNBQUMsVUFBSyxXQUFVLG1IQUFrSCxtQkFBbEk7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFBcUk7QUFBQTtBQUFBLGNBTmhJLElBQUk7QUFBQSxjQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFRQTtBQUFBLFVBRUo7QUFHQSxjQUFJLElBQUksT0FBTyxNQUFNO0FBQ25CLGtCQUFNLFlBQVksWUFBWSxnQkFBZ0I7QUFFOUMsbUJBQ0U7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFFQyxPQUFPO0FBQUEsZ0JBQ1AsU0FBUyxNQUFNO0FBQ1osc0JBQUksaUJBQWlCO0FBQ2xCLDBCQUFNLE1BQU0sWUFBWSx5QkFBeUI7QUFDakQ7QUFBQSxrQkFDSDtBQUNBLHNDQUFvQixFQUFFLE9BQU8sSUFBSSxJQUFJLE9BQU8sS0FBSyxDQUFDO0FBQUEsZ0JBQ3JEO0FBQUEsZ0JBQ0EsV0FBVyxtSEFBbUgsa0JBQWtCLGdEQUFnRCxzQ0FBc0MsdUVBQXVFLFdBQVc7QUFBQSxnQkFDeFQsT0FBTyxrQkFBa0IsR0FBRyxZQUFZLGFBQWE7QUFBQSxnQkFFcEQ7QUFBQSxxQ0FDQyx1QkFBQyxTQUFJLFdBQVUscUNBQW9DLE9BQU8sR0FBRyxZQUFZLFlBQ3ZFLGlDQUFDLFFBQUssV0FBVSxrQ0FBaEI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBK0MsS0FEakQ7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFFQTtBQUFBLGtCQUVELGFBQ0M7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsTUFBSztBQUFBLHNCQUNMLGNBQWMsSUFBSTtBQUFBLHNCQUNsQixXQUFTO0FBQUEsc0JBQ1QsUUFBUSxDQUFDLE1BQU07QUFDYiwrQ0FBdUIsSUFBSSxJQUFJLE1BQU0sRUFBRSxPQUFPLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtBQUNwRSw0Q0FBb0IsSUFBSTtBQUFBLHNCQUMxQjtBQUFBLHNCQUNBLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLDRCQUFJLEVBQUUsUUFBUSxTQUFTO0FBQ3JCLGlEQUF1QixJQUFJLElBQUksTUFBTSxFQUFFLGNBQWMsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQzNFLDhDQUFvQixJQUFJO0FBQUEsd0JBQzFCO0FBQ0EsNEJBQUksRUFBRSxRQUFRLFNBQVUscUJBQW9CLElBQUk7QUFBQSxzQkFDbEQ7QUFBQSxzQkFDQSxXQUFVO0FBQUE7QUFBQSxvQkFmWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBZ0JBO0FBQUEsa0JBRUYsdUJBQUMsU0FBSSxXQUFXLFlBQVksY0FBYyxJQUN2QyxjQUFJLE1BRFA7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFFQTtBQUFBO0FBQUE7QUFBQSxjQXRDSyxJQUFJO0FBQUEsY0FEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBd0NBO0FBQUEsVUFFSjtBQUdBLGNBQUksSUFBSSxPQUFPLFNBQVM7QUFDdEIsa0JBQU0sWUFBWSxZQUFZLGdCQUFnQjtBQUU5QyxtQkFDRTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUVDLE9BQU87QUFBQSxnQkFDUCxTQUFTLE1BQU07QUFDWixzQkFBSSxpQkFBaUI7QUFDbEIsMEJBQU0sTUFBTSxZQUFZLHlCQUF5QjtBQUNqRDtBQUFBLGtCQUNIO0FBQ0Esc0NBQW9CLEVBQUUsT0FBTyxJQUFJLElBQUksT0FBTyxRQUFRLENBQUM7QUFBQSxnQkFDeEQ7QUFBQSxnQkFDQSxXQUFXLGdFQUFnRSxrQkFBa0IsZ0RBQWdELDRDQUE0Qyx5RUFBeUUsV0FBVztBQUFBLGdCQUM3USxPQUFPLGtCQUFrQixHQUFHLFlBQVksYUFBYTtBQUFBLGdCQUVwRDtBQUFBLHFDQUNDLHVCQUFDLFNBQUksV0FBVSxxQ0FBb0MsT0FBTyxHQUFHLFlBQVksWUFDdkUsaUNBQUMsUUFBSyxXQUFVLGtDQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUErQyxLQURqRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQUVBO0FBQUEsa0JBRUQsYUFDQztBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFDQyxjQUFjLElBQUk7QUFBQSxzQkFDbEIsV0FBUztBQUFBLHNCQUNULFNBQVMsQ0FBQyxNQUFNLGdCQUFnQixHQUFHLElBQUksSUFBSSxJQUFJLEVBQUU7QUFBQSxzQkFDakQsUUFBUSxDQUFDLE1BQU07QUFDYiwrQ0FBdUIsSUFBSSxJQUFJLFNBQVMsRUFBRSxPQUFPLEtBQUs7QUFDdEQsNENBQW9CLElBQUk7QUFBQSxzQkFDMUI7QUFBQSxzQkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw0QkFBSSxFQUFFLFFBQVEsV0FBVyxDQUFDLEVBQUUsVUFBVTtBQUNwQyxpREFBdUIsSUFBSSxJQUFJLFNBQVMsRUFBRSxjQUFjLEtBQUs7QUFDN0QsOENBQW9CLElBQUk7QUFBQSx3QkFDMUI7QUFDQSw0QkFBSSxFQUFFLFFBQVEsU0FBVSxxQkFBb0IsSUFBSTtBQUFBLHNCQUNsRDtBQUFBLHNCQUNBLFdBQVU7QUFBQTtBQUFBLG9CQWZaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFnQkE7QUFBQSxrQkFFRix1QkFBQyxTQUFJLFdBQVcsNkJBQTZCLFlBQVksY0FBYyxFQUFFLElBQ3RFLGNBQUksU0FBUyx1QkFBQyxVQUFLLFdBQVUsYUFBWSxpQkFBNUI7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBNkIsS0FEN0M7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFFQTtBQUFBO0FBQUE7QUFBQSxjQXRDSyxJQUFJO0FBQUEsY0FEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBd0NBO0FBQUEsVUFFSjtBQUdBLGNBQUksSUFBSSxPQUFPLFlBQVk7QUFDekIsa0JBQU0sY0FBYztBQUFBLGNBQ2xCLE1BQU07QUFBQSxjQUNOLFFBQVE7QUFBQSxjQUNSLEtBQUs7QUFBQSxZQUNQO0FBQ0Esa0JBQU0sU0FBUyxFQUFFLE1BQU0sTUFBTSxRQUFRLE1BQU0sS0FBSyxLQUFLO0FBRXJELG1CQUNFLHVCQUFDLFFBQWdCLE9BQU8sV0FBVyxXQUFXLHNFQUFzRSxXQUFXLElBQzdIO0FBQUE7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsU0FBUyxDQUFDLE1BQU07QUFDZCxzQkFBRSxnQkFBZ0I7QUFDbEIsOENBQTBCLGlCQUFpQixPQUFPLElBQUksRUFBRTtBQUFBLGtCQUMxRDtBQUFBLGtCQUNBLFdBQVU7QUFBQSxrQkFFVjtBQUFBLDJDQUFDLFVBQUssV0FBVyx1QkFBdUIsWUFBWSxJQUFJLFFBQVEsS0FBSyxZQUFZLE1BQU0sSUFDcEYsaUJBQU8sSUFBSSxRQUFRLEtBQUssUUFEM0I7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFFQTtBQUFBLG9CQUNBLHVCQUFDLGVBQVksV0FBVSx3Q0FBdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFBNEQ7QUFBQTtBQUFBO0FBQUEsZ0JBVjlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQVdBO0FBQUEsY0FHQyxrQkFDQztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxLQUFLO0FBQUEsa0JBQ0wsV0FBVTtBQUFBLGtCQUVSLFdBQUMsUUFBUSxVQUFVLEtBQUssRUFBaUIsSUFBSSxPQUM3QztBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFFQyxTQUFTLE1BQU07QUFDYiwrQ0FBdUIsSUFBSSxJQUFJLFlBQVksQ0FBQztBQUM1QyxrREFBMEIsSUFBSTtBQUFBLHNCQUNoQztBQUFBLHNCQUNBLFdBQVU7QUFBQSxzQkFFVjtBQUFBLCtDQUFDLFVBQU0saUJBQU8sQ0FBQyxLQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQWlCO0FBQUEsd0JBQ2hCLElBQUksYUFBYSxLQUFLLHVCQUFDLFNBQU0sV0FBVSxnQ0FBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBOEM7QUFBQTtBQUFBO0FBQUEsb0JBUmhFO0FBQUEsb0JBRFA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFVQSxDQUNEO0FBQUE7QUFBQSxnQkFoQkg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBaUJBO0FBQUEsaUJBakNLLElBQUksSUFBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQW1DQTtBQUFBLFVBRUo7QUFHQSxjQUFJLElBQUksT0FBTyxhQUFhO0FBQzFCLG1CQUNFLHVCQUFDLFFBQWdCLE9BQU8sV0FBVyxXQUFXLHdGQUF3RixXQUFXLElBQy9JO0FBQUE7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBQ0MsU0FBUyxNQUFNLDBCQUEwQixpQkFBaUIsT0FBTyxJQUFJLEVBQUU7QUFBQSxrQkFDdkUsV0FBVTtBQUFBLGtCQUVULGNBQUksVUFBVSxXQUFXLElBQ3hCLHVCQUFDLFNBQUksV0FBVSxpREFBZ0Qsc0JBQS9EO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQXFFLElBRXJFLElBQUksVUFBVSxJQUFJLENBQUMsR0FBRyxRQUNwQjtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFFQyxXQUFVO0FBQUEsc0JBQ1YsT0FBTyxFQUFFO0FBQUEsc0JBRVIsWUFBRTtBQUFBO0FBQUEsb0JBSkUsRUFBRTtBQUFBLG9CQURUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBTUEsQ0FDRDtBQUFBO0FBQUEsZ0JBZkw7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBaUJBO0FBQUEsY0FHQyxrQkFDQztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxLQUFLO0FBQUEsa0JBQ0wsV0FBVTtBQUFBLGtCQUVWO0FBQUEsMkNBQUMsT0FBRSxXQUFVLGtGQUFpRjtBQUFBO0FBQUEsc0JBQ25GLElBQUksVUFBVTtBQUFBLHNCQUFPO0FBQUEseUJBRGhDO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBRUE7QUFBQSxvQkFDQSx1QkFBQyxTQUFJLFdBQVUsd0NBQ1osd0JBQWMsSUFBSSxZQUFVO0FBQzNCLDRCQUFNLGFBQWEsSUFBSSxVQUFVLEtBQUssT0FBSyxFQUFFLE9BQU8sT0FBTyxFQUFFO0FBQzdELDZCQUNFO0FBQUEsd0JBQUM7QUFBQTtBQUFBLDBCQUVDLFdBQVU7QUFBQSwwQkFFUjtBQUFBO0FBQUEsOEJBQUM7QUFBQTtBQUFBLGdDQUNDLFdBQVU7QUFBQSxnQ0FFVCx3QkFBYyx1QkFBQyxTQUFNLFdBQVUscUNBQW9DLGFBQWEsS0FBbEU7QUFBQTtBQUFBO0FBQUE7QUFBQSx1Q0FBcUU7QUFBQTtBQUFBLDhCQUh0RjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsNEJBSUE7QUFBQSw0QkFFQTtBQUFBLDhCQUFDO0FBQUE7QUFBQSxnQ0FDQyxNQUFLO0FBQUEsZ0NBQ0wsV0FBVTtBQUFBLGdDQUNWLFNBQVM7QUFBQSxnQ0FDVCxVQUFVLENBQUMsTUFBTTtBQUNmLHNDQUFJLEVBQUUsT0FBTyxTQUFTO0FBQ3BCLDBDQUFNLGVBQWUsQ0FBQyxHQUFHLElBQUksV0FBVyxNQUFNO0FBQzlDLDREQUF3QixVQUFRLEtBQUssSUFBSSxPQUFLLEVBQUUsT0FBTyxJQUFJLEtBQUssRUFBRSxHQUFHLEdBQUcsV0FBVyxhQUFhLElBQUksQ0FBQyxDQUFDO0FBQUEsa0NBQ3hHLE9BQU87QUFDTCwwQ0FBTSxlQUFlLElBQUksVUFBVSxPQUFPLE9BQUssRUFBRSxPQUFPLE9BQU8sRUFBRTtBQUNqRSw0REFBd0IsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLFdBQVcsYUFBYSxJQUFJLENBQUMsQ0FBQztBQUFBLGtDQUN4RztBQUFBLGdDQUNGO0FBQUE7QUFBQSw4QkFaRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsNEJBYUE7QUFBQSw0QkFDRix1QkFBQyxVQUFNLGlCQUFPLFFBQWQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQ0FBbUI7QUFBQTtBQUFBO0FBQUEsd0JBdkJkLE9BQU87QUFBQSx3QkFEZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQXlCQTtBQUFBLG9CQUVKLENBQUMsS0EvQkg7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFnQ0E7QUFBQTtBQUFBO0FBQUEsZ0JBdkNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQXdDQTtBQUFBLGlCQTlESyxJQUFJLElBQWI7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFnRUE7QUFBQSxVQUVKO0FBR0EsY0FBSSxJQUFJLE9BQU8sV0FBVztBQUN4QixrQkFBTSxZQUFZLFlBQVksZ0JBQWdCO0FBRTlDLG1CQUNFO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBRUMsT0FBTztBQUFBLGdCQUNQLFNBQVMsTUFBTSxvQkFBb0IsRUFBRSxPQUFPLElBQUksSUFBSSxPQUFPLFVBQVUsQ0FBQztBQUFBLGdCQUN0RSxXQUFXLDhKQUE4SixXQUFXO0FBQUEsZ0JBRW5MO0FBQUEsK0JBQ0M7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsTUFBSztBQUFBLHNCQUNMLGNBQWMsSUFBSTtBQUFBLHNCQUNsQixXQUFTO0FBQUEsc0JBQ1QsU0FBUyxDQUFDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxJQUFJLElBQUksRUFBRTtBQUFBLHNCQUNqRCxRQUFRLENBQUMsTUFBTTtBQUNiLCtDQUF1QixJQUFJLElBQUksV0FBVyxFQUFFLE9BQU8sU0FBUyxJQUFJLE9BQU87QUFDdkUsNENBQW9CLElBQUk7QUFBQSxzQkFDMUI7QUFBQSxzQkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw0QkFBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixpREFBdUIsSUFBSSxJQUFJLFdBQVcsRUFBRSxjQUFjLFNBQVMsSUFBSSxPQUFPO0FBQzlFLDhDQUFvQixJQUFJO0FBQUEsd0JBQzFCO0FBQ0EsNEJBQUksRUFBRSxRQUFRLFNBQVUscUJBQW9CLElBQUk7QUFBQSxzQkFDbEQ7QUFBQSxzQkFDQSxXQUFVO0FBQUE7QUFBQSxvQkFoQlo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQWlCQTtBQUFBLGtCQUVGLHVCQUFDLFNBQUksV0FBVyxZQUFZLGNBQWMsSUFDdkMsY0FBSSxXQURQO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBRUE7QUFBQTtBQUFBO0FBQUEsY0EzQkssSUFBSTtBQUFBLGNBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQTZCQTtBQUFBLFVBRUo7QUFHQSxjQUFJLElBQUksT0FBTyxVQUFVO0FBQ3ZCLGtCQUFNLGVBQWU7QUFBQSxjQUNuQixNQUFNO0FBQUEsY0FDTixhQUFhO0FBQUEsY0FDYixNQUFNO0FBQUEsWUFDUjtBQUNBLGtCQUFNLFNBQVMsRUFBRSxNQUFNLE9BQU8sYUFBYSxPQUFPLE1BQU0sT0FBTztBQUUvRCxtQkFDRSx1QkFBQyxRQUFnQixPQUFPLFdBQVcsV0FBVyxzRUFBc0UsV0FBVyxJQUM3SDtBQUFBO0FBQUEsZ0JBQUM7QUFBQTtBQUFBLGtCQUNDLFNBQVMsQ0FBQyxNQUFNO0FBQ1osc0JBQUUsZ0JBQWdCO0FBQ2xCLDRDQUF3QixlQUFlLE9BQU8sSUFBSSxFQUFFO0FBQUEsa0JBQ3hEO0FBQUEsa0JBQ0EsV0FBVTtBQUFBLGtCQUVWLGlDQUFDLFVBQUssV0FBVywyRkFBMkYsYUFBYSxJQUFJLE1BQU0sS0FBSyxhQUFhLElBQUksSUFDdEo7QUFBQSx3QkFBSSxXQUFXLFVBQ2QsdUJBQUMsVUFBSyxXQUFVLCtDQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUE0RDtBQUFBLG9CQUU3RCxJQUFJLFdBQVcsaUJBQ2QsdUJBQUMsVUFBSyxXQUFVLDREQUFoQjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUF5RTtBQUFBLG9CQUUxRSxJQUFJLFdBQVcsVUFDZCx1QkFBQyxVQUFLLFdBQVUsaUZBQWhCO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBQThGO0FBQUEsb0JBRS9GLE9BQU8sSUFBSSxNQUFNLEtBQUs7QUFBQSxvQkFDdkIsdUJBQUMsZUFBWSxXQUFVLCtCQUF2QjtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUFtRDtBQUFBLHVCQVhyRDtBQUFBO0FBQUE7QUFBQTtBQUFBLHlCQVlBO0FBQUE7QUFBQSxnQkFuQkY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBb0JBO0FBQUEsY0FHQyxnQkFDQztBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFDQyxLQUFLO0FBQUEsa0JBQ0wsV0FBVTtBQUFBLGtCQUVSLFdBQUMsUUFBUSxlQUFlLE1BQU0sRUFBZSxJQUFJLFFBQ2pEO0FBQUEsb0JBQUM7QUFBQTtBQUFBLHNCQUVDLFNBQVMsTUFBTTtBQUNiLCtDQUF1QixJQUFJLElBQUksVUFBVSxFQUFFO0FBQzNDLGdEQUF3QixJQUFJO0FBQUEsc0JBQzlCO0FBQUEsc0JBQ0EsV0FBVTtBQUFBLHNCQUVWO0FBQUEsK0NBQUMsVUFBTSxpQkFBTyxFQUFFLEtBQWhCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQWtCO0FBQUEsd0JBQ2pCLElBQUksV0FBVyxNQUFNLHVCQUFDLFNBQU0sV0FBVSxnQ0FBakI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBOEM7QUFBQTtBQUFBO0FBQUEsb0JBUi9EO0FBQUEsb0JBRFA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFVQSxDQUNEO0FBQUE7QUFBQSxnQkFoQkg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBaUJBO0FBQUEsaUJBMUNLLElBQUksSUFBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQTRDQTtBQUFBLFVBRUo7QUFHQSxjQUFJLElBQUksVUFBVTtBQUNoQixnQkFBSSxVQUFVLElBQUksZ0JBQWdCLElBQUksRUFBRSxLQUFLO0FBQzdDLGtCQUFNLFlBQVksWUFBWSxnQkFBZ0IsSUFBSTtBQUdsRCxnQkFBSSxJQUFJLFNBQVMsWUFBWTtBQUMzQixvQkFBTSxZQUFZLFlBQVk7QUFDOUIscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFdBQVcsNEVBQTRFLFdBQVc7QUFBQSxrQkFFbEc7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsV0FBVTtBQUFBLHNCQUNWLFNBQVMsTUFBTSx1QkFBdUIsSUFBSSxJQUFJLElBQUksSUFBSSxZQUFZLFVBQVUsTUFBTTtBQUFBLHNCQUVqRix1QkFBYSx1QkFBQyxTQUFNLFdBQVUsaUNBQWdDLGFBQWEsS0FBOUQ7QUFBQTtBQUFBO0FBQUE7QUFBQSw2QkFBaUU7QUFBQTtBQUFBLG9CQUpqRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBS0E7QUFBQTtBQUFBLGdCQVRLLElBQUk7QUFBQSxnQkFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBV0E7QUFBQSxZQUVKO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFVBQVU7QUFDekIscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFdBQVcsNEVBQTRFLFdBQVc7QUFBQSxrQkFFbEc7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsU0FBUyxDQUFDLE1BQU07QUFDZCwwQkFBRSxnQkFBZ0I7QUFDbEIsNEJBQUksSUFBSSxpQkFBaUIsY0FBYztBQUNyQyw4QkFBSSxJQUFJLFVBQVUsV0FBVyxLQUFLLGNBQWMsU0FBUyxHQUFHO0FBQ3pELG1EQUF1QixJQUFJLElBQUksYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7QUFBQSwwQkFDakU7QUFDQSxpREFBdUIsSUFBSSxJQUFJLFVBQVUsYUFBYTtBQUFBLHdCQUN4RCxXQUFXLElBQUksaUJBQWlCLGVBQWU7QUFDN0MsaURBQXVCLElBQUksSUFBSSxVQUFVLE1BQU07QUFBQSx3QkFDakQ7QUFBQSxzQkFDRjtBQUFBLHNCQUNBLFdBQVU7QUFBQSxzQkFFVCxjQUFJLGVBQWU7QUFBQTtBQUFBLG9CQWR0QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBZUE7QUFBQTtBQUFBLGdCQW5CSyxJQUFJO0FBQUEsZ0JBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQXFCQTtBQUFBLFlBRUo7QUFFQSxnQkFBSSxJQUFJLFNBQVMsZ0JBQWdCO0FBQy9CLG9CQUFNLFlBQVksSUFBSSxzQkFBc0IsUUFBUSxLQUFLLE9BQUssRUFBRSxPQUFPLElBQUksbUJBQW1CLElBQUksUUFBUSxLQUFLLE9BQUssRUFBRSxNQUFNLFNBQVMsSUFBSSxDQUFDO0FBQzFJLG9CQUFNLGNBQWMsSUFBSSxvQkFBb0IsUUFBUSxLQUFLLE9BQUssRUFBRSxPQUFPLElBQUksaUJBQWlCLElBQUksUUFBUSxLQUFLLE9BQUssRUFBRSxNQUFNLFNBQVMsSUFBSSxDQUFDO0FBQ3hJLGtCQUFJLFNBQVM7QUFDYixrQkFBSSxhQUFhLGFBQWE7QUFDM0Isc0JBQU0sZUFBZSxPQUFPLElBQUksZ0JBQWdCLFVBQVUsRUFBRSxLQUFLLEdBQUcsRUFBRSxRQUFRLGNBQWMsRUFBRTtBQUM5RixzQkFBTSxTQUFTLE9BQU8sWUFBWSxLQUFLO0FBQ3ZDLHNCQUFNLE9BQU8sT0FBTyxJQUFJLGdCQUFnQixZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsWUFBWTtBQUMzRSxvQkFBSSxXQUFXO0FBQ2Ysb0JBQUksS0FBSyxTQUFTLEtBQUssS0FBSyxLQUFLLFNBQVMsS0FBSyxHQUFHO0FBQ2hELDZCQUFXO0FBQUEsZ0JBQ2IsV0FBVyxLQUFLLFNBQVMsS0FBSyxHQUFHO0FBQy9CLDZCQUFXLFNBQVMsY0FBYztBQUFBLGdCQUNwQyxXQUFXLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxTQUFTLEtBQUssR0FBRztBQUN0RCw2QkFBVyxTQUFTLGNBQWM7QUFBQSxnQkFDcEM7QUFDQSxzQkFBTSxXQUFXLFdBQVcsY0FBYztBQUMxQyxzQkFBTSxpQkFBaUIsSUFBSSwwQkFBMEIsU0FBWSxJQUFJLHdCQUF3QjtBQUM3Rix5QkFBUyxNQUFNLFFBQVEsSUFBSSxRQUFRLE1BQU0sU0FBUyxlQUFlLFFBQVcsRUFBRSx1QkFBdUIsZ0JBQWdCLHVCQUF1QixlQUFlLENBQUM7QUFBQSxjQUMvSixPQUFPO0FBQ0oseUJBQVM7QUFBQSxjQUNaO0FBQ0EscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFdBQVcscUhBQXFILFdBQVc7QUFBQSxrQkFFMUk7QUFBQTtBQUFBLGdCQUpJLElBQUk7QUFBQSxnQkFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBTUE7QUFBQSxZQUVKO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFVBQVU7QUFDekIsa0JBQUksU0FBUztBQUNiLG9CQUFNLFlBQVksYUFBYSxJQUFJLGVBQWUsRUFBRTtBQUNwRCxrQkFBSSxhQUFhLElBQUksc0JBQXNCLElBQUksMEJBQTBCLElBQUkseUJBQXlCO0FBQ25HLHNCQUFNLFFBQVEsSUFBSSx1QkFBdUIsVUFBVSxJQUFJLFFBQVEsSUFBSSxnQkFBZ0IsSUFBSSxrQkFBa0I7QUFDekcsb0JBQUksT0FBTztBQUNSLHdCQUFNLGFBQWEsV0FBVyxjQUFjLEtBQUssQ0FBQyxNQUFXO0FBQzFELDBCQUFNLE9BQU8sSUFBSSwyQkFBMkIsVUFBVSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsSUFBSSxzQkFBdUI7QUFDN0csMkJBQU8sU0FBUztBQUFBLGtCQUNuQixDQUFDO0FBQ0Qsc0JBQUksWUFBWTtBQUNiLDZCQUFTLElBQUksNEJBQTRCLFVBQVUsV0FBVyxRQUFRLFdBQVcsZ0JBQWdCLElBQUksdUJBQXVCLEtBQUs7QUFDakksd0JBQUksVUFBVSxDQUFDLE1BQU0sT0FBTyxNQUFNLENBQUMsS0FBSyxJQUFJLGtCQUFrQixPQUFXLFVBQVMsT0FBTyxPQUFPLE1BQU0sRUFBRSxRQUFRLElBQUksYUFBYSxDQUFDO0FBQUEsa0JBQ3JJO0FBQUEsZ0JBQ0g7QUFBQSxjQUNIO0FBRUEscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFdBQVcsdUhBQXVILFdBQVc7QUFBQSxrQkFFN0ksaUNBQUMsU0FBSSxXQUFVLHdDQUNiLGlDQUFDLFVBQUssV0FBVSxtSkFBbUosb0JBQVUsT0FBN0s7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFBaUwsS0FEbkw7QUFBQTtBQUFBO0FBQUE7QUFBQSx5QkFFQTtBQUFBO0FBQUEsZ0JBTkssSUFBSTtBQUFBLGdCQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FRQTtBQUFBLFlBRUo7QUFFQSxnQkFBSSxJQUFJLFNBQVMsV0FBVztBQUMxQixrQkFBSSxTQUFTO0FBQ2Isa0JBQUk7QUFDRixzQkFBTSxTQUFRLG9CQUFJLEtBQUssR0FBRSxZQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNuRCxzQkFBTSxPQUFPLGFBQWEsSUFBSSxXQUFXLE1BQU0sT0FBTztBQUN0RCx5QkFBUyxPQUFPLEtBQUssS0FBSyxPQUFPLEtBQUssU0FBUyxJQUFJLE1BQU0sUUFBUSxjQUFjLEtBQUssY0FBYyxLQUFLLGNBQWMsR0FBRyxDQUFDO0FBQUEsY0FDM0gsU0FBUyxHQUFHO0FBQ1YseUJBQVM7QUFBQSxjQUNYO0FBRUEsa0JBQUksV0FBVyxXQUFXLFdBQVcsTUFBTSxDQUFDLE1BQU0sT0FBTyxNQUFNLENBQUMsS0FBSyxJQUFJLGtCQUFrQixRQUFXO0FBQ3BHLHlCQUFTLE9BQU8sTUFBTSxFQUFFLFFBQVEsSUFBSSxhQUFhO0FBQUEsY0FDbkQ7QUFFQSxvQkFBTSxtQkFBbUIsa0JBQWtCLFVBQVUsYUFBYSxJQUFJLE1BQU0sa0JBQWtCLFVBQVUsSUFBSTtBQUM1RyxxQkFDRTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFFQyxPQUFPO0FBQUEsa0JBQ1AsU0FBUyxNQUFNO0FBQ2Isd0NBQW9CLEVBQUUsT0FBTyxhQUFhLElBQUksSUFBSSxPQUFPLElBQUksR0FBRyxDQUFDO0FBQUEsa0JBQ25FO0FBQUEsa0JBQ0EsT0FBTTtBQUFBLGtCQUNOLFdBQVcsNkxBQTZMLFdBQVc7QUFBQSxrQkFFbE4sNkJBQ0M7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsY0FBYyxJQUFJLFdBQVc7QUFBQSxzQkFDN0IsV0FBUztBQUFBLHNCQUNULFFBQVEsQ0FBQyxNQUFNO0FBQ2IsOEJBQU0sYUFBYSxFQUFFLE9BQU87QUFDNUIsbUNBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLFNBQVMsV0FBVyxJQUFJLENBQUMsQ0FBQztBQUNyRiw0Q0FBb0IsSUFBSTtBQUFBLHNCQUMxQjtBQUFBLHNCQUNBLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLDRCQUFJLEVBQUUsUUFBUSxXQUFXLENBQUMsRUFBRSxVQUFVO0FBQ3BDLDRCQUFFLGVBQWU7QUFDakIsZ0NBQU0sYUFBYSxFQUFFLGNBQWM7QUFDbkMscUNBQVcsVUFBUSxLQUFLLElBQUksT0FBSyxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLFNBQVMsV0FBVyxJQUFJLENBQUMsQ0FBQztBQUNyRiw4Q0FBb0IsSUFBSTtBQUFBLHdCQUMxQixXQUFXLEVBQUUsUUFBUSxVQUFVO0FBQzdCLDhDQUFvQixJQUFJO0FBQUEsd0JBQzFCO0FBQUEsc0JBQ0Y7QUFBQSxzQkFDQSxXQUFVO0FBQUE7QUFBQSxvQkFsQlo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQW1CQSxJQUVBO0FBQUE7QUFBQSxnQkE5QkcsSUFBSTtBQUFBLGdCQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FpQ0E7QUFBQSxZQUVKO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFlBQVk7QUFDM0Isb0JBQU0sU0FBUyxRQUFRLE1BQU0sR0FBRyxFQUFFLElBQUksT0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUNuRSxxQkFDRTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFFQyxPQUFPO0FBQUEsa0JBQ1AsU0FBUyxNQUFNLG9CQUFvQixFQUFFLE9BQU8sSUFBSSxJQUFJLE9BQU8sSUFBSSxHQUFHLENBQUM7QUFBQSxrQkFDbkUsV0FBVyxtSUFBbUksV0FBVztBQUFBLGtCQUV4SjtBQUFBLGlDQUNDO0FBQUEsc0JBQUM7QUFBQTtBQUFBLHdCQUNDLE1BQUs7QUFBQSx3QkFDTCxjQUFjO0FBQUEsd0JBQ2QsV0FBUztBQUFBLHdCQUNULFFBQVEsQ0FBQyxNQUFNO0FBQ2IsaURBQXVCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDckQsOENBQW9CLElBQUk7QUFBQSx3QkFDMUI7QUFBQSx3QkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw4QkFBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixtREFBdUIsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLGNBQWMsS0FBSztBQUM1RCxnREFBb0IsSUFBSTtBQUFBLDBCQUMxQjtBQUNBLDhCQUFJLEVBQUUsUUFBUSxTQUFVLHFCQUFvQixJQUFJO0FBQUEsd0JBQ2xEO0FBQUEsd0JBQ0EsYUFBWTtBQUFBLHdCQUNaLFdBQVU7QUFBQTtBQUFBLHNCQWhCWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsb0JBaUJBO0FBQUEsb0JBRUYsdUJBQUMsU0FBSSxXQUFXLHdCQUF3QixZQUFZLGNBQWMsRUFBRSxJQUNqRTtBQUFBLDZCQUFPLFdBQVcsS0FBSyx1QkFBQyxVQUFLLFdBQVUsZ0NBQStCLGlCQUEvQztBQUFBO0FBQUE7QUFBQTtBQUFBLDZCQUFnRDtBQUFBLHNCQUN2RSxPQUFPLElBQUksU0FBTztBQUNqQiw4QkFBTSxZQUFZLFFBQVEsSUFBSSxHQUFHO0FBQ2pDLDRCQUFJLENBQUMsVUFBVyxRQUFPLHVCQUFDLFVBQWUsV0FBVSw0RkFBNEY7QUFBQTtBQUFBLDBCQUFJO0FBQUEsNkJBQS9HLEtBQVg7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBNkg7QUFDcEosK0JBQ0UsdUJBQUMsVUFBZSxXQUFVLHVLQUFzSztBQUFBO0FBQUEsMEJBQzFMLFVBQVUsTUFBTSxNQUFNLEdBQUcsRUFBRTtBQUFBLDZCQUR0QixLQUFYO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBRUE7QUFBQSxzQkFFSixDQUFDO0FBQUEseUJBVkg7QUFBQTtBQUFBO0FBQUE7QUFBQSwyQkFXQTtBQUFBO0FBQUE7QUFBQSxnQkFwQ0ssSUFBSTtBQUFBLGdCQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FzQ0E7QUFBQSxZQUVKO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFVBQVU7QUFDeEIsb0JBQU0sWUFBWSxJQUFJLGdCQUFnQixJQUFJLGVBQWUsRUFBRSxLQUFLO0FBQ2hFLG9CQUFNLFNBQVMsVUFBVSxNQUFNLEdBQUcsRUFBRSxJQUFJLE9BQUssRUFBRSxLQUFLLENBQUMsRUFBRSxPQUFPLE9BQU87QUFDckUsb0JBQU0sYUFBYSxPQUFPLElBQUksU0FBTyxRQUFRLElBQUksR0FBRyxDQUFDLEVBQUUsT0FBTyxPQUFPO0FBRXJFLGtCQUFJLFlBQVk7QUFDaEIsa0JBQUksV0FBVyxTQUFTLEdBQUc7QUFDekIsb0JBQUksSUFBSSxrQkFBa0IsU0FBUztBQUNqQyw4QkFBWSxXQUFXLE9BQU8sU0FBUztBQUFBLGdCQUN6QyxXQUFXLElBQUksa0JBQWtCLGdCQUFnQjtBQUMvQyx3QkFBTSxZQUFZLFdBQVcsT0FBTyxPQUFLLEVBQUUsV0FBVyxNQUFNLEVBQUU7QUFDOUQsOEJBQVksR0FBRyxLQUFLLE1BQU8sWUFBWSxXQUFXLFNBQVUsR0FBRyxDQUFDO0FBQUEsZ0JBQ2xFO0FBQUEsY0FDRjtBQUVBLGtCQUFJLGNBQWMsT0FBTyxDQUFDLFVBQVUsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLE9BQU8sU0FBUyxDQUFDLEtBQUssSUFBSSxrQkFBa0IsUUFBVztBQUNqSCw0QkFBWSxPQUFPLFNBQVMsRUFBRSxRQUFRLElBQUksYUFBYTtBQUFBLGNBQ3pEO0FBRUEscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFdBQVcsNElBQTRJLFdBQVc7QUFBQSxrQkFFaks7QUFBQTtBQUFBLGdCQUpJLElBQUk7QUFBQSxnQkFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBTUE7QUFBQSxZQUVMO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFVBQVU7QUFDekIsb0JBQU0sVUFBVSxJQUFJLFdBQVcsQ0FBQztBQUNoQyxxQkFDRTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFFQyxPQUFPO0FBQUEsa0JBQ1AsV0FBVyxzRUFBc0UsV0FBVztBQUFBLGtCQUU1RjtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFDQyxPQUFPO0FBQUEsc0JBQ1AsVUFBVSxDQUFDLE1BQU0sdUJBQXVCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFBQSxzQkFDdEUsV0FBVTtBQUFBLHNCQUVWO0FBQUEsK0NBQUMsWUFBTyxPQUFNLElBQUcseUJBQWpCO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQTBCO0FBQUEsd0JBQzFCLHVCQUFDLGNBQVMsT0FBTSxjQUNiLGtCQUFRLE9BQU8sQ0FBQyxHQUFHLE1BQU0sSUFBSSxRQUFRLFNBQVMsQ0FBQyxFQUFFLElBQUksU0FDcEQsdUJBQUMsWUFBaUIsT0FBTyxLQUFNLGlCQUFsQixLQUFiO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQW1DLENBQ3BDLEtBSEg7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFJQTtBQUFBLHdCQUNBLHVCQUFDLGNBQVMsT0FBTSxzQkFDYixrQkFBUSxPQUFPLENBQUMsR0FBRyxNQUFNLEtBQUssUUFBUSxTQUFTLEtBQUssSUFBSyxRQUFRLFNBQVMsSUFBSyxDQUFDLEVBQUUsSUFBSSxTQUNyRix1QkFBQyxZQUFpQixPQUFPLEtBQU0saUJBQWxCLEtBQWI7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBbUMsQ0FDcEMsS0FISDtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUlBO0FBQUEsd0JBQ0EsdUJBQUMsY0FBUyxPQUFNLGFBQ2Isa0JBQVEsT0FBTyxDQUFDLEdBQUcsTUFBTSxLQUFNLFFBQVEsU0FBUyxJQUFLLENBQUMsRUFBRSxJQUFJLFNBQzNELHVCQUFDLFlBQWlCLE9BQU8sS0FBTSxpQkFBbEIsS0FBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUFtQyxDQUNwQyxLQUhIO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBSUE7QUFBQTtBQUFBO0FBQUEsb0JBcEJGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFxQkE7QUFBQTtBQUFBLGdCQXpCSyxJQUFJO0FBQUEsZ0JBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQTJCQTtBQUFBLFlBRUo7QUFFQSxnQkFBSSxJQUFJLFNBQVMsVUFBVTtBQUN6QixvQkFBTSxVQUFVLElBQUksV0FBVyxDQUFDO0FBQ2hDLG9CQUFNLFdBQVcsWUFBWSxVQUFhLFlBQVksUUFBUSxZQUFZO0FBQzFFLG9CQUFNLG1CQUFtQixRQUFRLFNBQVMsT0FBTztBQUNqRCxxQkFDRTtBQUFBLGdCQUFDO0FBQUE7QUFBQSxrQkFFQyxPQUFPO0FBQUEsa0JBQ1AsV0FBVyxzRUFBc0UsV0FBVztBQUFBLGtCQUU1RjtBQUFBLG9CQUFDO0FBQUE7QUFBQSxzQkFDQyxPQUFPLFdBQVc7QUFBQSxzQkFDbEIsVUFBVSxDQUFDLE1BQU0sdUJBQXVCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFBQSxzQkFDdEUsV0FBVTtBQUFBLHNCQUVWO0FBQUEsK0NBQUMsWUFBTyxPQUFNLE1BQWQ7QUFBQTtBQUFBO0FBQUE7QUFBQSwrQkFBaUI7QUFBQSx3QkFDaEIsUUFBUSxJQUFJLFNBQ1gsdUJBQUMsWUFBaUIsT0FBTyxLQUFNLGlCQUFsQixLQUFiO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0JBQW1DLENBQ3BDO0FBQUEsd0JBQ0EsWUFBWSxDQUFDLG9CQUNaLHVCQUFDLFlBQXFCLE9BQU8sU0FBVSxxQkFBMUIsU0FBYjtBQUFBO0FBQUE7QUFBQTtBQUFBLCtCQUErQztBQUFBO0FBQUE7QUFBQSxvQkFWbkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQVlBO0FBQUE7QUFBQSxnQkFoQkssSUFBSTtBQUFBLGdCQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FrQkE7QUFBQSxZQUVKO0FBRUEsZ0JBQUksSUFBSSxTQUFTLFFBQVE7QUFDdkIscUJBQ0U7QUFBQSxnQkFBQztBQUFBO0FBQUEsa0JBRUMsT0FBTztBQUFBLGtCQUNQLFNBQVMsTUFBTSxvQkFBb0IsRUFBRSxPQUFPLElBQUksSUFBSSxPQUFPLElBQUksR0FBRyxDQUFDO0FBQUEsa0JBQ25FLFdBQVcsOEpBQThKLFdBQVc7QUFBQSxrQkFFbkw7QUFBQSxpQ0FDQztBQUFBLHNCQUFDO0FBQUE7QUFBQSx3QkFDQyxNQUFLO0FBQUEsd0JBQ0wsY0FBYztBQUFBLHdCQUNkLFdBQVM7QUFBQSx3QkFDVCxTQUFTLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQUEsd0JBQ2pELFFBQVEsQ0FBQyxNQUFNO0FBQ2IsaURBQXVCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDckQsOENBQW9CLElBQUk7QUFBQSx3QkFDMUI7QUFBQSx3QkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw4QkFBSSxFQUFFLFFBQVEsU0FBUztBQUNyQixtREFBdUIsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLGNBQWMsS0FBSztBQUM1RCxnREFBb0IsSUFBSTtBQUFBLDBCQUMxQjtBQUNBLDhCQUFJLEVBQUUsUUFBUSxTQUFVLHFCQUFvQixJQUFJO0FBQUEsd0JBQ2xEO0FBQUEsd0JBQ0EsV0FBVTtBQUFBO0FBQUEsc0JBaEJaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxvQkFpQkE7QUFBQSxvQkFFRix1QkFBQyxTQUFJLFdBQVcsWUFBWSxjQUFjLElBQ3ZDLHFCQURIO0FBQUE7QUFBQTtBQUFBO0FBQUEsMkJBRUE7QUFBQTtBQUFBO0FBQUEsZ0JBM0JLLElBQUk7QUFBQSxnQkFEWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBNkJBO0FBQUEsWUFFSjtBQUdBLGdCQUFJLFlBQVk7QUFDaEIsZ0JBQUksSUFBSSxTQUFTLFNBQVUsYUFBWTtBQUV2QyxtQkFDRTtBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUVDLE9BQU87QUFBQSxnQkFDUCxTQUFTLE1BQU0sb0JBQW9CLEVBQUUsT0FBTyxJQUFJLElBQUksT0FBTyxJQUFJLEdBQUcsQ0FBQztBQUFBLGdCQUNuRSxXQUFXLG1LQUFtSyxXQUFXO0FBQUEsZ0JBRXhMO0FBQUEsK0JBQ0M7QUFBQSxvQkFBQztBQUFBO0FBQUEsc0JBQ0MsY0FBYztBQUFBLHNCQUNkLFdBQVM7QUFBQSxzQkFDVCxTQUFTLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQUEsc0JBQ2pELFFBQVEsQ0FBQyxNQUFNO0FBQ2IsK0NBQXVCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxPQUFPLEtBQUs7QUFDckQsNENBQW9CLElBQUk7QUFBQSxzQkFDMUI7QUFBQSxzQkFDQSxXQUFXLENBQUMsTUFBTTtBQUNoQiw0QkFBSSxFQUFFLFFBQVEsV0FBVyxDQUFDLEVBQUUsVUFBVTtBQUNwQyxpREFBdUIsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLGNBQWMsS0FBSztBQUM1RCw4Q0FBb0IsSUFBSTtBQUFBLHdCQUMxQjtBQUNBLDRCQUFJLEVBQUUsUUFBUSxTQUFVLHFCQUFvQixJQUFJO0FBQUEsc0JBQ2xEO0FBQUEsc0JBQ0EsV0FBVTtBQUFBO0FBQUEsb0JBZlo7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQWdCQTtBQUFBLGtCQUVGLHVCQUFDLFNBQUksV0FBVyw2REFBNkQsWUFBWSxjQUFjLEVBQUUsSUFDdEcsd0JBQWMsWUFBWSxJQUFJLGtCQUFrQixVQUFhLFdBQVcsQ0FBQyxNQUFNLE9BQU8sT0FBTyxDQUFDLElBQzNGLE9BQU8sT0FBTyxFQUFFLFFBQVEsSUFBSSxhQUFhLElBQ3hDLFdBQVcsdUJBQUMsVUFBSyxXQUFVLGFBQVksaUJBQTVCO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBQTZCLEtBSC9DO0FBQUE7QUFBQTtBQUFBO0FBQUEseUJBSUE7QUFBQTtBQUFBO0FBQUEsY0E1QkssSUFBSTtBQUFBLGNBRFg7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQThCQTtBQUFBLFVBRUo7QUFFQSxpQkFBTztBQUFBLFFBQ1QsQ0FBQztBQUFBLFFBR0QsdUJBQUMsUUFBRyxXQUFVLGlFQUNaO0FBQUEsVUFBQztBQUFBO0FBQUEsWUFDQyxTQUFTLE1BQU07QUFDYixrQkFBSSxRQUFRLElBQUksSUFBSSxFQUFFLG9CQUFvQixHQUFHO0FBQzNDLGdDQUFnQixVQUFRLEtBQUssT0FBTyxPQUFLLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUN6RCwrQkFBZSxVQUFRLEtBQUssT0FBTyxRQUFNLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFBQSxjQUN6RDtBQUFBLFlBQ0Y7QUFBQSxZQUNBLFdBQVU7QUFBQSxZQUNWLE9BQU07QUFBQSxZQUVOLGlDQUFDLFVBQU8sV0FBVSxhQUFsQjtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUE0QjtBQUFBO0FBQUEsVUFWOUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBV0EsS0FaRjtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBYUE7QUFBQTtBQUFBO0FBQUEsSUFud0JLLElBQUk7QUFBQSxJQURYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFzd0JBO0FBR2xCLEdBQUcsQ0FBQyxNQUFNLFNBQVM7QUFDakIsU0FDRSxLQUFLLFFBQVEsS0FBSyxPQUNsQixLQUFLLGVBQWUsS0FBSyxjQUN6QixLQUFLLGFBQWEsS0FBSyxZQUN2QixLQUFLLGdCQUFnQixLQUFLLGVBQzFCLEtBQUssb0JBQW9CLEtBQUssbUJBQzlCLEtBQUssaUJBQWlCLEtBQUssZ0JBQzNCLEtBQUssbUJBQW1CLEtBQUssa0JBQzdCLEtBQUssbUJBQW1CLEtBQUssa0JBQzdCLEtBQUssaUJBQWlCLEtBQUssZ0JBQzNCLEtBQUssa0JBQWtCLEtBQUssaUJBQzVCLEtBQUssWUFBWSxLQUFLLFdBQ3RCLEtBQUsscUJBQXFCLEtBQUssb0JBQy9CLEtBQUssaUJBQWlCLEtBQUssZ0JBQzNCLEtBQUssa0JBQWtCLEtBQUssaUJBQzVCLEtBQUssZ0JBQWdCLEtBQUssZUFDMUIsS0FBSyxrQkFBa0IsS0FBSyxpQkFDNUIsS0FBSyxxQkFBcUIsS0FBSyxvQkFDL0IsS0FBSyxlQUFlLEtBQUssY0FDekIsS0FBSyx1QkFBdUIsS0FBSztBQUVyQyxDQUFDOyIsIm5hbWVzIjpbIlNwcmVhZHNoZWV0Um93Il19