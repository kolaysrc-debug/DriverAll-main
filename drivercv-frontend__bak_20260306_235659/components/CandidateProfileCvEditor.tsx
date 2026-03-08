"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AdSlot from "@/components/AdSlot";
import {
  GroupNode,
  Reason,
  resolveGroupSelection,
  isAutoAdded,
} from "@/lib/groupCriteriaEngine";

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

  const [cityOptions, setCityOptions] = useState<LocationItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [candidateSubRoles, setCandidateSubRoles] = useState<CandidateSubRoleItem[]>([]);
  const [subRoleLoading, setSubRoleLoading] = useState(false);
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

        setSubRoleLoading(true);

        const [
          pRes,
          cvRes,
          cvProfileRes,
          fRes,
          uRes,
          filtersRes,
          groupsRes,
          subRolesRes,
          dpRes,
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
          fetch("/api/public/roles/candidate-subroles", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          fetch("/api/profile/dynamic", { headers }),
        ]);

        const pJson = await pRes.json();
        const cvJson = await cvRes.json();
        const cvProfileJson = await cvProfileRes.json().catch(() => ({}));
        const fJson = await fRes.json();
        const uJson = await uRes.json().catch(() => ({}));
        const filtersJson = await filtersRes.json().catch(() => ({}));
        const groupsJson = await groupsRes.json().catch(() => ({}));
        const subJson = await subRolesRes.json().catch(() => ({}));
        const dpJson = await dpRes.json().catch(() => ({}));

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

        const list = Array.isArray(subJson?.subRoles) ? subJson.subRoles : [];
        const mapped: CandidateSubRoleItem[] = list
          .map((x: any) => ({
            key: String(x?.key || "").trim(),
            label: String(x?.label || x?.key || "").trim(),
            description: String(x?.description || "").trim() || undefined,
          }))
          .filter((x: CandidateSubRoleItem) => !!x.key);
        setCandidateSubRoles(mapped);

        const initialSelected = Array.isArray(uJson?.user?.subRoles) ? uJson.user.subRoles : [];
        setSelectedSubRoles(initialSelected.map((x: any) => String(x || "")).filter(Boolean));

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
        }

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
        setCandidateSubRoles([]);
        setSelectedSubRoles([]);
        setDepNodes([]);
        setOptionGroups([]);
        setCriteriaGroups([]);
        setCriteriaDocs([]);
      } finally {
        setSubRoleLoading(false);
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileInfo(null);

    try {
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
      if (!options?.silent) setCvInfo("CV Güncellendi.");
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
        if (!map.has(gk)) map.set(gk, { groupKey: gk, groupLabel: gl, fields: [] });
        map.get(gk)!.fields.push(f);
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

    const requiresIssueDate = !!(field as any)?.requiresIssueDate;
    const hasExpiry = !!(field as any)?.hasExpiry;
    if (!requiresIssueDate && !hasExpiry) return null;

    const val = (cvValues as any)?.[key];
    const vt = normalizeValueType(field);
    const isSelected = (() => {
      if (vt === "boolean") return val === true;
      if (vt === "multiEnum") return Array.isArray(val) && val.length > 0;
      return val != null && String(val).trim() !== "";
    })();
    if (!isSelected) return null;

    const doc = getCriteriaDocByType(key) || { type: key, issueDate: null, expiryDate: null };

    const expiryMode = String((field as any)?.expiryMode || "none");
    const durationYearsFromIssueRaw = (field as any)?.durationYearsFromIssue;
    const validityYearsRaw = (field as any)?.validityYears;
    const yearsFromIssue =
      durationYearsFromIssueRaw != null
        ? Number(durationYearsFromIssueRaw)
        : validityYearsRaw != null
          ? Number(validityYearsRaw)
          : null;

    const allowsCandidateValidityYears =
      hasExpiry &&
      expiryMode === "durationFromIssue" &&
      (!Number.isFinite(yearsFromIssue as any) || (yearsFromIssue as any) <= 0);

    const computedExpiry = (() => {
      if (!hasExpiry) return "";
      if (expiryMode !== "durationFromIssue") return "";
      if (!doc.issueDate) return "";
      const vy = doc?.validityYears != null ? Number(doc.validityYears) : null;
      const years =
        Number.isFinite(yearsFromIssue as any) && (yearsFromIssue as any) > 0
          ? Number(yearsFromIssue)
          : Number.isFinite(vy as any) && (vy as any) > 0
            ? Number(vy)
            : null;
      if (!Number.isFinite(years as any) || (years as any) <= 0) return "";
      const d = new Date(`${String(doc.issueDate).slice(0, 10)}T00:00:00.000Z`);
      if (!Number.isFinite(d.getTime())) return "";
      d.setUTCFullYear(d.getUTCFullYear() + Number(years));
      return d.toISOString().slice(0, 10);
    })();

    return (
      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
        <div className="text-[10px] text-slate-400 font-semibold">{field.label} Tarihleri</div>
        {requiresIssueDate ? (
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
        ) : null}

        {allowsCandidateValidityYears ? (
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

        {hasExpiry && expiryMode === "durationFromIssue" ? (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Geçerlilik Bitiş (Otomatik)</label>
            <div className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-xs text-slate-200 select-text">
              {computedExpiry || "-"}
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
    const locationText = [locCity, locDistrict].filter(Boolean).join(" / ") || "-";
    const aboutText = String(about || profile?.about || "").trim();

    const groupList = (cvFieldGroups || [])
      .map((g) => {
        const lines: string[] = [];

        for (const f of g.fields || []) {
          if (!f || f.active === false) continue;
          const vt = normalizeValueType(f);
          const val = (cvValues as any)?.[f.key];

          if (vt === "boolean") {
            if (val === true) lines.push(String(f.label || f.key));
            continue;
          }

          if (val === null || val === undefined) continue;

          if (vt === "multiEnum") {
            if (!Array.isArray(val) || val.length === 0) continue;
            const joined = val.map((x: any) => String(x || "").trim()).filter(Boolean).join(", ");
            if (!joined) continue;
            lines.push(`${String(f.label || f.key)}: ${joined}`);
            continue;
          }

          const s = typeof val === "string" ? val.trim() : String(val);
          if (!s) continue;
          lines.push(`${String(f.label || f.key)}: ${s}`);
        }

        const uniqueLines = Array.from(new Set(lines));
        return {
          groupKey: String(g.groupKey || "").trim(),
          title: String(g.groupLabel || g.groupKey || "").trim() || "-",
          lines: uniqueLines,
        };
      })
      .filter((g) => g.lines.length > 0);

    const esc = (x: string) =>
      String(x || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");

    const escAttr = (x: string) => esc(x).replace(/'/g, "&#39;");

    const aboutBlock = aboutText
      ? `<div class="section"><div class="h">Hakkımda</div><div class="p">${esc(aboutText).replace(/\n/g, "<br/>")}</div></div>`
      : "";

    const groupsBlock = groupList
      .map(
        (g) =>
          `<div class="section" data-groupkey="${escAttr(g.groupKey)}" data-title="${escAttr(
            String(g.title || "")
          )}"><div class="h">${esc(g.title)}</div><ul>${g.lines
            .map((l) => `<li>${esc(l)}</li>`)
            .join("")}</ul></div>`
      )
      .join("");

    return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CV • ${esc(nameText || "DriverAll")}</title>
  <style>
    :root { --bg: #0b1020; --card:#0f172a; --border: rgba(148,163,184,0.28); --text:#e5e7eb; --muted:#94a3b8; --accent:#38bdf8; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background: #fff; color:#0b1020; }
    .page { max-width: 900px; margin: 0 auto; padding: 28px; }
    .top { display:flex; gap:16px; align-items:flex-start; justify-content:space-between; border:1px solid var(--border); border-radius: 14px; padding: 18px 18px; }
    .name { font-size: 22px; font-weight: 800; margin: 0; }
    .meta { margin-top: 6px; font-size: 12px; color: #334155; }
    .meta span { display:inline-block; margin-right: 10px; }
    .actions { display:flex; gap:8px; }
    .btn { border:1px solid #cbd5e1; background:#fff; padding:8px 10px; border-radius: 10px; font-size: 12px; cursor:pointer; }
    .btn.primary { border-color: #38bdf8; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
    .section { border:1px solid var(--border); border-radius: 14px; padding: 14px 14px; }
    .h { font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; }
    ul { margin: 0; padding-left: 18px; }
    li { margin: 6px 0; font-size: 13px; color:#0b1020; break-inside: avoid; page-break-inside: avoid; }
    .p { font-size: 13px; color:#0b1020; line-height: 1.55; }
    .section[data-groupkey="EHL_TR"] ul { columns: 2; column-gap: 22px; }
    .section[data-title*="Ehliyet"] ul { columns: 2; column-gap: 22px; }
    @media (max-width: 720px) {
      .page { padding: 14px; }
      .top { flex-direction: column; align-items: stretch; }
      .actions { justify-content: flex-start; flex-wrap: wrap; }
      .grid { grid-template-columns: 1fr; }
      .section[data-groupkey="EHL_TR"] ul { columns: 1; }
      .section[data-title*="Ehliyet"] ul { columns: 1; }
    }
    @media print {
      .actions { display: none; }
      body { background: #fff; }
      .page { padding: 0; }
      .top, .section { border-color: #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <div>
        <h1 class="name">${esc(nameText || "-")}</h1>
        <div class="meta">
          <span>Telefon: ${esc(phoneText || "-")}</span>
          <span>Konum: ${esc(locationText)}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn primary" onclick="window.print()">Yazdır / PDF Kaydet</button>
        <button class="btn" onclick="window.close()">Kapat</button>
      </div>
    </div>

    <div class="grid">
      ${aboutBlock}
      ${groupsBlock}
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
        <label
          key={field.key}
          className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
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
              if (!isDepField) {
                setCvValues((p) => ({ ...p, [field.key]: next }));
                return;
              }
              setCvManualKeys((prev) => {
                const s = new Set(prev);
                next ? s.add(field.key) : s.delete(field.key);
                return Array.from(s);
              });
            }}
          />
          <div className="flex-1">
            <div className="text-slate-100">
              {field.label}
              {auto ? <span className="ml-2 text-[10px] text-amber-300">• oto</span> : null}
            </div>
            {desc ? (
              <div className="mt-1 text-[10px] text-slate-500 leading-4" title={fullDesc}>
                {desc}
              </div>
            ) : null}
            {renderDocumentDatesForField(field)}
          </div>
        </label>
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
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
              onClick={() => setCvLocked(!cvLocked)}
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
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Ad Soyad</label>
                <input
                  placeholder="Ad Soyad"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-slate-400">Alt Roller</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(candidateSubRoles.length > 0
                    ? (candidateSubRoles.map((r) => [r.key, r.label, r.description || ""]) as Array<
                        [string, string, string]
                      >)
                    : ([
                        ["driver", "Driver", ""],
                        ["courier", "Kurye", ""],
                        ["forklift", "Forklift", ""],
                        ["shuttle", "Servis", ""],
                      ] as Array<[string, string, string]>)
                  ).map(([k, label, desc]: [string, string, string]) => (
                    <label
                      key={String(k)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={(selectedSubRoles || []).includes(String(k))}
                        onChange={(e) => {
                          const key = String(k);
                          setSelectedSubRoles((prev) => {
                            const set = new Set((prev || []).map((x) => String(x)));
                            if (e.target.checked) set.add(key);
                            else set.delete(key);
                            return Array.from(set);
                          });
                        }}
                      />
                      <span title={String(desc || "")}>{String(label)}</span>
                    </label>
                  ))}
                </div>
                {subRoleLoading ? (
                  <div className="text-[10px] text-slate-500">Roller yükleniyor...</div>
                ) : null}
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
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {cvFieldGroups.map((group) => (
                  <div key={group.groupKey} className="space-y-3">
                    <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">{group.groupLabel}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {group.fields.map((field) => (
                        <div key={field._id}>
                          {renderCvFieldInput(field)}
                          {renderDocumentDatesForField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
    </main>
  );
}
