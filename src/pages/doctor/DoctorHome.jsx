import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { patientsData } from '../../api/mockPatients'; // 공통 데이터 불러오기
import Sparkline from '../../components/Sparkline';

export default function DoctorHome() {
  const navigate = useNavigate();

  const patientList = patientsData.map(p => {
    const todayData = p.history && p.history.length > 0 ? p.history[0] : {};
    const bp = todayData.bp || "120/80";
    const sys = parseInt(bp.split('/')[0]) || 120;
    const uf = todayData.uf || 0;
    const fbs = todayData.fbs || 100;
    const weight = todayData.weight || p.baseWeight || 60;
    const recordCount = todayData.exchanges ? todayData.exchanges.length : 0;
    
    // 위험/주의 상태 판별 (혈압 140이상, 혈당 126이상, 제수량 800미만, 투석 4회 미만)
    const isWarning = sys >= 140 || fbs >= 126 || uf < 800 || recordCount < 4;
    
    let aiMsg = "안정적 (특이사항 없음)";
    if (recordCount < 4) aiMsg = "투석 횟수 부족 주의";
    else if (sys >= 140) aiMsg = "수축기 혈압 높음 주의";
    else if (fbs >= 126) aiMsg = "공복혈당 높음 주의";
    else if (uf < 800) aiMsg = "제수량 부족 주의";

    return {
      ...p,
      record: recordCount,
      uf: uf,
      weight: weight,
      bp: bp,
      fbs: fbs,
      ai: aiMsg,
      trend: p.history ? p.history.slice(0, 7).reverse().map(h => h.uf) : [],
      isWarning: isWarning
    };
  });

  // 상단 압축형 요약 데이터 (가공된 patientList 기준으로 계산)
  const summaryStats = {
    total: patientList.length, 
    normal: patientList.filter(p => p.record >= 4).length,   // 4회 이상이면 정상 제출
    delayed: patientList.filter(p => p.record < 4).length    // 4회 미만이면 제출 지연/누락
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 bg-slate-100">
      
      {/* 상단 슬림형 헤더 */}
      <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-200 flex flex-wrap justify-between items-center shrink-0 mb-4">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          📊 전체 환자 모니터링
        </h1>
        <div className="flex items-center gap-6 text-sm">
          <div className="font-medium text-slate-500">
            전체 환자: <span className="font-bold text-slate-900 text-base ml-1">{summaryStats.total}</span>명
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
      </div>

      {/* 메인 고밀도 데이터 테이블 영역 */}
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
              {patientList.map((patient) => (
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
                  
                  {/* 5회차 초록색 체크 로직 적용 */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="shrink-0">
                          {i < patient.record ? (
                            <svg className="w-4.5 h-4.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
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
                    <span className={`font-mono font-bold ${patient.uf < 800 ? 'text-red-600' : 'text-slate-700'}`}>
                      {patient.uf} <span className="text-[10px] text-slate-400 font-sans font-normal">mL</span>
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                    {patient.weight} <span className="text-[10px] text-slate-400">kg</span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold ${parseInt(patient.bp.split('/')[0]) >= 140 ? 'text-red-600' : 'text-slate-700'}`}>
                      {patient.bp}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold ${patient.fbs >= 126 ? 'text-orange-600' : 'text-slate-700'}`}>
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
      
    </div>
  );
}