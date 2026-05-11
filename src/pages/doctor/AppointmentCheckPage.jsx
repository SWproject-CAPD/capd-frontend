import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import useAppStore from '../../store/useAppStore';

// 나중에 실제 api로 변경
const initialAppointments = [
  { id: 'A001', patientId: 'P001', date: '2026-05-08', time: '09:00', type: '정기 검진', status: 'waiting' },
  { id: 'A002', patientId: 'P002', date: '2026-05-08', time: '09:30', type: '혈액 검사 결과 상담', status: 'confirmed' },
  { id: 'A003', patientId: 'P003', date: '2026-05-08', time: '10:00', type: '투석관 점검 및 소독', status: 'waiting' },
  { id: 'A004', patientId: 'P004', date: '2026-05-08', time: '10:30', type: '증상 확인', status: 'confirmed' },
  { id: 'A005', patientId: 'P005', date: '2026-05-09', time: '11:00', type: '정기 검진', status: 'completed' },
  { id: 'A006', patientId: 'P006', date: '2026-05-09', time: '13:30', type: '혈액 검사 결과 상담', status: 'confirmed' },
  { id: 'A007', patientId: 'P007', date: '2026-05-09', time: '14:00', type: '증상 확인', status: 'waiting' },
  { id: 'A008', patientId: 'P001', date: '2026-05-10', time: '09:00', type: '투석관 점검 및 소독', status: 'confirmed' },
  { id: 'A009', patientId: 'P002', date: '2026-05-10', time: '10:30', type: '정기 검진', status: 'canceled' },
  { id: 'A010', patientId: 'P003', date: '2026-05-11', time: '15:30', type: '정기 검진', status: 'completed' },
  { id: 'A011', patientId: 'P004', date: '2026-05-12', time: '16:00', type: '혈액 검사 결과 상담', status: 'waiting' },
  { id: 'A012', patientId: 'P005', date: '2026-05-13', time: '09:30', type: '증상 확인', status: 'canceled' },
  { id: 'A013', patientId: 'P006', date: '2026-05-14', time: '10:00', type: '정기 검진', status: 'confirmed' },
  { id: 'A014', patientId: 'P007', date: '2026-05-14', time: '11:30', type: '투석관 점검 및 소독', status: 'waiting' },
  { id: 'A015', patientId: 'P001', date: '2026-05-15', time: '14:30', type: '증상 확인', status: 'confirmed' },
  { id: 'A016', patientId: 'P002', date: '2026-05-15', time: '15:00', type: '혈액 검사 결과 상담', status: 'completed' },
];

const statusMeta = {
  waiting: {
    label: '대기',
    className: 'bg-amber-100 text-amber-700',
    rowClassName: 'hover:bg-amber-50/40',
  },
  confirmed: {
    label: '확정',
    className: 'bg-blue-100 text-blue-700',
    rowClassName: 'hover:bg-blue-50/40',
  },
  completed: {
    label: '완료',
    className: 'bg-emerald-100 text-emerald-700',
    rowClassName: 'bg-emerald-50/30 text-slate-600',
  },
  canceled: {
    label: '취소',
    className: 'bg-slate-200 text-slate-500',
    rowClassName: 'bg-slate-50 text-slate-400',
  },
};

