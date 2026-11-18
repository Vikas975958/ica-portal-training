import indiaLocations from "@/data/india-states-districts-latest.json";

interface IndiaLocation {
  state: string;
  districts: string[];
}

const locations = indiaLocations as IndiaLocation[];

export const indiaStateOptions = locations.map(({ state }) => state);

export const getIndiaDistrictOptions = (state: string) =>
  locations.find((location) => location.state === state)?.districts ?? [];
