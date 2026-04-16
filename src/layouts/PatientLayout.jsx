import React from 'react';
import { Outlet, useNavigate, NavLink, Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function PatientLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/patient', label: '홈 대시보드', icon: '🏠', exact: true },
    { path: '/patient/record', label: '투석 기록하기', icon: '📝' },
    { path: '/patient/chat', label: '증상 상담하기', icon: '🤖' },
    { path: '/patient/survey', label: '건강 설문 조사', icon: '📋' },
    { path: '/patient/record_list', label: '투석 기록보기', icon: '📈' },
    { path: '/patient/schedule', label: '방문 일정 확인', icon: '📅' },
  ];

  return (
    // 모바일 하단 탭바 공간을 위해 pb-16(padding-bottom)을 주고, PC(md)에서는 pb-0으로 원복
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-gray-900 overflow-hidden relative pb-16 md:pb-0">
      
      {/* 상단 헤더 */}
      <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex justify-between items-center z-30 shrink-0 shadow-sm">
        <Link to="/patient" className="flex items-center gap-2 md:gap-3 group">
          <div className="w-8 h-8 md:w-9 md:h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg md:text-xl shadow-md group-hover:scale-105 transition-transform">
            C
          </div>
          <div className="text-lg md:text-xl font-bold tracking-tight text-gray-800">
            CAPD Care <span className="hidden md:inline font-medium text-blue-600 text-base ml-1">환자 포털</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 py-1.5 md:px-3 rounded-full border border-gray-100">
            <span className="text-base md:text-lg">😊</span>
            <span className="font-semibold text-xs md:text-sm text-slate-700">{user?.name || '김환자'}님</span>
          </div>
          <div className="h-4 md:h-5 w-px bg-gray-300"></div>
          <button 
            onClick={handleLogout} 
            className="text-xs md:text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 바디 */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* PC : 좌측 사이드바 */}
        {/* hidden md:flex 로 설정 모바일에서는 숨기고, md 이상에서만 나타남 */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0 py-6 z-20 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.05)]">
          <div className="px-6 mb-6">
            <div className="text-xs font-bold text-blue-500 tracking-wider mb-1">QUICK MENU</div>
            <h2 className="text-lg font-black text-gray-800">바로가기</h2>
          </div>
          
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                      : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          
        </aside>
        
        {/* 우측 메인 콘텐츠 영역 */}
        {/*  좌우 여백(p-4 md:p-8)을 기기 사이즈에 맞게 조절함 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
          <div className="max-w-5xl mx-auto h-full">
            <Outlet /> 
          </div>
        </main>
        
      </div>

      {/* 모바일 환경 : 하단 바 */}
      {/* md:hidden 으로 설정하여 PC에서는 숨기고, 모바일 환경에서만 화면 최하단에 고정됨 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-2 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-2xl ${isActive ? 'scale-110 transition-transform' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  );
}