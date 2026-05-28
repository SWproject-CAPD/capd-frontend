import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';
import { toDateKey } from '../../api/adapters';
import { useDoctorAnswers, useDoctorPatientProfile, useDoctorReservationsByDate } from '../../hooks/usePatientData';

export default function QuestionCheckPage() {
  const { id } = useParams();
  const patientId = Number(id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const { data: patient } = useDoctorPatientProfile(id);
  const { data: reservations = [] } = useDoctorReservationsByDate(selectedDate);
  const patientReservation = reservations.find(reservation => Number(reservation.patientId) === patientId);
  const reservationId = patientReservation?.reservationId;
  const { data: answers = [] } = useDoctorAnswers(reservationId);

  const totalSurveyCount = useMemo(() => answers.length, [answers]);

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
              <span className="font-bold text-blue-600">{patient?.name || '환자'}</span> 환자의 예약별 설문 답변입니다.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-3 md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="col-span-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <HeaderStat label="예약번호" value={reservationId || '-'} color="blue" />
            <HeaderStat label="전체 답변" value={`${totalSurveyCount}개`} color="emerald" />
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar xl:col-span-3">
          <Card className="shrink-0 border-none p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-gray-800">환자 요약</h3>
            <div className="space-y-1">
              <InfoRow label="환자명" value={patient?.name || '-'} />
              <InfoRow label="환자번호" value={patient?.id || '-'} />
              <InfoRow label="성별/나이" value={patient ? `${patient.sex} / ${patient.age}세` : '-'} />
              <InfoRow label="전화번호" value={patient?.phone || '-'} />
              <InfoRow label="예약 일시" value={patientReservation ? `${patientReservation.date} ${patientReservation.time}` : '-'} />
            </div>
          </Card>

          <Card className="shrink-0 border-none p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-gray-800">조회 예약</h3>
            {patientReservation ? (
              <button
                type="button"
                className="w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-gray-900">{patientReservation.reservationId}</span>
                  <span className="text-[10px] font-bold text-gray-400">{answers.length}답변</span>
                </div>
                <div className="mt-1 text-[11px] font-bold text-gray-500">
                  {patientReservation.date} {patientReservation.time}
                </div>
              </button>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
                선택한 날짜에 예약이 없습니다.
              </div>
            )}
          </Card>
        </aside>

        <main className="flex min-h-0 flex-col xl:col-span-9">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                  Appointment Survey Responses
                </div>
                <h2 className="mt-1 text-lg font-black text-gray-900">예약별 설문 내역</h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 custom-scrollbar md:p-6">
              {!reservationId ? (
                <EmptyState text="선택한 날짜에 해당 환자의 예약이 없습니다." />
              ) : answers.length === 0 ? (
                <EmptyState text="제출된 설문 답변이 없습니다." />
              ) : (
                <div className="flex flex-col gap-4">
                  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="bg-blue-50 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-black text-white">
                          {patientReservation.reservationId}
                        </span>
                        <span className="text-sm font-black text-gray-900">설문 답변</span>
                      </div>
                      <div className="mt-2 text-xs font-bold text-gray-400">
                        {patientReservation.date} {patientReservation.time} · 답변 {answers.length}개
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-5">
                      <div className="flex flex-col gap-4">
                        {answers.map((answer, index) => (
                          <AnswerCard key={answer.answerId || `${answer.questionId}-${index}`} item={answer} index={index} />
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AnswerCard({ item, index }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
          {index + 1}
        </span>
        <h3 className="text-base font-black leading-relaxed text-gray-900">
          {item.question}
        </h3>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
        {item.answer}
      </div>
      {item.createdAt && (
        <div className="mt-3 text-right text-[11px] font-bold text-gray-400">
          {item.createdAt}
        </div>
      )}
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

function EmptyState({ text }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 text-4xl">📭</div>
      <h3 className="text-lg font-bold text-gray-800">{text}</h3>
    </div>
  );
}
