/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Requirement, Assignee, Column } from './types';

export const INITIAL_ASSIGNEES: Assignee[] = [
  { id: 'USR-001', name: '김민준', avatarUrl: '' },
  { id: 'USR-002', name: '이영희', avatarUrl: '' },
  { id: 'USR-003', name: '박서준', avatarUrl: '' },
  { id: 'USR-004', name: '최우식', avatarUrl: '' },
  { id: 'USR-005', name: '정지원', avatarUrl: '' },
  { id: 'USR-006', name: '강수민', avatarUrl: '' }
];

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'id', label: 'Req.ID' },
  { id: 'custom_index', label: '순번', isCustom: true },
  { id: 'custom_lv1', label: 'Req.Lv1', isCustom: true },
  { id: 'custom_lv2', label: 'Req.Lv.2', isCustom: true },
  { id: 'title', label: 'Req.description' },
  { id: 'priority', label: '우선순위' },
  { id: 'status', label: '상태' },
  { id: 'custom_role', label: '직능', isCustom: true },
  { id: 'assignees', label: '담당자' },
  { id: 'custom_en', label: 'clarification(영문)', isCustom: true },
  { id: 'custom_kr', label: 'clarification(국문)', isCustom: true },
  { id: 'design_impact', label: '설계영향', isCustom: true },
  { id: 'detail_content', label: '세부내용', isCustom: true },
  { id: 'compliance', label: 'compliance', isCustom: true },
  { id: 'history', label: 'history', isCustom: true },
  { id: 'detail_reason_en', label: '세부사유(영문)', isCustom: true },
  { id: 'deviation', label: 'deviation', isCustom: true },
  { id: 'price_impact', label: '가격impact', isCustom: true }
];

const reqs: Requirement[] = Array.from({ length: 30 }, (_, i) => {
  const roles = ['선체', '기장', '전장', '선장', '통신', '제어', '배관', '의장'];
  const statuses: ('TODO' | 'IN_PROGRESS' | 'DONE')[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  const priorities: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];
  const compliances = ['C', 'NC', 'PC'];
  const designImpacts = ['High', 'Medium', 'Low', 'None'];
  
  const role = roles[i % roles.length];
  const status = statuses[i % 3];
  const priority = priorities[i % 3];
  const assignee = [INITIAL_ASSIGNEES[i % 6]];
  const compliance = compliances[i % 3];
  const impact = designImpacts[i % 4];

  return {
    id: `REQ-${String(i + 1).padStart(3, '0')}`,
    title: `요구조건 명세 ${i + 1} - ${role} 설계 검토`,
    priority,
    assignees: assignee,
    dueDate: `2023-11-${String((i % 28) + 1).padStart(2, '0')}`,
    status,
    customColumns: {
      custom_index: String(i + 1),
      custom_lv1: `${role} 설계`,
      custom_lv2: `${role} 세부 설계`,
      custom_role: role,
      custom_kr: `상세 설명 ${i + 1}: ${role} 파트 표준 준수 필요.`,
      custom_en: `Detail ${i + 1}: Comply with ${role} standards.`,
      design_impact: impact,
      detail_content: `세부 요구 내용 ${i + 1}`,
      compliance: compliance,
      history: `Rev.${i % 3}`,
      detail_reason_en: `Detail reason ${i + 1}`,
      deviation: `Dev-${i % 5}`,
      price_impact: `${(i % 10) * 1000} USD`
    }
  };
});

export const INITIAL_REQUIREMENTS = reqs;

export const CE_EXAMPLE_COLUMNS: Column[] = [
  { id: 'id', label: 'Req.ID' },
  { id: 'apply', label: '적용', isCustom: true, type: 'checkbox' },
  { id: 'custom_index', label: '순번', isCustom: true },
  { id: 'status', label: '상태' },
  { id: 'role', label: '직능', isCustom: true },
  { id: 'assignees', label: '담당자' },
  { id: 'budget_code', label: '예산코드', isCustom: true },
  { id: 'wbs', label: 'wbs', isCustom: true },
  { id: 'item', label: 'item(국문)', isCustom: true },
  { id: 'spec_qty', label: '주요사양/세부 수량', isCustom: true },
  { id: 'base_estimate', label: '기준/견적', isCustom: true },
  { id: 'currency', label: '화폐', isCustom: true },
  { id: 'maker', label: '제작사명', isCustom: true },
  { id: 'note', label: '비고', isCustom: true },
  { 
    id: 'usd_amount', 
    label: '금액(usd)', 
    isCustom: true, 
    type: 'currency_usd', 
    currencyAmountColId: 'amount_quote', 
    currencyCodeColId: 'currency' 
  },
  { id: 'time_diff', label: '시점차이(개월수)', isCustom: true },
  { id: 'amount_quote', label: '금액(견적화폐)', isCustom: true },
  { id: 'currency_quote', label: '화폐(견적)', isCustom: true },
  { 
    id: 'final_usd', 
    label: '최종금액(usd)', 
    isCustom: true, 
    type: 'currency_usd', 
    currencyAmountColId: 'amount_quote', 
    currencyCodeColId: 'currency_quote' 
  }
];

