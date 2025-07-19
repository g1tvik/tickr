export const articles = [
  {
    id: "investing-basics",
    title: "Investing Basics: What To Expect And How To Start",
    description: "Exploring the long-term benefits of investing, the different ways to invest, the importance of diversification and how to get started.",
    author: "Carl Hazeley",
    readTime: "9 min read",
    category: "Getting Started",
    categorySlug: "getting-started",
    tags: ["basics", "beginners", "diversification"],
    content: {
      sections: [
        {
          type: "text",
          title: "Why even invest?",
          content: "In this pack, we're going to lay out the basics of the wonderful world of investing. Don't worry though, we're going to ease you in..."
        },
        {
          type: "quiz",
          title: "Quick Check",
          questions: [
            {
              question: "What is the main benefit of long-term investing?",
              options: ["Quick profits", "Compound growth", "No risk", "Guaranteed returns"],
              correct: 1
            }
          ]
        }
      ]
    },
    featuredImage: "/images/investing-basics.jpg",
    mentionedStocks: [
      { symbol: "NKE", name: "Nike, Inc.", logo: "/images/nike-logo.png" },
      { symbol: "BRK.A", name: "Berkshire Hathaway Inc.", logo: "/images/berkshire-logo.png" }
    ],
    publishedAt: "2024-01-15",
    difficulty: "beginner"
  },
  {
    id: "portfolio-construction",
    title: "How To Build A Perfectly Balanced Portfolio",
    description: "Learn the fundamentals of portfolio construction and asset allocation strategies.",
    author: "Carl Hazeley",
    readTime: "12 min read",
    category: "Investment Strategies",
    categorySlug: "investment-strategies",
    tags: ["portfolio", "allocation", "balance"],
    content: {
      sections: [
        {
          type: "text",
          title: "The 60/40 Rule",
          content: "A traditional portfolio allocation consists of 60% stocks and 40% bonds..."
        }
      ]
    },
    featuredImage: "/images/portfolio-chart.jpg",
    mentionedStocks: [],
    publishedAt: "2024-01-20",
    difficulty: "intermediate"
  },
  {
    id: "investment-scams",
    title: "Don't Get Fooled: Things To Watch Out For To Avoid Investment Scams",
    description: "Learn from history's biggest scams",
    author: "Carl Hazeley",
    readTime: "11 min read",
    category: "Risk Management",
    categorySlug: "risk-management",
    tags: ["scams", "fraud", "red-flags"],
    content: {
      sections: [
        {
          type: "text",
          title: "Ponzi's Scheme",
          content: "This Pack is all about how to spot dodgy deals. We'll show you the lessons you can learn from history's biggest scams – like Charles Ponzi and Bernie Madoff – so that you can avoid falling prey yourself."
        }
      ]
    },
    featuredImage: "/images/pyramid-scheme.jpg",
    mentionedStocks: [],
    publishedAt: "2024-01-25",
    difficulty: "beginner"
  }
];

export const categories = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "How do I get started with investing?",
    color: "#1e3a8a",
    icon: "🚀"
  },
  {
    slug: "personal-finances",
    title: "Personal Finances",
    description: "How can I best manage my personal finances?",
    color: "#92400e",
    icon: "💰"
  },
  {
    slug: "investment-strategies",
    title: "Investment Strategies",
    description: "What kind of investor should I be?",
    color: "#065f46",
    icon: "📈"
  },
  {
    slug: "market-forces",
    title: "Market & Economic Forces",
    description: "What's happening in the world, and how does it impact my money?",
    color: "#7c2d12",
    icon: "🌍"
  },
  {
    slug: "sectors-themes",
    title: "Sectors & Themes",
    description: "Where are the biggest investment opportunities by industry or trend?",
    color: "#581c87",
    icon: "🏭"
  },
  {
    slug: "analyzing-investments",
    title: "Analyzing Investments",
    description: "How do I evaluate any stock, fund, or asset?",
    color: "#1e40af",
    icon: "🔍"
  }
]; 