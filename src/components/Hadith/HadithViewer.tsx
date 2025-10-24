import React, { useState, useEffect } from 'react';
import { Book, Search, Filter, ChevronDown, ChevronUp, Bookmark, Copy, Share2, Info } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

interface HadithCollection {
  id: string;
  name: string;
  arabicName: string;
  data: any;
}

const COLLECTION_CONFIGS = [
  { id: 'bukhari', name: 'Sahih al-Bukhari', arabicName: 'صحيح البخاري', file: 'sahih_bukhari.json' },
  { id: 'muslim', name: 'Sahih Muslim', arabicName: 'صحيح مسلم', file: 'sahih_muslim.json' },
  { id: 'abu-dawud', name: 'Sunan Abi Dawud', arabicName: 'سنن أبي داود', file: 'sunan_abi_dawud.json' },
  { id: 'tirmidhi', name: "Jami' at-Tirmidhi", arabicName: 'جامع الترمذي', file: 'jami_at_tirmidhi.json' },
  { id: 'nasai', name: 'Sunan an-Nasai', arabicName: 'سنن النسائي', file: 'sunan_an_nasai.json' },
  { id: 'ibn-majah', name: 'Sunan Ibn Majah', arabicName: 'سنن ابن ماجه', file: 'sunan_ibn_majah.json' }
];

export default function HadithViewer() {
  const { theme } = useTheme();
  const [collections, setCollections] = useState<HadithCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<HadithCollection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookFilter, setBookFilter] = useState<string | null>(null);
  const [showArabic, setShowArabic] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('hadithBookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedHadith, setExpandedHadith] = useState<string | null>(null);
  const [view, setView] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const loadedCollections = await Promise.all(
          COLLECTION_CONFIGS.map(async (config) => {
            const response = await fetch(`/hadith/${config.file}`);
            const data = await response.json();
            return {
              id: config.id,
              name: config.name,
              arabicName: config.arabicName,
              data
            };
          })
        );
        setCollections(loadedCollections);
        setSelectedCollection(loadedCollections[0]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading hadith collections:', error);
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  useEffect(() => {
    localStorage.setItem('hadithBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (hadithId: string) => {
    setBookmarks(prev => {
      if (prev.includes(hadithId)) {
        return prev.filter(id => id !== hadithId);
      }
      return [...prev, hadithId];
    });
  };

  const handleCopyHadith = (hadith: any) => {
    if (!selectedCollection) return;
    const text = `${hadith.arabic_text}\n\n${hadith.english_text}\n\n[${selectedCollection.name} ${hadith.local_num}]`;
    navigator.clipboard.writeText(text)
      .then(() => alert('Hadith copied to clipboard'))
      .catch(err => console.error('Failed to copy hadith:', err));
  };

  const handleShareHadith = (hadith: any) => {
    if (!selectedCollection) return;
    if (navigator.share) {
      navigator.share({
        title: `${selectedCollection.name} ${hadith.local_num}`,
        text: `${hadith.english_text}\n\n${hadith.arabic_text}`,
        url: window.location.href,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      handleCopyHadith(hadith);
    }
  };

  const filterHadith = (hadith: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (!bookFilter || hadith.book === bookFilter) &&
      (!searchTerm || 
        hadith.english_text?.toLowerCase().includes(searchLower) ||
        hadith.arabic_text?.includes(searchTerm) ||
        hadith.narrator?.toLowerCase().includes(searchLower))
    );
  };

  const getFilteredHadith = () => {
    if (!selectedCollection) return [];
    const allHadith = selectedCollection.data.all_books.flatMap((book: any) =>
      book.hadith_list?.map((hadith: any) => ({
        ...hadith,
        book: book.english_title
      })) || []
    );

    const filtered = allHadith.filter(filterHadith);

    switch (view) {
      case 'today':
        return filtered.slice(0, 5);
      case 'week':
        return filtered.slice(0, 35);
      case 'month':
        return filtered.slice(0, 150);
      default:
        return filtered;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <p>Loading hadith collections...</p>
        </div>
      </div>
    );
  }

  if (!selectedCollection) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center">
          <p>No hadith collections available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6",
      theme === 'ramadan' ? 'bg-amber-50' : ''
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Book className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-bold">Hadith Collections</h2>
        </div>

        <div className="flex gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-700 border-none"
          >
            <option value="today">Today's Selection</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
            <option value="all">All Hadith</option>
          </select>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className={cn(
                "p-3 rounded-lg text-center transition-colors",
                selectedCollection.id === collection.id
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              )}
            >
              <p className="font-arabic text-lg mb-1">{collection.arabicName}</p>
              <p className="text-xs">{collection.name}</p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search hadith by text or narrator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowArabic(!showArabic)}
              className={cn(
                "px-3 py-2 rounded-lg flex items-center gap-1",
                showArabic ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-700"
              )}
            >
              Arabic
            </button>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={cn(
                "px-3 py-2 rounded-lg flex items-center gap-1",
                showTranslation ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-700"
              )}
            >
              Translation
            </button>
          </div>
        </div>
      </div>

      {/* Collection Info */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
        <h3 className="font-semibold mb-2">{selectedCollection.name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {selectedCollection.data.short_desc}
        </p>
        <div className="mt-2 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>{selectedCollection.data.num_books} Books</span>
          <span>{selectedCollection.data.num_hadiths} Hadith</span>
        </div>
      </div>

      {/* Hadith List */}
      <div className="space-y-6">
        {getFilteredHadith().map((hadith: any) => (
          <div
            key={hadith.uuid}
            className={cn(
              "p-4 rounded-lg transition-colors",
              expandedHadith === hadith.uuid
                ? "bg-emerald-50 dark:bg-emerald-900/20"
                : "bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                  {hadith.local_num}
                </span>
                {hadith.book && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {hadith.book}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyHadith(hadith)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                  title="Copy hadith"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShareHadith(hadith)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                  title="Share hadith"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleBookmark(hadith.uuid)}
                  className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                  title={bookmarks.includes(hadith.uuid) ? "Remove bookmark" : "Add bookmark"}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      bookmarks.includes(hadith.uuid) ? 'text-emerald-500 fill-emerald-500' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {hadith.narrator && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {hadith.narrator}
              </p>
            )}

            {showArabic && (
              <p className="font-arabic text-xl leading-loose text-right mb-4" dir="rtl">
                {hadith.arabic_text}
              </p>
            )}

            {showTranslation && (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {hadith.english_text}
              </p>
            )}

            {hadith.grade && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Grade: {hadith.grade}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}