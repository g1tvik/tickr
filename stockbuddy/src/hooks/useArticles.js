import { useState, useEffect } from 'react';

// This hook abstracts article fetching, making it easy to switch between
// local data and API calls in the future

const useArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        
        // For now, import local data
        // In the future, this could be an API call:
        // const response = await fetch('/api/articles');
        // const data = await response.json();
        
        const { articles: localArticles } = await import('../data/articles');
        setArticles(localArticles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const getArticleById = (id) => {
    return articles.find(article => article.id === id);
  };

  const getArticlesByCategory = (categorySlug) => {
    return articles.filter(article => article.categorySlug === categorySlug);
  };

  const searchArticles = (searchTerm) => {
    if (!searchTerm) return articles;
    
    const term = searchTerm.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(term) ||
      article.description.toLowerCase().includes(term) ||
      article.tags.some(tag => tag.toLowerCase().includes(term))
    );
  };

  return {
    articles,
    loading,
    error,
    getArticleById,
    getArticlesByCategory,
    searchArticles
  };
};

export default useArticles; 