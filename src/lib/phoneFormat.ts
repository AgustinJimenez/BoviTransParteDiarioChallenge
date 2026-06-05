// 3-digit country codes (checked first — greedy longest match)
const CC3 = new Set([
  "500","501","502","503","504","505","506","507","508","509",
  "590","591","592","593","594","595","596","597","598","599",
  "350","351","352","353","354","355","356","357","358","359",
  "370","371","372","373","374","375","376","377","378","379",
  "380","381","382","383","385","386","387","388","389",
  "420","421","423",
  "500","508","590","592","594","596","597","599",
  "670","672","673","674","675","676","677","678","679",
  "680","681","682","683","685","686","687","688","689",
  "690","691","692",
  "850","852","853","855","856",
  "880","886",
  "960","961","962","963","964","965","966","967","968",
  "970","971","972","973","974","975","976","977","978","979",
  "992","993","994","995","996","998",
  "212","213","216","218",
  "220","221","222","223","224","225","226","227","228","229",
  "230","231","232","233","234","235","236","237","238","239",
  "240","241","242","243","244","245","246","247","248","249",
  "250","251","252","253","254","255","256","257","258","259",
  "260","261","262","263","264","265","266","267","268","269",
  "290","291","297","298","299",
]);

// 2-digit country codes
const CC2 = new Set([
  "20","27",
  "30","31","32","33","34","36","39",
  "40","41","43","44","45","46","47","48","49",
  "51","52","53","54","55","56","57","58",
  "60","61","62","63","64","65","66",
  "81","82","84","86",
  "90","91","92","93","94","95","98",
]);

export const formatInternationalPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length >= 3 && CC3.has(digits.slice(0, 3))) {
    const cc = digits.slice(0, 3);
    const rest = digits.slice(3);
    return rest ? `+${cc} ${rest}` : `+${cc}`;
  }
  if (digits.length >= 2 && CC2.has(digits.slice(0, 2))) {
    const cc = digits.slice(0, 2);
    const rest = digits.slice(2);
    return rest ? `+${cc} ${rest}` : `+${cc}`;
  }
  if (digits[0] === "1") {
    const rest = digits.slice(1);
    return rest ? `+1 ${rest}` : "+1";
  }

  return `+${digits}`;
};

// Argentine mobile format — kept for backwards compat with existing data
const stripArgentinePrefix = (digits: string): string => {
  if (digits.startsWith("549")) return digits.slice(3);
  if (digits.startsWith("54"))  return digits.slice(2);
  if (digits.startsWith("9"))   return digits.slice(1);
  return digits;
};

export const formatArgentinePhone = (raw: string): string => {
  const d = stripArgentinePrefix(raw.replace(/\D/g, "")).slice(0, 10);
  if (!d) return "";
  if (d.length <= 3) return `+54 9 ${d}`;
  if (d.length <= 6) return `+54 9 ${d.slice(0, 3)} ${d.slice(3)}`;
  return `+54 9 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
};
