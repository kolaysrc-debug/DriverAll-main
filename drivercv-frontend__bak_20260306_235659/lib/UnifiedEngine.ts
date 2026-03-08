// PATH: drivercv-frontend/lib/UnifiedEngine.ts - 25.01.2026
// --------------------------------------------------------------------------------
// Unified Rule Engine - Fixed Logic & Field Matching
// --------------------------------------------------------------------------------

export type RuleNode = {
  key: string;
  label: string;
  zones: string[];
  coverage?: string[];      // Hiyerarşi (SRC 1 > SRC 2)
  coversKeys?: string[];    // Alternatif isim
  requiredWith?: string[];  // Ön Koşul (Tanker > Temel)
  requiresKeys?: string[];  // Alternatif isim
  active?: boolean;
  isActive?: boolean;       // Çift kontrol
};

export type UnifiedResult = {
  manualKeys: string[];
  effectiveKeys: string[];
  reasons: Record<string, { source: 'covers' | 'requires' | 'manual', from?: string }>;
  currentZone: string;
};

export const UnifiedEngine = {
  resolve: (manual: string[], allNodes: any[], userZone: string): UnifiedResult => {
    // 1. Filtreleme: Hem bölgeyi kontrol et hem de aktiflik durumunu (active veya isActive)
    const zoneNodes = allNodes.filter(n => {
      const isStatusActive = n.active !== false && n.isActive !== false;
      const isZoneValid = n.zones && n.zones.includes(userZone);
      return isStatusActive && isZoneValid;
    });

    const nodeMap = new Map(zoneNodes.map(n => [n.key, n]));
    const effectiveSet = new Set<string>();
    const reasons: Record<string, any> = {};

    // 2. Başlangıç: Kullanıcının elle seçtiklerini ekle
    const stack = [...manual.filter(k => nodeMap.has(k))];
    stack.forEach(k => {
      effectiveSet.add(k);
      reasons[k] = { source: 'manual' };
    });

    // 3. İşleme (BFS/DFS benzeri tarama)
    let safetyCounter = 0;
    while (stack.length > 0 && safetyCounter < 1000) {
      safetyCounter++;
      const cur = stack.pop()!;
      const node = nodeMap.get(cur);
      if (!node) continue;

      // Hem 'coverage' hem 'coversKeys' kontrolü (Hangisi doluysa)
      const targetsToCover = node.coverage || node.coversKeys || [];
      targetsToCover.forEach((target: string) => {
        if (nodeMap.has(target) && !effectiveSet.has(target)) {
          effectiveSet.add(target);
          reasons[target] = { source: 'covers', from: cur };
          stack.push(target);
        }
      });

      // Hem 'requiredWith' hem 'requiresKeys' kontrolü
      const targetsRequired = node.requiredWith || node.requiresKeys || [];
      targetsRequired.forEach((target: string) => {
        if (nodeMap.has(target) && !effectiveSet.has(target)) {
          effectiveSet.add(target);
          reasons[target] = { source: 'requires', from: cur };
          stack.push(target);
        }
      });
    }

    return {
      manualKeys: manual,
      effectiveKeys: Array.from(effectiveSet),
      reasons,
      currentZone: userZone
    };
  }
};