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

export interface Requirement {
  id: string;
  title: string;
  priority: Priority;
  assignees: Assignee[];
  dueDate: string;
  status: Status;
  customColumns?: Record<string, string>;
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
