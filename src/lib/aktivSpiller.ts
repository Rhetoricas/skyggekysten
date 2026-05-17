import type { SpillerData } from './types';

export const NY_SPILLER_TIMEOUT_MS = 10 * 60 * 1000;
export const ANON_SESSION_TIMEOUT_MS = 20 * 60 * 1000;
export const LOGIN_SESSION_TIMEOUT_MS = 60 * 60 * 1000;

export function spillerHarKunStartet(spiller: SpillerData) {
    return (spiller.dag || 1) <= 1 && (spiller.historik?.length || 0) <= 1;
}

export function aktivTimeoutForSpiller(spiller: SpillerData) {
    if (spillerHarKunStartet(spiller)) return NY_SPILLER_TIMEOUT_MS;
    return spiller.userId ? LOGIN_SESSION_TIMEOUT_MS : ANON_SESSION_TIMEOUT_MS;
}

export function erFriskAktivSpiller(spiller: SpillerData, nu = Date.now()) {
    if (spiller.isDead || spiller.isWinner) return false;
    if (!spiller.sidstAktiv) return false;
    return spiller.sidstAktiv >= nu - aktivTimeoutForSpiller(spiller);
}
