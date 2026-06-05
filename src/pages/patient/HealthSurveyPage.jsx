import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyApi } from '../../api/apiClient';
import { getUpcomingReservation, usePatientAnswers, usePatientQuestions, usePatientReservations } from '../../hooks/usePatientData';

const SURVEY_DEADLINE_MESSAGE = '예약 전날까지만 작성 가능합니다.';
const SUBMITTED_QUESTION_MESSAGE = '이미 답변한 질문입니다. 제출했던 답변을 확인할 수 있습니다.';

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
  const draftAnswers = useMemo(
    () => answersByReservationId[activeReservationKey] || {},
    [activeReservationKey, answersByReservationId],
  );
  const submittedAnswerMap = useMemo(
    () => buildSubmittedAnswerMap(surveyQuestions, submittedAnswers),
    [submittedAnswers, surveyQuestions],
  );
  const visibleAnswers = useMemo(
    () => ({ ...submittedAnswerMap, ...draftAnswers }),
    [draftAnswers, submittedAnswerMap],
  );
  const canWriteSurvey = isBeforeAppointmentDate(activeReservation?.date);
  const pendingQuestions = useMemo(
    () => surveyQuestions.filter(question => !isQuestionAlreadyAnswered(question, submittedAnswerMap)),
    [submittedAnswerMap, surveyQuestions],
  );
  const submittedQuestionCount = surveyQuestions.length - pendingQuestions.length;
  const answeredCount = surveyQuestions.filter(question => (
    isQuestionAlreadyAnswered(question, submittedAnswerMap) ||
    hasNonEmptyVisibleAnswer(question, visibleAnswers)
  )).length;
  const pendingAnsweredCount = pendingQuestions.filter(question => (
    hasNonEmptyVisibleAnswer(question, visibleAnswers)
  )).length;
  const hasAnsweredQuestions = submittedQuestionCount > 0;
  const hasPendingQuestions = pendingQuestions.length > 0;
  const isSurveyComplete = surveyQuestions.length > 0 && !hasPendingQuestions;
  const canSubmitSurvey = canWriteSurvey && hasPendingQuestions && pendingAnsweredCount === pendingQuestions.length;

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

          return [String(reservationId), getSurveyCompletionState(questions || [], answers || [])];
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
    if (surveyQuestions.length === 0) return '현재 승인된 설문 문항이 없습니다.';
    if (!canWriteSurvey) return '예약일이 지나 설문을 작성할 수 없습니다. 문항과 기존 답변은 확인할 수 있습니다.';
    if (isSurveyComplete) return '이미 답변한 설문입니다. 제출했던 답변을 아래에서 확인할 수 있습니다.';
    if (hasAnsweredQuestions) return '이미 답변한 질문과 새 질문이 함께 있습니다. 답변하지 않은 질문만 추가로 작성해 주세요.';
    return `현재 겪는 증상이 있는 그대로 답변해 주세요. ${SURVEY_DEADLINE_MESSAGE}`;
  }, [
    activeReservation,
    canWriteSurvey,
    hasAnsweredQuestions,
    isQuestionsLoading,
    isReservationsLoading,
    isSurveyComplete,
    surveyQuestions.length,
  ]);

  const handleAnswer = (question, value) => {
    if (!canWriteSurvey || !activeReservationKey || isQuestionAlreadyAnswered(question, submittedAnswerMap)) return;

    setAnswersByReservationId(prev => ({
      ...prev,
      [activeReservationKey]: {
        ...(prev[activeReservationKey] || {}),
        [String(question.questionId)]: value,
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
        answers: pendingQuestions.map(question => ({
          questionId: Number(question.questionId),
          answer: String(draftAnswers[String(question.questionId)]),
        })),
      });

      alert('답변이 성공적으로 담당 의료진에게 전달되었습니다.\n작성한 내용은 이 화면에서 다시 확인할 수 있습니다.');
      await reload();
      await reloadSubmittedAnswers();
      setAnswersByReservationId(prev => ({
        ...prev,
        [activeReservationKey]: {},
      }));
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

      {surveyQuestions.length === 0 && !isQuestionsLoading ? (
        <section className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl font-black text-slate-500">
            !
          </div>
          <h2 className="text-2xl font-black text-slate-900">작성할 질문이 없습니다</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
            아직 의료진이 승인한 설문 문항이 없습니다.
          </p>
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {hasAnsweredQuestions && (
            <section className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-emerald-700">
                  ✓
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {hasPendingQuestions ? '일부 질문은 이미 답변했습니다' : '이미 답변한 설문입니다'}
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-emerald-700">
                    답변한 질문은 수정할 수 없고, 새로 추가된 미답변 질문만 작성할 수 있습니다.
                  </p>
                </div>
              </div>
            </section>
          )}

          {surveyQuestions.map((question, index) => {
            const isHelpOpen = openHelpQuestionId === question.questionId;
            const answerValue = getVisibleAnswer(question, visibleAnswers) || '';
            const isAnsweredQuestion = isQuestionAlreadyAnswered(question, submittedAnswerMap);
            const isQuestionDisabled = !canWriteSurvey || isAnsweredQuestion;
            const questionTitle = isAnsweredQuestion
              ? SUBMITTED_QUESTION_MESSAGE
              : !canWriteSurvey
                ? SURVEY_DEADLINE_MESSAGE
                : undefined;

            return (
              <section key={question.questionId} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black text-emerald-700">
                      {index + 1}
                    </span>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {isAnsweredQuestion && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-600">
                            답변 완료
                          </span>
                        )}
                        {!canWriteSurvey && !isAnsweredQuestion && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                            작성 마감
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-black leading-relaxed text-slate-900 md:text-lg">
                        {question.text}
                        {!isAnsweredQuestion && <span className="ml-1 text-red-500">*</span>}
                      </h2>
                    </div>
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
                        disabled={isQuestionDisabled}
                        title={questionTitle}
                        onClick={() => handleAnswer(question, option)}
                      >
                        {option}
                      </ChoiceButton>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answerValue}
                    onChange={(e) => handleAnswer(question, e.target.value)}
                    placeholder="답변을 입력해 주세요"
                    disabled={isQuestionDisabled}
                    title={questionTitle}
                    className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold outline-none transition-all ${
                      isQuestionDisabled
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
            title={!canWriteSurvey ? SURVEY_DEADLINE_MESSAGE : undefined}
            className={`sticky bottom-20 z-20 w-full rounded-2xl py-5 text-lg font-black shadow-lg transition-all md:static ${
              canSubmitSurvey
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]'
                : 'bg-slate-200 text-slate-400'
            } ${!canSubmitSurvey ? 'cursor-not-allowed' : ''}`}
          >
            {getSubmitButtonLabel({
              canWriteSurvey,
              hasPendingQuestions,
              isSubmitting,
              isSurveyComplete,
              canSubmitSurvey,
            })}
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

function getSubmitButtonLabel({ canWriteSurvey, hasPendingQuestions, isSubmitting, isSurveyComplete, canSubmitSurvey }) {
  if (isSubmitting) return '제출 중입니다';
  if (!canWriteSurvey) return '작성 마감';
  if (isSurveyComplete) return '제출 완료';
  if (canSubmitSurvey) return '미답변 질문 제출하기';
  if (hasPendingQuestions) return '미답변 질문에 답변해 주세요';
  return '제출할 질문이 없습니다';
}

function getVisibleAnswer(question, answers) {
  const keys = getQuestionKeys(question);

  return keys.reduce((foundAnswer, key) => (
    foundAnswer !== undefined ? foundAnswer : answers[key]
  ), undefined);
}

function hasNonEmptyVisibleAnswer(question, answers) {
  const answer = getVisibleAnswer(question, answers);
  return answer !== undefined && String(answer).trim() !== '';
}

function isQuestionAlreadyAnswered(question, submittedAnswerMap) {
  if (question.answered) return true;
  if (question.answer !== undefined && question.answer !== null && String(question.answer).trim() !== '') return true;

  return getQuestionKeys(question).some(key => Object.prototype.hasOwnProperty.call(submittedAnswerMap, key));
}

function buildSubmittedAnswerMap(questions = [], answers = []) {
  const map = {};

  questions.forEach((question) => {
    if (!question.answered && !hasValue(question.answer)) return;

    const value = question.answer ?? '';
    getQuestionKeys(question).forEach((key) => {
      map[key] = value;
    });
  });

  answers.forEach((answer) => {
    const value = getAnswerValue(answer);
    getAnswerKeys(answer).forEach((key) => {
      map[key] = value;
    });
  });

  return map;
}

function getSurveyCompletionState(questions = [], answers = []) {
  if (questions.length === 0) return 'available';

  const answerMap = buildSubmittedAnswerMap(questions, answers);
  const answeredCount = questions.filter(question => isQuestionAlreadyAnswered(question, answerMap)).length;

  if (answeredCount === 0) return 'available';
  if (answeredCount < questions.length) return 'partial';
  return 'submitted';
}

function getQuestionKeys(question = {}) {
  const id = question.questionId ?? question.id;
  const text = question.text ?? question.question;
  const keys = [];

  if (id !== undefined && id !== null) keys.push(String(id));
  if (text) keys.push(`question:${text}`);

  return keys;
}

function getAnswerKeys(answer = {}) {
  const questionData = typeof answer.question === 'object' ? answer.question : answer.surveyQuestion;
  const id = answer.questionId ?? answer.surveyQuestionId ?? questionData?.questionId ?? questionData?.id;
  const text = typeof answer.question === 'string'
    ? answer.question
    : questionData?.question || answer.questionText;
  const keys = [];

  if (id !== undefined && id !== null) keys.push(String(id));
  if (text) keys.push(`question:${text}`);

  return keys;
}

function getAnswerValue(answer = {}) {
  return answer.answer ?? answer.content ?? answer.response ?? answer.value ?? '';
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
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

  if (storedStatus === 'partial') {
    return {
      key: 'partial',
      label: '추가 답변 가능',
      className: 'text-amber-500',
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
