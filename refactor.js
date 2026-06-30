const fs = require('fs');

let content = fs.readFileSync('src/components/CEDashboard.tsx', 'utf-8');

// 1. Add comparison graphs options
const graphOptionsString = `
                            {!isTableCategory && (
                              <div className="space-y-3 border border-brand-outline-variant/50 p-2 rounded-lg bg-brand-surface mb-3">
                                <div>
                                  <label className="block font-semibold mb-1 text-brand-on-surface-variant">차트 형태</label>
                                  <select
                                    className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                    value={configs[contextMenu.index]?.chartType || 'bar'}
                                    onChange={(e) => updateConfig(contextMenu.index, { chartType: e.target.value })}
                                  >
                                    <option value="bar">수직 막대 그래프</option>
                                    <option value="horizontalBar">수평 막대 그래프</option>
                                    <option value="line">선 그래프</option>
                                    <option value="pie">원형 그래프 (Pie)</option>
                                  </select>
                                </div>
                                <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3">
                                  <div>
                                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">X축 이름</label>
                                    <input
                                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                      value={configs[contextMenu.index]?.xAxisLabel || ""}
                                      onChange={(e) => updateConfig(contextMenu.index, { xAxisLabel: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-semibold mb-1 text-brand-on-surface-variant">Y축 이름</label>
                                    <input
                                      className="w-full p-1.5 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                      value={configs[contextMenu.index]?.yAxisLabel || ""}
                                      onChange={(e) => updateConfig(contextMenu.index, { yAxisLabel: e.target.value })}
                                    />
                                  </div>
                                </div>
                                
                                {configs[contextMenu.index]?.chartType !== 'pie' && (
                                  <div className="pt-2 border-t border-brand-outline-variant/50 space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-brand-on-surface-variant mb-1">
                                        비교 그래프 추가 (세부 대시보드 선택)
                                      </label>
                                      <select 
                                        className="w-full p-2 bg-brand-surface-highest border border-brand-outline-variant rounded outline-none text-sm"
                                        onChange={(e) => {
                                          const pIdx = Number(e.target.value);
                                          if (pIdx > 0) {
                                            const cols = configs[contextMenu.index]?.comparisonPanels || [];
                                            if (!cols.includes(pIdx) && pIdx !== contextMenu.index) updateConfig(contextMenu.index, { comparisonPanels: [...cols, pIdx] });
                                          }
                                        }}
                                        value=""
                                      >
                                        <option value="">선택하세요</option>
                                        {Array.from({ length: layoutCount - 1 }).map((_, i) => {
                                          if (i+1 === contextMenu.index) return null;
                                          return (
                                            <option key={i+1} value={i+1}>{configs[i+1]?.title || \`\${i+2}세부 대시보드\`}</option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                    {(configs[contextMenu.index]?.comparisonPanels?.length || 0) > 0 && (
                                      <div className="text-sm text-brand-on-surface-variant space-y-1">
                                        {configs[contextMenu.index].comparisonPanels.map((pIdx: number) => (
                                          <div key={pIdx} className="flex justify-between items-center bg-brand-surface-highest p-1 rounded">
                                            <span>{configs[pIdx]?.title || \`\${pIdx+1}세부 대시보드\`}</span>
                                            <button 
                                              className="text-red-500 hover:text-red-400 font-bold px-2"
                                              onClick={() => {
                                                const newPanels = configs[contextMenu.index].comparisonPanels.filter((p: number) => p !== pIdx);
                                                updateConfig(contextMenu.index, { comparisonPanels: newPanels });
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
`;
content = content.replace(/{!isTableCategory && \([\s\S]*?<\/>\n\s*\);\n\s*}\)\(\)}/g, (match) => {
    // Keep the wrapping logic but replace the internal graph settings
    let before = match.split('{!isTableCategory && (')[0];
    let after = '                      </>\n                    );\n                  })()}';
    return before + graphOptionsString + after;
});

// 2. Add combinedData
const combinedDataLogic = `const scaledTotalSum = totalSum / unit;
                      const comparisonPanels = pConfig.comparisonPanels || [];
                      const combinedData = scaledData.map((d: any) => {
                        const newD = { ...d };
                        comparisonPanels.forEach((pIdx: number) => {
                           const panelData = panelDataMap.get(pIdx)?.result || [];
                           const panelItem = panelData.find((pd: any) => pd.name === d.name);
                           newD[\`panel_\${pIdx}\`] = (panelItem?.value || 0) / unit;
                        });
                        return newD;
                      });`;
content = content.replace(/const scaledTotalSum = totalSum \/ unit;/g, combinedDataLogic);

// 3. Update BarChart to use combinedData and render multiple bars
content = content.replace(/<BarChart[\s\S]*?data={scaledData}/g, (m) => m.replace('scaledData', 'combinedData'));
content = content.replace(/<LineChart[\s\S]*?data={scaledData}/g, (m) => m.replace('scaledData', 'combinedData'));

content = content.replace(/<Bar dataKey="value" radius=\{\[4, 4, 0, 0\]\} fill=\{`url\(#colorGradient-\$\{index\}\)`\} \/>/g, 
\`<Bar dataKey="value" name={pConfig.title || "현재 대시보드"} radius={[4, 4, 0, 0]} fill={\`url(#colorGradient-\${index})\`} />
                          {comparisonPanels.map((pIdx: number, i: number) => (
                             <Bar key={pIdx} dataKey={\`panel_\${pIdx}\`} name={configs[pIdx]?.title || \`\${pIdx + 1}세부 대시보드\`} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                          ))}\`);

content = content.replace(/<Bar dataKey="value" radius=\{\[0, 4, 4, 0\]\} fill=\{`url\(#colorGradientH-\$\{index\}\)`\} \/>/g, 
\`<Bar dataKey="value" name={pConfig.title || "현재 대시보드"} radius={[0, 4, 4, 0]} fill={\`url(#colorGradientH-\${index})\`} />
                          {comparisonPanels.map((pIdx: number, i: number) => (
                             <Bar key={pIdx} dataKey={\`panel_\${pIdx}\`} name={configs[pIdx]?.title || \`\${pIdx + 1}세부 대시보드\`} fill={COLORS[i % COLORS.length]} radius={[0, 4, 4, 0]} />
                          ))}\`);

content = content.replace(/<Line type="monotone" dataKey="value" stroke="\#2563eb" strokeWidth=\{3\} \/>/g, 
\`<Line type="monotone" dataKey="value" name={pConfig.title || "현재 대시보드"} stroke="#2563eb" strokeWidth={3} />
                          {comparisonPanels.map((pIdx: number, i: number) => (
                             <Line key={pIdx} type="monotone" dataKey={\`panel_\${pIdx}\`} name={configs[pIdx]?.title || \`\${pIdx + 1}세부 대시보드\`} stroke={COLORS[(i+1) % COLORS.length]} strokeWidth={3} />
                          ))}\`);

fs.writeFileSync('src/components/CEDashboard.tsx', content);
