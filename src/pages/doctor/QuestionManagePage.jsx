import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';

// 임시 AI 생성 질문 데이터
const initialMockQuestions = [
  {
    id: 1,
    type: '객관식',
    subType: '예/아니오',
    text: '최근 3일간 발목이나 얼굴에 붓기가 느껴지셨나요?',
    options: ['예', '아니오'],
    reason: '최근 평균 제수량이 800mL 미만으로 감소 추세를 보여, 체내 수분 저류로 인한 부종 발생 여부를 확인해야 합니다.',
    status: 'pending',
  },
  {
    id: 2,
    type: '객관식',
    subType: '다지선다',
    text: '어제 저녁 식사로 주로 어떤 종류의 음식을 드셨나요?',
    options: ['국물류 (찌개, 국 등)', '튀김/볶음류', '육류 구이', '채소 위주의 식단', '기타'],
    reason: '수축기 혈압이 145mmHg 이상으로 상승했습니다. 나트륨 과다 섭취가 원인인지 파악하기 위해 식단을 점검합니다.',
    status: 'pending',
  },
  {
    id: 3,
    type: '주관식',
    subType: '단답형',
    text: '최근 투석액을 배액할 때 통증이나 불편함이 있었다면 어떤 느낌인지 간단히 적어주세요.',
    options: [],
    reason: '환자가 최근 작성한 메모에 "몸이 무겁다"는 내용이 있습니다. 복막염의 초기 증상인 복통 여부를 주관식으로 확인합니다.',
    status: 'pending',
  },
  {
    id: 4,
    type: '객관식',
    subType: '예/아니오',
    text: '어제 처방받은 혈압약은 제시간에 복용하셨나요?',
    options: ['예', '아니오'],
    reason: '지속적인 혈압 상승이 관찰되므로 약물 복용 순응도를 최우선으로 확인해야 합니다.',
    status: 'approved',
  },
];

