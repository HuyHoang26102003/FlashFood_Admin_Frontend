export function limitCharacters(text: string, maxLength: number): string {
  // Kiểm tra input
  if (!text || maxLength <= 0) return "";
  if (maxLength <= 3) return "...";

  // Nếu chuỗi ngắn hơn hoặc bằng maxLength, trả về nguyên bản
  if (text.length <= maxLength) return text;

  // Cắt chuỗi và thêm "..."
  return text.slice(0, maxLength - 3) + "...";
}
