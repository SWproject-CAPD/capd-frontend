import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';

const surveyData = {
  before: {
    title: '응답 전 설문',
    submittedAt: '2026-05-08 08:40',
    answers: [
      {
        question: '최근 1주일 내에 투석액이 평소보다 심하게 탁하거나 피가 섞여 나온 적이 있습니까?',
        options: ['예', '아니오'],
        answer: '예',
      },
      {
        question: '최근 발열(37.5도 이상)이나 오한 증상이 있었습니까?',
        options: ['예', '아니오'],
        answer: '아니오',
      },
      {
        question: '최근 일주일 동안 느끼는 전반적인 피로도는 어느 정도인가요?',
        options: ['아주 좋음', '좋은 편', '보통', '피로함', '매우 피로함'],
        answer: '매우 피로함',
      },
      {
        question: '투석 시 복부 통증이나 불편함의 정도는 어떠신가요?',
        options: ['전혀 없음', '약간 있음', '보통', '심한 편', '매우 심함'],
        answer: '심한 편',
      },
      {
        question: '최근 3일 동안 측정한 체중 중 가장 높았던 체중을 적어주세요. (단위: kg)',
        options: [],
        answer: '66.4',
      },
    ],
  },
  after: {
    title: '응답 후 설문',
    submittedAt: '2026-05-08 09:10',
    answers: [
      {
        question: '어제 처방받은 혈압약은 제시간에 복용하셨나요?',
        options: ['예', '아니오'],
        answer: '예',
      },
      {
        question: '어제 저녁 식사로 주로 어떤 종류의 음식을 드셨나요?',
        options: ['국물류', '튀김/볶음류', '육류 구이', '채소 위주의 식단', '기타'],
        answer: '국물류',
      },
      {
        question: '최근 3일간 발목이나 얼굴에 붓기가 느껴지셨나요?',
        options: ['예', '아니오'],
        answer: '아니오',
      },
    ],
  },
};

export default function QuestionCheckPage() {
  const { id } = useParams();
  const patient = patientsData.find(p => p.id === id) || patientsData[0];
  const [activeTab, setActiveTab] = useState('before');

  const currentSurvey = surveyData[activeTab];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500 md:p-6">
      <div className="mb-5 shrink-0">
        <BackToPatientButton />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
              <span className="rounded-xl bg-blue-100 p-2 text-xl text-blue-600">✓</span>
              설문 응답 확인
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500">
              <span className="font-bold text-blue-600">{patient.name}</span> 환자의 응답 전/후 설문 답변입니다.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 md:w-auto">
            <HeaderStat label="응답 전" value={`${surveyData.before.answers.length}문항`} color="blue" />
            <HeaderStat label="응답 후" value={`${surveyData.after.answers.length}문항`} color="emerald" />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar xl:col-span-3">
          <Card className="shrink-0 border-none p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-gray-800">환자 요약</h3>
            <div className="space-y-1">
              <InfoRow label="환자명" value={patient.name} />
              <InfoRow label="환자번호" value={patient.id} />
              <InfoRow label="성별/나이" value={`${patient.sex} / ${patient.age}세`} />
              <InfoRow label="CAPD 시작일" value={patient.capdStartDate} />
              <InfoRow label="담당의" value={patient.doctor} />
            </div>
          </Card>

          <Card className="shrink-0 border-none p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-gray-800">설문 구분</h3>
            <div className="flex flex-col gap-3">
              <SurveyTypeButton
                active={activeTab === 'before'}
                title="응답 전 설문"
                count={surveyData.before.answers.length}
                color="blue"
                onClick={() => setActiveTab('before')}
              />
              <SurveyTypeButton
                active={activeTab === 'after'}
                title="응답 후 설문"
                count={surveyData.after.answers.length}
                color="emerald"
                onClick={() => setActiveTab('after')}
              />
            </div>
          </Card>
        </aside>

        <main className="flex min-h-0 flex-col xl:col-span-9">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-4 pt-4">
              <div className="flex gap-6">
                <TabButton
                  active={activeTab === 'before'}
                  onClick={() => setActiveTab('before')}
                  color="blue"
                >
                  응답 전 설문
                </TabButton>
                <TabButton
                  active={activeTab === 'after'}
                  onClick={() => setActiveTab('after')}
                  color="emerald"
                >
                  응답 후 설문
                </TabButton>
              </div>
            </div>

            <div className="shrink-0 border-b border-gray-100 bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${
                    activeTab === 'before' ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    SURVEY RESPONSE
                  </div>
                  <h2 className="mt-1 text-lg font-black text-gray-900">
                    {currentSurvey.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-gray-400">
                    {currentSurvey.submittedAt}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  activeTab === 'before'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {currentSurvey.answers.length}문항
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 custom-scrollbar md:p-6">
              <div className="flex flex-col gap-4">
                {currentSurvey.answers.map((item, index) => (
                  <div
                    key={`${activeTab}-${index}`}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        activeTab === 'before'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {index + 1}
                      </span>
                      <h3 className="text-base font-black leading-relaxed text-gray-900">
                        {item.question}
                      </h3>
                    </div>

                    {item.options.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.options.map(option => {
                          const selected = option === item.answer;

                          return (
                            <div
                              key={option}
                              className={`rounded-xl border px-3 py-2 text-xs font-black ${
                                selected
                                  ? activeTab === 'before'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                    : 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                  : 'border-gray-200 bg-slate-50 text-gray-500'
                              }`}
                            >
                              {option}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`rounded-xl border px-4 py-3 text-sm font-black ${
                        activeTab === 'before'
                          ? 'border-blue-100 bg-blue-50 text-blue-700'
                          : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      }`}>
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

function HeaderStat({ label, value, color }) {
  const styles = {
    blue: 'border-blue-100 bg-blue-50 text-blue-800',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  };

  const valueStyles = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-right shadow-sm ${styles[color]}`}>
      <div className="text-[10px] font-black">{label}</div>
      <div className={`mt-1 text-lg font-black ${valueStyles[color]}`}>{value}</div>
    </div>
  );
}

function SurveyTypeButton({ active, title, count, color, onClick }) {
  const styles = {
    blue: {
      active: 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm',
      idle: 'border-blue-100 bg-blue-50/60 text-blue-700 hover:bg-blue-50',
      count: 'text-blue-600',
    },
    emerald: {
      active: 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm',
      idle: 'border-emerald-100 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50',
      count: 'text-emerald-600',
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-all ${
        active ? styles[color].active : styles[color].idle
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black">{title}</span>
        <span className={`text-lg font-black ${styles[color].count}`}>
          {count}
        </span>
      </div>
    </button>
  );
}

function TabButton({ active, onClick, color, children }) {
  const activeStyles = {
    blue: 'border-blue-600 text-blue-600',
    emerald: 'border-emerald-600 text-emerald-600',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
        active
          ? activeStyles[color]
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