const ceReqs: Requirement[] = Array.from({ length: 30 }, (_, i) => {
  const roles = ['선체', '기장', '전장', '선장', '통신', '제어', '배관', '의장'];
  const statuses: ('TODO' | 'IN_PROGRESS' | 'DONE')[] = ['TODO', 'IN_PROGRESS', 'DONE'];
  const makers = ['현대중공업', '삼성중공업', '한화오션', '두산엔진', 'ABB', 'Kongsberg'];
  
  const role = roles[i % roles.length];
  const status = statuses[i % 3];
  const currency = i % 2 === 0 ? 'USD' : (i % 3 === 0 ? 'EUR' : 'KRW');
  const wbs = `${(i % 7 + 1)}00`;
  const baseEst = i % 2 === 0 ? '기준' : '견적';
  const amount = String((i + 1) * 15000);
  const timeDiff = String(i % 12);

  return {
    id: `CE-${String(i + 1).padStart(3, '0')}`,
    title: `CE 항목 ${i + 1}`,
    dueDate: '',
    status,
    assignees: [INITIAL_ASSIGNEES[i % 6]],
    priority: 'MEDIUM',
    customColumns: {
      apply: i % 4 !== 0 ? 'true' : 'false',
      custom_index: String(i + 1),
      role: role,
      budget_code: `BGT-2024-${String(i + 1).padStart(3, '0')}`,
      wbs: wbs,
      item: `${role} 관련 장비 ${i + 1}`,
      spec_qty: `Spec-${i + 1} / ${i % 5 + 1} set`,
      base_estimate: baseEst,
      currency: currency,
      maker: makers[i % makers.length],
      note: `비고 사항 ${i + 1}`,
      usd_amount: amount, 
      time_diff: timeDiff,
      amount_quote: (Number(amount) * 1.1).toFixed(0),
      currency_quote: currency,
      final_usd: (Number(amount) * 1.1).toFixed(0)
    }
  };
});

export const CE_EXAMPLE_REQUIREMENTS = ceReqs;

export const INFLATION_DATES_COLUMNS: Column[] = [
  { id: 'id', label: 'ID' },
  { id: 'title', label: '호선' },
  { id: 'ship_name', label: '호선명', isCustom: true, type: 'text' },
  { id: 'ship_type', label: '함종', isCustom: true, type: 'text' },
  { id: 'contract_date', label: '계약일', isCustom: true, type: 'date' },
  { id: 'wc_date', label: 'W/C', isCustom: true, type: 'date' },
  { id: 'kl_date', label: 'K/L', isCustom: true, type: 'date' },
  { id: 'lc_date', label: 'L/C', isCustom: true, type: 'date' },
  { id: 'dl_date', label: 'D/L', isCustom: true, type: 'date' },
  { id: 'quote_date', label: '본함 견적일 기준', isCustom: true, type: 'date' },
  { id: 'show_in_timeline', label: '타임라인 표시', isCustom: true, type: 'checkbox' }
];

const shipReqs: Requirement[] = Array.from({ length: 30 }, (_, i) => {
  const shipTypes = ['수상함', '수중함', '지원함', '상선', '특수선'];
  return {
    id: `SHIP-${String(i + 1).padStart(3, '0')}`,
    title: `H${String(i + 1001).padStart(4, '0')}`,
    dueDate: '',
    status: 'DONE',
    assignees: [],
    priority: 'MEDIUM',
    customColumns: {
      ship_name: `호선명 ${i + 1}`,
      ship_type: shipTypes[i % shipTypes.length],
      show_in_timeline: 'true',
      contract_date: `201${i % 10}-03-10`,
      wc_date: `201${i % 10}-09-15`,
      kl_date: `201${i % 10}-02-20`,
      lc_date: `201${i % 10}-08-30`,
      dl_date: `201${i % 10}-01-15`,
      quote_date: `2030-06-01`
    }
  };
});

export const INFLATION_DATES_REQUIREMENTS = shipReqs;

export const INFLATION_ESTIMATES_COLUMNS: Column[] = [
  { id: 'id', label: 'ID' },
  { id: 'ship_name', label: '호선명 (매치 키)', isCustom: true, type: 'text' },
  { id: 'item_name', label: '항목명', isCustom: true, type: 'text' },
  { id: 'amount', label: '견적 금액', isCustom: true, type: 'number' }
];

export const INFLATION_ESTIMATES_REQUIREMENTS: Requirement[] = [];
