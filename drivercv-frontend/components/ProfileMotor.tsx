/**
 * ROUTE: /components/ProfileMotor.tsx
 * DATE: 2026-01-26 16:10:00 GMT
 */

"use client";

import React from 'react';
import { ProfileFieldDefinition } from '@/types/profile-engine';

interface ProfileMotorProps {
  definitions: ProfileFieldDefinition[];
  values: Record<string, any>;
  onValueChange: (key: string, value: any) => void;
  userRole: string;
  userCountry: string;
}

const SECTION_LABELS: Record<string, string> = {
  identity: "Kimlik Bilgileri",
  business: "İşletme Yapısı & Ticari Bilgiler",
  contact: "İletişim & Adres",
  financial: "Mali Bilgiler"
};

export default function ProfileMotor({
  definitions = [],
  values = {},
  onValueChange,
  userRole,
  userCountry
}: ProfileMotorProps) {

  if (!definitions || !Array.isArray(definitions)) return <div className="text-white text-xs">Yükleniyor...</div>;

  const activeFields = definitions
    .filter(f => {
      const basicMatch = f.role.includes(userRole) && f.countries.includes(userCountry);
      if (f.visibleIf) {
        const dependentValue = values[f.visibleIf.fieldKey];
        return basicMatch && f.visibleIf.values.includes(dependentValue);
      }
      return basicMatch;
    })
    .sort((a, b) => a.order - b.order);

  const sections = Array.from(new Set(activeFields.map(f => f.section)));

  return (
    <div className="space-y-8 text-slate-100">
      {sections.map(sectionKey => {
        const fields = activeFields.filter(f => f.section === sectionKey);
        return (
          <div key={sectionKey} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-6 border-b border-slate-800/50 pb-2">
              {SECTION_LABELS[sectionKey] || sectionKey}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fields.map(field => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-slate-400 ml-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {field.type === "select" ? (
                    <select
                      value={values[field.key] || ""}
                      onChange={(e) => onValueChange(field.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500 text-white"
                    >
                      <option value="">Seçiniz</option>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === "file" ? (
                    <div className="relative h-10">
                      <input
                        type="file"
                        onChange={(e) => onValueChange(field.key, e.target.files?.[0]?.name)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full bg-slate-950 border border-dashed border-slate-700 rounded-xl flex items-center justify-center gap-2">
                        <span className="text-[11px] text-slate-400 truncate px-2">
                          {values[field.key] || "Dosya Seç (PDF/JPG)"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={values[field.key] || ""}
                      onChange={(e) => onValueChange(field.key, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-sm outline-none focus:border-sky-500 text-white px-3 h-10"
                      placeholder={`${field.label} giriniz...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}