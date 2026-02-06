// PATH: drivercv-frontend/components/admin/RuleManagerForm.tsx - 25.01.2026
// --------------------------------------------------------------------------------
// Admin Kural Yönetim Formu
// - Dinamik Belge Türetme
// - Zone (Bölge) Atama
// - Hiyerarşi ve Bağımlılık Kuralları
// --------------------------------------------------------------------------------

import React, { useState } from 'react';

interface RuleManagerProps {
  initialData?: any;
  allExistingNodes: { key: string; label: string }[]; // Diğer belgeler (seçim için)
  onSave: (data: any) => void;
}

export const RuleManagerForm: React.FC<RuleManagerProps> = ({ initialData, allExistingNodes, onSave }) => {
  const [formData, setFormData] = useState({
    key: initialData?.key || '',
    label: initialData?.label || '',
    isActive: initialData?.isActive ?? true,
    zones: initialData?.zones || ['TR'], // Varsayılan TR
    coverage: initialData?.coverage || [],
    requiredWith: initialData?.requiredWith || [],
  });

  const zonesList = ['TR', 'EU', 'US', 'UK', 'AZ']; // Admin yeni zonlar ekleyebilir

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-bold mb-6 border-b pb-2 text-gray-800">
        {formData.key ? `Düzenle: ${formData.label}` : 'Yeni Belge/Yetenek Türet'}
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Sol Kolon: Temel Bilgiler */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sistem Anahtarı (Key)</label>
            <input 
              type="text" 
              className="mt-1 block w-full border rounded-md p-2 bg-gray-50"
              value={formData.key}
              onChange={(e) => setFormData({...formData, key: e.target.value})}
              placeholder="örn: code-95"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Etiket (Label)</label>
            <input 
              type="text" 
              className="mt-1 block w-full border rounded-md p-2"
              value={formData.label}
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              placeholder="örn: Code 95 Eğitimi"
            />
          </div>
          
          {/* ZONE SEÇİMİ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Geçerli Olduğu Zonlar</label>
            <div className="flex flex-wrap gap-2">
              {zonesList.map(zone => (
                <button
                  key={zone}
                  onClick={() => {
                    const newZones = formData.zones.includes(zone) 
                      ? formData.zones.filter(z => z !== zone)
                      : [...formData.zones, zone];
                    setFormData({...formData, zones: newZones});
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    formData.zones.includes(zone) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Kurallar */}
        <div className="space-y-4">
          {/* KAPSAMA (COVERAGE) */}
          <div>
            <label className="block text-sm font-medium text-blue-700 font-bold">Müktesep Hak (Bu belge neleri kapsar?)</label>
            <select 
              multiple
              className="mt-1 block w-full border rounded-md p-2 h-32"
              value={formData.coverage}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({...formData, coverage: values});
              }}
            >
              {allExistingNodes.map(n => (
                <option key={n.key} value={n.key}>{n.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">* Örn: SRC 3 seçilirse SRC 4 otomatik kazanılır.</p>
          </div>

          {/* ÖNKOŞUL (REQUIRED WITH) */}
          <div>
            <label className="block text-sm font-medium text-red-700 font-bold">Önkoşul (Bu belge ne ile birlikte zorunlu?)</label>
            <select 
              multiple
              className="mt-1 block w-full border rounded-md p-2 h-32"
              value={formData.requiredWith}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({...formData, requiredWith: values});
              }}
            >
              {allExistingNodes.map(n => (
                <option key={n.key} value={n.key}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={() => onSave(formData)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
        >
          Kuralı Kaydet ve Dağıt
        </button>
      </div>
    </div>
  );
};