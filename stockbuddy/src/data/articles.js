export const categories = [
  {
    slug: 'investing-basics',
    title: 'Investing Basics',
    description: 'Learn the fundamentals of investing',
    color: '#4CAF50',
    icon: '📈'
  },
  {
    slug: 'stock-analysis',
    title: 'Stock Analysis',
    description: 'How to analyze stocks and make informed decisions',
    color: '#2196F3',
    icon: '📊'
  },
  {
    slug: 'market-news',
    title: 'Market News',
    description: 'Latest updates and insights from the market',
    color: '#FF9800',
    icon: '📰'
  },
  {
    slug: 'trading-strategies',
    title: 'Trading Strategies',
    description: 'Advanced trading techniques and strategies',
    color: '#9C27B0',
    icon: '🎯'
  }
];

export const articles = [
  {
    id: 'getting-started-investing',
    title: 'Getting Started with Investing: A Complete Guide',
    description: 'Learn the essential steps to begin your investment journey and build wealth over time.',
    author: 'Sarah Johnson',
    readTime: '8 min read',
    category: 'Investing Basics',
    categorySlug: 'investing-basics',
    categoryColor: '#4CAF50',
    featuredImage: '/images/investing-basics.jpg',
    tags: ['beginner', 'investing', 'wealth-building'],
    mentionedStocks: [
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        logo: '/images/spy-logo.png'
      },
      {
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        logo: '/images/vti-logo.png'
      }
    ],
    content: {
      sections: [
        {
          type: 'text',
          title: 'What is Investing?',
          content: 'Investing is the act of allocating resources, usually money, with the expectation of generating an income or profit. Unlike saving, which focuses on preserving money, investing aims to grow your wealth over time through various financial instruments.'
        },
        {
          type: 'text',
          title: 'Why Should You Invest?',
          content: 'Investing is crucial for building long-term wealth and achieving financial goals. It helps combat inflation, provides passive income, and can significantly increase your net worth over time through compound growth.'
        },
        {
          type: 'quiz',
          title: 'Investment Knowledge Check',
          questions: [
            {
              question: 'What is the primary goal of investing?',
              options: [
                'To preserve money',
                'To grow wealth over time',
                'To spend money immediately',
                'To avoid taxes'
              ]
            },
            {
              question: 'Which of the following is NOT a common investment type?',
              options: [
                'Stocks',
                'Bonds',
                'Real Estate',
                'Grocery shopping'
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'stock-analysis-fundamentals',
    title: 'Stock Analysis Fundamentals: Reading Financial Statements',
    description: 'Master the basics of analyzing company financial statements to make informed investment decisions.',
    author: 'Michael Chen',
    readTime: '12 min read',
    category: 'Stock Analysis',
    categorySlug: 'stock-analysis',
    categoryColor: '#2196F3',
    featuredImage: '/images/stock-analysis.jpg',
    tags: ['analysis', 'financial-statements', 'fundamentals'],
    mentionedStocks: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        logo: '/images/aapl-logo.png'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        logo: '/images/msft-logo.png'
      }
    ],
    content: {
      sections: [
        {
          type: 'text',
          title: 'Understanding Financial Statements',
          content: 'Financial statements are the foundation of stock analysis. They provide crucial information about a company\'s financial health, performance, and future prospects. The three main statements are the income statement, balance sheet, and cash flow statement.'
        },
        {
          type: 'text',
          title: 'Key Financial Ratios',
          content: 'Financial ratios help investors compare companies and assess their relative value. Important ratios include P/E ratio, debt-to-equity ratio, return on equity (ROE), and current ratio.'
        },
        {
          type: 'quiz',
          title: 'Financial Analysis Quiz',
          questions: [
            {
              question: 'Which financial statement shows a company\'s profitability over time?',
              options: [
                'Balance Sheet',
                'Income Statement',
                'Cash Flow Statement',
                'Statement of Equity'
              ]
            },
            {
              question: 'What does a high P/E ratio typically indicate?',
              options: [
                'The stock is undervalued',
                'Investors expect high growth',
                'The company is in financial trouble',
                'The stock pays high dividends'
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'market-trends-2024',
    title: 'Market Trends to Watch in 2024',
    description: 'Explore the key market trends and sectors that are expected to shape the investment landscape this year.',
    author: 'Emily Rodriguez',
    readTime: '10 min read',
    category: 'Market News',
    categorySlug: 'market-news',
    categoryColor: '#FF9800',
    featuredImage: '/images/market-trends.jpg',
    tags: ['trends', '2024', 'market-outlook'],
    mentionedStocks: [
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        logo: '/images/nvda-logo.png'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        logo: '/images/tsla-logo.png'
      }
    ],
    content: {
      sections: [
        {
          type: 'text',
          title: 'AI and Technology Revolution',
          content: 'Artificial intelligence continues to be a dominant theme in 2024, with companies across various sectors integrating AI into their operations. This trend is creating new investment opportunities in both established tech companies and emerging startups.'
        },
        {
          type: 'text',
          title: 'Sustainable Investing Growth',
          content: 'Environmental, Social, and Governance (ESG) investing is gaining momentum as investors increasingly consider sustainability factors in their decision-making process. Companies with strong ESG practices are attracting more capital.'
        },
        {
          type: 'quiz',
          title: 'Market Trends Quiz',
          questions: [
            {
              question: 'Which sector is leading the AI revolution in 2024?',
              options: [
                'Healthcare',
                'Technology',
                'Energy',
                'Consumer Goods'
              ]
            },
            {
              question: 'What does ESG stand for in sustainable investing?',
              options: [
                'Economic, Social, Growth',
                'Environmental, Social, Governance',
                'Energy, Sustainability, Goals',
                'Enterprise, Strategy, Growth'
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'day-trading-strategies',
    title: 'Day Trading Strategies for Beginners',
    description: 'Learn essential day trading strategies and risk management techniques for active traders.',
    author: 'David Kim',
    readTime: '15 min read',
    category: 'Trading Strategies',
    categorySlug: 'trading-strategies',
    categoryColor: '#9C27B0',
    featuredImage: '/images/day-trading.jpg',
    tags: ['day-trading', 'strategies', 'risk-management'],
    mentionedStocks: [
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        logo: '/images/spy-logo.png'
      },
      {
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust',
        logo: '/images/qqq-logo.png'
      }
    ],
    content: {
      sections: [
        {
          type: 'text',
          title: 'What is Day Trading?',
          content: 'Day trading involves buying and selling financial instruments within the same trading day. Day traders aim to profit from short-term price movements and typically close all positions before the market closes.'
        },
        {
          type: 'text',
          title: 'Essential Risk Management',
          content: 'Risk management is crucial for day traders. This includes setting stop-loss orders, position sizing, and never risking more than 1-2% of your trading capital on any single trade.'
        },
        {
          type: 'quiz',
          title: 'Day Trading Knowledge Check',
          questions: [
            {
              question: 'What is the maximum percentage of capital you should risk on a single day trade?',
              options: [
                '5-10%',
                '1-2%',
                '10-15%',
                '20-25%'
              ]
            },
            {
              question: 'When should day traders typically close their positions?',
              options: [
                'At the end of the week',
                'Before market close',
                'After holding for a month',
                'When the stock pays dividends'
              ]
            }
          ]
        }
      ]
    }
  }
]; 