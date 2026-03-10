// PATH: app/admin/unified-engine-test/page.tsx
// VERSION: ACCORDION-HIERARCHY-STABLE
"use client";

import { useState, useEffect } from 'react';
import { listFieldGroups, updateFieldGroupNode, updateFieldGroup } from '@/lib/api/fieldGroups';

export default function CleanHierarchyPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [allNodes, setAllNodes] = useState<any[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [issuanceDates, setIssuanceDates] = useState<Record<string, string>>({});
  const [birthDate, setBirthDate] = useState<string>('1985-01-01');
  const [editingItem, setEditingItem] = useState<{type: 'group' | 'node', data: any} | null>(null);
  
  // Grupların açık/kapalı durumunu tutan state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const data = await listFieldGroups();
      const fetchedGroups = Array.isArray(data) ? data : [];
      setGroups(fetchedGroups);
      
      const flatNodes = fetchedGroups.flatMap((g: any) => 
        g.nodes.map((n: any) => ({
          ...n,
          groupId: g._id,
          groupLabel: g.groupLabel,
          effectiveV: n.validityYears ?? g.defaultValidityYears ?? 5,
          effectiveA: n.maxAgeLimit ?? g.defaultMaxAgeLimit ?? 65,
          dbV: n.validityYears, dbA: n.maxAgeLimit,
          dbS: n.alertStartMonth, dbF: n.alertFrequency,
          dbCoverage: n.coverage || [],
          dbRequiredWith: n.requiredWith || []
        }))
      );
      setAllNodes(flatNodes);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!editingItem) return;
    try {
      if (editingItem.type === 'node') {
        await updateFieldGroupNode(editingItem.data.groupId, editingItem.data.key, {
          coverage: editingItem.data.dbCoverage,
          requiredWith: editingItem.data.dbRequiredWith,
        });
      } else {
        await updateFieldGroup(editingItem.data._id, {
          groupLabel: editingItem.data.groupLabel,
          durationYearsFromIssue: editingItem.data.defaultValidityYears === "" ? null : Number(editingItem.data.defaultValidityYears),
          maxAge: editingItem.data.defaultMaxAgeLimit === "" ? null : Number(editingItem.data.defaultMaxAgeLimit),
        });
      }
      alert("Başarıyla kaydedildi.");
      await loadData();
      setEditingItem(null);
    } catch (err: any) { alert(err.message); }
  };

  // Açma kapama fonksiyonu
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="p-8 bg-[#020617] min-h-screen text-slate-300 font-sans">
      <div className="max-w-[1750px] mx-auto grid grid-cols-12 gap-8">
        
        {/* SOL PANEL */}
        <div className="col-span-5 flex flex-col gap-6 h-[calc(100vh-64px)]">
          <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 shadow-2xl flex-shrink-0">
            <h2 className="text-[10px] font-black text-blue-500 mb-6 uppercase tracking-widest italic tracking-widest">Kontrol Paneli</h2>
            
            {editingItem ? (
              <div className="space-y-6">
                <div className="p-5 bg-black/40 rounded-2xl border border-slate-800 space-y-5">
                  <p className="text-white font-bold text-sm uppercase italic border-b border-slate-800 pb-2">
                    {editingItem.type === 'group' ? `Grup: ${editingItem.data.groupLabel}` : `Belge: ${editingItem.data.label}`}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase font-black">Geçerlilik Yılı</label>
                      <input type="number" 
                        value={editingItem.type === 'group' ? (editingItem.data.defaultValidityYears ?? "") : (editingItem.data.dbV ?? "")}
                        onChange={e => {
                          const val = e.target.value;
                          if(editingItem.type === 'group') setEditingItem({...editingItem, data: {...editingItem.data, defaultValidityYears: val}});
                          else setEditingItem({...editingItem, data: {...editingItem.data, dbV: val}});
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase font-black">Yaş Sınırı</label>
                      <input type="number" 
                        value={editingItem.type === 'group' ? (editingItem.data.defaultMaxAgeLimit ?? "") : (editingItem.data.dbA ?? "")}
                        onChange={e => {
                          const val = e.target.value;
                          if(editingItem.type === 'group') setEditingItem({...editingItem, data: {...editingItem.data, defaultMaxAgeLimit: val}});
                          else setEditingItem({...editingItem, data: {...editingItem.data, dbA: val}});
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs outline-none" />
                    </div>
                  </div>

                  {editingItem.type === 'node' && (
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                       <label className="text-[9px] text-emerald-400 font-black uppercase italic tracking-widest">Grup İçi Kapsama (Hiyerarşi)</label>
                       <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto p-2 bg-black/20 rounded-xl">
                          {allNodes
                            .filter(n => n.groupId === editingItem.data.groupId && n.key !== editingItem.data.key)
                            .map(n => (
                            <label key={n.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-all">
                              <input type="checkbox" 
                                checked={editingItem.data.dbCoverage.includes(n.key)}
                                onChange={e => {
                                  const current = editingItem.data.dbCoverage;
                                  const next = e.target.checked ? [...current, n.key] : current.filter((k:any) => k !== n.key);
                                  setEditingItem({...editingItem, data: {...editingItem.data, dbCoverage: next}});
                                }} 
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600" /> 
                              <span className="text-[11px] font-bold">{n.label}</span>
                            </label>
                          ))}
                       </div>
                    </div>
                  )}
                </div>
                <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">Sistemi Güncelle</button>
              </div>
            ) : <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-800 text-[10px] font-black uppercase">Seçim Yapın</div>}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-10">
            {groups.map(group => {
              const isOpen = !!expandedGroups[group._id];
              return (
                <div key={group._id} className="bg-slate-900/30 rounded-3xl border border-slate-800 overflow-hidden transition-all">
                  {/* GRUP BAŞLIĞI - ACCORDION TOGGLE */}
                  <div 
                    onClick={() => {
                      setEditingItem({type: 'group', data: group});
                      toggleGroup(group._id);
                    }} 
                    className={`p-4 flex justify-between items-center cursor-pointer transition-all ${editingItem?.type === 'group' && editingItem.data._id === group._id ? 'bg-blue-600 text-white' : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-[10px] font-black uppercase text-inherit">{group.groupLabel}</span>
                    </div>
                    <span className="text-[8px] font-mono opacity-60 italic">Genel: {group.defaultValidityYears}Y</span>
                  </div>

                  {/* SADECE AÇIKSA GÖSTERİLEN BELGELER */}
                  {isOpen && (
                    <div className="p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {allNodes.filter(n => n.groupId === group._id).map(node => (
                        <div key={node.key} onClick={(e) => { e.stopPropagation(); setEditingItem({type: 'node', data: node}); }}
                          className={`p-3 rounded-xl flex flex-col gap-2 cursor-pointer border transition-all ${editingItem?.data?.key === node.key ? 'bg-blue-600/10 border-blue-500 shadow-md' : 'bg-transparent border-transparent hover:border-slate-800'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">{node.label}</span>
                            <span className="text-[9px] font-black text-slate-700">{node.effectiveV}Y</span>
                          </div>
                          {node.dbCoverage.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {node.dbCoverage.map((ckey: string) => (
                                <span key={ckey} className="text-[7px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase border border-emerald-500/20">
                                  ✓ {allNodes.find(an => an.key === ckey)?.label || ckey}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SAĞ PANEL: ANALİZ */}
        <div className="col-span-7 bg-[#010413] rounded-[3rem] p-12 border border-slate-800 shadow-2xl flex flex-col">
          <h2 className="text-3xl font-black text-white italic uppercase mb-10 border-l-4 border-blue-600 pl-4">Simülasyon Motoru</h2>
          <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
             <div className="bg-slate-900/10 rounded-3xl p-6 border border-slate-800 overflow-y-auto custom-scrollbar">
                {allNodes.map(node => (
                  <div key={node.key} className={`p-4 rounded-2xl mb-2 flex items-center gap-3 transition-all ${selectedKeys.includes(node.key) ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-slate-950/40 border border-slate-900 opacity-40'}`}>
                    <input type="checkbox" checked={selectedKeys.includes(node.key)} onChange={() => setSelectedKeys(prev => prev.includes(node.key) ? prev.filter(k => k !== node.key) : [...prev, node.key])} />
                    <span className="text-xs font-bold">{node.label}</span>
                  </div>
                ))}
             </div>
             <div className="bg-black/40 rounded-3xl p-6 border border-slate-800 overflow-y-auto custom-scrollbar">
                {selectedKeys.map(k => {
                   const isCovered = selectedKeys.some(other => allNodes.find(n => n.key === other)?.dbCoverage?.includes(k));
                   const node = allNodes.find(n => n.key === k);
                   return (
                     <div key={k} className={`p-4 rounded-xl mb-2 flex justify-between items-center ${isCovered ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/20' : 'bg-blue-600/5 text-blue-400 border border-blue-600/20'}`}>
                        <span className="text-[10px] font-black uppercase">{node?.label}</span>
                        <span className="text-[9px] font-bold">{isCovered ? 'KAPSANDI' : node?.effectiveV + ' YIL'}</span>
                     </div>
                   );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}