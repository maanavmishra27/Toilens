export interface CampusBuilding {
  id: string;
  name: string;
  lat: number;
  lng: number;
  floors: number; // configurable — change this to add/remove floors automatically
}

export interface ToiletRecord {
  id: string;
  buildingId: string;
  buildingName: string;
  floor: number;
  toiletNumber: number;
  label: string;
  lat: number;
  lng: number;
  gender: "male" | "female" | "unisex";
  thiScore: number;
  predictedThi: number;
  complaints: number;
  footfall: number;
  lastCleaned: string; // ISO timestamp
  priority: "OK" | "Monitor" | "Urgent";
  accessibility: {
    wheelchairAccessible: boolean;
    handrails: boolean;
  };
}

// ─── Authoritative VIT Vellore building coordinates ──────────────────────────
// To change floor count: update the `floors` field on any building.
// Default floors: 3 → generates 6 prototype toilets per building.
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { id: "anna-audi",            name: "Anna Audi",                  lat: 12.970050580202205, lng: 79.15563304696111, floors: 3 },
  { id: "mgr-block",            name: "Dr MGR Block",               lat: 12.968984347769862, lng: 79.15592516730672, floors: 4 },
  { id: "channa-reddy",         name: "Channa Reddy Block",         lat: 12.969010753649732, lng: 79.15618070055872, floors: 3 },
  { id: "periyar-library",      name: "Periyar Library",            lat: 12.969143110307428, lng: 79.15688903553650, floors: 2 },
  { id: "smv",                  name: "SMV",                        lat: 12.969656084142041, lng: 79.15774572229465, floors: 5 },
  { id: "narayani-health",      name: "Sri Narayani Health Centre", lat: 12.969484260866210, lng: 79.15478707892352, floors: 2 },
  { id: "gd-naidu",             name: "G.D. Naidu Block",           lat: 12.969729150583913, lng: 79.15481837295958, floors: 3 },
  { id: "tech-towers",          name: "Technology Towers",          lat: 12.971009909599799, lng: 79.15949108990554, floors: 6 },
  { id: "ambedkar-audi",        name: "Ambedkar Auditorium",        lat: 12.970618681480833, lng: 79.15936027323889, floors: 2 },
  { id: "silver-jubilee",       name: "Silver Jubilee Tower",       lat: 12.971289041305319, lng: 79.16365086010413, floors: 8 },
  { id: "sjt-annexe",           name: "SJT Annexe",                 lat: 12.970634601042937, lng: 79.16362848855013, floors: 4 },
  { id: "prp-a",                name: "PRP A Block",                lat: 12.971977943887374, lng: 79.16651999916304, floors: 5 },
  { id: "prp-b",                name: "PRP B Block",                lat: 12.971442913816727, lng: 79.16673340002020, floors: 5 },
  { id: "prp-c",                name: "PRP C Block",                lat: 12.971065363597342, lng: 79.16632938868905, floors: 5 },
  { id: "prp-d",                name: "PRP D Block",                lat: 12.971281395072902, lng: 79.16590258697201, floors: 5 },
  { id: "prp-e",                name: "PRP E Block",                lat: 12.971812387535689, lng: 79.16599374850007, floors: 5 },
  { id: "prp-annexe",           name: "PRP Annexe",                 lat: 12.971281395072241, lng: 79.16713326765740, floors: 3 },
  { id: "gandhi-block",         name: "Gandhi Block",               lat: 12.972349435798796, lng: 79.16794543403960, floors: 4 },
];

const GENDERS: ("male" | "female" | "unisex")[] = ["male", "female", "unisex"];

// Small coordinate offsets to spread toilet markers around their building.
// Keep negligibly small so toilets remain visually co-located with building.
const OFFSETS = [
  [0.00004, 0.00004],
  [-0.00004, -0.00004],
  [0.00004, -0.00004],
  [-0.00004, 0.00004],
  [0.00008, 0.0],
  [-0.00008, 0.0],
];

