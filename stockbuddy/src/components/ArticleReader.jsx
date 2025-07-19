import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import './ArticleReader.css';

const ArticleReader = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});

  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return <div>Article not found.</div>;
  }

  const renderSection = (section, index) => {
    switch (section.type) {
      case 'text':
        return (
          <div key={index} className="article-section">
            <h2 className="section-title">{section.title}</h2>
            <p className="section-content">{section.content}</p>
          </div>
        );
      
      case 'quiz':
        return (
          <div key={index} className="quiz-section">
            <h3 className="quiz-title">{section.title}</h3>
            {section.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-container">
                <p className="question-text">{question.question}</p>
                <div className="options-container">
                  {question.options.map((option, oIndex) => (
                    <button
                      key={oIndex}
                      className={`option-button ${
                        quizAnswers[`${index}-${qIndex}`] === oIndex ? 'selected' : ''
                      }`}
                      onClick={() => setQuizAnswers({
                        ...quizAnswers,
                        [`${index}-${qIndex}`]: oIndex
                      })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="article-reader">
      {/* Header */}
      <div className="article-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div className="article-meta">
          <h1 className="article-title">{article.title}</h1>
          <p className="article-description">{article.description}</p>
          <div className="article-info">
            <span className="author">{article.author}</span>
            <span className="read-time">{article.readTime}</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="featured-image-container">
          <img 
            src={article.featuredImage} 
            alt={article.title}
            className="featured-image"
          />
        </div>
      )}

      {/* Category Badge */}
      <div className="category-badge" style={{ backgroundColor: article.categoryColor }}>
        {article.category}
      </div>

      {/* Article Content */}
      <div className="article-content">
        {article.content.sections.map((section, index) => 
          renderSection(section, index)
        )}
      </div>

      {/* Mentioned Stocks */}
      {article.mentionedStocks.length > 0 && (
        <div className="mentioned-stocks">
          <h3>Mentioned in Story</h3>
          <div className="stocks-grid">
            {article.mentionedStocks.map((stock, index) => (
              <div key={index} className="stock-card">
                <img src={stock.logo} alt={stock.name} className="stock-logo" />
                <div className="stock-info">
                  <span className="stock-symbol">{stock.symbol}</span>
                  <span className="stock-name">{stock.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleReader; 