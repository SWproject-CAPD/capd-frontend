import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import useAppStore from './store/useAppStore';

// 공통 및 인증 페이지
import LoginPage from './pages/LoginPage';
import DoctorRegister from './pages/DoctorRegister'; // 파일명 오타(Doctore) 주의
import PatientRegister from './pages/PatientRegister';

// 레이아웃 컴포넌트
import PatientLayout from './components/PatientLayout';
import DoctorLayout from './components/DoctorLayout';

/** * 실제 페이지 파일이 없을 경우 에러가 나므로, 
 * 임시 컴포넌트를 만들어 에러를 방지합니다. 
 * 나중에 실제 파일을 만드시면 이 부분을 지우고 상단에서 import 하세요.
 */
const PatientDashboard = () => <div className="p-8 text-2xl font-bold">환자 대시보드 </div>;
const PatientChat = () => <div className="p-8 text-2xl font-bold">환자 AI 문진 </div>;
const DoctorDashboard = () => <div className="p-8 text-2xl font-bold">의사 EMR 대시보드 </div>;

function App() {
  // 현재 로그인한 사용자의 정보를 가져옵니다. (ESLint 경고 방지를 위해 주석 처리하거나 사용하세요)
  // const { user } = useAppStore();

  return (
    <Router>
      <Routes>
        {/* === 공통 경로 === */}
        {/* 첫 화면을 로그인 페이지로 설정 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 회원가입 경로 */}
        <Route path="/register/doctor" element={<DoctorRegister />} />
        <Route path="/register/patient" element={<PatientRegister />} />

        {/* === 환자 전용 경로 (PatientLayout 적용) === */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="survey" element={<PatientChat />} />
        </Route>

        {/* === 의사 전용 경로 (DoctorLayout 적용) === */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<DoctorDashboard />} />
          {/* 특정 환자 선택 시의 경로 */}
          <Route path=":patientId" element={<DoctorDashboard />} />
        </Route>

        {/* === 리다이렉트 설정 === */}
        {/* '/' 접속 시 로그인으로 이동 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 잘못된 모든 경로는 로그인 페이지로 이동 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;