/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Assignee {
  id: string;
  name: string;
  avatarUrl: string;
}

/**
 * 셀 텍스트 일부에 적용되는 서식 구간(run).
 * [start, end) 반열림 구간의 문자에 서식을 지정한다. 텍스트 자체(title/customColumns)는
 * 순수 문자열 정본으로 그대로 두고, 서식은 이 부가 레이어에만 담아 다중 사용자 병합·검색·
 * 정렬 호환성을 유지한다(서식은 최악의 경우에도 "상대 우선"으로 수렴, 텍스트는 3-way 병합).
 */
export interface TextRun {
  start: number;
  end: number;
  bold?: boolean;
  color?: string;
  underline?: boolean;
  strike?: boolean;
  size?: number; // 절대 px. 없으면 셀 기본 크기 상속.
}

export interface Requirement {
  id: string;
  title: string;
  priority: Priority;
  assignees: Assignee[];
  dueDate: string;
  status: Status;
  customColumns?: Record<string, string>;
  // 필드/컬럼 id(예: "title" 또는 커스텀 컬럼 id) → 서식 구간 배열.
  richText?: Record<string, TextRun[]>;
}

export type ColumnType = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'relation' | 'rollup' | 'formula' | 'button' | 'status' | 'currency_usd' | 'lookup' | 'inflation_pv';

export type CardConfig = 'total' | 'progress' | 'assignees' | 'high_risk' | string;

export interface CardItem {
  id: string;
  config: CardConfig;
  maxRows?: number;
  columns?: number;
  width?: number;
  height?: number;
  customTitle?: string;
  linkWithStatus?: boolean;
}

export interface TimelineConfig {
  targetColId: string;
  baseColId: string;
  titleColId: string;
  checkboxColId: string;
  manualStartDate: string | null;
  manualEndDate: string | null;
  showBaseDate: boolean;
  showBackgroundEvents: boolean;
  diffUnit: 'month' | 'year';
  extraLabelColId: string | null;
  baseDateLabels?: Record<number, string>;
}

export interface Column {
  id: string;
  label: string;
  isCustom?: boolean;
  type?: ColumnType;
  options?: string[]; // for select/status type
  groupName?: string; // LV.1 header
  description?: string; // hover description hover
  width?: number; // Added for column resizing
  rollupRelId?: string;       // Target relation column ID
  rollupTargetField?: string; // Target field in related requirement
  rollupAggType?: 'count' | 'sum' | 'avg' | 'percent_done'; // Rollup type
  formula?: string;           // Formula expression
  buttonAction?: string;      // predefined button action
  buttonLabel?: string;       // Custom label for button
  currencyAmountColId?: string; // Column ID for amount
  currencyCodeColId?: string;   // Column ID for currency code
  currencyExchangeRates?: {     // Exchange rates for KRW, USD, EUR based on KRW
    KRW: number;
    USD: number;
    EUR: number;
  };
  currencyDecimalPlaces?: number; // Optional decimal places for currency format
  decimalPlaces?: number; // General decimal places for number, formula, etc.
  lookupTabId?: string;             // For cross-tab lookup: target tab id
  lookupMatchMyColId?: string;      // For cross-tab lookup: column in current tab to match
  lookupMatchTargetColId?: string;  // For cross-tab lookup: column in target tab to match against
  lookupReturnTargetColId?: string; // For cross-tab lookup: column in target tab to return
  alignment?: 'left' | 'center' | 'right'; // Added for text alignment
  
  // For inflation_pv type
  inflationAmountColId?: string;
  inflationTitleColId?: string;
  inflationRefTabId?: string;
  inflationMatchColId?: string;
  inflationRefMatchColId?: string;
  inflationBaseDateColId?: string;
  inflationTargetDateColId?: string;
  inflationRates?: { word: string; rate: number; baseShip?: string; note?: string }[];
  truncateText?: boolean; // For limiting text to 2 lines
  backgroundColor?: string; // Custom column background color
}
