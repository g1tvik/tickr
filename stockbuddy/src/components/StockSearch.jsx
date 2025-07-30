import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api } from '../services/api';
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

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.searchStocksAutocomplete(query);
        if (response.success) {
          setSuggestions(response.results);
        } else {
          setError('Failed to search stocks');
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
        setError('Failed to search stocks. Please try again.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // Handle search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      debouncedSearch(searchTerm);
    } else {
      setSuggestions([]);
      setIsLoading(false);
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
  const handleSuggestionSelect = async (suggestion) => {
    try {
      // Get full quote data for the selected stock
      const response = await api.getStockQuote(suggestion.symbol);
      if (response.success) {
        onStockSelect(response.quote);
      } else {
        // Fallback to suggestion data if quote fails
        onStockSelect({
          symbol: suggestion.symbol,
          name: suggestion.name,
          price: null,
          change: null,
          changePercent: null,
          volume: null
        });
      }
    } catch (error) {
      console.error('Error getting stock quote:', error);
      // Fallback to suggestion data
      onStockSelect({
        symbol: suggestion.symbol,
        name: suggestion.name,
        price: null,
        change: null,
        changePercent: null,
        volume: null
      });
    }

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
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setError(null);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
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
              <div className="suggestion-match-type">
                {getMatchTypeDisplay(suggestion.matchType)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && !isLoading && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <div className="no-results-text">No stocks found</div>
          <div className="no-results-subtext">Try a different search term</div>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 