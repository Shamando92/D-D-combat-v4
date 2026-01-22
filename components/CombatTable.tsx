
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Combatant, ColumnConfig, Condition } from '../types';
import { CONDITIONS } from '../constants';
// Added ArrowRightLeft to imports to fix the "Cannot find name 'ArrowRightLeft'" error
import { Trash2, ExternalLink, MinusCircle, ArrowRightLeft } from 'lucide-react';

interface CombatTableProps {
  combatants: Combatant[];
  columns: ColumnConfig[];
  onUpdate: (id: string, updates: Partial<Combatant>) => void;
  onRemove: (id: string) => void;
  onRemoveColumn: (id: string) => void;
  onOpenData: (data: any) => void;
  onOpenHPControl: (id: string, currentHP: number | "") => void;
}

const CombatTable: React.FC<CombatTableProps> = ({ 
  combatants, 
  columns, 
  onUpdate, 
  onRemove, 
  onRemoveColumn,
  onOpenData,
  onOpenHPControl 
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [focusedCell, setFocusedCell] = useState<{ row: number, col: number } | null>(null);

  const visibleCols = columns.filter(c => !c.isHidden);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
      // Logic for arrows and enter/tab
      let nextRow = rowIdx;
      let nextCol = colIdx;

      if (e.key === 'ArrowUp') nextRow = Math.max(0, rowIdx - 1);
      else if (e.key === 'ArrowDown' || e.key === 'Enter') nextRow = Math.min(combatants.length - 1, rowIdx + 1);
      else if (e.key === 'ArrowLeft') nextCol = Math.max(0, colIdx - 1);
      else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        if (e.shiftKey && e.key === 'Tab') nextCol = Math.max(0, colIdx - 1);
        else nextCol = Math.min(visibleCols.length - 1, colIdx + 1);
      }

      if (nextRow !== rowIdx || nextCol !== colIdx) {
        if (e.key === 'Tab') return; // Let default browser tab handle it or block it
        e.preventDefault();
        const nextId = `cell-${nextRow}-${nextCol}`;
        document.getElementById(nextId)?.focus();
        setFocusedCell({ row: nextRow, col: nextCol });
      }
    }
  }, [combatants.length, visibleCols.length]);

  return (
    <div className="relative overflow-x-auto overflow-y-auto border border-slate-800 rounded-xl shadow-inner bg-slate-900/50 h-full">
      <table ref={tableRef} className="min-w-full border-collapse">
        <thead className="sticky top-0 z-20">
          <tr className="bg-slate-800 border-b border-slate-700">
            <th className="px-4 py-3 text-left w-12 sticky left-0 z-30 bg-slate-800"></th>
            {visibleCols.map((col, idx) => (
              <th key={col.id} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[120px]">
                <div className="flex items-center justify-between group">
                  {col.label}
                  {col.isCustom && (
                    <button 
                      onClick={() => onRemoveColumn(col.id)}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {combatants.map((c, rowIdx) => (
            <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors group">
              <td className="px-4 py-2 text-center sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800">
                <button 
                  onClick={() => onRemove(c.id)}
                  className="text-slate-600 hover:text-rose-500 transition-colors"
                >
                  <MinusCircle size={20} />
                </button>
              </td>
              
              {visibleCols.map((col, colIdx) => {
                const cellId = `cell-${rowIdx}-${colIdx}`;
                
                return (
                  <td key={col.id} className="px-1 py-1">
                    {col.id === 'hp' ? (
                      <div className="flex items-center gap-1 min-w-[100px]">
                        <input
                          id={cellId}
                          type="number"
                          value={c.hp}
                          onChange={e => onUpdate(c.id, { hp: e.target.value === "" ? "" : Number(e.target.value) })}
                          onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                          className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-sm focus:border-indigo-500"
                        />
                        <button 
                          onClick={() => onOpenHPControl(c.id, c.hp)}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                          <ArrowRightLeft size={16} />
                        </button>
                      </div>
                    ) : col.id === 'condition' ? (
                      <select
                        id={cellId}
                        value={c.condition}
                        onChange={e => onUpdate(c.id, { condition: e.target.value as Condition })}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-sm focus:border-indigo-500"
                      >
                        {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                      </select>
                    ) : col.id === 'concentration' ? (
                      <div className="flex justify-center">
                        <input
                          id={cellId}
                          type="checkbox"
                          checked={c.concentration}
                          onChange={e => onUpdate(c.id, { concentration: e.target.checked })}
                          onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                          className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    ) : col.id === 'data' ? (
                      <button
                        id={cellId}
                        onClick={() => onOpenData(c.data)}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        className="w-full bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40 border border-indigo-500/30 rounded px-2 py-1.5 text-xs font-bold uppercase flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                    ) : (
                      <input
                        id={cellId}
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={col.isCustom ? (c.customColumns[col.id] || "") : (c[col.id as keyof Combatant] as string | number)}
                        onChange={e => {
                          const val = col.type === 'number' ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
                          if (col.isCustom) {
                            onUpdate(c.id, { customColumns: { ...c.customColumns, [col.id]: val as string } });
                          } else {
                            onUpdate(c.id, { [col.id]: val });
                          }
                        }}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1.5 text-slate-200 text-sm focus:border-indigo-500"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {combatants.length === 0 && (
            <tr>
              <td colSpan={visibleCols.length + 1} className="py-20 text-center text-slate-600 font-medium italic">
                No combatants in encounter. Add one to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CombatTable;
