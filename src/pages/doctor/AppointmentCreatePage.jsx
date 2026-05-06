import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import useAppStore from '../../store/useAppStore';

const appointmentTypes = [
  { value: '정기 검진', description: '정기 외래 진료' },
  { value: '혈액 검사 결과 상담', description: '검사 결과 확인' },
  { value: '투석관 점검 및 소독', description: '투석관 상태 확인' },
  { value: '증상 확인', description: '불편 증상 진료' },
];

export default function AppointmentCreatePage() {
  const navigate = useNavigate();
  const { currentDoctorId, currentDoctorName, patientAssignments } = useAppStore();

  const assignedPatients = useMemo(() => {
    return patientsData.filter(patient => patientAssignments[patient.id]?.doctorId === currentDoctorId);
  }, [currentDoctorId, patientAssignments]);

  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    patientId: assignedPatients[0]?.id || '',
    date: defaultDate,
    time: '09:00',
    type: '정기 검진',
  });

  const selectedPatient = assignedPatients.find(patient => patient.id === formData.patientId);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.patientId) {
      alert('예약할 환자를 선택해 주세요.');
      return;
    }

    const appointmentPayload = {
      ...formData,
      doctorId: currentDoctorId,
      doctorName: currentDoctorName,
      patientName: selectedPatient?.name,
    };

    console.log('예약 등록 데이터:', appointmentPayload);
    alert('환자 예약이 등록되었습니다.');
    navigate(`/doctor/${formData.patientId}`);
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
                      onClick={() => handleTypeSelect(type.value)}
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

            {selectedPatient ? (
              <div className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl bg-slate-50 p-5">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-600">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xl font-black text-slate-900">{selectedPatient.name}</div>
                      <div className="mt-1 text-sm font-bold text-slate-400">
                        {selectedPatient.id} · {selectedPatient.sex}/{selectedPatient.age}세
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <InfoBox label="CAPD 시작일" value={selectedPatient.capdStartDate} />
                    <InfoBox label="최근 투석일" value={selectedPatient.lastDialysis} />
                    <InfoBox label="담당의" value={`${currentDoctorName} 선생님`} />
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
                  {selectedPatient?.name || '환자'}
                </div>
                <div className="mt-3 w-fit rounded-full bg-blue-100 px-3 py-1 text-sm font-black text-blue-700">
                  {formData.type}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 shrink-0 w-full rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.99]"
            >
              예약 등록하기
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-black text-slate-700">{label}</div>
      {children}
    </label>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="text-[11px] font-black text-slate-400">{label}</div>
      <div className="mt-1 wrap-break-word text-xs font-black text-slate-800">{value}</div>
    </div>
  );
}
