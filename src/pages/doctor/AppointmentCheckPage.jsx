import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationApi } from '../../api/apiClient';
import { toDateKey } from '../../api/adapters';
import useAppStore from '../../store/useAppStore';
import { useDoctorReservationsByDateRange } from '../../hooks/usePatientData';

export default function AppointmentCheckPage() {
  const navigate = useNavigate();
  const { currentDoctorName } = useAppStore();
  const thisMonth = useMemo(() => getMonthStart(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(thisMonth);
  const monthOptions = useMemo(() => [
    addMonths(selectedMonth, -1),
    selectedMonth,
    addMonths(selectedMonth, 1),
  ], [selectedMonth]);
  const monthStartDate = toDateKey(selectedMonth);
  const monthEndDate = toDateKey(getMonthEnd(selectedMonth));
  const {
    data: appointmentRows = [],
    isLoading,
    error,
    reload,
  } = useDoctorReservationsByDateRange(monthStartDate, monthEndDate);

  const counts = useMemo(() => {
    const today = toDateKey(new Date());

    return {
      total: appointmentRows.length,
      upcoming: appointmentRows.filter(appointment => appointment.date >= today).length,
      completed: appointmentRows.filter(appointment => appointment.date < today).length,
      canceled: 0,
    };
  }, [appointmentRows]);

  const handleSelectMonth = (monthDate) => {
    setSelectedMonth(getMonthStart(monthDate));
  };

  const handleCancelAppointment = async (appointment) => {
    const confirmed = window.confirm(
      `${appointment.patientName} 환자의 ${appointment.date} ${appointment.time} 예약을 취소하시겠습니까?`,
    );

    if (!confirmed) return;

    try {
      await reservationApi.delete(appointment.reservationId);
      window.dispatchEvent(new CustomEvent('capd:reservations-changed'));
      alert('예약이 취소되었습니다.');
      await reload();
    } catch (cancelError) {
      alert(cancelError.message || '예약 취소에 실패했습니다.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500">
      <div className="mb-3 flex shrink-0 items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black text-blue-600">APPOINTMENT LIST</div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">전체 예약 내역</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {currentDoctorName || '담당의'} 선생님의 담당 환자 예약을 최신 예약일시 순으로 확인합니다.
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

      <section className="mb-3 grid shrink-0 grid-cols-12 gap-3">
        <SummaryCard label="전체" value={`${counts.total}건`} tone="slate" />
        <SummaryCard label="예정" value={`${counts.upcoming}건`} tone="blue" />
        <SummaryCard label="지난 예약" value={`${counts.completed}건`} tone="emerald" />
        <SummaryCard label="취소" value={`${counts.canceled}건`} tone="rose" />

        <div className="col-span-4 flex items-center justify-end gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <div className="text-right">
            <div className="text-xs font-black text-slate-500">
              {isLoading ? '전체 예약 조회 중' : '최신순 정렬'}
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-slate-400">
              {monthStartDate} ~ {monthEndDate}
            </div>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {monthOptions.map(monthDate => (
              <button
                key={toDateKey(monthDate)}
                type="button"
                onClick={() => handleSelectMonth(monthDate)}
                disabled={isLoading}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSameMonth(selectedMonth, monthDate)
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:bg-white hover:text-blue-700'
                }`}
              >
                {getMonthLabel(monthDate)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => reload()}
            disabled={isLoading}
            className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            새로고침
          </button>
        </div>
      </section>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">예약 목록</h2>
            <p className="mt-0.5 text-xs font-bold text-slate-400">
              {isLoading ? '조회 중' : `전체 기준 ${appointmentRows.length}건`}
            </p>
          </div>

          <div className="text-xs font-black text-slate-400">
            예약일시가 가장 늦은 항목이 상단에 표시됩니다.
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
                <th className="w-40 px-4 py-3">전화번호</th>
                <th className="px-4 py-3">예약 유형</th>
                <th className="w-32 px-4 py-3 text-center">상태</th>
                <th className="w-32 px-4 py-3 text-center">작업</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {appointmentRows.map((appointment) => {
                const status = getReservationStatus(appointment);

                return (
                  <tr key={appointment.id} className="h-12 transition-colors hover:bg-blue-50/40">
                    <td className="px-4 py-2 text-xs font-black text-slate-400">{appointment.id}</td>
                    <td className="px-4 py-2 text-sm font-black text-slate-800">{appointment.date}</td>
                    <td className="px-4 py-2 font-mono text-sm font-black text-blue-700">{appointment.time}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/${appointment.patientId}`)}
                        className="truncate text-sm font-black text-slate-900 hover:text-blue-600 hover:underline"
                      >
                        {appointment.patientName} 환자
                      </button>
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-slate-500">
                      {appointment.phone}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleCancelAppointment(appointment)}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 transition-colors hover:bg-rose-100"
                      >
                        예약 취소
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!isLoading && appointmentRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-80 text-center text-sm font-bold text-slate-400">
                    조회된 예약이 없습니다.
                  </td>
                </tr>
              )}

              {isLoading && appointmentRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-80 text-center text-sm font-bold text-slate-400">
                    전체 예약 내역을 불러오는 중입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2">
          <div className="text-xs font-bold text-slate-400">
            {error ? `예약 조회 실패: ${error.message}` : '현재 백엔드는 날짜별 예약 조회 API를 제공합니다.'}
          </div>
          <div className="text-xs font-bold text-slate-400">
            목록 영역은 내부 스크롤로 더 많은 예약을 확인할 수 있습니다.
          </div>
        </div>
      </main>
    </div>
  );
}

function getReservationStatus(appointment) {
  if (!appointment.dateTime) {
    return {
      label: '예정',
      className: 'bg-blue-100 text-blue-700',
    };
  }

  const reservationDate = new Date(appointment.dateTime);

  if (!Number.isNaN(reservationDate.getTime()) && reservationDate < new Date()) {
    return {
      label: '지난 예약',
      className: 'bg-emerald-100 text-emerald-700',
    };
  }

  return {
    label: '예정',
    className: 'bg-blue-100 text-blue-700',
  };
}

function getMonthStart(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(dateValue) {
  const date = getMonthStart(dateValue);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(dateValue, monthCount) {
  const date = getMonthStart(dateValue);
  return new Date(date.getFullYear(), date.getMonth() + monthCount, 1);
}

function isSameMonth(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth()
  );
}

function getMonthLabel(dateValue) {
  const date = getMonthStart(dateValue);
  return `${date.getMonth() + 1}월`;
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