function randomThi(seed: number): number {
  // Deterministic pseudo-random 40–95
  return 40 + ((seed * 37 + 13) % 56);
}

function randomComplaints(seed: number): number {
  return (seed * 17 + 5) % 6;
}

function randomFootfall(seed: number): number {
  return 30 + ((seed * 41 + 7) % 120);
}

function hoursAgo(seed: number): string {
  const hours = 0.5 + ((seed * 11 + 3) % 12);
  const ms = Date.now() - hours * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

function thiToPriority(thi: number): "OK" | "Monitor" | "Urgent" {
  if (thi >= 75) return "OK";
  if (thi >= 50) return "Monitor";
  return "Urgent";
}

// Generate all prototype toilets from campus buildings.
// Two toilets per floor, floor count from building.floors.
export function generateCampusToilets(buildings: CampusBuilding[]): ToiletRecord[] {
  const toilets: ToiletRecord[] = [];
  buildings.forEach((b) => {
    let seq = 0;
    for (let floor = 1; floor <= b.floors; floor++) {
      for (let t = 1; t <= 2; t++) {
        const seed = (b.id.charCodeAt(0) + floor * 7 + t * 13 + seq * 3) % 100;
        const offset = OFFSETS[seq % OFFSETS.length];
        const thi = randomThi(seed);
        toilets.push({
          id: `${b.id.toUpperCase().replace(/-/g, "")}-F${floor}-W${t}`,
          buildingId: b.id,
          buildingName: b.name,
          floor,
          toiletNumber: t,
          label: `Floor ${floor} • Toilet ${t}`,
          lat: b.lat + offset[0],
          lng: b.lng + offset[1],
          gender: GENDERS[(floor + t) % 3],
          thiScore: thi,
          predictedThi: Math.max(30, thi - randomComplaints(seed) * 4 - 3),
          complaints: randomComplaints(seed),
          footfall: randomFootfall(seed),
          lastCleaned: hoursAgo(seed),
          priority: thiToPriority(thi),
          accessibility: {
            wheelchairAccessible: seed % 3 === 0,
            handrails: seed % 2 === 0,
          },
        });
        seq++;
      }
    }
  });
  return toilets;
}

// Demo data: a small set of generic toilets for the "Demo Data" mode
export const DEMO_TOILETS: ToiletRecord[] = [
  {
    id: "DEMO-T1",
    buildingId: "demo-block-a",
    buildingName: "Demo Block A",
    floor: 1,
    toiletNumber: 1,
    label: "Floor 1 • Toilet 1",
    lat: 12.9716,
    lng: 79.1591,
    gender: "male",
    thiScore: 82,
    predictedThi: 76,
    complaints: 1,
    footfall: 95,
    lastCleaned: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    priority: "OK",
    accessibility: { wheelchairAccessible: true, handrails: true },
  },
  {
    id: "DEMO-T2",
    buildingId: "demo-block-a",
    buildingName: "Demo Block A",
    floor: 1,
    toiletNumber: 2,
    label: "Floor 1 • Toilet 2",
    lat: 12.9718,
    lng: 79.1593,
    gender: "female",
    thiScore: 61,
    predictedThi: 50,
    complaints: 3,
    footfall: 80,
    lastCleaned: new Date(Date.now() - 4 * 3600000).toISOString(),
    priority: "Monitor",
    accessibility: { wheelchairAccessible: false, handrails: true },
  },
  {
    id: "DEMO-T3",
    buildingId: "demo-block-b",
    buildingName: "Demo Block B",
    floor: 2,
    toiletNumber: 1,
    label: "Floor 2 • Toilet 1",
    lat: 12.970,
    lng: 79.162,
    gender: "unisex",
    thiScore: 44,
    predictedThi: 35,
    complaints: 5,
    footfall: 60,
    lastCleaned: new Date(Date.now() - 8 * 3600000).toISOString(),
    priority: "Urgent",
    accessibility: { wheelchairAccessible: false, handrails: false },
  },
];