export default function QuestionManagePage() {
  const { id } = useParams();
  const patient = patientsData.find(p => p.id === id) || patientsData[0];

  const [questions, setQuestions] = useState(initialMockQuestions);
  const [activeTab, setActiveTab] = useState('pending');

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => q.status === activeTab);
  }, [questions, activeTab]);

  const handleUpdateStatus = (questionId, newStatus) => {
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, status: newStatus } : q))
    );
  };

  const handleGenerateQuestion = () => {
    setQuestions(prev => [
      {
        id: Date.now(),
        type: '객관식',
        subType: '예/아니오',
        text: 'AI가 추가로 생성한 예시 질문입니다.',
        options: ['예', '아니오'],
        reason: '현재는 개발용 예시 질문입니다. 추후 환자 상태 데이터를 기반으로 AI가 질문과 추천 이유를 생성하도록 연결할 예정입니다.',
        status: 'pending',
      },
      ...prev,
    ]);
    setActiveTab('pending');
  };

  const counts = {
    pending: questions.filter(q => q.status === 'pending').length,
    approved: questions.filter(q => q.status === 'approved').length,
    rejected: questions.filter(q => q.status === 'rejected').length,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500 md:p-6">
      <div className="mb-5 shrink-0">
        <BackToPatientButton />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
              <span className="rounded-xl bg-indigo-100 p-2 text-xl text-indigo-600">📋</span>
              AI 설문 승인 및 관리
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              <span className="font-bold text-indigo-600">{patient.name}</span> 환자의 상태를 분석하여 AI가 추천한 질문들입니다.
            </p>
          </div>

          {/* TODO: 추후 온프레미스 AI 질문 생성 API 호출로 교체 필요 */}
          <button
            onClick={handleGenerateQuestion}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 md:w-auto"
          >
            질문 생성하기
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">
        {/* 좌측 사이드바: 환자 요약 및 통계 */}
        <aside className="flex min-h-0 flex-col gap-4 xl:col-span-3 overflow-y-auto custom-scrollbar pr-1">
          {/* 환자 요약 블럭 */}
          <Card className="border-none p-5 shadow-sm shrink-0">
            <h3 className="mb-4 text-sm font-black text-gray-800">환자 요약</h3>
            <div className="space-y-1">
              <InfoRow label="환자명" value={patient.name} />
              <InfoRow label="환자번호" value={patient.id} />
              <InfoRow label="성별/나이" value={`${patient.sex} / ${patient.age}세`} />
              <InfoRow label="CAPD 시작일" value={patient.capdStartDate} />
              <InfoRow label="담당의" value={patient.doctor} />
            </div>
          </Card>

          {/* 설문 처리 현황 블럭 */}
          <Card className="border-none p-5 shadow-sm shrink-0">
            <h3 className="mb-4 text-sm font-black text-gray-800">설문 처리 현황</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                <span className="text-xs font-bold text-indigo-800">승인 대기</span>
                <span className="text-lg font-black text-indigo-600">{counts.pending}건</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-xs font-bold text-emerald-800">승인 완료</span>
                <span className="text-lg font-black text-emerald-600">{counts.approved}건</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                <span className="text-xs font-bold text-rose-800">거절됨</span>
                <span className="text-lg font-black text-rose-600">{counts.rejected}건</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* 우측 메인: 질문 리스트 */}
        <main className="flex min-h-0 flex-col xl:col-span-9">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-4 pt-4">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
                    activeTab === 'pending' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  승인 대기 ({counts.pending})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
                    activeTab === 'approved' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  승인 완료 ({counts.approved})
                </button>
                <button
                  onClick={() => setActiveTab('rejected')}
                  className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
                    activeTab === 'rejected' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  거절됨 ({counts.rejected})
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
              {filteredQuestions.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 text-4xl">📭</div>
                  <h3 className="text-lg font-bold text-gray-800">해당하는 질문이 없습니다</h3>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wider ${
                          q.type === '객관식' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {q.type}
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                          {q.subType}
                        </span>
                      </div>

                      <div className="mb-5">
                        <h2 className="text-lg font-black text-gray-900 mb-3">Q. {q.text}</h2>
                        {q.type === '객관식' && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {q.options.map((opt, idx) => (
                              <div key={idx} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === '주관식' && (
                          <div className="mt-3 w-full rounded-xl border border-dashed border-gray-300 bg-slate-50 px-4 py-3 text-xs text-gray-400">
                            환자가 직접 답변을 입력할 텍스트 영역입니다.
                          </div>
                        )}
                      </div>

                      <div className="mb-5 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-4">
                        <h4 className="mb-1 flex items-center gap-1.5 text-xs font-black text-indigo-800">
                          <span className="text-sm">🤖</span> AI 추천 이유
                        </h4>
                        <p className="text-sm font-medium text-indigo-900/80 leading-relaxed">
                          {q.reason}
                        </p>
                      </div>

                      {activeTab === 'pending' && (
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'rejected')}
                            className="rounded-xl px-5 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            거절하기
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'approved')}
                            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                          >
                            승인하기
                          </button>
                        </div>
                      )}

                      {activeTab !== 'pending' && (
                        <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'pending')}
                            className="text-xs font-bold text-gray-400 underline underline-offset-2 hover:text-gray-600"
                          >
                            대기 상태로 되돌리기
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 보조 컴포넌트: 환자 요약 정보 행
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm last:border-b-0 last:pb-0">
      <span className="font-bold text-gray-400">{label}</span>
      <span className="font-black text-gray-800">{value}</span>
    </div>
  );
}

// 보조 컴포넌트: 조건 박스
function ConditionBox({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
      <div className="text-sm font-black text-gray-800">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-500">{description}</div>
    </div>
  );
}

// 보조 컴포넌트: 필드 라벨
function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold text-gray-500">{label}</div>
      {children}
    </label>
  );
}
