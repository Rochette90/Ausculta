export function isMissingQuestionImageColumns(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42703"
    || error.code === "PGRST204"
    || /column questions\.(image_url|image_alt).*does not exist/i.test(error.message ?? "");
}
