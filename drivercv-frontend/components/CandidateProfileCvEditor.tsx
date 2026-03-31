"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AdSlot from "@/components/AdSlot";
import {
  GroupNode,
  Reason,
  resolveGroupSelection,
  isAutoAdded,
} from "@/lib/groupCriteriaEngine";
import { CANDIDATE_SUB_ROLES } from "@/types/role-engine";

type Profile = {
  role?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  cityCode?: string;
  district?: string;
  districtCode?: string;
  about?: string;
  experienceYears?: number | null;
  dynamicValues?: Record<string, any>;
  location?: {
    countryCode?: string;
    cityCode?: string;
    districtCode?: string;
    label?: string;
  };
};

type CvDoc = {
  _id?: string;
  userId: string;
  values: Record<string, any>;
};

type CriteriaDoc = {
  type: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  validityYears?: number | null;
};

type DynamicProfileDoc = {
  criteriaValues?: {
    documents?: Array<{
      type?: string;
      issueDate?: string;
      expiryDate?: string;
      validityYears?: number;
    }>;
  };
};

type FieldDefinition = {
  _id: string;
  key: string;
  label: string;
  description?: string;
  groupKey?: string | null;
  groupLabelOverride?: string | null;
  category?: string | null;
  showInCv?: boolean;
  showInJob?: boolean;
  showInProfile?: boolean;
  country?: string | null;
  valueType?: "boolean" | "enum" | "multiEnum" | "string" | "number" | "date";
  enumValues?: string[];
  coversKeys?: string[];
  requiresKeys?: string[];
  fieldType?: string;
  uiType?: string;
  optionsGroupKey?: string | null;
  meta?: any;
  active?: boolean;
};

type FieldGroupNode = { key: string; label: string; active?: boolean; sortOrder?: number };
type FieldGroup = { groupKey: string; groupLabel: string; nodes: FieldGroupNode[]; country?: string; active?: boolean; sortOrder?: number };

type CvFieldGroup = {
  groupKey: string;
  groupLabel: string;
  fields: FieldDefinition[];
};

type LocationItem = {
  code: string;
  name: string;
  level: string;
  countryCode?: string;
  parentCode?: string | null;
};

