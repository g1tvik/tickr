import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';
import AppImage from './AppImage';
import { useSEO } from '../lib/seo';
import tk, { label, mono, panel, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from './Icon';
import './ArticleReader.css';

const quizButtonStyle = {
  ...btnPrimary,
  marginTop: 24,
  padding: '11px 20px',
  fontSize: '13px',
  transition: 'opacity 0.2s ease',
};

const quizSecondaryButtonStyle = {
  ...btnGhost,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
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
      borderColor: 'rgba(79,180,119,0.5)',
      background: tk.upBg,
      color: tk.text,
      fontWeight: 600,
    };
    const incorrectStyle = {
      borderColor: 'rgba(224,96,90,0.5)',
      background: tk.downBg,
      color: tk.text,
    };

    return (
      <div key={index} className="quiz-section" style={{ ...panel, padding: 24, margin: '32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <span style={label}>knowledge check</span>
          <span style={{ flex: 1, height: 1, background: tk.hair }} />
          <span style={{ ...mono, fontSize: 11, color: tk.muted }}>{questions.length} Q</span>
        </div>
        <h3 className="quiz-title" style={{ ...heading, fontSize: 20, color: tk.text, marginBottom: 16 }}>{section.title}</h3>

        {questions.map((question, qIndex) => {
          const selected = quizAnswers[`${index}-${qIndex}`];
          return (
            <div key={qIndex} className="question-container">
              <p className="question-text" style={{ display: 'flex', gap: 10, color: tk.text }}>
                <span style={{ ...mono, color: tk.gold }}>{String(qIndex + 1).padStart(2, '0')}</span>
                <span>{question.question}</span>
              </p>
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
                        <Icon name="check" size={14} color={tk.up} />
                      )}
                      {isSubmitted && isSelected && !isCorrectOption && (
                        <Icon name="x" size={14} color={tk.down} />
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
            style={{ ...panel, marginTop: 24, padding: '18px 20px' }}
          >
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: tk.text }}>
              You scored <span style={{ ...mono, color: tk.gold }}>{result.score} / {result.total}</span>
            </p>
            <p style={{ margin: '8px 0 16px', fontSize: 13, color: tk.muted }}>
              {result.score === result.total
                ? 'Perfect score — you’ve got this.'
                : 'Review the highlighted answers above, then try again.'}
            </p>
            <button
              type="button"
              style={quizSecondaryButtonStyle}
              onClick={() => resetQuiz(index, questions)}
            >
              <Icon name="refresh" size={14} /> Try again
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
            <h2 className="section-title" style={{ ...heading, fontSize: 22, color: tk.text }}>{section.title}</h2>
            <p className="section-content" style={{ fontSize: 16, lineHeight: 1.75, color: tk.text }}>{section.content}</p>
          </div>
        );

      case 'quiz':
        return renderQuiz(section, index);

      default:
        return null;
    }
  };

  return (
    <div className="article-reader" style={{ background: tk.bg, color: tk.text, fontFamily: tk.fontBody }}>
      {/* Header */}
      <div className="article-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <Icon name="arrow-left" size={14} /> Back
        </button>
        <div className="article-meta">
          <h1 className="article-title" style={{ ...heading, color: tk.text }}>{article.title}</h1>
          <p className="article-description" style={{ color: tk.muted }}>{article.description}</p>
          <div className="article-info">
            <span className="author" style={{ color: tk.gold }}>{article.author}</span>
            <span aria-hidden="true" style={{ width: 1, height: 12, background: tk.hairStrong }} />
            <span className="read-time" style={{ ...mono, fontSize: 12, color: tk.muted }}>{article.readTime}</span>
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
      <div className="category-badge">
        <span style={{ ...tag, display: 'inline-block' }}>{article.category}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <span style={label}>mentioned in story</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
            <span style={{ ...mono, fontSize: 11, color: tk.muted }}>{article.mentionedStocks.length}</span>
          </div>
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
                  <span className="stock-symbol" style={{ ...mono }}>{stock.symbol}</span>
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
