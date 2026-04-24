import React, { useState } from 'react';
import Card from '../../components/Card';

export default function RecordListPage() {
  const [navDate, setNavDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  // 가짜 데이터 (수정 모달 관련 상태와 함수는 모두 제거되었습니다.)
  const [recordsData] = useState([
    {
      date: '2026-04-24',
      totalUf: 1150, 
      bp: '128/84', 
      weight: 65.5, 
      fbs: 105, 
      urineCount: 4, 
      turbidity: '맑음', 
      memo: '특별한 일 없었음', 
      exchanges: [
        { time: '08:30', concentration: '1.5', infused: 2000, drained: 2250, uf: 250 },
        { time: '13:00', concentration: '2.5', infused: 2000, drained: 2400, uf: 400 },
        { time: '18:15', concentration: '1.5', infused: 2000, drained: 2300, uf: 300 },
        { time: '22:40', concentration: '2.5', infused: 2000, drained: 2200, uf: 200 },
      ]
    },
    {
      date: '2026-04-23',
      totalUf: 950,
      bp: '142/95',
      weight: 66.1,
      fbs: 112,
      urineCount: 3,
      turbidity: '혼탁',
      memo: '몸이 무거워요',
      exchanges: [
        { time: '08:00', concentration: '1.5', infused: 2000, drained: 2150, uf: 150 },
        { time: '12:30', concentration: '2.5', infused: 2000, drained: 2300, uf: 300 },
        { time: '17:00', concentration: '1.5', infused: 2000, drained: 2250, uf: 250 },
        { time: '22:00', concentration: '2.5', infused: 2000, drained: 2250, uf: 250 },
      ]
    }
  ]);

  // 캘린더 관련 로직
  const year = navDate.getFullYear();
  const month = navDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setNavDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setNavDate(new Date(year, month + 1, 1));

  const formatDate = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleRecordClick = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    setSelectedDate(new Date(y, m - 1, d));
    setNavDate(new Date(y, m - 1, 1));
  };

  const selectedDateStr = formatDate(selectedDate);
  const activeRecord = recordsData.find(r => r.date === selectedDateStr);

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in fade-in duration-500 relative">
      
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">투석 기록 확인</h1>
        <p className="text-gray-500 mt-2">달력에서 날짜를 선택하여 과거의 기록을 확인할 수 있습니다. (수정 불가)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* 좌측: 상세 기록 섹션 */}
        <div className="lg:col-span-2 space-y-6">
          {activeRecord ? (
            <>
              {/* 하루 1회 요약 정보 카드 */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative">

                <div className="text-xs font-bold text-blue-600 uppercase mb-1">{selectedDateStr}</div>
                <div className="text-2xl font-black text-gray-900 mb-6">총 제수량 <span className={activeRecord.totalUf >= 0 ? 'text-blue-600' : 'text-red-500'}>{activeRecord.totalUf > 0 ? `+${activeRecord.totalUf}` : activeRecord.totalUf}mL</span></div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-gray-400 mb-1">혈압</div>
                    <div className="text-sm font-black text-gray-800">{activeRecord.bp}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-gray-400 mb-1">체중</div>
                    <div className="text-sm font-black text-gray-800">{activeRecord.weight} kg</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-gray-400 mb-1">공복혈당</div>
                    <div className="text-sm font-black text-gray-800">{activeRecord.fbs} <span className="text-[10px] font-medium text-gray-500">mg/dL</span></div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-gray-400 mb-1">소변 횟수/혼탁도</div>
                    <div className="text-sm font-black text-gray-800">{activeRecord.urineCount}회 / <span className={activeRecord.turbidity === '맑음' ? 'text-emerald-500' : 'text-red-500'}>{activeRecord.turbidity}</span></div>
                  </div>
                </div>
                
                {activeRecord.memo && (
                  <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100">
                    <div className="text-[11px] font-bold text-yellow-600 mb-1">오늘의 메모</div>
                    <div className="text-sm text-gray-700">{activeRecord.memo}</div>
                  </div>
                )}
              </div>

              {/* 매 회차 교환 기록 표 */}
              <Card className="p-0 overflow-hidden border-none shadow-md">
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">투석 교환 일지</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">교환 시각</th>
                        <th className="px-6 py-4">농도 (%)</th>
                        <th className="px-6 py-4 text-right">주입량 (mL)</th>
                        <th className="px-6 py-4 text-right">배액량 (mL)</th>
                        <th className="px-6 py-4 text-right text-blue-600">제수량</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {activeRecord.exchanges.map((ex, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{ex.time}</td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-gray-600">{ex.concentration}%</span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">{ex.infused}</td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">{ex.drained}</td>
                          <td className="px-6 py-4 text-right font-black text-blue-600 font-mono">
                            {ex.uf > 0 ? `+${ex.uf}` : ex.uf}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-20 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedDateStr}</h3>
              <p className="text-gray-400 font-medium">선택한 날짜에 기록된 투석 데이터가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 우측: 캘린더 사이드바 */}
        <aside className="sticky top-6">
          <Card className="p-5 border-none shadow-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-900 text-lg">{year}년 {month + 1}월</h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-50 rounded text-gray-400">◀</button>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-50 rounded text-gray-400">▶</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-[10px] font-bold text-gray-300 mb-3">{d}</div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} className="h-10"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                const currentStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const hasRecord = recordsData.some(r => r.date === currentStr);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`h-10 flex flex-col items-center justify-center rounded-2xl text-sm transition-all relative ${
                      isSelected ? 'bg-blue-600 text-white font-bold shadow-lg scale-105 z-10' : 'text-gray-600 hover:bg-blue-50'
                    }`}
                  >
                    {day}
                    {hasRecord && (
                      <span className={`w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">최근 기록 내역</span>
              </div>
              <div className="space-y-2">
                {recordsData.map(r => {
                  const isRecordSelected = r.date === selectedDateStr;
                  return (
                    <button 
                      key={r.date}
                      onClick={() => handleRecordClick(r.date)}
                      className={`w-full flex justify-between items-center p-3 rounded-xl border transition-all ${
                        isRecordSelected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <span className={`text-sm font-bold ${isRecordSelected ? 'text-blue-700' : 'text-gray-700'}`}>{r.date}</span>
                      <span className="text-xs font-black text-blue-500">+{r.totalUf}mL</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </aside>
      </div>

    </div>
  );
}