import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../../api/apiClient';
import { getUpcomingReservation, usePatientAnswers, usePatientQuestions, usePatientReservations } from '../../hooks/usePatientData';

const SURVEY_DEADLINE_MESSAGE = '예약 전날까지만 작성 가능합니다.';
const SUBMITTED_SURVEY_MESSAGE = '이미 제출한 설문입니다. 아래에서 제출했던 답변을 확인할 수 있습니다.';

export default function HealthSurveyPage() {
  const navigate = useNavigate();
  const { data: reservations = [], isLoading: isReservationsLoading } = usePatientReservations();
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const writableReservations = useMemo(() => (
    reservations.filter(reservation => isBeforeAppointmentDate(reservation.date))
  ), [reservations]);
  const fallbackReservation = getUpcomingReservation(reservations);
  const activeReservation = useMemo(() => (
    reservations.find(reservation => String(reservation.reservationId) === String(selectedReservationId)) ||
    writableReservations[0] ||
    fallbackReservation ||
    reservations[0]
  ), [fallbackReservation, reservations, selectedReservationId, writableReservations]);
  const { data: surveyQuestions = [], isLoading: isQuestionsLoading, reload } = usePatientQuestions(activeReservation?.reservationId);
  const { data: submittedAnswers = [], reload: reloadSubmittedAnswers } = usePatientAnswers(activeReservation?.reservationId);

  const [answersByReservationId, setAnswersByReservationId] = useState({});
  const [openHelpQuestionId, setOpenHelpQuestionId] = useState(null);
  const [helpTextByQuestionId, setHelpTextByQuestionId] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyStatusByReservationId, setSurveyStatusByReservationId] = useState({});

  const activeReservationKey = String(activeReservation?.reservationId || '');
  const draftAnswers = answersByReservationId[activeReservationKey] || {};
  const questionAnswerMap = useMemo(() => (
    surveyQuestions.reduce((acc, question) => {
      const submittedValue = question.answer || '';

      if ((question.answered || submittedValue) && question.questionId) {
        acc[String(question.questionId)] = submittedValue;
      }

      if ((question.answered || submittedValue) && question.text) {
        acc[`question:${question.text}`] = submittedValue;
      }

      return acc;
    }, {})
  ), [surveyQuestions]);
  const submittedAnswerMap = useMemo(() => (
    submittedAnswers.reduce((acc, answer) => {
      const submittedValue = answer.answer || '';

      if (answer.questionId) acc[String(answer.questionId)] = submittedValue;
      if (answer.question) acc[`question:${answer.question}`] = submittedValue;

      return acc;
    }, { ...questionAnswerMap })
  ), [questionAnswerMap, submittedAnswers]);
  const hasSubmittedSurvey = submittedAnswers.length > 0 || surveyQuestions.some(question => question.answered || question.answer);
  const visibleAnswers = hasSubmittedSurvey ? submittedAnswerMap : draftAnswers;
  const canWriteSurvey = isBeforeAppointmentDate(activeReservation?.date);
  const isSurveyDisabled = !canWriteSurvey || hasSubmittedSurvey;
  const answeredCount = surveyQuestions.filter(question => (
    getVisibleAnswer(question, visibleAnswers) !== undefined &&
    getVisibleAnswer(question, visibleAnswers) !== ''
  )).length;
  const isAllAnswered = surveyQuestions.length > 0 && answeredCount === surveyQuestions.length;
  const canSubmitSurvey = isAllAnswered && canWriteSurvey && !hasSubmittedSurvey;

  useEffect(() => {
    let ignore = false;

    const loadSurveyStatuses = async () => {
      if (reservations.length === 0) {
        setSurveyStatusByReservationId({});
        return;
      }

      const entries = await Promise.all(reservations.map(async (reservation) => {
        const reservationId = reservation.reservationId;

        if (!isBeforeAppointmentDate(reservation.date)) {
          return [String(reservationId), 'closed'];
        }

        try {
          const [questions, answers] = await Promise.all([
            surveyApi.getPatientQuestions(reservationId).catch(emptyOnNotFound),
            surveyApi.getPatientAnswers(reservationId).catch(emptyOnNotFound),
          ]);
          const hasAnswers = (
            (answers || []).length > 0 ||
            (questions || []).some(question => question.answered || question.answer)
          );

          return [String(reservationId), hasAnswers ? 'submitted' : 'available'];
        } catch {
          return [String(reservationId), 'available'];
        }
      }));

      if (!ignore) {
        setSurveyStatusByReservationId(Object.fromEntries(entries));
      }
    };

    void loadSurveyStatuses();

    return () => {
      ignore = true;
    };
  }, [reservations]);

  const headerMessage = useMemo(() => {
    if (isReservationsLoading || isQuestionsLoading) return '설문 정보를 불러오는 중입니다.';
    if (!activeReservation) return '예정된 예약이 없어 작성할 설문이 없습니다.';
    if (hasSubmittedSurvey) return SUBMITTED_SURVEY_MESSAGE;
    if (!canWriteSurvey) return '예약일이 지나 설문을 작성할 수 없습니다.';
    if (surveyQuestions.length === 0) return '현재 승인된 설문 문항이 없습니다.';
    return `현재 느끼는 증상을 있는 그대로 선택해 주세요. ${SURVEY_DEADLINE_MESSAGE}`;
  }, [activeReservation, canWriteSurvey, hasSubmittedSurvey, isQuestionsLoading, isReservationsLoading, surveyQuestions.length]);

  const handleAnswer = (questionId, value) => {
    if (isSurveyDisabled || !activeReservationKey) return;

    setAnswersByReservationId(prev => ({
      ...prev,
      [activeReservationKey]: {
        ...(prev[activeReservationKey] || {}),
        [String(questionId)]: value,
      },
    }));
  };

  const handleQuestionHelpClick = async (questionId) => {
    setOpenHelpQuestionId(prev => (prev === questionId ? null : questionId));

    if (helpTextByQuestionId[questionId]) return;

    try {
      const helpText = await surveyApi.explainQuestion(questionId);
      setHelpTextByQuestionId(prev => ({ ...prev, [questionId]: helpText }));
    } catch (error) {
      setHelpTextByQuestionId(prev => ({ ...prev, [questionId]: error.message || '질문 설명을 불러오지 못했습니다.' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitSurvey || !activeReservation) return;

    setIsSubmitting(true);

    try {
      await surveyApi.submitAnswers(activeReservation.reservationId, {
        answers: surveyQuestions.map(question => ({
          questionId: Number(question.questionId),
          answer: String(draftAnswers[String(question.questionId)]),
        })),
      });

      alert('설문이 성공적으로 담당 의료진에게 전달되었습니다.\n작성한 내용은 이 화면에서 다시 확인할 수 있습니다.');
      await reload();
      await reloadSubmittedAnswers();
      setSurveyStatusByReservationId(prev => ({
        ...prev,
        [String(activeReservation.reservationId)]: 'submitted',
      }));
    } catch (error) {
      alert(error.message || '설문 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeReservation && !isReservationsLoading) {
    return (
      <div className="mx-auto max-w-3xl pb-24 animate-in fade-in duration-500">
        <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
            !
          </div>
          <h1 className="text-2xl font-black text-slate-900">예정된 예약이 없습니다</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            건강 설문은 예약과 연결된 승인 질문을 기준으로 작성할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
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
              {headerMessage}
            </p>
            {activeReservation && (
              <p className="mt-1 text-xs font-bold text-emerald-600">
                예약: {activeReservation.date} {activeReservation.time} · {activeReservation.doctorName} 선생님
              </p>
            )}
            {reservations.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {reservations.map(reservation => {
                  const isActive = String(reservation.reservationId) === String(activeReservation?.reservationId);
                  const surveyStatus = getReservationSurveyStatus(
                    reservation,
                    surveyStatusByReservationId[String(reservation.reservationId)],
                  );

                  return (
                    <button
                      key={reservation.reservationId}
                      type="button"
                      onClick={() => {
                        setSelectedReservationId(reservation.reservationId);
                        setOpenHelpQuestionId(null);
                      }}
                      className={`rounded-2xl border px-4 py-2 text-left text-xs font-black transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="block">{reservation.date} {reservation.time}</span>
                      <span className={`mt-0.5 block text-[10px] ${surveyStatus.className}`}>
                        {surveyStatus.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center">
            <div className="text-[11px] font-black text-emerald-600">진행률</div>
            <div className="mt-1 text-xl font-black text-emerald-700">{answeredCount}/{surveyQuestions.length}</div>
          </div>
        </div>
      </section>

      {!canWriteSurvey && !hasSubmittedSurvey ? (
        <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
            !
          </div>
          <h2 className="text-2xl font-black text-slate-900">질문 마감되었습니다</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            이 예약 건의 설문 작성 기간이 지나 더 이상 답변할 수 없습니다.
          </p>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          title={hasSubmittedSurvey ? SUBMITTED_SURVEY_MESSAGE : isSurveyDisabled ? SURVEY_DEADLINE_MESSAGE : undefined}
        >
          {hasSubmittedSurvey && (
            <section className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-emerald-700">
                  ✓
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">이미 답변한 설문입니다</h2>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-emerald-700">
                    제출했던 답변을 아래에서 확인할 수 있습니다. 이미 제출한 설문은 다시 수정할 수 없습니다.
                  </p>
                </div>
              </div>
            </section>
          )}
          {surveyQuestions.map((question, index) => {
          const isHelpOpen = openHelpQuestionId === question.questionId;
          const answerValue = getVisibleAnswer(question, visibleAnswers) || '';

          return (
            <section key={question.questionId} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <h2 className="text-base font-black leading-relaxed text-slate-900 md:text-lg">
                    {question.text}
                    <span className="ml-1 text-red-500">*</span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuestionHelpClick(question.questionId)}
                  title="질문을 쉽게 설명해드려요"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-black transition-all active:scale-95 ${
                    isHelpOpen
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  ?
                </button>
              </div>

              {isHelpOpen && (
                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="mb-1 text-[11px] font-black text-emerald-600">질문 쉬운 설명</div>
                  <p className="text-sm font-medium leading-relaxed text-emerald-800">
                    {helpTextByQuestionId[question.questionId] || '질문 설명을 불러오는 중입니다.'}
                  </p>
                </div>
              )}

              {question.options.length > 0 ? (
                <div className={`grid grid-cols-1 gap-2 ${question.options.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-5'}`}>
                  {question.options.map(option => (
                    <ChoiceButton
                      key={option}
                      active={answerValue === option}
                      disabled={isSurveyDisabled}
                      title={hasSubmittedSurvey ? SUBMITTED_SURVEY_MESSAGE : isSurveyDisabled ? SURVEY_DEADLINE_MESSAGE : undefined}
                      onClick={() => handleAnswer(question.questionId, option)}
                    >
                      {option}
                    </ChoiceButton>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answerValue}
                  onChange={(e) => handleAnswer(question.questionId, e.target.value)}
                  placeholder="응답을 입력해주세요"
                  disabled={isSurveyDisabled}
                  title={hasSubmittedSurvey ? SUBMITTED_SURVEY_MESSAGE : isSurveyDisabled ? SURVEY_DEADLINE_MESSAGE : undefined}
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold outline-none transition-all ${
                    isSurveyDisabled
                      ? 'cursor-not-allowed text-slate-500'
                      : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
              )}

            </section>
          );
        })}

        <button
          type="submit"
          disabled={!canSubmitSurvey || isSubmitting}
          title={hasSubmittedSurvey ? SUBMITTED_SURVEY_MESSAGE : isSurveyDisabled ? SURVEY_DEADLINE_MESSAGE : undefined}
          className={`sticky bottom-20 z-20 w-full rounded-2xl py-5 text-lg font-black shadow-lg transition-all md:static ${
            canSubmitSurvey
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400'
          } ${isSurveyDisabled ? 'cursor-not-allowed' : ''}`}
        >
          {isSubmitting
            ? '제출 중입니다'
            : hasSubmittedSurvey
              ? '제출 완료'
              : isSurveyDisabled
              ? '예약 전날까지만 작성 가능합니다'
              : isAllAnswered
                ? '의료진에게 제출하기'
                : '모든 문항에 응답해 주세요'}
        </button>
        </form>
      )}
    </div>
  );
}

function ChoiceButton({ active, disabled, title, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`min-h-14 rounded-2xl border px-4 py-3 text-sm font-black transition-all ${
        disabled
          ? active
            ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400'
          : active
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
            : 'border-slate-100 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/60'
      }`}
    >
      {children}
    </button>
  );
}

function getVisibleAnswer(question, answers) {
  const keys = [
    String(question.questionId),
    String(question.id),
    `question:${question.text}`,
    `question:${question.question}`,
  ];

  return keys.reduce((foundAnswer, key) => (
    foundAnswer !== undefined ? foundAnswer : answers[key]
  ), undefined);
}

function isBeforeAppointmentDate(appointmentDate) {
  if (!appointmentDate || appointmentDate === '-') return false;

  const today = new Date();
  const appointment = new Date(`${appointmentDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);
  appointment.setHours(0, 0, 0, 0);

  return today < appointment;
}

function getReservationSurveyStatus(reservation, storedStatus) {
  if (!isBeforeAppointmentDate(reservation.date)) {
    return {
      key: 'closed',
      label: '작성 마감',
      className: 'text-slate-400',
    };
  }

  if (storedStatus === 'submitted') {
    return {
      key: 'submitted',
      label: '작성 완료',
      className: 'text-blue-500',
    };
  }

  return {
    key: 'available',
    label: '작성 가능',
    className: 'text-emerald-500',
  };
}

function emptyOnNotFound(error) {
  if (error.status === 404) return [];
  throw error;
}