type CandidateSubRoleItem = {
  key: string;
  label: string;
  description?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

function normalizeCountryCode(input: any, fallback: string): string {
  const raw = typeof input === "string" ? input : input == null ? "" : String(input);
  const s = raw.trim().toUpperCase();
  if (!s) return fallback;
  const alias: Record<string, string> = { TURKEY: "TR", TURKIYE: "TR", "TÜRKİYE": "TR" };
  return alias[s] || (s.length === 2 ? s : fallback);
}

const CV_MANUAL_META_KEY = "__cvManualKeys";

export default function CandidateProfileCvEditor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileInfo, setProfileInfo] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("TR");
  const [city, setCity] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [district, setDistrict] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [about, setAbout] = useState("");
  const [experienceYears, setExperienceYears] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [cityOptions, setCityOptions] = useState<LocationItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [candidateSubRoles, setCandidateSubRoles] = useState<CandidateSubRoleItem[]>([]);
  const [selectedSubRoles, setSelectedSubRoles] = useState<string[]>([]);

  const [cvDoc, setCvDoc] = useState<CvDoc | null>(null);
  const [cvValues, setCvValues] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [depNodes, setDepNodes] = useState<GroupNode[]>([]);
  const [optionGroups, setOptionGroups] = useState<FieldGroup[]>([]);
  const [criteriaGroups, setCriteriaGroups] = useState<FieldGroup[]>([]);
  const [criteriaDocs, setCriteriaDocs] = useState<CriteriaDoc[]>([]);
  const [savingCriteriaDocs, setSavingCriteriaDocs] = useState(false);
  const [savingCv, setSavingCv] = useState(false);
  const [cvInfo, setCvInfo] = useState<string | null>(null);
  const [cvLocked, setCvLocked] = useState<boolean>(true);
  const [cvDirty, setCvDirty] = useState(false);

  const [creatingCv, setCreatingCv] = useState(false);

  const savingCvRef = useRef(false);
  const districtSelectRef = useRef<HTMLSelectElement>(null);
  const autoSaveTimerRef = useRef<any>(null);
  const docsSaveTimerRef = useRef<any>(null);

  const [cvManualKeys, setCvManualKeys] = useState<string[]>([]);
  const [cvReasons, setCvReasons] = useState<Record<string, Reason>>({});
  const initDepsRef = useRef(false);
  const [depsInitialized, setDepsInitialized] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const token = getToken();
        if (!token) throw new Error("Oturum bulunamadı.");
        const headers = { Authorization: `Bearer ${token}` };

        const [
          pRes,
          cvRes,
          cvProfileRes,
          fRes,
          uRes,
          filtersRes,
          groupsRes,
          dpRes,
          subRolesRes,
        ] = await Promise.all([
          fetch("/api/profile/me", { headers }),
          fetch("/api/cv", { headers }),
          fetch("/api/cv-profile/me", { headers }),
          fetch("/api/fields", { headers }),
          fetch("/api/users/me", { headers }),
          fetch(`/api/jobs/filters?country=${encodeURIComponent(normalizeCountryCode(country || "TR", "TR"))}&scope=profile`, {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/admin/field-groups", { headers }),
          fetch("/api/profile/dynamic", { headers }),
          fetch("/api/public/roles/candidate-subroles", { cache: "no-store" }),
        ]);

        const pJson = await pRes.json();
        const cvJson = await cvRes.json();
        const cvProfileJson = await cvProfileRes.json().catch(() => ({}));
        const fJson = await fRes.json();
        const uJson = await uRes.json().catch(() => ({}));
        const filtersJson = await filtersRes.json().catch(() => ({}));
        const groupsJson = await groupsRes.json().catch(() => ({}));
        const dpJson = await dpRes.json().catch(() => ({}));
        const subRolesJson = await subRolesRes.json().catch(() => ({}));

        const dp: DynamicProfileDoc | null = (dpJson as any)?.profile || null;
        const dpDocsRaw = Array.isArray(dp?.criteriaValues?.documents)
          ? dp?.criteriaValues?.documents
          : [];
        const nextCriteriaDocs: CriteriaDoc[] = dpDocsRaw
          .map((d: any) => {
            const t = String(d?.type || "").trim();
            if (!t) return null;
            const issue = d?.issueDate ? String(d.issueDate) : "";
            const exp = d?.expiryDate ? String(d.expiryDate) : "";
            const vy = d?.validityYears;
            return {
              type: t,
              issueDate: issue ? issue.slice(0, 10) : null,
              expiryDate: exp ? exp.slice(0, 10) : null,
              validityYears: typeof vy === "number" && Number.isFinite(vy) ? vy : null,
            };
          })
          .filter(Boolean) as any;
        setCriteriaDocs(nextCriteriaDocs);

        if (pJson.profile) {
          const p = pJson.profile;
          setProfile(p);
          setFullName(p.fullName || "");
          setPhone(p.phone || "");
          setCountry(normalizeCountryCode(p.country || p.location?.countryCode, "TR"));

          const savedCityCode = p.location?.cityCode || p.cityCode || "";
          const savedDistrictCode = p.location?.districtCode || p.districtCode || "";

          setCityCode(savedCityCode);
          setDistrictCode(savedDistrictCode);

          setCity(p.city || p.location?.label?.split(" / ")[0] || "");
          setDistrict(p.district || p.location?.label?.split(" / ")[1] || "");

          setAbout(p.about || "");
          setExperienceYears(p.experienceYears != null ? String(p.experienceYears) : "");
          setAvatarUrl(p.avatarUrl || "");
          setBirthDate(p.birthDate ? String(p.birthDate).slice(0, 10) : "");

          // SubRoles — profil response'unda User modelinden gelen subRoles
          const userSubRoles = Array.isArray(p.subRoles) ? p.subRoles : [];
          setSelectedSubRoles(userSubRoles.map((s: any) => String(s || "").trim()).filter(Boolean));
        }

        // Candidate sub-roles listesi (dinamik + fallback)
        const subRolesList = Array.isArray((subRolesJson as any)?.subRoles) ? (subRolesJson as any).subRoles : [];
        let parsedSubRoles: CandidateSubRoleItem[] = subRolesList
          .map((x: any) => ({
            key: String(x?.key || "").trim(),
            label: String(x?.label || x?.key || "").trim(),
            description: String(x?.description || "").trim() || undefined,
          }))
          .filter((x: CandidateSubRoleItem) => !!x.key);

        // API boş döndüyse frontend fallback
        if (parsedSubRoles.length === 0) {
          parsedSubRoles = CANDIDATE_SUB_ROLES.map((r: { key: string; label: string; description: string }) => ({
            key: r.key,
            label: r.label,
            description: r.description || undefined,
          }));
        }
        setCandidateSubRoles(parsedSubRoles);

        const cvData = cvJson.cv || { values: {} };
        setCvDoc(cvData);
        setCvValues(cvData.values || {});

        const cvProfileFields = Array.isArray(cvProfileJson?.fields)
          ? cvProfileJson.fields
          : [];
        const legacyFields = Array.isArray(fJson?.fields) ? fJson.fields : [];
        const resolvedFields = cvProfileFields.length > 0 ? cvProfileJson.fields : legacyFields;
        setFields(resolvedFields);

        const filterGroups = Array.isArray(filtersJson?.groups) ? filtersJson.groups : [];
        setCriteriaGroups(filterGroups as any);

        const adminGroups = Array.isArray(groupsJson?.groups) ? groupsJson.groups : [];
        setOptionGroups(adminGroups as any);

        const nextDepNodes: GroupNode[] = filterGroups
          .flatMap((g: any) => (Array.isArray(g?.nodes) ? g.nodes : []))
          .filter((n: any) => n && n.active !== false)
          .map((n: any) => ({
            key: String(n.key || "").trim(),
            label: String(n.label || n.key || "").trim(),
            parentKey: n.parentKey ?? null,
            level: typeof n.level === "number" ? n.level : Number(n.level || 0),
            sortOrder: typeof n.sortOrder === "number" ? n.sortOrder : Number(n.sortOrder || 0),
            coverage: Array.isArray(n.coverage) ? n.coverage : [],
            requiredWith: Array.isArray(n.requiredWith) ? n.requiredWith : [],
            active: n.active !== false,
          }))
          .filter((n: GroupNode) => !!n.key);

        setDepNodes(nextDepNodes);
      } catch (err: any) {
        setError(err.message);
        setDepNodes([]);
        setOptionGroups([]);
        setCriteriaGroups([]);
        setCriteriaDocs([]);
        try {
          setLoading(true);
        } catch (err: any) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  function shortText(input: any, limit = 20) {
    const s = String(input || "").trim();
    if (!s) return "";
    if (s.length <= limit) return s;
    return `${s.slice(0, limit).trim()}…`;
  }

  function getCriteriaDocByType(type: string): CriteriaDoc | null {
    const t = String(type || "").trim();
    if (!t) return null;
    const found = (criteriaDocs || []).find((d) => String(d?.type || "").trim() === t);
    return found || null;
  }

  function upsertCriteriaDoc(next: CriteriaDoc) {
    const t = String(next?.type || "").trim();
    if (!t) return;
    setCriteriaDocs((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const idx = arr.findIndex((d) => String(d?.type || "").trim() === t);
      if (idx >= 0) {
        const clone = arr.slice();
        clone[idx] = { ...clone[idx], ...next, type: t };
        return clone;
      }
      return [...arr, { ...next, type: t }];
    });
  }

  async function saveCriteriaDocuments(options?: { silent?: boolean }) {
    if (savingCriteriaDocs) return;
    setSavingCriteriaDocs(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı.");

      const docsPayload = (criteriaDocs || [])
        .map((d) => {
          const type = String(d?.type || "").trim();
          if (!type) return null;
          const issueDate = d?.issueDate ? String(d.issueDate).slice(0, 10) : "";
          const vyRaw = d?.validityYears;
          const vy = vyRaw == null ? null : Number(vyRaw);
          return {
            type,
            issueDate: issueDate ? new Date(issueDate).toISOString() : null,
            expiryDate: d?.expiryDate ?? null,
            validityYears: Number.isFinite(vy as any) && (vy as any) > 0 ? vy : null,
          };
        })
        .filter(Boolean);

      const res = await fetch("/api/profile/dynamic", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ criteriaValues: { documents: docsPayload } }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Belge tarihleri kaydedilemedi.");
      }
      if (!options?.silent) setCvInfo("Belge tarihleri güncellendi.");
    } catch (err: any) {
      setError(err?.message || "Belge tarihleri kaydedilemedi.");
    } finally {
      setSavingCriteriaDocs(false);
    }
  }

  useEffect(() => {
    if (normalizeCountryCode(country, "TR") !== "TR") return;
    async function loadCities() {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/locations/list?country=TR&level=city");
        const data = await res.json();
        setCityOptions(data.list || []);
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, [country]);

  useEffect(() => {
    if (!cityCode) {
      setDistrictOptions([]);
      return;
    }
    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(
          `/api/locations/list?country=TR&level=district&parentCode=${cityCode}`
        );
        const data = await res.json();
        setDistrictOptions(data.list || []);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [cityCode]);

  async function handleAvatarUpload(file: File) {
    if (uploadingAvatar) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı.");
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Avatar yüklenemedi.");
      setAvatarUrl(data.avatarUrl || "");
      setProfileInfo("Fotoğraf güncellendi! ✅");
      setTimeout(() => setProfileInfo(null), 3000);
    } catch (err: any) {
      setError(err?.message || "Avatar yüklenemedi.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileInfo(null);

    try {
      // Doğum tarihi validasyonu
      if (!birthDate || !birthDate.trim() || birthDate.startsWith("raw:")) {
        throw new Error("Doğum tarihi zorunludur. Lütfen GG/AA/YYYY formatında girin.");
      }

      const token = getToken();
      const locLabel = city ? (district ? `${city} / ${district}` : city) : "";
      const locationObj = {
        countryCode: normalizeCountryCode(country, "TR"),
        cityCode: cityCode || null,
        districtCode: districtCode || null,
        label: locLabel,
      };

      const body = {
        role: profile?.role || "driver",
        fullName: fullName.trim(),
        phone: phone.trim(),
        about: about.trim(),
        experienceYears: experienceYears.trim() === "" ? null : Number(experienceYears.trim()),
        birthDate: birthDate || null,
        location: locationObj,
        country: locationObj.countryCode,
        city: city || null,
        cityCode: cityCode || null,
        district: district || null,
        districtCode: districtCode || null,
        subRoles: selectedSubRoles,
        dynamicValues: {
          ...(profile?.dynamicValues || {}),
          location: locationObj,
        },
      };

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Kaydedilemedi.");

      setProfile(data.profile || body);
      
      setProfileInfo("Profil başarıyla güncellendi! ✅");
      setTimeout(() => setProfileInfo(null), 3000);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveCv(options?: { silent?: boolean; lockAfter?: boolean }) {
    if (savingCvRef.current) return;
    savingCvRef.current = true;
    setSavingCv(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) throw new Error("Oturum bulunamadı.");

      const valuesToSave = { ...cvValues, [CV_MANUAL_META_KEY]: cvManualKeys };

      const res = await fetch("/api/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values: valuesToSave }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.message || "CV Kaydedilemedi.");
      }

      setCvDirty(false);
      if (!options?.silent) {
        setCvInfo("CV Güncellendi.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (options?.lockAfter) setCvLocked(true);
    } catch (err: any) {
      setError(err?.message || "CV Kaydedilemedi.");
    } finally {
      setSavingCv(false);
      savingCvRef.current = false;
    }
  }

  const cvFieldGroups: CvFieldGroup[] = useMemo(() => {
    const map = new Map<string, CvFieldGroup>();
    const nodeByKey = new Map<string, GroupNode>();
    (depNodes || []).forEach((n) => {
      if (!n?.key) return;
      nodeByKey.set(String(n.key || "").trim(), n);
    });

    const groupSortOrderByKey = new Map<string, number>();
    (criteriaGroups || []).forEach((g) => {
      const gk = String((g as any)?.groupKey || "").trim();
      if (!gk) return;
      const so = Number((g as any)?.sortOrder ?? 0);
      groupSortOrderByKey.set(gk, Number.isFinite(so) ? so : 0);
    });

    (optionGroups || []).forEach((g) => {
      const gk = String((g as any)?.groupKey || "").trim();
      if (!gk) return;
      if (groupSortOrderByKey.has(gk)) return;
      const so = Number((g as any)?.sortOrder ?? 0);
      groupSortOrderByKey.set(gk, Number.isFinite(so) ? so : 0);
    });

    const groupLabelByKey = new Map<string, string>();
    (criteriaGroups || []).forEach((g) => {
      const gk = String(g?.groupKey || "").trim();
      const gl = String(g?.groupLabel || "").trim();
      if (!gk || !gl) return;
      groupLabelByKey.set(gk, gl);
    });

    (optionGroups || []).forEach((g) => {
      const gk = String((g as any)?.groupKey || "").trim();
      const gl = String((g as any)?.groupLabel || "").trim();
      if (!gk || !gl) return;
      if (groupLabelByKey.has(gk)) return;
      groupLabelByKey.set(gk, gl);
    });

    const allowedGroupKeySet = new Set(
      (criteriaGroups || [])
        .filter((g) => g && g.active !== false)
        .map((g) => String(g?.groupKey || "").trim())
        .filter(Boolean)
    );

    const addedKeys = new Set<string>();

    fields
      .filter((f) => f.active !== false && (f.showInCv ?? true))
      .forEach((f) => {
        const vt = normalizeValueType(f);
        const derivedGroupKey =
          vt === "boolean" && String((f as any)?.groupLabel || "").trim()
            ? String((f as any)?.groupLabel || "").trim()
            : "";
        const gk = f.groupKey || derivedGroupKey || "GENEL";
        const gkNorm = String(gk || "").trim();
        const isBool = vt === "boolean";
        if (isBool && gkNorm && gkNorm !== "GENEL" && !allowedGroupKeySet.has(gkNorm)) return;
        const gl =
          groupLabelByKey.get(String(gk || "").trim()) ||
          f.groupLabelOverride ||
          (gk === "GENEL" ? "Genel" : gk);
        
        // depNodes'tan requiredWith bilgisini al ve field'a ekle
        const node = nodeByKey.get(String(f.key || "").trim());
        const enrichedField = {
          ...f,
          requiredWith: node?.requiredWith || [],
        };
        
        if (!map.has(gk)) map.set(gk, { groupKey: gk, groupLabel: gl, fields: [] });
        map.get(gk)!.fields.push(enrichedField);
        addedKeys.add(String(f.key || "").trim());
      });


    const groups = Array.from(map.values());
    groups.forEach((g) => {
      g.fields.sort((fa, fb) => {
        const na = nodeByKey.get(String(fa.key || "").trim());
        const nb = nodeByKey.get(String(fb.key || "").trim());
        const sa = Number(na?.sortOrder ?? 0);
        const sb = Number(nb?.sortOrder ?? 0);
        if (sa !== sb) return sa - sb;
        return String(fa.label || "").localeCompare(String(fb.label || ""), "tr");
      });
    });

    groups.sort((a, b) => {
      const sa = Number(groupSortOrderByKey.get(String(a.groupKey || "").trim()) ?? 0);
      const sb = Number(groupSortOrderByKey.get(String(b.groupKey || "").trim()) ?? 0);
      if (sa !== sb) return sa - sb;
      return String(a.groupKey || "").localeCompare(String(b.groupKey || ""), "tr");
    });

    return groups;
  }, [fields, depNodes, criteriaGroups, optionGroups]);

  const cvDepNodes: GroupNode[] = useMemo(() => depNodes, [depNodes]);

  const cvDepKeySet = useMemo(() => {
    return new Set((cvDepNodes || []).map((n) => String(n?.key || "").trim()).filter(Boolean));
  }, [cvDepNodes]);

  const criteriaGroupByKey = useMemo(() => {
    const m = new Map<string, any>();
    (criteriaGroups || []).forEach((g: any) => {
      const gk = String(g?.groupKey || "").trim();
      if (!gk) return;
      m.set(gk, g);
    });
    return m;
  }, [criteriaGroups]);

  const criteriaNodeKeysByGroupKey = useMemo(() => {
    const m = new Map<string, string[]>();
    (criteriaGroups || []).forEach((g: any) => {
      const gk = String(g?.groupKey || "").trim();
      if (!gk) return;
      const keys = (g?.nodes || [])
        .map((n: any) => String(n?.key || "").trim())
        .filter(Boolean);
      m.set(gk, keys);
    });
    return m;
  }, [criteriaGroups]);

  const enforceSingleSelectGroup = (groupKeyRaw: string, selectedKeyRaw: string) => {
    const groupKey = String(groupKeyRaw || "").trim();
    const selectedKey = String(selectedKeyRaw || "").trim();
    if (!groupKey || !selectedKey) return;

    const g = criteriaGroupByKey.get(groupKey);
    const mode = String((g as any)?.selectionMode || "multi").trim().toLowerCase();
    if (mode !== "single") return;

    const groupKeys = new Set(
      (criteriaNodeKeysByGroupKey.get(groupKey) || []).map((k) => String(k || "").trim()).filter(Boolean)
    );
    if (groupKeys.size === 0) return;

    const toClear = Array.from(groupKeys).filter((k) => k && k !== selectedKey);
    if (toClear.length === 0) return;

    setCvManualKeys((prev) => {
      const s = new Set(prev);
      for (const k of toClear) s.delete(k);
      return Array.from(s);
    });

    setCvValues((p) => {
      const next = { ...p };
      for (const k of toClear) next[k] = false;
      return next;
    });

    setCriteriaDocs((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.filter((d) => !toClear.includes(String(d?.type || "").trim()));
    });
  };

  useEffect(() => {
    if (initDepsRef.current || loading || !cvDepNodes.length) return;
    const stored = (cvValues as any)?.[CV_MANUAL_META_KEY];
    const initial = Array.isArray(stored)
      ? stored
      : cvDepNodes.filter((n) => !!cvValues[n.key]).map((n) => n.key);
    setCvManualKeys(initial);
    initDepsRef.current = true;
    setDepsInitialized(true);
  }, [loading, cvDepNodes, cvValues]);

  const cvResolved = useMemo(
    () => resolveGroupSelection(cvManualKeys, cvDepNodes),
    [cvManualKeys, cvDepNodes]
  );

  useEffect(() => {
    if (!depsInitialized) return;
    const eff = new Set(cvResolved.effectiveKeys);
    setCvReasons(cvResolved.reasons);
    setCvValues((prev) => {
      const next = { ...prev };
      cvDepNodes.forEach((n) => {
        next[n.key] = eff.has(n.key);
      });
      return next;
    });
  }, [depsInitialized, cvResolved, cvDepNodes]);

  // Pasaport boşalınca: vize seçimlerini otomatik temizle
  useEffect(() => {
    const passport = String((cvValues as any)?.PASSPORT_TYPE_TR || "").trim();
    if (passport) return;
    if ((cvValues as any)?.VISA_TYPES == null) return;
    setCvDirty(true);
    setCvValues((p) => {
      const next = { ...p };
      delete (next as any).VISA_TYPES;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(cvValues as any)?.PASSPORT_TYPE_TR]);

  useEffect(() => {
    if (cvLocked || !cvDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveCv({ silent: true }), 1500);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [cvDirty, cvLocked]);

  function normalizeValueType(field: FieldDefinition):
    | "boolean"
    | "enum"
    | "multiEnum"
    | "string"
    | "number"
    | "date" {
    const vt = (field as any)?.valueType;
    if (vt) return vt;
    const ft = String((field as any)?.fieldType || "").trim().toLowerCase();
    if (ft === "boolean" || ft === "number" || ft === "string" || ft === "date") return ft as any;
    if (ft === "select") return "enum";
    return "boolean";
  }

  function getFieldGroupLabel(field: FieldDefinition): string {
    const gk = String(field.groupKey || "").trim();
    const fromCriteria = (criteriaGroups || []).find(
      (g) => String(g?.groupKey || "").trim() === gk && g?.active !== false
    );
    const gl1 = String((fromCriteria as any)?.groupLabel || "").trim();
    if (gl1) return gl1;
    const fromOptions = (optionGroups || []).find(
      (g) => String(g?.groupKey || "").trim() === gk && g?.active !== false
    );
    const gl2 = String((fromOptions as any)?.groupLabel || "").trim();
    if (gl2) return gl2;
    const gl3 = String((field as any)?.groupLabelOverride || "").trim();
    if (gl3) return gl3;
    return gk || "Genel";
  }

  function renderDocumentDatesForField(field: FieldDefinition) {
    const key = String(field?.key || "").trim();
    if (!key) return null;

    const vt = normalizeValueType(field);
    if (vt !== "boolean") return null;

    const val = (cvValues as any)?.[key];
    if (!val) return null;

    // Field tanımında requiresIssueDate=true ise tarih inputlarını göster
    if (!(field as any)?.requiresIssueDate) return null;

    const doc = getCriteriaDocByType(key) || { type: key, issueDate: null, expiryDate: null };

    // Geçerlilik süresi: field def, node, veya aday girişi
    const defYears = Number((field as any)?.durationYearsFromIssue || (field as any)?.validityYears || 0);
    const docYears = Number(doc?.validityYears || 0);
    const years = defYears > 0 ? defYears : docYears > 0 ? docYears : 0;

    // Bitiş tarihi hesapla
    const computedExpiry = (() => {
      if (years > 0) {
        const d = new Date(`${String(doc.issueDate).slice(0, 10)}T00:00:00.000Z`);
        if (Number.isFinite(d.getTime())) {
          d.setUTCFullYear(d.getUTCFullYear() + years);
          return d.toISOString().slice(0, 10);
        }
      }
      if (doc.expiryDate) return String(doc.expiryDate).slice(0, 10);
      return "";
    })();

    const showValidityInput = defYears <= 0;

    return (
      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400">Alınış Tarihi</label>
          <input
            type="date"
            className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs outline-none focus:border-sky-500"
            value={doc.issueDate || ""}
            disabled={cvLocked}
            onChange={(e) => {
              const nextVal = e.target.value || "";
              upsertCriteriaDoc({
                type: key,
                issueDate: nextVal || null,
                expiryDate: doc.expiryDate ?? null,
                validityYears: doc.validityYears ?? null,
              });
              if (docsSaveTimerRef.current) clearTimeout(docsSaveTimerRef.current);
              docsSaveTimerRef.current = setTimeout(
                () => saveCriteriaDocuments({ silent: true }),
                800
              );
            }}
          />
        </div>

        {showValidityInput ? (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Geçerlilik Süresi (Yıl)</label>
            <input
              type="number"
              min={1}
              step={1}
              className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs outline-none focus:border-sky-500"
              value={doc.validityYears == null ? "" : String(doc.validityYears)}
              disabled={cvLocked}
              onChange={(e) => {
                const raw = String(e.target.value || "").trim();
                const parsed = raw ? Number(raw) : null;
                upsertCriteriaDoc({
                  type: key,
                  issueDate: doc.issueDate ?? null,
                  expiryDate: doc.expiryDate ?? null,
                  validityYears:
                    parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null,
                });
                if (docsSaveTimerRef.current) clearTimeout(docsSaveTimerRef.current);
                docsSaveTimerRef.current = setTimeout(
                  () => saveCriteriaDocuments({ silent: true }),
                  800
                );
              }}
            />
          </div>
        ) : null}

        {computedExpiry ? (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Geçerlilik Bitiş</label>
            <div className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-emerald-400 font-medium select-text">
              {computedExpiry}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function buildCvHtml() {
    const nameText = String(fullName || profile?.fullName || "").trim();
    const phoneText = String(phone || profile?.phone || "").trim();
    const locCity = String(city || profile?.city || "").trim();
    const locDistrict = String(district || profile?.district || "").trim();
    const locationText = [locCity, locDistrict].filter(Boolean).join(", ") || "-";
    const aboutText = String(about || profile?.about || "").trim();
    const expYears = String(experienceYears || "").trim();
    const photoSrc = avatarUrl || "";

    const esc = (x: string) =>
      String(x || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");

    // Belge bitiş tarihi: sadece alınış tarihi girilmişse hesapla
    function getExpiryForField(f: FieldDefinition): string {
      const key = String(f?.key || "").trim();
      if (!key) return "";

      const doc = getCriteriaDocByType(key);
      if (!doc?.issueDate) return ""; // Alınış tarihi yoksa boş döndür

      const defYears = Number((f as any)?.durationYearsFromIssue || (f as any)?.validityYears || 0);
      const docYears = Number(doc?.validityYears || 0);
      const years = defYears > 0 ? defYears : docYears > 0 ? docYears : 0;

      if (years > 0) {
        const d = new Date(`${String(doc.issueDate).slice(0, 10)}T00:00:00.000Z`);
        if (Number.isFinite(d.getTime())) {
          d.setUTCFullYear(d.getUTCFullYear() + years);
          return d.toISOString().slice(0, 10);
        }
      }
      if (doc?.expiryDate) return String(doc.expiryDate).slice(0, 10);
      return "";
    }

    // 66 yaş tarihi
    const ageLimitDate = birthDate ? (() => {
      const bd = new Date(`${birthDate.slice(0, 10)}T00:00:00.000Z`);
      if (Number.isFinite(bd.getTime())) {
        bd.setUTCFullYear(bd.getUTCFullYear() + 66);
        return bd.toISOString().slice(0, 10);
      }
      return "";
    })() : "";

    // Grup verilerini topla
    const groupList = (cvFieldGroups || [])
      .map((g) => {
        const items: { label: string; expiry: string }[] = [];
        let hasDocsWithoutIssueDate = false;

        // Ana belgeyi tespit et
        const mainDocField = g.fields.find((f) => {
          const key = String(f.key || "").trim();
          return g.fields.some((other) => {
            const reqWith = (other as any)?.requiredWith || [];
            return Array.isArray(reqWith) && reqWith.includes(key);
          });
        });

        // Ana belgenin bitiş tarihi
        let mainDocExpiry = "";
        if (mainDocField) {
          const mainKey = String(mainDocField.key || "").trim();
          const mainVal = (cvValues as any)?.[mainKey];
          if (mainVal) {
            const mainDoc = getCriteriaDocByType(mainKey);
            if (mainDoc?.issueDate) {
              const defYears = Number((mainDocField as any)?.durationYearsFromIssue || (mainDocField as any)?.validityYears || 0);
              const docYears = Number(mainDoc?.validityYears || 0);
              const years = defYears > 0 ? defYears : docYears > 0 ? docYears : 0;
              if (years > 0) {
                const d = new Date(`${String(mainDoc.issueDate).slice(0, 10)}T00:00:00.000Z`);
                if (Number.isFinite(d.getTime())) {
                  d.setUTCFullYear(d.getUTCFullYear() + years);
                  mainDocExpiry = d.toISOString().slice(0, 10);
                }
              }
            }
          }
        }

        for (const f of g.fields || []) {
          if (!f || f.active === false) continue;
          const vt = normalizeValueType(f);
          const val = (cvValues as any)?.[f.key];

          if (vt === "boolean") {
            if (!!val) {
              const doc = getCriteriaDocByType(String(f.key || "").trim());
              if (!doc?.issueDate) hasDocsWithoutIssueDate = true;
              
              // Her belgenin kendi bitiş tarihini göster
              items.push({ label: String(f.label || f.key), expiry: getExpiryForField(f) });
            }
            continue;
          }

          if (val === null || val === undefined) continue;

          if (vt === "multiEnum") {
            if (!Array.isArray(val) || val.length === 0) continue;
            const joined = val.map((x: any) => String(x || "").trim()).filter(Boolean).join(", ");
            if (joined) items.push({ label: `${String(f.label || f.key)}: ${joined}`, expiry: "" });
            continue;
          }

          const s = typeof val === "string" ? val.trim() : String(val);
          if (s) items.push({ label: `${String(f.label || f.key)}: ${s}`, expiry: getExpiryForField(f) });
        }

        return {
          groupKey: String(g.groupKey || "").trim(),
          title: String(g.groupLabel || g.groupKey || "").trim() || "-",
          items,
          hasDocsWithoutIssueDate,
          mainDocExpiry,
        };
      })
      .filter((g) => g.items.length > 0);


    // Fotoğraf bloğu
    const photoBlock = photoSrc
      ? `<img src="${esc(photoSrc)}" alt="Foto" class="photo" />`
      : `<div class="photo photo-placeholder">${esc((nameText || "?").charAt(0).toUpperCase())}</div>`;

    // Grup HTML
    const sectionsHtml = groupList
      .map((g) => {
        const rows = g.items.map((item) => {
          const expiryHtml = item.expiry
            ? `<span class="expiry">Geçerlilik: ${esc(item.expiry)}</span>`
            : "";
          return `<li>${esc(item.label)}${expiryHtml}</li>`;
        }).join("");
        const mainDocBadge = g.mainDocExpiry
          ? `<span class="main-doc-expiry">Geçerlilik: ${esc(g.mainDocExpiry)}</span>`
          : "";
        const ageLimitBadge = !g.mainDocExpiry && g.hasDocsWithoutIssueDate && ageLimitDate
          ? `<span class="age-limit">Sistemden düşme: ${esc(ageLimitDate)}</span>`
          : "";
        return `<div class="cv-section"><h3>${esc(g.title)}${mainDocBadge}${ageLimitBadge}</h3><ul>${rows}</ul></div>`;
      })
      .join("");

    return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CV — ${esc(nameText || "DriverAll")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.5; }

    .cv-page { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }

    /* Header */
    .cv-header { display: flex; align-items: center; gap: 24px; padding: 32px 32px 24px; border-bottom: 2px solid #e2e8f0; }
    .photo { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 3px solid #e2e8f0; }
    .photo-placeholder { display: flex; align-items: center; justify-content: center; background: #e2e8f0; color: #64748b; font-size: 36px; font-weight: 700; }
    .header-info { flex: 1; min-width: 0; }
    .header-info h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .header-info .subtitle { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .contact-row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: #475569; }
    .contact-row span { display: inline-flex; align-items: center; gap: 4px; }

    /* Actions (screen only) */
    .cv-actions { padding: 12px 32px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; display: flex; gap: 8px; }
    .cv-actions button { border: 1px solid #cbd5e1; background: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500; }
    .cv-actions button.primary { background: #0ea5e9; color: #fff; border-color: #0ea5e9; }
    .cv-actions button:hover { opacity: 0.85; }

    /* Body */
    .cv-body { padding: 24px 32px 32px; }

    /* About */
    .cv-about { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
    .cv-about h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 6px; }
    .cv-about p { font-size: 13px; color: #334155; line-height: 1.6; }

    /* Sections */
    .cv-section { margin-bottom: 18px; break-inside: avoid; page-break-inside: avoid; }
    .cv-section h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0ea5e9; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #f1f5f9; }
    .cv-section ul { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 16px; }
    .cv-section li { font-size: 13px; color: #1e293b; padding: 3px 0; position: relative; padding-left: 14px; }
    .cv-section li::before { content: "•"; position: absolute; left: 0; color: #94a3b8; font-weight: 700; }
    .expiry { display: inline-block; margin-left: 6px; font-size: 10px; color: #f59e0b; background: #fef3c7; padding: 1px 6px; border-radius: 4px; font-weight: 500; }
    .age-limit { float: right; font-size: 9px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 500; margin-top: 1px; }
    .main-doc-expiry { float: right; font-size: 9px; color: #10b981; background: #d1fae5; padding: 2px 8px; border-radius: 4px; font-weight: 500; margin-top: 1px; }

    /* Responsive */
    @media (max-width: 640px) {
      .cv-header { flex-direction: column; text-align: center; padding: 24px 16px 20px; }
      .contact-row { justify-content: center; }
      .cv-body { padding: 16px; }
      .cv-actions { padding: 10px 16px; }
      .cv-section ul { flex-direction: column; gap: 4px; }
    }

    /* Print */
    @media print {
      body { background: #fff; }
      .cv-page { margin: 0; box-shadow: none; border-radius: 0; }
      .cv-actions { display: none !important; }
      .cv-header { border-bottom-color: #cbd5e1; }
      .cv-section h3 { color: #0f172a; border-bottom-color: #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="cv-page">
    <div class="cv-header">
      ${photoBlock}
      <div class="header-info">
        <h1>${esc(nameText || "-")}</h1>
        <div class="contact-row">
          <span>📞 ${esc(phoneText || "-")}</span>
          <span>📍 ${esc(locationText)}</span>
          ${expYears ? `<span>💼 ${esc(expYears)} yıl deneyim</span>` : ""}
        </div>
      </div>
    </div>

    <div class="cv-actions">
      <button class="primary" onclick="window.print()">Yazdır / PDF</button>
      <button onclick="window.close()">Kapat</button>
    </div>

    <div class="cv-body">
      ${aboutText ? `<div class="cv-about"><h3>Hakkımda</h3><p>${esc(aboutText).replace(/\n/g, "<br/>")}</p></div>` : ""}
      ${sectionsHtml}
    </div>
  </div>
</body>
</html>`;
  }

  async function handleCreateCv() {
    if (creatingCv) return;
    setCreatingCv(true);
    setError(null);
    try {
      if (!cvLocked && cvDirty) {
        await saveCv({ silent: true });
      }

      const html = buildCvHtml();
      const w = window.open("", "_blank");
      if (!w) throw new Error("Pop-up engellendi. Tarayıcı izinlerini kontrol edin.");
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    } catch (e: any) {
      setError(e?.message || "CV oluşturulamadı.");
    } finally {
      setCreatingCv(false);
    }
  }

  function renderCvFieldInput(field: FieldDefinition) {
    const val = cvValues[field.key];
    const vt = normalizeValueType(field);

    // Conditional visibility (passport -> visa)
    const metaVis = (field as any)?.meta?.visibility;
    if (metaVis && metaVis.dependsOnKey) {
      const depKey = String(metaVis.dependsOnKey || "").trim();
      const depVal = (cvValues as any)?.[depKey];
      const whenFilled = metaVis.whenFilled === true;
      const isFilled = depVal != null && String(depVal).trim() !== "";
      const visible = whenFilled ? isFilled : !isFilled;
      if (!visible) {
        return null;
      }
    }

    const uiType = String((field as any)?.uiType || "").trim().toLowerCase();
    const optionsGroupKey = String((field as any)?.optionsGroupKey || "").trim();

    function optionsForField(): FieldGroupNode[] {
      if (!optionsGroupKey) return [];
      const g = (optionGroups || []).find(
        (x) => String(x?.groupKey || "").trim() === optionsGroupKey && x?.active !== false
      );
      if (!g) return [];
      return (g.nodes || []).filter((n) => n && n.active !== false).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    }
    if (vt === "boolean") {
      const auto = isAutoAdded(cvReasons, field.key);
      const isDepField = cvDepKeySet.has(String(field.key || "").trim());
      const fullDesc = String((field as any)?.description || "").trim();
      const desc = shortText(fullDesc);
      return (
        <>
          <label
            key={field.key}
            className={`flex items-start gap-3 rounded-xl border p-3 text-sm min-w-0 overflow-hidden ${
              val ? "border-sky-500 bg-sky-500/10" : "border-slate-800"
            }`}
          >
            <input
              type="checkbox"
              disabled={cvLocked || auto}
              checked={!!val}
              onChange={(e) => {
                setCvDirty(true);
                const next = e.target.checked;
                if (next) {
                  enforceSingleSelectGroup(String((field as any)?.groupKey || ""), String(field.key || ""));
                }
                setCvValues((p) => ({ ...p, [field.key]: next }));
                if (!isDepField) return;
                setCvManualKeys((prev) => {
                  const s = new Set(prev);
                  next ? s.add(field.key) : s.delete(field.key);
                  return Array.from(s);
                });
              }}
            />
            <div className="flex-1">
              <div className="text-slate-100 break-words leading-snug">
                {field.label}
                {auto ? <span className="ml-2 text-[10px] text-amber-300">• oto</span> : null}
              </div>
              {desc ? (
                <div className="mt-1 text-[10px] text-slate-500 leading-4" title={fullDesc}>
                  {desc}
                </div>
              ) : null}
            </div>
          </label>
          {renderDocumentDatesForField(field)}
        </>
      );
    }

    // select / multiselect
    if (uiType === "select" && optionsGroupKey) {
      const opts = optionsForField();
      return (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400">{field.label}</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs outline-none focus:border-sky-500"
            value={val || ""}
            disabled={cvLocked}
            onChange={(e) => {
              setCvDirty(true);
              const nextVal = e.target.value;
              setCvValues((p) => ({ ...p, [field.key]: nextVal }));
            }}
          >
            <option value="">Seçiniz</option>
            {opts.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (uiType === "multiselect" && optionsGroupKey) {
      const opts = optionsForField();
      const selected = Array.isArray(val) ? val.map((x: any) => String(x || "").trim()).filter(Boolean) : [];
      return (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400">{field.label}</label>
          <div className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {opts.map((o) => {
                const checked = selected.includes(o.key);
                return (
                  <label key={o.key} className="flex items-center gap-2 text-[11px] text-slate-200">
                    <input
                      type="checkbox"
                      disabled={cvLocked}
                      checked={checked}
                      onChange={(e) => {
                        setCvDirty(true);
                        const next = new Set(selected);
                        if (e.target.checked) next.add(o.key);
                        else next.delete(o.key);
                        setCvValues((p) => ({ ...p, [field.key]: Array.from(next) }));
                      }}
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <label className="text-[10px] text-slate-400">{field.label}</label>
        <input
          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs outline-none focus:border-sky-500"
          value={val || ""}
          disabled={cvLocked}
          onChange={(e) => {
            setCvDirty(true);
            setCvValues((p) => ({ ...p, [field.key]: e.target.value }));
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center sticky top-0 z-30 bg-slate-950/95 backdrop-blur py-3 -mt-3">
          <h1 className="text-xl font-bold">Profil & CV Yönetimi</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateCv}
              disabled={creatingCv}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-xs font-semibold text-slate-950 transition disabled:opacity-60"
              type="button"
            >
              {creatingCv ? "Hazırlanıyor..." : "CV Oluştur"}
            </button>
            <button
              onClick={() => { setCvLocked(!cvLocked); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition"
              type="button"
            >
              {cvLocked ? "CV Düzenle" : "Düzenlemeyi Bitir"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/50 text-rose-400 rounded-lg text-xs">
            {error}
          </div>
        )}
        {profileInfo && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs">
            {profileInfo}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-sm font-semibold mb-4 border-b border-slate-800 pb-2">Kişisel Bilgiler</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 flex-shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-slate-700" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-500">
                      {(fullName || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-400">Profil Fotoğrafı</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30 file:cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                    }}
                    disabled={uploadingAvatar}
                  />
                  <div className="text-[9px] text-slate-500">{uploadingAvatar ? "Yükleniyor..." : "Max 10MB, otomatik 400×400px"}</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Ad Soyad</label>
                <input
                  placeholder="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">
                  Doğum Tarihi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="GG/AA/YYYY"
                  value={birthDate ? (() => {
                    if (birthDate.startsWith("raw:")) return birthDate.slice(4);
                    const parts = birthDate.split("-");
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : birthDate;
                  })() : ""}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9/]/g, "");
                    // Auto-add slash after day and month
                    const digits = v.replace(/\//g, "");
                    if (digits.length >= 4) {
                      v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
                    } else if (digits.length >= 2) {
                      v = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                    } else {
                      v = digits;
                    }
                    if (v.length > 10) v = v.slice(0, 10);
                    // Convert DD/MM/YYYY to YYYY-MM-DD for state
                    const match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                    if (match) {
                      setBirthDate(`${match[3]}-${match[2]}-${match[1]}`);
                    } else {
                      setBirthDate(v ? `raw:${v}` : "");
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500"
                />
                {!birthDate && (
                  <div className="text-[10px] text-amber-400">
                    ⚠️ Doğum tarihi belge geçerlilik hesaplamaları için gereklidir
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Telefon</label>
                <input
                  placeholder="Telefon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">İl</label>
                  <select
                    value={cityCode}
                    onChange={(e) => {
                      const s = cityOptions.find((c) => c.code === e.target.value);
                      setCityCode(e.target.value);
                      setCity(s?.name || "");
                      setDistrictCode("");
                      setDistrict("");
                      setTimeout(() => districtSelectRef.current?.focus(), 150);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs outline-none"
                  >
                    <option value="">{loadingCities ? "Yükleniyor..." : "İl Seçin"}</option>
                    {cityOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">İlçe</label>
                  <select
                    ref={districtSelectRef}
                    value={districtCode}
                    onChange={(e) => {
                      const s = districtOptions.find((d) => d.code === e.target.value);
                      setDistrictCode(e.target.value);
                      setDistrict(s?.name || "");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs outline-none"
                  >
                    <option value="">{loadingDistricts ? "Yükleniyor..." : "İlçe Seçin"}</option>
                    {districtOptions.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alt Roller (dinamik) */}
              {candidateSubRoles.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400">Alt Roller</label>
                  <div className="flex flex-wrap gap-2">
                    {candidateSubRoles.map((sr) => {
                      const checked = selectedSubRoles.includes(sr.key);
                      return (
                        <label
                          key={sr.key}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                            checked
                              ? "border-violet-600/50 bg-violet-950/40 text-violet-200"
                              : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubRoles((prev) => [...prev, sr.key]);
                              } else {
                                setSelectedSubRoles((prev) => prev.filter((k) => k !== sr.key));
                              }
                            }}
                            className="h-3 w-3 rounded border-slate-600 bg-slate-950 text-violet-500 accent-violet-500"
                          />
                          {sr.label}
                        </label>
                      );
                    })}
                  </div>
                  {selectedSubRoles.length === 0 && (
                    <p className="text-[10px] text-amber-400/70">En az bir alt rol seçmeniz önerilir.</p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Hakkımda</label>
                <textarea
                  placeholder="Hakkımda"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none min-h-[100px]"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-bold text-slate-950 transition disabled:opacity-50"
              >
                {savingProfile ? "Güncelleniyor..." : "Profili Kaydet"}
              </button>
            </form>

            <div className="mt-6">
              <div className="text-xs font-semibold text-slate-100">Reklam</div>
              <div className="mt-3">
                <AdSlot placement="HOME_RIGHT" country="TR" />
              </div>
            </div>
          </section>

          <section className="lg:col-span-8 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-sm font-semibold mb-4 border-b border-slate-800 pb-2">CV Kriterleri ve Yetkinlikler</h2>
            {cvFieldGroups.length === 0 ? (
              <div className="text-xs text-slate-400">
                Henüz CV kriteri tanımlı değil. Admin panelinden kriter/field ekledikten sonra burada görünecek.
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                {cvFieldGroups.map((group) => {
                  // Ana belgeyi tespit et (diğer belgeler ona bağımlı mı?)
                  const mainDocField = group.fields.find((f) => {
                    const key = String(f.key || "").trim();
                    // Bu belgeye bağımlı başka belgeler var mı?
                    return group.fields.some((other) => {
                      const reqWith = (other as any)?.requiredWith || [];
                      return Array.isArray(reqWith) && reqWith.includes(key);
                    });
                  });

                  // Ana belgenin bitiş tarihi (bağımlı belgeler için grup başlığında gösterilecek)
                  let mainDocExpiry = "";
                  if (mainDocField) {
                    const mainKey = String(mainDocField.key || "").trim();
                    const mainVal = (cvValues as any)?.[mainKey];
                    if (mainVal) {
                      const mainDoc = getCriteriaDocByType(mainKey);
                      if (mainDoc?.issueDate) {
                        const defYears = Number((mainDocField as any)?.durationYearsFromIssue || (mainDocField as any)?.validityYears || 0);
                        const docYears = Number(mainDoc?.validityYears || 0);
                        const years = defYears > 0 ? defYears : docYears > 0 ? docYears : 0;
                        if (years > 0) {
                          const d = new Date(`${String(mainDoc.issueDate).slice(0, 10)}T00:00:00.000Z`);
                          if (Number.isFinite(d.getTime())) {
                            d.setUTCFullYear(d.getUTCFullYear() + years);
                            mainDocExpiry = d.toISOString().slice(0, 10);
                          }
                        }
                      }
                    }
                  }

                  // Grup içinde alınış tarihi girilmemiş belge var mı kontrol et
                  const hasDocsWithoutIssueDate = group.fields.some((f) => {
                    const vt = normalizeValueType(f);
                    if (vt !== "boolean") return false;
                    const val = (cvValues as any)?.[f.key];
                    if (!val) return false;
                    const doc = getCriteriaDocByType(String(f.key || "").trim());
                    return !doc?.issueDate;
                  });

                  // 66 yaş tarihi
                  const ageLimitDate = birthDate ? (() => {
                    const bd = new Date(`${birthDate.slice(0, 10)}T00:00:00.000Z`);
                    if (Number.isFinite(bd.getTime())) {
                      bd.setUTCFullYear(bd.getUTCFullYear() + 66);
                      return bd.toISOString().slice(0, 10);
                    }
                    return null;
                  })() : null;

                  return (
                    <div key={group.groupKey} className="space-y-3">
                      <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                        {group.groupLabel}
                        {mainDocExpiry && (
                          <span className="text-[9px] font-medium text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded normal-case tracking-normal">
                            Geçerlilik: {mainDocExpiry}
                          </span>
                        )}
                        {!mainDocExpiry && hasDocsWithoutIssueDate && ageLimitDate && (
                          <span className="text-[9px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded normal-case tracking-normal">
                            Sistemden düşme: {ageLimitDate}
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                      {group.fields.map((field) => {
                        const vt = normalizeValueType(field);
                        return (
                          <div key={field._id} className="min-w-0">
                            {renderCvFieldInput(field)}
                            {vt !== "boolean" && renderDocumentDatesForField(field)}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!cvLocked && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span>* Değişiklikler otomatik kaydedilir.</span>
                <button
                  onClick={() => saveCv()}
                  disabled={savingCv}
                  className="bg-sky-500/20 text-sky-400 px-4 py-1.5 rounded-lg hover:bg-sky-500/30 transition"
                  type="button"
                >
                  {savingCv ? "Kaydediliyor..." : "Manuel Kaydet"}
                </button>
              </div>
            )}
          </section>
        </div>
    </div>
  );
}
