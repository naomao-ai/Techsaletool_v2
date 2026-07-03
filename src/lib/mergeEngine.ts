/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 3-way(base / mine / theirs) 셀 단위 병합 엔진.
 *
 * 원래 App.tsx의 executeSmartMerge 안에 인라인으로 있던 병합 코어 로직을
 * 순수 함수로 추출한 것. setState / invoke / 파일 IO 등 부수효과는 전부
 * 호출부(App.tsx)에 남고, 이 함수는 (base, mine, theirs) → { mergedPayload, conflicts }
 * 만 계산한다. 덕분에 다중 사용자 병합 시나리오를 단위 테스트로 검증할 수 있다.
 *
 * ⚠️ 동작은 원본과 100% 동일하게 유지한다 (버그 포함). 테스트는 이 함수의
 *    실제 동작을 검증하므로, 여기서 로직을 "고치면" 안 된다. 결함은 별도로 수정한다.
 */
import { DEFAULT_COLUMNS } from "../data";
import type { Requirement } from "../types";

export interface MergeSnapshot {
  tabDataMap?: Record<string, any>;
  tabs?: any[];
  assigneesPool?: any[];
  appName?: string;
  boardItems?: any[];
  [k: string]: any;
}

export interface MergeConflict {
  reqId: string;
  field: string;
  mine: any;
  theirs: any;
  tabId: string;
}

export interface MergeResult {
  mergedPayload: MergeSnapshot;
  conflicts: MergeConflict[];
}

/**
 * @param base   내가 마지막으로 서버와 동기화했던 스냅샷 (lastSavedPayload)
 * @param mine   현재 내 로컬 상태 (statesRef.current)
 * @param theirs 방금 파일에서 읽은 다른 사용자의 최신 상태 (read_data 결과)
 */
