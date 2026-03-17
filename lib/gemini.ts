import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY環境変数が設定されていません");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 画像からセットリスト（曲名）を抽出します
 * @param file - 画像ファイル（File オブジェクト）
 * @returns セットリストの曲名の配列
 */
export async function extractSetlistFromImage(file: File): Promise<string[]> {
  // FileReader を使用して安全に base64 に変換
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/png;base64," のようなプレフィックスを削除
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  // Gemini API にリクエストを送信
  const message =
    "この画像に含まれるセットリスト（曲名）を抽出し、JSONの配列形式 [\"曲名1\", \"曲名2\"] で返してください。曲名のみをJSON配列形式で返してください。";

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: file.type,
        data: base64,
      },
    },
    message,
  ]);

  const response = result.response.text();

  // レスポンスから JSON 適哲を抽出
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("ガイドが反応内容からセトリスト初客を抽出できませんでした");
  }

  const setlist = JSON.parse(jsonMatch[0]) as string[];
  return setlist;
}
