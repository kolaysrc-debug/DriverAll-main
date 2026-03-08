// DriverAll-main/drivercv-frontend/app/admin/groups/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AdminOnly from "@/components/AdminOnly";
import { useSearchParams } from "next/navigation";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function getToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(): HeadersInit {
  return { "Content-Type": "application/json", ...authHeaders() };
}

type FieldGroupNode = {
  key: string;
  label: string;
  parentKey: string | null;
  level: number;
  sortOrder: number;
  coverage?: string[];
  requiredWith?: string[];
  equivalentKeys?: string[];
  active: boolean;
};

type FieldGroup = {
  _id: string;
  groupKey: string;
  groupLabel: string;
  description?: string;
  country?: string;
  validityModel?: string;
  maxAge?: number | null;
  durationYearsFromIssue?: number | null;
  required?: boolean;
  sortOrder?: number;
  active: boolean;
  nodes: FieldGroupNode[];
};

function SortableGroupRow({
  group,
  idx,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  group: FieldGroup;
  idx: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group._id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      key={group._id}
      id={`group-row-${group._id}`}
      className={`border-t border-slate-800 ${
        selected ? "bg-slate-900/90" : "bg-slate-900/40"
      }`}
    >
      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{idx + 1}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="cursor-grab active:cursor-grabbing select-none rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-500"
          {...attributes}
          {...listeners}
          title="Sürükle-bırak ile sırala"
        >
          Drag
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-slate-100">{group.groupLabel}</div>
        <div className="text-xs text-slate-500">
          {group.groupKey} • Ülke: {group.country || "ALL"} • Node: {group.nodes?.length ?? 0}
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onSelect}
            className={`rounded-md border px-2 py-1 hover:bg-slate-800 ${
              selected
                ? "border-emerald-600 text-emerald-200"
                : "border-slate-600 text-slate-100"
            }`}
          >
            Bu grubu seç
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-sky-600 px-2 py-1 text-sky-100 hover:bg-sky-700/40"
          >
            Düzenle
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-rose-600 px-2 py-1 text-rose-100 hover:bg-rose-800/40"
          >
            Sil
          </button>
        </div>
      </td>
    </tr>
  );
}

type ApiListResponse = {
  groups: FieldGroup[];
};

