
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Combatant, ColumnConfig, Condition, MonsterData } from './types';
import { DEFAULT_COLUMNS, CONDITIONS } from './constants';
import { parseMonsterXlsx, MonsterImportData } from './services/monsterService';
import CombatTable from './components/CombatTable';
import { 
  Plus, 
  Settings, 
  Download, 
  Upload, 
  Search, 
  ShieldAlert, 
  CheckSquare, 
  X,
  ArrowRightLeft,
  RotateCcw,
  Trash2,
  Eraser
} from 'lucide-react';

const App: React.FC = () => {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [history, setHistory] = useState<Combatant[][]>([]);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [allMonsters, setAllMonsters] = useState<MonsterImportData[]>([]);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to update combatants while saving history
  const updateCombatantsWithHistory = useCallback((next: Combatant[] | ((prev: Combatant[]) => Combatant[])) => {
    setHistory(prevHistory => [...prevHistory.slice(-49), combatants]);
    if (typeof next === 'function') {
      setCombatants(prev => next(prev));
    } else {
      setCombatants(next);
    }
  }, [combatants]);

  const revert = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setCombatants(lastState);
    setHistory(prev => prev.slice(0, -1));
  };

  // Auto-sort by initiative
  const sortedCombatants = useMemo(() => {
    return [...combatants].sort((a, b) => {
      const initA = typeof a.initiative === 'number' ? a.initiative : -Infinity;
      const initB = typeof b.initiative === 'number' ? b.initiative : -Infinity;
      return initB - initA;
    });
  }, [combatants]);

  const addCombatant = () => {
    const newCombatant: Combatant = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      hp: "",
      ac: "",
      initiative: "",
      movement: "",
      savingThrows: "",
      condition: Condition.None,
      concentration: false,
      data: {
        abilities: "",
        actions: "",
        resistances: "",
        immunities: "",
        spells: "",
        legendaryActions: "",
        reactions: "",
        vulnerabilities: "",
        bonusActions: "",
        damageInfo: ""
      },
      customColumns: {}
    };
    updateCombatantsWithHistory([...combatants, newCombatant]);
  };

  const updateCombatant = (id: string, updates: Partial<Combatant>) => {
    updateCombatantsWithHistory(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCombatant = (id: string) => {
    updateCombatantsWithHistory(prev => prev.filter(c => c.id !== id));
  };

  const addColumn = (name: string) => {
    if (columns.some(c => c.label.toLowerCase() === name.toLowerCase())) {
      alert("Column already exists");
      return;
    }
    const newId = name.toLowerCase().replace(/\s+/g, '_');
    const newCol: ColumnConfig = {
      id: newId,
      label: name,
      type: 'string',
      isCustom: true,
      isHidden: false,
      canHide: true
    };
    setColumns([...columns, newCol]);
    updateCombatantsWithHistory(prev => prev.map(c => ({
      ...c,
      customColumns: { ...c.customColumns, [newId]: "" }
    })));
  };

  const removeColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
    updateCombatantsWithHistory(prev => prev.map(c => {
      const newCustom = { ...c.customColumns };
      delete newCustom[id];
      return { ...c, customColumns: newCustom };
    }));
  };

  const toggleColumnVisibility = (id: string) => {
    setColumns(prev => prev.map(c => c.id === id && c.canHide ? { ...c, isHidden: !c.isHidden } : c));
  };

  const exportCSV = () => {
    const visibleCols = columns.filter(c => !c.isHidden);
    const headers = visibleCols.map(c => c.label).join(",");
    const rows = sortedCombatants.map(c => {
      return visibleCols.map(col => {
        if (col.isCustom) return `"${c.customColumns[col.id] || ''}"`;
        // @ts-ignore
        const val = c[col.id];
        return typeof val === 'object' ? '""' : `"${val}"`;
      }).join(",");
    });
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combat_session_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map(h => h.replace(/"/g, ''));
      
      const newCombatants: Combatant[] = lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/"/g, ''));
        const combatant: any = {
          id: Math.random().toString(36).substr(2, 9),
          data: {
            abilities: "",
            actions: "",
            resistances: "",
            immunities: "",
            spells: "",
            legendaryActions: "",
            reactions: "",
            vulnerabilities: "",
            bonusActions: "",
            damageInfo: ""
          },
          customColumns: {},
          condition: Condition.None,
          concentration: false
        };

        headers.forEach((h, i) => {
          const col = columns.find(c => c.label === h);
          if (col) {
            if (col.isCustom) {
              combatant.customColumns[col.id] = values[i];
            } else if (col.type === 'number') {
              combatant[col.id] = values[i] === "" ? "" : Number(values[i]);
            } else if (col.type === 'boolean') {
              combatant[col.id] = values[i] === "true";
            } else {
              combatant[col.id] = values[i];
            }
          }
        });
        return combatant as Combatant;
      });
      updateCombatantsWithHistory(prev => [...prev, ...newCombatants]);
    };
    reader.readAsText(file);
  };

  const handleImportMonster = async (monsters: MonsterImportData[], quantity: number) => {
    setIsLoading(true);
    try {
      const newCombatants: Combatant[] = [];
      monsters.forEach(data => {
        for (let i = 0; i < quantity; i++) {
          newCombatants.push({
            id: Math.random().toString(36).substr(2, 9),
            name: quantity > 1 ? `${data.name} ${i + 1}` : data.name,
            hp: data.hp,
            ac: data.ac,
            initiative: "",
            movement: data.movement,
            savingThrows: data.savingThrows || "",
            condition: Condition.None,
            concentration: false,
            data: {
              abilities: data.abilities || "",
              actions: data.actions || "",
              resistances: data.resistances || "",
              immunities: data.immunities || "",
              spells: data.spells || "",
              legendaryActions: data.legendaryActions || "",
              reactions: data.reactions || "",
              vulnerabilities: data.vulnerabilities || "",
              bonusActions: data.bonusActions || "",
              damageInfo: ""
            },
            customColumns: {}
          });
        }
      });
      updateCombatantsWithHistory(prev => [...prev, ...newCombatants]);
      setShowModal(null);
    } catch (err) {
      alert("Error importing monster stats.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-indigo-400 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8" />
            Combat Tracker
          </h1>
          <div className="h-6 w-px bg-slate-700" />
          <div className="flex gap-2">
            <button 
              onClick={revert}
              disabled={history.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-slate-700"
            >
              <RotateCcw size={16} /> Revert
            </button>
            <button 
              onClick={() => setShowModal('multi-damage')}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <ShieldAlert size={16} /> Multi Damage
            </button>
            <button 
              onClick={() => setShowModal('import-monster')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Search size={16} /> Import Monster
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-6 w-px bg-slate-700 mx-1" />
          <button 
            onClick={exportCSV}
            className="text-slate-300 hover:text-white flex items-center gap-1 text-sm p-2"
          >
            <Download size={18} /> Export
          </button>
          <label className="text-slate-300 hover:text-white flex items-center gap-1 text-sm p-2 cursor-pointer">
            <Upload size={18} /> Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <div className="h-6 w-px bg-slate-700 mx-1" />
          <button 
            onClick={() => setShowModal('settings')}
            className="text-slate-300 hover:text-white p-2"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950 p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button 
              onClick={addCombatant}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 flex items-center gap-2"
            >
              <Plus size={18} /> Add Row
            </button>
          </div>
          <button 
            onClick={() => setShowModal('add-column')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 flex items-center gap-2"
          >
            <Plus size={18} /> Add Column
          </button>
        </div>

        <CombatTable 
          combatants={sortedCombatants}
          columns={columns}
          onUpdate={updateCombatant}
          onRemove={removeCombatant}
          onRemoveColumn={removeColumn}
          onOpenData={(data) => {
            setModalData(data);
            setShowModal('data');
          }}
          onOpenHPControl={(id, currentHP) => {
            setModalData({ id, currentHP });
            setShowModal('hp-control');
          }}
        />
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white capitalize">{showModal.replace('-', ' ')}</h2>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-auto">
              {showModal === 'add-column' && (
                <AddColumnModal onAdd={(name) => { addColumn(name); setShowModal(null); }} />
              )}
              {showModal === 'data' && (
                <DataModal data={modalData} />
              )}
              {showModal === 'hp-control' && (
                <HPControlModal 
                  id={modalData.id} 
                  currentHP={modalData.currentHP} 
                  onApply={(id, newHP) => { updateCombatant(id, { hp: newHP }); setShowModal(null); }}
                />
              )}
              {showModal === 'multi-damage' && (
                <MultiDamageModal 
                  combatants={combatants} 
                  onApply={(ids, amount, isHeal) => {
                    updateCombatantsWithHistory(prev => prev.map(c => {
                      if (ids.includes(c.id)) {
                        const current = typeof c.hp === 'number' ? c.hp : 0;
                        return { ...c, hp: isHeal ? current + amount : current - amount };
                      }
                      return c;
                    }));
                    setShowModal(null);
                  }}
                />
              )}
              {showModal === 'import-monster' && (
                <ImportMonsterModal onImport={handleImportMonster} isLoading={isLoading} allMonsters={allMonsters} />
              )}
              {showModal === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase">Toggle Visible Columns</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {columns.filter(c => c.canHide).map(col => (
                        <label key={col.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={!col.isHidden} 
                            onChange={() => toggleColumnVisibility(col.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-200">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-700" />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase">Monster Database (XLSX)</h3>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center">
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-slate-500" />
                          <div className="text-slate-300 font-medium">
                            {allMonsters.length ? `${allMonsters.length} Monsters Loaded` : 'Upload Monsters XLSX'}
                          </div>
                          <div className="text-slate-500 text-xs">Select the local database file</div>
                        </div>
                        <input 
                          type="file" 
                          accept=".xlsx,.xls" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const monsters = await parseMonsterXlsx(file);
                                setAllMonsters(monsters);
                              } catch (err) {
                                alert("Error parsing XLSX file.");
                              }
                            }
                          }} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const AddColumnModal: React.FC<{ onAdd: (name: string) => void }> = ({ onAdd }) => {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <input 
        autoFocus
        type="text" 
        value={name} 
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name && onAdd(name)}
        placeholder="Column Name"
        className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg w-full"
      />
      <button 
        onClick={() => name && onAdd(name)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg"
      >
        Create Column
      </button>
    </div>
  );
};

const DataModal: React.FC<{ data: MonsterData }> = ({ data }) => {
  const Section = ({ title, content }: { title: string, content: string }) => (
    content ? (
      <div className="mb-6">
        <h3 className="text-indigo-400 font-bold uppercase text-xs mb-3 tracking-wider">{title}</h3>
        <div className="bg-slate-800/50 p-3 rounded-lg text-slate-300 text-sm border border-slate-700/50 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Resistances</h4>
          <p className="text-slate-200 text-sm">{data.resistances || "None"}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Immunities</h4>
          <p className="text-slate-200 text-sm">{data.immunities || "None"}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Vulnerabilities</h4>
          <p className="text-slate-200 text-sm">{data.vulnerabilities || "None"}</p>
        </div>
      </div>
      <Section title="Abilities" content={data.abilities} />
      <Section title="Spells" content={data.spells} />
      <Section title="Actions" content={data.actions} />
      <Section title="Bonus Actions" content={data.bonusActions} />
      <Section title="Reactions" content={data.reactions} />
      <Section title="Legendary Actions" content={data.legendaryActions} />
      {data.damageInfo && (
        <div>
          <h3 className="text-indigo-400 font-bold uppercase text-xs mb-3 tracking-wider">Additional Info</h3>
          <p className="bg-slate-800 p-3 rounded-lg text-slate-300 text-sm">{data.damageInfo}</p>
        </div>
      )}
    </div>
  );
};

const HPControlModal: React.FC<{ 
  id: string, 
  currentHP: number | "", 
  onApply: (id: string, newHP: number | "") => void 
}> = ({ id, currentHP, onApply }) => {
  const [amount, setAmount] = useState("");
  const [isHeal, setIsHeal] = useState(false);

  const apply = () => {
    const val = parseInt(amount);
    if (isNaN(val)) return;
    const current = typeof currentHP === 'number' ? currentHP : 0;
    onApply(id, isHeal ? current + val : current - val);
  };

  return (
    <div className={`p-8 rounded-xl transition-colors duration-300 ${isHeal ? 'bg-emerald-900/30' : 'bg-rose-900/30'}`}>
      <div className="flex flex-col gap-6 items-center">
        <h3 className={`text-2xl font-bold ${isHeal ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isHeal ? 'Healing' : 'Damage'} Input
        </h3>
        <div className="flex gap-4 w-full">
          <input 
            autoFocus
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && apply()}
            placeholder="Amount"
            className="flex-1 bg-slate-800 border border-slate-600 text-white text-3xl font-bold p-6 rounded-2xl text-center focus:ring-4 ring-slate-700"
          />
          <button 
            onClick={() => setIsHeal(!isHeal)}
            className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowRightLeft size={32} />
          </button>
        </div>
        <button 
          onClick={apply}
          className={`w-full font-bold p-4 rounded-2xl text-xl transition-all active:scale-95 ${isHeal ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'} text-white shadow-lg`}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

const MultiDamageModal: React.FC<{ 
  combatants: Combatant[], 
  onApply: (ids: string[], amount: number, isHeal: boolean) => void 
}> = ({ combatants, onApply }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [isHeal, setIsHeal] = useState(false);

  const toggleAll = () => {
    if (selected.length === combatants.length) setSelected([]);
    else setSelected(combatants.map(c => c.id));
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${isHeal ? 'bg-emerald-900/20' : 'bg-rose-900/20'} border border-slate-700`}>
        <div className="flex gap-4 items-center">
          <input 
            autoFocus
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-xl p-4 rounded-lg text-center"
          />
          <button 
            onClick={() => setIsHeal(!isHeal)}
            className="bg-slate-700 px-4 py-4 rounded-lg text-white font-bold"
          >
            {isHeal ? 'Heal' : 'Damage'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={toggleAll}
          className="text-indigo-400 text-sm font-bold hover:underline mb-2"
        >
          {selected.length === combatants.length ? 'Deselect All' : 'Select All'}
        </button>
        <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2">
          {combatants.map(c => (
            <label key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selected.includes(c.id) ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}>
              <input 
                type="checkbox" 
                checked={selected.includes(c.id)}
                onChange={() => {
                  if (selected.includes(c.id)) setSelected(prev => prev.filter(id => id !== c.id));
                  else setSelected(prev => [...prev, c.id]);
                }}
                className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-indigo-600"
              />
              <span className="text-slate-200 font-medium truncate">{c.name || `Unnamed #${c.id.slice(0,4)}`}</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        disabled={selected.length === 0 || !amount}
        onClick={() => onApply(selected, parseInt(amount), isHeal)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold p-4 rounded-xl text-lg transition-all"
      >
        Apply to {selected.length} Selected
      </button>
    </div>
  );
};

const ImportMonsterModal: React.FC<{ 
  onImport: (monsters: MonsterImportData[], qty: number) => void,
  isLoading: boolean,
  allMonsters: MonsterImportData[]
}> = ({ onImport, isLoading, allMonsters }) => {
  const [search, setSearch] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterImportData | null>(null);

  const filtered = allMonsters.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e?: any) => {
    e?.preventDefault();
    if (selectedMonster && typeof qty === 'number' && qty > 0) {
      onImport([selectedMonster], qty);
    }
  };

  return (
    <div className="space-y-6">
      {!allMonsters.length ? (
        <div className="p-8 text-center text-slate-500">
          No monster database loaded. Please go to Settings to upload an XLSX file.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Search Monster</label>
            <div className="relative">
              <input 
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search in database..."
                className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl pl-12 focus:ring-4 ring-indigo-500/20"
              />
              <Search className="absolute left-4 top-4 text-slate-500" />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-700 rounded-xl bg-slate-800/50">
            {filtered.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedMonster(m)}
                className={`w-full text-left p-3 border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors flex justify-between items-center ${selectedMonster?.name === m.name ? 'bg-indigo-900/30' : ''}`}
              >
                <span className="text-slate-200 font-medium">{m.name}</span>
                <span className="text-slate-500 text-xs">AC {m.ac} | HP {m.hp}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-4 text-slate-500 text-center">No monsters found</div>}
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Quantity</label>
            <input 
              type="number"
              min="1"
              value={qty}
              onChange={e => {
                const val = e.target.value;
                setQty(val === "" ? "" : parseInt(val));
              }}
              placeholder="Enter quantity..."
              className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-xl"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading || !selectedMonster || qty === "" || qty <= 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            {isLoading ? "Summoning..." : "Import Monster"}
          </button>
        </form>
      )}
    </div>
  );
};

export default App;
