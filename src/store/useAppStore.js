import { create } from 'zustand';

const useAppStore = create((set) => ({
  // 유저 정보 (null이면 로그아웃 상태)
  user: null, // { name: '홍길동', role: 'patient' | 'doctor' }
  
  // 의사 대시보드에서 선택된 환자 ID
  selectedPatientId: null,

  // 유저 정보 설정 (로그인)
  setUser: (user) => set({ user }),

  // 로그아웃
  logout: () => set({ user: null, selectedPatientId: null }),

  // 환자 선택
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
}));

export default useAppStore;