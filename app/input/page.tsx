'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, Wand2, Loader, Save, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { extractSetlistFromImage } from '@/lib/gemini';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // ← Firebase authサービスを追加

export default function InputPage() {
  const router = useRouter();
  const resultAreaRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState('');
  const [eventName, setEventName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [artist, setArtist] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [setlist, setSetlist] = useState<string[]>([]);
  const [uniqueArtists, setUniqueArtists] = useState<string[]>([]);
  const [uniqueVenues, setUniqueVenues] = useState<string[]>([]);

  // AI読み取り完了時に結果エリアまでスクロール
  useEffect(() => {
    if (!isLoading && setlist.length > 0) {
      // 次のレンダリングサイクル後にスクロール実行
      setTimeout(() => {
        resultAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isLoading, setlist.length]);

  // Firestoreから既存イベントデータを取得し、アーティスト名と会場名のユニークな配列を作成
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const artists = new Set<string>();
        const venues = new Set<string>();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.artist && data.artist.trim()) {
            artists.add(data.artist.trim());
          }
          if (data.venue && data.venue.trim()) {
            venues.add(data.venue.trim());
          }
        });

        setUniqueArtists(Array.from(artists).sort());
        setUniqueVenues(Array.from(venues).sort());
      } catch (error) {
        console.error('イベントデータ取得エラー：', error);
      }
    };

    fetchEventData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error('セトリ画像を選択してください');
      return;
    }

    try {
      setIsLoading(true);
      const extractedSongs = await extractSetlistFromImage(imageFile);
      setSetlist(extractedSongs);
    } catch (error) {
      console.error('セトリ抽出エラー：', error);
      toast.error('セトリの読み取りに失敗しました。別の画像をお試しください。');
    } finally {
      setIsLoading(false);
    }
  };

const handleSave = async () => {
    // 💡追加：現在ログインしているユーザーの情報を取得
    const user = auth.currentUser;
    
    // もしログインしていなければ弾く（安全対策）
    if (!user) {
      toast.error('保存するにはログインが必要です');
      return;
    }

    try {
      setIsSaving(true);
      await addDoc(collection(db, 'events'), {
        date,
        title: eventName,
        venue: venueName,
        artist,
        songs: setlist,
        createdAt: new Date(),
        uid: user.uid, // 💡ここを追加！！（作った人のID）
      });
      toast.success('セトリを保存しました！');
      router.push('/');
    } catch (error) {
      console.error('セトリ保存エラー：', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSongChange = (index: number, value: string) => {
    const updatedSetlist = [...setlist];
    updatedSetlist[index] = value;
    setSetlist(updatedSetlist);
  };

  const removeSong = (index: number) => {
    const updatedSetlist = setlist.filter((_, i) => i !== index);
    setSetlist(updatedSetlist);
  };

  const addSong = () => {
    setSetlist([...setlist, '']);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updatedSetlist = [...setlist];
    [updatedSetlist[index], updatedSetlist[index - 1]] = [updatedSetlist[index - 1], updatedSetlist[index]];
    setSetlist(updatedSetlist);
  };

  const moveDown = (index: number) => {
    if (index === setlist.length - 1) return;
    const updatedSetlist = [...setlist];
    [updatedSetlist[index], updatedSetlist[index + 1]] = [updatedSetlist[index + 1], updatedSetlist[index]];
    setSetlist(updatedSetlist);
  };

  return (
    <div className="flex flex-col min-h-screen bg-sky-50 overflow-x-hidden w-full max-w-full">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto w-full px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={24} />
            <span className="text-sm">戻る</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">セトリ入力</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pb-40">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 日付入力 */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              日付
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>

          {/* 公演名入力 */}
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
              公演名
            </label>
            <input
              type="text"
              id="eventName"
              placeholder="例：○○フェスティバル2026"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>

          {/* 会場名入力 */}
          <div>
            <label htmlFor="venueName" className="block text-sm font-medium text-gray-700 mb-2">
              会場名
            </label>
            <input
              type="text"
              id="venueName"
              list="venue-list"
              placeholder="例：◇◇ホール"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
            <datalist id="venue-list">
              {uniqueVenues.map((venue) => (
                <option key={venue} value={venue} />
              ))}
            </datalist>
          </div>

          {/* アーティスト名入力 */}
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-2">
              アーティスト名
            </label>
            <input
              type="text"
              id="artist"
              list="artist-list"
              placeholder="アーティスト名を入力"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
            <datalist id="artist-list">
              {uniqueArtists.map((art) => (
                <option key={art} value={art} />
              ))}
            </datalist>
          </div>

          {/* セトリ画像アップロード */}
          <div>
            <label htmlFor="setlistImage" className="block text-sm font-medium text-gray-700 mb-2">
              セトリ画像
            </label>
            <div className="relative">
              <input
                type="file"
                id="setlistImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-600 hover:file:bg-sky-200"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">対応形式: JPG, PNG, GIF など</p>

            {/* プレビュー画像 */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="プレビュー"
                className="mt-4 w-full max-w-sm rounded-2xl shadow-sm border border-sky-200 object-contain"
              />
            )}
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-400 hover:bg-sky-500 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader size={20} className="animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                AIで読み取る
              </>
            )}
          </button>
        </form>
      </main>

      {/* 結果表示エリア */}
      <div ref={resultAreaRef} className="max-w-4xl mx-auto w-full px-4 py-6 pb-40">
        {isLoading && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <p className="text-sky-800 font-medium">
              AIがセトリを読み取り中...（数秒かかります）
            </p>
          </div>
        )}

        {!isLoading && setlist.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">抽出されたセトリ</h2>
              <div className="space-y-3">
                {setlist.map((song, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-sky-400 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <textarea
                      value={song}
                      onChange={(e) => handleSongChange(index, e.target.value)}
                      placeholder="曲名"
                      rows={2}
                      className="flex-1 px-3 py-2 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
                    />
                    {/* 上へ移動ボタン */}
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="flex-shrink-0 p-2 text-sky-400 hover:bg-sky-50 disabled:text-gray-300 disabled:hover:bg-transparent rounded-lg transition-colors"
                      aria-label="上へ移動"
                      title="上へ移動"
                    >
                      <ArrowUp size={16} />
                    </button>
                    
                    {/* 下へ移動ボタン */}
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === setlist.length - 1}
                      className="flex-shrink-0 p-2 text-sky-400 hover:bg-sky-50 disabled:text-gray-300 disabled:hover:bg-transparent rounded-lg transition-colors"
                      aria-label="下へ移動"
                      title="下へ移動"
                    >
                      <ArrowDown size={16} />
                    </button>
                    
                    {/* 削除ボタン */}
                    <button
                      onClick={() => removeSong(index)}
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* 曲を追加するボタン */}
              <button
                onClick={addSong}
                className="mt-4 w-full py-2 px-4 border border-sky-200 hover:bg-sky-100 text-sky-600 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} />
                曲を追加する
              </button>
            </div>

            {/* 保存ボタン */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-400 hover:bg-emerald-500 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors mb-24"
            >
              {isSaving ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={20} />
                  このセトリを保存する
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
