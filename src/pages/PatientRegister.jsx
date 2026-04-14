import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function PatientRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',           // 이메일
    password: '',        // 비밀번호
    confirmPassword: '',    // 비밀번호 확인
    name: '',            // 이름
    birthDate: '',       // 생년월일
    phone: '',           // 전화번호
    gender: 'male'       // 성별 (기본값 남성)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    // 가입 데이터 확인용 로그
    console.log("환자 가입 데이터:", formData);
    
    alert("환자 회원가입이 완료되었습니다. 로그인해주세요.");
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">환자 회원가입</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <Input 
            label="이름" 
            name="name" 
            placeholder="성함을 입력하세요" 
            onChange={handleChange} 
            required 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="생년월일" 
              name="birthDate" 
              type="date" 
              onChange={handleChange} 
              required 
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">성별</label>
              <select
                name="gender"
                className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white"
                onChange={handleChange}
                value={formData.gender}
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>
          </div>

          <Input 
            label="전화번호" 
            name="phone" 
            placeholder="010-0000-0000" 
            onChange={handleChange} 
            required 
          />

          <Input 
            label="이메일" 
            name="email" 
            type="email" 
            placeholder="example@mail.com" 
            onChange={handleChange} 
            required 
          />

          <Input 
            label="비밀번호" 
            name="password" 
            type="password" 
            placeholder="8자 이상 입력" 
            onChange={handleChange} 
            required 
          />
          
          <Input 
            label="비밀번호 확인" 
            name="confirmPassword" 
            type="password" 
            placeholder="비밀번호 재입력" 
            onChange={handleChange} 
            required 
          />
          
          <div className="pt-4 flex flex-col gap-3">
            <Button type="submit" className="w-full py-3 text-lg">가입 완료</Button>
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
              이전으로
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}