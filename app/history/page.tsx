'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, MapPin, Music, ChevronDown, ChevronUp, Trash2, Mic2, Edit2, Save, X, Plus, Copy, Search, Disc3, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { toPng } from 'html-to-image';
import { db, auth, provider } from '@/lib/firebase';

interface Event {
  id: string;
  date: string;
  title: string;
  venue: string;
  songs: string[];
  artist?: string;
  imageUrl?: string;
  createdAt: any;
}

export default function HistoryPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    date: '',
    title: '',
    artist: '',
    venue: '',
    songs: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // ユーザーの認証状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // ユーザーがログインしている場合のみデータを取得
  useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const q = query(
          collection(db, 'events'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedEvents: Event[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEvents.push({
            id: doc.id,
            ...doc.data(),
          } as Event);
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('イベント一覧取得エラー：', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      toast.success('ログインしました！');
    } catch (error) {
      console.error('ログインエラー：', error);
      toast.error('ログインに失敗しました。');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('ログアウトしました。');
    } catch (error) {
      console.error('ログアウトエラー：', error);
      toast.error('ログアウトに失敗しました。');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このセトリを削除してもよろしいですか？')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        setEvents(events.filter((event) => event.id !== id));
        toast.success('削除しました！');
      } catch (error) {
        console.error('イベント削除エラー：', error);
        toast.error('削除に失敗しました。');
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      date: event.date,
      title: event.title,
      artist: event.artist || '',
      venue: event.venue,
      songs: [...event.songs],
    });
  };

  const handleCloseEditModal = () => {
    setEditingEvent(null);
    setEditFormData({
      date: '',
      title: '',
      artist: '',
      venue: '',
      songs: [],
    });
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSongChange = (index: number, value: string) => {
    const updatedSongs = [...editFormData.songs];
    updatedSongs[index] = value;
    setEditFormData((prev) => ({
      ...prev,
      songs: updatedSongs,
    }));
  };

  const handleRemoveSong = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      songs: prev.songs.filter((_, i) => i !== index),
    }));
  };

  const handleAddSong = () => {
    setEditFormData((prev) => ({
      ...prev,
      songs: [...prev.songs, ''],
    }));
  };

  const handleMoveUpSong = (index: number) => {
    if (index === 0) return;
    setEditFormData((prev) => {
      const newSongs = [...prev.songs];
      [newSongs[index], newSongs[index - 1]] = [newSongs[index - 1], newSongs[index]];
      return {
        ...prev,
        songs: newSongs,
      };
    });
  };

  const handleMoveDownSong = (index: number) => {
    setEditFormData((prev) => {
      if (index === prev.songs.length - 1) return prev;
      const newSongs = [...prev.songs];
      [newSongs[index], newSongs[index + 1]] = [newSongs[index + 1], newSongs[index]];
      return {
        ...prev,
        songs: newSongs,
      };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    if (!editFormData.date || !editFormData.title || !editFormData.venue) {
      toast.error('必須項目を入力してください');
      return;
    }

    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'events', editingEvent.id), {
        date: editFormData.date,
        title: editFormData.title,
        artist: editFormData.artist,
        venue: editFormData.venue,
        songs: editFormData.songs,
      });

      // イベントリストを更新
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id
            ? {
                ...event,
                date: editFormData.date,
                title: editFormData.title,
                artist: editFormData.artist,
                venue: editFormData.venue,
                songs: editFormData.songs,
              }
            : event
        )
      );

      handleCloseEditModal();
      toast.success('更新しました！');
    } catch (error) {
      console.error('イベント更新エラー：', error);
      toast.error('更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    if (
      window.confirm(
        'すべてのセトリ記録を完全に削除します。本当によろしいですか？'
      )
    ) {
      try {
        await Promise.all(
          events.map((event) => deleteDoc(doc(db, 'events', event.id)))
        );
        setEvents([]);
        toast.success('すべて削除しました！');
      } catch (error) {
        console.error('全イベント削除エラー：', error);
        toast.error('削除に失敗しました。');
      }
    }
  };

  const handleCopy = async (event: Event) => {
    try {
      // 日付フォーマット
      const dateStr = new Date(event.date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // セトリメモテキストを作成
      const songsList = event.songs
        .map((song, index) => `${index + 1}. ${song}`)
        .join('\n');

      const text = `📅 ${dateStr}
🎤 ${event.artist || '(アーティスト未設定)'}
📍 ${event.venue}

${songsList}

#セトリメモアプリ`;

      // クリップボードにコピー
      await navigator.clipboard.writeText(text);
      toast.success('セトリをコピーしました！');
    } catch (error) {
      console.error('クリップボードコピーエラー：', error);
      toast.error('コピーに失敗しました。');
    }
  };

  const handleDownloadImage = async (event: Event) => {
    try {
      toast.success('画像を準備中...');

      // 実際のカード要素を取得
      const cardElement = document.getElementById(`event-card-${event.id}`);
      if (!cardElement) {
        toast.error('カード要素が見つかりません。「セトリを見る」を開いてからお試しください。');
        return;
      }

      // React のレンダリング完了を待つため遅延を入れる
      await new Promise(resolve => setTimeout(resolve, 100));

      // カード要素から画像を生成
      const canvas = await toPng(cardElement, {
        quality: 0.95,
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Canvas を Blob に変換
      const parts = canvas.split(';base64,');
      const bstr = atob(parts[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      const blob = new Blob([u8arr], { type: 'image/png' });

      // File オブジェクトを作成
      const file = new File([blob], `setlist_${event.artist || 'event'}_${event.date}.png`, { type: 'image/png' });

      // Web Share API をサポートしているかチェック
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        // モバイルの共有シート（OSネイティブ）を利用
        try {
          await navigator.share({
            files: [file],
            title: 'セトリ画像',
            text: `${event.title} - ${event.artist || 'アーティスト未設定'}`,
          });
          toast.success('シェアメニューを開きました！');
        } catch (error: any) {
          // ユーザーがキャンセルした場合など
          if (error.name !== 'AbortError') {
            console.error('シェアエラー：', error);
            toast.error('シェアに失敗しました。');
          }
        }
      } else {
        // フォールバック：従来のダウンロード処理
        const link = document.createElement('a');
        link.href = canvas;
        link.download = `setlist_${event.artist || 'event'}_${event.date}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('画像を保存しました！SNSでシェアしよう！');
      }
    } catch (error) {
      console.error('画像ダウンロードエラー：', error);
      toast.error('画像の保存に失敗しました。');
    }
  };

  // 検索フィルタリング関数
  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // アーティスト名をチェック
    if (event.artist && event.artist.toLowerCase().includes(query)) {
      return true;
    }

    // 会場名をチェック
    if (event.venue.toLowerCase().includes(query)) {
      return true;
    }

    // セトリの曲名をチェック
    if (event.songs.some((song) => song.toLowerCase().includes(query))) {
      return true;
    }

    return false;
  });

  return (
    <div className="flex flex-col min-h-screen bg-sky-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto w-full px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft size={24} />
              <span className="text-sm">戻る</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">参加履歴</h1>
          </div>
          {events.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
              <span>すべて削除</span>
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pb-40">
        {isLoading ? (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <p className="text-sky-800 font-medium">読み込み中...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="mb-6">
              <Disc3 size={80} className="text-sky-300 mx-auto opacity-80" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              参加履歴を見るにはログインしてください
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm">
              あなたのセットリスト履歴を確認・管理できます
            </p>
            <button
              onClick={handleLogin}
              className="inline-block px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white font-semibold rounded-full transition-colors"
            >
              Googleでログインして確認する
            </button>
          </div>
        ) : events.length > 0 ? (
          <>
            {/* 検索ボックス */}
            <div className="mb-6">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sky-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="アーティスト、会場、曲名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-sky-200 bg-sky-50 text-sky-900 placeholder-sky-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* イベントリスト */}
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                className="bg-white rounded-2xl shadow p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4"
              >
                {/* サムネイル画像 */}
                {event.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-24 h-24 object-cover rounded-md"
                    />
                  </div>
                )}

                {/* テキスト情報 */}
                <div className="flex-1">
                  {/* 日付 */}
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(event.date).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>

                  {/* アーティスト名 */}
                  {event.artist && (
                    <div className="flex items-center gap-2 text-sky-600 mb-2">
                      <Mic2 size={16} className="flex-shrink-0" />
                      <span className="font-bold text-sm">{event.artist}</span>
                    </div>
                  )}

                  {/* 公演名 */}
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {event.title}
                  </h2>

                  {/* 会場名 */}
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <MapPin size={18} className="text-blue-600 flex-shrink-0" />
                    <span>{event.venue}</span>
                  </div>

                  {/* 曲数 */}
                  <div className="flex items-center gap-2 text-gray-700 mb-4">
                    <Music size={18} className="text-blue-600 flex-shrink-0" />
                    <span>{event.songs.length}曲</span>
                  </div>

                  {/* ボタングループ */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap" data-html2canvas-ignore="true">
                    {/* セトリ表示トグルボタン */}
                    <button
                      onClick={() =>
                        setExpandedEventId(
                          expandedEventId === event.id ? null : event.id
                        )
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
                    >
                      {expandedEventId === event.id ? (
                        <>
                          <span>閉じる</span>
                          <ChevronUp size={18} />
                        </>
                      ) : (
                        <>
                          <span>セトリを見る</span>
                          <ChevronDown size={18} />
                        </>
                      )}
                    </button>

                    {/* 編集ボタン */}
                    <button
                      onClick={() => handleEdit(event)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
                    >
                      <Edit2 size={16} />
                      <span>編集</span>
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                      <span>削除</span>
                    </button>

                    {/* コピーボタン - 後で再利用するため関数は残す */}
                    {/* 
                    <button
                      onClick={() => handleCopy(event)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
                    >
                      <Copy size={16} />
                      <span>コピー</span>
                    </button>
                    */}

                    {/* 画像で保存ボタン - 後で再利用するため関数は残す */}
                    {/* 
                    <button
                      onClick={() => handleDownloadImage(event)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-xl hover:bg-sky-100 transition-colors"
                    >
                      <Download size={16} />
                      <span>画像で保存</span>
                    </button>
                    */}
                  </div>

                  {/* セトリ展開エリア */}
                  {expandedEventId === event.id && (
                    <div className="mt-0 bg-sky-50 p-4 rounded-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        セットリスト
                      </h3>
                      <ol className="space-y-2 list-decimal list-inside">
                        {event.songs.map((song, index) => (
                          <li key={index} className="text-gray-700">
                            {song}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
                ))
              ) : (
                <div className="bg-sky-100 border border-sky-200 rounded-2xl p-4 text-center">
                  <p className="text-sky-800 font-medium">検索条件に該当する履歴がありません</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="mb-6">
              <Disc3 size={80} className="text-sky-300 mx-auto opacity-80" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              まだ参加履歴がありません
            </h2>
            <p className="text-gray-600 mb-8 max-w-sm">
              最初のライブを記録して、あなたのセトリコレクションを始めましょう！
            </p>
            <Link
              href="/input"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white font-semibold rounded-full transition-colors"
            >
              <Plus size={20} />
              <span>セトリを記録する</span>
            </Link>
          </div>
        )}
      </main>

      {/* 編集用モーダル */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* モーダルヘッダー（スクロール追従） */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handleCloseEditModal}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
              >
                <X size={20} />
                <span>キャンセル</span>
              </button>
              <h2 className="text-lg font-bold text-gray-900">セトリを編集</h2>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 bg-sky-400 hover:bg-sky-500 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors text-sm whitespace-nowrap"
              >
                <Save size={16} />
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
            </div>

            {/* モーダルボディ（スクロール可能） */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* 日付入力 */}
              <div>
                <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-2">
                  日付
                </label>
                <input
                  type="date"
                  id="edit-date"
                  value={editFormData.date}
                  onChange={(e) => handleEditFormChange('date', e.target.value)}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {/* 公演名入力 */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  公演名
                </label>
                <input
                  type="text"
                  id="edit-title"
                  placeholder="例：○○フェスティバル2026"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {/* アーティスト名入力 */}
              <div>
                <label htmlFor="edit-artist" className="block text-sm font-medium text-gray-700 mb-2">
                  アーティスト名
                </label>
                <input
                  type="text"
                  id="edit-artist"
                  placeholder="アーティスト名を入力"
                  value={editFormData.artist}
                  onChange={(e) => handleEditFormChange('artist', e.target.value)}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {/* 会場名入力 */}
              <div>
                <label htmlFor="edit-venue" className="block text-sm font-medium text-gray-700 mb-2">
                  会場名
                </label>
                <input
                  type="text"
                  id="edit-venue"
                  placeholder="例：◇◇ホール"
                  value={editFormData.venue}
                  onChange={(e) => handleEditFormChange('venue', e.target.value)}
                  className="w-full px-4 py-3 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                />
              </div>

              {/* セトリリスト */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  セットリスト
                </label>
                <div className="space-y-3">
                  {editFormData.songs.map((song, index) => (
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
                      <button
                        onClick={() => handleMoveUpSong(index)}
                        disabled={index === 0}
                        className="flex-shrink-0 p-2 text-sky-400 hover:bg-sky-50 disabled:text-gray-300 rounded-lg transition-colors"
                        aria-label="上へ移動"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveDownSong(index)}
                        disabled={index === editFormData.songs.length - 1}
                        className="flex-shrink-0 p-2 text-sky-400 hover:bg-sky-50 disabled:text-gray-300 rounded-lg transition-colors"
                        aria-label="下へ移動"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveSong(index)}
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
                  onClick={handleAddSong}
                  className="mt-4 w-full py-2 px-4 border border-sky-200 hover:bg-sky-100 text-sky-600 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={18} />
                  <span>曲を追加</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
