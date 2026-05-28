import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationApi } from '../../api/apiClient';
import { toDateKey, toDateTimeInputValue } from '../../api/adapters';
import { useDoctorPatientProfile, useDoctorPatients } from '../../hooks/usePatientData';

const appointmentTypes = [
  { value: '정기 검진', description: '정기 외래 진료' },
  { value: '혈액 검사 결과 상담', description: '검사 결과 확인' },
  { value: '투석관 점검 및 소독', description: '투석관 상태 확인' },
  { value: '증상 확인', description: '불편 증상 진료' },
];

export default function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { data: assignedPatients = [] } = useDoctorPatients();
  const todayKey = toDateKey(new Date());

  const [formData, setFormData] = useState({
    patientId: '',
    date: todayKey,
    time: '09:00',
    type: '정기 검진',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPatient = useMemo(() => (
    assignedPatients.find(patient => String(patient.id) === String(formData.patientId)) || assignedPatients[0]
  ), [assignedPatients, formData.patientId]);
  const { data: selectedPatientProfile, isLoading: isPatientProfileLoading } = useDoctorPatientProfile(selectedPatient?.id);
  const displayPatient = useMemo(() => (
    mergePatientProfile(selectedPatient, selectedPatientProfile)
  ), [selectedPatient, selectedPatientProfile]);

  React.useEffect(() => {
    if (!formData.patientId && assignedPatients[0]?.id) {
      setFormData(prev => ({ ...prev, patientId: assignedPatients[0].id }));
    }
  }, [assignedPatients, formData.patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId) {
      alert('예약할 환자를 선택해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reservation = await reservationApi.create({
        patientId: Number(formData.patientId),
        reservationDate: toDateTimeInputValue(formData.date, formData.time),
      });

      window.dispatchEvent(new CustomEvent('capd:reservations-changed', {
        detail: { date: formData.date, reservation },
      }));

      alert('환자 예약이 등록되었습니다.');
      navigate('/doctor/appointments/check');
    } catch (error) {
      alert(error.message || '예약 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 p-4 animate-in fade-in duration-500">
      <div className="mb-3 flex shrink-0 items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black text-blue-600">APPOINTMENT</div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">환자 예약 등록</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            담당 환자를 선택하고 진료 예약 일정을 등록합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm hover:bg-slate-50"
        >
          목록으로 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <section className="col-span-7 flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 shrink-0 border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">예약 정보 입력</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">
              환자, 날짜, 시간, 예약 유형을 선택하세요.
            </p>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_1fr] gap-3">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <Field label="환자 선택">
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  {assignedPatients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} 환자 ({patient.id}, {patient.sex}/{patient.age}세)
                    </option>
                  ))}
                </select>
              </Field>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Field label="예약 날짜">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Field label="예약 시간">
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </Field>
              </div>
            </section>

            <section className="flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 shrink-0">
                <div className="text-sm font-black text-slate-700">예약 유형</div>
                <div className="mt-1 text-xs font-bold text-slate-400">진료 목적에 맞는 유형을 선택하세요.</div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
                {appointmentTypes.map(type => {
                  const isActive = formData.type === type.value;

                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100'
                          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className={`text-base font-black ${isActive ? 'text-blue-700' : 'text-slate-900'}`}>
                        {type.value}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-400">
                        {type.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </section>

        <aside className="col-span-5 grid min-h-0 grid-rows-[1fr_1fr] gap-4">
          <section className="flex min-h-0 flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 shrink-0 text-base font-black text-slate-900">예약 대상 환자</h2>

            {displayPatient ? (
              <div className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl bg-slate-50 p-5">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-600">
                      {displayPatient.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xl font-black text-slate-900">{displayPatient.name}</div>
                      <div className="mt-1 text-sm font-bold text-slate-400">
                        {displayPatient.id} · {displayPatient.sex}/{displayPatient.age}세
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <InfoBox label="전화번호" value={displayPatient.phone} isLoading={isPatientProfileLoading} />
                    <InfoBox label="이메일" value={displayPatient.email} isLoading={isPatientProfileLoading} />
                    <InfoBox label="환자번호" value={displayPatient.id} />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black text-slate-400">예약 방식</div>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-slate-600">
                    의사가 담당 환자를 선택하여 예약을 등록합니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400">
                선택 가능한 담당 환자가 없습니다.
              </div>
            )}
          </section>

          <section className="flex min-h-0 flex-col rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <div className="mb-3 shrink-0 text-xs font-black text-blue-600">예약 미리보기</div>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="text-sm font-black text-slate-400">예약 일시</div>
                <div className="mt-3 text-2xl font-black text-slate-900">{formData.date}</div>
                <div className="mt-1 text-2xl font-black text-blue-700">{formData.time}</div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white/80 p-5">
                <div className="text-sm font-black text-slate-400">예약 내용</div>
                <div className="mt-3 truncate text-xl font-black text-slate-900">
                  {displayPatient?.name || '환자'}
                </div>
                <div className="mt-3 w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
                  {formData.type}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || assignedPatients.length === 0}
              className="mt-4 shrink-0 w-full rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.99] disabled:bg-slate-300"
            >
              {isSubmitting ? '예약 등록 중' : '예약 등록하기'}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}

function mergePatientProfile(patient, profile) {
  if (!patient) return null;
  if (!profile) return patient;

  return {
    ...patient,
    ...profile,
    email: preferProfileValue(profile.email, patient.email),
    phone: preferProfileValue(profile.phone, patient.phone),
  };
}

function preferProfileValue(profileValue, fallbackValue) {
  if (profileValue === undefined || profileValue === null || profileValue === '' || profileValue === '-') {
    return fallbackValue || '-';
  }

  return profileValue;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function InfoBox({ label, value, isLoading = false }) {
  const displayValue = isLoading && (!value || value === '-') ? '조회 중' : value;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="text-[11px] font-black text-slate-400">{label}</div>
      <div className="mt-1 wrap-break-word text-xs font-black text-slate-800">{displayValue || '-'}</div>
    </div>
  );
}
