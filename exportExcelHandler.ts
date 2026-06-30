import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export const handleExportExcel = async (req: any, res: any, serverConfigPath: string) => {
  try {
    const { columns, requirements, exchangeRates = { KRW: 1, USD: 1400, EUR: 1500 } } = req.body;
    
    // Read config
    let config: any = {};
    if (fs.existsSync(serverConfigPath)) {
       config = JSON.parse(fs.readFileSync(serverConfigPath, 'utf-8'));
    }
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('요구사항 관리', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
    });

    const colCount = columns.length;
    const lastColLetter = sheet.getColumn(colCount).letter;

    // 1. 문서 메타 정보 및 타이틀 대시보드
    sheet.getRow(1).height = 40;
    sheet.mergeCells(`A1:${lastColLetter}1`);
    const titleCell = sheet.getCell('A1');
    titleCell.value = '요구조건 분석 (Requirements Dashboard)';
    titleCell.font = { name: '맑은 고딕', size: 20, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FF465FA0' } },
        { position: 1, color: { argb: 'FF1E2D5D' } }
      ]
    };

    // 2-3행: I~K 열이 없을 수도 있으므로 (colCount >= 3) 끝에서 3개
    if (colCount >= 3) {
      const startLetter = sheet.getColumn(colCount - 2).letter;
      sheet.mergeCells(`${startLetter}2:${lastColLetter}2`);
      sheet.mergeCells(`${startLetter}3:${lastColLetter}3`);
      
      const meta1 = sheet.getCell(`${startLetter}2`);
      
      const doneCount = requirements.filter((r:any) => r.status === 'DONE').length;
      const progress = Math.round((doneCount / requirements.length) * 100) || 0;
      
      meta1.value = `완료(진행) 현황 표시: ${progress}%`;
      meta1.font = { name: '맑은 고딕', color: { argb: 'FF3B82F6' }, bold: true };
      meta1.alignment = { horizontal: 'right', vertical: 'middle' };

      const meta2 = sheet.getCell(`${startLetter}3`);
      const warningCount = requirements.filter((r:any) => r.status === 'TODO' || r.status === 'IN_PROGRESS').length;
      meta2.value = `주의 / 미완료 내역 분석: ${warningCount}건`;
      meta2.font = { name: '맑은 고딕', color: { argb: 'FFEF4444' }, bold: true };
      meta2.alignment = { horizontal: 'right', vertical: 'middle' };
    }

    // 5-6행 헤더 준비
    const headerRow5 = sheet.getRow(5);
    const headerRow6 = sheet.getRow(6);
    
    columns.forEach((col: any, index: number) => {
      const cell5 = headerRow5.getCell(index + 1);
      const cell6 = headerRow6.getCell(index + 1);
      
      cell5.value = col.label; // 1층 헤더
      cell6.value = col.label; // 2층 헤더
      
      // 5행과 6행 병합 처리 (단순화: 위아래 병합)
      sheet.mergeCells(`${cell5.address}:${cell6.address}`);

      cell5.fill = {
        type: 'gradient', gradient: 'angle', degree: 90,
        stops: [{ position: 0, color: { argb: 'FF465FA0' } }, { position: 1, color: { argb: 'FF2B427D' } }]
      };
      cell5.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: '맑은 고딕' };
      cell5.alignment = { horizontal: 'center', vertical: 'middle' };

      cell6.fill = {
        type: 'gradient', gradient: 'angle', degree: 90,
        stops: [{ position: 0, color: { argb: 'FF2B427D' } }, { position: 1, color: { argb: 'FF1E2D5D' } }]
      };
      cell6.font = { bold: false, color: { argb: 'FFFFFFFF' }, name: '맑은 고딕' };
      cell6.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Right border medium
      cell5.border = { right: { style: 'medium', color: { argb: 'FF2B427D' } }, top: { style: 'medium', color: { argb: 'FF2B427D' } }};
      cell6.border = { right: { style: 'medium', color: { argb: 'FF2B427D' } }, bottom: { style: 'medium', color: { argb: 'FF2B427D' } } };

      sheet.getColumn(index + 1).width = 25; // Default width
    });

    sheet.autoFilter = `A6:${lastColLetter}6`;

        // 3. 데이터 삽입 및 스타일적용
    requirements.forEach((req: any, i: number) => {
      const rowIndex = 7 + i;
      const row = sheet.getRow(rowIndex);
      
      columns.forEach((col: any, colIdx: number) => {
        const cell = row.getCell(colIdx + 1);
        let val: any = '';
        
        if (col.id === 'id') val = req.id;
        else if (col.id === 'title') val = req.title || '';
        else if (col.id === 'priority') val = req.priority || '';
        else if (col.id === 'assignees') val = (req.assignees || []).map((a: any) => a.name).join(', ');
        else if (col.id === 'dueDate') val = req.dueDate || '';
        else if (col.id === 'status') val = req.status || '';
        else if (col.type === 'button') val = col.buttonLabel;
        else if (col.type === 'currency_usd') {
             const amountCol = columns.find((c: any) => c.label.includes('금액'));
             const currencyCol = columns.find((c: any) => c.label.includes('화폐'));
             if (amountCol && currencyCol) {
               const amount = Number(req.customColumns?.[amountCol.id] || 0);
               const curr = (req.customColumns?.[currencyCol.id] || '').toUpperCase();
               let krwValue = amount;
               if (curr.includes('WON') || curr.includes('KRW')) {
                 krwValue = amount * exchangeRates.KRW;
               } else if (curr.includes('EUR')) {
                 krwValue = amount * exchangeRates.EUR;
               } else if (curr.includes('US')) {
                 krwValue = amount * exchangeRates.USD;
               }
               const usdValue = krwValue / exchangeRates.USD;
               val = '$' + usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
             } else {
               val = 'N/A';
             }
        }
        else if (col.type === 'formula') {
           try {
             const today = new Date().toISOString().split('T')[0];
             let parsed = col.formula || '""';
             columns.forEach((c: any) => {
               const safeLabel = c.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
               const re = new RegExp(`\\[${safeLabel}\\]`, 'g');
               if (['title', 'dueDate', 'createdAt', 'status', 'priority'].includes(c.id)) {
                 parsed = parsed.replace(re, `(req.${c.id} || '')`);
               } else {
                 parsed = parsed.replace(re, `(isNaN(Number(req.customColumns?.['${c.id}'])) ? (req.customColumns?.['${c.id}'] || '') : Number(req.customColumns?.['${c.id}']))`);
               }
             });
             const SUM = (...args: any[]) => args.reduce((a, b: any) => a + (Number(b) || 0), 0);
             const AVERAGE = (...args: any[]) => args.length ? SUM(...args) / args.length : 0;
             const IF = (condition: boolean, trueVal: any, falseVal: any) => condition ? trueVal : falseVal;
             const func = new Function('req', 'today', 'SUM', 'AVERAGE', 'IF', 'KRW', 'USD', 'EUR', `try { return ${parsed}; } catch(e) { return "Error"; }`);
             val = String(func(req, today, SUM, AVERAGE, IF, exchangeRates.KRW, exchangeRates.USD, exchangeRates.EUR));
           } catch (e) {
             val = 'Error';
           }
        }
        else if (col.type === 'relation') {
           val = req.customColumns?.[col.id] || '';
        }
        else if (col.type === 'rollup') {
           const relColVal = req.customColumns?.[col.rollupRelId || ''] || '';
           const relIds = relColVal.split(',').map((s: string) => s.trim()).filter(Boolean);
           const linkedReqs = relIds.map((rid: string) => requirements.find((r: any) => r.id === rid)).filter(Boolean);
           if (linkedReqs.length > 0) {
             if (col.rollupAggType === 'count') {
               val = linkedReqs.length.toString();
             } else if (col.rollupAggType === 'percent_done') {
               const doneCount = linkedReqs.filter((r: any) => r.status === 'DONE').length;
               val = `${Math.round((doneCount / linkedReqs.length) * 100)}%`;
             }
           } else {
             val = '-';
           }
        }
        else if (col.type === 'status') {
           val = req.customColumns?.[col.id] || '';
        }
        else if (col.isCustom) val = req.customColumns?.[col.id] || '';

        // 숫자 타입 자동 파싱
        if (/^\d+(\.\d+)?$/.test(String(val))) {
          cell.value = Number(val);
        } else {
          cell.value = String(val);
        }

        // 동적 행 높이 조절
        const lines = String(val).split('\n').length;
        if (lines > 1) {
          const newHeight = lines >= 3 ? 45 : 30;
          if ((row.height || 22) < newHeight) row.height = newHeight;
        } else {
           if ((row.height || 0) < 22) row.height = 22;
        }

        cell.alignment = { wrapText: true, vertical: 'middle' };
        cell.font = { name: 'HD Medium', size: 8 };

        // Background
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        
        // border
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: colIdx === columns.length - 1 ? { argb: 'FFCBD5E1' } : undefined }
        };
      });
    });

    const exportPath = config.excelExportPath;
    
    if (exportPath) {
      // Save directly to path
      const targetDir = path.resolve(exportPath);
      if (!fs.existsSync(targetDir)) {
         fs.mkdirSync(targetDir, { recursive: true });
      }
      const filename = `Requirements_${new Date().toISOString().split('T')[0]}.xlsx`;
      const fullPath = path.join(targetDir, filename);
      await workbook.xlsx.writeFile(fullPath);
      return res.json({ success: true, savedPath: fullPath });
    } else {
      // Return as buffer for browser download
      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Requirements_Export.xlsx"');
      return res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Excel Export Error:', error);
    res.status(500).json({ error: String(error) });
  }
};
