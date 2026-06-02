import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import Sparkline from '../../components/Sparkline';
import useAppStore from '../../store/useAppStore';
import { capdApi, doctorApi } from '../../api/apiClient';
import { normalizeCapd } from '../../api/adapters';
import { useDoctorPatients } from '../../hooks/usePatientData';

function buildPatientRow(patient, records = []) {
  const todayData = records[0] || {};
  const bp = todayData.bp || '-';
  const sys = Number(todayData.bpSystolic || 0);
  const uf = Number(todayData.uf || 0);
  const fbs = Number(todayData.fbs || 0);
  const weight = todayData.weight || '-';
  const recordCount = todayData.exchanges ? todayData.exchanges.length : 0;
  const isWarning = Boolean(records.length) && (sys >= 140 || fbs >= 126 || uf < 800 || recordCount < 4);

  let aiMsg = records.length ? '안정적 (특이사항 없음)' : '최근 기록 없음';
  if (records.length && recordCount < 4) aiMsg = '투석 횟수 부족 주의';
  else if (records.length && sys >= 140) aiMsg = '수축기 혈압 높음 주의';
  else if (records.length && fbs >= 126) aiMsg = '공복혈당 높음 주의';
  else if (records.length && uf < 800) aiMsg = '제수량 부족 주의';

  return {
    ...patient,
    record: recordCount,
    uf,
    weight,
    bp,
    fbs: fbs || '-',
    ai: aiMsg,
    trend: records.slice(0, 7).reverse().map(record => record.uf),
    isWarning,
  };
}

export default function DoctorHome() {
  const navigate = useNavigate();
  const { currentDoctorName } = useAppStore();
  const { data: assignedPatients = [], isLoading, reload } = useDoctorPatients();
  const [recordsByPatientId, setRecordsByPatientId] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecordsLoading, setIsRecordsLoading] = useState(false);

  useEffect(() => {
    if (assignedPatients.length === 0) {
      setRecordsByPatientId({});
      return;
    }

    let ignore = false;

    const loadRecords = async () => {
      setIsRecordsLoading(true);

      try {
        const entries = await Promise.all(
          assignedPatients.map(async (patient) => {
            try {
              const records = await capdApi.getDoctorRecords(patient.id);
              return [patient.id, (records || []).map(normalizeCapd).sort((a, b) => b.date.localeCompare(a.date))];
            } catch {
              return [patient.id, []];
            }
          })
        );

        if (!ignore) {
          setRecordsByPatientId(Object.fromEntries(entries));
        }
      } finally {
        if (!ignore) setIsRecordsLoading(false);
      }
    };

    loadRecords();

    return () => {
      ignore = true;
    };
  }, [assignedPatients]);

  const patientList = useMemo(() => (
    assignedPatients.map(patient => buildPatientRow(patient, recordsByPatientId[patient.id] || []))
  ), [assignedPatients, recordsByPatientId]);

  const summaryStats = {
    total: patientList.length,
    normal: patientList.filter(patient => patient.record >= 4).length,
    delayed: patientList.filter(patient => patient.record < 4).length,
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 bg-slate-100">
      <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 shrink-0 mb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            전체 환자 모니터링
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            {currentDoctorName || '담당의'} 선생님의 담당 환자만 표시됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-6 text-sm">
            <div className="font-medium text-slate-500">
              담당 환자: <span className="font-bold text-slate-900 text-base ml-1">{summaryStats.total}</span>명
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="font-medium text-emerald-600">
              정상 제출: <span className="font-bold text-base ml-1">{summaryStats.normal}</span>명
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="font-medium text-red-500">
              제출 지연/누락: <span className="font-bold text-base ml-1">{summaryStats.delayed}</span>명
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            담당환자 추가
          </button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden border-none shadow-md bg-white">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-gray-200 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-4">환자 정보</th>
                <th className="px-5 py-4 text-center">일일 기록</th>
                <th className="px-5 py-4 text-right">총 제수량</th>
                <th className="px-5 py-4 text-right">체중</th>
                <th className="px-5 py-4 text-right">혈압</th>
                <th className="px-5 py-4 text-right">공복혈당</th>
                <th className="px-5 py-4">AI 특이사항</th>
                <th className="px-5 py-4 text-center">미니 추이 (7일)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {(isLoading || isRecordsLoading) && patientList.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-80 text-center text-sm font-bold text-slate-400">
                    담당 환자 데이터를 불러오는 중입니다.
                  </td>
                </tr>
              )}

              {!isLoading && patientList.length === 0 && (
                <tr>
                  <td colSpan={8} className="h-80 text-center text-sm font-bold text-slate-400">
                    등록된 담당 환자가 없습니다.
                  </td>
                </tr>
              )}

              {patientList.map(patient => (
                <tr
                  key={patient.id}
                  onClick={() => navigate(`/doctor/${patient.id}`)}
                  className={`cursor-pointer transition-colors group ${
                    patient.isWarning ? 'bg-red-50/30 hover:bg-red-50/80' : 'hover:bg-blue-50/50'
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${patient.isWarning ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {patient.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{patient.sex}/{patient.age}세</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="shrink-0">
                          {index < patient.record ? (
                            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-slate-50 m-px"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-mono font-bold ${patient.uf < 800 && patient.uf > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {patient.uf || '-'} <span className="text-[10px] text-slate-400 font-sans font-normal">mL</span>
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                    {patient.weight} <span className="text-[10px] text-slate-400">{patient.weight !== '-' ? 'kg' : ''}</span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold ${parseInt(patient.bp.split('/')[0], 10) >= 140 ? 'text-red-600' : 'text-slate-700'}`}>
                      {patient.bp}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold ${Number(patient.fbs) >= 126 ? 'text-orange-600' : 'text-slate-700'}`}>
                      {patient.fbs}
                    </span>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className={`text-xs font-bold truncate max-w-50 ${patient.isWarning ? 'text-red-600' : 'text-slate-400 font-medium'}`}>
                      {patient.ai}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 w-32">
                    <div className="flex items-center justify-center h-8 w-24 mx-auto bg-slate-50 rounded border border-slate-100 p-1">
                      <Sparkline data={patient.trend} color={patient.isWarning ? '#ef4444' : '#3b82f6'} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isAddModalOpen && (
        <AddPatientModal
          onAdd={async (phone) => {
            await doctorApi.registerPatient({ phone });
            await reload();
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  );
}

function AddPatientModal({ onAdd, onClose }) {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phone.trim()) return;

    setIsSubmitting(true);

    try {
      await onAdd(phone.trim());
      alert('담당 환자로 등록되었습니다.');
      onClose();
    } catch (error) {
      alert(error.message || '담당 환자 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">담당환자 추가</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                환자 전화번호를 입력해 본인의 담당 환자로 등록합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-xl font-black text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              X
            </button>
          </div>

          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="환자 전화번호"
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="bg-slate-50 px-6 py-4">
          <button
            type="submit"
            disabled={!phone.trim() || isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
          >
            {isSubmitting ? '등록 중' : '추가하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
