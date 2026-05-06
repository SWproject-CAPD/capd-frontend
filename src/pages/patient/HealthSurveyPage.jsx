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

const surveyQuestions = [
  { id: 'q1', type: 'yesno', text: '최근 1주일 내에 투석액이 평소보다 심하게 탁하거나 피가 섞여 나온 적이 있습니까?', required: true },
  { id: 'q2', type: 'yesno', text: '최근 발열(37.5도 이상)이나 오한 증상이 있었습니까?', required: true },
  {
    id: 'q3',
    type: 'scale',
    text: '최근 일주일 동안 느끼는 전반적인 피로도는 어느 정도인가요?',
    options: [
      { value: 1, label: '아주 좋음' },
      { value: 2, label: '좋은 편' },
      { value: 3, label: '보통' },
      { value: 4, label: '피로함' },
      { value: 5, label: '매우 피로함' },
    ],
    required: true,
  },
  {
    id: 'q4',
    type: 'scale',
    text: '투석 시 복부 통증이나 불편함의 정도는 어떠신가요?',
    options: [
      { value: 1, label: '전혀 없음' },
      { value: 2, label: '약간 있음' },
      { value: 3, label: '보통' },
      { value: 4, label: '심한 편' },
      { value: 5, label: '매우 심함' },
    ],
    required: true,
  },
  { id: 'q5', type: 'short', text: '최근 3일 동안 측정한 체중 중 가장 높았던 체중을 적어주세요. (단위: kg)', placeholder: '예: 65.5', required: true },
];

export default function HealthSurveyPage() {
  const navigate = useNavigate();
  const assignedDoctorName = mockDoctorAssignments[MOCK_CURRENT_PATIENT_ID];
  const hasAssignedDoctor = Boolean(assignedDoctorName);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [answers, setAnswers] = useState({});

  const canUseSurvey = hasAssignedDoctor || previewEnabled;
  const answeredCount = surveyQuestions.filter(question => answers[question.id] !== undefined && answers[question.id] !== '').length;
  const isAllAnswered = answeredCount === surveyQuestions.length;

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllAnswered) return;

    console.log('제출된 설문 데이터:', answers);
    alert('설문이 성공적으로 담당 의료진에게 전달되었습니다.\n작성에 협조해 주셔서 감사합니다.');
    navigate('/patient');
  };

  if (!canUseSurvey) {
    return (
      <div className="mx-auto max-w-3xl pb-24 animate-in fade-in duration-500">
        <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
            !
          </div>
          <h1 className="text-2xl font-black text-slate-900">담당의 배정 후 이용할 수 있습니다</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            건강 설문은 담당 의료진이 환자 상태를 확인하기 위해 사용하는 기능입니다.<br />
            담당의가 배정되면 설문 작성이 가능해집니다.
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
    <div className="mx-auto max-w-4xl pb-24 animate-in fade-in duration-500">
      <section className="mb-5 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-600">방문 전 확인</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 md:text-3xl">건강 설문 조사</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              현재 느끼시는 증상을 있는 그대로 선택해 주세요.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
            <div className="text-[11px] font-black text-emerald-600">진행률</div>
            <div className="mt-1 text-xl font-black text-emerald-700">{answeredCount}/{surveyQuestions.length}</div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {surveyQuestions.map((question, index) => (
          <section key={question.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                {index + 1}
              </span>
              <h2 className="text-base font-black leading-relaxed text-slate-900 md:text-lg">
                {question.text}
                {question.required && <span className="ml-1 text-red-500">*</span>}
              </h2>
            </div>

            {question.type === 'yesno' && (
              <div className="grid grid-cols-2 gap-3">
                {['예', '아니오'].map(value => (
                  <ChoiceButton key={value} active={answers[question.id] === value} onClick={() => handleAnswer(question.id, value)}>
                    {value}
                  </ChoiceButton>
                ))}
              </div>
            )}

            {question.type === 'scale' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                {question.options.map(option => (
                  <ChoiceButton key={option.value} active={answers[question.id] === option.value} onClick={() => handleAnswer(question.id, option.value)}>
                    {option.label}
                  </ChoiceButton>
                ))}
              </div>
            )}

            {question.type === 'short' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder={question.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            )}
          </section>
        ))}

        <button
          type="submit"
          disabled={!isAllAnswered}
          className={`sticky bottom-20 z-20 w-full rounded-2xl py-5 text-lg font-black shadow-lg transition-all md:static ${
            isAllAnswered
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400'
          }`}
        >
          {isAllAnswered ? '의료진에게 제출하기' : '모든 문항에 답변해 주세요'}
        </button>
      </form>
    </div>
  );
}

function ChoiceButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-14 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
          : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/60'
      }`}
    >
      {children}
    </button>
  );
}