export default function AppointmentCheckPage() {
  const navigate = useNavigate();
  const { currentDoctorId, currentDoctorName, patientAssignments } = useAppStore();

  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState('all');

  const myPatients = useMemo(() => {
    return patientsData.filter(patient => patientAssignments[patient.id]?.doctorId === currentDoctorId);
  }, [currentDoctorId, patientAssignments]);

  const doctorAppointments = useMemo(() => {
    return appointments
      .map(appointment => {
        const patient = myPatients.find(item => item.id === appointment.patientId);
        return patient ? { ...appointment, patient } : null;
      })
      .filter(Boolean);
  }, [appointments, myPatients]);

  const appointmentRows = useMemo(() => {
    return doctorAppointments
      .filter(appointment => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'upcoming') return ['waiting', 'confirmed'].includes(appointment.status);
        return appointment.status === statusFilter;
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [doctorAppointments, statusFilter]);

  const counts = {
    total: doctorAppointments.length,
    upcoming: doctorAppointments.filter(item => ['waiting', 'confirmed'].includes(item.status)).length,
    completed: doctorAppointments.filter(item => item.status === 'completed').length,
    canceled: doctorAppointments.filter(item => item.status === 'canceled').length,
  };

  const handleCancelAppointment = (appointment) => {
    const confirmed = window.confirm(
      `${appointment.patient.name} 환자의 ${appointment.date} ${appointment.time} 예약을 취소하시겠습니까?`
    );

    if (!confirmed) return;

    setAppointments(prev =>
      prev.map(item =>
        item.id === appointment.id
          ? { ...item, status: 'canceled', canceledAt: new Date().toISOString() }
          : item
      )
    );

    alert('예약이 취소되었습니다.');
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500">
      {/* 상단 헤더 영역 */}
      <div className="mb-3 flex shrink-0 items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black text-blue-600">APPOINTMENT LIST</div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">환자 예약 목록</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {currentDoctorName} 선생님의 담당 환자 예약을 빠르게 확인하고 취소할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/doctor/appointments/new')}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-blue-700"
          >
            + 예약 등록
          </button>
          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>

      {/* 요약 및 필터 영역 */}
      <section className="mb-3 grid shrink-0 grid-cols-12 gap-3">
        <SummaryCard label="전체" value={`${counts.total}건`} tone="slate" />
        <SummaryCard label="예정" value={`${counts.upcoming}건`} tone="blue" />
        <SummaryCard label="완료" value={`${counts.completed}건`} tone="emerald" />
        <SummaryCard label="취소" value={`${counts.canceled}건`} tone="rose" />

        <div className="col-span-4 flex items-center justify-end gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            전체
          </FilterButton>
          <FilterButton active={statusFilter === 'upcoming'} onClick={() => setStatusFilter('upcoming')}>
            예정
          </FilterButton>
          <FilterButton active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')}>
            완료
          </FilterButton>
          <FilterButton active={statusFilter === 'canceled'} onClick={() => setStatusFilter('canceled')}>
            취소
          </FilterButton>
        </div>
      </section>

      {/* 예약 목록 테이블 영역 */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">예약 목록</h2>
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              현재 필터 기준 {appointmentRows.length}건
            </p>
          </div>

          <div className="text-xs font-black text-slate-400">
            대기/확정 예약만 취소할 수 있습니다.
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-white text-[11px] font-black uppercase tracking-wider text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="w-24 px-4 py-3">예약번호</th>
                <th className="w-32 px-4 py-3">날짜</th>
                <th className="w-24 px-4 py-3">시간</th>
                <th className="w-48 px-4 py-3">환자</th>
                <th className="w-24 px-4 py-3">성별/나이</th>
                <th className="px-4 py-3">예약 유형</th>
                <th className="w-24 px-4 py-3 text-center">상태</th>
                <th className="w-32 px-4 py-3 text-center">작업</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {appointmentRows.map(appointment => {
                const meta = statusMeta[appointment.status];
                const canCancel = ['waiting', 'confirmed'].includes(appointment.status);

                return (
                  <tr
                    key={appointment.id}
                    className={`h-12 transition-colors ${meta.rowClassName}`}
                  >
                    <td className="px-4 py-2 text-xs font-black text-slate-400">{appointment.id}</td>
                    <td className="px-4 py-2 text-sm font-black text-slate-800">{appointment.date}</td>
                    <td className="px-4 py-2 font-mono text-sm font-black text-blue-700">{appointment.time}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/${appointment.patient.id}`)}
                        className="truncate text-sm font-black text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {appointment.patient.name} 환자
                      </button>
                      <div className="mt-0.5 text-[11px] font-bold text-slate-400">{appointment.patient.id}</div>
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-slate-500">
                      {appointment.patient.sex}/{appointment.patient.age}세
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        disabled={!canCancel}
                        onClick={() => handleCancelAppointment(appointment)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                          canCancel
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'cursor-not-allowed bg-slate-100 text-slate-300'
                        }`}
                      >
                        예약 취소
                      </button>
                    </td>
                  </tr>
                );
              })}

              {appointmentRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-80 text-center text-sm font-bold text-slate-400">
                    조건에 맞는 예약이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 안내 영역 */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2">
          <div className="text-xs font-bold text-slate-400">
            예약 상태: 대기 / 확정 / 완료 / 취소
          </div>
          <div className="text-xs font-bold text-slate-400">
            목록 영역은 내부 스크롤로 더 많은 예약을 확인할 수 있습니다.
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass = {
    slate: 'bg-white text-slate-700 border-slate-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  }[tone];

  return (
    <div className={`col-span-2 rounded-2xl border px-4 py-3 shadow-sm ${toneClass}`}>
      <div className="text-xs font-black opacity-70">{label}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-black transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'border border-slate-100 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700'
      }`}
    >
      {children}
    </button>
  );
}
