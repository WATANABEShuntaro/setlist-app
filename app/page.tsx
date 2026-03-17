'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Music, Clock, Trophy, Medal, Calendar, MapPin, Disc3, Ticket, Mic2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, provider } from '@/lib/firebase';
import { normalizeSongTitle, findSimilarSong } from '@/lib/songUtils';

interface Event {
  id: string;
  date: string;
  title: string;
  venue: string;
  songs: string[];
  artist?: string;
  createdAt: any;
}

interface TopSong {
  song: string;
  normalizedSong: string;
  count: number;
}

interface ArtistRank {
  artist: string;
  count: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [liveDates, setLiveDates] = useState<string[]>([]);
  const [artistRanking, setArtistRanking] = useState<ArtistRank[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string>('All');
  const [allArtists, setAllArtists] = useState<string[]>([]);
  const [allEventsCached, setAllEventsCached] = useState<Event[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, 'events'));
        
        // すべてのイベントを収集
        const allEvents: Event[] = [];
        const artistsSet = new Set<string>();
        const dates: string[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Event;
          allEvents.push({
            ...data,
            id: doc.id,
          });
          
          // アーティストを集計
          if (data.artist) {
            artistsSet.add(data.artist);
          }
          
          // 日付を収集
          if (data.date) {
            dates.push(data.date);
          }
        });

        setAllEventsCached(allEvents);
        setAllArtists(Array.from(artistsSet).sort());

        // 参加日を最新順でソート
        const uniqueDates = [...new Set(dates)]; // 重複を削除
        const sortedDates = uniqueDates.sort().reverse(); // 最新順
        setLiveDates(sortedDates.slice(0, 5)); // 最新5件
        
        // アーティストランキング（全て）
        const artistCounts: { [artistName: string]: number } = {};
        allEvents.forEach((event) => {
          if (event.artist) {
            artistCounts[event.artist] = (artistCounts[event.artist] || 0) + 1;
          }
        });
        const artistRank = Object.entries(artistCounts)
          .map(([artist, count]) => ({ artist, count }))
          .sort((a, b) => b.count - a.count);
        setArtistRanking(artistRank);
        
        // 直近3件のイベント
        const sortedEvents = allEvents
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        setRecentEvents(sortedEvents);
      } catch (error) {
        console.error('データ取得エラー：', error);
        toast.error('データの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // selectedArtist が変わったときに曲ランキングを再計算
  useEffect(() => {
    if (allEventsCached.length === 0) return;

    // 選択されたアーティストでフィルタリング
    const filteredEvents = selectedArtist === 'All'
      ? allEventsCached
      : allEventsCached.filter(event => event.artist === selectedArtist);

    // 曲を集計（正規化版をキーとして使用、ファジーマッチング付き）
    const songCounts = new Map<string, { originalTitle: string; count: number }>();
    
    filteredEvents.forEach((event) => {
      if (event.songs && Array.isArray(event.songs)) {
        event.songs.forEach((song: string) => {
          const normalized = normalizeSongTitle(song);
          
          // 既存曲リストと比較してファジーマッチングを試みる
          const similarKey = findSimilarSong(normalized, songCounts);
          
          if (similarKey) {
            // 類似曲が見つかった場合は、その曲のカウントを増加
            const existingData = songCounts.get(similarKey)!;
            existingData.count++;
          } else if (songCounts.has(normalized)) {
            // 完全一致する曲が見つかった場合
            songCounts.get(normalized)!.count++;
          } else {
            // 新しい曲として登録
            songCounts.set(normalized, { originalTitle: song, count: 1 });
          }
        });
      }
    });

    // Top 5 ランキング
    const top5 = Array.from(songCounts.entries())
      .map(([normalizedSong, data]) => ({ song: data.originalTitle, normalizedSong, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopSongs(top5);
  }, [selectedArtist, allEventsCached]);

  return (
    <div className="flex flex-col min-h-screen bg-sky-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">セトリ収集アプリ</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pb-40">
        {isLoading ? (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <p className="text-sky-800 font-medium">データを読み込み中...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="mb-8">
              <Disc3 size={120} className="text-sky-300 mx-auto opacity-80" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              セトリを記録して思い出を残そう！
            </h2>
            <p className="text-gray-600 mb-12 max-w-md text-lg">
              ライブのセットリストを記録・管理して、あなたの参加履歴を残しませんか？ 
              Googleでログインして、今すぐ始めましょう！
            </p>
            <button
              onClick={handleLogin}
              className="px-8 py-4 bg-sky-400 hover:bg-sky-500 text-white font-bold text-lg rounded-full transition-colors shadow-md"
            >
              Googleでログインして始める
            </button>
          </div>
        ) : allEventsCached.length === 0 ? (
          <>
            {/* ユーザー情報 */}
            <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.displayName}さん
                  </p>
                  <p className="text-xs text-gray-500">ログイン中</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-full hover:bg-sky-50 transition-colors"
              >
                ログアウト
              </button>
            </div>

            {/* Empty State */}
            <div className="mb-6">
              <Disc3 size={80} className="text-sky-300 mx-auto opacity-80" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              まだセトリが記録されていません
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
          </>
        ) : (
          <>
            {/* ユーザー情報 */}
            <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.displayName}さん
                  </p>
                  <p className="text-xs text-gray-500">ログイン中</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-sky-600 border border-sky-200 rounded-full hover:bg-sky-50 transition-colors"
              >
                ログアウト
              </button>
            </div>

            {/* あなたの参加記録 */}
            <div className="bg-gradient-to-r from-sky-400 to-emerald-300 rounded-2xl shadow-sm p-6 mb-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Trophy size={32} className="flex-shrink-0" />
                <h2 className="text-2xl font-bold">あなたの参加記録</h2>
              </div>
              {artistRanking.length > 0 ? (
                <p className="text-white text-lg">
                  合計 <span className="font-bold text-2xl">{liveDates.length}</span> 回のライブに参加、
                  <span className="font-bold text-2xl ml-2">{artistRanking.length}</span> 組のアーティストを記録済み
                </p>
              ) : (
                <p className="text-white">まだ記録がありません。セトリを登録して参加履歴を増やしましょう！</p>
              )}
            </div>

            {/* ライブ参戦サマリーダッシュボード */}
            {allEventsCached.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* 総参戦回数 */}
                <div className="bg-gradient-to-br from-sky-100 to-sky-50 rounded-2xl p-5 text-center border border-sky-200 shadow-sm hover:shadow-md transition-shadow">
                  <Ticket size={28} className="text-sky-600 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-sky-900">{allEventsCached.length}</p>
                  <p className="text-xs md:text-sm text-sky-700 font-medium">参戦回数</p>
                </div>
                
                {/* アーティスト数 */}
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl p-5 text-center border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                  <Mic2 size={28} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-emerald-900">{allArtists.length}</p>
                  <p className="text-xs md:text-sm text-emerald-700 font-medium">アーティスト</p>
                </div>
                
                {/* 総楽曲数 */}
                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-5 text-center border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <Music size={28} className="text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-purple-900">
                    {allEventsCached.reduce((sum, event) => sum + (event.songs?.length || 0), 0)}
                  </p>
                  <p className="text-xs md:text-sm text-purple-700 font-medium">楽曲数</p>
                </div>
              </div>
            )}

            {/* アーティスト別参加回数ランキング */}
            {artistRanking.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">参加回数が多いアーティスト</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {artistRanking.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        index === 0
                          ? 'bg-yellow-50 border-yellow-200'
                          : index === 1
                          ? 'bg-emerald-50 border-emerald-200'
                          : index === 2
                          ? 'bg-sky-50 border-sky-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        {index === 0 ? (
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="w-8 h-8 bg-sky-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${
                          index === 0
                            ? 'text-yellow-900 text-lg'
                            : index === 1
                            ? 'text-gray-800 text-lg'
                            : index === 2
                            ? 'text-orange-900 text-lg'
                            : 'text-gray-800'
                        }`}>
                          {item.artist}
                        </p>
                      </div>
                      <div className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-200 text-yellow-900'
                          : index === 1
                          ? 'bg-emerald-200 text-emerald-900'
                          : index === 2
                          ? 'bg-sky-200 text-sky-900'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.count}回
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 直近の参加履歴 */}
            {recentEvents.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">直近の参加履歴</h2>
                <div className="space-y-3">
                  {recentEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 border border-sky-100 rounded-2xl hover:bg-sky-50 transition-colors"
                    >
                      <div className="flex-shrink-0 pt-1">
                        <Calendar size={20} className="text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {event.title}
                          </h3>
                          {event.artist && (
                            <div className="flex items-center gap-2 text-sky-600 text-sm">
                              <span className="w-1.5 h-1.5 bg-sky-600 rounded-full flex-shrink-0"></span>
                              <span className="font-medium truncate">{event.artist}</span>
                            </div>
                          )}
                          {event.venue && (
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <MapPin size={14} className="flex-shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href="/history"
                    className="inline-block px-6 py-3 bg-white border border-sky-200 text-sky-600 rounded-full hover:bg-sky-50 transition-colors font-medium"
                  >
                    すべての参加履歴を見る
                  </Link>
                </div>
              </div>
            ) : null}

            {/* 上位5曲ランキング */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <div className="mb-4">
                <label htmlFor="artist-filter-home" className="block text-sm font-medium text-gray-700 mb-2">
                  アーティスト絞り込み
                </label>
                <select
                  id="artist-filter-home"
                  value={selectedArtist}
                  onChange={(e) => setSelectedArtist(e.target.value)}
                  className="w-full px-4 py-2 border border-sky-200 bg-sky-50 text-sky-700 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="All">すべてのアーティスト</option>
                  {allArtists.map((artist) => (
                    <option key={artist} value={artist}>
                      {artist}
                    </option>
                  ))}
                </select>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">上位5曲ランキング</h2>
              {topSongs.length > 0 ? (
                <ul className="space-y-3">
                  {topSongs.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-gray-700 pb-3 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-sky-300 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="flex-1">{item.song}</span>
                      <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {item.count}回
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">まだランキングデータがありません</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
