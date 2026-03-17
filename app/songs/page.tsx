'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeSongTitle, findSimilarSong } from '@/lib/songUtils';

interface SongData {
  originalTitle: string;
  count: number;
}

interface GroupedSongs {
  [count: number]: SongData[];
}

interface Event {
  id: string;
  date: string;
  title: string;
  venue: string;
  songs: string[];
  artist?: string;
  createdAt: any;
}

export default function SongsPage() {
  const [groupedSongs, setGroupedSongs] = useState<GroupedSongs>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<string>('All');
  const [allArtists, setAllArtists] = useState<string[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, 'events'));
        
        const events: Event[] = [];
        const artistsSet = new Set<string>();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Event;
          events.push({
            ...data,
            id: doc.id,
          });
          
          if (data.artist) {
            artistsSet.add(data.artist);
          }
        });

        setAllEvents(events);
        setAllArtists(Array.from(artistsSet).sort());
      } catch (error) {
        console.error('イベント一覧取得エラー：', error);
        toast.error('データの読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  // selectedArtist が変わったときに曲を再集計
  useEffect(() => {
    const groupSongs = () => {
      try {
        // 選択されたアーティストでフィルタリング
        const filteredEvents = selectedArtist === 'All' 
          ? allEvents 
          : allEvents.filter(event => event.artist === selectedArtist);

        // 全曲の回数を集計（正規化版をキーとして使用、ファジーマッチング付き）
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

        // 回数でソート
        const sortedSongs = Array.from(songCounts.entries())
          .map(([normalizedSong, data]) => ({ normalizedSong, ...data }))
          .sort((a, b) => b.count - a.count);

        // 回数ごとにグルーピング
        const grouped: GroupedSongs = {};
        sortedSongs.forEach(({ originalTitle, count }) => {
          if (!grouped[count]) {
            grouped[count] = [];
          }
          grouped[count].push({ originalTitle, count: 1 });
        });

        setGroupedSongs(grouped);
      } catch (error) {
        console.error('曲分類エラー：', error);
      }
    };

    if (allEvents.length > 0) {
      groupSongs();
    }
  }, [selectedArtist, allEvents]);

  // グルーピングデータから回数を降順で取得
  const sortedCounts = Object.keys(groupedSongs)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="flex flex-col min-h-screen bg-sky-50">
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
          <h1 className="text-2xl font-bold text-gray-900">全曲ランキング</h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pb-40">
        {/* アーティスト絞り込み */}
        <div className="mb-6">
          <label htmlFor="artist-filter" className="block text-sm font-medium text-gray-700 mb-2">
            アーティスト絞り込み
          </label>
          <select
            id="artist-filter"
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

        {isLoading ? (
          <div className="bg-sky-100 border border-sky-200 rounded-xl p-4">
            <p className="text-sky-800 font-medium">集計中...</p>
          </div>
        ) : Object.keys(groupedSongs).length > 0 ? (
          <div className="space-y-8">
            {sortedCounts.map((count, index) => (
              <div key={count}>
                {/* 見出し */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {index === 0 ? '👑' : '🎵'} {count}回
                </h2>

                {/* 曲リスト */}
                <ul className="bg-white rounded-2xl shadow border border-sky-100 p-4 space-y-2">
                  {groupedSongs[count].map((song, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-gray-700 py-2 border-b border-sky-100 last:border-b-0"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-sky-300 text-sky-800 rounded-full flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span>{song.originalTitle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-sky-100 border border-sky-200 rounded-xl p-4 text-center">
            <p className="text-sky-800 font-medium">まだランキングデータがありません</p>
          </div>
        )}
      </main>
    </div>
  );
}
