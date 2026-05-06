import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';

const reportTypes = [
  { id: 'weekly', label: '최근 7일' },
  { id: 'monthly', label: '월별 주간' },
  { id: 'custom', label: '기간 선택' },
];

export default function AiReportPage() {
  const { id } = useParams();
  const patient = patientsData.find(p => p.id === id) || patientsData[0];
  const history = useMemo(() => patient.history || [], [patient.history]);

  const latestDate = history[0]?.date || '';
  const defaultStartDate = history[6]?.date || latestDate;

  const [reportType, setReportType] = useState('weekly');
  const [selectedMonth, setSelectedMonth] = useState(latestDate.slice(0, 7));
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [customStartDate, setCustomStartDate] = useState(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState(latestDate);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const monthOptions = useMemo(() => {
    return [...new Set(history.map(item => item.date.slice(0, 7)))];
  }, [history]);

  const monthlyWeekGroups = useMemo(() => {
    const monthRecords = history
      .filter(item => item.date.startsWith(selectedMonth))
      .sort((a, b) => a.date.localeCompare(b.date));

    const groups = {};

    monthRecords.forEach(item => {
      const day = Number(item.date.slice(8, 10));
      const week = String(Math.floor((day - 1) / 7) + 1);
      if (!groups[week]) groups[week] = [];
      groups[week].push(item);
    });

    return groups;
  }, [history, selectedMonth]);

  const selectedRecords = useMemo(() => {
    if (reportType === 'weekly') {
      return history.slice(0, 7);
    }

    if (reportType === 'monthly') {
      const fallbackWeek = Object.keys(monthlyWeekGroups)[0];
      return monthlyWeekGroups[selectedWeek] || monthlyWeekGroups[fallbackWeek] || [];
    }

    return history.filter(item => (
      item.date >= customStartDate && item.date <= customEndDate
    ));
  }, [customEndDate, customStartDate, history, monthlyWeekGroups, reportType, selectedWeek]);

  useEffect(() => {
    let isMounted = true;

    const loadReportData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!isMounted) return;

      setReportData(generateReport(patient, selectedRecords, reportType));
      setIsLoading(false);
    };

    loadReportData();

    return () => {
      isMounted = false;
    };
  }, [patient, reportType, selectedRecords]);

  const handleGenerateReport = () => {
    setReportData(generateReport(patient, selectedRecords, reportType));
  };

  const handleCopyReport = async () => {
    if (!reportData) return;

    const reportText = [
      `[${reportData.title}]`,
      `기간: ${reportData.period}`,
      `위험도: ${reportData.riskLevel}`,
      '',
      `요약: ${reportData.summary}`,
      '',
      '주요 수치',
      ...reportData.vitals.map(item => `- ${item.label}: ${item.value}`),
      '',
      'AI 정밀 데이터 분석',
      ...reportData.analysis.map((text, index) => `${index + 1}. ${text}`),
      '',
      `권고사항: ${reportData.recommendation}`,
    ].join('\n');

    await navigator.clipboard.writeText(reportText);
    alert('보고서가 복사되었습니다.');
  };

  return (
    <div className="h-full overflow-hidden bg-slate-50 p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-5 shrink-0">
          <BackToPatientButton />

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <span className="rounded-xl bg-indigo-100 p-2 text-xl text-indigo-600">AI</span>
                AI 건강 상태 분석 리포트
              </h1>
              <p className="mt-2 text-sm font-medium text-gray-500">
                <span className="font-bold text-indigo-600">{patient.name}</span> 환자의 투석 데이터를 온프레미스 AI가 분석한 전문 보고서입니다.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-right shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected Records</div>
              <div className="mt-1 text-xl font-black text-gray-900">{selectedRecords.length}일</div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
          <aside className="min-h-0 xl:col-span-4 overflow-y-auto custom-scrollbar pr-1">
            <Card className="flex h-fit flex-col border-none p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black text-gray-800">보고서 조건</h3>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {reportTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`rounded-xl py-2.5 text-xs font-black transition-all ${
                      reportType === type.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'border border-gray-100 bg-slate-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {reportType === 'weekly' && (
                <ConditionBox
                  title="최근 7일 주간 보고서"
                  description={`${history[6]?.date || '-'} ~ ${history[0]?.date || '-'} 기록을 기준으로 분석합니다.`}
                />
              )}

              {reportType === 'monthly' && (
                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel label="월 선택">
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedWeek('1');
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {monthOptions.map(month => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </FieldLabel>

                  <FieldLabel label="주차 선택">
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(monthlyWeekGroups).map(week => (
                        <option key={week} value={week}>{week}주차</option>
                      ))}
                    </select>
                  </FieldLabel>
                </div>
              )}

              {reportType === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel label="시작일">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </FieldLabel>

                  <FieldLabel label="종료일">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </FieldLabel>
                </div>
              )}

              <button
                onClick={handleGenerateReport}
                className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 shadow-sm"
              >
                보고서 생성
              </button>

              <div className="mt-5 rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <h4 className="mb-3 text-xs font-black text-gray-500">보고서 대상 기간</h4>
                <div className="space-y-3">
                  <SummaryLine label="시작일" value={selectedRecords[selectedRecords.length - 1]?.date || '-'} />
                  <SummaryLine label="종료일" value={selectedRecords[0]?.date || '-'} />
                  <SummaryLine label="대상 기록" value={`${selectedRecords.length}일`} />
                </div>
              </div>
            </Card>
          </aside>

          <main className="min-h-0 xl:col-span-8">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              {isLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                  <p className="text-sm font-bold text-gray-400">온프레미스 AI 모델이 데이터를 분석 중입니다...</p>
                </div>
              ) : reportData && (
                <>
                  <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Report Summary</span>
                        <h2 className="mt-1 text-lg font-black text-gray-900">{reportData.title}</h2>
                        <p className="mt-1 font-mono text-xs text-gray-400">{reportData.period}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyReport}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        >
                          보고서 복사하기
                        </button>

                        <span className={`rounded-full px-3 py-1 text-xs font-black ${
                          reportData.riskLevel === '위험'
                            ? 'bg-rose-100 text-rose-700'
                            : reportData.riskLevel === '주의'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {reportData.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar">
                    <p className="text-lg font-bold italic leading-relaxed text-gray-800">
                      "{reportData.summary}"
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {reportData.vitals.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-slate-50 p-4 text-center">
                          <span className="mb-1 text-[10px] font-bold text-gray-400">{item.label}</span>
                          <span className={`text-xl font-black ${item.status === 'warning' ? 'text-rose-600' : 'text-slate-800'}`}>
                            {item.value}
                          </span>
                          {item.status === 'warning' && (
                            <span className="mt-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                              주의 필요
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <ReportSection title="AI 정밀 데이터 분석">
                      {reportData.analysis.map((text, idx) => (
                        <div key={idx} className="flex items-start gap-4 group">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-400 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                            {idx + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-gray-600">{text}</p>
                        </div>
                      ))}
                    </ReportSection>

                    <div className="rounded-3xl bg-indigo-900 p-6 text-white shadow-lg">
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">Medical Recommendation</h3>
                      <p className="text-base font-bold md:text-lg">{reportData.recommendation}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function generateReport(patient, records, reportType) {
  const safeRecords = records.length ? records : [];
  const firstDate = safeRecords[safeRecords.length - 1]?.date || '-';
  const lastDate = safeRecords[0]?.date || '-';

  const avg = (values) => {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  const avgUf = avg(safeRecords.map(item => item.uf));
  const avgSys = avg(safeRecords.map(item => item.bpSystolic));
  const avgDia = avg(safeRecords.map(item => item.bpDiastolic));
  const avgWeight = safeRecords.length
    ? (safeRecords.reduce((sum, item) => sum + item.weight, 0) / safeRecords.length).toFixed(1)
    : '0.0';

  const avgExchangeCount = safeRecords.length
    ? Math.round(safeRecords.reduce((sum, item) => sum + item.exchanges.length, 0) / safeRecords.length)
    : 0;

  const lowUfDays = safeRecords.filter(item => item.uf < 800).length;
  const highBpDays = safeRecords.filter(item => item.bpSystolic >= 140).length;
  const lowExchangeDays = safeRecords.filter(item => item.exchanges.length < 4).length;
  const riskScore = lowUfDays + highBpDays + lowExchangeDays;

  const riskLevel = riskScore >= 4 ? '위험' : riskScore >= 1 ? '주의' : '안정';

  const titleMap = {
    weekly: '최근 7일 주간 AI 보고서',
    monthly: '월별 주차 AI 보고서',
    custom: '사용자 선택 기간 AI 보고서',
  };

  return {
    title: titleMap[reportType],
    period: `${firstDate} ~ ${lastDate}`,
    riskLevel,
    summary: `${patient.name} 환자의 선택 기간 기록을 분석한 결과, 평균 제수량은 +${avgUf}mL, 평균 혈압은 ${avgSys}/${avgDia}mmHg, 평균 체중은 ${avgWeight}kg입니다. 전반적인 위험도는 "${riskLevel}" 단계로 분류됩니다.`,
    vitals: [
      { label: '평균 제수량', value: `+${avgUf} mL`, status: avgUf < 800 ? 'warning' : 'normal' },
      { label: '평균 수축기 혈압', value: `${avgSys} mmHg`, status: avgSys >= 140 ? 'warning' : 'normal' },
      { label: '평균 체중', value: `${avgWeight} kg`, status: 'normal' },
    ],
    analysis: [
      `선택 기간 내 평균 제수량은 +${avgUf}mL이며, 제수량 800mL 미만인 날은 ${lowUfDays}일입니다.`,
      `평균 혈압은 ${avgSys}/${avgDia}mmHg이며, 수축기 혈압 140mmHg 이상인 날은 ${highBpDays}일입니다.`,
      `일 평균 투석 교환 횟수는 ${avgExchangeCount}회이며, 4회 미만 기록일은 ${lowExchangeDays}일입니다.`,
      '복통, 발열, 혼탁 배액 등 복막염 의심 증상과 함께 해석해야 하며, 본 보고서는 의료진 판단 보조 목적으로 사용됩니다.',
    ],
    recommendation: riskLevel === '안정'
      ? '현재 투석 패턴을 유지하며, 다음 외래 전까지 제수량과 혈압 추이를 지속 관찰하십시오.'
      : '제수량 저하 또는 혈압 상승 원인을 확인하고, 필요 시 투석액 농도, 수분 섭취량, 약물 복용 상태를 함께 검토하십시오.',
  };
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold text-gray-500">{label}</div>
      {children}
    </label>
  );
}

function ConditionBox({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
      <div className="text-sm font-black text-gray-800">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-gray-500">{description}</div>
    </div>
  );
}

function SummaryLine({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-bold text-gray-400">{label}</span>
      <span className={`text-sm font-black ${accent ? 'text-indigo-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function ReportSection({ title, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 bg-slate-50 px-6 py-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          {title}
        </h3>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}
