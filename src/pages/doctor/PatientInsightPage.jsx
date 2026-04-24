import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import Sparkline from '../../components/Sparkline';
import BackToPatientButton from '../../components/BackToPatientButton'; 
import {ComposedChart,Bar,Line,XAxis,YAxis,CartesianGrid,ResponsiveContainer,LabelList,Cell,Tooltip} from 'recharts';

// 바로가기 버튼 아이콘
const ShortcutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export default function PatientInsightPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // 1. 환자 데이터 매칭
  const patient = patientsData.find(p => p.id === id) || patientsData[0];
  const history = patient.history;

  // 2. 상단 요약 데이터 추출
  const currentWeight = history[0].weight;
  const lastWeekWeight = history[7].weight;
  const weightDiff = (currentWeight - lastWeekWeight).toFixed(1);
  const isWeightDecreased = weightDiff <= 0;

  // 꺾은선 그래프용 데이터
  const weightHistory7Days = history.slice(0, 7).reverse().map(h => h.weight);
  const bpHistory7Days = history.slice(0, 7).reverse().map(h => h.bpSystolic);
  const ufHistory7Days = history.slice(0, 7).reverse().map(h => h.uf);

  // 최근 3일간의 하단 상세 표 데이터 추출
  const recent3DaysExchanges = [];
  for (let i = 0; i < 3; i++) {
    history[i].exchanges.forEach(ex => {
      recent3DaysExchanges.push({ dateStr: history[i].displayDate, ...ex });
    });
  }

  // AI 3일 평균 계산
  const avgUf3Days = Math.floor((history[0].uf + history[1].uf + history[2].uf) / 3);
  const weightDiff3Days = (history[0].weight - history[3].weight).toFixed(1);

  return (
    <div className="p-4 md:p-6 animate-in fade-in duration-500 h-full flex flex-col overflow-hidden bg-slate-50">

      {/* 헤더 영역 */}
      <div className="mb-4 flex justify-between items-end shrink-0">
        <div>
          <div className="text-sm font-bold text-blue-500 mb-1">PATIENT INSIGHT</div>
          <h1 className="text-2xl font-black text-gray-900">{patient.name} 환자 상세 현황</h1>
        </div>
      </div>

      {/* 상단: 4열 구조 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 shrink-0">
        
        {/* 1. 환자 기본 정보 */}
        <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <button 
            onClick={() => navigate(`/doctor/${id}/info`)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-slate-800/80 rounded-lg transition-colors z-20"
            title="환자 정보 보기"
          >
            <ShortcutIcon />
          </button>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-3 z-10">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">{patient.name}</h2>
              <p className="text-[10px] text-slate-300 font-mono">{patient.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs z-10 mt-auto">
            <div className="text-slate-400">나이/성별</div><div className="font-medium text-right">{patient.age}세 / {patient.sex}</div>
            <div className="text-slate-400">투석 시작일</div><div className="font-medium text-right">{patient.capdStartDate}</div>
            <div className="text-slate-400">담당의</div><div className="font-medium text-right">{patient.doctor}</div>
          </div>
        </div>

        {/* 2. 체중 요약 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">최근 체중 (kg)</div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-2xl font-black text-gray-900 leading-none">{currentWeight}</span>
              <span className={`text-xs font-bold ${isWeightDecreased ? 'text-blue-500' : 'text-red-500'}`}>
                ({weightDiff > 0 ? '+' : ''}{weightDiff}kg)
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-medium">최초 투석 시: {history[29].weight} kg</div>
          </div>
          <div className="mt-2 flex flex-col items-end">
            <Sparkline data={weightHistory7Days} color={isWeightDecreased ? '#3b82f6' : '#ef4444'} />
          </div>
        </div>

        {/* 3. 혈압 요약 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">최근 혈압 (mmHg)</div>
            <div className="text-2xl font-black text-gray-900 leading-none">{history[0].bp}</div>
          </div>
          <div className="mt-2 flex flex-col items-end">
            <Sparkline data={bpHistory7Days} color="#8b5cf6" />
          </div>
        </div>

        {/* 4. 평균 제수량 요약 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
          <div>
            <div className="text-xs font-bold text-gray-500 mb-1">최근 제수량 (mL)</div>
            <div className="text-2xl font-black text-blue-600 leading-none">+{history[0].uf}</div>
          </div>
          <div className="mt-2 flex flex-col items-end">
            <Sparkline data={ufHistory7Days} color="#0ea5e9" />
          </div>
        </div>

      </div>

      {/* 중단: 2열 구조 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 flex-[1.2] min-h-0">
        
        {/* 5. Recharts 혼합 그래프 (막대 + 선) */}
        <div className="lg:col-span-2 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative h-full flex flex-col min-h-0">
          <button 
            onClick={() => navigate(`/doctor/${id}/charts`)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-slate-50 rounded-lg transition-colors z-20"
            title="차트 상세 보기"
          >
            <ShortcutIcon />
          </button>
          
          <h3 className="text-base font-bold text-gray-800 mb-2 shrink-0">주요 활력 징후 및 제수량 추이</h3>
          
          <div className="flex gap-4 text-[10px] font-bold mb-2 shrink-0">
            <span className="flex items-center gap-1 text-purple-600"><div className="w-2.5 h-2.5 bg-purple-200 rounded-sm border border-purple-300"></div>체중</span>
            <span className="flex items-center gap-1 text-red-500"><div className="w-2.5 h-1 bg-red-500 rounded-full"></div>수축기 혈압</span>
            <span className="flex items-center gap-1 text-blue-500"><div className="w-2.5 h-1 bg-blue-500 rounded-full"></div>제수량</span>
          </div>

          {/* Recharts 컴포넌트 렌더링 영역 */}
          <div className="flex-1 relative w-full h-full min-h-0">
            {(() => {
              const chartData = history.slice(0, 7).reverse();

              return (
                <ResponsiveContainer width="100%" height="100%">
                  {/* ComposedChart: 여러 종류의 차트를 하나로 겹쳐서 그림 */}
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 25, right: 10, bottom: 0, left: 10 }}
                  >
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="6 6" vertical={false} />
                    
                    {/* X축 */}
                    <XAxis 
                      dataKey="displayDate" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} 
                      dy={10} 
                    />
                    
                    {/* 데이터 툴팁 (마우스 오버 시 상세 데이터 표시) */}
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f8fafc' }}
                    />

                    {/* 각각의 데이터를 독립적인 Y축 스케일로 바인딩하기 위해 숨김 처리된 YAxis 생성 */}
                    <YAxis yAxisId="weight" domain={[40, 100]} hide />
                    <YAxis yAxisId="uf" domain={[500, 2500]} hide />
                    <YAxis yAxisId="bp" domain={[80, 180]} hide />

                    {/* 1. 체중 막대 그래프 */}
                    <Bar yAxisId="weight" dataKey="weight" name="체중 (kg)" barSize={40} radius={[6, 6, 6, 6]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#e9d5ff" className="hover:fill-[#d8b4fe] transition-colors cursor-pointer" />
                      ))}
                      <LabelList 
                        dataKey="weight" 
                        position="top" 
                        fill="#9333ea" 
                        fontSize={13} 
                        fontWeight={900} 
                        style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 4 }} 
                      />
                    </Bar>

                    {/* 2. 제수량 선 그래프 */}
                    <Line 
                      yAxisId="uf" 
                      type="monotone" 
                      dataKey="uf" 
                      name="제수량 (mL)"
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    >
                      <LabelList 
                        dataKey="uf" 
                        position="top" 
                        offset={12}
                        fill="#2563eb" 
                        fontSize={13} 
                        fontWeight={900} 
                        style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 4 }} 
                      />
                    </Line>

                    {/* 3. 혈압 선 그래프 */}
                    <Line 
                      yAxisId="bp" 
                      type="monotone" 
                      dataKey="bpSystolic" 
                      name="수축기 혈압 (mmHg)"
                      stroke="#ef4444" 
                      strokeWidth={4} 
                      dot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    >
                      <LabelList 
                        dataKey="bpSystolic" 
                        position="bottom" 
                        offset={12}
                        fill="#dc2626" 
                        fontSize={13} 
                        fontWeight={900} 
                        style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 4 }} 
                      />
                    </Line>

                  </ComposedChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>

        {/* 6. AI 건강 상태 알림 */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative h-full flex flex-col min-h-0">
          <button 
            onClick={() => navigate(`/doctor/${id}/ai_report`)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-slate-50 rounded-lg transition-colors"
            title="AI 주간 보고서 보기"
          >
            <ShortcutIcon />
          </button>
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <span className="text-lg">🤖</span>
            <h3 className="text-base font-bold text-gray-800">AI 건강 상태 분석</h3>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-0.5">최근 3일 제수량</div>
                <div className="text-sm font-black text-gray-900">평균 +{avgUf3Days} mL</div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${avgUf3Days > 800 ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${avgUf3Days > 800 ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`}></div> 
                {avgUf3Days > 800 ? '안정적' : '주의'}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-yellow-200/50">
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-0.5">최근 3일 혈압</div>
                <div className="text-sm font-black text-gray-900">평균 {history[0].bp}</div>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${history[0].bpSystolic > 140 ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${history[0].bpSystolic > 140 ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></div> 
                {history[0].bpSystolic > 140 ? '주의' : '안정적'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="text-[11px] font-bold text-gray-500 mb-0.5">최근 3일 체중</div>
                <div className="text-sm font-black text-gray-900">{weightDiff3Days > 0 ? '증가' : '감소'} ({weightDiff3Days > 0 ? '+' : ''}{weightDiff3Days}kg)</div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> 안정적
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 하단: 기록 표, 설문 관리 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* 7. 기록 표 */}
        <div className="lg:col-span-2 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative h-full flex flex-col min-h-0">
          <button 
            onClick={() => navigate(`/doctor/${id}/logs`)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-slate-50 rounded-lg transition-colors z-20"
            title="기록 전체 보기"
          >
            <ShortcutIcon />
          </button>
          <h3 className="text-base font-bold text-gray-800 mb-3 shrink-0">최근 3일 투석 상세 기록</h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 border-t border-gray-100">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-gray-500 font-bold sticky top-0 shadow-sm">
                <tr>
                  <th className="px-3 py-2.5">날짜 / 시간</th>
                  <th className="px-3 py-2.5">농도</th>
                  <th className="px-3 py-2.5">주입량(mL)</th>
                  <th className="px-3 py-2.5">배액량(mL)</th>
                  <th className="px-3 py-2.5">제수량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent3DaysExchanges.map((ex, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-medium text-gray-900">{ex.dateStr} {ex.time}</td>
                    <td className="px-3 py-2"><span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">{ex.concentration}%</span></td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{ex.infused}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{ex.drained}</td>
                    <td className="px-3 py-2 font-bold text-blue-600 font-mono">+{ex.uf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. 환자 설문 승인 관리 */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative h-full flex flex-col justify-between min-h-0">
          <button 
            onClick={() => navigate(`/doctor/${id}/questions`)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-slate-50 rounded-lg transition-colors z-20"
            title="설문 관리 바로가기"
          >
            <ShortcutIcon />
          </button>
          <div className="shrink-0 mb-2">
            <h3 className="text-base font-bold text-gray-800 mb-1">설문 승인 및 현황</h3>
            <p className="text-[11px] text-gray-500 line-clamp-2">AI 맞춤형 질문 현황입니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <div className="bg-rose-50 border border-rose-100 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-rose-100 transition-colors h-full">
              <div className="text-2xl font-black text-rose-600 mb-1">{Math.floor(Math.random() * 5) + 1}</div>
              <div className="text-[10px] font-bold text-rose-800">승인 대기 질문</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors h-full">
              <div className="text-2xl font-black text-blue-600 mb-1">{Math.floor(Math.random() * 20) + 5}</div>
              <div className="text-[10px] font-bold text-blue-800">응답 완료 설문</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}