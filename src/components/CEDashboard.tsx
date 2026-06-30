import React, { useState, useMemo, useEffect, useRef } from "react";
import { Requirement, Column } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Label,
} from "recharts";
import { createPortal } from "react-dom";
import { resolveColumnValue } from "./Spreadsheet";
import { EyeOff, Eye, GripVertical, AlignJustify, Type, Settings, Plus, Trash2, DollarSign, Layers, Home, Globe, Maximize, CheckCircle } from "lucide-react";

interface CEDashboardProps {
  requirements: Requirement[];
  columns: Column[];
  tabDataMap: Record<string, any>;
  tabs: any[];
  configs: any[];
  onConfigChange: (index: number, newConfig: any) => void;
  onConfigsChange?: (newConfigs: any[]) => void;
}

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#4f46e5",
  "#be123c",
];

function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 20; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  const xOffset = x > cx ? 8 : -8;

  return (
    <text x={x + xOffset} y={y} fill="#f8fafc" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12">
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

export default function CEDashboard({
  requirements,
  columns,
  tabDataMap,
  tabs,
  configs = [],
  onConfigChange,
  onConfigsChange,
}: CEDashboardProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    index: number;
  } | null>(null);
  const [reasonPopup, setReasonPopup] = useState<{ x: number, y: number, text: string, rowName: string } | null>(null);
  const [headerMenu, setHeaderMenu] = useState<{ x: number, y: number } | null>(null);
  const [resizingCol, setResizingCol] = useState<{ id: string, startX: number, startWidth: number, panelIndex: number } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const mainConfig = configs[0] || {};
  const layoutCount = mainConfig.layoutCount || 2;
  const showReasons = mainConfig.showReasons !== false;
  const isSingleLineReason = mainConfig.isSingleLineReason === true;

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  };

  const closeMenu = () => setContextMenu(null);

  useEffect(() => {
    if (contextMenu || reasonPopup || headerMenu) {
      const handleClickOutside = () => {
        closeMenu();
        setReasonPopup(null);
        setHeaderMenu(null);
      };
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu, reasonPopup, headerMenu]);

  const [tempColWidths, setTempColWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    if (resizingCol) {
      let finalWidth = resizingCol.startWidth;
      const handleMouseMove = (e: MouseEvent) => {
        const diff = e.clientX - resizingCol.startX;
        finalWidth = Math.max(50, resizingCol.startWidth + diff);
        setTempColWidths({ [resizingCol.id]: finalWidth });
      };
      const handleMouseUp = () => {
        const panelConfig = configs[resizingCol.panelIndex] || {};
        const newWidths = { ...(panelConfig.colWidths || {}), [resizingCol.id]: finalWidth };
        if (onConfigChange) {
           onConfigChange(resizingCol.panelIndex, { ...configs[resizingCol.panelIndex], colWidths: newWidths });
        }
        setResizingCol(null);
        setTempColWidths({});
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingCol, configs, onConfigChange]);

  const exchangeRates = useMemo(() => {
    const saved = localStorage.getItem("app_exchange_rates");
    return saved ? JSON.parse(saved) : { KRW: 1, USD: 1400, EUR: 1500 };
  }, []);

  const updateConfig = (panelIndex: number, updates: any) => {
    const newConfig = { ...(configs[panelIndex] || {}), ...updates };
    onConfigChange(panelIndex, newConfig);
  };

  const getPanelData = (panelIndex: number) => {
    const pConfig = configs[panelIndex] || {};
    const isLinked = panelIndex > 0 && pConfig.isLinked !== false;
    const linkedIdx = isLinked ? (pConfig.linkedTableIndex ?? 0) : panelIndex;
    const sourceConfig = configs[linkedIdx] || {};
    
    const cCriteria = sourceConfig.criteriaColId || mainConfig.criteriaColId;
    const cSum = sourceConfig.sumColId || mainConfig.sumColId;
    const cFilter = sourceConfig.filterColId || mainConfig.filterColId;
    const aggMode = sourceConfig.aggMode || 'default';
    const wbsColId = sourceConfig.wbsColId || mainConfig.wbsColId;
    
    if ((aggMode === 'default' && !cCriteria) || (aggMode === 'wbs' && !wbsColId) || !cSum) return { result: [], totalSum: 0, domesticSum: 0, totalUsdSum: 0, foreignSum: 0 };

    const sums: Record<string, number> = {};
    if (aggMode === 'wbs') {
        ['100', '200', '300', '400', '500', '600', '700'].forEach(bucket => {
            sums[`${bucket}그룹`] = 0;
        });
    }
    
    let totalSum = 0;
    let domesticSum = 0;
    let totalUsdSum = 0;

    requirements.forEach((req: any) => {
        let isFiltered = true;
        if (cFilter) {
            const isFilteredVal = resolveColumnValue(req, cFilter, columns, tabDataMap, tabs, exchangeRates);
            isFiltered = isFilteredVal === true || isFilteredVal === "true" || isFilteredVal === "O" || isFilteredVal === "Y";
        }
        if (!isFiltered) return;

        const valRaw = resolveColumnValue(req, cSum, columns, tabDataMap, tabs, exchangeRates);
        const valStr = String(valRaw || "0").replace(/[^0-9.-]+/g, "");
        let val = Number(valStr);
        if (isNaN(val)) val = 0;

        let groupKey = "Uncategorized";

        if (aggMode === 'wbs') {
            const wbsRaw = resolveColumnValue(req, wbsColId, columns, tabDataMap, tabs, exchangeRates);
            const wbsMatch = String(wbsRaw || "0").match(/\d+/);
            const wbsNum = wbsMatch ? parseInt(wbsMatch[0], 10) : NaN;
            if (!isNaN(wbsNum)) {
                const bucket = Math.floor(wbsNum / 100) * 100;
                groupKey = `${String(bucket).padStart(3, '0')}그룹`;
            }
        } else {
            const groupKeyRaw = cCriteria === "title" ? req.title : resolveColumnValue(req, cCriteria, columns, tabDataMap, tabs, exchangeRates);
            groupKey = String(groupKeyRaw || "Uncategorized");
        }

        sums[groupKey] = (sums[groupKey] || 0) + val;
        totalSum += val;

        if (pConfig.chartType === 'domesticForeignTable' && pConfig.currencyColId && pConfig.usdAmountColId) {
            const currencyVal = resolveColumnValue(req, pConfig.currencyColId, columns, tabDataMap, tabs, exchangeRates);
            const usdValRaw = resolveColumnValue(req, pConfig.usdAmountColId, columns, tabDataMap, tabs, exchangeRates);
            const usdValStr = String(usdValRaw || "0").replace(/[^0-9.-]+/g, "");
            let usdVal = Number(usdValStr) || 0;
            
            totalUsdSum += usdVal;
            if (String(currencyVal).trim().toUpperCase() === "KRW") {
                domesticSum += usdVal;
            }
        }
    });

    const result = Object.entries(sums).map(([name, value]) => {
        let wbsDesc = "";
        if (aggMode === 'wbs') {
            const wbsNum = parseInt(name.split(" ")[0], 10);
            if (!isNaN(wbsNum)) {
                const wbsDescriptions: Record<number, string> = {
                  100: "선체구조",
                  200: "추진계통",
                  300: "전기계통",
                  400: "지휘통신계통",
                  500: "보기계통",
                  600: "의장계통",
                  700: "무장계통",
                };
                wbsDesc = wbsDescriptions[wbsNum] || "";
            }
        }

        return {
            name,
            wbsDesc,
            value,
            percentage: totalSum > 0 ? (value / totalSum) * 100 : 0,
        };
    });

    if (aggMode === 'wbs') {
        result.sort((a, b) => {
            const numA = parseInt(a.name.split(" ")[0] || a.name, 10);
            const numB = parseInt(b.name.split(" ")[0] || b.name, 10);
            
            const validA = !isNaN(numA);
            const validB = !isNaN(numB);
            
            if (validA && validB) return numA - numB;
            if (!validA && validB) return 1;
            if (validA && !validB) return -1;
            return b.value - a.value;
        });
    } else {
        const orderConfig = pConfig.order || mainConfig.order;
        if (orderConfig && orderConfig.length > 0) {
            result.sort((a, b) => {
              const indexA = orderConfig.indexOf(a.name);
              const indexB = orderConfig.indexOf(b.name);
              if (indexA === -1 && indexB === -1) return b.value - a.value;
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });
        } else {
            result.sort((a, b) => b.value - a.value);
        }
    }

    return { 
        result, 
        totalSum,
        domesticSum,
        totalUsdSum,
        foreignSum: totalUsdSum - domesticSum
    };
  };

  const panelDataMap = useMemo(() => {
    const map = new Map();
    // First compute Panel 0
    map.set(0, getPanelData(0));
    
    for (let i = 1; i < layoutCount; i++) {
       const pConfig = configs[i] || {};
       if (pConfig.chartType === "comparisonTable") {
          const panel0Data = map.get(0)?.result || [];
          const manualData = pConfig.manualData || {};
          let totalSum = 0;
          const result = panel0Data.map((item: any) => {
            const val = Number(manualData[item.name]) || 0;
            totalSum += val;
            return { name: item.name, value: val, percentage: 0 };
          });
          result.forEach((item: any) => {
            item.percentage = totalSum > 0 ? (item.value / totalSum) * 100 : 0;
          });
          map.set(i, { result, totalSum, domesticSum: 0, totalUsdSum: 0, foreignSum: 0 });
       } else {
          map.set(i, getPanelData(i));
       }
    }
    return map;
  }, [requirements, configs, layoutCount, columns, tabDataMap, tabs, exchangeRates]);

  const topDashboardStats = useMemo(() => {
    let topUsdSum = 0;
    let equipmentCount = 0;
    let topDomesticSum = 0;
    let totalReviewCount = 0;
    let doneReviewCount = 0;

    const filterCol = mainConfig.topFilterColId || mainConfig.filterColId;
    const usdCol = mainConfig.topUsdColId || mainConfig.usdAmountColId;
    const equipCol = mainConfig.topEquipmentColId || mainConfig.criteriaColId;
    const currCol = mainConfig.topCurrencyColId || mainConfig.currencyColId;

    requirements.forEach((req: any) => {
        let isFiltered = true;
        if (filterCol) {
            const isFilteredVal = resolveColumnValue(req, filterCol, columns, tabDataMap, tabs, exchangeRates);
            isFiltered = isFilteredVal === true || isFilteredVal === "true" || isFilteredVal === "O" || isFilteredVal === "Y";
        }
        if (!isFiltered) return;

        totalReviewCount += 1;
        if (req.status === 'DONE' || (req.status as string) === '검토완료') {
            doneReviewCount += 1;
        }

        if (usdCol) {
            const usdValRaw = resolveColumnValue(req, usdCol, columns, tabDataMap, tabs, exchangeRates);
            const usdValStr = String(usdValRaw || "0").replace(/[^0-9.-]+/g, "");
            let usdVal = Number(usdValStr) || 0;
            topUsdSum += usdVal;

            if (currCol) {
                const currencyVal = resolveColumnValue(req, currCol, columns, tabDataMap, tabs, exchangeRates);
                if (String(currencyVal).trim().toUpperCase() === "KRW") {
                    topDomesticSum += usdVal;
                }
            }
        }

        if (equipCol) {
            const equipValRaw = resolveColumnValue(req, equipCol, columns, tabDataMap, tabs, exchangeRates);
            if (equipValRaw !== undefined && equipValRaw !== null && String(equipValRaw).trim() !== "") {
                equipmentCount += 1;
            }
        }
    });

    return {
        topUsdSum,
        equipmentCount,
        topDomesticSum,
        topForeignSum: topUsdSum - topDomesticSum,
        reviewProgress: totalReviewCount > 0 ? (doneReviewCount / totalReviewCount) * 100 : 0
    };
  }, [requirements, mainConfig, columns, tabDataMap, tabs, exchangeRates]);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex) return;

    const { result } = panelDataMap.get(0) || { result: [] };
    if (!result || result.length === 0) return;

    const currentOrder = mainConfig.order || result.map((d: any) => d.name);
    const missing = result.filter((d: any) => !currentOrder.includes(d.name)).map((d: any) => d.name);
    const fullOrder = [...currentOrder, ...missing];

    const targetName = result[dropIndex].name;
    const draggedName = result[draggedIdx].name;

    const newOrder = [...fullOrder];
    newOrder.splice(newOrder.indexOf(draggedName), 1);
    newOrder.splice(newOrder.indexOf(targetName), 0, draggedName);

    updateConfig(0, { order: newOrder });
    setDraggedIdx(null);
  };

  return (
    <div className="flex flex-col gap-4 w-full mb-6 animate-in fade-in slide-in-from-bottom-2 text-sm relative">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-lg font-bold text-brand-on-surface">CE 대시보드</h2>
        <div className="flex gap-1 bg-brand-surface-highest p-1 rounded-lg">
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-lg relative group min-h-[100px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400 tracking-wide">견적가(USD)</span>
          </div>
          <div className="text-[32px] font-black tracking-tight text-slate-200">
             {formatNumber(topDashboardStats.topUsdSum)}
          </div>
          <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-brand-on-surface-variant hover:text-brand-primary transition-opacity" onClick={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, index: -1 }); }}>
              <Settings size={14} />
          </button>
        </div>
        
        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-lg relative group min-h-[100px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400 tracking-wide">장비수량</span>
          </div>
          <div className="text-[32px] font-black tracking-tight text-slate-200">
             {formatNumber(topDashboardStats.equipmentCount)}
          </div>
          <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-brand-on-surface-variant hover:text-brand-primary transition-opacity" onClick={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, index: -1 }); }}>
              <Settings size={14} />
          </button>
        </div>

        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-lg relative group min-h-[100px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400 tracking-wide">검토 진행률</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[32px] font-black tracking-tight text-slate-200">
               {topDashboardStats.reviewProgress.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-lg relative min-h-[100px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Home className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400 tracking-wide">내자(USD)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[32px] font-black tracking-tight text-slate-200">
               {formatNumber(topDashboardStats.topDomesticSum)}
            </div>
            <span className="text-[14px] font-bold text-violet-400">
              {topDashboardStats.topUsdSum > 0 ? ((topDashboardStats.topDomesticSum / topDashboardStats.topUsdSum) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-brand-surface border border-white/5 rounded-xl p-5 flex flex-col justify-between shadow-lg relative min-h-[100px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <Globe className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-[13px] font-semibold text-slate-400 tracking-wide">외자(USD)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[32px] font-black tracking-tight text-slate-200">
               {formatNumber(topDashboardStats.topForeignSum)}
            </div>
            <span className="text-[14px] font-bold text-rose-400">
              {topDashboardStats.topUsdSum > 0 ? ((topDashboardStats.topForeignSum / topDashboardStats.topUsdSum) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      <div 
        className="flex flex-row gap-4 w-full flex-wrap pb-2 scrollbar-thin scrollbar-thumb-brand-surface-highest hover:scrollbar-thumb-brand-outline-variant scrollbar-track-transparent min-h-[400px]"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, index: -2 });
          }
        }}
      >
        {(() => {
          let panelOrder = mainConfig.panelOrder || [];
          for (let i = 0; i < layoutCount; i++) {
            if (!panelOrder.includes(i)) panelOrder.push(i);
          }
          panelOrder = panelOrder.filter((idx: number) => idx < layoutCount);

          return panelOrder.map((index: number, visualIndex: number) => {
            const { result: data, totalSum, domesticSum, totalUsdSum, foreignSum } = panelDataMap.get(index) || { result: [], totalSum: 0, domesticSum: 0, totalUsdSum: 0, foreignSum: 0 };
            const pConfig = configs[index] || {};

            const handleDragStart = (e: React.DragEvent) => {
              e.dataTransfer.setData("text/plain", `panel-${index}`);
            };

            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              const draggedType = e.dataTransfer.getData("text/plain");
              if (draggedType.startsWith("panel-")) {
                const draggedIndex = parseInt(draggedType.split("-")[1], 10);
                if (draggedIndex !== index) {
                  const newOrder = [...panelOrder];
                  const draggedVisIdx = newOrder.indexOf(draggedIndex);
                  const dropVisIdx = newOrder.indexOf(index);
                  newOrder[draggedVisIdx] = index;
                  newOrder[dropVisIdx] = draggedIndex;
                  updateConfig(0, { panelOrder: newOrder });
                }
              }
            };

            if (index === 0) {
            // Table Panel
            const isTableSplit = mainConfig.isTableSplit === true;
            const tableSplitRows = mainConfig.tableSplitRows || 8;
            
            const chunkedData = [];
            if (data.length > 0) {
              if (isTableSplit) {
                chunkedData.push(data.slice(0, tableSplitRows));
                if (tableSplitRows < data.length) {
                  chunkedData.push(data.slice(tableSplitRows));
                }
              } else {
                chunkedData.push(data);
              }
            } else {
              chunkedData.push([]);
            }

            return (
              <div
                key={index}
                className="flex-shrink-0 border border-brand-outline-variant bg-brand-bg rounded-xl p-3 flex flex-col shadow-sm relative text-sm"
                style={{ resize: 'both', overflow: 'hidden', minWidth: '600px', width: pConfig.width || (layoutCount === 2 ? '60%' : '50%'), minHeight: '300px', height: pConfig.height || 'auto' }}
                onContextMenu={(e) => handleContextMenu(e, index)}
                onMouseUp={(e) => {
                  const newWidth = e.currentTarget.style.width;
                  const newHeight = e.currentTarget.style.height;
                  if ((newWidth && newWidth !== pConfig.width) || (newHeight && newHeight !== pConfig.height)) {
                    updateConfig(index, { width: newWidth, height: newHeight });
                  }
                }}
              >
                <div 
                  className="flex items-center mb-3 justify-between cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={handleDragStart}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center flex-1">
                    <div className="text-brand-on-surface-variant flex items-center justify-center mr-1">
                      <GripVertical size={16} />
                    </div>
                    <input 
                      value={pConfig.title ?? "CE 집계 테이블"} 
                      onChange={(e) => updateConfig(index, { title: e.target.value })}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="font-bold text-base text-brand-on-surface bg-transparent outline-none border-none hover:bg-brand-surface-high rounded px-1 -ml-1 w-full max-w-[300px]"
                    />
                    {(!pConfig.criteriaColId || !pConfig.sumColId || !pConfig.filterColId) && (
                      <span className="text-brand-on-surface-variant font-normal ml-2 whitespace-nowrap">
                        (우클릭하여 설정)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateConfig(0, { isSingleLineReason: !isSingleLineReason })}
                      className="flex items-center gap-1 px-2 py-1 bg-brand-surface-highest rounded text-brand-on-surface-variant hover:text-brand-on-surface text-sm"
                      title={isSingleLineReason ? "다중 줄 보기" : "1줄 보기"}
                    >
                      {isSingleLineReason ? <AlignJustify size={14} /> : <Type size={14} />}
                      {isSingleLineReason ? "다중 줄" : "1줄 보기"}
                    </button>
                    <button
                      onClick={() => updateConfig(0, { showReasons: !showReasons })}
                      className="flex items-center gap-1 px-2 py-1 bg-brand-surface-highest rounded text-brand-on-surface-variant hover:text-brand-on-surface text-sm"
                    >
                      {showReasons ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showReasons ? "사유 숨기기" : "사유 보기"}
                    </button>
                  </div>
                </div>

                {data.length > 0 ? (
                  <div className="flex-1 overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col gap-4 p-2">
                    <div className="flex flex-row gap-4 flex-wrap overflow-visible items-stretch h-full">
                      {chunkedData.map((chunk, chunkIndex) => (
                        <div key={chunkIndex} className="flex-1 min-w-[300px] flex flex-col gap-4 h-full">
                          <div className="w-full h-full">
                            <table className={`w-full text-left bg-brand-surface rounded overflow-hidden ${mainConfig.fitRowsToWidget ? 'h-full' : ''} ${mainConfig.isOneLine !== false ? 'whitespace-nowrap [&_td]:max-w-[150px] [&_td]:truncate' : ''}`}>
                            <thead 
                              className="bg-brand-surface-highest sticky top-0 z-10 shadow-sm h-8"
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setHeaderMenu({ x: e.clientX, y: e.clientY });
                              }}
                            >
                              <tr>
                                <th 
                                  className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                  style={{ width: mainConfig.colWidths?.item || '20%' }}
                                >
                                  항목
                                  <div 
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const th = e.currentTarget.parentElement;
                                      setResizingCol({ id: 'item', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: 0 });
                                    }} 
                                  />
                                </th>
                                {mainConfig.aggMode === 'wbs' && (
                                  <th 
                                    className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                    style={{ width: mainConfig.colWidths?.wbsDesc || '20%' }}
                                  >
                                    내용
                                    <div 
                                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const th = e.currentTarget.parentElement;
                                        setResizingCol({ id: 'wbsDesc', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: 0 });
                                      }} 
                                    />
                                  </th>
                                )}
                                <th 
                                  className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                  style={{ width: mainConfig.colWidths?.sum || '25%' }}
                                >
                                  합계
                                  <div 
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const th = e.currentTarget.parentElement;
                                      setResizingCol({ id: 'sum', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: 0 });
                                    }} 
                                  />
                                </th>
                                <th 
                                  className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                  style={{ width: mainConfig.colWidths?.percentage || '15%' }}
                                >
                                  비율
                                  <div 
                                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      const th = e.currentTarget.parentElement;
                                      setResizingCol({ id: 'percentage', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: 0 });
                                    }} 
                                  />
                                </th>
                                {showReasons && (
                                  <th 
                                    className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold relative group select-none"
                                    style={{ width: mainConfig.colWidths?.reason || '40%' }}
                                  >
                                    증액분 사유
                                    <div 
                                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        const th = e.currentTarget.parentElement;
                                        setResizingCol({ id: 'reason', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: 0 });
                                      }} 
                                    />
                                  </th>
                                )}
                                {mainConfig.comparisonPanels?.map((panelIdx: number) => (
                                  <th 
                                    key={panelIdx} 
                                    className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none min-w-[100px]"
                                  >
                                    차이 ({configs[panelIdx]?.title || `${panelIdx + 1}세부`})
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {chunk.map((row: any, i: number) => {
                                const globalIndex = chunkIndex * 8 + i;
                                return (
                                  <tr
                                    key={row.name}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, globalIndex)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, globalIndex)}
                                    className={`border-b border-brand-outline-variant/40 hover:bg-brand-surface transition-colors bg-brand-surface ${draggedIdx === globalIndex ? 'opacity-50 bg-brand-surface-highest' : ''}`}
                                  >
                                    <td className="px-2 py-1 text-left font-medium text-brand-on-surface h-8 cursor-grab active:cursor-grabbing align-middle">
                                      <div className="flex items-center justify-start gap-1">
                                        <GripVertical size={14} className="text-brand-on-surface-variant/40 flex-shrink-0" />
                                        <span className="truncate">{row.name}</span>
                                      </div>
                                    </td>
                                    {mainConfig.aggMode === 'wbs' && (
                                      <td className="px-2 py-1 text-center font-medium text-brand-on-surface-variant align-middle whitespace-nowrap">
                                        {row.wbsDesc}
                                      </td>
                                    )}
                                    <td className="px-2 py-1 text-right text-brand-primary/90 font-medium align-middle">
                                      {formatNumber(row.value)}
                                    </td>
                                    <td className="px-2 py-1 text-right text-brand-on-surface-variant align-middle">
                                      {row.percentage.toFixed(1)}%
                                    </td>
                                    {showReasons && (
                                      <td 
                                        className="px-2 py-1 align-middle cursor-pointer hover:bg-brand-surface-high transition-colors text-sm text-brand-on-surface-variant truncate max-w-[150px]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReasonPopup({ x: e.clientX, y: e.clientY, text: mainConfig.reasons?.[row.name] || "", rowName: row.name });
                                        }}
                                        onContextMenu={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setReasonPopup({ x: e.clientX, y: e.clientY, text: mainConfig.reasons?.[row.name] || "", rowName: row.name });
                                        }}
                                        title={mainConfig.reasons?.[row.name] || "클릭 또는 우클릭하여 사유 편집"}
                                      >
                                        {mainConfig.reasons?.[row.name] || <span className="opacity-40 italic">사유 없음 (클릭하여 편집)</span>}
                                      </td>
                                    )}
                                    {mainConfig.comparisonPanels?.map((panelIdx: number) => {
                                      const panelData = panelDataMap.get(panelIdx)?.result || [];
                                      const panelItem = panelData.find((d: any) => d.name === row.name);
                                      const diff = (panelItem?.value || 0) - (row.value || 0); // 2세부 - 1세부
                                      return (
                                        <td key={panelIdx} className="px-2 py-1 text-right align-middle text-brand-primary/90 font-medium">
                                          {formatNumber(diff)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                            {chunkIndex === chunkedData.length - 1 && (
                              <tfoot className="bg-brand-surface-lowest sticky bottom-0 font-bold border-t border-brand-outline-variant shadow-sm h-8">
                                <tr>
                                  <td className="px-2 py-1 text-center bg-brand-surface-lowest">총계</td>
                                  {mainConfig.aggMode === 'wbs' && <td className="px-2 py-1 bg-brand-surface-lowest"></td>}
                                  <td className="px-2 py-1 text-right text-brand-primary bg-brand-surface-lowest">
                                    {formatNumber(totalSum)}
                                  </td>
                                  <td className="px-2 py-1 text-right text-brand-primary bg-brand-surface-lowest">
                                    100%
                                  </td>
                                  {showReasons && <td className="px-2 py-1 bg-brand-surface-lowest"></td>}
                                  {mainConfig.comparisonPanels?.map((panelIdx: number) => {
                                    const panelTotal = panelDataMap.get(panelIdx)?.totalSum || 0;
                                    const diff = panelTotal - totalSum;
                                    return (
                                      <td key={panelIdx} className="px-2 py-1 text-right text-brand-primary bg-brand-surface-lowest">
                                        {formatNumber(diff)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tfoot>
                            )}
                          </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-brand-on-surface-variant border-2 border-dashed border-brand-outline-variant/60 rounded-lg">
                    데이터가 없거나 대시보드 설정이 필요합니다. (우클릭하여 설정)
                  </div>
                )}
              </div>
            );
          } else {
            // Chart Panels
            const chartType = pConfig.chartType || (index === 1 ? 'pie' : index === 2 ? 'horizontalBar' : 'line');
            return (
              <div
                key={index}
                className="flex-shrink-0 border border-brand-outline-variant bg-brand-bg rounded-xl p-3 flex flex-col shadow-sm relative min-h-[300px] text-sm"
                style={{ resize: 'both', overflow: 'auto', minWidth: '400px', minHeight: '300px', width: pConfig.width || (layoutCount === 2 ? '40%' : '30%'), height: pConfig.height || 'auto' }}
                onContextMenu={(e) => handleContextMenu(e, index)}
                onMouseUp={(e) => {
                  const newWidth = e.currentTarget.style.width;
                  const newHeight = e.currentTarget.style.height;
                  if (newWidth && newWidth !== pConfig.width || newHeight && newHeight !== pConfig.height) {
                    updateConfig(index, { width: newWidth, height: newHeight });
                  }
                }}
              >
                <div 
                  className="flex items-center mb-3 cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={handleDragStart}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  <div className="text-brand-on-surface-variant flex items-center justify-center mr-1">
                    <GripVertical size={16} />
                  </div>
                  <input 
                    value={pConfig.title ?? `CE 시각화 차트 ${index}`} 
                    onChange={(e) => updateConfig(index, { title: e.target.value })}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="font-bold text-base text-brand-on-surface bg-transparent outline-none border-none hover:bg-brand-surface-high rounded px-1 -ml-1 w-full"
                  />
                  {(!pConfig.criteriaColId && (!mainConfig.criteriaColId)) && (
                    <span className="text-brand-on-surface-variant font-normal ml-2 whitespace-nowrap text-sm">
                      (우클릭 설정)
                    </span>
                  )}
                </div>

                {data.length > 0 ? (
                  <div className="flex-1 w-full h-full text-sm bg-brand-surface border border-brand-outline-variant/60 rounded-lg p-2">
                    {(() => {
                      const unit = pConfig.chartUnit || 1;
                      const scaledData = data.map((d: any) => ({ ...d, value: d.value / unit }));
                      const scaledTotalSum = totalSum / unit;
                      const comparisonPanels = pConfig.comparisonPanels || [];
                      const combinedData = scaledData.map((d: any) => {
                        const newD = { ...d };
                        comparisonPanels.forEach((pIdx: number) => {
                           const panelData = panelDataMap.get(pIdx)?.result || [];
                           const panelItem = panelData.find((pd: any) => pd.name === d.name);
                           newD['panel_' + pIdx] = (panelItem?.value || 0) / unit;
                        });
                        return newD;
                      });
                      
                      if (chartType === "comparisonTable") {
                        const isTableSplit = pConfig.isTableSplit === true;
                        const tableSplitRows = pConfig.tableSplitRows || 8;
                        const chunks = [];
                        if (scaledData.length > 0) {
                          if (isTableSplit) {
                            chunks.push(scaledData.slice(0, tableSplitRows));
                            if (tableSplitRows < scaledData.length) {
                              chunks.push(scaledData.slice(tableSplitRows));
                            }
                          } else {
                            chunks.push(scaledData);
                          }
                        } else {
                          chunks.push([]);
                        }

                        return (
                          <div className="w-full h-full overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col gap-4 p-2">
                            <div className="flex flex-row gap-4 flex-wrap overflow-visible items-stretch h-full">
                              {chunks.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="flex-1 min-w-[300px] flex flex-col gap-4 h-full">
                                  <table className={`w-full text-left bg-brand-surface border border-brand-outline-variant/40 rounded overflow-hidden ${pConfig.fitRowsToWidget ? 'h-full' : ''} ${pConfig.isOneLine !== false ? 'whitespace-nowrap [&_td]:max-w-[150px] [&_td]:truncate' : ''}`}>
                                    <thead className="bg-brand-surface-highest sticky top-0 z-10 shadow-sm h-8">
                                      <tr>
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                          style={{ width: pConfig.colWidths?.item || '40%' }}
                                        >
                                          항목
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'item', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                        {pConfig.aggMode === 'wbs' && (
                                          <th 
                                            className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                            style={{ width: pConfig.colWidths?.wbsDesc || '30%' }}
                                          >
                                            내용
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                const th = e.currentTarget.parentElement;
                                                setResizingCol({ id: 'wbsDesc', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                              }} 
                                            />
                                          </th>
                                        )}
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                          style={{ width: pConfig.colWidths?.sum || (pConfig.aggMode === 'wbs' ? '20%' : '40%') }}
                                        >
                                          합계 (수동 입력)
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'sum', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                          style={{ width: pConfig.colWidths?.percentage || (pConfig.aggMode === 'wbs' ? '10%' : '20%') }}
                                        >
                                          비율
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'percentage', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {chunk.map((row: any, i: number) => (
                                        <tr key={row.name} className="border-b border-brand-outline-variant/40 hover:bg-brand-surface transition-colors bg-brand-surface">
                                          <td className="px-2 py-1 text-left font-medium text-brand-on-surface h-8 align-middle">
                                            <div className="flex items-center justify-start gap-1">
                                              <span className="truncate">{row.name}</span>
                                            </div>
                                          </td>
                                          {pConfig.aggMode === 'wbs' && (
                                            <td className="px-2 py-1 text-center font-medium text-brand-on-surface-variant align-middle whitespace-nowrap">
                                              {row.wbsDesc}
                                            </td>
                                          )}
                                          <td className="px-2 py-1 text-right font-medium align-middle">
                                            <input
                                              type="text"
                                              className="w-full text-right bg-transparent border-none outline-none focus:bg-brand-surface-highest rounded px-1 text-brand-primary"
                                              value={pConfig.manualData?.[row.name] !== undefined ? formatNumber(pConfig.manualData[row.name]) : ""}
                                              onChange={(e) => {
                                                const rawValue = e.target.value.replace(/,/g, '');
                                                const numValue = Number(rawValue);
                                                if (!isNaN(numValue)) {
                                                  const newManualData = { ...(pConfig.manualData || {}), [row.name]: numValue };
                                                  updateConfig(index, { manualData: newManualData });
                                                }
                                              }}
                                              placeholder="0"
                                            />
                                          </td>
                                          <td className="px-2 py-1 text-right text-brand-on-surface-variant align-middle">{row.percentage.toFixed(1)}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    {chunkIndex === chunks.length - 1 && (
                                      <tfoot className="bg-brand-surface-lowest sticky bottom-0 font-bold border-t border-brand-outline-variant shadow-sm h-8">
                                        <tr>
                                          <td className="px-2 py-1 text-left">
                                            <div className="flex items-center justify-start gap-1">총계</div>
                                          </td>
                                          {pConfig.aggMode === 'wbs' && <td className="px-2 py-1"></td>}
                                          <td className="px-2 py-1 text-right text-brand-primary align-middle">{formatNumber(scaledTotalSum)}</td>
                                          <td className="px-2 py-1 text-right text-brand-primary align-middle">100%</td>
                                        </tr>
                                      </tfoot>
                                    )}
                                  </table>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (chartType === "domesticForeignTable") {
                         return (
                            <div className="w-full h-full overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col gap-4 p-2">
                              <table className={`w-full text-left bg-brand-surface border border-brand-outline-variant/40 rounded overflow-hidden ${pConfig.fitRowsToWidget ? 'h-full' : ''} ${pConfig.isOneLine !== false ? 'whitespace-nowrap [&_td]:max-w-[150px] [&_td]:truncate' : ''}`}>
                                 <thead className="bg-brand-surface-highest">
                                    <tr>
                                      <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-center text-brand-on-surface-variant font-semibold h-8">구분</th>
                                      <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-right text-brand-on-surface-variant font-semibold h-8">금액(USD)</th>
                                      <th className="px-2 py-1 border-b border-brand-outline-variant/40 text-right text-brand-on-surface-variant font-semibold h-8">비율(%)</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    <tr className="border-b border-brand-outline-variant/40 hover:bg-brand-surface-high h-[calc(50%-16px)]">
                                      <td className="px-2 py-1 text-center text-brand-on-surface font-medium">내자</td>
                                      <td className="px-2 py-1 text-right text-brand-primary/90 font-medium align-middle">{formatNumber(domesticSum / unit)}</td>
                                      <td className="px-2 py-1 text-right text-brand-on-surface-variant align-middle">{totalUsdSum > 0 ? ((domesticSum / totalUsdSum) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                    <tr className="border-b border-brand-outline-variant/40 hover:bg-brand-surface-high h-[calc(50%-16px)]">
                                      <td className="px-2 py-1 text-center text-brand-on-surface font-medium">외자</td>
                                      <td className="px-2 py-1 text-right text-brand-primary/90 font-medium align-middle">{formatNumber(foreignSum / unit)}</td>
                                      <td className="px-2 py-1 text-right text-brand-on-surface-variant align-middle">{totalUsdSum > 0 ? ((foreignSum / totalUsdSum) * 100).toFixed(1) : 0}%</td>
                                    </tr>
                                 </tbody>
                                 <tfoot className="bg-brand-surface-lowest font-bold border-t border-brand-outline-variant shadow-sm h-8">
                                    <tr>
                                      <td className="px-2 py-1 text-center">합계</td>
                                      <td className="px-2 py-1 text-right text-brand-primary align-middle">{formatNumber(totalUsdSum / unit)}</td>
                                      <td className="px-2 py-1 text-right text-brand-primary align-middle">100%</td>
                                    </tr>
                                 </tfoot>
                              </table>
                            </div>
                         );
                      }

                      if (chartType === "table") {
                        const isTableSplit = pConfig.isTableSplit === true;
                        const tableSplitRows = pConfig.tableSplitRows || 8;
                        const chunks = [];
                        if (scaledData.length > 0) {
                          if (isTableSplit) {
                            chunks.push(scaledData.slice(0, tableSplitRows));
                            if (tableSplitRows < scaledData.length) {
                              chunks.push(scaledData.slice(tableSplitRows));
                            }
                          } else {
                            chunks.push(scaledData);
                          }
                        } else {
                          chunks.push([]);
                        }

                        return (
                          <div className="w-full h-full overflow-auto bg-brand-surface-high border border-brand-outline-variant rounded-lg flex flex-col gap-4 p-2">
                            <div className="flex flex-row gap-4 flex-wrap overflow-visible items-stretch h-full">
                              {chunks.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="flex-1 min-w-[300px] flex flex-col gap-4 h-full">
                                  <table className={`w-full text-left bg-brand-surface border border-brand-outline-variant/40 rounded overflow-hidden ${pConfig.fitRowsToWidget ? 'h-full' : ''} ${pConfig.isOneLine !== false ? 'whitespace-nowrap [&_td]:max-w-[150px] [&_td]:truncate' : ''}`}>
                                    <thead className="bg-brand-surface-highest sticky top-0 z-10 shadow-sm h-8">
                                      <tr>
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                          style={{ width: pConfig.colWidths?.item || '40%' }}
                                        >
                                          항목
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'item', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                        {pConfig.aggMode === 'wbs' && (
                                          <th 
                                            className="px-2 py-2 border-b border-brand-outline-variant text-center text-brand-on-surface-variant font-semibold relative group select-none"
                                            style={{ width: pConfig.colWidths?.wbsDesc || '30%' }}
                                          >
                                            내용
                                            <div 
                                              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                const th = e.currentTarget.parentElement;
                                                setResizingCol({ id: 'wbsDesc', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                              }} 
                                            />
                                          </th>
                                        )}
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                          style={{ width: pConfig.colWidths?.sum || (pConfig.aggMode === 'wbs' ? '20%' : '40%') }}
                                        >
                                          합계
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'sum', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                        <th 
                                          className="px-2 py-2 border-b border-brand-outline-variant text-brand-on-surface-variant font-semibold text-right relative group select-none"
                                          style={{ width: pConfig.colWidths?.percentage || (pConfig.aggMode === 'wbs' ? '10%' : '20%') }}
                                        >
                                          비율
                                          <div 
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-brand-primary" 
                                            onMouseDown={(e) => {
                                              e.preventDefault();
                                              const th = e.currentTarget.parentElement;
                                              setResizingCol({ id: 'percentage', startX: e.clientX, startWidth: th?.getBoundingClientRect().width || 0, panelIndex: index });
                                            }} 
                                          />
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {chunk.map((row: any, i: number) => (
                                        <tr key={row.name} className="border-b border-brand-outline-variant/40 hover:bg-brand-surface transition-colors bg-brand-surface">
                                          <td className="px-2 py-1 text-left font-medium text-brand-on-surface h-8 align-middle">
                                            <div className="flex items-center justify-start gap-1">
                                              <span className="truncate">{row.name}</span>
                                            </div>
                                          </td>
                                          {pConfig.aggMode === 'wbs' && (
                                            <td className="px-2 py-1 text-center font-medium text-brand-on-surface-variant align-middle whitespace-nowrap">
                                              {row.wbsDesc}
                                            </td>
                                          )}
                                          <td className="px-2 py-1 text-right text-brand-primary/90 font-medium align-middle">{formatNumber(row.value)}</td>
                                          <td className="px-2 py-1 text-right text-brand-on-surface-variant align-middle">{row.percentage.toFixed(1)}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    {chunkIndex === chunks.length - 1 && (
                                      <tfoot className="bg-brand-surface-lowest sticky bottom-0 font-bold border-t border-brand-outline-variant shadow-sm h-8">
                                        <tr>
                                          <td className="px-2 py-1 text-left">
                                            <div className="flex items-center justify-start gap-1">총계</div>
                                          </td>
                                          {pConfig.aggMode === 'wbs' && <td className="px-2 py-1"></td>}
                                          <td className="px-2 py-1 text-right text-brand-primary align-middle">{formatNumber(scaledTotalSum)}</td>
                                          <td className="px-2 py-1 text-right text-brand-primary align-middle">100%</td>
                                        </tr>
                                      </tfoot>
                                    )}
                                  </table>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === "bar" ? (
                            <BarChart
                              data={combinedData}
                              margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                            >
                          <defs>
                            <linearGradient id={`colorGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            stroke="#334155"
                          >
                            {pConfig.xAxisLabel && <Label value={pConfig.xAxisLabel} offset={-5} position="insideBottom" fill="#94a3b8" fontSize={12} />}
                          </XAxis>
                          <YAxis
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            tickFormatter={(val) => formatNumber(val)}
                            stroke="#334155"
                          >
                            {pConfig.yAxisLabel && <Label value={pConfig.yAxisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#94a3b8" fontSize={12} />}
                          </YAxis>
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                            contentStyle={{
                              fontSize: "13px",
                              borderRadius: "8px",
                              backgroundColor: "#0f172a",
                              borderColor: "#1e293b",
                              color: "#f8fafc",
                            }}
                          />
                          <Bar dataKey="value" name={pConfig.title || "현재 대시보드"} radius={[4, 4, 0, 0]} fill={`url(#colorGradient-${index})`} />
                          {comparisonPanels.map((pIdx: number, i: number) => (
                             <Bar key={pIdx} dataKey={`panel_${pIdx}`} name={configs[pIdx]?.title || (pIdx + 1) + "세부 대시보드"} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      ) : chartType === "horizontalBar" ? (
                        <BarChart
                          data={combinedData}
                          layout="vertical"
                          margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id={`colorGradientH-${index}`} x1="1" y1="0" x2="0" y2="0">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.9} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            tickFormatter={(val) => formatNumber(val)}
                            stroke="#334155"
                          >
                            {pConfig.xAxisLabel && <Label value={pConfig.xAxisLabel} offset={-5} position="insideBottom" fill="#94a3b8" fontSize={12} />}
                          </XAxis>
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            stroke="#334155"
                          >
                            {pConfig.yAxisLabel && <Label value={pConfig.yAxisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#94a3b8" fontSize={12} />}
                          </YAxis>
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                            contentStyle={{
                              fontSize: "13px",
                              borderRadius: "8px",
                              backgroundColor: "#0f172a",
                              borderColor: "#1e293b",
                              color: "#f8fafc",
                            }}
                          />
                          <Bar dataKey="value" name={pConfig.title || "현재 대시보드"} radius={[0, 4, 4, 0]} fill={`url(#colorGradientH-${index})`} />
                          {comparisonPanels.map((pIdx: number, i: number) => (
                             <Bar key={pIdx} dataKey={`panel_${pIdx}`} name={configs[pIdx]?.title || (pIdx + 1) + "세부 대시보드"} fill={COLORS[i % COLORS.length]} radius={[0, 4, 4, 0]} />
                          ))}
                        </BarChart>
                      ) : chartType === "line" ? (
                        <LineChart
                          data={combinedData}
                          margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            stroke="#334155"
                          >
                            {pConfig.xAxisLabel && <Label value={pConfig.xAxisLabel} offset={-5} position="insideBottom" fill="#94a3b8" fontSize={12} />}
                          </XAxis>
                          <YAxis
                            tick={{ fontSize: 13, fill: "#94a3b8" }}
                            tickFormatter={(val) => formatNumber(val)}
                            stroke="#334155"
                          >
                            {pConfig.yAxisLabel && <Label value={pConfig.yAxisLabel} angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} fill="#94a3b8" fontSize={12} />}
                          </YAxis>
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                            contentStyle={{
                              fontSize: "13px",
                              borderRadius: "8px",
                              backgroundColor: "#0f172a",
                              borderColor: "#1e293b",
                              color: "#f8fafc",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#818cf8"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#4f46e5" }}
                            activeDot={{ r: 6, fill: "#818cf8" }}
                          />
                        </LineChart>
                      ) : (
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <defs>
                            <linearGradient id={`pieGrad0-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.9}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0.8}/></linearGradient>
                            <linearGradient id={`pieGrad1-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0.8}/></linearGradient>
                            <linearGradient id={`pieGrad2-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.9}/><stop offset="95%" stopColor="#059669" stopOpacity={0.8}/></linearGradient>
                            <linearGradient id={`pieGrad3-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.9}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8}/></linearGradient>
                            <linearGradient id={`pieGrad4-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.9}/><stop offset="95%" stopColor="#db2777" stopOpacity={0.8}/></linearGradient>
                            <linearGradient id={`pieGrad5-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb923c" stopOpacity={0.9}/><stop offset="95%" stopColor="#ea580c" stopOpacity={0.8}/></linearGradient>
                          </defs>
                          <Tooltip
                            formatter={(value: number) => formatNumber(value)}
                            contentStyle={{
                              fontSize: "13px",
                              borderRadius: "8px",
                              backgroundColor: "#0f172a",
                              borderColor: "#1e293b",
                              color: "#f8fafc",
                            }}
                          />
                          <Pie
                            data={scaledData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                            label={renderCustomizedLabel}
                          >
                            {scaledData.map((entry: any, i: number) => (
                              <Cell key={`cell-${i}`} fill={`url(#pieGrad${i % 6}-${index})`} />
                            ))}
                          </Pie>
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-brand-on-surface-variant text-sm border-2 border-dashed border-brand-outline-variant/60 rounded-lg">
                    차트를 표시할 데이터가 없습니다.
                  </div>
                )}
              </div>
            );
          }
          });
        })()}
      </div>

      {/* Reason Popup */}
      {reasonPopup &&
        createPortal(
          <div
            className="fixed z-[70] bg-brand-surface-highest border border-brand-outline-variant shadow-xl rounded-lg p-6 animate-in fade-in zoom-in duration-150 text-brand-on-surface w-[600px] max-w-[90vw]"
            style={{ top: Math.min(reasonPopup.y, window.innerHeight - 400), left: Math.min(reasonPopup.x, window.innerWidth - 620) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-bold mb-4 pb-2 border-b border-brand-outline-variant text-lg">증액분 사유 ({reasonPopup.rowName})</div>
            <textarea
              value={reasonPopup.text}
              onChange={(e) => {
                const newText = e.target.value;
                setReasonPopup(prev => prev ? { ...prev, text: newText } : null);
                const newReasons = { ...(mainConfig.reasons || {}), [reasonPopup.rowName]: newText };
                updateConfig(0, { reasons: newReasons });
              }}
              className="w-full h-[225px] bg-brand-surface border border-brand-outline-variant rounded p-3 outline-none focus:border-brand-primary resize-none text-base text-brand-on-surface"
              placeholder="증액분 사유를 입력하세요..."
            />
          </div>,
          document.body
        )}

      {/* Header Menu */}
      {headerMenu &&
        createPortal(
          <div
            className="fixed z-[70] w-64 bg-brand-surface-highest border border-brand-outline-variant shadow-xl rounded-xl py-2 flex flex-col text-sm animate-in fade-in zoom-in duration-150 text-brand-on-surface max-h-[80vh] overflow-y-auto"
            style={{ top: Math.min(headerMenu.y, window.innerHeight - 200), left: Math.min(headerMenu.x, window.innerWidth - 260) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-brand-outline-variant/50 font-bold text-brand-on-surface-variant">
              테이블 헤더 옵션
            </div>
            <div className="p-4 space-y-4 border-b border-brand-outline-variant/50">
              <div>
                <label className="block text-sm font-medium text-brand-on-surface-variant mb-1">
                  비교 열 추가 (세부 대시보드 선택)
                </label>
                <select 
                  className="w-full p-2 bg-brand-surface border border-brand-outline-variant rounded outline-none text-sm"
                  onChange={(e) => {
                    const pIdx = Number(e.target.value);
                    if (pIdx > 0) {
                      const cols = mainConfig.comparisonPanels || [];
                      if (!cols.includes(pIdx)) updateConfig(0, { comparisonPanels: [...cols, pIdx] });
                    }
                    setHeaderMenu(null);
                  }}
                  value=""
                >
                  <option value="">선택하세요</option>
                  {Array.from({ length: layoutCount - 1 }).map((_, i) => (
                    <option key={i+1} value={i+1}>{configs[i+1]?.title || `${i+2}세부 대시보드`}와 비교 (차이 계산)</option>
                  ))}
                </select>
              </div>
              {(mainConfig.comparisonPanels?.length || 0) > 0 && (
                <button 
                  onClick={() => { updateConfig(0, { comparisonPanels: [] }); setHeaderMenu(null); }}
                  className="w-full py-1.5 px-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-medium text-center"
                >
                  비교 열 모두 제거
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Context Menu */}
      {contextMenu &&
        createPortal(
          <div
            className="fixed z-[60] w-64 bg-brand-surface-highest border border-brand-outline-variant shadow-xl rounded-xl py-2 flex flex-col text-sm animate-in fade-in zoom-in duration-150 text-brand-on-surface max-h-[80vh] overflow-y-auto"
            style={{ top: Math.min(contextMenu.y, window.innerHeight - 400), left: Math.min(contextMenu.x, window.innerWidth - 260) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-2 border-b border-brand-outline-variant/50 font-bold text-brand-on-surface-variant flex justify-between">
              <span>{contextMenu.index === -2 ? '대시보드 관리' : contextMenu.index === -1 ? '상위 대시보드 설정' : contextMenu.index === 0 ? '테이블 설정' : '설정'}</span>
            </div>
            
            <div className="p-2 space-y-3 border-b border-brand-outline-variant/50">
              {contextMenu.index === -2 ? (
                <div className="space-y-3">
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-brand-surface-high text-brand-on-surface flex gap-2 items-center"
                    onClick={() => {
                      updateConfig(0, { layoutCount: layoutCount + 1 });
                      closeMenu();
                    }}
                  >
                    <Plus size={16} /> 대시보드 추가
                  </button>
                </div>
              ) : contextMenu.index === -1 ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">견적가 컬럼 (USD 기준)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={mainConfig.topUsdColId || ""}
                      onChange={(e) => updateConfig(0, { topUsdColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">직능 컬럼 (장비수량 기준)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={mainConfig.topEquipmentColId || ""}
                      onChange={(e) => updateConfig(0, { topEquipmentColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">적용 컬럼 (체크박스/조건)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={mainConfig.topFilterColId || ""}
                      onChange={(e) => updateConfig(0, { topFilterColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">화폐 컬럼 (내/외자 기준)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={mainConfig.topCurrencyColId || ""}
                      onChange={(e) => updateConfig(0, { topCurrencyColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              ) : contextMenu.index === 0 ? (
                <div className="space-y-3 border border-brand-outline-variant/50 p-2 rounded-lg bg-brand-surface">
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">집계 방식</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={configs[0]?.aggMode || "default"}
                      onChange={(e) => updateConfig(0, { aggMode: e.target.value })}
                    >
                      <option value="default">직능별 비용 분석</option>
                      <option value="wbs">WBS별 비용 분석</option>
                    </select>
                  </div>
                  
                  {configs[0]?.aggMode === 'wbs' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold mb-1 text-brand-on-surface-variant">WBS (기준/그룹화)</label>
                        <select
                          className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                          value={configs[0]?.wbsColId || ""}
                          onChange={(e) => updateConfig(0, { wbsColId: e.target.value })}
                        >
                          <option value="">선택 안함</option>
                          {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-brand-on-surface-variant">정렬 방식</label>
                        <select
                          className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                          value={configs[0]?.wbsSortOrder || "asc"}
                          onChange={(e) => updateConfig(0, { wbsSortOrder: e.target.value })}
                        >
                          <option value="asc">오름차순 (예: 0~99, 100~199)</option>
                          <option value="desc">내림차순 (예: 200~299, 100~199)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold mb-1 text-brand-on-surface-variant">직능 (기준/그룹화)</label>
                      <select
                        className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                        value={configs[0]?.criteriaColId || ""}
                        onChange={(e) => updateConfig(0, { criteriaColId: e.target.value })}
                      >
                        <option value="">선택 안함</option>
                        <option value="title">제목</option>
                        {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">금액(USD) (합계/숫자)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={configs[0]?.sumColId || ""}
                      onChange={(e) => updateConfig(0, { sumColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">적용대상 (선택사항)</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                      value={configs[0]?.filterColId || ""}
                      onChange={(e) => updateConfig(0, { filterColId: e.target.value })}
                    >
                      <option value="">선택 안함</option>
                      {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-brand-on-surface-variant">축소 보기 (1줄 보기)</label>
                      <input
                        type="checkbox"
                        checked={configs[0]?.isOneLine !== false}
                        onChange={(e) => updateConfig(0, { isOneLine: e.target.checked })}
                        className="accent-brand-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-brand-on-surface-variant">테이블 2분할 (Split)</label>
                      <input
                        type="checkbox"
                        checked={configs[0]?.isTableSplit === true}
                        onChange={(e) => updateConfig(0, { isTableSplit: e.target.checked })}
                        className="accent-brand-primary"
                      />
                    </div>
                    {configs[0]?.isTableSplit === true && (
                      <div>
                        <label className="block font-semibold mb-1 text-brand-on-surface-variant">2분할 기준 행 (Row)</label>
                        <input
                          type="number"
                          className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                          value={configs[0]?.tableSplitRows || 8}
                          onChange={(e) => updateConfig(0, { tableSplitRows: Number(e.target.value) })}
                          min={1}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-brand-on-surface-variant">현재 위젯으로 행 높이 맞추기</label>
                      <input
                        type="checkbox"
                        checked={configs[0]?.fitRowsToWidget === true}
                        onChange={(e) => updateConfig(0, { fitRowsToWidget: e.target.checked })}
                        className="accent-brand-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const isTableCategory = ['table', 'comparisonTable', 'domesticForeignTable'].includes(configs[contextMenu.index]?.chartType || '');
                    return (
                      <>
                        <div className="mb-2 space-y-3">
                          <div>
                            <label className="block font-semibold mb-1 text-brand-on-surface-variant">대분류</label>
                            <select
                              className="w-full p-1.5 bg-brand-surface border border-brand-outline-variant rounded outline-none text-sm font-bold text-brand-primary"
                              value={isTableCategory ? 'table' : 'graph'}
                              onChange={(e) => {
                                updateConfig(contextMenu.index, { chartType: e.target.value === 'table' ? 'table' : 'bar' });
                              }}
                            >
                              <option value="table">테이블</option>
                              <option value="graph">그래프</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block font-semibold mb-1 text-brand-on-surface-variant">데이터 연동 기준 테이블</label>
                            <select
                              className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                              value={configs[contextMenu.index]?.isLinked === false ? "independent" : (configs[contextMenu.index]?.linkedTableIndex ?? 0).toString()}
                              onChange={(e) => {
                                if (e.target.value === "independent") {
                                  updateConfig(contextMenu.index, { isLinked: false });
                                } else {
                                  updateConfig(contextMenu.index, { isLinked: true, linkedTableIndex: Number(e.target.value) });
                                }
                              }}
                            >
                              <option value="independent">독립 설정 (직접 설정)</option>
                              {[...Array(layoutCount)].map((_, idx) => {
                                if (idx === contextMenu.index) return null;
                                const title = configs[idx]?.title || `패널 ${idx + 1}`;
                                return (
                                  <option key={idx} value={idx.toString()}>
                                    {title} 데이터 연동
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>

                        {isTableCategory && (
                          <div className="space-y-3 border border-brand-outline-variant/50 p-2 rounded-lg bg-brand-surface mb-3">
                            <div>
                              <label className="block font-semibold mb-1 text-brand-on-surface-variant">테이블 유형</label>
                              <select
                                className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                value={configs[contextMenu.index]?.chartType || 'table'}
                                onChange={(e) => updateConfig(contextMenu.index, { chartType: e.target.value })}
                              >
                                <option value="table">집계 테이블</option>
                                <option value="comparisonTable">비교 테이블 (수동 입력)</option>
                                <option value="domesticForeignTable">내자/외자 테이블</option>
                              </select>
                            </div>
                            
                            {configs[contextMenu.index]?.chartType === 'table' && (
                              <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3 mt-2">
                                <div>
                                  <label className="block font-semibold mb-1 text-brand-on-surface-variant">집계 방식</label>
                                  <select
                                    className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                    value={configs[contextMenu.index]?.aggMode || "default"}
                                    onChange={(e) => updateConfig(contextMenu.index, { aggMode: e.target.value })}
                                  >
                                    <option value="default">직능별 비용 분석</option>
                                    <option value="wbs">WBS별 비용 분석</option>
                                  </select>
                                </div>
                                
                                {configs[contextMenu.index]?.aggMode === 'wbs' ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block font-semibold mb-1 text-brand-on-surface-variant">WBS (기준/그룹화)</label>
                                      <select
                                        className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                        value={configs[contextMenu.index]?.wbsColId || ""}
                                        onChange={(e) => updateConfig(contextMenu.index, { wbsColId: e.target.value })}
                                      >
                                        <option value="">선택 안함</option>
                                        {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block font-semibold mb-1 text-brand-on-surface-variant">정렬 방식</label>
                                      <select
                                        className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                        value={configs[contextMenu.index]?.wbsSortOrder || "asc"}
                                        onChange={(e) => updateConfig(contextMenu.index, { wbsSortOrder: e.target.value })}
                                      >
                                        <option value="asc">오름차순 (예: 0~99, 100~199)</option>
                                        <option value="desc">내림차순 (예: 200~299, 100~199)</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">직능 (기준/그룹화)</label>
                                    <select
                                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                      value={configs[contextMenu.index]?.criteriaColId || ""}
                                      onChange={(e) => updateConfig(contextMenu.index, { criteriaColId: e.target.value })}
                                    >
                                      <option value="">선택 안함</option>
                                      <option value="title">제목</option>
                                      {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block font-semibold mb-1 text-brand-on-surface-variant">금액(USD) (합계/숫자)</label>
                                  <select
                                    className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                    value={configs[contextMenu.index]?.sumColId || ""}
                                    onChange={(e) => updateConfig(contextMenu.index, { sumColId: e.target.value })}
                                  >
                                    <option value="">선택 안함</option>
                                    {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1 text-brand-on-surface-variant">적용대상 (선택사항)</label>
                                  <select
                                    className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                    value={configs[contextMenu.index]?.filterColId || ""}
                                    onChange={(e) => updateConfig(contextMenu.index, { filterColId: e.target.value })}
                                  >
                                    <option value="">선택 안함</option>
                                    {columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                  </select>
                                </div>

                                <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3 mt-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block font-semibold text-brand-on-surface-variant">축소 보기 (1줄 보기)</label>
                                    <input
                                      type="checkbox"
                                      checked={configs[contextMenu.index]?.isOneLine !== false}
                                      onChange={(e) => updateConfig(contextMenu.index, { isOneLine: e.target.checked })}
                                      className="accent-brand-primary"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <label className="block font-semibold text-brand-on-surface-variant">테이블 2분할 (Split)</label>
                                    <input
                                      type="checkbox"
                                      checked={configs[contextMenu.index]?.isTableSplit === true}
                                      onChange={(e) => updateConfig(contextMenu.index, { isTableSplit: e.target.checked })}
                                      className="accent-brand-primary"
                                    />
                                  </div>
                                  {configs[contextMenu.index]?.isTableSplit === true && (
                                    <div>
                                      <label className="block font-semibold mb-1 text-brand-on-surface-variant">2분할 기준 행 (Row)</label>
                                      <input
                                        type="number"
                                        className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                        value={configs[contextMenu.index]?.tableSplitRows || 8}
                                        onChange={(e) => updateConfig(contextMenu.index, { tableSplitRows: Number(e.target.value) })}
                                        min={1}
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <label className="block font-semibold text-brand-on-surface-variant">현재 위젯으로 행 높이 맞추기</label>
                                    <input
                                      type="checkbox"
                                      checked={configs[contextMenu.index]?.fitRowsToWidget === true}
                                      onChange={(e) => updateConfig(contextMenu.index, { fitRowsToWidget: e.target.checked })}
                                      className="accent-brand-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        
                            {!isTableCategory && (
                              <div className="space-y-3 border border-brand-outline-variant/50 p-2 rounded-lg bg-brand-surface mb-3">
                                <div>
                                  <label className="block font-semibold mb-1 text-brand-on-surface-variant">차트 형태</label>
                                  <select
                                    className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                    value={configs[contextMenu.index]?.chartType || 'bar'}
                                    onChange={(e) => updateConfig(contextMenu.index, { chartType: e.target.value })}
                                  >
                                    <option value="bar">수직 막대 그래프</option>
                                    <option value="horizontalBar">수평 막대 그래프</option>
                                    <option value="line">선 그래프</option>
                                    <option value="pie">원형 그래프 (Pie)</option>
                                  </select>
                                </div>
                                <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3">
                                  <div>
                                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">X축 이름</label>
                                    <input
                                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                      value={configs[contextMenu.index]?.xAxisLabel || ""}
                                      onChange={(e) => updateConfig(contextMenu.index, { xAxisLabel: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">Y축 이름</label>
                                    <input
                                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                      value={configs[contextMenu.index]?.yAxisLabel || ""}
                                      onChange={(e) => updateConfig(contextMenu.index, { yAxisLabel: e.target.value })}
                                    />
                                  </div>
                                </div>
                                
                                {configs[contextMenu.index]?.chartType !== 'pie' && (
                                  <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-brand-on-surface-variant mb-1">
                                        비교 그래프 추가 (세부 대시보드 선택)
                                      </label>
                                      <select 
                                        className="w-full p-2 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                        onChange={(e) => {
                                          const pIdx = Number(e.target.value);
                                          if (pIdx > 0) {
                                            const cols = configs[contextMenu.index]?.comparisonPanels || [];
                                            if (!cols.includes(pIdx) && pIdx !== contextMenu.index) updateConfig(contextMenu.index, { comparisonPanels: [...cols, pIdx] });
                                          }
                                        }}
                                        value=""
                                      >
                                        <option value="">선택하세요</option>
                                        {Array.from({ length: layoutCount - 1 }).map((_, i) => {
                                          if (i+1 === contextMenu.index) return null;
                                          return (
                                            <option key={i+1} value={i+1}>{configs[i+1]?.title || (i+2)+"세부 대시보드"}</option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    {(configs[contextMenu.index]?.comparisonPanels?.length || 0) > 0 && (
                                      <div className="text-sm text-brand-on-surface-variant space-y-1">
                                        {configs[contextMenu.index].comparisonPanels.map((pIdx: number) => (
                                          <div key={pIdx} className="flex justify-between items-center bg-brand-surface-highest p-1 rounded">
                                            <span>{configs[pIdx]?.title || (pIdx+1)+"세부 대시보드"}</span>
                                            <button 
                                              className="text-red-500 hover:text-red-400 font-bold px-2"
                                              onClick={() => {
                                                const newPanels = configs[contextMenu.index].comparisonPanels.filter((p: number) => p !== pIdx);
                                                updateConfig(contextMenu.index, { comparisonPanels: newPanels });
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
            
            {contextMenu.index > 0 && (
              <>
                <div className="p-2 border-b border-brand-outline-variant/50 space-y-3">
                  <div>
                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">차트/테이블 금액 표시 단위</label>
                    <select
                      className="w-full p-1.5 bg-brand-surface border border-brand-outline-variant rounded outline-none text-sm"
                      value={configs[contextMenu.index]?.chartUnit || 1}
                      onChange={(e) => updateConfig(contextMenu.index, { chartUnit: Number(e.target.value) })}
                    >
                      <option value={1}>기본 (1)</option>
                      <option value={1000}>천 단위 (1,000)</option>
                      <option value={1000000}>백만 단위 (1,000,000)</option>
                      <option value={1000000000}>십억 단위 (1,000,000,000)</option>
                    </select>
                  </div>
                </div>
                <div className="p-1">
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-red-500/10 text-red-500 flex gap-2 items-center text-sm font-semibold"
                    onClick={() => {
                      if (confirm('이 대시보드를 삭제하시겠습니까?')) {
                        const newConfigs = [...configs];
                        newConfigs.splice(contextMenu.index, 1);
                        
                        const newPanelOrder = [...(mainConfig.panelOrder || Array.from({ length: layoutCount }, (_, i) => i))];
                        const idxToRemove = newPanelOrder.indexOf(contextMenu.index);
                        if (idxToRemove > -1) newPanelOrder.splice(idxToRemove, 1);
                        const shiftedPanelOrder = newPanelOrder.map(p => p > contextMenu.index ? p - 1 : p);
                        
                        if (newConfigs[0]) {
                          newConfigs[0] = { 
                            ...newConfigs[0], 
                            layoutCount: Math.max(1, layoutCount - 1),
                            panelOrder: shiftedPanelOrder
                          };
                        }
                        if (onConfigsChange) onConfigsChange(newConfigs);
                        closeMenu();
                      }
                    }}
                  >
                    <Trash2 size={14} /> 대시보드 삭제
                  </button>
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