function AdminFieldGroupsInner() {
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupKey, setNewGroupKey] = useState("");

  const returnTo = (searchParams?.get("returnTo") || "").trim();
  const prefillLabel = (searchParams?.get("prefillLabel") || "").trim();

  useEffect(() => {
    if (!prefillLabel) return;
    setNewGroupLabel((prev) => (prev ? prev : prefillLabel));
  }, [prefillLabel]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [lastUpdatedGroupId, setLastUpdatedGroupId] = useState<string>("");
  const [lastUpdatedNodeKey, setLastUpdatedNodeKey] = useState<string>("");
  const selectedGroup = useMemo(
    () => groups.find((g) => g._id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (!selectedGroupId) return;
    if (typeof window === "undefined") return;
    const el = document.getElementById(`group-row-${selectedGroupId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
  }, [selectedGroupId, groups.length]);

  useEffect(() => {
    if (!lastUpdatedGroupId) return;
    if (typeof window === "undefined") return;
    const el = document.getElementById(`group-row-${lastUpdatedGroupId}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lastUpdatedGroupId, groups.length]);

  useEffect(() => {
    if (!lastUpdatedNodeKey) return;
    if (typeof window === "undefined") return;
    const el = document.getElementById(`node-row-${lastUpdatedNodeKey}`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lastUpdatedNodeKey, selectedGroupId]);

  const [editingGroup, setEditingGroup] = useState<FieldGroup | null>(null);

  const editGroupPanelRef = useRef<HTMLDivElement | null>(null);
  const editNodePanelRef = useRef<HTMLDivElement | null>(null);

  // Node düzenleme
  const [editingNode, setEditingNode] = useState<FieldGroupNode | null>(null);
  const [editingNodeForm, setEditingNodeForm] = useState({
    key: "",
    label: "",
    parentKey: "",
    sortOrder: "",
    coverage: [] as string[],
    requiredWith: [] as string[],
    equivalentKeys: [] as string[],
    active: true,
  });

  const toggleArrayValue = (arr: string[], value: string) => {
    const v = String(value || "").trim();
    if (!v) return arr;
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  };

  const enforceAdrPrereq = (keyRaw: string, requiredWith: string[]) => {
    const key = String(keyRaw || "").trim().toUpperCase();
    if (!key.startsWith("ADR_")) return requiredWith;
    if (key === "ADR_BASIC") return requiredWith.filter((k) => k !== "ADR_BASIC");
    return requiredWith.includes("ADR_BASIC")
      ? requiredWith
      : [...requiredWith, "ADR_BASIC"];
  };

  const selectedGroupNodeKeys = useMemo(() => {
    return (selectedGroup?.nodes || []).map((n) => n.key).sort();
  }, [selectedGroup]);

  // ----------------------------------------------------------
  // Yardımcılar
  // ----------------------------------------------------------

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      let lastErr: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("/api/admin/field-groups", {
            cache: "no-store",
            headers: authHeaders(),
          });

          if (res.ok) {
            const data: ApiListResponse = await res.json();
            const next = (data.groups || []).slice().sort((a, b) => {
              const sa = Number((a as any)?.sortOrder ?? 0);
              const sb = Number((b as any)?.sortOrder ?? 0);
              if (sa !== sb) return sa - sb;
              return String(a.groupKey || "").localeCompare(String(b.groupKey || ""), "tr");
            });
            setGroups(next);
            lastErr = null;
            break;
          }

          if (res.status === 503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }

          throw new Error("Grup listesi alınamadı");
        } catch (e: any) {
          lastErr = e;
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
        }
      }

      if (lastErr) throw lastErr;
    } catch (err: any) {
      console.error("GET /api/admin/field-groups error:", err);
      setError(err?.message || "Grup listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistGroupOrder = async (ordered: FieldGroup[]) => {
    for (let i = 0; i < ordered.length; i++) {
      const g = ordered[i];
      const desired = i + 1;
      const res = await fetch(`/api/admin/field-groups/${g._id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({ sortOrder: desired }),
      });

      if (!res.ok) {
        let msg = "Sıralama kaydedilemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
    }
  };

  const startEditGroup = (group: FieldGroup) => {
    setEditingGroup(group);
  };

  useEffect(() => {
    if (!editingGroup) return;
    const el = editGroupPanelRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editingGroup?._id]);

  const cancelEditGroup = () => {
    setEditingGroup(null);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      const res = await fetch(`/api/admin/field-groups/${editingGroup._id}`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify({
          groupLabel: editingGroup.groupLabel,
          description: editingGroup.description || "",
          country: editingGroup.country || "ALL",
          selectionMode: (editingGroup as any)?.selectionMode || "multi",
          validityModel: editingGroup.validityModel || "none",
          maxAge: editingGroup.maxAge ?? null,
          durationYearsFromIssue: editingGroup.durationYearsFromIssue ?? null,
          required: editingGroup.required ?? false,
          active: editingGroup.active,
        }),
      });

      if (!res.ok) {
        let msg = "Grup güncellenemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      await loadGroups();
      setLastUpdatedGroupId(editingGroup._id);
      setSelectedGroupId(editingGroup._id);
      setEditingGroup(null);
    } catch (err: any) {
      console.error("PUT /api/admin/field-groups/:id error:", err);
      alert(err?.message || "Grup güncellenirken hata oluştu.");
    }
  };

  const handleCreateGroup = async () => {
    const label = newGroupLabel.trim();
    const manualKey = newGroupKey.trim();

    if (!label) {
      alert("Grup adı boş olamaz.");
      return;
    }

    try {
      const res = await fetch("/api/admin/field-groups", {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({
          groupLabel: label,
          groupKey: manualKey || undefined,
        }),
      });

      if (!res.ok) {
        let msg = "Grup oluşturulamadı.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const createdJson = await res.json().catch(() => null);
      const createdGroupKey =
        String(createdJson?.group?.groupKey || "").trim() || manualKey;
      const createdGroupId = String(createdJson?.group?._id || "").trim();

      setNewGroupLabel("");
      setNewGroupKey("");
      await loadGroups();

      if (createdGroupId) {
        setSelectedGroupId(createdGroupId);
        setEditingNode(null);
      }

      if (returnTo && typeof window !== "undefined") {
        const qs = new URLSearchParams({
          createdGroupKey,
          restoreDraft: "1",
        });
        window.location.href = `${returnTo}?${qs.toString()}`;
      }
    } catch (err: any) {
      console.error("POST /api/admin/field-groups error:", err);
      alert(err?.message || "Grup oluşturulurken hata oluştu.");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const ok = window.confirm(
      "Bu grubu ve içindeki tüm node'ları silmek istediğinize emin misiniz?"
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/field-groups/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!res.ok) {
        let msg = "Grup silinemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }

        if (res.status >= 400 && res.status < 500) {
          alert(msg);
          return;
        }

        throw new Error(msg);
      }

      setGroups((prev) => prev.filter((g) => g._id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
        setEditingNode(null);
      }
    } catch (err: any) {
      console.error("DELETE /api/admin/field-groups/:id error:", err);
      alert(err?.message || "Grup silinirken hata oluştu.");
    }
  };

  const startEditNode = (node: FieldGroupNode) => {
    setEditingNode(node);
    setEditingNodeForm({
      key: node.key,
      label: node.label,
      parentKey: node.parentKey || "",
      sortOrder: node.sortOrder?.toString() ?? "",
      coverage: node.coverage || [],
      requiredWith: node.requiredWith || [],
      equivalentKeys: node.equivalentKeys || [],
      active: node.active,
    });
  };

  useEffect(() => {
    if (!editingNode) return;
    const el = editNodePanelRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editingNode?.key]);

  const cancelEditNode = () => {
    setEditingNode(null);
  };

  const handleUpdateNode = async () => {
    if (!selectedGroup || !editingNode) return;

    try {
      const nextRequiredWith = enforceAdrPrereq(
        editingNodeForm.key,
        editingNodeForm.requiredWith
      );
      const res = await fetch(
        `/api/admin/field-groups/${selectedGroup._id}/nodes/${encodeURIComponent(
          editingNode.key
        )}`,
        {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify({
            // key backend'de değiştirilmiyor; burada sadece diğer alanları güncelliyoruz
            parentKey: editingNodeForm.parentKey.trim() || null,
            sortOrder: editingNodeForm.sortOrder
              ? Number(editingNodeForm.sortOrder)
              : 0,
            coverage: editingNodeForm.coverage,
            requiredWith: nextRequiredWith,
            equivalentKeys: editingNodeForm.equivalentKeys,
            active: editingNodeForm.active,
          }),
        }
      );

      if (!res.ok) {
        let msg = "Node güncellenemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      await loadGroups();
      setLastUpdatedNodeKey(editingNodeForm.key);
      setEditingNode(null);
    } catch (err: any) {
      console.error("PUT /api/admin/field-groups/:id/nodes/:nodeKey", err);
      alert(err?.message || "Node güncellenirken hata oluştu.");
    }
  };

  const [nodeSearch, setNodeSearch] = useState("");
  const filteredSelectedNodes = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase();
    const nodes = selectedGroup?.nodes || [];
    if (!q) return nodes;
    return nodes.filter((n) => {
      const key = String(n?.key || "").toLowerCase();
      const label = String(n?.label || "").toLowerCase();
      return key.includes(q) || label.includes(q);
    });
  }, [selectedGroup, nodeSearch]);

  useEffect(() => {
    setNodeSearch("");
    setEditingNode(null);
  }, [selectedGroupId]);

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="px-6 py-8 space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">
            Kriter Grupları (Field Groups)
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl">
            Ehliyet sınıfları, SRC, ADR ve diğer kriter gruplarının hiyerarşik
            node yapısını buradan yönetebilirsin. Bu gruplar hem CV tarafında
            hem ilan filtrelerinde seçenek kaynağı olarak kullanılır.
          </p>
        </div>
      </header>

      {/* Hata / yükleniyor */}
      {error && (
        <div className="rounded-lg border border-red-500 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
          Yükleniyor…
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-4">
          {/* Yeni grup oluştur */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">
              Yeni grup oluştur
            </h2>

            <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto] lg:grid-cols-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Grup adı (örn: SRC Belgeleri (TR))
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                  placeholder="Örn. SRC Belgeleri (TR)"
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Group key (opsiyonel)
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                  placeholder="Boş bırakırsan otomatik üretilir (örn: SRC_TR)"
                  value={newGroupKey}
                  onChange={(e) => setNewGroupKey(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Yeni Grup Ekle
                </button>
              </div>
            </div>
          </section>

          {/* Grup listesi */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Gruplar
              </h2>
              <span className="text-xs text-slate-400">
                Toplam {groups.length} grup
              </span>
            </div>

            {groups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                Henüz tanımlı grup yok. Yukarıdan yeni grup oluşturabilirsin.
              </div>
            ) : (
              <div className="max-h-[calc(100vh-360px)] overflow-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={async (event) => {
                    const { active, over } = event;
                    if (!over) return;
                    if (active.id === over.id) return;
                    setGroups((prev) => {
                      const oldIndex = prev.findIndex((x) => x._id === active.id);
                      const newIndex = prev.findIndex((x) => x._id === over.id);
                      if (oldIndex < 0 || newIndex < 0) return prev;
                      const next = arrayMove(prev, oldIndex, newIndex).map((g, i) => ({
                        ...g,
                        sortOrder: i + 1,
                      }));
                      persistGroupOrder(next).catch((e) => {
                        console.error("persistGroupOrder error:", e);
                        alert(e?.message || "Sıralama kaydedilemedi.");
                      });
                      return next;
                    });
                  }}
                >
                  <SortableContext
                    items={groups.map((g) => g._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-950/70 sticky top-0">
                        <tr className="text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Drag</th>
                          <th className="px-3 py-2 text-left">Grup</th>
                          <th className="px-3 py-2 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.map((g, idx) => (
                          <SortableGroupRow
                            key={g._id}
                            group={g}
                            idx={idx}
                            selected={selectedGroupId === g._id}
                            onSelect={() =>
                              setSelectedGroupId(
                                selectedGroupId === g._id ? null : g._id
                              )
                            }
                            onEdit={() => startEditGroup(g)}
                            onDelete={() => handleDeleteGroup(g._id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </section>

          {/* Grup düzenleme paneli */}
          {editingGroup && (
            <section
              ref={editGroupPanelRef}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
            >
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Grup düzenle: {editingGroup.groupLabel}
              </h2>

              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
                <div className="md:col-span-2 lg:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Grup adı
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingGroup.groupLabel}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        groupLabel: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Ülke (ALL veya ülke kodu)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingGroup.country || "ALL"}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        country: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-1">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Geçerlilik modeli
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingGroup.validityModel || "none"}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        validityModel: e.target.value,
                      })
                    }
                  >
                    <option value="none">Model: none</option>
                    <option value="simple">Basit (X yıl)</option>
                    <option value="adr_linked">ADR bağlı model</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Seçim modu
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={(editingGroup as any)?.selectionMode || "multi"}
                    onChange={(e) =>
                      setEditingGroup({
                        ...(editingGroup as any),
                        selectionMode: e.target.value === "single" ? "single" : "multi",
                      })
                    }
                  >
                    <option value="multi">Multi (çoklu seçim)</option>
                    <option value="single">Single (tek seçim)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Geçerlilik süresi (yıl)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    placeholder="boş = sınırsız"
                    value={editingGroup.maxAge ?? ""}
                    onChange={(e) =>
                      setEditingGroup({
                        ...editingGroup,
                        maxAge: e.target.value
                          ? Number(e.target.value)
                          : (null as any),
                      })
                    }
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                      checked={editingGroup.active}
                      onChange={(e) =>
                        setEditingGroup({
                          ...editingGroup,
                          active: e.target.checked,
                        })
                      }
                    />
                    Aktif
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditGroup}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleUpdateGroup}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Üyeler (Node'lar)
              </h2>

              {!selectedGroup ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Önce yukarıdan bir grup seç.
                </div>
              ) : selectedGroup.nodes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Bu grupta henüz üye yok.
                </div>
              ) : (
                <div className="max-h-[calc(100vh-320px)] overflow-auto">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <input
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-50 outline-none focus:border-sky-500"
                      placeholder="Node ara (key veya etiket)"
                      value={nodeSearch}
                      onChange={(e) => setNodeSearch(e.target.value)}
                    />
                    <div className="shrink-0 text-[11px] text-slate-400">
                      {filteredSelectedNodes.length}/{selectedGroup.nodes.length}
                    </div>
                  </div>
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-950/70 sticky top-0">
                      <tr className="text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 text-left">Key</th>
                        <th className="px-3 py-2 text-left">Etiket</th>
                        <th className="px-3 py-2 text-left">Kural özeti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSelectedNodes
                        .slice()
                        .sort((a, b) => {
                          if (a.level !== b.level) return a.level - b.level;
                          if (a.sortOrder !== b.sortOrder)
                            return a.sortOrder - b.sortOrder;
                          return a.label.localeCompare(b.label, "tr");
                        })
                        .map((n) => (
                          <tr
                            key={n.key}
                            id={`node-row-${n.key}`}
                            className={`border-t border-slate-800 cursor-pointer hover:bg-slate-900/80 ${
                              editingNode?.key === n.key
                                ? "bg-slate-900/90"
                                : "bg-slate-900/40"
                            }`}
                            onClick={() => startEditNode(n)}
                          >
                            <td className="px-3 py-2 text-xs font-mono text-slate-300">
                              {n.key}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-100">
                              {n.label}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-400">
                              {(n.requiredWith || []).length > 0
                                ? `required: ${(n.requiredWith || []).join(",")}`
                                : "required: -"}
                              {" · "}
                              {(n.coverage || []).length > 0
                                ? `covers: ${(n.coverage || []).join(",")}`
                                : "covers: -"}
                              {" · "}
                              {(n.equivalentKeys || []).length > 0
                                ? `equiv: ${(n.equivalentKeys || []).join(",")}`
                                : "equiv: -"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section
              ref={editNodePanelRef}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm"
            >
              <h2 className="mb-3 text-sm font-semibold text-slate-200">
                Kurallar
              </h2>

              {!selectedGroup ? (
                <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                  Önce yukarıdan bir grup seç.
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  {!editingNode ? (
                    <div className="text-sm text-slate-300">
                      Soldan bir kriter seçerek hiyerarşi ve bağımlılık kurallarını düzenleyebilirsin.
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Düzenle: {editingNode.key}
                      </h3>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Key
                          </label>
                          <input
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300"
                            value={editingNodeForm.key}
                            disabled
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Etiket
                          </label>
                          <input
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300"
                            value={editingNodeForm.label}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Üst üye (parent)
                          </label>
                          <select
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                            value={editingNodeForm.parentKey}
                            onChange={(e) =>
                              setEditingNodeForm((prev) => ({
                                ...prev,
                                parentKey: e.target.value,
                              }))
                            }
                          >
                            <option value="">(Yok / Root)</option>
                            {selectedGroupNodeKeys
                              .filter((k) => k !== editingNodeForm.key)
                              .map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Sıra (sort)
                          </label>
                          <input
                            type="number"
                            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                            placeholder="0"
                            value={editingNodeForm.sortOrder}
                            onChange={(e) =>
                              setEditingNodeForm((prev) => ({
                                ...prev,
                                sortOrder: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Kapsar (coverage)
                          </label>
                          <div className="h-44 overflow-auto rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                            {selectedGroupNodeKeys
                              .filter((k) => k !== editingNodeForm.key)
                              .map((k) => {
                                const checked = editingNodeForm.coverage.includes(k);
                                return (
                                  <label
                                    key={k}
                                    className="flex items-center gap-2 py-1 text-xs text-slate-100"
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                                      checked={checked}
                                      onChange={() =>
                                        setEditingNodeForm((prev) => ({
                                          ...prev,
                                          coverage: toggleArrayValue(prev.coverage, k),
                                        }))
                                      }
                                    />
                                    <span className="font-mono text-[11px] text-slate-300">
                                      {k}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-400">
                            Olmadan olmaz (requiredWith)
                          </label>
                          <div className="h-44 overflow-auto rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                            {selectedGroupNodeKeys
                              .filter((k) => k !== editingNodeForm.key)
                              .map((k) => {
                                const checked = editingNodeForm.requiredWith.includes(k);
                                return (
                                  <label
                                    key={k}
                                    className="flex items-center gap-2 py-1 text-xs text-slate-100"
                                  >
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                                      checked={checked}
                                      onChange={() =>
                                        setEditingNodeForm((prev) => ({
                                          ...prev,
                                          requiredWith: enforceAdrPrereq(
                                            prev.key,
                                            toggleArrayValue(prev.requiredWith, k)
                                          ),
                                        }))
                                      }
                                    />
                                    <span className="font-mono text-[11px] text-slate-300">
                                      {k}
                                    </span>
                                  </label>
                                );
                              })}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-slate-400">
                          Eşdeğer anahtarlar (equivalentKeys)
                        </label>
                        <div className="mb-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
                            onClick={() =>
                              setEditingNodeForm((prev) => ({
                                ...prev,
                                equivalentKeys: [],
                              }))
                            }
                          >
                            Hepsini kaldır
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
                            onClick={() =>
                              setEditingNodeForm((prev) => ({
                                ...prev,
                                equivalentKeys: selectedGroupNodeKeys.filter(
                                  (k) => k !== prev.key
                                ),
                              }))
                            }
                          >
                            Hepsini seç
                          </button>
                        </div>
                        <div className="h-44 overflow-auto rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                          {selectedGroupNodeKeys
                            .filter((k) => k !== editingNodeForm.key)
                            .map((k) => {
                              const checked = editingNodeForm.equivalentKeys.includes(k);
                              return (
                                <label
                                  key={k}
                                  className="flex items-center gap-2 py-1 text-xs text-slate-100"
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                                    checked={checked}
                                    onChange={() =>
                                      setEditingNodeForm((prev) => ({
                                        ...prev,
                                        equivalentKeys: toggleArrayValue(prev.equivalentKeys, k),
                                      }))
                                    }
                                  />
                                  <span className="font-mono text-[11px] text-slate-300">{k}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-600 bg-slate-900"
                            checked={editingNodeForm.active}
                            onChange={(e) =>
                              setEditingNodeForm((prev) => ({
                                ...prev,
                                active: e.target.checked,
                              }))
                            }
                          />
                          Aktif
                        </label>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditNode}
                            className="rounded-md border border-slate-600 px-4 py-2 text-xs text-slate-100 hover:bg-slate-800"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateNode}
                            className="rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                          >
                            Kaydet
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dışa açılan komponent – sadece admin görebilsin
export default function AdminFieldGroupsPage() {
  return (
    <AdminOnly>
      <AdminFieldGroupsInner />
    </AdminOnly>
  );
}
