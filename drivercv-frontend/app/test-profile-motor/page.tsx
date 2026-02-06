/**
 * ROUTE: /app/test-profile-motor/page.tsx
 * DATE: 2026-01-26 19:15:00 GMT
 */

"use client";

import React, { useState } from 'react';
import ProfileMotor from '../../components/ProfileMotor';
import { CANDIDATE_SUB_ROLES, SubRole } from '../../types/role-engine';

export default function CandidateProfilePage() {
  const [selectedRoles, setSelectedRoles] = useState<SubRole[]>([]);
  const [isLocked, setIsLocked] = useState(false); // Seçim kilitli mi?
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  // Dinamik Alan Tanımları (SubRole bazlı)
  const getDefinitions = () => {
    const defs: any[] = [
      { id: "gen1", key: "full_name", label: "Ad Soyad", type: "text", section: "identity", role: ["candidate"], countries: ["TR"], required: true, order: 1 }
    ];

    // Eğer Sürücü seçildiyse Ehliyet alanını ekle
    if (selectedRoles.includes("driver")) {
      defs.push({ id: "d1", key: "license_type", label: "Ehliyet Sınıfı", type: "select", options: ["B", "C", "D", "E", "G"], section: "business", role: ["candidate"], countries: ["TR"], required: true, order: 10 });
    }

    // Eğer Operatör seçildiyse Operatör Belgesi yükleme alanını ekle
    if (selectedRoles.includes("operator")) {
      defs.push({ id: "o1", key: "operator_cert", label: "Operatörlük Belgesi (PDF)", type: "file", section: "business", role: ["candidate"], countries: ["TR"], required: true, order: 11 });
    }

    // Eğer Kurye seçildiyse
    if (selectedRoles.includes("courier")) {
      defs.push({ id: "c1", key: "has_bike", label: "Kendine Ait Motorun Var mı?", type: "select", options: ["Evet", "Hayır"], section: "business", role: ["candidate"], countries: ["TR"], required: true, order: 12 });
    }

    return defs;
  };

  const toggleRole = (role: SubRole) => {
    if (isLocked) return; // Kilitliyse işlem yapma
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleFinalizeRoles = () => {
    if (selectedRoles.length === 0) {
      alert("Lütfen en az bir rol seçiniz.");
      return;
    }
    setIsLocked(true); // Box'ları kilitle
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] p-6 lg:p-12 text-white flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-10">
        
        {/* 1. ADIM: ROL SEÇİMİ (CHECKBOX) */}
        <section className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl shadow-2xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-sky-400">Başvurmak İstediğiniz Pozisyonlar</h2>
              <p className="text-slate-400 text-xs mt-1">Birden fazla seçim yapabilirsiniz. Kayıttan sonra değiştirilemez.</p>
            </div>
            {isLocked && (
              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20">
                Roller Kilitlendi
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CANDIDATE_SUB_ROLES.map((role) => (
              <label 
                key={role.key} 
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer
                  ${selectedRoles.includes(role.key) ? 'border-sky-500 bg-sky-500/5' : 'border-slate-800 bg-slate-950/50'}
                  ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:border-slate-600'}
                `}
              >
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 accent-sky-500"
                  checked={selectedRoles.includes(role.key)}
                  onChange={() => toggleRole(role.key)}
                  disabled={isLocked}
                />
                <div>
                  <div className="text-sm font-bold">{role.label}</div>
                  <div className="text-[10px] text-slate-500">{role.description}</div>
                </div>
              </label>
            ))}
          </div>

          {!isLocked && (
            <button 
              onClick={handleFinalizeRoles}
              className="mt-6 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
            >
              Seçilen Rolleri Onayla ve Devam Et
            </button>
          )}
        </section>

        {/* 2. ADIM: DİNAMİK PROFİL (SADECE ROL SEÇİLDİYSE VE ONAYLANDIYSA GÖRÜNÜR) */}
        {isLocked && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="border-l-4 border-sky-500 pl-4 py-1 mb-6 text-white">
              <h3 className="font-bold">Profil Bilgilerini Tamamla</h3>
              <p className="text-xs text-slate-400">Seçtiğiniz rollere göre gerekli belgeler aşağıda listelenmiştir.</p>
            </div>
            
            <div className="bg-slate-900/20 rounded-3xl border border-white/5">
              <ProfileMotor 
                definitions={getDefinitions()} 
                values={profileData} 
                onValueChange={(k, v) => setProfileData({...profileData, [k]: v})} 
                userRole="candidate" 
                userCountry="TR" 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}