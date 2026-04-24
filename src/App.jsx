import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 공통 및 인증 페이지
import LoginPage from './pages/LoginPage';
import DoctorRegister from './pages/DoctorRegister';
import PatientRegister from './pages/PatientRegister';

// 레이아웃 컴포넌트
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';

import PatientDashboard from './pages/patient/PatientHome';
import PatientRecord from './pages/patient/DailyRecordPage';
import PatientRecordList from './pages/patient/RecordListPage';
import PatientSurvey from './pages/patient/HealthSurveyPage';
import PatientChat from './pages/patient/SymptomHelperPage';
import PatientSchedule from './pages/patient/VisitSchedulePage';

import DoctorDashboard from './pages/doctor/DoctorHome';
import PatientInsightPage from './pages/doctor/PatientInsightPage';
import PatientInfoPage from './pages/doctor/PatientInfoPage';


function App() {
  // 현재 로그인한 사용자의 정보를 가져옵니다. (ESLint 경고 방지를 위해 주석 처리하거나 사용하세요)
  // const { user } = useAppStore();

  return (
    <Router>
      <Routes>
        {/* 공통 경로 */}
        {/* 첫 화면을 로그인 페이지로 설정 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 회원가입 경로 */}
        <Route path="/register/doctor" element={<DoctorRegister />} />
        <Route path="/register/patient" element={<PatientRegister />} />

        {/* 환자 전용 경로 (PatientLayout 적용) */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="record" element={<PatientRecord />} />
          <Route path="record_list" element={<PatientRecordList />} />
          <Route path="survey" element={<PatientSurvey />} />
          <Route path="chat" element={<PatientChat />} />
          <Route path="schedule" element={<PatientSchedule />} />
        </Route>

        {/* 의사 전용 경로 (DoctorLayout 적용) */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          {/* 특정 환자 선택 시의 경로 */}
          <Route path=":id" element={<PatientInsightPage />} />
          <Route path=":id/info" element={<PatientInfoPage />} />
          <Route path=":id/charts" element={<div>상세 차트 페이지 (예정)</div>} />
          <Route path=":id/ai_report" element={<div>AI 리포트 페이지 (예정)</div>} />
          <Route path=":id/logs" element={<div>전체 기록 페이지 (예정)</div>} />
          <Route path=":id/questions" element={<div>설문 관리 페이지 (예정)</div>} />
        </Route>

        {/* 리다이렉트 설정 */}
        {/* '/' 접속 시 로그인으로 이동 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 잘못된 모든 경로는 로그인 페이지로 이동 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;