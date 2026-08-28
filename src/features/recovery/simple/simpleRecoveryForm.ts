import type { TransportType } from "./TransportSelector";
import type { SelectedPlace } from "./ReferenceLocationSearch";
import type { ReferenceLocation } from "./store/useSimpleRecoveryStore";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface SimpleRecoveryLocationDraft {
  currentLocation: Coordinates;
  excludePlaceName?: string;
  placeId?: string;
  providerSource?: string;
}

const TIME_PATTERN = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;

export function toSearchReferenceLocation(
  place: SelectedPlace,
): ReferenceLocation {
  return {
    kind: "search",
    placeId: place.placeId,
    providerSource: place.source,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
  };
}

export function toMinutes(time: string): number | null {
  if (!TIME_PATTERN.test(time)) return null;

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function isFutureArrivalTime(
  arrivalTime: string,
  currentTime: Date,
): boolean {
  const arrivalMinutes = toMinutes(arrivalTime);
  if (arrivalMinutes === null) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  return arrivalMinutes > currentMinutes;
}

export function toSimpleRecoveryLocationDraft(
  referenceLocation: ReferenceLocation | null,
): SimpleRecoveryLocationDraft | null {
  if (!referenceLocation) return null;

  return {
    currentLocation: {
      lat: referenceLocation.lat,
      lng: referenceLocation.lng,
    },
    excludePlaceName: referenceLocation.name,
    placeId: referenceLocation.placeId,
    providerSource: referenceLocation.providerSource,
  };
}

export function isSimpleRecoveryInfoSubmittable({
  referenceLocation,
  arrivalTime,
  transport,
  currentTime,
}: {
  referenceLocation: ReferenceLocation | null;
  arrivalTime: string;
  transport: TransportType | null;
  currentTime: Date;
}): boolean {
  return Boolean(
    referenceLocation &&
    isFutureArrivalTime(arrivalTime, currentTime) &&
    transport,
  );
}
