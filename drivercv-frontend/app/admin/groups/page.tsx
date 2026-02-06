// DriverAll-main/drivercv-frontend/app/admin/groups/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminOnly from "@/components/AdminOnly";

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
  active: boolean;
  nodes: FieldGroupNode[];
};

type ApiListResponse = {
  groups: FieldGroup[];
};

function AdminFieldGroupsInner() {
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [newGroupKey, setNewGroupKey] = useState("");

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = useMemo(
    () => groups.find((g) => g._id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const [editingGroup, setEditingGroup] = useState<FieldGroup | null>(null);

  // Node form (yeni node)
  const [newNode, setNewNode] = useState({
    key: "",
    label: "",
    parentKey: "",
    level: "",
    sortOrder: "",
  });

  // Node düzenleme
  const [editingNode, setEditingNode] = useState<FieldGroupNode | null>(null);
  const [editingNodeForm, setEditingNodeForm] = useState({
    key: "",
    label: "",
    parentKey: "",
    level: "",
    sortOrder: "",
    coverage: "",
    requiredWith: "",
    active: true,
  });

  // ----------------------------------------------------------
  // Yardımcılar
  // ----------------------------------------------------------

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/field-groups");
      if (!res.ok) {
        throw new Error("Grup listesi alınamadı");
      }
      const data: ApiListResponse = await res.json();
      setGroups(data.groups || []);
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

  const resetNewNodeForm = () => {
    setNewNode({
      key: "",
      label: "",
      parentKey: "",
      level: "",
      sortOrder: "",
    });
  };

  const startEditGroup = (group: FieldGroup) => {
    setEditingGroup(group);
  };

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

      setNewGroupLabel("");
      setNewGroupKey("");
      await loadGroups();
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

  // ----------------------------------------------------------
  // Node işlemleri
  // ----------------------------------------------------------

  const handleCreateNode = async () => {
    if (!selectedGroup) {
      alert("Önce bir grup seçin.");
      return;
    }

    const key = newNode.key.trim();
    const label = newNode.label.trim();

    if (!key || !label) {
      alert("Node key ve etiket boş olamaz.");
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/field-groups/${selectedGroup._id}/nodes`,
        {
          method: "POST",
          headers: jsonHeaders(),
          body: JSON.stringify({
            key,
            label,
            parentKey: newNode.parentKey.trim() || null,
            level: newNode.level ? Number(newNode.level) : 0,
            sortOrder: newNode.sortOrder ? Number(newNode.sortOrder) : 0,
          }),
        }
      );

      if (!res.ok) {
        let msg = "Node eklenemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      resetNewNodeForm();
      await loadGroups();
    } catch (err: any) {
      console.error("POST /api/admin/field-groups/:id/nodes error:", err);
      alert(err?.message || "Node eklenirken hata oluştu.");
    }
  };

  const handleDeleteNode = async (group: FieldGroup, nodeKey: string) => {
    const ok = window.confirm(
      `"${nodeKey}" node'unu silmek istediğinize emin misiniz?`
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/admin/field-groups/${group._id}/nodes/${encodeURIComponent(
          nodeKey
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        let msg = "Node silinemedi.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      await loadGroups();
      if (editingNode?.key === nodeKey) {
        setEditingNode(null);
      }
    } catch (err: any) {
      console.error("DELETE /api/admin/field-groups/:id/nodes/:nodeKey", err);
      alert(err?.message || "Node silinirken hata oluştu.");
    }
  };

  const startEditNode = (node: FieldGroupNode) => {
    setEditingNode(node);
    setEditingNodeForm({
      key: node.key,
      label: node.label,
      parentKey: node.parentKey || "",
      level: node.level?.toString() ?? "",
      sortOrder: node.sortOrder?.toString() ?? "",
      coverage: (node.coverage || []).join(","),
      requiredWith: (node.requiredWith || []).join(","),
      active: node.active,
    });
  };

  const cancelEditNode = () => {
    setEditingNode(null);
  };

  const handleUpdateNode = async () => {
    if (!selectedGroup || !editingNode) return;

    try {
      const coverageArr = editingNodeForm.coverage
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const requiredWithArr = editingNodeForm.requiredWith
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(
        `/api/admin/field-groups/${selectedGroup._id}/nodes/${encodeURIComponent(
          editingNode.key
        )}`,
        {
          method: "PUT",
          headers: jsonHeaders(),
          body: JSON.stringify({
            // key backend'de değiştirilmiyor; burada sadece diğer alanları güncelliyoruz
            label: editingNodeForm.label.trim(),
            parentKey: editingNodeForm.parentKey.trim() || null,
            level: editingNodeForm.level
              ? Number(editingNodeForm.level)
              : 0,
            sortOrder: editingNodeForm.sortOrder
              ? Number(editingNodeForm.sortOrder)
              : 0,
            coverage: coverageArr,
            requiredWith: requiredWithArr,
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
      setEditingNode(null);
    } catch (err: any) {
      console.error("PUT /api/admin/field-groups/:id/nodes/:nodeKey", err);
      alert(err?.message || "Node güncellenirken hata oluştu.");
    }
  };

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

      {/* Yeni grup oluştur */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Yeni grup oluştur
        </h2>

        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
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
            Tanımlı gruplar
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
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950/70">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Grup</th>
                  <th className="px-3 py-2 text-left">Key</th>
                  <th className="px-3 py-2 text-left">Bağlam</th>
                  <th className="px-3 py-2 text-left">Geçerlilik</th>
                  <th className="px-3 py-2 text-left">Node sayısı</th>
                  <th className="px-3 py-2 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, idx) => (
                  <tr
                    key={g._id}
                    className={`border-t border-slate-800 ${
                      selectedGroupId === g._id
                        ? "bg-slate-900/90"
                        : "bg-slate-900/40"
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-100">
                        {g.groupLabel}
                      </div>
                      <div className="text-xs text-slate-500">
                        key: {g.groupKey}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {g.groupKey}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      Ülke: {g.country || "ALL"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      Model: {g.validityModel || "none"}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {g.nodes?.length ?? 0}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedGroupId(
                              selectedGroupId === g._id ? null : g._id
                            )
                          }
                          className="rounded-md border border-slate-600 px-2 py-1 text-slate-100 hover:bg-slate-800"
                        >
                          Düğümleri Göster
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditGroup(g)}
                          className="rounded-md border border-sky-600 px-2 py-1 text-sky-100 hover:bg-sky-700/40"
                        >
                          Grubu Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(g._id)}
                          className="rounded-md border border-rose-600 px-2 py-1 text-rose-100 hover:bg-rose-800/40"
                        >
                          Grubu Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Grup düzenleme paneli */}
      {editingGroup && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Grup düzenle: {editingGroup.groupLabel}
          </h2>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
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

          <div className="mt-3 grid gap-3 md:grid-cols-3">
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

      {/* Node paneli */}
      {selectedGroup && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Node'lar – {selectedGroup.groupLabel} (key: {selectedGroup.groupKey})
          </h2>

          {/* Node listesi */}
          {selectedGroup.nodes.length === 0 ? (
            <div className="mb-4 rounded-lg border border-dashed border-slate-700 px-4 py-4 text-sm text-slate-400">
              Bu grupta henüz node yok. Aşağıdan yeni node ekleyebilirsin.
            </div>
          ) : (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 text-left">Anahtar</th>
                    <th className="px-3 py-2 text-left">Ad / Etiket</th>
                    <th className="px-3 py-2 text-left">Parent</th>
                    <th className="px-3 py-2 text-left">Level</th>
                    <th className="px-3 py-2 text-left">Coverage</th>
                    <th className="px-3 py-2 text-left">RequiredWith</th>
                    <th className="px-3 py-2 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.nodes
                    .slice()
                    .sort((a, b) => {
                      // Önce level, sonra sortOrder, sonra label
                      if (a.level !== b.level) return a.level - b.level;
                      if (a.sortOrder !== b.sortOrder)
                        return a.sortOrder - b.sortOrder;
                      return a.label.localeCompare(b.label, "tr");
                    })
                    .map((n) => (
                      <tr
                        key={n.key}
                        className="border-t border-slate-800 bg-slate-900/40"
                      >
                        <td className="px-3 py-2 text-xs font-mono text-slate-300">
                          {n.key}
                        </td>
                        <td className="px-3 py-2 text-sm text-slate-100">
                          {n.label}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {n.parentKey || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {n.level ?? 0}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {(n.coverage || []).join(", ") || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {(n.requiredWith || []).join(", ") || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => startEditNode(n)}
                              className="rounded-md border border-sky-600 px-2 py-1 text-sky-100 hover:bg-sky-700/40"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteNode(selectedGroup, n.key)
                              }
                              className="rounded-md border border-rose-600 px-2 py-1 text-rose-100 hover:bg-rose-800/40"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Yeni node ekle */}
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Bu gruba yeni node ekle
            </h3>

            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Key (örneğin B, C, SRC3)
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                  value={newNode.key}
                  onChange={(e) =>
                    setNewNode((prev) => ({ ...prev, key: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Etiket / Açıklama
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                  value={newNode.label}
                  onChange={(e) =>
                    setNewNode((prev) => ({ ...prev, label: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Parent key (opsiyonel)
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                  placeholder="Örn. EHL_ROOT"
                  value={newNode.parentKey}
                  onChange={(e) =>
                    setNewNode((prev) => ({
                      ...prev,
                      parentKey: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  Level / Sıra
                </label>
                <div className="flex gap-2">
                  <input
                    className="w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    placeholder="level"
                    value={newNode.level}
                    onChange={(e) =>
                      setNewNode((prev) => ({
                        ...prev,
                        level: e.target.value,
                      }))
                    }
                  />
                  <input
                    className="w-1/2 rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    placeholder="sıra"
                    value={newNode.sortOrder}
                    onChange={(e) =>
                      setNewNode((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetNewNodeForm}
                className="rounded-md border border-slate-600 px-4 py-2 text-xs text-slate-100 hover:bg-slate-800"
              >
                Temizle
              </button>
              <button
                type="button"
                onClick={handleCreateNode}
                className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Node Ekle
              </button>
            </div>
          </div>

          {/* Node düzenleme paneli */}
          {editingNode && (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
                Node düzenle: {editingNode.key}
              </h3>

              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Key
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400"
                    value={editingNodeForm.key}
                    disabled
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Şimdilik key değişmiyor; referanslı yapıyı bozmayalım.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Etiket / Ad
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.label}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Parent key
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.parentKey}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        parentKey: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Level
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.level}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        level: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Sort order
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.sortOrder}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
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
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    Coverage (virgülle ayır, örn: SRC1,SRC2)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.coverage}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        coverage: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">
                    RequiredWith (virgülle ayır)
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:border-sky-500"
                    value={editingNodeForm.requiredWith}
                    onChange={(e) =>
                      setEditingNodeForm((prev) => ({
                        ...prev,
                        requiredWith: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
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
                  Node&apos;u Kaydet
                </button>
              </div>
            </div>
          )}
        </section>
      )}
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
