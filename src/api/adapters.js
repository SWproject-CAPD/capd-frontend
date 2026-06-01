export const EMPTY_TEXT = '-';

export const pad2 = (value) => String(value).padStart(2, '0');

export const toDateKey = (date = new Date()) => {
  const normalized = date instanceof Date ? date : new Date(date);
  return `${normalized.getFullYear()}-${pad2(normalized.getMonth() + 1)}-${pad2(normalized.getDate())}`;
};

export const parseDateKey = (dateValue = new Date()) => {
  if (dateValue instanceof Date) {
    return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
  }

  const [datePart] = String(dateValue).split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return new Date();

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const addDays = (dateValue, dayCount) => {
  const date = parseDateKey(dateValue);
  date.setDate(date.getDate() + dayCount);
  return date;
};

export const getDateRangeKeys = (startDate, endDate) => {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const dates = [];

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    dates.push(toDateKey(cursor));
  }

  return dates;
};

export const toKoreanDate = (dateValue) => {
  if (!dateValue) return EMPTY_TEXT;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

export const toMonthDay = (dateValue) => {
  if (!dateValue) return EMPTY_TEXT;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue).slice(5, 10);
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

export const toDateTimeInputValue = (dateKey, timeValue = '09:00') => {
  const time = typeof timeValue === 'string' ? timeValue.slice(0, 5) : '09:00';
  return `${dateKey}T${time}:00`;
};

export const splitDateTime = (dateTimeValue) => {
  if (!dateTimeValue) {
    return { date: EMPTY_TEXT, time: EMPTY_TEXT, dateTime: null };
  }

  const normalized = String(dateTimeValue);
  const [date = EMPTY_TEXT, rawTime = EMPTY_TEXT] = normalized.split('T');
  return {
    date,
    time: rawTime.slice(0, 5) || EMPTY_TEXT,
    dateTime: normalized,
  };
};

export const localTimeToString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 5);
  return `${pad2(value.hour ?? 0)}:${pad2(value.minute ?? 0)}`;
};

export const normalizeSex = (sex) => {
  if (sex === 'M' || sex === 'male' || sex === '남') return '남';
  if (sex === 'F' || sex === 'female' || sex === '여') return '여';
  return sex || EMPTY_TEXT;
};

export const toApiSex = (gender) => {
  if (gender === 'female' || gender === 'F' || gender === '여') return 'F';
  return 'M';
};

export const parseOptions = (options) => {
  if (Array.isArray(options)) return options;
  if (!options) return [];

  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(options)
      .split(',')
      .map(option => option.trim())
      .filter(Boolean);
  }
};

