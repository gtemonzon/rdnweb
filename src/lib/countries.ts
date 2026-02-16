export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Spanish name
  dialCode: string;   // e.g. "+502"
  flag: string;       // emoji flag
  phoneLength?: number; // expected national digits (for basic validation)
}

export const countries: Country[] = [
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹", phoneLength: 8 },
  { code: "MX", name: "México", dialCode: "+52", flag: "🇲🇽", phoneLength: 10 },
  { code: "US", name: "Estados Unidos", dialCode: "+1", flag: "🇺🇸", phoneLength: 10 },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻", phoneLength: 8 },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳", phoneLength: 8 },
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮", phoneLength: 8 },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷", phoneLength: 8 },
  { code: "PA", name: "Panamá", dialCode: "+507", flag: "🇵🇦", phoneLength: 8 },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", phoneLength: 10 },
  { code: "PE", name: "Perú", dialCode: "+51", flag: "🇵🇪", phoneLength: 9 },
  { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨", phoneLength: 9 },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", phoneLength: 9 },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", phoneLength: 10 },
  { code: "BR", name: "Brasil", dialCode: "+55", flag: "🇧🇷", phoneLength: 11 },
  { code: "ES", name: "España", dialCode: "+34", flag: "🇪🇸", phoneLength: 9 },
  { code: "BZ", name: "Belice", dialCode: "+501", flag: "🇧🇿", phoneLength: 7 },
  { code: "DO", name: "República Dominicana", dialCode: "+1", flag: "🇩🇴", phoneLength: 10 },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪", phoneLength: 10 },
  { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴", phoneLength: 8 },
  { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾", phoneLength: 9 },
  { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾", phoneLength: 8 },
  { code: "CA", name: "Canadá", dialCode: "+1", flag: "🇨🇦", phoneLength: 10 },
  { code: "DE", name: "Alemania", dialCode: "+49", flag: "🇩🇪", phoneLength: 11 },
  { code: "FR", name: "Francia", dialCode: "+33", flag: "🇫🇷", phoneLength: 9 },
  { code: "GB", name: "Reino Unido", dialCode: "+44", flag: "🇬🇧", phoneLength: 10 },
  { code: "IT", name: "Italia", dialCode: "+39", flag: "🇮🇹", phoneLength: 10 },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

/** Strip non-digits, prepend dial code → E.164 */
export function toE164(nationalNumber: string, dialCode: string): string {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return "";
  return `${dialCode}${digits}`;
}

/** Basic validation: only digits, length matches expected */
export function isPlausiblePhone(nationalNumber: string, country: Country): boolean {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return true; // empty is ok (phone is optional)
  if (!country.phoneLength) return digits.length >= 7;
  return digits.length === country.phoneLength;
}

/** Departments / states by country code (extend as needed) */
export const departmentsByCountry: Record<string, string[]> = {
  GT: [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula",
    "El Progreso", "Escuintla", "Guatemala", "Huehuetenango",
    "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango",
    "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos",
    "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa",
  ],
};
