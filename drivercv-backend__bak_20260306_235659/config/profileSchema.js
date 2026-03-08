// config/profileSchema.js

// İlk dinamik alan: sürücüler için "Toplam Tecrübe (yıl)"
// İleride bu listeye yeni alanlar ekleyerek sistemi büyüteceğiz.

const PROFILE_SCHEMA = [
  {
    key: "experienceYears",        // extras.experienceYears
    roles: ["driver"],             // hangi roller görecek
    label: "Toplam Tecrübe (yıl)",
    type: "number",                // text | number | textarea ...
    placeholder: "Örn. 5",
    required: false,
    min: 0,
    max: 60,
    section: "driver",             // sürücüye özel alan
    order: 100,                    // sıralama
  },

  // Örnek: ileride firma için dinamik alan
  // {
  //   key: "fleetSize",
  //   roles: ["company"],
  //   label: "Filo Büyüklüğü",
  //   type: "number",
  //   placeholder: "Örn. 25 araç",
  //   section: "company",
  //   order: 200,
  // },
];

module.exports = { PROFILE_SCHEMA };