export const normalizePatient = (patient = {}) => ({
  id: patient.patientId,
  patientId: patient.patientId,
  userId: patient.userId,
  name: patient.name || patient.patientName || EMPTY_TEXT,
  email: patient.email || EMPTY_TEXT,
  phone: patient.phone || EMPTY_TEXT,
  sex: normalizeSex(patient.sex),
  age: patient.age ?? EMPTY_TEXT,
  role: patient.role,
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

export const normalizeDoctor = (doctor = {}) => ({
  id: doctor.doctorId,
  doctorId: doctor.doctorId,
  userId: doctor.userId,
  name: doctor.name || doctor.userName || doctor.doctorName || EMPTY_TEXT,
  email: doctor.email || EMPTY_TEXT,
  phone: doctor.phone || EMPTY_TEXT,
  role: doctor.role,
  licenseId: doctor.licenseId,
  createdAt: doctor.createdAt,
  updatedAt: doctor.updatedAt,
});

export const normalizeSession = (session = {}, index = 0) => {
  const infused = Number(session.infusedFluidWeight ?? 0);
  const drained = Number(session.drainVolume ?? 0);
  const uf = Number(session.ultrafiltration ?? drained - infused);

  return {
    id: session.capdSessionId,
    capdSessionId: session.capdSessionId,
    sessionNumber: session.sessionNumber ?? index + 1,
    time: localTimeToString(session.exchangeTime),
    exchangeTime: localTimeToString(session.exchangeTime),
    concentration: String(session.dialysateConcentration ?? ''),
    dialysateConcentration: Number(session.dialysateConcentration ?? 0),
    infused,
    infusedFluidWeight: infused,
    drained,
    drainVolume: drained,
    uf,
    ultrafiltration: uf,
  };
};

export const normalizeCapd = (record = {}) => {
  const sessions = (record.sessions || [])
    .map(normalizeSession)
    .sort((a, b) => (a.sessionNumber ?? 0) - (b.sessionNumber ?? 0));
  const sys = record.bloodPressureSys ?? '';
  const dia = record.bloodPressureDia ?? '';

  return {
    id: record.capdId,
    capdId: record.capdId,
    date: record.date,
    displayDate: toMonthDay(record.date),
    cloudyDialysate: Boolean(record.cloudyDialysate),
    turbidity: record.cloudyDialysate ? '혼탁' : '맑음',
    urineCount: record.urinationCount ?? '',
    urinationCount: record.urinationCount ?? '',
    totalUf: Number(record.totalUltrafiltration ?? sessions.reduce((sum, item) => sum + item.uf, 0)),
    uf: Number(record.totalUltrafiltration ?? sessions.reduce((sum, item) => sum + item.uf, 0)),
    weight: record.bodyWeight ?? '',
    bodyWeight: record.bodyWeight ?? '',
    bpSystolic: sys,
    bpDiastolic: dia,
    bloodPressureSys: sys,
    bloodPressureDia: dia,
    bp: sys || dia ? `${sys}/${dia}` : EMPTY_TEXT,
    fbs: record.fastingBloodSugar ?? '',
    fastingBloodSugar: record.fastingBloodSugar ?? '',
    memo: record.note || '',
    note: record.note || '',
    status: record.status || '',
    exchanges: sessions,
    sessions,
  };
};

export const toCapdPayload = ({ date, dailyInfo, exchanges }) => ({
  date,
  cloudyDialysate: dailyInfo.turbidity === '혼탁' || Boolean(dailyInfo.cloudyDialysate),
  urinationCount: Number(dailyInfo.urineCount || dailyInfo.urinationCount || 0),
  bodyWeight: Number(dailyInfo.weight || dailyInfo.bodyWeight || 0),
  bloodPressureSys: Number(dailyInfo.bpSystolic || dailyInfo.bloodPressureSys || 0),
  bloodPressureDia: Number(dailyInfo.bpDiastolic || dailyInfo.bloodPressureDia || 0),
  fastingBloodSugar: Number(dailyInfo.fbs || dailyInfo.fastingBloodSugar || 0),
  note: dailyInfo.memo || dailyInfo.note || '',
  sessions: (exchanges || []).map((exchange, index) => ({
    sessionNumber: exchange.sessionNumber ?? index + 1,
    exchangeTime: exchange.time || exchange.exchangeTime || '00:00',
    drainVolume: Number(exchange.drained ?? exchange.drainVolume ?? 0),
    dialysateConcentration: Number(exchange.concentration ?? exchange.dialysateConcentration ?? 0),
    infusedFluidWeight: Number(exchange.infused ?? exchange.infusedFluidWeight ?? 0),
  })),
});

export const normalizeReservation = (reservation = {}) => {
  const { date, time, dateTime } = splitDateTime(reservation.reservationDate);

  return {
    id: reservation.reservationId,
    reservationId: reservation.reservationId,
    patientId: reservation.patientId,
    patientName: reservation.patientName || EMPTY_TEXT,
    doctorId: reservation.doctorId,
    doctorName: reservation.doctorName || EMPTY_TEXT,
    phone: reservation.phone || EMPTY_TEXT,
    reservationDate: reservation.reservationDate,
    date,
    time,
    dateTime,
    type: reservation.type || '진료 예약',
    status: reservation.status || 'confirmed',
  };
};

export const normalizeQuestion = (question = {}) => ({
  id: question.questionId,
  questionId: question.questionId,
  reservationId: question.reservationId,
  reservationDate: question.reservationDate,
  patientId: question.patientId,
  patientName: question.patientName,
  text: question.question || '',
  question: question.question || '',
  type: question.type || '',
  options: parseOptions(question.options),
  reason: question.questionReason || '',
  questionReason: question.questionReason || '',
  status: question.status ? String(question.status).toUpperCase() : 'PENDING',
  createdAt: question.createdAt,
});

export const normalizeAnswer = (answer = {}) => {
  const questionData = typeof answer.question === 'object' ? answer.question : answer.surveyQuestion;
  const questionText = typeof answer.question === 'string'
    ? answer.question
    : questionData?.question || answer.questionText || '';

  return {
    id: answer.answerId || answer.id,
    answerId: answer.answerId || answer.id,
    questionId: answer.questionId || answer.surveyQuestionId || questionData?.questionId || questionData?.id,
    patientId: answer.patientId,
    patientName: answer.patientName,
    question: questionText,
    answer: answer.answer ?? answer.content ?? answer.response ?? answer.value ?? '',
    createdAt: answer.createdAt,
  };
};

export const normalizeChatMessagePair = (chat = {}) => ([
  {
    id: `${chat.chatId || chat.displayOrder || Date.now()}-user`,
    sender: 'user',
    text: chat.userText || '',
    createdAt: chat.createdAt,
  },
  {
    id: `${chat.chatId || chat.displayOrder || Date.now()}-bot`,
    sender: 'bot',
    text: chat.aiText || '',
    createdAt: chat.createdAt,
  },
]);

export const normalizeReport = (report = {}) => ({
  id: report.reportId,
  reportId: report.reportId,
  title: '주간 AI 보고서',
  period: `${report.startDate || EMPTY_TEXT} ~ ${report.endDate || EMPTY_TEXT}`,
  doctorId: report.doctorId,
  doctorName: report.doctorName || EMPTY_TEXT,
  patientId: report.patientId,
  patientName: report.patientName || EMPTY_TEXT,
  startDate: report.startDate,
  endDate: report.endDate,
  docSaveLocation: report.docSaveLocation,
  riskLevel: report.anomalySummary ? '확인 필요' : '분석 완료',
  summary: report.docSummary || '보고서 요약이 없습니다.',
  vitals: [
    { label: '체중 요약', value: report.weightSummary || EMPTY_TEXT, status: 'normal' },
    { label: '혈압 요약', value: report.bpSummary || EMPTY_TEXT, status: 'normal' },
    { label: '공복혈당 요약', value: report.bloodSugarSummary || EMPTY_TEXT, status: 'normal' },
  ],
  analysis: [
    report.ufSummary,
    report.anomalySummary,
    report.docSummary,
  ].filter(Boolean),
  recommendation: report.docSummary || '의료진 판단에 따라 추적 관찰하십시오.',
});

export const normalizeAnomaly = (result = {}) => ({
  id: result.anomalyId,
  anomalyId: result.anomalyId,
  analysisDate: result.analysisDate,
  riskLevel: result.riskLevel,
  anomalyScore: result.anomalyScore,
  statusMessage: result.statusMessage || EMPTY_TEXT,
  topCauses: parseOptions(result.topCauses),
});
