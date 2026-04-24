import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HealthSurveyPage() {
  const navigate = useNavigate();

  // 의사가 작성한 가상의 설문 데이터 (추후 백엔드 API에서 받아올 데이터)
  const surveyQuestions = [
    {
      id: 'q1',
      type: 'yesno',
      text: '최근 1주일 내에 투석액이 평소보다 심하게 탁하거나 피가 섞여 나온 적이 있습니까?',
      required: true,
    },
    {
      id: 'q2',
      type: 'yesno',
      text: '최근 발열(37.5도 이상)이나 오한 증상이 있었습니까?',
      required: true,
    },
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
    {
      id: 'q5',
      type: 'short',
      text: '최근 3일 동안 측정한 체중 중 가장 높았던 체중을 적어주세요. (단위: kg)',
      placeholder: '예: 65.5',
      required: true,
    }
  ];

  //  환자의 답변 상태 관리
  const [answers, setAnswers] = useState({});

  // 답변 선택/입력 핸들러
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // 모든 필수 질문에 답했는지 확인
  const isAllAnswered = surveyQuestions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');

  //  설문 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAllAnswered) return;

    // TODO: 백엔드 API로 answers 데이터 전송
    console.log('제출된 설문 데이터:', answers);
    
    alert('설문이 성공적으로 담당 의료진에게 전달되었습니다.\n작성에 협조해 주셔서 감사합니다.');
    navigate('/patient'); // 제출 후 홈으로 이동
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* 상단 타이틀 영역 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">건강 설문 조사</h1>
        <p className="text-gray-500 mt-2 font-medium leading-relaxed">
          담당 의료진이 환자분의 현재 상태를 정확히 파악하기 위한 설문입니다.<br className="hidden md:block"/>
          현재 느끼시는 증상을 있는 그대로 솔직하게 답변해 주세요.
        </p>
      </div>

      {/* 설문 문항 목록 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {surveyQuestions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            {/* 질문 텍스트 */}
            <div className="flex gap-3 mb-6">
              <span className="shrink-0 w-8 h-8 bg-emerald-50 text-emerald-600 font-black rounded-xl flex items-center justify-center">
                {index + 1}
              </span>
              <h2 className="text-lg font-bold text-gray-800 leading-snug mt-0.5">
                {q.text}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </h2>
            </div>

            {/* 답변 영역 - 질문 타입별 렌더링 */}
            <div className="pl-0 md:pl-11">
              
              {/* Type 1: 예 / 아니오 */}
              {q.type === 'yesno' && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, '예')}
                    className={`flex-1 py-4 rounded-xl font-bold transition-all border-2 ${
                      answers[q.id] === '예' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    예
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(q.id, '아니오')}
                    className={`flex-1 py-4 rounded-xl font-bold transition-all border-2 ${
                      answers[q.id] === '아니오' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    아니오
                  </button>
                </div>
              )}

              {/* Type 2: 5지선다형 (스케일) */}
              {q.type === 'scale' && (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleAnswer(q.id, opt.value)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl font-bold transition-all border-2 ${
                        answers[q.id] === opt.value
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {/* 선택된 항목에 체크 아이콘 표시 */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                        answers[q.id] === opt.value ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                      }`}>
                        {answers[q.id] === opt.value && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Type 3: 단답형 / 수치 입력 */}
              {q.type === 'short' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full bg-slate-50 border border-gray-200 text-gray-900 rounded-xl px-5 py-4 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder-gray-400"
                />
              )}
            </div>
          </div>
        ))}

        {/* 하단 제출 버튼 영역 */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={!isAllAnswered}
            className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
              isAllAnswered 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAllAnswered ? (
              <>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                의료진에게 제출하기
              </>
            ) : (
              '모든 문항에 답변해 주세요'
            )}
          </button>
        </div>
      </form>
      
    </div>
  );
}