/**
 * 曲名を正規化（クレンジング）する強力な関数
 * 日本語特有の表記揺れ（ひらがな/カタカナ、各種記号、波ダッシュ）を完全に吸収
 * 同一曲を正確にカウントするためのキーを生成
 * 
 * 正規化処理の順序（重要）：
 * 1. NFKC正規化：全角英数字を半角に、濁点を結合
 * 2. 小文字統一：すべてのアルファベットを小文字に
 * 3. ひらがな→カタカナ変換：「あ」→「ア」など、日本語の表記揺れを統一
 * 4. 各種記号の統一：ハイフン、波ダッシュ、長音記号をすべて「-」に統一
 * 5. 特定曲の表記揺れ対策：「天下一品」の「一」「ー」などの表記揺れを統一
 * 6. 装飾記号削除：ハート、星、音符などの装飾記号を削除
 * 7. 空白完全削除：あらゆる空白文字を完全に削除
 */
export function normalizeSongTitle(title: string): string {
  if (!title) return '';

  let normalized = title
    .normalize('NFKC') // 1. 全角英数字を半角に、濁点を結合
    .toLowerCase();    // 2. アルファベットを小文字に統一

  // 3. ひらがなをすべてカタカナに変換（「ゔ」と「ヴ」、「あ」と「ア」を統一）
  normalized = normalized.replace(/[\u3041-\u3096]/g, function(match) {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });

  // 4. 長音記号、各種ハイフン、波ダッシュ（Mac/Winの違い含む）をすべて半角ハイフン「-」に統一
  normalized = normalized.replace(/[ー−―‐－~〜～]/g, '-');

  // 5. 特定曲の表記揺れ対策：「天下」と「品」の間にある「一」「ー」「1」などを統一
  // 「天下一品」「天下ー品」「天下1品」などを全て「天下品」に統一
  normalized = normalized.replace(/天下[一ー1-]+品/g, '天下品');

  // 6. 曲名の集計に不要な装飾記号（ハート、星、音符など）を完全に削除
  normalized = normalized.replace(/[♡♥❤☆★♪♫♬・]/g, '');

  // 7. あらゆる空白（半角、全角、タブ）を完全に削除
  normalized = normalized.replace(/[\s　]+/g, '');

  return normalized;
}

/**
 * 2つの文字列間のレーベンシュタイン距離（編集距離）を計算する関数
 * OCRのわずかな誤認識やタイポを検出するために使用
 * 
 * @param a 比較対象文字列1
 * @param b 比較対象文字列2
 * @returns 編集距離（0に近いほど似ている）
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 置換
          matrix[i][j - 1] + 1,     // 挿入
          matrix[i - 1][j] + 1      // 削除
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * 既存曲名リストの中から、類似する曲名を探すファジーマッチング関数
 * OCRの軽微なミスや表記揺れを自動補正するために使用
 * 
 * @param newSong 新しい曲名（正規化済み）
 * @param existingSongs 既存登録曲名のマップ
 * @returns マッチした既存曲名のキー、またはnull
 */
export function findSimilarSong(
  newSong: string,
  existingSongs: Map<string, { originalTitle: string; count: number }>
): string | null {
  // 候補が4文字未満の場合は誤爆防止のためファジーマッチングを行わない
  if (newSong.length < 4) {
    return null;
  }

  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const [key] of existingSongs) {
    // キーも4文字以上の場合のみマッチング対象
    if (key.length < 4) {
      continue;
    }

    const distance = getLevenshteinDistance(newSong, key);

    // 距離が2以下、かつ改善されている場合にマッチ候補とする
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = key;
    }
  }

  return bestMatch;
}
