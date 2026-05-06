import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import BackToPatientButton from '../../components/BackToPatientButton';

export default function RecordLogsPage() {
  const { id } = useParams();
  
  // 환자 데이터 및 30일 치 기록 불러오기
  const patient = patientsData.find(p => p.id === id) || patientsData[0];
  const history = patient.history;

  // 열림/닫힘 상태 관리 (기본적으로 가장 최신 날짜 하나만 열어둠)
  const [openDates, setOpenDates] = useState([history[0]?.date]);

  const toggleAccordion = (dateStr) => {
    setOpenDates(prev => 
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  // 캘린더 관련 로직 (달력 표시용 기준 날짜)
  const [calendarDate, setCalendarDate] = useState(new Date(history[0]?.date || new Date()));
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  // 달력에서 날짜 클릭 시 해당 아코디언을 열고 스크롤 이동
  const handleDateClick = (dateStr) => {
    if (!openDates.includes(dateStr)) {
      setOpenDates(prev => [...prev, dateStr]);
    }
    // 부드러운 스크롤 이동
    setTimeout(() => {
      const element = document.getElementById(`record-${dateStr}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 달력에 표시할 날짜가 기록(history)에 있는지 확인하는 함수
  const hasRecordOnDate = useMemo(() => {
    const recordDates = new Set(history.map(h => h.date));
    return (dateStr) => recordDates.has(dateStr);
  }, [history]);

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-500 h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* 상단: 뒤로가기 버튼 및 타이틀 */}
      <div className="shrink-0 mb-6">
        <BackToPatientButton />
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          <span className="text-blue-600 bg-blue-100 p-2 rounded-xl">📅</span>
          전체 투석 기록 로그
        </h1>
        <p className="text-sm text-gray-500 mt-2">{patient.name} 환자의 최근 30일 투석 교환 및 건강 수치 기록입니다.</p>
      </div>

      {/* 하단: 달력(좌측) + 스크롤 리스트(우측) */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* 달력 영역 (고정) */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            {/* 달력 헤더 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-900 text-lg">{year}년 {month + 1}월</h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-50 rounded text-gray-400">◀</button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-50 rounded text-gray-400">▶</button>
              </div>
            </div>

            {/* 달력 요일 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-[10px] font-bold text-gray-400 mb-3">{d}</div>
              ))}
              
              {/* 달력 빈칸 */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} className="h-10"></div>
              ))}
              
              {/* 달력 날짜 */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const currentStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const hasRecord = hasRecordOnDate(currentStr);

                return (
                  <button
                    key={day}
                    onClick={() => hasRecord && handleDateClick(currentStr)}
                    disabled={!hasRecord}
                    className={`h-10 flex flex-col items-center justify-center rounded-xl text-sm transition-all relative ${
                      hasRecord 
                        ? 'text-gray-700 hover:bg-blue-50 font-bold cursor-pointer' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {day}
                    {hasRecord && <span className="w-1 h-1 rounded-full bg-blue-500 absolute bottom-1.5"></span>}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* 상태 범례 */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>기록 있음</div>
            <div className="flex items-center gap-2 mb-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>주의/이상치 발생(이상치 탐지 이후 적용)</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>정상 수치(이상치 탐지 이후 적용)</div>
          </div>
        </div>

        {/* 기록 리스트 영역 (스크롤) */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto custom-scrollbar p-2">
          <div className="space-y-3">
            {history.map((dayData) => {
              const isOpen = openDates.includes(dayData.date);
              
              // 이 날짜의 기록이 정상인지 판별 (간단한 예시: 제수량이 800 미만이거나 혈압이 140이상이면 경고)
              const isWarning = dayData.uf < 800 || dayData.bpSystolic >= 140;

              return (
                <div 
                  key={dayData.date} 
                  id={`record-${dayData.date}`} 
                  className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                    isOpen ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* 헤더 (요약 줄) */}
                  <button 
                    onClick={() => toggleAccordion(dayData.date)}
                    className={`w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-gray-400">{year}년</span>
                        <span className="text-lg font-black text-gray-800">{dayData.displayDate.replace('-', '/')}</span>
                      </div>
                      
                      <div className="h-8 w-px bg-gray-200 mx-2"></div>
                      
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400">총 제수량</div>
                          <div className={`text-sm font-black ${isWarning && dayData.uf < 800 ? 'text-red-600' : 'text-blue-600'}`}>
                            +{dayData.uf}mL
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-[10px] font-bold text-gray-400">혈압</div>
                          <div className={`text-sm font-bold ${isWarning && dayData.bpSystolic >= 140 ? 'text-red-600' : 'text-gray-700'}`}>
                            {dayData.bp}
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-[10px] font-bold text-gray-400">투석 횟수</div>
                          <div className="text-sm font-bold text-gray-700">{dayData.exchanges.length}회</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isWarning && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> 확인 필요
                        </span>
                      )}
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* 바디: 상세 내용 */}
                  {isOpen && (
                    <div className="bg-slate-50 border-t border-gray-100 p-4 md:p-6 animate-in slide-in-from-top-2">
                      
                      {/* 일일 건강 수치 요약 */}
                      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-x-8 gap-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⚖️</span>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400">체중</div>
                            <div className="text-sm font-black text-gray-800">{dayData.weight} kg</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🩸</span>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400">공복혈당</div>
                            <div className="text-sm font-black text-gray-800">{dayData.fbs || 100} mg/dL</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🚽</span>
                          <div>
                            <div className="text-[10px] font-bold text-gray-400">소변/혼탁도</div>
                            <div className="text-sm font-black text-gray-800">{dayData.urineCount || 3}회 / 맑음</div>
                          </div>
                        </div>
                      </div>

                      {/* 교환 상세 표 */}
                      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-xs md:text-sm">
                          <thead className="bg-slate-100 text-gray-500 font-bold border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3">회차/시간</th>
                              <th className="px-4 py-3">농도</th>
                              <th className="px-4 py-3 text-right">주입량</th>
                              <th className="px-4 py-3 text-right">배액량</th>
                              <th className="px-4 py-3 text-right">제수량</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dayData.exchanges.map((ex, exIdx) => (
                              <tr key={exIdx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-bold text-gray-800">
                                  <span className="inline-block w-4 h-4 bg-slate-200 text-slate-500 text-center rounded-full text-[10px] mr-2">{exIdx + 1}</span>
                                  {ex.time}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-bold text-gray-600">{ex.concentration}%</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-500 font-mono">{ex.infused}</td>
                                <td className="px-4 py-3 text-right text-gray-500 font-mono">{ex.drained}</td>
                                <td className="px-4 py-3 text-right font-bold text-blue-600 font-mono">+{ex.uf}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}