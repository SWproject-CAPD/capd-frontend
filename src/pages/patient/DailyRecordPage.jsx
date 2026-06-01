import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { capdApi } from '../../api/apiClient';
import { toCapdPayload, toDateKey, toKoreanDate } from '../../api/adapters';

const CAPD_CONFLICT_STATUS = 409;
const CAPD_CONFLICT_MESSAGE = '오늘 기록은 이미 제출되었거나 서버에서 수정할 수 없는 상태입니다. 기록 목록에서 확인해 주세요.';
const LOCAL_CAPD_DRAFT_PREFIX = 'capd_local_draft:';

const createEmptyDailyInfo = () => ({
  turbidity: '맑음',
  urineCount: '',
  weight: '',
  bpSystolic: '',
  bpDiastolic: '',
  fbs: '',
  memo: '',
});

const getLocalDraftKey = (date) => `${LOCAL_CAPD_DRAFT_PREFIX}${date}`;

const readLocalDraft = (date) => {
  try {
    const rawDraft = localStorage.getItem(getLocalDraftKey(date));
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
};

const saveLocalDraft = (date, dailyInfo, exchanges) => {
  localStorage.setItem(getLocalDraftKey(date), JSON.stringify({
    dailyInfo,
    exchanges,
    updatedAt: new Date().toISOString(),
  }));
};

const clearLocalDraft = (date) => {
  localStorage.removeItem(getLocalDraftKey(date));
};

export default function DailyRecordPage() {
  const navigate = useNavigate();
  const today = new Date();
  const formattedDate = toDateKey(today);
  const displayDate = toKoreanDate(today);
  const localDraft = readLocalDraft(formattedDate);

  const [dailyInfo, setDailyInfo] = useState(() => localDraft?.dailyInfo || createEmptyDailyInfo());
  const [exchanges, setExchanges] = useState(() => localDraft?.exchanges || []);
  const [autoSaveStatus, setAutoSaveStatus] = useState(localDraft ? '임시 저장 불러옴' : '자동 저장 대기');
  const [isTempSaveBlocked, setIsTempSaveBlocked] = useState(false);
  const [currentExchange, setCurrentExchange] = useState({
    time: '08:00',
    concentration: '1.5',
    infused: '2000',
    drained: '',
  });

  const saveTempRecord = (infoData = dailyInfo, exchangeList = exchanges) => {
    if (isTempSaveBlocked) return false;

    setAutoSaveStatus('자동 저장 중');

    try {
      // 서버 임시저장은 실제 TEMP 기록을 만들어 최종 제출과 충돌할 수 있어, 입력 중에는 브라우저에만 보관합니다.
      saveLocalDraft(formattedDate, infoData, exchangeList);
      setAutoSaveStatus('임시 저장 완료');
      return true;
    } catch (error) {
      setAutoSaveStatus(error.message || '자동 저장 실패');
      return false;
    }
  };

  const submitRecord = async (payload) => {
    try {
      return await capdApi.submit(payload);
    } catch (submitError) {
      if (submitError.status !== CAPD_CONFLICT_STATUS) throw submitError;

      try {
        const existingRecord = await capdApi.getMineByDate(formattedDate);

        if (existingRecord?.capdId && String(existingRecord.status || '').toUpperCase() === 'TEMP') {
          await capdApi.deleteCommon(existingRecord.capdId);
          return await capdApi.submit(payload);
        }
      } catch {
        // 기존 TEMP 확인/삭제에 실패하면 원래 제출 오류를 사용자에게 보여줍니다.
      }

      throw submitError;
    }
  };

  const handleDailyChange = (e) => {
    const { name, value } = e.target;
    setDailyInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = () => {
    saveTempRecord();
  };

  const handleTurbidityClick = (value) => {
    const updatedInfo = { ...dailyInfo, turbidity: value };
    setDailyInfo(updatedInfo);
    saveTempRecord(updatedInfo, exchanges);
  };

  const handleExchangeChange = (e) => {
    const { name, value } = e.target;
    setCurrentExchange(prev => ({ ...prev, [name]: value }));
  };

  const currentUfValue = (currentExchange.drained && currentExchange.infused)
    ? Number(currentExchange.drained) - Number(currentExchange.infused)
    : 0;

  const handleAddExchange = async () => {
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
      sessionNumber: exchanges.length + 1,
      infused: Number(currentExchange.infused),
      drained: Number(currentExchange.drained),
      uf: currentUfValue,
    };

    const newExchangesList = [...exchanges, newExchange].sort((a, b) => a.time.localeCompare(b.time));

    setExchanges(newExchangesList);
    await saveTempRecord(dailyInfo, newExchangesList);

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCurrentExchange({ time: timeString, concentration: '1.5', infused: '2000', drained: '' });
  };

  const handleRemoveExchange = async (index) => {
    const newList = exchanges.filter((_, itemIndex) => itemIndex !== index)
      .map((exchange, itemIndex) => ({ ...exchange, sessionNumber: itemIndex + 1 }));

    setExchanges(newList);
    await saveTempRecord(dailyInfo, newList);
  };

  const handleSubmitAll = async () => {
    if (isTempSaveBlocked) {
      alert(CAPD_CONFLICT_MESSAGE);
      navigate('/patient/record_list');
      return;
    }

    if (exchanges.length < 4) {
      const confirmUnder = window.confirm(`현재 투석 횟수가 ${exchanges.length}회로 기준(4회) 미달입니다. 그래도 제출하시겠습니까?`);
      if (!confirmUnder) return;
    }

    const confirmFinalSubmit = window.confirm(
      "오늘 하루 기록 마감하기 버튼 클릭 시 제출 후에는 수정이 불가능 합니다.\n그래도 제출하시겠습니까?\n\n(지금까지 작성한 내용은 자동 저장되고 있습니다)"
    );

    if (!confirmFinalSubmit) return;

    try {
      await submitRecord(toCapdPayload({
        date: formattedDate,
        dailyInfo,
        exchanges,
      }));

      clearLocalDraft(formattedDate);
      alert('오늘 하루의 기록이 성공적으로 제출되었습니다!');
      navigate('/patient/record_list');
    } catch (error) {
      if (error.status === CAPD_CONFLICT_STATUS) {
        setIsTempSaveBlocked(true);
        setAutoSaveStatus('이미 제출됨');
        clearLocalDraft(formattedDate);
        alert(CAPD_CONFLICT_MESSAGE);
        navigate('/patient/record_list');
        return;
      }

      alert(error.message || '최종 제출에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="text-blue-600 font-bold mb-2 flex items-center gap-2">
          <span>📅</span> {displayDate}
        </div>
        <h1 className="text-3xl font-black text-gray-900">투석 기록 입력</h1>
        <p className="text-gray-500 mt-2">
          일일 건강 수치와 매 회차 투석 기록을 입력하세요.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200 ring-1 ring-blue-50">
          <h2 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex justify-between items-center">
            <span className="flex items-center gap-2"><span className="text-blue-500">💧</span> 투석 교환 기록</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold">오늘 {exchanges.length}회 기록됨</span>
          </h2>

          <div className="space-y-5 bg-slate-50/50 p-4 rounded-xl border border-gray-100 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="교환 시각">
                <input type="time" name="time" value={currentExchange.time} onChange={handleExchangeChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
              <Field label="투석액 농도 (%)">
                <select name="concentration" value={currentExchange.concentration} onChange={handleExchangeChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="1.5">1.5%</option>
                  <option value="2.5">2.5%</option>
                  <option value="4.25">4.25%</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="주입량 (mL)">
                <input type="number" name="infused" value={currentExchange.infused} onChange={handleExchangeChange} placeholder="예: 2000" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
              <Field label="배액량 (mL)">
                <input type="number" name="drained" value={currentExchange.drained} onChange={handleExchangeChange} placeholder="예: 2200" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className={`flex-1 p-3 rounded-xl border flex justify-between items-center ${currentUfValue < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <div className="font-bold text-xs">현재 제수량</div>
                <div className="text-lg font-black">{currentUfValue > 0 ? `+${currentUfValue}` : currentUfValue} <span className="text-xs font-medium">mL</span></div>
              </div>
              <button type="button" onClick={handleAddExchange} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                + 회차 추가
              </button>
            </div>
          </div>

          {exchanges.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400 mb-2 px-1">기록된 내역 (총 {exchanges.reduce((acc, curr) => acc + curr.uf, 0)}mL)</div>
              {exchanges.map((exchange, index) => (
                <div key={`${exchange.time}-${index}`} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800 w-12">{exchange.time}</span>
                    <span className="text-xs bg-slate-100 text-gray-600 px-2 py-0.5 rounded font-bold">{exchange.concentration}%</span>
                    <span className="text-sm text-gray-500 hidden sm:inline">주입 {exchange.infused} / 배액 {exchange.drained}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-black font-mono ${exchange.uf >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {exchange.uf > 0 ? `+${exchange.uf}` : exchange.uf} mL
                    </span>
                    <button onClick={() => handleRemoveExchange(index)} className="text-gray-300 hover:text-red-500 px-2">X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-5 pb-3 border-b border-gray-100 flex justify-between items-center">
            <span className="flex items-center gap-2"><span className="text-emerald-500">❤️</span> 일일 건강 수치</span>
            <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-full">{autoSaveStatus}</span>
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="체중 (kg)">
                <input type="number" step="0.1" name="weight" value={dailyInfo.weight} onChange={handleDailyChange} onBlur={handleBlur} placeholder="00.0" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
              <Field label="소변 횟수 (회)">
                <input type="number" name="urineCount" value={dailyInfo.urineCount} onChange={handleDailyChange} onBlur={handleBlur} placeholder="0" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
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
              <Field label="공복혈당 (mg/dL)">
                <input type="number" name="fbs" value={dailyInfo.fbs} onChange={handleDailyChange} onBlur={handleBlur} placeholder="000" className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
              </Field>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">복막액 혼탁도</label>
                <div className="grid grid-cols-2 gap-2 h-11.5">
                  {['맑음', '혼탁'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTurbidityClick(value)}
                      className={`rounded-xl font-bold border transition-all ${dailyInfo.turbidity === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <button type="button" onClick={handleSubmitAll} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-5 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          오늘 하루 기록 마감하기
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  );
}
