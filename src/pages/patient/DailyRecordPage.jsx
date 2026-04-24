import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DailyRecordPage() {
  const navigate = useNavigate();

  // 오늘 날짜 생성
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const displayDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  // 일일 건강 수치 
  const [dailyInfo, setDailyInfo] = useState(() => {
    const saved = localStorage.getItem(`capd_daily_info_${formattedDate}`);
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      turbidity: parsed.turbidity || '맑음',
      urineCount: parsed.urineCount || '',
      weight: parsed.weight || '',
      bpSystolic: parsed.bpSystolic || '', 
      bpDiastolic: parsed.bpDiastolic || '',
      fbs: parsed.fbs || '',
      memo: parsed.memo || '',
    };
  });

  // 로컬 스토리지 실시간 백업 유지
  useEffect(() => {
    localStorage.setItem(`capd_daily_info_${formattedDate}`, JSON.stringify(dailyInfo));
  }, [dailyInfo, formattedDate]);

  const handleDailyChange = (e) => {
    const { name, value } = e.target;
    setDailyInfo(prev => ({ ...prev, [name]: value }));
  };

  // 백그라운드 임시저장 API 호출 함수
  const triggerAutoSaveAPI = (infoData) => {
    const autoSavePayload = {
      date: formattedDate,
      ...infoData,
      exchanges: [], // 요청하신 대로 세션 데이터는 비워서 보냅니다.
    };
    
    // TODO: 백엔드 API 연동 위치
    // axios.post('/api/patients/daily-records/auto-save', autoSavePayload);
    console.log('✅ [백그라운드 임시저장 API 호출됨]:', autoSavePayload);
  };

  // 입력이 끝났을 때(포커스가 벗어났을 때) 실행될 핸들러
  const handleBlur = () => {
    triggerAutoSaveAPI(dailyInfo);
  };

  // 버튼 클릭으로 바로 상태가 변하는 항목을 위한 핸들러
  const handleTurbidityClick = (v) => {
    const updatedInfo = { ...dailyInfo, turbidity: v };
    setDailyInfo(updatedInfo);
    triggerAutoSaveAPI(updatedInfo); // 업데이트된 최신 상태로 즉시 쏘기
  };

  // 투석 교환 기록
  const [exchanges, setExchanges] = useState(() => {
    const saved = localStorage.getItem(`capd_exchanges_${formattedDate}`);
    return saved ? JSON.parse(saved) : [];
  });

  // 현재 입력 중인 단일 교환 폼 데이터
  const [currentExchange, setCurrentExchange] = useState({
    time: '08:00',
    concentration: '1.5',
    infused: '2000',
    drained: '',
  });

  const handleExchangeChange = (e) => {
    const { name, value } = e.target;
    setCurrentExchange(prev => ({ ...prev, [name]: value }));
  };

  // 현재 입력 폼의 제수량 계산 (실시간 표시용)
  const currentUfValue = (currentExchange.drained && currentExchange.infused) 
    ? Number(currentExchange.drained) - Number(currentExchange.infused) 
    : 0;

  // 회차 추가 버튼 클릭 시 배열에 추가
  const handleAddExchange = () => {
    if (exchanges.length >= 5) {
      alert('하루 최대 5회까지만 추가할 수 있습니다.');
      return;
    }

    if (!currentExchange.infused || !currentExchange.drained) {
      alert('주입량과 배액량을 모두 입력해 주세요.');
      return;
    }

    const newExchange = {
      ...currentExchange,
      infused: Number(currentExchange.infused),
      drained: Number(currentExchange.drained),
      uf: currentUfValue,
    };

    const newExchangesList = [...exchanges, newExchange];
    
    newExchangesList.sort((a, b) => a.time.localeCompare(b.time));
    
    setExchanges(newExchangesList);
    localStorage.setItem(`capd_exchanges_${formattedDate}`, JSON.stringify(newExchangesList));

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCurrentExchange({ time: timeString, concentration: '1.5', infused: '2000', drained: '' });
  };

  // 특정 회차 삭제
  const handleRemoveExchange = (index) => {
    const newList = exchanges.filter((_, i) => i !== index);
    setExchanges(newList);
    localStorage.setItem(`capd_exchanges_${formattedDate}`, JSON.stringify(newList));
  };

  // 최종 제출
  const handleSubmitAll = () => {
    // 4회 미만 제출 시 경고 알림 로직
    if (exchanges.length < 4) {
      const confirmUnder = window.confirm(`현재 투석 횟수가 ${exchanges.length}회로 기준(4회) 미달입니다. 그래도 제출하시겠습니까?`);
      if (!confirmUnder) return;
    }

    // 제출 시 수정 불가 경고창
    const confirmFinalSubmit = window.confirm(
      "오늘 하루 기록 마감하기 버튼 클릭 시 제출 후에는 수정이 불가능 합니다.\n그래도 제출하시겠습니까?\n\n(지금까지 작성한 내용은 자동 저장되고 있습니다)"
    );

    // 사용자가 취소를 누르면 제출 안 함
    if (!confirmFinalSubmit) return;

    // TODO: 백엔드 API가 연결되면 아래 데이터를 서버로 POST/PUT 함
    const finalDataToSubmit = {
      date: formattedDate,
      ...dailyInfo,
      exchanges: exchanges,
      totalUf: exchanges.reduce((sum, ex) => sum + ex.uf, 0)
    };

    console.log('최종 제출 데이터:', finalDataToSubmit);
    alert('오늘 하루의 기록이 성공적으로 제출되었습니다!');
    
    navigate('/patient/record_list');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in duration-500">
      
      <div className="mb-8">
        <div className="text-blue-600 font-bold mb-2 flex items-center gap-2">
          <span>📅</span> {displayDate}
        </div>
        <h1 className="text-3xl font-black text-gray-900">투석 기록 입력</h1>
        <p className="text-gray-500 mt-2">일일 건강 수치와 매 회차 투석 기록을 입력하세요.</p>
      </div>

      <div className="space-y-6">
        
        {/* 매 회차 교환 기록 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 ring-1 ring-blue-50">
          <h2 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex justify-between items-center">
            <span className="flex items-center gap-2"><span className="text-blue-500">💧</span> 투석 교환 기록</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold">오늘 {exchanges.length}회 기록됨</span>
          </h2>
          
          <div className="space-y-5 bg-slate-50/50 p-4 rounded-xl border border-gray-100 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">교환 시각</label>
                <input type="time" name="time" value={currentExchange.time} onChange={handleExchangeChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">투석액 농도 (%)</label>
                <select name="concentration" value={currentExchange.concentration} onChange={handleExchangeChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="1.5">1.5%</option>
                  <option value="2.5">2.5%</option>
                  <option value="4.25">4.25%</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">주입량 (mL)</label>
                <input type="number" name="infused" value={currentExchange.infused} onChange={handleExchangeChange} placeholder="예: 2000" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">배액량 (mL)</label>
                <input type="number" name="drained" value={currentExchange.drained} onChange={handleExchangeChange} placeholder="예: 2200" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className={`flex-1 p-3 rounded-xl border flex justify-between items-center ${currentUfValue < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <div className="font-bold text-xs">현재 제수량</div>
                <div className="text-lg font-black">{currentUfValue > 0 ? `+${currentUfValue}` : currentUfValue} <span className="text-xs font-medium">mL</span></div>
              </div>
              <button 
                type="button" 
                onClick={handleAddExchange}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
              >
                + 회차 추가
              </button>
            </div>
          </div>

          {exchanges.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400 mb-2 px-1">기록된 내역 (총 {exchanges.reduce((acc, curr) => acc + curr.uf, 0)}mL)</div>
              {exchanges.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800 w-12">{ex.time}</span>
                    <span className="text-xs bg-slate-100 text-gray-600 px-2 py-0.5 rounded font-bold">{ex.concentration}%</span>
                    <span className="text-sm text-gray-500 hidden sm:inline">주입 {ex.infused} / 배액 {ex.drained}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-black font-mono ${ex.uf >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {ex.uf > 0 ? `+${ex.uf}` : ex.uf} mL
                    </span>
                    <button onClick={() => handleRemoveExchange(idx)} className="text-gray-300 hover:text-red-500 px-2">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 일일 건강 수치 (onBlur 적용) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex justify-between items-center">
            <span className="flex items-center gap-2"><span className="text-emerald-500">❤️</span> 일일 건강 수치</span>
            <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-full">자동 저장 중</span>
          </h2>
          
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">체중 (kg)</label>
                <input type="number" step="0.1" name="weight" value={dailyInfo.weight} onChange={handleDailyChange} onBlur={handleBlur} placeholder="00.0" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">소변 횟수 (회)</label>
                <input type="number" name="urineCount" value={dailyInfo.urineCount} onChange={handleDailyChange} onBlur={handleBlur} placeholder="0" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">혈압 (mmHg)</label>
              <div className="flex items-center gap-3">
                <input type="number" name="bpSystolic" value={dailyInfo.bpSystolic} onChange={handleDailyChange} onBlur={handleBlur} placeholder="수축기" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                <span className="text-gray-300">/</span>
                <input type="number" name="bpDiastolic" value={dailyInfo.bpDiastolic} onChange={handleDailyChange} onBlur={handleBlur} placeholder="이완기" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">공복혈당 (mg/dL)</label>
                <input type="number" name="fbs" value={dailyInfo.fbs} onChange={handleDailyChange} onBlur={handleBlur} placeholder="000" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">복막액 혼탁도</label>
                <div className="grid grid-cols-2 gap-2 h-11.5">
                  {['맑음', '혼탁'].map((v) => (
                    <button
                      key={v} type="button"
                      onClick={() => handleTurbidityClick(v)}
                      className={`rounded-xl font-bold border transition-all ${dailyInfo.turbidity === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 메모 (onBlur 적용) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-yellow-500">📝</span> 하루 메모
          </h2>
          <textarea
            name="memo"
            value={dailyInfo.memo}
            onChange={handleDailyChange}
            onBlur={handleBlur}
            placeholder="오늘의 특이사항이나 컨디션을 적어주세요."
            className="w-full h-24 bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        {/* 최종 제출 버튼 */}
        <button 
          type="button" 
          onClick={handleSubmitAll} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          오늘 하루 기록 마감하기
        </button>

      </div>
    </div>
  );
}