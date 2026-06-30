import React from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface BoardItem {
  id: string;
  num: number;
  author: string;
  content: string;
  isCompleted: boolean;
  actionTaken: string;
  remarks: string;
  createdAt: string;
}

interface BoardPageProps {
  boardItems: BoardItem[];
  setBoardItems: React.Dispatch<React.SetStateAction<BoardItem[]>>;
}

export default function BoardPage({ boardItems, setBoardItems }: BoardPageProps) {
  const handleAdd = () => {
    const newItem: BoardItem = {
      id: uuidv4(),
      num: boardItems.length > 0 ? Math.max(...boardItems.map(b => b.num)) + 1 : 1,
      author: '',
      content: '',
      isCompleted: false,
      actionTaken: '',
      remarks: '',
      createdAt: new Date().toISOString()
    };
    setBoardItems([newItem, ...boardItems]);
  };

  const handleChange = (id: string, field: keyof BoardItem, value: any) => {
    setBoardItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = (id: string) => {
    if (confirm('이 게시물을 삭제하시겠습니까?')) {
      setBoardItems(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full animate-fade-slide-up">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-outline-variant/40 pb-5 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-on-surface tracking-tight font-title-md">게시판 (요청 및 피드백)</h2>
          <p className="text-brand-on-surface-variant text-sm mt-1">사용자가 기능 개선에 대한 의견을 남기면 개발자가 확인후 조치합니다.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="px-4 py-2 bg-brand-primary text-brand-on-primary text-sm font-semibold rounded-lg hover:opacity-95 active:scale-95 transition-all duration-200 flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          의견 남기기
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-brand-outline-variant bg-brand-surface shadow-sm">
        <table className="w-full text-left border-collapse text-sm min-w-[800px]">
          <thead className="bg-brand-surface-high border-b border-brand-outline-variant sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-16 text-center">순번</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-32">작성자</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant min-w-[200px]">내용</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-24 text-center">완료여부</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-48">조치내용</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-32">비고</th>
              <th className="px-4 py-3 font-semibold text-brand-on-surface-variant w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-outline-variant/60">
            {boardItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-on-surface-variant">등록된 의견이 없습니다.</td>
              </tr>
            ) : (
              boardItems.map(item => (
                <tr key={item.id} className="hover:bg-brand-surface-lowest/50 transition-colors">
                  <td className="px-4 py-3 text-center text-brand-on-surface-variant text-xs">{item.num}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={item.author} 
                      onChange={e => handleChange(item.id, 'author', e.target.value)} 
                      className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/50 px-2 py-1 rounded text-sm"
                      placeholder="이름"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <textarea 
                      value={item.content} 
                      onChange={e => handleChange(item.id, 'content', e.target.value)} 
                      className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/50 px-2 py-1 rounded resize-y min-h-[40px] text-sm"
                      placeholder="기능 개선 요청 내용을 적어주세요."
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleChange(item.id, 'isCompleted', !item.isCompleted)}
                      className={`w-6 h-6 mx-auto rounded flex items-center justify-center cursor-pointer transition-colors ${item.isCompleted ? 'bg-brand-success text-brand-on-success' : 'border border-brand-outline-variant bg-brand-surface text-transparent opacity-50 hover:bg-brand-surface-high'}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <textarea 
                      value={item.actionTaken} 
                      onChange={e => handleChange(item.id, 'actionTaken', e.target.value)} 
                      className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/50 px-2 py-1 rounded resize-y min-h-[40px] text-sm"
                      placeholder="개발자 조치내용"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      value={item.remarks} 
                      onChange={e => handleChange(item.id, 'remarks', e.target.value)} 
                      className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-brand-primary/50 px-2 py-1 rounded text-sm"
                      placeholder="비고"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-brand-on-surface-variant hover:text-brand-error hover:bg-brand-error/10 rounded cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
