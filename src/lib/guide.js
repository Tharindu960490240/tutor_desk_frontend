// User guide PDFs live in public/guide/ and are served as static files.
const FILE = { en: "English", si: "Sinhala", ta: "Tamil" };

/** Guide in the app's current language (falls back to English). */
export const guideUrl = lang => `/guide/TutorDesk-Guide-${FILE[lang] || FILE.en}.pdf`;

/** One PDF with English, Sinhala and Tamil one after another. */
export const guideAllUrl = "/guide/TutorDesk-User-Guide.pdf";
