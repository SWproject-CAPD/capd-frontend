import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../../store/useAppStore';

export default function PatientDashboard() {
  const navigate = useNavigate();
  // Zustand 스토어에서 로그인한 환자 정보를 가져옴
  const { user } = useAppStore(); 

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* 환자 요약 정보 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            안녕하세요, <span className="text-blue-600">{user?.name || '김환자'}</span> 님!
          </h1>
          {/* 하드코딩됨 - 나중에 API 데이터로 교체 */}
          <p className="text-gray-500 mt-1 font-medium">남자, 54세 | 담당의: 김의사 선생님</p>
        </div>
        <div className="mt-4 md:mt-0 md:text-right bg-slate-50 p-3 rounded-xl border border-gray-100">
          <div className="text-sm text-gray-500 font-semibold">마지막 투석 기록</div>
          <div className="font-bold text-gray-800 text-lg">오늘 오후 2:30 <span className="text-blue-600 text-sm ml-1">(2시간 전)</span></div>
        </div>
      </div>

      {/* 메인 액션 버튼 */}
      <button
        onClick={() => navigate('/patient/record')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-6 md:p-8 rounded-2xl shadow-sm transition-all flex flex-col md:flex-row items-center gap-4 md:gap-6 group text-left"
      >
        <div className="text-5xl bg-blue-500/50 p-4 rounded-2xl group-hover:scale-105 transition-transform shrink-0">📝</div>
        <div>
          <div className="text-2xl md:text-3xl font-bold mb-2">투석 기록 입력</div>
          <div className="text-blue-100 font-medium text-sm md:text-base">오늘 하루의 투석 수치와 건강 상태를 잊지 말고 기록해 주세요.</div>
        </div>
      </button>

      {/* 서브 액션 버튼 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <button
          onClick={() => navigate('/patient/chat')}
          className="bg-white hover:bg-purple-50 border border-gray-200 p-6 rounded-2xl shadow-sm transition-all flex items-center gap-5 group text-left"
        >
          <div className="text-4xl bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform">🤖</div>
          <div>
            <div className="text-lg font-bold text-gray-800 group-hover:text-purple-700">챗봇 증상 상담</div>
            <div className="text-gray-500 text-sm mt-1">이상 증상을 AI에게 설명하고 도움받기</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/patient/survey')}
          className="bg-white hover:bg-emerald-50 border border-gray-200 p-6 rounded-2xl shadow-sm transition-all flex items-center gap-5 group text-left"
        >
          <div className="text-4xl bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:scale-110 transition-transform">📋</div>
          <div>
            <div className="text-lg font-bold text-gray-800 group-hover:text-emerald-700">건강 설문 조사</div>
            <div className="text-gray-500 text-sm mt-1">정기적인 설문조사로 진료 품질 높이기</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/patient/record_list')}
          className="bg-white hover:bg-indigo-50 border border-gray-200 p-6 rounded-2xl shadow-sm transition-all flex items-center gap-5 group text-left"
        >
          <div className="text-4xl bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:scale-110 transition-transform">📈</div>
          <div>
            <div className="text-lg font-bold text-gray-800 group-hover:text-indigo-700">투석 기록 보기</div>
            <div className="text-gray-500 text-sm mt-1">이전 기록을 목록이나 통계로 확인하기</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/patient/schedule')}
          className="bg-white hover:bg-orange-50 border border-gray-200 p-6 rounded-2xl shadow-sm transition-all flex items-center gap-5 group text-left"
        >
          <div className="text-4xl bg-orange-100 text-orange-600 p-3 rounded-xl group-hover:scale-110 transition-transform">📅</div>
          <div>
            <div className="text-lg font-bold text-gray-800 group-hover:text-orange-700">방문 일정 확인</div>
            <div className="text-gray-500 text-sm mt-1">병원 예약 및 다음 방문 일정 확인하기</div>
          </div>
        </button>

      </div>
    </div>
  );
}