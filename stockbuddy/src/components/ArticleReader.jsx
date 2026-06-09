import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import AppImage from './AppImage';
import { useSEO } from '../lib/seo';
import './ArticleReader.css';

const quizButtonStyle = {
  marginTop: '1.5rem',
  padding: '0.85rem 1.5rem',
  borderRadius: 8,
  border: 'none',
  background: 'var(--marbleGold)',
  color: 'var(--marbleBlack)',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'opacity 0.2s ease',
};

const quizSecondaryButtonStyle = {
  padding: '0.65rem 1.25rem',
  borderRadius: 8,
  border: '2px solid var(--marbleGold)',
  background: 'transparent',
  color: 'var(--marbleBlack)',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const ArticleReader = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [quizAnswers, setQuizAnswers] = useState({});
  // Track which quiz sections have been submitted, keyed by section index.
  const [submittedQuizzes, setSubmittedQuizzes] = useState({});

  const article = articles.find(a => a.id === articleId);

  // Hooks must run on every render, so call useSEO before any early return.
  useSEO({
    title: article ? article.title : 'Article',
    description: article ? article.description : undefined,
  });

  if (!article) {
    return <div className="article-reader">Article not found.</div>;
  }

  const selectAnswer = (sectionIndex, qIndex, oIndex) => {
    // Lock answers once a quiz has been submitted.
    if (submittedQuizzes[sectionIndex]) return;
    setQuizAnswers(prev => ({
      ...prev,
      [`${sectionIndex}-${qIndex}`]: oIndex,
    }));
  };

  const submitQuiz = (sectionIndex, questions) => {
    const score = questions.reduce((total, question, qIndex) => {
      const answer = quizAnswers[`${sectionIndex}-${qIndex}`];
      return answer === question.correct ? total + 1 : total;
    }, 0);
    setSubmittedQuizzes(prev => ({
      ...prev,
      [sectionIndex]: { score, total: questions.length },
    }));
  };

  const resetQuiz = (sectionIndex, questions) => {
    setSubmittedQuizzes(prev => {
      const next = { ...prev };
      delete next[sectionIndex];
      return next;
    });
    setQuizAnswers(prev => {
      const next = { ...prev };
      questions.forEach((_, qIndex) => {
        delete next[`${sectionIndex}-${qIndex}`];
      });
      return next;
    });
  };

  const renderQuiz = (section, index) => {
    const { questions } = section;
    const result = submittedQuizzes[index];
    const isSubmitted = Boolean(result);
    const allAnswered = questions.every(
      (_, qIndex) => quizAnswers[`${index}-${qIndex}`] !== undefined
    );

    // Inline state styles keep new quiz states on-brand without touching
    // shared CSS (this component owns only ArticleReader.jsx/articles.js).
    const correctStyle = {
      borderColor: '#2E7D32',
      background: 'rgba(46, 125, 50, 0.12)',
      color: 'var(--marbleBlack)',
      fontWeight: 600,
    };
    const incorrectStyle = {
      borderColor: '#C0392B',
      background: 'rgba(192, 57, 43, 0.1)',
      color: 'var(--marbleBlack)',
    };

    return (
      <div key={index} className="quiz-section">
        <h3 className="quiz-title">{section.title}</h3>

        {questions.map((question, qIndex) => {
          const selected = quizAnswers[`${index}-${qIndex}`];
          return (
            <div key={qIndex} className="question-container">
              <p className="question-text">{question.question}</p>
              <div
                className="options-container"
                role="radiogroup"
                aria-label={question.question}
              >
                {question.options.map((option, oIndex) => {
                  const isSelected = selected === oIndex;
                  const isCorrectOption = oIndex === question.correct;
                  let stateClass = '';
                  let stateStyle;
                  if (isSubmitted) {
                    if (isCorrectOption) {
                      stateStyle = correctStyle;
                    } else if (isSelected) {
                      stateStyle = incorrectStyle;
                    }
                  } else if (isSelected) {
                    stateClass = 'selected';
                  }
                  return (
                    <button
                      type="button"
                      key={oIndex}
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isSubmitted}
                      className={`option-button ${stateClass}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        ...(stateStyle || {}),
                      }}
                      onClick={() => selectAnswer(index, qIndex, oIndex)}
                    >
                      <span>{option}</span>
                      {isSubmitted && isCorrectOption && (
                        <span aria-hidden="true" style={{ color: '#2E7D32' }}>✓</span>
                      )}
                      {isSubmitted && isSelected && !isCorrectOption && (
                        <span aria-hidden="true" style={{ color: '#C0392B' }}>✕</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {isSubmitted ? (
          <div
            role="status"
            style={{
              marginTop: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: 10,
              background: 'var(--marbleWhite)',
              border: '1px solid var(--marbleGold)',
            }}
          >
            <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--marbleBlack)' }}>
              You scored {result.score} / {result.total}
            </p>
            <p style={{ margin: '0.5rem 0 1rem', color: 'var(--marbleDarkGray)' }}>
              {result.score === result.total
                ? 'Perfect score — you’ve got this.'
                : 'Review the highlighted answers above, then try again.'}
            </p>
            <button
              type="button"
              style={quizSecondaryButtonStyle}
              onClick={() => resetQuiz(index, questions)}
            >
              Try again
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!allAnswered}
            style={{
              ...quizButtonStyle,
              opacity: allAnswered ? 1 : 0.55,
              cursor: allAnswered ? 'pointer' : 'not-allowed',
            }}
            onClick={() => submitQuiz(index, questions)}
          >
            {allAnswered ? 'Submit answers' : 'Answer all questions to submit'}
          </button>
        )}
      </div>
    );
  };

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
        return renderQuiz(section, index);

      default:
        return null;
    }
  };

  return (
    <div className="article-reader">
      {/* Header */}
      <div className="article-header">
        <button
          type="button"
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
          <AppImage
            src={article.featuredImage}
            alt={article.title}
            ratio="3/2"
            rounded={12}
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
                <AppImage
                  src={stock.logo}
                  alt={`${stock.name} logo`}
                  ratio="1"
                  rounded="50%"
                  objectFit="contain"
                  className="stock-logo"
                  style={{ width: 40, flexShrink: 0 }}
                />
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
