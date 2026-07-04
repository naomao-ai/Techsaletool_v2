/**
 * L1 성능 벤치 — computeSmartMerge (§14 P3-2)
 * 실행: npx tsx tests/perf/mergeBench.ts
 *
 * 시나리오: 요구항목 N건의 base에서 mine과 theirs가 각각 서로 다른 10%를 편집하고
 * 소수를 추가/삭제한, 실사용에 가까운 3-way 병합. 5회 반복의 중앙값(ms)을 보고한다.
 */
import { computeSmartMerge, type MergeSnapshot } from "../../src/lib/mergeEngine";

function req(i: number, over: Record<string, any> = {}) {
  return {
    id: `REQ-${String(i).padStart(5, "0")}`,
    title: `요구조건 ${i}`,
    priority: i % 3 === 0 ? "HIGH" : "MEDIUM",
    assignees: [] as any[],
    dueDate: "2026-12-31",
    status: "TODO",
    customColumns: { c1: `v${i}`, c2: `w${i}` } as Record<string, string>,
    ...over,
  };
}

function buildSnap(n: number): MergeSnapshot {
  const reqs = Array.from({ length: n }, (_, i) => req(i));
  return {
    tabDataMap: { T1: { requirements: reqs, columns: [{ id: "c1" }, { id: "c2" }] } },
    tabs: [{ id: "T1", name: "탭1" }],
    assigneesPool: Array.from({ length: 30 }, (_, i) => ({ id: `u${i}`, name: `사용자${i}` })),
    appName: "App",
    boardItems: [],
  };
}

function variant(base: MergeSnapshot, editEvery: number, offset: number, tag: string): MergeSnapshot {
  const src = base.tabDataMap!.T1.requirements as any[];
  const reqs = src.map((r: any, i: number) =>
    (i + offset) % editEvery === 0 ? { ...r, title: `${r.title} [${tag}]` } : r,
  );
  // 소수 추가/삭제
  reqs.splice(3, 2);
  for (let k = 0; k < 5; k++) reqs.push(req(900000 + offset * 10 + k));
  return {
    ...base,
    tabDataMap: { T1: { ...base.tabDataMap!.T1, requirements: reqs } },
  };
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

console.log("=== computeSmartMerge 벤치 (5회 중앙값, ms) ===");
for (const n of [500, 1000, 3000, 6000, 10000]) {
  const base = buildSnap(n);
  const mine = variant(base, 10, 0, "mine");
  const theirs = variant(base, 10, 5, "theirs");
  const times: number[] = [];
  for (let it = 0; it < 5; it++) {
    const t0 = performance.now();
    const r = computeSmartMerge(base, mine, theirs);
    const t1 = performance.now();
    times.push(t1 - t0);
    // 결과 유효성 최소 확인(최적화가 결과를 바꾸지 않는지 스팟 체크)
    const m = r.mergedPayload.tabDataMap!.T1.requirements as any[];
    if (m.length < n - 3) throw new Error(`병합 결과 크기 이상: ${m.length} < ${n - 3}`);
  }
  console.log(`N=${String(n).padStart(5)}  ${median(times).toFixed(1)} ms`);
}
