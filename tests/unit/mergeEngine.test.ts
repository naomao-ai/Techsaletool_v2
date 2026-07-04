/**
 * L1 병합 단위 테스트 — src/lib/mergeEngine.ts (computeSmartMerge)
 *
 * 다중 사용자(Tauri 오프라인) 시나리오에서 base/mine/theirs 3-way 병합의
 * 정확성을 검증한다. 실행:  npx tsx tests/unit/mergeEngine.test.ts
 *
 * 두 그룹으로 구성:
 *   - it(...)      : 올바른 동작 검증. 실패하면 회귀(regression).
 *   - defect(...)  : "올바른 기대"를 단언하되, 현재 코드의 결함으로 실패할 것을
 *                    예상하는 재현 테스트. 실패(throw) 하면 "결함 재현됨"으로 집계.
 */
import assert from "node:assert/strict";
import { computeSmartMerge, type MergeSnapshot } from "../../src/lib/mergeEngine";

// ─── 미니 테스트 하니스 ──────────────────────────────────────────────
let pass = 0;
let fail = 0;
let defectsReproduced = 0;
let defectsNotReproduced = 0;

function it(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  ok    - ${name}`);
  } catch (e: any) {
    fail++;
    console.log(`  FAIL  - ${name}`);
    console.log(`          ${String(e.message).split("\n")[0]}`);
  }
}

/** 현재 코드에 존재하는 결함을 재현하는 테스트. fn은 "올바른 기대"를 단언한다. */
function defect(name: string, fn: () => void) {
  try {
    fn();
    // 예외 없이 통과 = 올바른 동작 = 결함이 재현되지 않음 (수정되었을 가능성)
    defectsNotReproduced++;
    console.log(`  ⚠ 미재현 - ${name}`);
    console.log(`             (올바르게 동작함 — 결함이 이미 수정된 것으로 보임)`);
  } catch (e: any) {
    defectsReproduced++;
    console.log(`  ✗ 결함확인 - ${name}`);
    console.log(`             기대: ${String(e.message).split("\n")[0]}`);
  }
}

// ─── 픽스처 빌더 ────────────────────────────────────────────────────
function req(id: string, over: Record<string, any> = {}) {
  return {
    id,
    title: id,
    priority: "MEDIUM",
    assignees: [] as any[],
    dueDate: "",
    status: "TODO",
    customColumns: {} as Record<string, string>,
    ...over,
  };
}

function snap(t1Reqs: any[], over: Partial<MergeSnapshot> = {}): MergeSnapshot {
  return {
    tabDataMap: { T1: { requirements: t1Reqs, columns: [] } },
    tabs: [{ id: "T1", name: "탭1" }],
    assigneesPool: [],
    appName: "App",
    boardItems: [],
    ...over,
  };
}

const merged = (r: ReturnType<typeof computeSmartMerge>) =>
  r.mergedPayload.tabDataMap!.T1.requirements as any[];
const ids = (rs: any[]) => rs.map((r) => r.id).sort();

console.log("\n=== L1 병합 단위 테스트 (computeSmartMerge) ===\n");
console.log("── [그룹 A] 정상 동작 검증 ──────────────────────────");

// A1. 서로 다른 필드 동시 편집 → 충돌 없이 자동 병합
it("서로 다른 필드를 동시 편집하면 충돌 없이 양쪽 변경이 병합된다", () => {
  const base = snap([req("REQ-001", { title: "A", status: "TODO" })]);
  const mine = snap([req("REQ-001", { title: "A-mine", status: "TODO" })]);
  const theirs = snap([req("REQ-001", { title: "A", status: "DONE" })]);

  const r = computeSmartMerge(base, mine, theirs);
  assert.equal(r.conflicts.length, 0, "충돌이 없어야 함");
  const m = merged(r).find((x) => x.id === "REQ-001");
  assert.equal(m.title, "A-mine", "내 title 변경 반영");
  assert.equal(m.status, "DONE", "상대 status 변경 반영");
});

// A2. 같은 필드 동시 편집 → 충돌로 검출
it("같은 필드를 동시 편집하면 충돌로 검출된다", () => {
  const base = snap([req("REQ-001", { title: "A" })]);
  const mine = snap([req("REQ-001", { title: "MINE" })]);
  const theirs = snap([req("REQ-001", { title: "THEIRS" })]);

  const r = computeSmartMerge(base, mine, theirs);
  assert.equal(r.conflicts.length, 1, "충돌 1건");
  assert.equal(r.conflicts[0].field, "title");
  assert.equal(r.conflicts[0].mine, "MINE");
  assert.equal(r.conflicts[0].theirs, "THEIRS");
});

// A3. 각자 새 요구항목 추가 → 둘 다 보존
it("두 사용자가 각각 새 요구항목을 추가하면 둘 다 보존된다", () => {
  const base = snap([req("REQ-001")]);
  const mine = snap([req("REQ-001"), req("REQ-010")]);
  const theirs = snap([req("REQ-001"), req("REQ-020")]);

  const r = computeSmartMerge(base, mine, theirs);
  assert.deepEqual(ids(merged(r)), ["REQ-001", "REQ-010", "REQ-020"]);
});

// A4. 같은 새 ID 충돌 → 내 항목이 재번호되어 보존
it("동일한 신규 ID 충돌 시 내 항목이 재번호(REQ-xxx)되어 보존된다", () => {
  const base = snap([req("REQ-001")]);
  const mine = snap([req("REQ-001"), req("REQ-002", { title: "mine-new" })]);
  const theirs = snap([req("REQ-001"), req("REQ-002", { title: "theirs-new" })]);

  const r = computeSmartMerge(base, mine, theirs);
  const m = merged(r);
  assert.equal(m.length, 3, "재번호로 3개 유지");
  assert.ok(
    m.some((x) => x.title === "mine-new" && x.id !== "REQ-002"),
    "내 신규 항목이 새 ID로 보존됨",
  );
});

// A5. 각자 새 탭 추가 → 둘 다 보존
it("두 사용자가 각각 새 탭을 추가하면 탭이 모두 보존된다", () => {
  const base = snap([req("REQ-001")], { tabs: [{ id: "T1", name: "탭1" }] });
  const mine = snap([req("REQ-001")], {
    tabs: [{ id: "T1", name: "탭1" }, { id: "TM", name: "내탭" }],
  });
  const theirs = snap([req("REQ-001")], {
    tabs: [{ id: "T1", name: "탭1" }, { id: "TT", name: "상대탭" }],
  });

  const r = computeSmartMerge(base, mine, theirs);
  const tabIds = (r.mergedPayload.tabs || []).map((t: any) => t.id).sort();
  assert.deepEqual(tabIds, ["T1", "TM", "TT"]);
});

// A6. 탭 삭제(내가 삭제, 상대 미변경) → 삭제 반영 (요구항목 삭제와 대조군)
it("내가 탭을 삭제하고 상대가 미변경이면 탭 삭제가 반영된다", () => {
  const base = snap([req("REQ-001")], {
    tabs: [{ id: "T1", name: "탭1" }, { id: "T2", name: "탭2" }],
  });
  const mine = snap([req("REQ-001")], { tabs: [{ id: "T1", name: "탭1" }] });
  const theirs = snap([req("REQ-001")], {
    tabs: [{ id: "T1", name: "탭1" }, { id: "T2", name: "탭2" }],
  });

  const r = computeSmartMerge(base, mine, theirs);
  const tabIds = (r.mergedPayload.tabs || []).map((t: any) => t.id).sort();
  assert.deepEqual(tabIds, ["T1"], "T2가 삭제되어야 함");
});

// A7. [결함 #1 수정 회귀] 요구항목 삭제가 병합에 반영된다
it("[결함#1 수정] 내가 요구항목을 삭제하고 상대가 미변경이면 삭제가 유지된다", () => {
  const base = snap([req("REQ-001"), req("REQ-005")]);
  const mine = snap([req("REQ-001")]); // REQ-005 삭제
  const theirs = snap([req("REQ-001"), req("REQ-005")]); // 상대는 그대로

  const r = computeSmartMerge(base, mine, theirs);
  assert.ok(
    !merged(r).some((x) => x.id === "REQ-005"),
    "삭제한 REQ-005가 병합 결과에 남아있음 (삭제 소실)",
  );
});

// A8. [결함 #1 인접] 상대가 삭제한 항목도 병합에서 제거된다
it("[결함#1 인접] 상대가 요구항목을 삭제하고 내가 미변경이면 삭제가 유지된다", () => {
  const base = snap([req("REQ-001"), req("REQ-005")]);
  const mine = snap([req("REQ-001"), req("REQ-005")]); // 나는 그대로
  const theirs = snap([req("REQ-001")]); // 상대가 REQ-005 삭제

  const r = computeSmartMerge(base, mine, theirs);
  assert.ok(
    !merged(r).some((x) => x.id === "REQ-005"),
    "상대가 삭제한 REQ-005가 남아있음",
  );
});

const A = { id: "u1", name: "김철수", avatarUrl: "" };
const B = { id: "u2", name: "이영희", avatarUrl: "" };
const C = { id: "u3", name: "박민수", avatarUrl: "" };

// A9. [결함 #2 수정 회귀] 내가 담당자 풀에 추가한 인원이 병합 후 유지된다
it("[결함#2 수정] 내가 담당자 풀에 인원을 추가하면 병합 후에도 유지된다", () => {
  const base = snap([req("REQ-001")], { assigneesPool: [A] });
  const mine = snap([req("REQ-001")], { assigneesPool: [A, B] }); // B 추가
  const theirs = snap([req("REQ-001")], { assigneesPool: [A] }); // 상대는 그대로

  const r = computeSmartMerge(base, mine, theirs);
  const pool = (r.mergedPayload.assigneesPool || []).map((a: any) => a.id).sort();
  assert.deepEqual(pool, ["u1", "u2"], "내가 추가한 u2 유지");
});

// A10. [결함 #2 인접] 양쪽이 서로 다른 담당자를 추가하면 합집합이 된다
it("[결함#2 인접] 두 사용자가 각각 담당자를 추가하면 합집합으로 병합된다", () => {
  const base = snap([req("REQ-001")], { assigneesPool: [A] });
  const mine = snap([req("REQ-001")], { assigneesPool: [A, B] }); // B 추가
  const theirs = snap([req("REQ-001")], { assigneesPool: [A, C] }); // C 추가

  const r = computeSmartMerge(base, mine, theirs);
  const pool = (r.mergedPayload.assigneesPool || []).map((a: any) => a.id).sort();
  assert.deepEqual(pool, ["u1", "u2", "u3"], "u1+u2+u3 합집합");
});

// A11. [결함 #2 인접] 내가 담당자를 삭제하면 병합 후에도 삭제가 유지된다
it("[결함#2 인접] 내가 담당자 풀에서 인원을 삭제하면 병합 후 삭제가 유지된다", () => {
  const base = snap([req("REQ-001")], { assigneesPool: [A, B] });
  const mine = snap([req("REQ-001")], { assigneesPool: [A] }); // B 삭제
  const theirs = snap([req("REQ-001")], { assigneesPool: [A, B] }); // 상대 미변경

  const r = computeSmartMerge(base, mine, theirs);
  const pool = (r.mergedPayload.assigneesPool || []).map((a: any) => a.id).sort();
  assert.deepEqual(pool, ["u1"], "내가 삭제한 u2가 제거되어야 함");
});

console.log("\n── [그룹 B] 결함 재현 (미수정) ──────────────────────");
console.log("  (현재 미수정 결함 없음)");

// ─── 요약 ───────────────────────────────────────────────────────────
console.log("\n=== 요약 ===");
console.log(`정상 동작:   ${pass} passed, ${fail} failed`);
console.log(
  `결함 재현:   ${defectsReproduced} 확인됨, ${defectsNotReproduced} 미재현`,
);
if (fail > 0) {
  console.log("\n❌ 회귀 실패 존재 — 병합 로직이 깨졌습니다.");
  process.exit(1);
} else {
  console.log("\n✅ 정상 동작 그룹 전부 통과.");
  if (defectsReproduced > 0) {
    console.log(
      `⚠️  ${defectsReproduced}개 결함이 재현됨 — 별도 수정 필요 (위 ✗ 항목).`,
    );
  }
  process.exit(0);
}
