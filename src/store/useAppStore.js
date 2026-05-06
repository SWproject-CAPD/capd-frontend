import { create } from 'zustand';

const CURRENT_DOCTOR_ID = 'D001';
const CURRENT_DOCTOR_NAME = '김의사';

// TODO API 연결 시 교체:
// - 현재 로그인한 의사 정보는 auth API 또는 로그인 응답의 user에서 가져오기
// - patientAssignments는 서버 DB의 담당 관계로 관리하기
// - 예: GET /doctors/{doctorId}/patients 또는 GET /patients/assignments
// - 담당환자 추가 시 POST /doctors/{doctorId}/patients/{patientId}
// - 환자와 의사는 N:1 관계
//   한 명의 의사는 여러 환자를 담당할 수 있지만,
//   한 환자는 한 명의 의사에게만 담당될 수 있음
// - 현재는 API가 없으므로 Zustand 전역 상태로 임시 공유
const initialPatientAssignments = {
  P001: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P002: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P003: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P004: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P005: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P006: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P007: { doctorId: CURRENT_DOCTOR_ID, doctorName: CURRENT_DOCTOR_NAME },
  P008: { doctorId: 'D002', doctorName: '이의사' },
  P009: { doctorId: 'D003', doctorName: '박의사' },
  P010: null,
};

const useAppStore = create((set) => ({
  user: null,
  selectedPatientId: null,

  currentDoctorId: CURRENT_DOCTOR_ID,
  currentDoctorName: CURRENT_DOCTOR_NAME,
  patientAssignments: initialPatientAssignments,

  setUser: (user) => set({ user }),

  logout: () => set({ user: null, selectedPatientId: null }),

  setSelectedPatientId: (id) => set({ selectedPatientId: id }),

  assignPatientToCurrentDoctor: (patientId) => set((state) => {
    const currentAssignment = state.patientAssignments[patientId];

    if (currentAssignment) {
      return state;
    }

    return {
      patientAssignments: {
        ...state.patientAssignments,
        [patientId]: {
          doctorId: state.currentDoctorId,
          doctorName: state.currentDoctorName,
        },
      },
    };
  }),
}));

export default useAppStore;
