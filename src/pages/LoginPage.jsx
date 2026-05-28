import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { authApi } from '../api/apiClient';

export default function LoginPage() {
  const [isDoctor, setIsDoctor] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const role = isDoctor ? 'doctor' : 'patient';
      const response = isDoctor
        ? await authApi.loginDoctor({ licenseId: id, password })
        : await authApi.loginPatient({ email: id, password });

      setSession(role, response);
      navigate(isDoctor ? '/doctor' : '/patient');
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full py-3 text-lg mt-2">
            {isLoading ? '로그인 중' : '로그인'}
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
