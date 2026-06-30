/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Requirement, Assignee } from '../types';

interface AssigneeDashboardProps {
  requirements: Requirement[];
  assigneesPool: Assignee[];
}

export default function AssigneeDashboard({ requirements, assigneesPool }: AssigneeDashboardProps) {
  
  // Calculate workloads
  const assigneeStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; assignee: Assignee }> = {};
    
    // Initialize with pool so even assignees with 0 tasks show up
    assigneesPool.forEach(a => {
      stats[a.id] = { total: 0, done: 0, assignee: a };
    });

    // Compute from requirements
    requirements.forEach(req => {
      req.assignees?.forEach(a => {
        if (!stats[a.id]) {
           stats[a.id] = { total: 0, done: 0, assignee: a };
        }
        stats[a.id].total += 1;
        const isDone = req.status === 'DONE' || (req.status as string) === '검토완료';
        if (isDone) {
          stats[a.id].done += 1;
        }
      });
    });

    // Sort by total tasks descending
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [requirements, assigneesPool]);

  return (
    <div className="bg-brand-surface border border-white/5 rounded-2xl p-4 h-full flex flex-col relative overflow-hidden backdrop-blur-md shadow-lg">
      {/* Decorative gradient orb */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
           <Users className="w-4 h-4 text-indigo-400" />
        </div>
        <h2 className="text-[13px] font-bold text-white/90">담당자 할당 현황</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
        {assigneeStats.map(stat => {
          const pct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
          return (
            <div key={stat.assignee.id} className="flex items-center gap-3 group">
               {/* Avatar */}
               <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                 {stat.assignee.avatarUrl ? (
                   <img src={stat.assignee.avatarUrl} alt={stat.assignee.name} className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-[11px] font-bold text-white/50">{stat.assignee.name.charAt(0)}</span>
                 )}
               </div>

               {/* Info & Progress */}
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-1">
                   <div className="text-[11px] font-medium text-white/80 truncate pr-2">
                     {stat.assignee.name}
                   </div>
                   <div className="flex items-baseline gap-1 text-[10px]">
                     <span className="font-mono text-white/80 font-bold">{stat.done}</span>
                     <span className="text-white/40">/</span>
                     <span className="font-mono text-white/50">{stat.total}</span>
                   </div>
                 </div>

                 {/* Progress Bar */}
                 <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%` }}
                    ></div>
                 </div>
               </div>
            </div>
          );
        })}

        {assigneeStats.length === 0 && (
          <div className="text-[11px] text-white/40 h-full flex items-center justify-center">
            등록된 담당자가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
