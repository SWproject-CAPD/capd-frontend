import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackToPatientButton from '../../components/BackToPatientButton';
import Card from '../../components/Card';
import { reportApi } from '../../api/apiClient';
import { normalizeReport } from '../../api/adapters';
import { useDoctorPatientProfile, usePatientReports } from '../../hooks/usePatientData';

export default function AiReportPage() {
  const { id } = useParams();
  const patientId = Number(id);
  const { data: patient } = useDoctorPatientProfile(id);
  const { data: savedReports = [], reload } = usePatientReports(id);
  const initialDate = useMemo(() => new Date(), []);

  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const activeReport = reportData || savedReports[0] || null;
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const yearOptions = useMemo(() => {
    const year = initialDate.getFullYear();
    return [year - 1, year, year + 1];
  }, [initialDate]);

  const handleGenerateReport = async () => {
    setIsLoading(true);

    try {
      const response = await reportApi.generate(patientId, {
        year: Number(selectedYear),
        month: Number(selectedMonth),
        weekNumber: Number(selectedWeek),
      });
      const normalized = normalizeReport(response);
      setReportData(normalized);
      await reload();
    } catch (error) {
      alert(error.message || '보고서 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!activeReport) return;

    const reportText = [
      `[${activeReport.title}]`,
      `기간: ${activeReport.period}`,
      '',
      `요약: ${activeReport.summary}`,
      '',
      '주요 수치',
      ...activeReport.vitals.map(item => `- ${item.label}: ${item.value}`),
      '',
      'AI 정밀 데이터 분석',
      ...activeReport.analysis.map((text, index) => `${index + 1}. ${text}`),
      '',
      `권고사항: ${activeReport.recommendation}`,
    ].join('\n');

    await navigator.clipboard.writeText(reportText);
    alert('보고서가 복사되었습니다.');
  };

  const handleExportPdf = async () => {
    if (!activeReport?.reportId) return;

    try {
      await reportApi.createPdf(activeReport.reportId);
      const pdfUrl = await reportApi.getPdfUrl(activeReport.reportId);
      if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      alert(error.message || 'PDF 내보내기에 실패했습니다.');
    }
  };

  return (
    <div className="h-full overflow-hidden bg-slate-50 p-4 md:p-6 animate-in fade-in duration-500">
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-5 shrink-0">
          <BackToPatientButton />

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900">
                <span className="rounded-xl bg-blue-100 p-2 text-xl text-blue-600">AI</span>
                AI 건강 상태 분석 리포트
              </h1>
              <p className="mt-2 text-sm font-medium text-gray-500">
                <span className="font-bold text-blue-600">{patient?.name || '환자'}</span> 환자의 투석 데이터를 온프레미스 AI가 분석한 전문 보고서입니다.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-right shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Saved Reports</div>
              <div className="mt-1 text-xl font-black text-gray-900">{savedReports.length}건</div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
          <aside className="min-h-0 xl:col-span-4 overflow-y-auto custom-scrollbar pr-1">
            <Card className="flex h-fit flex-col border-none p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-black text-gray-800">보고서 조건</h3>

              <div className="grid grid-cols-3 gap-3">
                <FieldLabel label="연도">
                  <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="월">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    {monthOptions.map(month => <option key={month} value={month}>{month}월</option>)}
                  </select>
                </FieldLabel>

                <FieldLabel label="주차">
                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500">
                    {[1, 2, 3, 4, 5].map(week => <option key={week} value={week}>{week}주차</option>)}
                  </select>
                </FieldLabel>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 shadow-sm disabled:bg-slate-300"
              >
                {isLoading ? '보고서 생성 중' : '보고서 생성'}
              </button>

              <div className="mt-5 rounded-2xl border border-gray-100 bg-slate-50 p-4">
                <h4 className="mb-3 text-xs font-black text-gray-500">저장된 보고서</h4>
                <div className="space-y-2">
                  {savedReports.map(report => (
                    <button
                      key={report.reportId}
                      type="button"
                      onClick={() => setReportData(report)}
                      className="w-full rounded-xl border border-gray-100 bg-white px-3 py-3 text-left text-xs font-bold text-gray-600 hover:border-blue-200 hover:bg-blue-50"
                    >
                      {report.period}
                    </button>
                  ))}
                  {savedReports.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs font-bold text-gray-400">
                      저장된 보고서가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </aside>

          <main className="min-h-0 xl:col-span-8">
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              {isLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="text-sm font-bold text-gray-400">온프레미스 AI 모델이 데이터를 분석 중입니다...</p>
                </div>
              ) : activeReport ? (
                <>
                  <div className="shrink-0 border-b border-gray-100 bg-slate-50 px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Report Summary</span>
                        <h2 className="mt-1 text-lg font-black text-gray-900">{activeReport.title}</h2>
                        <p className="mt-1 font-mono text-xs text-gray-400">{activeReport.period}</p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={handleExportPdf} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100">
                          PDF로 내보내기
                        </button>
                        <button type="button" onClick={handleCopyReport} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800">
                          보고서 복사하기
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar">
                    <p className="text-lg font-bold italic leading-relaxed text-gray-800">
                      "{activeReport.summary}"
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {activeReport.vitals.map((item, index) => (
                        <div key={`${item.label}-${index}`} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-slate-50 p-4 text-center">
                          <span className="mb-1 text-[10px] font-bold text-gray-400">{item.label}</span>
                          <span className="text-sm font-black text-slate-800">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <ReportSection title="AI 정밀 데이터 분석">
                      {activeReport.analysis.map((text, index) => (
                        <div key={`${text}-${index}`} className="flex items-start gap-4 group">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-gray-600">{text}</p>
                        </div>
                      ))}
                    </ReportSection>

                    <div className="rounded-3xl bg-blue-900 p-6 text-white shadow-lg">
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-200">Medical Recommendation</h3>
                      <p className="text-base font-bold md:text-lg">{activeReport.recommendation}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm font-bold text-gray-400">
                  보고서를 생성하거나 저장된 보고서를 선택하세요.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold text-gray-500">{label}</div>
      {children}
    </label>
  );
}

function ReportSection({ title, children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 bg-slate-50 px-6 py-4">
        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          {title}
        </h3>
      </div>
      <div className="space-y-4 p-6">{children}</div>
    </div>
  );
}
