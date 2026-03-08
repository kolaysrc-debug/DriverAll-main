// PATH: DriverAll-main/drivercv-backend/services/locationService.js
// ----------------------------------------------------------
// Hızlı lokasyon servisi - Statik Türkiye verileri
// ----------------------------------------------------------

class LocationService {
  constructor() {
    // Türkiye illeri (statik veri)
    this.turkeyStates = [
      { code: "TR-01", name: "Adana", asciiName: "Adana", country: "TR", active: true },
      { code: "TR-02", name: "Adıyaman", asciiName: "Adiyaman", country: "TR", active: true },
      { code: "TR-03", name: "Afyonkarahisar", asciiName: "Afyonkarahisar", country: "TR", active: true },
      { code: "TR-04", name: "Ağrı", asciiName: "Agri", country: "TR", active: true },
      { code: "TR-05", name: "Amasya", asciiName: "Amasya", country: "TR", active: true },
      { code: "TR-06", name: "Ankara", asciiName: "Ankara", country: "TR", active: true },
      { code: "TR-07", name: "Antalya", asciiName: "Antalya", country: "TR", active: true },
      { code: "TR-08", name: "Artvin", asciiName: "Artvin", country: "TR", active: true },
      { code: "TR-09", name: "Aydın", asciiName: "Aydin", country: "TR", active: true },
      { code: "TR-10", name: "Balıkesir", asciiName: "Balikesir", country: "TR", active: true },
      { code: "TR-11", name: "Bilecik", asciiName: "Bilecik", country: "TR", active: true },
      { code: "TR-12", name: "Bingöl", asciiName: "Bingol", country: "TR", active: true },
      { code: "TR-13", name: "Bitlis", asciiName: "Bitlis", country: "TR", active: true },
      { code: "TR-14", name: "Bolu", asciiName: "Bolu", country: "TR", active: true },
      { code: "TR-15", name: "Burdur", asciiName: "Burdur", country: "TR", active: true },
      { code: "TR-16", name: "Bursa", asciiName: "Bursa", country: "TR", active: true },
      { code: "TR-17", name: "Çanakkale", asciiName: "Canakkale", country: "TR", active: true },
      { code: "TR-18", name: "Çankırı", asciiName: "Cankiri", country: "TR", active: true },
      { code: "TR-19", name: "Çorum", asciiName: "Corum", country: "TR", active: true },
      { code: "TR-20", name: "Denizli", asciiName: "Denizli", country: "TR", active: true },
      { code: "TR-21", name: "Diyarbakır", asciiName: "Diyarbakir", country: "TR", active: true },
      { code: "TR-22", name: "Edirne", asciiName: "Edirne", country: "TR", active: true },
      { code: "TR-23", name: "Elazığ", asciiName: "Elazig", country: "TR", active: true },
      { code: "TR-24", name: "Erzincan", asciiName: "Erzincan", country: "TR", active: true },
      { code: "TR-25", name: "Erzurum", asciiName: "Erzurum", country: "TR", active: true },
      { code: "TR-26", name: "Eskişehir", asciiName: "Eskisehir", country: "TR", active: true },
      { code: "TR-27", name: "Gaziantep", asciiName: "Gaziantep", country: "TR", active: true },
      { code: "TR-28", name: "Giresun", asciiName: "Giresun", country: "TR", active: true },
      { code: "TR-29", name: "Gümüşhane", asciiName: "Gumushane", country: "TR", active: true },
      { code: "TR-30", name: "Hakkâri", asciiName: "Hakkari", country: "TR", active: true },
      { code: "TR-31", name: "Hatay", asciiName: "Hatay", country: "TR", active: true },
      { code: "TR-32", name: "Isparta", asciiName: "Isparta", country: "TR", active: true },
      { code: "TR-33", name: "Mersin", asciiName: "Mersin", country: "TR", active: true },
      { code: "TR-34", name: "İstanbul", asciiName: "Istanbul", country: "TR", active: true },
      { code: "TR-35", name: "İzmir", asciiName: "Izmir", country: "TR", active: true },
      { code: "TR-36", name: "Kars", asciiName: "Kars", country: "TR", active: true },
      { code: "TR-37", name: "Kastamonu", asciiName: "Kastamonu", country: "TR", active: true },
      { code: "TR-38", name: "Kayseri", asciiName: "Kayseri", country: "TR", active: true },
      { code: "TR-39", name: "Kırıkkale", asciiName: "Kirikkale", country: "TR", active: true },
      { code: "TR-40", name: "Kırklareli", asciiName: "Kirklareli", country: "TR", active: true },
      { code: "TR-41", name: "Kırşehir", asciiName: "Kirsehir", country: "TR", active: true },
      { code: "TR-42", name: "Kocaeli", asciiName: "Kocaeli", country: "TR", active: true },
      { code: "TR-43", name: "Konya", asciiName: "Konya", country: "TR", active: true },
      { code: "TR-44", name: "Kütahya", asciiName: "Kutahya", country: "TR", active: true },
      { code: "TR-45", name: "Malatya", asciiName: "Malatya", country: "TR", active: true },
      { code: "TR-46", name: "Manisa", asciiName: "Manisa", country: "TR", active: true },
      { code: "TR-47", name: "Kahramanmaraş", asciiName: "Kahramanmaras", country: "TR", active: true },
      { code: "TR-48", name: "Mardin", asciiName: "Mardin", country: "TR", active: true },
      { code: "TR-49", name: "Muğla", asciiName: "Mugla", country: "TR", active: true },
      { code: "TR-50", name: "Muş", asciiName: "Mus", country: "TR", active: true },
      { code: "TR-51", name: "Nevşehir", asciiName: "Nevsehir", country: "TR", active: true },
      { code: "TR-52", name: "Niğde", asciiName: "Nigde", country: "TR", active: true },
      { code: "TR-53", name: "Ordu", asciiName: "Ordu", country: "TR", active: true },
      { code: "TR-54", name: "Rize", asciiName: "Rize", country: "TR", active: true },
      { code: "TR-55", name: "Sakarya", asciiName: "Sakarya", country: "TR", active: true },
      { code: "TR-56", name: "Samsun", asciiName: "Samsun", country: "TR", active: true },
      { code: "TR-57", name: "Siirt", asciiName: "Siirt", country: "TR", active: true },
      { code: "TR-58", name: "Sinop", asciiName: "Sinop", country: "TR", active: true },
      { code: "TR-59", name: "Sivas", asciiName: "Sivas", country: "TR", active: true },
      { code: "TR-60", name: "Tekirdağ", asciiName: "Tekirdag", country: "TR", active: true },
      { code: "TR-61", name: "Tokat", asciiName: "Tokat", country: "TR", active: true },
      { code: "TR-62", name: "Trabzon", asciiName: "Trabzon", country: "TR", active: true },
      { code: "TR-63", name: "Tunceli", asciiName: "Tunceli", country: "TR", active: true },
      { code: "TR-64", name: "Şanlıurfa", asciiName: "Sanliurfa", country: "TR", active: true },
      { code: "TR-65", name: "Uşak", asciiName: "Usak", country: "TR", active: true },
      { code: "TR-66", name: "Van", asciiName: "Van", country: "TR", active: true },
      { code: "TR-67", name: "Yozgat", asciiName: "Yozgat", country: "TR", active: true },
      { code: "TR-68", name: "Zonguldak", asciiName: "Zonguldak", country: "TR", active: true },
      { code: "TR-69", name: "Aksaray", asciiName: "Aksaray", country: "TR", active: true },
      { code: "TR-70", name: "Bayburt", asciiName: "Bayburt", country: "TR", active: true },
      { code: "TR-71", name: "Karaman", asciiName: "Karaman", country: "TR", active: true },
      { code: "TR-72", name: "Kırıkkale", asciiName: "Kirikkale", country: "TR", active: true },
      { code: "TR-73", name: "Batman", asciiName: "Batman", country: "TR", active: true },
      { code: "TR-74", name: "Şırnak", asciiName: "Sirnak", country: "TR", active: true },
      { code: "TR-75", name: "Bartın", asciiName: "Bartin", country: "TR", active: true },
      { code: "TR-76", name: "Ardahan", asciiName: "Ardahan", country: "TR", active: true },
      { code: "TR-77", name: "Iğdır", asciiName: "Igdir", country: "TR", active: true },
      { code: "TR-78", name: "Yalova", asciiName: "Yalova", country: "TR", active: true },
      { code: "TR-79", name: "Karabük", asciiName: "Karabuk", country: "TR", active: true },
      { code: "TR-80", name: "Kilis", asciiName: "Kilis", country: "TR", active: true },
      { code: "TR-81", name: "Osmaniye", asciiName: "Osmaniye", country: "TR", active: true },
      { code: "TR-82", name: "Düzce", asciiName: "Duzce", country: "TR", active: true }
    ];

    // İstanbul ilçeleri (örnek)
    this.istanbulDistricts = [
      { code: "TR-34-001", name: "Adalar", asciiName: "Adalar", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-002", name: "Arnavutköy", asciiName: "Arnavutkoy", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-003", name: "Ataşehir", asciiName: "Atasehir", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-004", name: "Avcılar", asciiName: "Avcilar", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-005", name: "Bağcılar", asciiName: "Bagcilar", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-006", name: "Bahçelievler", asciiName: "Bahcelievler", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-007", name: "Bakırköy", asciiName: "Bakirkoy", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-008", name: "Başakşehir", asciiName: "Basaksehir", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-009", name: "Bayrampaşa", asciiName: "Bayrampasa", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-010", name: "Beşiktaş", asciiName: "Besiktas", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-011", name: "Beykoz", asciiName: "Beykoz", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-012", name: "Beylikdüzü", asciiName: "Beylikduzu", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-013", name: "Beyoğlu", asciiName: "Beyoglu", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-014", name: "Büyükçekmece", asciiName: "Buyukcekmece", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-015", name: "Çatalca", asciiName: "Catalca", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-016", name: "Çekmeköy", asciiName: "Cekmekoy", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-017", name: "Esenler", asciiName: "Esenler", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-018", name: "Esenyurt", asciiName: "Esenyurt", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-019", name: "Eyüpsultan", asciiName: "Eyupsultan", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-020", name: "Fatih", asciiName: "Fatih", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-021", name: "Gaziosmanpaşa", asciiName: "Gaziosmanpasa", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-022", name: "Güngören", asciiName: "Gungoren", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-023", name: "Kadıköy", asciiName: "Kadikoy", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-024", name: "Kağıthane", asciiName: "Kagithane", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-025", name: "Kartal", asciiName: "Kartal", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-026", name: "Küçükçekmece", asciiName: "Kucukcekmece", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-027", name: "Maltepe", asciiName: "Maltepe", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-028", name: "Pendik", asciiName: "Pendik", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-029", name: "Sancaktepe", asciiName: "Sancaktepe", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-030", name: "Sarıyer", asciiName: "Sariyer", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-031", name: "Silivri", asciiName: "Silivri", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-032", name: "Sultanbeyli", asciiName: "Sultanbeyli", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-033", name: "Sultangazi", asciiName: "Sultangazi", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-034", name: "Şile", asciiName: "Sile", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-035", name: "Şişli", asciiName: "Sisli", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-036", name: "Tuzla", asciiName: "Tuzla", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-037", name: "Ümraniye", asciiName: "Umraniye", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-038", name: "Üsküdar", asciiName: "Uskudar", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true },
      { code: "TR-34-039", name: "Zeytinburnu", asciiName: "Zeytinburnu", stateCode: "TR-34", stateName: "İstanbul", country: "TR", active: true }
    ];

    // Ankara ilçeleri (örnek)
    this.ankaraDistricts = [
      { code: "TR-06-001", name: "Altındağ", asciiName: "Altindag", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-002", name: "Ayaş", asciiName: "Ayas", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-003", name: "Bala", asciiName: "Bala", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-004", name: "Beypazarı", asciiName: "Beypazari", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-005", name: "Çamlıdere", asciiName: "Camlidere", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-006", name: "Çankaya", asciiName: "Cankaya", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-007", name: "Çubuk", asciiName: "Cubuk", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-008", name: "Elmadağ", asciiName: "Elmadag", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-009", name: "Etimesgut", asciiName: "Etimesgut", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-010", name: "Evren", asciiName: "Evren", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-011", name: "Gölbaşı", asciiName: "Golbasi", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-012", name: "Güdül", asciiName: "Gudul", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-013", name: "Haymana", asciiName: "Haymana", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-014", name: "Kalecik", asciiName: "Kalecik", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-015", name: "Keçiören", asciiName: "Kecioren", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-016", name: "Kızılcahamam", asciiName: "Kizilcahamam", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-017", name: "Mamak", asciiName: "Mamak", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-018", name: "Nallıhan", asciiName: "Nallihan", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-019", name: "Polatlı", asciiName: "Polatli", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-020", name: "Pursaklar", asciiName: "Pursaklar", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-021", name: "Sereflikochisar", asciiName: "Sereflikochisar", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-022", name: "Şereflikoçhisar", asciiName: "Sereflikochisar", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-023", name: "Sincan", asciiName: "Sincan", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-024", name: "Şerefoğlu", asciiName: "Serefoglu", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true },
      { code: "TR-06-025", name: "Yenimahalle", asciiName: "Yenimahalle", stateCode: "TR-06", stateName: "Ankara", country: "TR", active: true }
    ];

    // İzmir ilçeleri (örnek)
    this.izmirDistricts = [
      { code: "TR-35-001", name: "Aliağa", asciiName: "Aliaga", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-002", name: "Balçova", asciiName: "Balçova", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-003", name: "Bayındır", asciiName: "Bayindir", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-004", name: "Bayraklı", asciiName: "Bayrakli", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-005", name: "Bergama", asciiName: "Bergama", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-006", name: "Beydağ", asciiName: "Beydag", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-007", name: "Bornova", asciiName: "Bornova", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-008", name: "Buca", asciiName: "Buca", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-009", name: "Çeşme", asciiName: "Cesme", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-010", name: "Çiğli", asciiName: "Cigli", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-011", name: "Dikili", asciiName: "Dikili", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-012", name: "Foça", asciiName: "Foca", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-013", name: "Gaziemir", asciiName: "Gaziemir", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-014", name: "Güzelbahçe", asciiName: "Guzelbahce", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-015", name: "Karabağlar", asciiName: "Karabaglar", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-016", name: "Karaburun", asciiName: "Karaburun", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-017", name: "Karşıyaka", asciiName: "Karsiyaka", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-018", name: "Kemalpaşa", asciiName: "Kemalpasa", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-019", name: "Kınık", asciiName: "Kinik", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-020", name: "Kiraz", asciiName: "Kiraz", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-021", name: "Konak", asciiName: "Konak", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-022", name: "Menderes", asciiName: "Menderes", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-023", name: "Menemen", asciiName: "Menemen", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-024", name: "Narlıdere", asciiName: "Narlidere", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-025", name: "Ödemiş", asciiName: "Odemiş", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-026", name: "Seferihisar", asciiName: "Seferihisar", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-027", name: "Selçuk", asciiName: "Selcuk", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-028", name: "Tire", asciiName: "Tire", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-029", name: "Torbalı", asciiName: "Torbali", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true },
      { code: "TR-35-030", name: "Urla", asciiName: "Urla", stateCode: "TR-35", stateName: "İzmir", country: "TR", active: true }
    ];
  }

  // İlleri getir
  async getStates(countryCode = "TR") {
    if (countryCode === "TR") {
      return this.turkeyStates;
    }
    return [];
  }

  // İlçeleri getir
  async getDistricts(countryCode = "TR", stateCode = null) {
    if (countryCode !== "TR") return [];

    switch (stateCode) {
      case "TR-34": // İstanbul
        return this.istanbulDistricts;
      case "TR-06": // Ankara
        return this.ankaraDistricts;
      case "TR-35": // İzmir
        return this.izmirDistricts;
      default:
        // Diğer iller için boş array dön
        return [];
    }
  }

  // Diğer metodlar (boş)
  async getCountries() {
    return [{ code: "TR", name: "Türkiye", nativeName: "Türkiye", active: true }];
  }

  async getCities(countryCode = "TR", stateCode = null, query = "") {
    return [];
  }

  async searchLocations(query, countryCode = "TR") {
    return [];
  }
}

module.exports = new LocationService();
