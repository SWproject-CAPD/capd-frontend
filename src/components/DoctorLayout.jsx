import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

export default function DoctorLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      <header className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center z-20 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded text-center leading-8 font-bold text-white">✚</div>
          <div className="text-lg font-bold tracking-wide">CAPD <span className="font-light text-slate-300">EMR System</span></div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍⚕️</span>
            <span className="font-medium text-slate-100">{user?.name || '담당의'} 선생님</span>
          </div>
          <div className="h-5 w-px bg-slate-700"></div>
          <button 
            onClick={handleLogout} 
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}