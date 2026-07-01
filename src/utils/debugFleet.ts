import { useSyncExternalStore } from 'react';

export type FleetDebugState = {
  userEmail: string | null;
  authUserId: string | null;
  resolvedCompanyId: string | null;
  companyName: string | null;
  usersCount: number | null;
  companyUsersCount: number | null;
  employeeUserLinksCount: number | null;
  vehiclesCount: number | null;
  devicesCount: number | null;
  driversCount: number | null;
  statesCount: number | null;
  scopedRowsCount: number | null;
  mappedUnitsCount: number | null;
  source: string | null;
  lastUpdatedAt: string | null;
};

const listeners = new Set<() => void>();

let state: FleetDebugState = {
  userEmail: null,
  authUserId: null,
  resolvedCompanyId: null,
  companyName: null,
  usersCount: null,
  companyUsersCount: null,
  employeeUserLinksCount: null,
  vehiclesCount: null,
  devicesCount: null,
  driversCount: null,
  statesCount: null,
  scopedRowsCount: null,
  mappedUnitsCount: null,
  source: null,
  lastUpdatedAt: null,
};

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setFleetDebugState(patch: Partial<FleetDebugState>) {
  state = {
    ...state,
    ...patch,
    lastUpdatedAt: new Date().toISOString(),
  };
  emitChange();
}

export function resetFleetDebugState() {
  state = {
    userEmail: null,
    authUserId: null,
    resolvedCompanyId: null,
    companyName: null,
    usersCount: null,
    companyUsersCount: null,
    employeeUserLinksCount: null,
    vehiclesCount: null,
    devicesCount: null,
    driversCount: null,
    statesCount: null,
    scopedRowsCount: null,
    mappedUnitsCount: null,
    source: null,
    lastUpdatedAt: null,
  };
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useFleetDebugState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
