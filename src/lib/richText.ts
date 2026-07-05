/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 셀 텍스트 부분 서식(rich text) run 연산 코어.
 *
 * 저장 정본은 순수 문자열이고, 서식은 TextRun[] 부가 레이어로만 표현한다.
 * 편집기/렌더/병합 등 부수효과는 전부 호출부(Spreadsheet.tsx)에 남기고, 여기서는
 * (text, runs, 선택범위, 서식) → 새 runs 만 계산하는 순수 함수만 둔다.
 *
 * 구현 전략: run 배열을 직접 쪼개고 붙이는 대신, 항상 "문자 단위 스타일 배열"을
 * 경유한다(runs→per-char→runs). 셀 텍스트는 짧아 성능 문제가 없고, 경계 분할·병합
 * 버그를 원천 차단한다. 결과 run은 겹치지 않고 start 오름차순으로 정규화된다.
 */
import type { TextRun } from "../types";

export interface CharStyle {
  bold?: boolean;
  color?: string;
  underline?: boolean;
  strike?: boolean;
  size?: number;
}

export type ToggleMark = "bold" | "underline" | "strike";

/** runs → 각 문자 위치의 스타일 배열. 범위를 넘는 run은 [0,len)으로 클램프한다. */
export function runsToCharStyles(len: number, runs: TextRun[] = []): CharStyle[] {
  const arr: CharStyle[] = Array.from({ length: len }, () => ({}));
  for (const r of runs) {
    const s = Math.max(0, r.start);
    const e = Math.min(len, r.end);
    for (let i = s; i < e; i++) {
      const st = arr[i];
      if (r.bold) st.bold = true;
      if (r.underline) st.underline = true;
      if (r.strike) st.strike = true;
      if (r.color) st.color = r.color;
      if (r.size) st.size = r.size;
    }
  }
  return arr;
}

function isEmptyStyle(s: CharStyle): boolean {
  return !s.bold && !s.underline && !s.strike && !s.color && !s.size;
}

function sameStyle(a: CharStyle, b: CharStyle): boolean {
  return (
    !!a.bold === !!b.bold &&
    !!a.underline === !!b.underline &&
    !!a.strike === !!b.strike &&
    (a.color || "") === (b.color || "") &&
    (a.size || 0) === (b.size || 0)
  );
}

/** 문자 스타일 배열 → 인접 동일 스타일을 묶은 정규화 run 배열. 빈 스타일 구간은 생략. */
export function charStylesToRuns(styles: CharStyle[]): TextRun[] {
  const runs: TextRun[] = [];
  let i = 0;
  while (i < styles.length) {
    if (isEmptyStyle(styles[i])) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < styles.length && sameStyle(styles[i], styles[j])) j++;
    const st = styles[i];
    const run: TextRun = { start: i, end: j };
    if (st.bold) run.bold = true;
    if (st.underline) run.underline = true;
    if (st.strike) run.strike = true;
    if (st.color) run.color = st.color;
    if (st.size) run.size = st.size;
    runs.push(run);
    i = j;
  }
  return runs;
}

function normalizeRange(
  text: string,
  start: number,
  end: number,
): [number, number] {
  let s = Math.max(0, Math.min(start, end));
  let e = Math.min(text.length, Math.max(start, end));
  return [s, e];
}

/**
 * [start,end)에 토글형 마크(굵기/밑줄/취소선)를 적용/해제.
 * 선택 구간이 전부 이미 적용돼 있으면 해제, 아니면 적용(엑셀/워드와 동일한 토글 UX).
 */
export function toggleMark(
  text: string,
  runs: TextRun[],
  start: number,
  end: number,
  mark: ToggleMark,
): TextRun[] {
  const [s, e] = normalizeRange(text, start, end);
  if (e <= s) return runs;
  const styles = runsToCharStyles(text.length, runs);
  let allSet = true;
  for (let i = s; i < e; i++) {
    if (!styles[i][mark]) {
      allSet = false;
      break;
    }
  }
  for (let i = s; i < e; i++) {
    styles[i] = { ...styles[i], [mark]: allSet ? undefined : true };
  }
  return charStylesToRuns(styles);
}

/** [start,end)에 색상 지정. color=undefined면 색상 제거. */
export function setColor(
  text: string,
  runs: TextRun[],
  start: number,
  end: number,
  color: string | undefined,
): TextRun[] {
  const [s, e] = normalizeRange(text, start, end);
  if (e <= s) return runs;
  const styles = runsToCharStyles(text.length, runs);
  for (let i = s; i < e; i++) styles[i] = { ...styles[i], color };
  return charStylesToRuns(styles);
}

/** [start,end)에 절대 크기(px) 지정. size=undefined면 기본 크기로 복귀. */
export function setSize(
  text: string,
  runs: TextRun[],
  start: number,
  end: number,
  size: number | undefined,
): TextRun[] {
  const [s, e] = normalizeRange(text, start, end);
  if (e <= s) return runs;
  const styles = runsToCharStyles(text.length, runs);
  for (let i = s; i < e; i++) styles[i] = { ...styles[i], size };
  return charStylesToRuns(styles);
}

/**
 * 텍스트 길이가 바뀌었을 때 run을 새 길이에 맞게 클램프한다(넘는 구간 잘라냄).
 * 정밀한 편집 추적은 하지 않지만 run이 항상 유효 범위를 유지하도록 보장한다.
 * 결과가 비면 undefined를 반환해 저장 페이로드에서 키를 생략할 수 있게 한다.
 */
export function clampRuns(
  runs: TextRun[] | undefined,
  len: number,
): TextRun[] | undefined {
  if (!runs || runs.length === 0) return undefined;
  const styles = runsToCharStyles(len, runs);
  const out = charStylesToRuns(styles);
  return out.length ? out : undefined;
}

/** CharStyle → 인라인 CSS 스타일 객체(React.CSSProperties 호환). */
export function styleToCss(s: CharStyle): {
  fontWeight?: number;
  color?: string;
  textDecoration?: string;
  fontSize?: string;
} {
  const css: {
    fontWeight?: number;
    color?: string;
    textDecoration?: string;
    fontSize?: string;
  } = {};
  if (s.bold) css.fontWeight = 700;
  if (s.color) css.color = s.color;
  const deco: string[] = [];
  if (s.underline) deco.push("underline");
  if (s.strike) deco.push("line-through");
  if (deco.length) css.textDecoration = deco.join(" ");
  if (s.size) css.fontSize = `${s.size}px`;
  return css;
}

/**
 * 렌더용 세그먼트 분해: text + runs → [{text, style}] 조각 배열.
 * run이 없거나 비면 통짜 조각 하나(스타일 없음)를 돌려준다. 렌더러는 각 조각을 span으로 그린다.
 */
export function toSegments(
  text: string,
  runs?: TextRun[],
): { text: string; style: CharStyle }[] {
  if (!text) return [];
  if (!runs || runs.length === 0) return [{ text, style: {} }];
  const styles = runsToCharStyles(text.length, runs);
  const segs: { text: string; style: CharStyle }[] = [];
  let i = 0;
  while (i < text.length) {
    let j = i + 1;
    while (j < text.length && sameStyle(styles[i], styles[j])) j++;
    segs.push({ text: text.slice(i, j), style: styles[i] });
    i = j;
  }
  return segs;
}
