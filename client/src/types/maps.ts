export type Place = {
  label: string;
  lat: number;
  lng: number;
};

export type RouteEstimate = {
  distanceKm: number;
  durationMin: number;
  geometry: [number, number][];
};

export type FareQuote = {
  vehicleType: "BIKE" | "AUTO" | "CAB" | "PREMIUM";
  farePaise: number;
  fareINR: number;
  fareUSD: number;
};
