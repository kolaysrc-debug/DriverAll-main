// lib/locationData.ts

export const COUNTRIES = [
  "Türkiye",
  "Almanya",
  "Hollanda",
  "Norveç",
  "Finlandiya",
  "İspanya",
  "İtalya",
  "Macaristan",
];

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Türkiye: [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Kocaeli",
    "Adana",
    "Gaziantep",
    "Antalya",
  ],
  Almanya: ["Berlin", "Hamburg", "Münih", "Köln", "Frankfurt"],
  Hollanda: ["Amsterdam", "Rotterdam", "Lahey", "Eindhoven"],
  Norveç: ["Oslo", "Bergen", "Trondheim"],
  Finlandiya: ["Helsinki", "Espoo", "Tampere"],
  İspanya: ["Madrid", "Barselona", "Valensiya"],
  İtalya: ["Roma", "Milano", "Torino"],
  Macaristan: ["Budapeşte", "Debrecen"],
};
