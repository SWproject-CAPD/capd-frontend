import useAsyncData from './useAsyncData';
import {
  capdApi,
  doctorApi,
  patientApi,
  reservationApi,
  surveyApi,
  reportApi,
  anomalyApi,
} from '../api/apiClient';
import {
  normalizeAnomaly,
  normalizeCapd,
  normalizeDoctor,
  normalizePatient,
  normalizeQuestion,
  normalizeReservation,
  normalizeReport,
  normalizeAnswer,
  addDays,
  getDateRangeKeys,
  toDateKey,
} from '../api/adapters';

const DOCTOR_RESERVATION_LOOKBACK_DAYS = 30;
const DOCTOR_RESERVATION_LOOKAHEAD_DAYS = 0;
const RESERVATION_DATE_QUERY_BATCH_SIZE = 20;

export function usePatientMe() {
  return useAsyncData(async () => normalizePatient(await patientApi.getMe()), []);
}

export function useDoctorMe() {
  return useAsyncData(async () => normalizeDoctor(await doctorApi.getMe()), []);
}

export function usePatientCapdRecords() {
  return useAsyncData(async () => {
    const records = await capdApi.getMine();
    return (records || []).map(normalizeCapd).sort((a, b) => b.date.localeCompare(a.date));
  }, [], { initialData: [] });
}

export function usePatientTempCapd(date) {
  return useAsyncData(async () => {
    if (!date) return null;
    const record = await capdApi.getTemp(date);
    return record ? normalizeCapd(record) : null;
  }, [date], { initialData: null });
}

export function usePatientReservations() {
  return useAsyncData(async () => {
    const reservations = await reservationApi.getMine();
    return (reservations || []).map(normalizeReservation).sort((a, b) => {
      return String(a.reservationDate).localeCompare(String(b.reservationDate));
    });
  }, [], { initialData: [] });
}

export function useDoctorPatients() {
  return useAsyncData(async () => {
    const patients = await doctorApi.getPatients();
    return (patients || []).map(normalizePatient);
  }, [], { initialData: [] });
}

export function useDoctorPatientProfile(patientId) {
  return useAsyncData(async () => {
    if (!patientId) return null;
    return normalizePatient(await doctorApi.getPatientProfile(patientId));
  }, [patientId], { initialData: null });
}

export function useDoctorPatientProfiles(patientIds = []) {
  const idsKey = patientIds.map(String).filter(Boolean).join(',');

  return useAsyncData(async () => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return [];

    const profiles = await Promise.all(ids.map(async (patientId) => {
      try {
        return normalizePatient(await doctorApi.getPatientProfile(patientId));
      } catch {
        return null;
      }
    }));

    return profiles.filter(Boolean);
  }, [idsKey], { initialData: [] });
}

export function useDoctorPatientRecords(patientId) {
  return useAsyncData(async () => {
    if (!patientId) return [];
    const records = await capdApi.getDoctorRecords(patientId);
    return (records || []).map(normalizeCapd).sort((a, b) => b.date.localeCompare(a.date));
  }, [patientId], { initialData: [] });
}

export function useDoctorPatientBundle(patientId) {
  return useAsyncData(async () => {
    if (!patientId) return { patient: null, records: [] };

    const [patient, records] = await Promise.all([
      doctorApi.getPatientProfile(patientId),
      capdApi.getDoctorRecords(patientId),
    ]);

    return {
      patient: normalizePatient(patient),
      records: (records || []).map(normalizeCapd).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [patientId], { initialData: { patient: null, records: [] } });
}

export function useDoctorReservationsByDate(date = toDateKey()) {
  return useAsyncData(async () => {
    const reservations = await reservationApi.getDoctorByDate(date);
    return (reservations || []).map(normalizeReservation).sort((a, b) => {
      return String(a.reservationDate).localeCompare(String(b.reservationDate));
    });
  }, [date], { initialData: [] });
}

export function useDoctorReservationsByDateRange(startDate, endDate) {
  return useAsyncData(async () => {
    if (!startDate || !endDate) return [];

    const dateKeys = getDateRangeKeys(startDate, endDate);
    const reservations = [];

    for (let index = 0; index < dateKeys.length; index += RESERVATION_DATE_QUERY_BATCH_SIZE) {
      const batchDates = dateKeys.slice(index, index + RESERVATION_DATE_QUERY_BATCH_SIZE);
      const batchReservations = await Promise.all(
        batchDates.map(date => reservationApi.getDoctorByDate(date)),
      );

      reservations.push(...batchReservations.flat());
    }

    return dedupeReservations(reservations.map(normalizeReservation))
      .sort((a, b) => String(b.reservationDate).localeCompare(String(a.reservationDate)));
  }, [startDate, endDate], { initialData: [] });
}

export function useDoctorReservationOverview(anchorDate = toDateKey()) {
  const startDate = toDateKey(addDays(anchorDate, -DOCTOR_RESERVATION_LOOKBACK_DAYS));
  const endDate = toDateKey(addDays(anchorDate, DOCTOR_RESERVATION_LOOKAHEAD_DAYS));

  return useDoctorReservationsByDateRange(startDate, endDate);
}

export function usePatientQuestions(reservationId) {
  return useAsyncData(async () => {
    if (!reservationId) return [];
    const questions = await surveyApi.getPatientQuestions(reservationId);
    return (questions || []).map(normalizeQuestion);
  }, [reservationId], { initialData: [] });
}

export function useDoctorQuestions(reservationId) {
  return useAsyncData(async () => {
    if (!reservationId) return [];
    const questions = await surveyApi.getDoctorQuestions(reservationId);
    return (questions || []).map(normalizeQuestion);
  }, [reservationId], { initialData: [] });
}

export function useDoctorAnswers(reservationId) {
  return useAsyncData(async () => {
    if (!reservationId) return [];
    const answers = await surveyApi.getDoctorAnswers(reservationId);
    return (answers || []).map(normalizeAnswer);
  }, [reservationId], { initialData: [] });
}

export function usePatientReports(patientId) {
  return useAsyncData(async () => {
    if (!patientId) return [];
    const reports = await reportApi.getReports(patientId);
    return (reports || []).map(normalizeReport);
  }, [patientId], { initialData: [] });
}

export function useAnomalyResults(patientId) {
  return useAsyncData(async () => {
    if (!patientId) return [];
    const results = await anomalyApi.getResults(patientId);
    return (results || []).map(normalizeAnomaly);
  }, [patientId], { initialData: [] });
}

export function getLatestRecord(records = []) {
  return records[0] || null;
}

export function getUpcomingReservation(reservations = []) {
  const today = toDateKey();
  return reservations.find(reservation => reservation.date >= today) || reservations[0] || null;
}

function dedupeReservations(reservations) {
  return Array.from(new Map(
    reservations.map(reservation => [String(reservation.reservationId || reservation.id), reservation]),
  ).values());
}
