import React, { createContext, useContext, useReducer, useMemo } from "react";
import {
  CAMPUS_BUILDINGS,
  DEMO_TOILETS,
  ToiletRecord,
  generateCampusToilets,
} from "../data/campusData";

// ─── Types ────────────────────────────────────────────────────────────────────
export type DataSource = "campus" | "demo";

export interface AppState {
  toilets: ToiletRecord[];
  dataSource: DataSource;
}

type Action =
  | { type: "SET_DATA_SOURCE"; payload: DataSource }
  | { type: "SUBMIT_COMPLAINT"; toiletId: string }
  | { type: "MARK_CLEANED"; toiletId: string }
  | { type: "UPDATE_THI"; toiletId: string; thi: number };

// ─── Initial state ────────────────────────────────────────────────────────────
const CAMPUS_TOILETS = generateCampusToilets(CAMPUS_BUILDINGS);

const initialState: AppState = {
  toilets: CAMPUS_TOILETS,
  dataSource: "campus",
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function thiToPriority(thi: number): "OK" | "Monitor" | "Urgent" {
  if (thi >= 75) return "OK";
  if (thi >= 50) return "Monitor";
  return "Urgent";
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_DATA_SOURCE":
      return {
        ...state,
        dataSource: action.payload,
        toilets: action.payload === "campus" ? CAMPUS_TOILETS : DEMO_TOILETS,
      };

    case "SUBMIT_COMPLAINT": {
      return {
        ...state,
        toilets: state.toilets.map((t) => {
          if (t.id !== action.toiletId) return t;
          const newComplaints = t.complaints + 1;
          const newThi = Math.max(20, t.thiScore - 5);
          return {
            ...t,
            complaints: newComplaints,
            thiScore: newThi,
            predictedThi: Math.max(15, newThi - 8),
            priority: thiToPriority(newThi),
          };
        }),
      };
    }

    case "MARK_CLEANED": {
      return {
        ...state,
        toilets: state.toilets.map((t) => {
          if (t.id !== action.toiletId) return t;
          const newThi = Math.min(95, t.thiScore + 20);
          return {
            ...t,
            lastCleaned: new Date().toISOString(),
            complaints: 0,
            thiScore: newThi,
            predictedThi: Math.max(50, newThi - 10),
            priority: thiToPriority(newThi),
          };
        }),
      };
    }

    case "UPDATE_THI": {
      return {
        ...state,
        toilets: state.toilets.map((t) => {
          if (t.id !== action.toiletId) return t;
          return {
            ...t,
            thiScore: action.thi,
            priority: thiToPriority(action.thi),
          };
        }),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  campusBuildings: typeof CAMPUS_BUILDINGS;
  getToiletById: (id: string) => ToiletRecord | undefined;
  getToiletsForBuilding: (buildingId: string) => ToiletRecord[];
  getBuildingStats: (buildingId: string) => {
    totalToilets: number;
    avgThi: number;
    worstThi: number;
    openComplaints: number;
    highestRisk: ToiletRecord | undefined;
    floors: number;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<AppContextValue>(() => {
    function getToiletById(id: string) {
      return state.toilets.find((t) => t.id === id);
    }

    function getToiletsForBuilding(buildingId: string) {
      return state.toilets.filter((t) => t.buildingId === buildingId);
    }

    function getBuildingStats(buildingId: string) {
      const toilets = getToiletsForBuilding(buildingId);
      const building = CAMPUS_BUILDINGS.find((b) => b.id === buildingId);
      const avgThi =
        toilets.length > 0
          ? Math.round(toilets.reduce((s, t) => s + t.thiScore, 0) / toilets.length)
          : 0;
      const worstThi = toilets.length > 0 ? Math.min(...toilets.map((t) => t.thiScore)) : 0;
      const openComplaints = toilets.reduce((s, t) => s + t.complaints, 0);
      const highestRisk = toilets.slice().sort((a, b) => a.thiScore - b.thiScore)[0];
      return {
        totalToilets: toilets.length,
        avgThi,
        worstThi,
        openComplaints,
        highestRisk,
        floors: building?.floors ?? 3,
      };
    }

    return {
      state,
      dispatch,
      campusBuildings: CAMPUS_BUILDINGS,
      getToiletById,
      getToiletsForBuilding,
      getBuildingStats,
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
