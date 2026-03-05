import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, Film, SearchX, Search, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useGalaxyRubrics } from '../hooks/useGalaxyRubrics';
import MasterclassHero from '../components/masterclasses/MasterclassHero';
import MasterclassCard from '../components/masterclasses/MasterclassCard';
import { getBadgesForRubric, computeBadgeCounts, BadgeType } from '../services/badgeService';
import BadgeFilterBar from '../components/ui/BadgeFilterBar';

const ITEMS_PER_PAGE = 6;

type SortMode = 'default' | 'az';

const MasterclassesPage: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { masterclasses, isLoading, error } = useGalaxyRubrics();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<Set<BadgeType>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const featured = masterclasses.length > 0 ? masterclasses[0] : null;
  const rest = masterclasses.length > 1 ? masterclasses.slice(1) : [];

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [debouncedQuery, sortMode, selectedBadges]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    let items = [...rest];

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (selectedBadges.size > 0) {
      items = items.filter((r) => {
        const badges = getBadgesForRubric(r.rubric_id);
        return badges.some((b) => selectedBadges.has(b));
      });
    }

    if (sortMode === 'az') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [rest, debouncedQuery, sortMode, selectedBadges]);

  const badgeCounts = useMemo(() => {
    let items = [...rest];
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return computeBadgeCounts(items, (r) => getBadgesForRubric(r.rubric_id));
  }, [rest, debouncedQuery]);

  const handleToggleBadge = useCallback((badge: BadgeType) => {
    setSelectedBadges((prev) => {
      const next = new Set(prev);
      if (next.has(badge)) {
        next.delete(badge);
      } else {
        next.add(badge);
      }
      return next;
    });
  }, []);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleShowMore = useCallback(() => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className={`min-h-screen pt-28 pb-24 ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-primary-500/10' : 'bg-primary-50'}`}>
              <Film className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <div className={`h-7 w-48 rounded-lg animate-pulse ${isDark ? 'bg-dark-100' : 'bg-gray-200'}`} />
              <div className={`h-4 w-64 rounded mt-2 animate-pulse ${isDark ? 'bg-dark-100/60' : 'bg-gray-200/60'}`} />
            </div>
          </div>

          <div className={`w-full h-[420px] md:h-[480px] rounded-2xl lg:rounded-3xl animate-pulse mb-10 ${isDark ? 'bg-dark-100' : 'bg-gray-200'}`} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className={`aspect-[16/10] rounded-2xl animate-pulse ${isDark ? 'bg-dark-100' : 'bg-gray-200'}`}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen pt-28 pb-24 ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-error-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 md:pt-28 pb-24 relative ${isDark ? 'bg-dark-200' : 'bg-gray-50'}`}>
      {isDark && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top center, rgba(255,121,0,0.04) 0%, transparent 60%)',
          }}
        />
      )}

      {isDark && (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      )}

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-8 md:mb-10" ref={heroRef}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-primary-500/10' : 'bg-primary-50'}`}>
              <Film className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className={`font-heading font-bold text-2xl md:text-3xl ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {t('masterclasses.pageTitle')}
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('masterclasses.pageSubtitle')}
              </p>
            </div>
          </motion.div>

          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <MasterclassHero rubric={featured} badges={getBadgesForRubric(featured.rubric_id)} />
            </motion.div>
          )}
        </div>

        {rest.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            >
              <div className="relative flex-1">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('masterclasses.searchPlaceholder')}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm transition-all duration-200 outline-none ${
                    isDark
                      ? 'bg-dark-100/80 border border-gray-700/50 text-white placeholder-gray-500 focus:border-primary-500/50 focus:bg-dark-100'
                      : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500/50 focus:shadow-sm'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                      isDark ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortDropdownOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    isDark
                      ? 'bg-dark-100/80 border border-gray-700/50 text-gray-300 hover:border-primary-500/40 hover:text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-500/40 hover:text-gray-900'
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortMode === 'default' ? t('masterclasses.sortNewest') : t('masterclasses.sortAZ')}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {sortDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden shadow-xl border ${
                        isDark
                          ? 'bg-dark-100 border-gray-700/60'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {(['default', 'az'] as SortMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => {
                            setSortMode(mode);
                            setSortDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-5 py-2.5 text-sm transition-colors whitespace-nowrap ${
                            sortMode === mode
                              ? 'text-primary-500 font-medium ' + (isDark ? 'bg-primary-500/10' : 'bg-primary-50')
                              : isDark
                              ? 'text-gray-300 hover:bg-dark-50/50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {mode === 'default' ? t('masterclasses.sortNewest') : t('masterclasses.sortAZ')}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <BadgeFilterBar
              selectedBadges={selectedBadges}
              onToggleBadge={handleToggleBadge}
              badgeCounts={badgeCounts}
              className="mb-6"
            />

            {visibleItems.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {visibleItems.map((rubric, index) => (
                      <motion.div
                        key={rubric.rubric_id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, delay: 0.05 * (index % ITEMS_PER_PAGE) }}
                        layout
                      >
                        <MasterclassCard rubric={rubric} isNew={index === 0 && sortMode === 'default' && !debouncedQuery} badges={getBadgesForRubric(rubric.rubric_id)} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center mt-8 gap-3">
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t('masterclasses.showingCount', {
                      visible: visibleItems.length,
                      total: filtered.length,
                    })}
                  </p>

                  {hasMore && (
                    <motion.button
                      onClick={handleShowMore}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isDark
                          ? 'bg-dark-100/80 border border-gray-700/50 text-gray-200 hover:border-primary-500/40 hover:text-white hover:bg-dark-100'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-500/40 hover:text-gray-900 hover:shadow-sm'
                      }`}
                    >
                      {t('masterclasses.showMore')}
                    </motion.button>
                  )}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <SearchX className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('masterclasses.noSearchResults')}
                </p>
                <button
                  onClick={handleClearSearch}
                  className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
                >
                  {t('masterclasses.clearSearch')}
                </button>
              </motion.div>
            )}
          </>
        )}

        {masterclasses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <SearchX className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('masterclasses.noResults')}
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className={`fixed bottom-24 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ${
              isDark
                ? 'bg-dark-100 border border-gray-700/60 text-gray-300 hover:text-white hover:border-primary-500/40'
                : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-primary-500/40 shadow-md'
            }`}
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasterclassesPage;
