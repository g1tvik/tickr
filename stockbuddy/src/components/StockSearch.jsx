import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import Icon from './Icon';
import './StockSearch.css';

const StockSearch = ({ onStockSelect, placeholder = "Search by symbol or company name..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  // Client-side autocomplete cache: key = query.toLowerCase().trim() -> results
  const searchCacheRef = useRef(new Map());

  // Preload mechanism to warm up the cache
  useEffect(() => {
    // Preload a common search to warm up the backend cache
    const preloadSearch = async () => {
      try {
        // First warm up the backend cache (health endpoint lives at the server root, not under /api)
        await fetch(`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api').replace(/\/api\/?$/, '')}/health`);
        if (import.meta.env.DEV) console.log('Backend cache warmed up');

        // Then preload a common search
        await api.searchStocksAutocomplete('AAPL');
        if (import.meta.env.DEV) console.log('Preloaded search cache');
      } catch (error) {
        if (import.meta.env.DEV) console.warn('Preload failed:', error);
      }
    };
    
    // Delay the preload to not block initial render
    const preloadTimer = setTimeout(preloadSearch, 2000);
    
    return () => clearTimeout(preloadTimer);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        setShowSuggestions(false);
        return;
      }

      // Serve from client-side cache when available
      const cacheKey = query.toLowerCase().trim();
      const cache = searchCacheRef.current;
      if (cache.has(cacheKey)) {
        setSuggestions(cache.get(cacheKey));
        setShowSuggestions(true);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.searchStocksAutocomplete(query);
        if (response.success) {
          setSuggestions(response.results);
          setShowSuggestions(true); // Show suggestions when results arrive
          // Cache successful results with a soft cap (evict oldest beyond 50)
          cache.set(cacheKey, response.results);
          if (cache.size > 50) {
            cache.delete(cache.keys().next().value);
          }
        } else {
          setError('Failed to search stocks');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error searching stocks:', error);
        setError('Failed to search stocks. Please try again.');
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 150); // Reduced from 300ms to 150ms for faster response
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Show loading immediately for better UX
    if (value.length >= 2) {
      setIsLoading(true);
      setShowSuggestions(false); // Hide suggestions while loading
    } else {
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      debouncedSearch(searchTerm);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      setShowSuggestions(false);
    }
  }, [searchTerm, debouncedSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    // The suggestion already carries symbol + name; useTrading.handleStockSelect
    // re-fetches the fresh quote, so avoid a wasteful double round-trip here.
    onStockSelect(suggestion);

    // Reset search state
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setError(null);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Tiered chip styling (from the 21st.dev Magic-generated design):
  // exact symbol = solid gold, starts-with = strong, contains/fuzzy = subtle.
  const getMatchTier = (matchType) => {
    if (matchType === 'exact_symbol') return 'exact';
    if (matchType === 'symbol_starts' || matchType === 'name_starts' || matchType === 'name_word') return 'strong';
    return 'weak';
  };

  // Get match type display
  const getMatchTypeDisplay = (matchType) => {
    switch (matchType) {
      case 'exact_symbol':
        return 'Exact Symbol';
      case 'symbol_starts':
        return 'Symbol Starts With';
      case 'name_starts':
        return 'Company Name Starts With';
      case 'name_word':
        return 'Company Name Word';
      case 'name_word_starts':
        return 'Company Name Word Starts With';
      case 'name_contains':
        return 'Company Name Contains';
      case 'symbol_contains':
        return 'Symbol Contains';
      default:
        return 'Match';
    }
  };

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className="stock-search-container">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`search-input ${isFocused ? 'focused' : ''} ${error ? 'error' : ''}`}
        />
        
        {isLoading && (
          <div className="search-loading">
            <div className="spinner"></div>
          </div>
        )}
        
        {searchTerm && !isLoading && (
          <button
            className="clear-button"
            aria-label="Clear search"
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setError(null);
              inputRef.current?.focus();
            }}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-container">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.symbol}-${index}`}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="suggestion-main">
                <div className="suggestion-symbol">
                  {highlightText(suggestion.symbol, searchTerm)}
                </div>
                <div className="suggestion-name">
                  {highlightText(suggestion.name, searchTerm)}
                </div>
              </div>
              <div className={`suggestion-match-type suggestion-match-type--${getMatchTier(suggestion.matchType)}`}>
                {getMatchTypeDisplay(suggestion.matchType)}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && searchTerm.length >= 2 && !showSuggestions && (
        <div className="suggestions-container">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="suggestion-item skeleton">
              <div className="suggestion-main">
                <div className="suggestion-symbol skeleton-text"></div>
                <div className="suggestion-name skeleton-text"></div>
              </div>
              <div className="suggestion-match-type skeleton-text"></div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && !isLoading && (
        <div className="no-results">
          <div className="no-results-icon"><Icon name="search" size={18} /></div>
          <div className="no-results-text">No stocks found</div>
          <div className="no-results-subtext">Try a different search term</div>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 