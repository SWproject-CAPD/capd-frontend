import React, { useState } from 'react';
import useAiAgent from '../../hooks/useAiAgent';

export default function DoctorChatPage({ currentPatient }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    inputValue,
    setInputValue,
    isSending,
    messagesEndRef,
    sendMessage,
    error,
  } = useAiAgent({
    role: 'doctor',
    patientId: currentPatient?.id,
    autoLoad: isOpen,
  });

  const contextLabel = currentPatient
    ? `${currentPatient.name} 환자 컨텍스트`
    : '전체 진료 컨텍스트';

  const contextDescription = currentPatient
    ? `${currentPatient.sex}/${currentPatient.age}세 · ${currentPatient.phone}`
    : '환자를 선택하면 해당 환자 기록을 기준으로 대화합니다.';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full rounded-t-3xl bg-slate-900 px-4 py-4 text-left text-white shadow-2xl transition-all hover:bg-slate-800 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">
              Doctor Assistant
            </div>
            <div className="mt-1 text-lg font-black">AI 진료 도우미</div>
            <div className="mt-1 text-xs font-medium text-slate-400">
              환자 기록, 설문, 예약을 바탕으로 질문
            </div>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black shadow-lg">
            AI
          </div>
        </div>
      </button>

      {isOpen && (
        <section className="absolute bottom-full right-0 z-40 mb-3 flex h-130 w-90 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="shrink-0 border-b border-slate-100 bg-slate-900 px-4 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                  AI 진료 도우미
                </div>
                <h2 className="mt-1 text-base font-black">{contextLabel}</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
                  {contextDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              >
                X
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-100 bg-blue-50 px-4 py-3">
            <div className="text-[10px] font-black text-blue-600">현재 참조 범위</div>
            <div className="mt-1 text-xs font-bold leading-relaxed text-blue-800">
              {currentPatient
                ? `${currentPatient.name} 환자의 기록, 설문, 예약 정보를 우선 참조합니다.`
                : '특정 환자를 선택한 뒤 질문을 전송할 수 있습니다.'}
            </div>
            {error && (
              <div className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {error.message}
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 custom-scrollbar">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[10px] font-black text-white">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${
                    message.sender === 'user'
                      ? 'rounded-br-none bg-blue-600 text-white'
                      : 'rounded-bl-none border border-slate-100 bg-white text-slate-700'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="shrink-0 border-t border-slate-100 bg-white p-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentPatient ? `${currentPatient.name} 환자에 대해 질문` : '환자를 선택해 주세요'}
                disabled={!currentPatient}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 disabled:text-slate-400"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || !currentPatient || isSending}
                className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {isSending ? '전송중' : '전송'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
