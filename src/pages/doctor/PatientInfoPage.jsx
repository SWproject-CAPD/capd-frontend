import React from 'react';
import { useParams } from 'react-router-dom';
import { patientsData } from '../../api/mockPatients';
import BackToPatientButton from '../../components/BackToPatientButton';

export default function PatientInfoPage() {
  const { id } = useParams();

  // 1. 환자 데이터 매칭
  const patient = patientsData.find(p => p.id === id) || patientsData[0];

  // 2. Mock 데이터에 없는 정보들 하드코딩 및 계산
  const hardcodedData = {
    email: 'patient.capd@example.com',
    phone: '010-1234-5678',
    heightCm: 168, // 기준 키 (하드코딩)
    primaryPattern: '지속성 외래 복막투석 (CAPD) - 1일 4회 교환 (1.5% 2000mL 3회, 2.5% 2000mL 1회)',
    comorbidities: ['고혈압 (HTN)', '제2형 당뇨병 (T2DM)', '고지혈증'],
  };

  // BMI 자동 계산: 체중(kg) / (키(m) * 키(m))
  const baselineBmi = (patient.baseWeight / ((hardcodedData.heightCm / 100) ** 2)).toFixed(1);

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 h-full overflow-y-auto bg-slate-50/50">
      
      {/* 뒤로가기 버튼 */}
      <BackToPatientButton />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">환자 상세 정보</h1>
        <p className="text-gray-500 text-sm mt-1">등록된 환자의 기본 인적 사항, 신체 정보 및 임상 기록을 확인합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- 1. 기본 인적 사항 카드 (좌측 1열) --- */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* 프로필 헤더 */}
          <div className="bg-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-3 z-10 shadow-inner">
              {patient.name.charAt(0)}
            </div>
            <h2 className="text-xl font-black text-white z-10">{patient.name}</h2>
            <div className="text-blue-300 font-mono text-sm z-10 mt-1">{patient.id}</div>
          </div>
          
          {/* 상세 정보 리스트 */}
          <div className="p-6 space-y-5 flex-1">
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">성별 / 나이</div>
              <div className="text-sm font-bold text-gray-800">{patient.sex} / 만 {patient.age}세</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">이메일</div>
              <div className="text-sm font-medium text-gray-800">{hardcodedData.email}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">전화번호</div>
              <div className="text-sm font-medium text-gray-800">{hardcodedData.phone}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">혈액형</div>
              <div className="text-sm font-bold text-rose-500 bg-rose-50 w-fit px-2 py-0.5 rounded">{patient.bloodType}</div>
            </div>
          </div>
        </div>

        {/* --- 우측 2열 (신체 정보 & 임상 정보) --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. 신체 측정 및 기초 정보 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-emerald-500">⚖️</span> 신체 측정 및 기초 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-gray-500 mb-1">신장 (Height)</div>
                <div className="text-2xl font-black text-gray-900">{hardcodedData.heightCm} <span className="text-sm font-medium text-gray-500">cm</span></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-gray-500 mb-1">기준 체중 (Baseline Weight)</div>
                <div className="text-2xl font-black text-gray-900">{patient.baseWeight} <span className="text-sm font-medium text-gray-500">kg</span></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-gray-500 mb-1">BMI (체질량지수)</div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-black text-gray-900">{baselineBmi}</div>
                  <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full ${baselineBmi >= 25 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {baselineBmi >= 25 ? '과체중' : baselineBmi < 18.5 ? '저체중' : '정상'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 투석 처방 및 임상 정보 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-blue-500">🩺</span> 투석 처방 및 임상 기록
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1">복막투석 시작일 (CAPD Start Date)</div>
                  <div className="text-sm font-bold text-gray-900">{patient.capdStartDate}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1">주치의 (Doctor in Charge)</div>
                  <div className="text-sm font-bold text-gray-900">{patient.doctor} 원장</div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="text-xs font-bold text-blue-500 mb-2">현재 투석 처방 패턴 (Primary Pattern)</div>
                <div className="text-sm font-bold text-gray-800 leading-relaxed">
                  {hardcodedData.primaryPattern}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 mb-2">동반 질환 (Comorbidities)</div>
                <div className="flex flex-wrap gap-2">
                  {hardcodedData.comorbidities.map((disease, idx) => (
                    <span key={idx} className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full">
                      {disease}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}