/**
 * L1 richText 유틸 단위 테스트 — src/lib/richText.ts
 *
 * 셀 텍스트 부분 서식(run) 연산의 정확성을 검증한다.
 * 실행:  npx tsx tests/unit/richText.test.ts
 */
import assert from "node:assert/strict";
import {
  toggleMark,
  setColor,
  setSize,
  clampRuns,
  toSegments,
  runsToCharStyles,
  charStylesToRuns,
} from "../../src/lib/richText";

let pass = 0;
let fail = 0;

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

console.log("\n=== L1 richText 유틸 단위 테스트 ===\n");

// 1. 부분 굵기 적용
it("일부 구간에만 굵기를 적용한다 (30자 중 3자)", () => {
  const text = "가".repeat(30);
  const runs = toggleMark(text, [], 5, 8, "bold");
  assert.equal(runs.length, 1);
  assert.deepEqual(runs[0], { start: 5, end: 8, bold: true });
});

// 2. 토글 해제
it("이미 굵은 구간에 다시 토글하면 해제된다", () => {
  const text = "abcdefgh";
  const on = toggleMark(text, [], 2, 5, "bold");
  const off = toggleMark(text, on, 2, 5, "bold");
  assert.equal(off.length, 0, "해제 후 run 없음");
});

// 3. 부분 토글 해제 — 일부만 겹치면 전체 적용(토글 규칙)
it("선택 구간이 부분적으로만 굵으면 전체 굵게 적용된다", () => {
  const text = "abcdefgh";
  const partial = toggleMark(text, [], 2, 4, "bold"); // [2,4)
  const applied = toggleMark(text, partial, 2, 6, "bold"); // 전부 굵진 않음 → 적용
  const styles = runsToCharStyles(text.length, applied);
  for (let i = 2; i < 6; i++) assert.ok(styles[i].bold, `${i} 굵어야 함`);
});

// 4. 여러 마크 중첩
it("같은 구간에 밑줄·취소선·색상을 중첩 적용한다", () => {
  const text = "hello world";
  let runs = toggleMark(text, [], 0, 5, "underline");
  runs = toggleMark(text, runs, 0, 5, "strike");
  runs = setColor(text, runs, 0, 5, "#ff0000");
  const st = runsToCharStyles(text.length, runs)[2];
  assert.ok(st.underline && st.strike);
  assert.equal(st.color, "#ff0000");
});

// 5. 색상 제거
it("색상을 undefined로 지정하면 제거된다", () => {
  const text = "abcdef";
  const colored = setColor(text, [], 0, 6, "#123456");
  const cleared = setColor(text, colored, 0, 6, undefined);
  assert.equal(cleared.length, 0);
});

// 6. 크기 적용
it("구간에 절대 크기를 지정한다", () => {
  const text = "abcdef";
  const runs = setSize(text, [], 1, 3, 20);
  assert.deepEqual(runs, [{ start: 1, end: 3, size: 20 }]);
});

// 7. 인접 동일 스타일 병합
it("인접한 동일 스타일 run은 하나로 병합된다", () => {
  const text = "abcdef";
  let runs = toggleMark(text, [], 0, 3, "bold");
  runs = toggleMark(text, runs, 3, 6, "bold"); // [0,3)+[3,6) → [0,6)
  assert.equal(runs.length, 1);
  assert.deepEqual(runs[0], { start: 0, end: 6, bold: true });
});

// 8. 서로 다른 스타일은 분리 유지
it("서로 다른 스타일 구간은 분리된 run으로 유지된다", () => {
  const text = "abcdef";
  let runs = toggleMark(text, [], 0, 3, "bold");
  runs = toggleMark(text, runs, 3, 6, "underline");
  assert.equal(runs.length, 2);
});

// 9. 클램프 — 텍스트가 짧아지면 넘는 run 잘림
it("텍스트가 짧아지면 run이 새 길이로 클램프된다", () => {
  const runs = [{ start: 2, end: 10, bold: true }];
  const clamped = clampRuns(runs, 5);
  assert.deepEqual(clamped, [{ start: 2, end: 5, bold: true }]);
});

it("클램프 결과가 비면 undefined를 반환한다", () => {
  const runs = [{ start: 8, end: 10, bold: true }];
  assert.equal(clampRuns(runs, 5), undefined);
});

// 10. 세그먼트 분해 (렌더용)
it("toSegments는 텍스트를 스타일 경계로 조각낸다", () => {
  const text = "abcdef";
  const runs = toggleMark(text, [], 2, 4, "bold");
  const segs = toSegments(text, runs);
  assert.equal(segs.map((s) => s.text).join(""), text, "조각 합치면 원문");
  const bold = segs.find((s) => s.style.bold);
  assert.equal(bold?.text, "cd");
});

it("run이 없으면 통짜 세그먼트 하나를 반환한다", () => {
  const segs = toSegments("hello", []);
  assert.equal(segs.length, 1);
  assert.equal(segs[0].text, "hello");
  assert.deepEqual(segs[0].style, {});
});

// 11. 범위 방어 — 역순/초과 범위
it("역순·범위초과 선택도 안전하게 처리된다", () => {
  const text = "abc";
  const r1 = toggleMark(text, [], 5, 2, "bold"); // 역순
  const styles = runsToCharStyles(text.length, r1);
  assert.ok(styles[2].bold);
  const r2 = toggleMark(text, [], 0, 100, "bold"); // 초과
  assert.deepEqual(r2, [{ start: 0, end: 3, bold: true }]);
});

// 12. 라운드트립 안정성
it("runs→charStyles→runs 라운드트립이 안정적이다", () => {
  const text = "hello world foo";
  let runs = toggleMark(text, [], 0, 5, "bold");
  runs = setColor(text, runs, 6, 11, "#00f");
  const rt = charStylesToRuns(runsToCharStyles(text.length, runs));
  assert.deepEqual(rt, runs);
});

console.log(`\n── 결과: ${pass} pass / ${fail} fail ──\n`);
if (fail > 0) process.exit(1);
