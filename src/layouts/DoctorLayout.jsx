import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { patientsData } from '../api/mockPatients'; // 공통 데이터 불러오기

export default function DoctorLayout() {
  const { user, logout } = useAppStore();
  const navigate = useNavigate();

  const [patientTab, setPatientTab] = useState('today');
  const [sortBy, setSortBy] = useState('name');
  
  // 환자 검색을 위한 상태 추가
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 

  // 공통 환자 데이터
  const patients = patientsData;

  // 우측 예약 리스트 데이터 (공통 데이터 연동 및 시간순 정렬)
  const scheduledPatients = [...patients].sort((a, b) => a.time.localeCompare(b.time));

  // 다가오는 다음 진료 환자 찾기 (상태가 'waiting'인 가장 빠른 시간의 환자)
  const nextPatient = scheduledPatients.find(p => p.status === 'waiting') || scheduledPatients[0];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate(); 
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 좌측 환자 리스트 필터/정렬 로직
  let displayedPatients = patients;

  // 검색어 필터링 로직 (나중에 백엔드 API 호출로 변경)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    displayedPatients = displayedPatients.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.id.toLowerCase().includes(query) || 
      p.age.toString().includes(query) || 
      p.sex.includes(query)
    );
  }

  // 정렬 로직
  if (sortBy === 'name') {
    displayedPatients = [...displayedPatients].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'age') {
    displayedPatients = [...displayedPatients].sort((a, b) => b.age - a.age); // 나이 많은 순
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden font-sans text-slate-900">
      
      {/* === 상단 헤더 === */}
      <header className="h-14 bg-slate-900 text-white px-4 flex justify-between items-center z-30 shrink-0 shadow-lg">
        <Link to="/doctor" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xl">✚</div>
          <div className="text-lg font-bold tracking-tight">
            CAPD <span className="font-light text-slate-400">EMR System</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{user?.name || '담당의'} 선생님</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1 rounded-md transition-all">
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 바디 */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* 좌측 사이드바 */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-sm">
          <div className="p-3 border-b space-y-3 bg-slate-50">
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button 
                onClick={() => setPatientTab('today')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${patientTab === 'today' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                오늘 진료
              </button>
              <button 
                onClick={() => setPatientTab('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${patientTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                환자 목록
              </button>
            </div>

            {/* 환자 조회 검색창 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="이름, 번호, 나이, 성별 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[11px] font-bold text-gray-400">PATIENT LIST</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[11px] bg-transparent font-bold text-blue-600 cursor-pointer outline-none"
              >
                <option value="name">이름순</option>
                <option value="age">나이순</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {displayedPatients.length > 0 ? (
              displayedPatients.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => navigate(`/doctor/${p.id}`)}
                  className="w-full text-left p-3 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-800">{p.name}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{p.id}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">{p.sex}/{p.age}세</span>
                      <span className="text-[11px] text-gray-500">최근: {p.lastDialysis}</span>
                    </div>
                    <span className={`text-[11px] font-bold ${p.status === 'waiting' ? 'text-orange-500' : 'text-gray-400'}`}>
                      {p.status === 'waiting' ? `대기 (${p.time})` : '진료완료'}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 font-medium">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </aside>

        {/* 중앙: 메인 화면 */}
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          <Outlet />
        </main>

        {/* 우측: 캘린더/예약 사이드바 */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-gray-700">{year}년 {month + 1}월</h3>
              <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="text-gray-400 hover:text-gray-600 px-1">◀</button>
                <button onClick={handleNextMonth} className="text-gray-400 hover:text-gray-600 px-1">▶</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {['일','월','화','수','목','금','토'].map(d => (
                <span key={d} className="text-[10px] font-bold text-gray-400 mb-2">{d}</span>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`blank-${i}`} className="h-8"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                const hasAppointment = day % 4 === 0;

                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={`h-8 flex flex-col items-center justify-center text-[11px] rounded-md cursor-pointer hover:bg-blue-50 transition-colors ${
                      isSelected ? 'bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {day}
                    {hasAppointment && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-400'}`}></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
              <span className="text-xs font-bold text-gray-600">{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 예약 현황</span>
              <span className="text-xs text-blue-600 font-bold">{scheduledPatients.length}건</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 예약 환자 리스트 */}
              {scheduledPatients.map((sch) => (
                <div key={sch.id} className={`flex gap-3 items-start border-l-2 pl-3 py-1 ${sch.status === 'waiting' ? 'border-orange-400' : 'border-blue-200'}`}>
                  <span className={`text-xs font-bold w-10 mt-0.5 ${sch.status === 'waiting' ? 'text-orange-500' : 'text-gray-400'}`}>
                    {sch.time}
                  </span>
                  <div>
                    <button 
                      onClick={() => navigate(`/doctor/${sch.id}`)}
                      className="text-sm font-bold text-gray-800 hover:text-blue-600 hover:underline text-left transition-colors flex items-center gap-2"
                    >
                      {sch.name} 환자 
                      {sch.status === 'waiting' && <span className="text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">대기</span>}
                    </button>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{sch.id}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 다음 진료 환자 알림 */}
          {nextPatient && (
            <div className="p-4 bg-slate-900 text-white rounded-t-3xl shadow-2xl relative z-20">
              <div className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Upcoming Next</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-black">{nextPatient.time} <span className="text-sm font-normal text-slate-400">{nextPatient.name} 환자</span></div>
                  <div className="text-xs text-slate-400 mt-1">대기실에서 준비 중입니다.</div>
                </div>
                <button 
                  onClick={() => navigate(`/doctor/${nextPatient.id}`)}
                  className="bg-blue-600 p-3 rounded-full hover:bg-blue-500 transition-colors shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}