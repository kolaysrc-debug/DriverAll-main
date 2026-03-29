"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch } from "@/lib/api/_core";
import {
  MENU_CATALOG,
  DEFAULT_GROUPS,
  type DashboardItem,
  type DashboardGroup,
} from "@/lib/dashboardCatalog";

function SortableCard({
  itemId,
  editMode,
  helpOpen,
  onToggleHelp,
}: {
  itemId: string;
  editMode: boolean;
  helpOpen: boolean;
  onToggleHelp: (id: string) => void;
}) {
  const meta: DashboardItem | undefined = MENU_CATALOG[itemId];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (!meta) return null;

  const colorClass = meta.color || "border-slate-800";

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {editMode ? (
        <div
          {...attributes}
          {...listeners}
          className={`rounded-xl border ${colorClass} bg-slate-900/40 p-3 cursor-grab active:cursor-grabbing hover:bg-slate-800/30 transition-colors`}
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs">⠿</span>
            <span>{meta.icon}</span>
            <span className="text-sm font-semibold">{meta.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 pl-8">{meta.description}</p>
        </div>
      ) : (
        <Link
          href={meta.href}
          className={`rounded-xl border ${colorClass} bg-slate-900/40 p-3 hover:bg-slate-800/30 hover:border-slate-700 transition-colors block`}
        >
          <div className="flex items-center gap-2">
            <span>{meta.icon}</span>
            <span className="text-sm font-semibold">{meta.label}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{meta.description}</p>
        </Link>
      )}

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleHelp(itemId); }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-700/60 hover:bg-slate-600 text-[10px] text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        title="Kullanım kılavuzu"
      >
        ?
      </button>

      {helpOpen && meta.helpText && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-lg border border-blue-800/40 bg-blue-950/95 p-3 text-xs text-blue-200 shadow-xl backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-blue-300 mb-1">{meta.icon} {meta.label} — Kullanım Kılavuzu</div>
              <p className="leading-relaxed">{meta.helpText}</p>
            </div>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleHelp(itemId); }}
              className="text-blue-400 hover:text-blue-200 shrink-0 text-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DroppableGroup({
  group,
  editMode,
  helpOpenId,
  onToggleHelp,
}: {
  group: DashboardGroup;
  editMode: boolean;
  helpOpenId: string | null;
  onToggleHelp: (id: string) => void;
}) {
  const itemIds = group.items.map((i) => i.itemId);

  return (
    <div>
      <h2 className="text-sm font-medium text-slate-400 px-1 pt-2 pb-1">{group.title}</h2>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {group.items.map((item) => (
            <SortableCard
              key={item.itemId}
              itemId={item.itemId}
              editMode={editMode}
              helpOpen={helpOpenId === item.itemId}
              onToggleHelp={onToggleHelp}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function OverlayCard({ itemId }: { itemId: string }) {
  const meta = MENU_CATALOG[itemId];
  if (!meta) return null;
  return (
    <div className="rounded-xl border border-orange-500/50 bg-slate-900/95 p-3 shadow-2xl cursor-grabbing w-56">
      <div className="flex items-center gap-2">
        <span>{meta.icon}</span>
        <span className="text-sm font-semibold">{meta.label}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">{meta.description}</p>
    </div>
  );
}

export default function DashboardGrid({ isAdmin }: { isAdmin: boolean }) {
  const [groups, setGroups] = useState<DashboardGroup[]>(DEFAULT_GROUPS);
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [helpOpenId, setHelpOpenId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadLayout = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/dashboard-layout/my");
      if (data?.layout?.groups?.length) {
        setGroups(data.layout.groups);
        setIsCustom(!!data.isCustom);
      }
    } catch { /* use defaults */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => { loadLayout(); }, [loadLayout]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    if (activeItemId === overItemId) return;

    const activeGroupIdx = groups.findIndex((g) => g.items.some((i) => i.itemId === activeItemId));
    const overGroupIdx = groups.findIndex((g) => g.items.some((i) => i.itemId === overItemId));

    if (activeGroupIdx === -1 || overGroupIdx === -1) return;
    if (activeGroupIdx === overGroupIdx) return;

    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      const activeItemIdx = next[activeGroupIdx].items.findIndex((i) => i.itemId === activeItemId);
      const [movedItem] = next[activeGroupIdx].items.splice(activeItemIdx, 1);
      const overItemIdx = next[overGroupIdx].items.findIndex((i) => i.itemId === overItemId);
      next[overGroupIdx].items.splice(overItemIdx, 0, movedItem);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    if (activeItemId === overItemId) return;

    const groupIdx = groups.findIndex((g) => g.items.some((i) => i.itemId === activeItemId));
    if (groupIdx === -1) return;

    const sameGroupCheck = groups[groupIdx].items.some((i) => i.itemId === overItemId);
    if (!sameGroupCheck) return;

    setGroups((prev) => {
      const next = prev.map((g) => ({ ...g, items: [...g.items] }));
      const oldIdx = next[groupIdx].items.findIndex((i) => i.itemId === activeItemId);
      const newIdx = next[groupIdx].items.findIndex((i) => i.itemId === overItemId);
      next[groupIdx].items = arrayMove(next[groupIdx].items, oldIdx, newIdx);
      next[groupIdx].items.forEach((item, idx) => { item.order = idx; });
      return next;
    });
  }

  async function saveMyLayout() {
    setSaving(true);
    try {
      await apiFetch("/api/admin/dashboard-layout/my", {
        method: "PUT",
        body: JSON.stringify({ groups }),
      });
      setIsCustom(true);
      setEditMode(false);
    } catch (e: unknown) {
      alert((e as Error)?.message || "Kayıt hatası");
    } finally { setSaving(false); }
  }

  async function resetToDefault() {
    if (!confirm("Düzeni varsayılana döndürmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch("/api/admin/dashboard-layout/my", { method: "DELETE" });
      const data = await apiFetch("/api/admin/dashboard-layout/default");
      if (data?.layout?.groups?.length) {
        setGroups(data.layout.groups);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
      setIsCustom(false);
      setEditMode(false);
    } catch (e: unknown) {
      alert((e as Error)?.message || "Sıfırlama hatası");
    }
  }

  async function setAsDefault() {
    if (!confirm("Bu düzeni TÜM KULLANICILARIN varsayılanı olarak kaydetmek istiyor musunuz?")) return;
    try {
      await apiFetch("/api/admin/dashboard-layout/default", {
        method: "PUT",
        body: JSON.stringify({ groups }),
      });
      alert("Varsayılan düzen güncellendi");
    } catch (e: unknown) {
      alert((e as Error)?.message || "Hata");
    }
  }

  function toggleHelp(id: string) {
    setHelpOpenId((prev) => (prev === id ? null : id));
  }

  if (!loaded) return null;

  const allItemIds = groups.flatMap((g) => g.items.map((i) => i.itemId));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button onClick={() => setEditMode(true)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors flex items-center gap-1.5">
              ✏️ Düzeni Düzenle
            </button>
          ) : (
            <>
              <button onClick={saveMyLayout} disabled={saving}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-orange-700 hover:bg-orange-600 text-white font-semibold transition-colors disabled:opacity-50">
                {saving ? "Kaydediliyor..." : "💾 Kaydet"}
              </button>
              <button onClick={() => { setEditMode(false); loadLayout(); }}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                İptal
              </button>
              {isAdmin && (
                <button onClick={setAsDefault}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-blue-200 transition-colors">
                  🔒 Varsayılan Olarak Kaydet
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCustom && !editMode && (
            <button onClick={resetToDefault}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
              ↩ Varsayılana Dön
            </button>
          )}
          {isCustom && (
            <span className="text-[10px] text-orange-400/60">Özelleştirilmiş düzen</span>
          )}
        </div>
      </div>

      {editMode && (
        <div className="rounded-lg border border-amber-800/30 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-300">
          💡 Kartları sürükleyerek gruplar arası taşıyabilir veya sıralarını değiştirebilirsiniz.
        </div>
      )}

      {editMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
            {groups.map((group) => (
              <DroppableGroup
                key={group.groupId}
                group={group}
                editMode={true}
                helpOpenId={helpOpenId}
                onToggleHelp={toggleHelp}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? <OverlayCard itemId={activeId} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        groups.map((group) => (
          <DroppableGroup
            key={group.groupId}
            group={group}
            editMode={false}
            helpOpenId={helpOpenId}
            onToggleHelp={toggleHelp}
          />
        ))
      )}
    </div>
  );
}