export function computeSmartMerge(
  base: MergeSnapshot,
  mine: MergeSnapshot,
  theirs: MergeSnapshot,
): MergeResult {
  const baseData = base;
  const myData = mine;
  const theirData = theirs;

  const conflicts: MergeConflict[] = [];
  const mergedMap: Record<string, any> = {};

  // Merge tabs array to prevent losing concurrently added tabs
  let finalTabs = [...(baseData.tabs || [])];
  const baseTabIds = finalTabs.map((t) => t.id);

  // Add their new tabs and apply their edits
  (theirData.tabs || []).forEach((theirT: any) => {
    const idx = finalTabs.findIndex((t) => t.id === theirT.id);
    if (idx === -1) finalTabs.push(theirT);
    else finalTabs[idx] = { ...finalTabs[idx], ...theirT };
  });

  // Add my new tabs and apply my edits
  (myData.tabs || []).forEach((myT: any) => {
    const idx = finalTabs.findIndex((t) => t.id === myT.id);
    if (idx === -1) finalTabs.push(myT);
    else {
      const baseT = baseData.tabs?.find((t: any) => t.id === myT.id);
      // If I changed the tab config, override theirs
      if (JSON.stringify(baseT) !== JSON.stringify(myT)) {
        finalTabs[idx] = { ...finalTabs[idx], ...myT };
      }
    }
  });

  // Remove tabs deleted by either
  finalTabs = finalTabs.filter((t) => {
    const inBase = baseTabIds.includes(t.id);
    const deletedByThem = inBase && !(theirData.tabs || []).find((x: any) => x.id === t.id);
    const deletedByMe = inBase && !(myData.tabs || []).find((x: any) => x.id === t.id);
    return !(deletedByThem || deletedByMe);
  });

  Object.keys({ ...theirData.tabDataMap, ...myData.tabDataMap }).forEach((tabId) => {
    const myTab = myData.tabDataMap?.[tabId] || {
      requirements: [],
      columns: DEFAULT_COLUMNS,
    };
    const theirTab = theirData.tabDataMap?.[tabId] || {
      requirements: [],
      columns: DEFAULT_COLUMNS,
    };
    const baseTab = baseData.tabDataMap?.[tabId] || {
      requirements: [],
      columns: DEFAULT_COLUMNS,
    };

    let mergedReqs = [...theirTab.requirements];
    const baseReqIds = (baseTab.requirements || []).map((r: any) => r.id);
    const theirReqIds = (theirTab.requirements || []).map((r: any) => r.id);
    const myReqIds = (myTab.requirements || []).map((r: any) => r.id);
    let mergedCols = [...(baseTab.columns || [])];
    const baseColIds = mergedCols.map((c: any) => c.id);
    const theirColIds = (theirTab.columns || []).map((c: any) => c.id);
    const myColIds = (myTab.columns || []).map((c: any) => c.id);

    // Apply their changes
    theirTab.columns?.forEach((tc: any) => {
      const idx = mergedCols.findIndex((c) => c.id === tc.id);
      if (idx === -1) mergedCols.push(tc);
      else mergedCols[idx] = { ...mergedCols[idx], ...tc };
    });

    // Apply my changes
    myTab.columns?.forEach((mc: any) => {
      const idx = mergedCols.findIndex((c) => c.id === mc.id);
      if (idx === -1) mergedCols.push(mc);
      else {
        // If I changed it from base, apply my change (my changes win on columns for simplicity unless we want column conflicts)
        const baseCol = baseTab.columns?.find((c: any) => c.id === mc.id);
        if (JSON.stringify(baseCol) !== JSON.stringify(mc)) {
          mergedCols[idx] = { ...mergedCols[idx], ...mc };
        }
      }
    });

    // Remove deleted columns
    mergedCols = mergedCols.filter((c) => {
      const inBase = baseColIds.includes(c.id);
      const deletedByThem = inBase && !theirColIds.includes(c.id);
      const deletedByMe = inBase && !myColIds.includes(c.id);
      return !(deletedByThem || deletedByMe);
    });

    myTab.requirements.forEach((myReq: any) => {
      const baseReq = baseTab.requirements.find((r: any) => r.id === myReq.id);
      const theirReqIndex = mergedReqs.findIndex((r: any) => r.id === myReq.id);

      if (!baseReq) {
        if (theirReqIndex === -1) {
          mergedReqs.push(myReq);
        } else {
          // Duplicate ID collision
          let maxNumericId = mergedReqs.reduce((max, r) => {
            const match = String(r.id).match(/REQ-(\d+)/);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
          }, 0);
          const nextId = `REQ-${String(maxNumericId + 1).padStart(3, "0")}`;
          mergedReqs.push({ ...myReq, id: nextId });
        }
      } else {
        if (theirReqIndex !== -1) {
          const theirReq = mergedReqs[theirReqIndex];
          const mergedReq: any = {
            ...theirReq,
            customColumns: { ...theirReq.customColumns },
          };
          const fields = ["title", "priority", "status", "dueDate"];

          fields.forEach((f) => {
            if (
              myReq[f as keyof Requirement] !== baseReq[f as keyof Requirement]
            ) {
              if (
                theirReq[f as keyof Requirement] !==
                  baseReq[f as keyof Requirement] &&
                myReq[f as keyof Requirement] !==
                  theirReq[f as keyof Requirement]
              ) {
                conflicts.push({
                  reqId: myReq.id,
                  field: f,
                  mine: myReq[f as keyof Requirement],
                  theirs: theirReq[f as keyof Requirement],
                  tabId,
                });
              } else {
                (mergedReq as any)[f] = myReq[f as keyof Requirement];
              }
            }
          });

          if (myReq.customColumns) {
            Object.keys(myReq.customColumns).forEach((colId) => {
              const myVal = myReq.customColumns[colId];
              const baseVal = baseReq.customColumns?.[colId];
              const theirVal = theirReq.customColumns?.[colId];
              if (myVal !== baseVal) {
                if (theirVal !== baseVal && myVal !== theirVal) {
                  conflicts.push({
                    reqId: myReq.id,
                    field: `customColumns.${colId}`,
                    mine: myVal,
                    theirs: theirVal,
                    tabId,
                  });
                } else {
                  if (!mergedReq.customColumns) mergedReq.customColumns = {};
                  mergedReq.customColumns[colId] = myVal;
                }
              }
            });
          }

          if (
            JSON.stringify(myReq.assignees) !== JSON.stringify(baseReq.assignees)
          ) {
            if (
              JSON.stringify(theirReq.assignees) !==
                JSON.stringify(baseReq.assignees) &&
              JSON.stringify(myReq.assignees) !==
                JSON.stringify(theirReq.assignees)
            ) {
              conflicts.push({
                reqId: myReq.id,
                field: "assignees",
                mine: myReq.assignees.map((a: any) => a.name).join(","),
                theirs: theirReq.assignees.map((a: any) => a.name).join(","),
                tabId,
              });
            } else {
              mergedReq.assignees = myReq.assignees;
            }
          }

          mergedReqs[theirReqIndex] = mergedReq;
        }
      }
    });

    // [결함 #1 수정] 요구항목 삭제 반영 — 탭·컬럼과 동일한 3-way 삭제 필터.
    // base에 있었고(inBase) 어느 한쪽이 삭제한 항목은 병합 결과에서 제거한다.
    // (base에 없던 신규 항목·재번호 항목은 inBase=false 이므로 영향 없음)
    mergedReqs = mergedReqs.filter((r: any) => {
      const inBase = baseReqIds.includes(r.id);
      const deletedByThem = inBase && !theirReqIds.includes(r.id);
      const deletedByMe = inBase && !myReqIds.includes(r.id);
      return !(deletedByThem || deletedByMe);
    });

    const mergedTabConfig: any = { ...theirTab };
    Object.keys(myTab).forEach((key) => {
      if (key === "requirements" || key === "columns") return;
      if (
        JSON.stringify(myTab[key as keyof typeof myTab]) !==
        JSON.stringify(baseTab[key as keyof typeof baseTab])
      ) {
        mergedTabConfig[key] = myTab[key as keyof typeof myTab];
      }
    });

    mergedMap[tabId] = {
      ...mergedTabConfig,
      requirements: mergedReqs,
      columns: mergedCols,
    };
  });

  // [결함 #2 수정] assigneesPool 3-way 병합.
  // 기존에는 mergedPayload가 theirData의 풀로 통째 덮어 내 추가/삭제가 소실됐다.
  // base 기준으로 양쪽 추가는 합집합, 어느 한쪽 삭제는 삭제 반영.
  const poolBase = baseData.assigneesPool || [];
  const poolMine = myData.assigneesPool || [];
  const poolTheirs = theirData.assigneesPool || [];
  const baseAssigneeIds = new Set(poolBase.map((a: any) => a.id));
  const mineAssigneeIds = new Set(poolMine.map((a: any) => a.id));
  const theirAssigneeIds = new Set(poolTheirs.map((a: any) => a.id));

  const mergedPool: any[] = [];
  const seenAssignee = new Set<any>();
  // 순서: 내 풀 → 상대 풀 → base (중복 id는 최초 1회만)
  for (const a of [...poolMine, ...poolTheirs, ...poolBase]) {
    if (seenAssignee.has(a.id)) continue;
    seenAssignee.add(a.id);
    const inBase = baseAssigneeIds.has(a.id);
    const deletedByMe = inBase && !mineAssigneeIds.has(a.id);
    const deletedByThem = inBase && !theirAssigneeIds.has(a.id);
    if (deletedByMe || deletedByThem) continue; // 삭제 반영
    // 내용은 내 풀 우선 → 상대 → base
    const obj =
      poolMine.find((x: any) => x.id === a.id) ||
      poolTheirs.find((x: any) => x.id === a.id) ||
      poolBase.find((x: any) => x.id === a.id);
    mergedPool.push(obj);
  }

  const mergedPayload: MergeSnapshot = {
    ...theirData,
    tabDataMap: mergedMap,
    tabs: finalTabs,
    assigneesPool: mergedPool,
  };

  return { mergedPayload, conflicts };
}
