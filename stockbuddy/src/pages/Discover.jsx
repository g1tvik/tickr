import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { articles, categories } from '../data/articles';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const Discover = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredArticles = articles.filter(article => {
    const matchesCategory = !selectedCategory || article.categorySlug === selectedCategory;
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.id.localeCompare(a.id);
      case 'oldest':
        return a.id.localeCompare(b.id);
      case 'readTime':
        return parseInt(a.readTime) - parseInt(b.readTime);
      default:
        return 0;
    }
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: marbleWhite,
      padding: '24px',
      fontFamily: fontBody
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: '16px'
          }}>
            Discover
          </h1>
          <p style={{
            fontSize: '18px',
            color: marbleGray,
            marginBottom: '32px'
          }}>
            Explore educational content, market insights, and trading strategies
          </p>

          {/* Search Bar */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Search articles, topics, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '12px',
                border: `2px solid ${marbleLightGray}`,
                fontSize: '16px',
                backgroundColor: marbleWhite,
                color: marbleDarkGray,
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: marbleGray,
              fontSize: '20px'
            }}>
              🔍
            </div>
          </div>
        </div>

        {/* Categories */}
        <div style={{
          marginBottom: '48px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            marginBottom: '24px',
            fontFamily: fontHeading
          }}>
            Browse by Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {categories.map((category) => (
              <div
                key={category.slug}
                style={{
                  backgroundColor: selectedCategory === category.slug ? marbleGold : marbleLightGray,
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: selectedCategory === category.slug ? `2px solid ${marbleDarkGray}` : 'none',
                  transform: selectedCategory === category.slug ? 'scale(1.02)' : 'scale(1)'
                }}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.slug ? null : category.slug
                )}
              >
                <div style={{
                  fontSize: '32px',
                  marginBottom: '16px'
                }}>
                  {category.icon}
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: selectedCategory === category.slug ? marbleDarkGray : marbleDarkGray,
                  marginBottom: '8px'
                }}>
                  {category.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: selectedCategory === category.slug ? marbleDarkGray : marbleGray,
                  lineHeight: '1.4'
                }}>
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Articles Section */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              fontFamily: fontHeading
            }}>
              {selectedCategory 
                ? `${categories.find(c => c.slug === selectedCategory)?.title} Articles`
                : 'All Articles'
              }
              <span style={{
                fontSize: '16px',
                color: marbleGray,
                fontWeight: 'normal',
                marginLeft: '12px'
              }}>
                ({sortedArticles.length} articles)
              </span>
            </h2>

            {/* Sort Options */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{
                fontSize: '14px',
                color: marbleGray
              }}>
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${marbleGray}`,
                  backgroundColor: marbleWhite,
                  color: marbleDarkGray,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="readTime">Read Time</option>
              </select>
            </div>
          </div>

          {/* Articles Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {sortedArticles.map((article) => (
              <Link 
                key={article.id} 
                to={`/article/${article.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{
                  backgroundColor: marbleLightGray,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Article Image */}
                  <div style={{
                    height: '200px',
                    backgroundColor: article.categoryColor || marbleGray,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px'
                  }}>
                    {article.featuredImage ? (
                      <img 
                        src={article.featuredImage}
                        alt={article.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '48px',
                        color: marbleWhite
                      }}>
                        📰
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: marbleWhite,
                      color: article.categoryColor || marbleDarkGray,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {article.category}
                    </div>
                  </div>

                  {/* Article Content */}
                  <div style={{
                    padding: '24px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: marbleGray,
                        textTransform: 'uppercase',
                        fontWeight: '500'
                      }}>
                        {article.category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: marbleGray
                      }}>
                        {article.readTime}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: marbleDarkGray,
                      marginBottom: '12px',
                      lineHeight: '1.4'
                    }}>
                      {article.title}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: marbleGray,
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      flex: 1
                    }}>
                      {article.description}
                    </p>

                    {/* Tags */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '16px'
                    }}>
                      {article.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            backgroundColor: marbleWhite,
                            color: marbleDarkGray,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Author */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        color: marbleGray
                      }}>
                        By {article.author}
                      </span>
                      <div style={{
                        fontSize: '12px',
                        color: marbleGold,
                        fontWeight: '600'
                      }}>
                        Read More →
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {sortedArticles.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: marbleLightGray,
              borderRadius: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                🔍
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '8px'
              }}>
                No articles found
              </h3>
              <p style={{
                fontSize: '16px',
                color: marbleGray,
                marginBottom: '24px'
              }}>
                Try adjusting your search terms or filters
              </p>
              <button 
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchTerm('');
                }}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover; 