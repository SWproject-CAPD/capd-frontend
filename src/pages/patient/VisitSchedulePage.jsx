import React, { useState } from 'react';

export default function VisitSchedulePage() {
  // 상태 관리: 현재 달력에서 보고 있는 연도/월, 선택된 날짜
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  // 가상의 예약 데이터 (추후 백엔드 API에서 가져올 데이터)
  const mockSchedules = [
    {
      id: 1,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
      time: '14:30',
      department: '신장내과',
      doctor: '김의사',
      type: '정기 검진',
      status: 'upcoming' // upcoming, completed 등
    },
    {
      id: 2,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14),
      time: '10:00',
      department: '투석실',
      doctor: '이간호',
      type: '투석관 점검 및 소독',
      status: 'upcoming'
    },
    {
      id: 3,
      date: new Date(today.getFullYear(), today.getMonth() + 1, 5),
      time: '15:00',
      department: '신장내과',
      doctor: '김의사',
      type: '혈액 검사 결과 상담',
      status: 'upcoming'
    }
  ];

  // 달력 계산을 위한 변수들
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // 달 이동 핸들러
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // 현재 월에 해당하는 일정만 필터링 (하단 리스트용)
  const currentMonthSchedules = mockSchedules
    .filter(sch => sch.date.getFullYear() === year && sch.date.getMonth() === month)
    .sort((a, b) => a.date - b.date); // 날짜순 정렬

  // 특정 날짜에 일정이 있는지 확인하는 함수
  const getSchedulesForDay = (day) => {
    return mockSchedules.filter(sch => 
      sch.date.getFullYear() === year && 
      sch.date.getMonth() === month && 
      sch.date.getDate() === day
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* 상단 타이틀 영역 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">예약 및 진료 일정</h1>
        <p className="text-gray-500 mt-2 font-medium">다음 병원 방문 일정과 정기 검진 예약 현황을 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 좌측/상단: 캘린더 위젯 */}
        <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-4xl shadow-sm border border-gray-200">
          
          {/* 캘린더 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl font-black text-gray-800">
              {year}년 {month + 1}월
            </h2>
            <button 
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* 캘린더 요일 */}
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* 캘린더 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {/* 빈 칸 (이전 달) */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            
            {/* 날짜 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
              const daySchedules = getSchedulesForDay(day);
              const hasSchedule = daySchedules.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(year, month, day))}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all ${
                    isSelected 
                      ? 'bg-orange-500 text-white shadow-md font-bold transform scale-105' 
                      : isToday 
                        ? 'bg-gray-100 text-gray-900 font-bold hover:bg-gray-200' 
                        : 'text-gray-700 hover:bg-orange-50 font-medium'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {/* 일정이 있는 날 점 표시 */}
                  {hasSchedule && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-orange-500'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측/하단: 선택한 월의 일정 리스트 */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-200 flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex justify-between items-center pb-4 border-b border-gray-100">
              <span>{month + 1}월 일정 목록</span>
              <span className="bg-orange-100 text-orange-600 text-xs px-2.5 py-1 rounded-full">{currentMonthSchedules.length}건</span>
            </h3>

            {currentMonthSchedules.length > 0 ? (
              <div className="space-y-4">
                {currentMonthSchedules.map((sch) => (
                  <div 
                    key={sch.id} 
                    className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-slate-50/50 hover:bg-orange-50/50 hover:border-orange-200 transition-colors group cursor-pointer"
                  >
                    {/* 날짜 박스 */}
                    <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl w-14 h-14 shrink-0 shadow-sm group-hover:border-orange-300 group-hover:text-orange-600 transition-colors">
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-orange-400">{sch.date.getMonth() + 1}월</span>
                      <span className="text-lg font-black text-gray-800 group-hover:text-orange-600">{sch.date.getDate()}</span>
                    </div>

                    {/* 상세 정보 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-black text-gray-900">{sch.type}</span>
                        <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">{sch.time}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {sch.department} • {sch.doctor} 선생님
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3 opacity-50">📭</div>
                <p className="text-gray-400 font-medium text-sm">이번 달에 예정된 진료가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}