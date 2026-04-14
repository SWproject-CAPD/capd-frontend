import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function PatientLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="text-xl font-black text-blue-600 tracking-tight">
          CAPD Care <span className="text-sm font-medium text-gray-400 ml-2">환자 포털</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {user?.name?.[0] || '환'}
          </div>
          <span className="text-gray-700 font-semibold hidden sm:inline">{user?.name || '환자'} 님</span>
          <button 
            onClick={handleLogout} 
            className="text-sm text-gray-500 hover:text-red-500 font-medium transition-colors ml-2"
          >
            로그아웃
          </button>
        </div>
      </header>
      
      {/* 환자 페이지는 폭을 제한하여 읽기 편하게 구성 (max-w-3xl) */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}