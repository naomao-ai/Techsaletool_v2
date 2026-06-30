import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Settings2, Clock } from "lucide-react";
import { Requirement, Column, TimelineConfig } from "../types";
import TimelineConfigModal from "./TimelineConfigModal";
import type { DashboardFilterCommand } from "./StatsCards";

// Background events data
const BACKGROUND_EVENTS = [
  {
    label: "코로나19",
    start: new Date(2020, 0, 1).getTime(),
    end: new Date(2023, 11, 31).getTime(),
    color: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  {
    label: "우크라이나 전쟁",
    start: new Date(2022, 1, 24).getTime(),
    end: Date.now(),
    color: "rgba(251, 191, 36, 0.15)",
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  {
    label: "이란 전쟁",
    start: new Date(2026, 0, 1).getTime(),
    end: Date.now(),
    color: "rgba(168, 85, 247, 0.15)",
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
];

interface TimelineDashboardProps {
  requirements: Requirement[];
  columns: Column[];
  config: TimelineConfig | undefined;
  onConfigChange: (config: TimelineConfig) => void;
  onDashboardFilter?: (filter: DashboardFilterCommand | null) => void;
}

export default function TimelineDashboard({
  requirements,
  columns,
  config,
  onConfigChange,
  onDashboardFilter,
}: TimelineDashboardProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingBaseTime, setEditingBaseTime] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // default config derivation if none provided
  const dateColumns = columns.filter((c) => c.type === "date");
  const textColumns = columns.filter(
    (c) => c.type === "text" || c.id === "title",
  );
  const checkboxColumns = columns.filter((c) => c.type === "checkbox");

  const defaultKlCol =
    dateColumns.find((c) => c.id === "kl_date")?.id || dateColumns[0]?.id || "";
  const defaultBaseCol =
    dateColumns.find((c) => c.id === "quote_date")?.id ||
    dateColumns[0]?.id ||
    "";
  const defaultTitleCol =
    textColumns.find((c) => c.id === "title")?.id || textColumns[0]?.id || "";
  const defaultCheckboxCol =
    checkboxColumns.find((c) => c.id === "show_in_timeline")?.id || 
    (checkboxColumns.length > 0 ? checkboxColumns[0].id : "");

  const currentConfig: TimelineConfig = {
    targetColId: config?.targetColId ?? defaultKlCol,
    baseColId: config?.baseColId ?? defaultBaseCol,
    titleColId: config?.titleColId ?? defaultTitleCol,
    checkboxColId: config?.checkboxColId ?? defaultCheckboxCol,
    manualStartDate: config?.manualStartDate ?? null,
    manualEndDate: config?.manualEndDate ?? null,
    showBaseDate: config?.showBaseDate ?? true,
    showBackgroundEvents: config?.showBackgroundEvents ?? false,
    diffUnit: config?.diffUnit ?? "month",
    extraLabelColId: config?.extraLabelColId ?? null,
    baseDateLabels: config?.baseDateLabels ?? {},
  };

  const {
    targetColId,
    baseColId,
    titleColId,
    checkboxColId,
    manualStartDate,
    manualEndDate,
    showBaseDate,
    showBackgroundEvents,
    diffUnit,
    extraLabelColId,
  } = currentConfig;

  // Data mapping
  const timelineItems = useMemo(() => {
    let filtered = requirements;
    if (checkboxColId) {
      filtered = filtered.filter(
        (req) => req.customColumns?.[checkboxColId] === "true",
      );
    }

    const items = filtered
      .map((req) => {
        const targetDateStr = req.customColumns?.[targetColId];
        const baseDateStr = req.customColumns?.[baseColId];
        const title =
          titleColId === "title"
            ? req.title
            : req.customColumns?.[titleColId] || "No Title";
        const extraLabel = extraLabelColId
          ? extraLabelColId === "title"
            ? req.title
            : req.customColumns?.[extraLabelColId] || ""
          : "";

        const targetTime = targetDateStr
          ? new Date(targetDateStr).getTime()
          : null;
        const baseTime = baseDateStr ? new Date(baseDateStr).getTime() : null;

        let diffMonths: number | null = null;
        if (targetTime && baseTime) {
          diffMonths = Math.round(
            (targetTime - baseTime) / (1000 * 60 * 60 * 24 * 30.436875),
          );
        }

        return {
          id: req.id,
          title,
          extraLabel,
          targetTime,
          baseTime,
          baseDateStr: baseDateStr || "",
          diffMonths,
          dateStr: targetDateStr || "",
          reqTitle: req.title, // always the raw title for filter
        };
      })
      .filter((item) => item.targetTime !== null);

    return items;
  }, [
    requirements,
    checkboxColId,
    targetColId,
    baseColId,
    titleColId,
    extraLabelColId,
  ]);

  // Unique base dates mapping
  const uniqueBaseDates = useMemo(() => {
    const map = new Map<number, { dateStr: string }>();
    timelineItems.forEach((item) => {
      if (item.baseTime) {
        if (!map.has(item.baseTime)) {
          map.set(item.baseTime, { dateStr: item.baseDateStr });
        }
      }
    });
    return Array.from(map.entries()).map(([time, data]) => ({
      time,
      dateStr: data.dateStr,
    }));
  }, [timelineItems]);

  // Calculate timeline bounds
  const bounds = useMemo(() => {
    if (timelineItems.length === 0 && !manualStartDate && !manualEndDate) {
      const now = Date.now();
      return { start: now - 31536000000, end: now + 31536000000 * 5 };
    }

    let minTime =
      timelineItems.length > 0
        ? Math.min(...timelineItems.map((i) => i.targetTime as number))
        : Date.now();

    // The base reference end: Base Quote Date + 5 years
    const allBaseDates = requirements
      .filter(
        (r) => !checkboxColId || r.customColumns?.[checkboxColId] === "true",
      )
      .map((r) => r.customColumns?.[baseColId])
      .filter((d) => !!d)
      .map((d) => new Date(d as string).getTime());

    let maxBaseTime =
      allBaseDates.length > 0 ? Math.max(...allBaseDates) : Date.now();
    let defaultEnd = maxBaseTime + 1000 * 60 * 60 * 24 * 365.25 * 5; // + 5 years

    let start = manualStartDate ? new Date(manualStartDate).getTime() : minTime;
    let end = manualEndDate ? new Date(manualEndDate).getTime() : defaultEnd;

    if (start >= end) {
      end = start + 31536000000;
    }

    // Add padding to start/end so points don't clip to the very edges
    const padding = (end - start) * 0.05;
    start -= padding;
    end += padding;

    return { start, end };
  }, [
    timelineItems,
    requirements,
    baseColId,
    checkboxColId,
    manualStartDate,
    manualEndDate,
  ]);

  // Generate 5-year ticks
  const ticks = useMemo(() => {
    const arr = [];
    const startYear = new Date(bounds.start).getFullYear();
    const endYear = new Date(bounds.end).getFullYear();
    const firstTickYear = Math.ceil(startYear / 5) * 5;

    for (let y = firstTickYear; y <= endYear; y += 5) {
      const t = new Date(y, 0, 1).getTime();
      if (t >= bounds.start && t <= bounds.end) {
        arr.push({ year: y, time: t });
      }
    }
    return arr;
  }, [bounds]);

  // Format diff display
  const formatDiff = (diffMonths: number | null) => {
    if (diffMonths === null) return null;
    if (diffUnit === "year") {
      const years = (diffMonths / 12).toFixed(1);
      return `${Number(years) > 0 ? "+" : ""}${years}y`;
    }
    return `${diffMonths > 0 ? "+" : ""}${diffMonths}`;
  };

  // Handle timeline item click for filtering
  const handleItemClick = (reqId: string) => {
    if (onDashboardFilter) {
      onDashboardFilter({
        type: "custom_column",
        columnId: "id",
        value: reqId,
      });
    }
  };

  const totalRange = bounds.end - bounds.start;
  const getLeftPct = (time: number) =>
    ((time - bounds.start) / totalRange) * 100;

  return (
    <div
      className="bg-brand-bg rounded-xl border border-white/5 shadow-lg flex flex-col resize-y overflow-hidden min-h-[150px]"
      style={{ height: 280 }} // Default initial height
      onContextMenu={(e) => {
        e.preventDefault();
        setShowConfigModal(true);
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-100">
            타임라인 대시보드
          </h2>
          <span className="text-xs text-slate-500 ml-2">
            (우클릭하여 설정 변경)
          </span>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          title="타임라인 설정"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 py-6 px-8 relative w-full flex items-center justify-center min-h-[220px]">
        {timelineItems.length === 0 ? (
          <div className="text-slate-500 text-sm italic">
            선택된 데이터가 없습니다. 스프레드시트에서 체크박스를
            활성화해주세요.
          </div>
        ) : (
          <div className="relative w-full flex items-center justify-center">
            {/* The Base Bar */}
            <div className="absolute left-0 right-0 h-2 rounded-full overflow-hidden flex bg-brand-surface-highest border border-brand-outline-variant/30">
              <div
                className="h-full bg-cyan-500/30"
                style={{
                  width: `${Math.max(0, Math.min(100, getLeftPct(Date.now())))}%`,
                }}
              />
            </div>

            {/* Background Events (Gantt Chart Style) */}
            {showBackgroundEvents &&
              BACKGROUND_EVENTS.map((evt, i) => {
                const evtStart = Math.max(evt.start, bounds.start);
                const evtEnd = Math.min(evt.end, bounds.end);
                if (evtStart >= bounds.end || evtEnd <= bounds.start)
                  return null;

                const leftPct = getLeftPct(evtStart);
                const widthPct = getLeftPct(evtEnd) - leftPct;

                const laneIndex = i % 4; // up to 4 lanes
                const laneHeight = 22;
                const gap = 8;
                const topOffset = -100 + laneIndex * (laneHeight + gap); // -100, -70, -40

                return (
                  <div
                    key={`bg-evt-${i}`}
                    className="absolute flex items-center overflow-hidden z-0"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: `calc(50% + ${topOffset}px)`,
                      height: `${laneHeight}px`,
                      background: evt.color,
                      border: `1px solid ${evt.borderColor}`,
                      borderRadius: "4px",
                      pointerEvents: "none",
                    }}
                  >
                    <div className="pl-2 text-[10px] text-slate-300 whitespace-nowrap font-bold drop-shadow-md">
                      {evt.label}
                    </div>
                  </div>
                );
              })}

            {/* Difference Box (Base Quote Date to Today) */}
            {showBaseDate &&
              uniqueBaseDates.map(({ time }) => {
                const now = Date.now();
                const leftPct = getLeftPct(time);
                const todayLeftPct = getLeftPct(now);

                if (time < now && leftPct < 100 && todayLeftPct > 0) {
                  const renderLeft = Math.max(0, leftPct);
                  const renderRight = Math.min(100, todayLeftPct);
                  const renderWidth = renderRight - renderLeft;

                  if (renderWidth > 0) {
                    const diffYears = (
                      (now - time) /
                      (1000 * 60 * 60 * 24 * 365.25)
                    ).toFixed(1);
                    return (
                      <div
                        key={`diff-box-${time}`}
                        className="absolute h-8 bg-amber-500/10 border-y border-amber-500/20 flex items-center justify-center z-[5] overflow-hidden"
                        style={{
                          left: `${renderLeft}%`,
                          width: `${renderWidth}%`,
                        }}
                      >
                        <span className="text-[10px] text-amber-500/70 font-bold whitespace-nowrap px-2">
                          {diffYears}년 경과
                        </span>
                      </div>
                    );
                  }
                }
                return null;
              })}

            {/* Current Date Marker (Today) */}
            {(() => {
              const now = Date.now();
              const leftPct = getLeftPct(now);
              if (leftPct >= 0 && leftPct <= 100) {
                const todayStr = new Date().toISOString().split("T")[0];
                return (
                  <div
                    key="today-marker"
                    className="absolute w-px bg-emerald-500 z-[12]"
                    style={{
                      left: `${leftPct}%`,
                      top: "calc(50% - 15px)",
                      height: "30px",
                    }}
                  >
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-brand-surface text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/30 whitespace-nowrap text-center shadow-lg">
                      오늘
                      <br />
                      {todayStr}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Ticks (5-year intervals) */}
            {ticks.map((tick) => {
              const leftPct = getLeftPct(tick.time);
              return (
                <div
                  key={`tick-${tick.year}`}
                  className="absolute w-px bg-brand-outline-variant/50 z-[1]"
                  style={{ left: `${leftPct}%`, height: "20px" }}
                >
                  <div className="absolute top-[24px] left-1/2 -translate-x-1/2 text-[11px] font-medium text-brand-on-surface-variant">
                    {tick.year}
                  </div>
                </div>
              );
            })}

            {/* Base Date Markers (amber/orange) */}
            {showBaseDate &&
              uniqueBaseDates.map(({ time, dateStr }) => {
                const leftPct = getLeftPct(time);
                if (leftPct < 0 || leftPct > 100) return null;

                const isEditing = editingBaseTime === time;
                const targetLabel =
                  columns.find((c) => c.id === targetColId)?.label || "";
                const defaultLabel = `견적일 ${targetLabel} 기준\n(${dateStr})`;
                const currentLabel =
                  currentConfig.baseDateLabels?.[time] || defaultLabel;

                return (
                  <div
                    key={`base-${time}`}
                    className="absolute flex items-center justify-center group z-[15]"
                    style={{ left: `${leftPct}%` }}
                  >
                    <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-brand-bg z-[5]" />

                    <div className="absolute flex flex-col items-center bottom-full mb-3 z-20">
                      <div className="flex items-center justify-center bg-brand-surface/90 backdrop-blur-sm border border-amber-500/30 px-3 py-1.5 rounded-md shadow-lg group-hover:border-amber-500/60 transition-colors min-w-max">
                        {isEditing ? (
                          <textarea
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => {
                              setEditingBaseTime(null);
                              onConfigChange({
                                ...currentConfig,
                                baseDateLabels: {
                                  ...(currentConfig.baseDateLabels || {}),
                                  [time]: editValue,
                                },
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setEditingBaseTime(null);
                              }
                            }}
                            className="text-xs font-bold text-amber-300 bg-transparent border-none outline-none w-full text-center resize-none overflow-hidden"
                            rows={2}
                            style={{
                              width: `${Math.max(120, editValue.length * 6)}px`,
                            }}
                          />
                        ) : (
                          <span
                            className="text-xs font-bold text-amber-500 cursor-text hover:text-amber-400 text-center whitespace-pre leading-snug"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditValue(currentLabel);
                              setEditingBaseTime(time);
                            }}
                            title="클릭하여 수정"
                          >
                            {currentLabel}
                          </span>
                        )}
                      </div>
                      <div className="w-px h-2 bg-amber-500/50 absolute -bottom-2 left-1/2 -translate-x-1/2" />
                    </div>
                  </div>
                );
              })}

            {/* Timeline Items (cyan) */}
            {(() => {
              let lastTopLeft = -999;
              let lastBottomLeft = -999;

              const sortedItems = [...timelineItems].sort(
                (a, b) => (a.targetTime as number) - (b.targetTime as number),
              );

              return sortedItems.map((item, idx) => {
                const leftPct = getLeftPct(item.targetTime as number);

                const overlapThreshold = 14;

                let isTop = true;
                if (leftPct - lastTopLeft < overlapThreshold) {
                  isTop = false;
                }

                if (isTop) {
                  lastTopLeft = leftPct;
                } else {
                  lastBottomLeft = leftPct;
                }

                const yOffset = "30px";

                const displayTitle = item.extraLabel
                  ? `${item.title} (${item.extraLabel})`
                  : item.title;
                const tooltipText = `K/L = ${item.dateStr}`;

                return (
                  <div
                    key={item.id}
                    className="absolute flex items-center justify-center group cursor-pointer z-20"
                    style={{ left: `${leftPct}%` }}
                    onClick={() => handleItemClick(item.id)}
                  >
                    <div className="w-3 h-3 rounded-full bg-cyan-500 ring-2 ring-brand-bg transition-transform group-hover:scale-125 relative z-10 shadow-lg" />

                    <div
                      className="absolute w-px bg-cyan-500/50"
                      style={{
                        height: yOffset,
                        [isTop ? "bottom" : "top"]: "6px",
                      }}
                    />

                    <div
                      className="absolute flex flex-col items-center"
                      style={{
                        [isTop ? "bottom" : "top"]: `calc(6px + ${yOffset})`,
                      }}
                      title={tooltipText}
                    >
                      <div className="flex flex-col items-center justify-center bg-brand-surface border border-cyan-500/30 px-2.5 py-1.5 rounded-lg shadow-lg group-hover:border-cyan-400 group-hover:shadow-cyan-500/20 transition-all">
                        <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
                          {displayTitle}
                        </span>
                        {item.diffMonths !== null && (
                          <span className="text-[10px] font-bold text-amber-400 mt-0.5 whitespace-nowrap">
                            {formatDiff(item.diffMonths)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>
            {columns.find((c) => c.id === targetColId)?.label || "기준일"}
          </span>
        </div>
        {showBaseDate && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 opacity-70" />
            <span>
              {columns.find((c) => c.id === baseColId)?.label || "본함 견적일"}
            </span>
          </div>
        )}
        {showBackgroundEvents && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-rose-500/10 border border-rose-500/20" />
            <span>주요 이벤트</span>
          </div>
        )}
      </div>

      {showConfigModal &&
        createPortal(
          <TimelineConfigModal
            currentConfig={currentConfig}
            columns={columns}
            onSave={(cfg) => {
              onConfigChange(cfg);
              setShowConfigModal(false);
            }}
            onClose={() => setShowConfigModal(false)}
          />,
          document.body,
        )}
    </div>
  );
}
