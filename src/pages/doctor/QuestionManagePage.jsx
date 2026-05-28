import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';
import { surveyApi } from '../../api/apiClient';
import { toDateKey } from '../../api/adapters';
import { useDoctorPatientProfile, useDoctorQuestions, useDoctorReservationsByDate } from '../../hooks/usePatientData';

export default function QuestionManagePage() {
  const { id } = useParams();
  const patientId = Number(id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [activeTab, setActiveTab] = useState('PENDING');
  const { data: patient } = useDoctorPatientProfile(id);
  const { data: reservations = [] } = useDoctorReservationsByDate(selectedDate);
  const patientReservation = reservations.find(reservation => Number(reservation.patientId) === patientId);
  const reservationId = patientReservation?.reservationId;
  const { data: questions = [], reload } = useDoctorQuestions(reservationId);

  const counts = {
    PENDING: questions.filter(question => question.status === 'PENDING').length,
    APPROVED: questions.filter(question => question.status === 'APPROVED').length,
    REJECTED: questions.filter(question => question.status === 'REJECTED').length,
  };

  const filteredQuestions = useMemo(() => (
    questions.filter(question => (question.status || 'PENDING') === activeTab)
  ), [questions, activeTab]);

  const handleGenerateQuestion = async () => {
    if (!reservationId) {
      alert('선택한 날짜에 해당 환자 예약이 없습니다.');
      return;
    }

    try {
      await surveyApi.createQuestion(reservationId);
      await reload();
      setActiveTab('PENDING');
    } catch (error) {
      alert(error.message || '질문 생성에 실패했습니다.');
    }
  };

  const handleUpdateStatus = async (questionId, action) => {
    try {
      if (action === 'APPROVED') await surveyApi.approveQuestion(questionId);
      if (action === 'REJECTED') await surveyApi.rejectQuestion(questionId);
      if (action === 'PENDING') await surveyApi.resetQuestion(questionId);
      await reload();
    } catch (error) {
      alert(error.message || '질문 상태 변경에 실패했습니다.');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500 md:p-6">
      <div className="mb-5 shrink-0">
        <BackToPatientButton />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
              <span className="rounded-xl bg-blue-100 p-2 text-xl text-blue-600">📋</span>
              AI 설문 승인 및 관리
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              <span className="font-bold text-blue-600">{patient?.name || '환자'}</span> 환자의 예약별 AI 추천 질문입니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleGenerateQuestion}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 md:w-auto"
            >
              질문 생성하기
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="flex min-h-0 flex-col gap-4 xl:col-span-3 overflow-y-auto custom-scrollbar pr-1">
          <Card className="border-none p-5 shadow-sm shrink-0">
            <h3 className="mb-4 text-sm font-black text-gray-800">환자 요약</h3>
            <div className="space-y-1">
              <InfoRow label="환자명" value={patient?.name || '-'} />
              <InfoRow label="환자번호" value={patient?.id || '-'} />
              <InfoRow label="성별/나이" value={patient ? `${patient.sex} / ${patient.age}세` : '-'} />
              <InfoRow label="전화번호" value={patient?.phone || '-'} />
              <InfoRow label="예약번호" value={reservationId || '-'} />
            </div>
          </Card>

          <Card className="border-none p-5 shadow-sm shrink-0">
            <h3 className="mb-4 text-sm font-black text-gray-800">설문 처리 현황</h3>
            <div className="flex flex-col gap-3">
              <StatusBox label="승인 대기" value={`${counts.PENDING}건`} tone="blue" />
              <StatusBox label="승인 완료" value={`${counts.APPROVED}건`} tone="emerald" />
              <StatusBox label="거절됨" value={`${counts.REJECTED}건`} tone="rose" />
            </div>
          </Card>
        </aside>

        <main className="flex min-h-0 flex-col xl:col-span-9">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-4 pt-4">
              <div className="flex gap-6">
                <TabButton active={activeTab === 'PENDING'} onClick={() => setActiveTab('PENDING')} color="blue">
                  승인 대기 ({counts.PENDING})
                </TabButton>
                <TabButton active={activeTab === 'APPROVED'} onClick={() => setActiveTab('APPROVED')} color="emerald">
                  승인 완료 ({counts.APPROVED})
                </TabButton>
                <TabButton active={activeTab === 'REJECTED'} onClick={() => setActiveTab('REJECTED')} color="rose">
                  거절됨 ({counts.REJECTED})
                </TabButton>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
              {!reservationId ? (
                <EmptyState text="선택한 날짜에 해당 환자의 예약이 없습니다." />
              ) : filteredQuestions.length === 0 ? (
                <EmptyState text="해당하는 질문이 없습니다." />
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredQuestions.map((question) => (
                    <div key={question.questionId} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-lg bg-purple-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-purple-700">
                          {question.type || 'QUESTION'}
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                          {question.status || 'PENDING'}
                        </span>
                      </div>

                      <div className="mb-5">
                        <h2 className="text-lg font-black text-gray-900 mb-3">Q. {question.text}</h2>
                        {question.options.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {question.options.map((option) => (
                              <div key={option} className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {question.reason && (
                        <div className="mb-5 rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4">
                          <h4 className="mb-1 flex items-center gap-1.5 text-xs font-black text-blue-800">
                            <span className="text-sm">AI</span> AI 추천 이유
                          </h4>
                          <p className="text-sm font-medium text-blue-900/80 leading-relaxed">
                            {question.reason}
                          </p>
                        </div>
                      )}

                      {activeTab === 'PENDING' && (
                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                          <button onClick={() => handleUpdateStatus(question.questionId, 'REJECTED')} className="rounded-xl px-5 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50">
                            거절하기
                          </button>
                          <button onClick={() => handleUpdateStatus(question.questionId, 'APPROVED')} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95">
                            승인하기
                          </button>
                        </div>
                      )}

                      {activeTab !== 'PENDING' && (
                        <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                          <button onClick={() => handleUpdateStatus(question.questionId, 'PENDING')} className="text-xs font-bold text-gray-400 underline underline-offset-2 hover:text-gray-600">
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2.5 text-sm last:border-b-0 last:pb-0">
      <span className="font-bold text-gray-400">{label}</span>
      <span className="font-black text-gray-800">{value}</span>
    </div>
  );
}

function StatusBox({ label, value, tone }) {
  const classes = {
    blue: 'bg-blue-50 text-blue-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    rose: 'bg-rose-50 text-rose-800',
  };

  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${classes[tone]}`}>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, color, children }) {
  const activeClass = {
    blue: 'border-blue-600 text-blue-600',
    emerald: 'border-emerald-600 text-emerald-600',
    rose: 'border-rose-600 text-rose-600',
  }[color];

  return (
    <button onClick={onClick} className={`border-b-2 pb-3 text-sm font-bold transition-colors ${active ? activeClass : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 text-4xl">📭</div>
      <h3 className="text-lg font-bold text-gray-800">{text}</h3>
    </div>
  );
}
