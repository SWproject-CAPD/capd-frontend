import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function LoginPage() {
  const [isDoctor, setIsDoctor] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // 실제 API 연동 전 테스트용 로직
    const role = isDoctor ? 'doctor' : 'patient';
    setUser({ name: isDoctor ? '김의사' : '이환자', role });
    navigate(isDoctor ? '/doctor' : '/patient');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-blue-600 mb-2">CAPD Care</h1>
          <p className="text-gray-500">복막투석 환자 맞춤형 관리 시스템</p>
        </div>

        {/* 유저 타입 선택 탭 */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isDoctor ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsDoctor(false)}
          >
            환자 로그인
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isDoctor ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            onClick={() => setIsDoctor(true)}
          >
            의사 로그인
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label={isDoctor ? "의사번호" : "이메일"}
            placeholder={isDoctor ? "의사번호를 입력하세요" : "example@mail.com"}
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full py-3 text-lg mt-2">
            로그인
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500 mb-4">아직 계정이 없으신가요?</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => navigate('/register/patient')}>
              환자 회원가입
            </Button>
            <Button variant="outline" onClick={() => navigate('/register/doctor')}>
              의사 회원가입
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}