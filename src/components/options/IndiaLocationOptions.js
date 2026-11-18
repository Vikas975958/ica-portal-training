import indiaLocations from "@/data/india-states-districts-latest.json";

const locations = indiaLocations || [];

export const indiaStateOptions = locations.map(({ state }) => state);

export const getIndiaDistrictOptions = (state) =>
  locations.find((location) => location.state === state)?.districts ?? [];
