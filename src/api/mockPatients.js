// 30일치 가짜 투석/건강 데이터를 생성하는 헬퍼 함수
const generateHistory = (baseWeight) => {
  const history = [];
  let currentWeight = baseWeight;
  const today = new Date('2026-04-22'); // 기준일

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const monthDay = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // 약간의 랜덤 변동 추가
    currentWeight += (Math.random() - 0.5) * 0.6; 
    const sys = Math.floor(120 + Math.random() * 20); // 수축기 혈압 (120~139)
    const dia = Math.floor(80 + Math.random() * 15);  // 이완기 혈압 (80~94)
    const uf = Math.floor(800 + Math.random() * 500); // 제수량 (800~1299)

    history.push({
      date: dateStr,
      displayDate: monthDay,
      weight: Number(currentWeight.toFixed(1)),
      bpSystolic: sys,
      bpDiastolic: dia,
      bp: `${sys}/${dia}`,
      uf: uf,
      // 가상의 매 회차(4회) 교환 데이터
      exchanges: [
        { time: '08:30', concentration: '1.5', infused: 2000, drained: 2000 + Math.floor(uf * 0.3), uf: Math.floor(uf * 0.3) },
        { time: '13:00', concentration: '2.5', infused: 2000, drained: 2000 + Math.floor(uf * 0.4), uf: Math.floor(uf * 0.4) },
        { time: '18:15', concentration: '1.5', infused: 2000, drained: 2000 + Math.floor(uf * 0.2), uf: Math.floor(uf * 0.2) },
        { time: '22:40', concentration: '2.5', infused: 2000, drained: 2000 + Math.floor(uf * 0.1), uf: Math.floor(uf * 0.1) },
      ]
    });
  }
  return history; // index 0이 오늘(가장 최신), 29가 한 달 전
};

// 기본 환자 10명 명단 생성
const basePatients = [
  { id: 'P001', name: '김환자', sex: '남', age: 45, time: '09:00', status: 'waiting', bloodType: 'A+', capdStartDate: '2025-01-15', doctor: '이의사', baseWeight: 65 },
  { id: 'P002', name: '이환자', sex: '여', age: 52, time: '09:30', status: 'waiting', bloodType: 'B+', capdStartDate: '2024-11-20', doctor: '김의사', baseWeight: 58 },
  { id: 'P003', name: '박환자', sex: '남', age: 61, time: '10:00', status: 'completed', bloodType: 'O+', capdStartDate: '2023-05-10', doctor: '최의사', baseWeight: 72 },
  { id: 'P004', name: '최환자', sex: '여', age: 38, time: '10:30', status: 'waiting', bloodType: 'AB+', capdStartDate: '2026-02-01', doctor: '이의사', baseWeight: 55 },
  { id: 'P005', name: '배환자', sex: '남', age: 70, time: '11:00', status: 'completed', bloodType: 'A+', capdStartDate: '2022-08-14', doctor: '김의사', baseWeight: 68 },
  { id: 'P006', name: '강환자', sex: '여', age: 48, time: '13:30', status: 'waiting', bloodType: 'B-', capdStartDate: '2025-07-22', doctor: '최의사', baseWeight: 60 },
  { id: 'P007', name: '조환자', sex: '남', age: 55, time: '14:00', status: 'waiting', bloodType: 'O+', capdStartDate: '2024-03-05', doctor: '이의사', baseWeight: 75 },
  { id: 'P008', name: '윤환자', sex: '여', age: 63, time: '14:30', status: 'completed', bloodType: 'A-', capdStartDate: '2025-10-11', doctor: '김의사', baseWeight: 62 },
  { id: 'P009', name: '임환자', sex: '남', age: 41, time: '15:00', status: 'waiting', bloodType: 'AB+', capdStartDate: '2026-01-30', doctor: '최의사', baseWeight: 70 },
  { id: 'P010', name: '한환자', sex: '여', age: 59, time: '15:30', status: 'completed', bloodType: 'O-', capdStartDate: '2023-12-01', doctor: '이의사', baseWeight: 53 },
];

// 각 환자에게 30일치 데이터와 DoctorHome용 lastDialysis 필드 부착
export const patientsData = basePatients.map(patient => {
  const history = generateHistory(patient.baseWeight);
  return {
    ...patient,
    history,
    lastDialysis: history[0].date, // 오늘 날짜를 마지막 투석일로 지정
  };
});