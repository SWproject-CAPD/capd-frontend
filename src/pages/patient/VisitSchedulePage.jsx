import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_CURRENT_PATIENT_ID = 'P010';

const mockDoctorAssignments = {
  P001: '김의사',
  P002: '김의사',
  P003: '김의사',
  P004: '김의사',
  P005: '김의사',
  P006: '김의사',
  P007: '김의사',
};

export default function VisitSchedulePage() {
  const navigate = useNavigate();

  const today = new Date();
  const assignedDoctorName = mockDoctorAssignments[MOCK_CURRENT_PATIENT_ID];
  const hasAssignedDoctor = Boolean(assignedDoctorName);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const canUseSchedule = hasAssignedDoctor || previewEnabled;

  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  const displayDoctorName = assignedDoctorName || '임시 담당의';

  const mockSchedules = [
    { id: 1, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), time: '14:30', department: '신장내과', doctor: displayDoctorName, type: '정기 검진' },
    { id: 2, date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14), time: '10:00', department: '투석실', doctor: '이간호', type: '투석관 점검 및 소독' },
    { id: 3, date: new Date(today.getFullYear(), today.getMonth() + 1, 5), time: '15:00', department: '신장내과', doctor: displayDoctorName, type: '혈액 검사 결과 상담' },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const currentMonthSchedules = mockSchedules
    .filter(schedule => schedule.date.getFullYear() === year && schedule.date.getMonth() === month)
    .sort((a, b) => a.date - b.date);

  const selectedDaySchedules = mockSchedules.filter(schedule =>
    schedule.date.getFullYear() === selectedDate.getFullYear() &&
    schedule.date.getMonth() === selectedDate.getMonth() &&
    schedule.date.getDate() === selectedDate.getDate()
  );

  const getSchedulesForDay = (day) => mockSchedules.filter(schedule =>
    schedule.date.getFullYear() === year &&
    schedule.date.getMonth() === month &&
    schedule.date.getDate() === day
  );

  if (!canUseSchedule) {
    return (
      <div className="mx-auto max-w-3xl pb-24 animate-in fade-in duration-500">
        <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
            !
          </div>
          <h1 className="text-2xl font-black text-slate-900">담당의 배정 후 일정을 확인할 수 있습니다</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            방문 예약과 진료 일정은 담당 의료진이 배정된 뒤 제공됩니다.<br />
            담당의가 배정되면 다음 방문 일정을 확인할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/patient')}
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              홈으로 돌아가기
            </button>
            <button
              type="button"
              onClick={() => setPreviewEnabled(true)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-500 hover:bg-slate-50"
            >
              임시로 화면 보기
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-8 animate-in fade-in duration-500">
      <section className="mb-5 rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 md:text-3xl">예약 및 진료 일정</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              다음 병원 방문 일정과 정기 검진 예약 현황을 확인하세요.
            </p>
          </div>
          <div className="rounded-2xl bg-orange-50 px-4 py-3">
            <div className="text-[11px] font-black text-orange-600">담당의</div>
            <div className="mt-1 text-sm font-black text-orange-800">{displayDoctorName} 선생님</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-xl font-black text-slate-500 hover:bg-orange-50 hover:text-orange-600"
            >
              ‹
            </button>
            <h2 className="text-xl font-black text-slate-900">{year}년 {month + 1}월</h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-xl font-black text-slate-500 hover:bg-orange-50 hover:text-orange-600"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div key={day} className={`mb-2 text-xs font-black ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
              const hasSchedule = getSchedulesForDay(day).length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`relative aspect-square rounded-2xl text-sm font-black transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-md'
                      : isToday
                        ? 'bg-slate-100 text-slate-900 hover:bg-orange-50'
                        : 'text-slate-600 hover:bg-orange-50'
                  }`}
                >
                  {day}
                  {hasSchedule && (
                    <span className={`absolute bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-5">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">선택한 날짜</h2>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </span>
            </div>

            {selectedDaySchedules.length > 0 ? (
              <div className="space-y-3">
                {selectedDaySchedules.map(schedule => <ScheduleCard key={schedule.id} schedule={schedule} />)}
              </div>
            ) : (
              <EmptySchedule text="선택한 날짜에 예정된 진료가 없습니다." />
            )}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">{month + 1}월 일정</h2>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
                {currentMonthSchedules.length}건
              </span>
            </div>

            {currentMonthSchedules.length > 0 ? (
              <div className="space-y-3">
                {currentMonthSchedules.map(schedule => <ScheduleCard key={schedule.id} schedule={schedule} compact />)}
              </div>
            ) : (
              <EmptySchedule text="이번 달에 예정된 진료가 없습니다." />
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ScheduleCard({ schedule, compact = false }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-white shadow-sm">
        <span className="text-[10px] font-black text-orange-500">{schedule.date.getMonth() + 1}월</span>
        <span className="text-lg font-black text-slate-900">{schedule.date.getDate()}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-slate-900">{schedule.type}</h3>
          <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-black text-orange-700">
            {schedule.time}
          </span>
        </div>
        {!compact && (
          <p className="mt-1 text-sm font-medium text-slate-500">
            {schedule.department} · {schedule.doctor} 선생님
          </p>
        )}
        {compact && (
          <p className="mt-1 text-xs font-medium text-slate-500">
            {schedule.department}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptySchedule({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">
      {text}
    </div>
  );
}
