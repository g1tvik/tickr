import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { articles, categories } from '../data/articles';
import './Discover.css';

const Discover = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(article => {
    const matchesCategory = !selectedCategory || article.categorySlug === selectedCategory;
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="discover-page">
      {/* Header */}
      <div className="discover-header">
        <h1 className="page-title">Education</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-section">
        <h2 className="section-title">Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.slug}
              className={`category-card ${selectedCategory === category.slug ? 'selected' : ''}`}
              style={{ 
                background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedCategory(
                selectedCategory === category.slug ? null : category.slug
              )}
            >
              <div className="category-icon">{category.icon}</div>
              <h3 className="category-title">{category.title}</h3>
              <p className="category-description">{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="articles-section">
        <h2 className="section-title">
          {selectedCategory 
            ? `${categories.find(c => c.slug === selectedCategory)?.title} Articles`
            : 'All Articles'
          }
        </h2>
        <div className="articles-grid">
          {filteredArticles.map((article) => (
            <Link 
              key={article.id} 
              to={`/article/${article.id}`}
              className="article-card"
            >
              <div className="article-image-container">
                <img 
                  src={article.featuredImage || '/images/article-placeholder.jpg'} 
                  alt={article.title}
                  className="article-image"
                />
                <div className="article-category-badge">
                  {article.category}
                </div>
              </div>
              <div className="article-content">
                <div className="article-meta">
                  <span className="article-category">{article.category}</span>
                  <span className="article-read-time">{article.readTime}</span>
                </div>
                <h3 className="article-title">{article.title}</h3>
                <p className="article-description">{article.description}</p>
                <div className="article-author">
                  <span className="author-name">{article.author}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredArticles.length === 0 && (
        <div className="no-results">
          <p>No articles found matching your criteria.</p>
          <button 
            onClick={() => {
              setSelectedCategory(null);
              setSearchTerm('');
            }}
            className="clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Discover; 