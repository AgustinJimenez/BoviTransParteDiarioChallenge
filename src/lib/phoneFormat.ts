const stripPhonePrefix = (digits: string): string => {
  if (digits.startsWith("549")) return digits.slice(3);
  if (digits.startsWith("54"))  return digits.slice(2);
  if (digits.startsWith("9"))   return digits.slice(1);
  return digits;
};

export const formatArgentinePhone = (raw: string): string => {
  const d = stripPhonePrefix(raw.replace(/\D/g, "")).slice(0, 10);
  if (!d) return "";
  if (d.length <= 3) return `+54 9 ${d}`;
  if (d.length <= 6) return `+54 9 ${d.slice(0, 3)} ${d.slice(3)}`;
  return `+54 9 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
};
