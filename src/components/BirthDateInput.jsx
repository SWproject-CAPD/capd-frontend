import React from 'react';
import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN, isValidBirthDateParts } from '../utils/birthDate';

const years = Array.from(
  { length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 },
  (_, index) => String(BIRTH_YEAR_MIN + index),
);
const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
const days = Array.from({ length: 31 }, (_, index) => String(index + 1));

function BirthDatePartInput({
  value,
  onChange,
  placeholder,
  listId,
  options,
  maxLength,
  ariaLabel,
}) {
  return (
    <div className="relative min-w-0">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
        list={listId}
        inputMode="numeric"
        maxLength={maxLength}
        aria-label={ariaLabel}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-blue-500"
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

export default function BirthDateInput({ value, onChange, showError = false, idPrefix = 'birth-date' }) {
  const isInvalid = showError && !isValidBirthDateParts(value);
  const updatePart = (key, nextValue) => onChange({ ...value, [key]: nextValue });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">생년월일</label>
      <div className="grid grid-cols-[1fr_0.75fr_0.75fr] gap-2">
        <BirthDatePartInput
          value={value.year}
          onChange={(nextValue) => updatePart('year', nextValue)}
          placeholder="년(4자)"
          listId={`${idPrefix}-years`}
          options={years}
          maxLength={4}
          ariaLabel="출생 연도"
        />
        <BirthDatePartInput
          value={value.month}
          onChange={(nextValue) => updatePart('month', nextValue)}
          placeholder="월"
          listId={`${idPrefix}-months`}
          options={months}
          maxLength={2}
          ariaLabel="출생 월"
        />
        <BirthDatePartInput
          value={value.day}
          onChange={(nextValue) => updatePart('day', nextValue)}
          placeholder="일"
          listId={`${idPrefix}-days`}
          options={days}
          maxLength={2}
          ariaLabel="출생 일"
        />
      </div>
      {isInvalid && <p className="text-xs font-bold text-red-500">잘못된 입력</p>}
    </div>
  );
}
