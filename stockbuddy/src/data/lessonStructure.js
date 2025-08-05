export const lessonStructure = {
  units: [
    {
      id: 1,
      title: "Investing Fundamentals",
      description: "Learn the basics of investing and financial markets",
      lessons: [
        {
          id: 1,
          title: "What is Investing?",
          description: "Understanding the basics of investing and why it matters",
          duration: "12 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "Introduction to Investing",
              content: "Investing is the act of allocating money or capital to an endeavor with the expectation of generating an income or profit. Unlike saving, which focuses on preserving money, investing aims to grow your wealth over time."
            },
            {
              type: "text",
              title: "Why Invest?",
              content: "Investing helps combat inflation, provides passive income, and can significantly increase your net worth through compound growth. It's essential for building long-term wealth and achieving financial goals."
            },
            {
              type: "text",
              title: "Types of Investments",
              content: "Common investment types include stocks, bonds, mutual funds, ETFs, real estate, and commodities. Each has different risk levels and potential returns."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is the primary goal of investing?",
                options: ["To preserve money", "To grow wealth over time", "To spend money immediately", "To avoid taxes"],
                correct: 1
              },
              {
                question: "Which of the following is NOT a common investment type?",
                options: ["Stocks", "Bonds", "Grocery shopping", "Real estate"],
                correct: 2
              },
              {
                question: "What helps combat the effects of inflation?",
                options: ["Saving money", "Investing money", "Spending money", "Borrowing money"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 2,
          title: "Risk vs Reward",
          description: "Understanding the relationship between risk and potential returns",
          duration: "15 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "The Risk-Reward Relationship",
              content: "Generally, higher potential returns come with higher risk. Safe investments like government bonds offer lower returns, while stocks offer higher potential returns but more volatility."
            },
            {
              type: "text",
              title: "Types of Risk",
              content: "Investment risks include market risk, inflation risk, interest rate risk, and company-specific risk. Understanding these helps make informed decisions."
            },
            {
              type: "text",
              title: "Diversification",
              content: "Diversification spreads risk across different investments, reducing the impact of any single investment's poor performance on your overall portfolio."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is the general relationship between risk and reward?",
                options: ["Higher risk = lower reward", "Higher risk = higher reward", "No relationship", "Risk and reward are the same"],
                correct: 1
              },
              {
                question: "What is diversification?",
                options: ["Investing in one company", "Spreading risk across different investments", "Avoiding all risk", "Only investing in safe options"],
                correct: 1
              },
              {
                question: "Which investment typically has the highest risk?",
                options: ["Government bonds", "Blue-chip stocks", "Startup stocks", "Savings account"],
                correct: 2
              }
            ]
          }
        },
        {
          id: 3,
          title: "Compound Interest",
          description: "The power of compound interest and time in investing",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "What is Compound Interest?",
              content: "Compound interest is when you earn interest on both your original investment and the accumulated interest from previous periods. This creates exponential growth over time."
            },
            {
              type: "text",
              title: "The Time Factor",
              content: "Time is your greatest ally in investing. Starting early allows compound interest to work in your favor, even with smaller initial investments."
            },
            {
              type: "text",
              title: "Example of Compound Growth",
              content: "If you invest $1,000 at 7% annual return, after 10 years you'll have $1,967. After 20 years, you'll have $3,870. After 30 years, $7,612."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is compound interest?",
                options: ["Interest on your original investment only", "Interest on both principal and accumulated interest", "Simple interest", "A type of tax"],
                correct: 1
              },
              {
                question: "What is the most important factor in compound growth?",
                options: ["Amount invested", "Time", "Interest rate", "Investment type"],
                correct: 1
              },
              {
                question: "If you invest $100 at 10% for 2 years, how much will you have?",
                options: ["$110", "$120", "$121", "$200"],
                correct: 2
              }
            ]
          }
        },
        {
          id: 4,
          title: "Investment Accounts",
          description: "Different types of investment accounts and their benefits",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "Types of Accounts",
              content: "Common account types include 401(k)s, IRAs, Roth IRAs, and taxable brokerage accounts. Each has different tax advantages and contribution limits."
            },
            {
              type: "text",
              title: "Tax-Advantaged Accounts",
              content: "401(k)s and traditional IRAs offer tax-deferred growth, while Roth IRAs offer tax-free withdrawals in retirement. Choose based on your tax situation."
            },
            {
              type: "text",
              title: "Brokerage Accounts",
              content: "Taxable brokerage accounts offer flexibility but no tax advantages. They're good for short-term goals or when you've maxed out tax-advantaged accounts."
            }
          ],
          quiz: {
            questions: [
              {
                question: "Which account type offers tax-free withdrawals in retirement?",
                options: ["Traditional IRA", "Roth IRA", "401(k)", "Taxable brokerage"],
                correct: 1
              },
              {
                question: "What is a 401(k)?",
                options: ["A type of bond", "An employer-sponsored retirement plan", "A stock index", "A savings account"],
                correct: 1
              },
              {
                question: "Which account has the most flexibility but no tax advantages?",
                options: ["Roth IRA", "Traditional IRA", "401(k)", "Taxable brokerage"],
                correct: 3
              }
            ]
          }
        },
        {
          id: 5,
          title: "Setting Investment Goals",
          description: "How to set and achieve your investment objectives",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "SMART Goals",
              content: "Set Specific, Measurable, Achievable, Relevant, and Time-bound investment goals. Examples include saving for retirement, buying a house, or building an emergency fund."
            },
            {
              type: "text",
              title: "Time Horizons",
              content: "Short-term goals (1-3 years) need conservative investments. Medium-term goals (3-10 years) can use balanced portfolios. Long-term goals (10+ years) can take more risk."
            },
            {
              type: "text",
              title: "Regular Review",
              content: "Review and adjust your investment goals annually or when major life changes occur. This ensures your strategy stays aligned with your objectives."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What does SMART stand for in goal setting?",
                options: ["Simple, Measurable, Achievable, Realistic, Timely", "Specific, Measurable, Achievable, Relevant, Time-bound", "Smart, Meaningful, Attainable, Relevant, Timely", "Specific, Measurable, Attainable, Realistic, Time-bound"],
                correct: 1
              },
              {
                question: "For short-term goals (1-3 years), you should use:",
                options: ["Aggressive investments", "Conservative investments", "No investments", "Only stocks"],
                correct: 1
              },
              {
                question: "How often should you review your investment goals?",
                options: ["Never", "Monthly", "Annually", "Every 5 years"],
                correct: 2
              }
            ]
          }
        }
      ],
      unitTest: {
        questions: [
          {
            question: "What is the primary purpose of investing?",
            options: ["To preserve money", "To grow wealth over time", "To spend money immediately", "To avoid taxes"],
            correct: 1
          },
          {
            question: "Which investment typically offers the highest potential returns?",
            options: ["Savings account", "Government bonds", "Blue-chip stocks", "Startup stocks"],
            correct: 3
          },
          {
            question: "What is compound interest?",
            options: ["Interest on principal only", "Interest on principal and accumulated interest", "Simple interest", "A type of tax"],
            correct: 1
          },
          {
            question: "Which account offers tax-free withdrawals in retirement?",
            options: ["Traditional IRA", "Roth IRA", "401(k)", "Taxable brokerage"],
            correct: 1
          },
          {
            question: "What is the most important factor in long-term investing success?",
            options: ["Amount invested", "Time in the market", "Interest rate", "Investment type"],
            correct: 1
          }
        ],
        xp: 100,
        coins: 50
      }
    },
    {
      id: 2,
      title: "Stock Market Basics",
      description: "Understanding how the stock market works",
      lessons: [
        {
          id: 6,
          title: "What are Stocks?",
          description: "Understanding stock ownership and company shares",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "Stock Ownership",
              content: "When you buy a stock, you're purchasing a small piece of ownership in a company. This makes you a shareholder with a claim on the company's assets and earnings."
            },
            {
              type: "text",
              title: "Types of Stocks",
              content: "Common stocks give you voting rights and potential dividends. Preferred stocks offer fixed dividends but usually no voting rights. Growth stocks focus on capital appreciation."
            },
            {
              type: "text",
              title: "Stock Exchanges",
              content: "Stocks are traded on exchanges like the NYSE and NASDAQ. These provide a marketplace where buyers and sellers can meet to trade shares."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What do you own when you buy a stock?",
                options: ["A piece of the company", "A loan to the company", "A bond", "A mutual fund"],
                correct: 0
              },
              {
                question: "Which type of stock typically offers voting rights?",
                options: ["Preferred stock", "Common stock", "Bond", "ETF"],
                correct: 1
              },
              {
                question: "Where are stocks primarily traded?",
                options: ["Banks", "Stock exchanges", "Grocery stores", "Online retailers"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 7,
          title: "How Stock Prices Work",
          description: "Understanding supply, demand, and price movements",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "Supply and Demand",
              content: "Stock prices are determined by supply and demand. When more people want to buy (demand) than sell (supply), prices go up. When more people want to sell than buy, prices go down."
            },
            {
              type: "text",
              title: "Market Sentiment",
              content: "Investor emotions and expectations drive market sentiment. Positive news can drive prices up, while negative news can drive them down."
            },
            {
              type: "text",
              title: "Company Performance",
              content: "A company's financial performance, earnings reports, and future prospects significantly impact its stock price. Strong earnings typically lead to higher prices."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What primarily determines stock prices?",
                options: ["Government regulation", "Supply and demand", "Company size", "CEO salary"],
                correct: 1
              },
              {
                question: "When stock prices go up, it means:",
                options: ["More people want to sell", "More people want to buy", "The company is failing", "Interest rates are high"],
                correct: 1
              },
              {
                question: "What can drive stock prices higher?",
                options: ["Poor earnings reports", "Positive company news", "High unemployment", "Economic recession"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 8,
          title: "Market Hours and Trading",
          description: "Understanding when and how trading occurs",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "Regular Trading Hours",
              content: "The stock market is open Monday through Friday, 9:30 AM to 4:00 PM Eastern Time. Markets are closed on weekends and major holidays."
            },
            {
              type: "text",
              title: "Extended Hours Trading",
              content: "Pre-market trading starts at 4:00 AM, and after-hours trading continues until 8:00 PM. These sessions have lower volume and higher volatility."
            },
            {
              type: "text",
              title: "Order Types",
              content: "Market orders execute immediately at current prices. Limit orders execute only at specified prices or better. Stop orders become market orders when triggered."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What are regular market hours?",
                options: ["9:30 AM - 4:00 PM ET", "8:00 AM - 5:00 PM ET", "24 hours", "10:00 AM - 3:00 PM ET"],
                correct: 0
              },
              {
                question: "Which order type executes immediately?",
                options: ["Limit order", "Market order", "Stop order", "Stop-limit order"],
                correct: 1
              },
              {
                question: "When are markets closed?",
                options: ["Weekends and holidays", "Only weekends", "Only holidays", "Never"],
                correct: 0
              }
            ]
          }
        },
        {
          id: 9,
          title: "Bid and Ask Prices",
          description: "Understanding the spread and market makers",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "Bid vs Ask",
              content: "The bid price is what buyers are willing to pay. The ask price is what sellers are asking for. The difference is called the spread."
            },
            {
              type: "text",
              title: "The Spread",
              content: "The spread represents the market maker's profit and trading costs. Tighter spreads indicate more liquid markets with active trading."
            },
            {
              type: "text",
              title: "Market Makers",
              content: "Market makers provide liquidity by buying and selling stocks. They profit from the spread and help ensure smooth trading."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is the bid price?",
                options: ["What sellers are asking", "What buyers are willing to pay", "The current stock price", "The market price"],
                correct: 1
              },
              {
                question: "What is the spread?",
                options: ["The difference between bid and ask", "The stock price", "Trading volume", "Market hours"],
                correct: 0
              },
              {
                question: "Who typically profits from the spread?",
                options: ["Individual investors", "Market makers", "The government", "Company executives"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 10,
          title: "Stock Indices",
          description: "Understanding market benchmarks and indices",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "What are Indices?",
              content: "Stock indices track the performance of groups of stocks. They serve as benchmarks for market performance and help investors gauge overall market trends."
            },
            {
              type: "text",
              title: "Major Indices",
              content: "The S&P 500 tracks 500 large US companies. The Dow Jones tracks 30 major companies. The NASDAQ focuses on technology stocks."
            },
            {
              type: "text",
              title: "Using Indices",
              content: "Indices help investors compare their portfolio performance to the broader market. They also provide insight into market trends and sentiment."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What does the S&P 500 track?",
                options: ["30 major companies", "500 large US companies", "Technology stocks only", "International stocks"],
                correct: 1
              },
              {
                question: "What is the purpose of stock indices?",
                options: ["To track individual stocks", "To serve as market benchmarks", "To predict future prices", "To replace individual stocks"],
                correct: 1
              },
              {
                question: "Which index focuses on technology stocks?",
                options: ["S&P 500", "Dow Jones", "NASDAQ", "Russell 2000"],
                correct: 2
              }
            ]
          }
        }
      ],
      unitTest: {
        questions: [
          {
            question: "What do you own when you buy a stock?",
            options: ["A piece of the company", "A loan to the company", "A bond", "A mutual fund"],
            correct: 0
          },
          {
            question: "What primarily determines stock prices?",
            options: ["Government regulation", "Supply and demand", "Company size", "CEO salary"],
            correct: 1
          },
          {
            question: "What is the bid price?",
            options: ["What sellers are asking", "What buyers are willing to pay", "The current stock price", "The market price"],
            correct: 1
          },
          {
            question: "What is the spread?",
            options: ["The difference between bid and ask", "The stock price", "Trading volume", "Market hours"],
            correct: 0
          },
          {
            question: "What does the S&P 500 track?",
            options: ["30 major companies", "500 large US companies", "Technology stocks only", "International stocks"],
            correct: 1
          }
        ],
        xp: 120,
        coins: 60
      }
    },
    {
      id: 3,
      title: "Technical Analysis",
      description: "Learn to read charts and use technical indicators",
      lessons: [
        {
          id: 11,
          title: "Chart Types",
          description: "Understanding different types of stock charts",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "Line Charts",
              content: "Line charts show the closing price over time with a simple line connecting the points. They're good for seeing overall trends but lack detail about price movements within each period."
            },
            {
              type: "text",
              title: "Bar Charts",
              content: "Bar charts show open, high, low, and close prices for each period. Each bar represents one time period, with the top being the high and bottom being the low."
            },
            {
              type: "text",
              title: "Candlestick Charts",
              content: "Candlestick charts are the most popular. Each candle shows open, high, low, and close prices. Green candles indicate price went up, red candles indicate price went down."
            }
          ],
          quiz: {
            questions: [
              {
                question: "Which chart type shows the most detail?",
                options: ["Line charts", "Bar charts", "Candlestick charts", "All show equal detail"],
                correct: 2
              },
              {
                question: "What does a green candlestick indicate?",
                options: ["Price went down", "Price went up", "No change", "High volume"],
                correct: 1
              },
              {
                question: "What information do bar charts show?",
                options: ["Only closing prices", "Open, high, low, close", "Only high and low", "Volume only"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 12,
          title: "Support and Resistance",
          description: "Understanding key price levels",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "Support Levels",
              content: "Support is a price level where a stock tends to stop falling and bounce back up. It's like a floor that prevents the price from going lower."
            },
            {
              type: "text",
              title: "Resistance Levels",
              content: "Resistance is a price level where a stock tends to stop rising and fall back down. It's like a ceiling that prevents the price from going higher."
            },
            {
              type: "text",
              title: "Breakouts",
              content: "When price breaks through support or resistance, it often signals a significant move in that direction. Breakouts can be powerful trading signals."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is support?",
                options: ["A price level where stock stops falling", "A price level where stock stops rising", "A technical indicator", "A trading strategy"],
                correct: 0
              },
              {
                question: "What happens during a breakout?",
                options: ["Price stays the same", "Price breaks through support/resistance", "Volume decreases", "Trading stops"],
                correct: 1
              },
              {
                question: "What is resistance?",
                options: ["A price level where stock stops falling", "A price level where stock stops rising", "A technical indicator", "A trading strategy"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 13,
          title: "Moving Averages",
          description: "Using moving averages to identify trends",
          duration: "18 min",
          xp: 40,
          coins: 30,
          content: [
            {
              type: "text",
              title: "Simple Moving Average (SMA)",
              content: "A simple moving average calculates the average price over a specific number of periods. For example, a 20-day SMA averages the closing prices of the last 20 days."
            },
            {
              type: "text",
              title: "Exponential Moving Average (EMA)",
              content: "EMA gives more weight to recent prices, making it more responsive to current market conditions. It's often preferred by traders for its sensitivity."
            },
            {
              type: "text",
              title: "Moving Average Crossovers",
              content: "When a shorter-term moving average crosses above a longer-term one, it's a bullish signal. When it crosses below, it's bearish."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is a Simple Moving Average?",
                options: ["Average of recent prices", "Average of all prices", "Average of future prices", "Average of volume"],
                correct: 0
              },
              {
                question: "Which moving average is more responsive?",
                options: ["SMA", "EMA", "Both are equal", "Neither"],
                correct: 1
              },
              {
                question: "What is a bullish crossover?",
                options: ["Short MA crosses below long MA", "Short MA crosses above long MA", "Both MAs go down", "Both MAs go up"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 14,
          title: "Volume Analysis",
          description: "Understanding trading volume and its significance",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "What is Volume?",
              content: "Volume is the number of shares traded during a given period. High volume often indicates strong interest in a stock."
            },
            {
              type: "text",
              title: "Volume and Price",
              content: "When price moves up with high volume, it's a strong bullish signal. When price moves down with high volume, it's a strong bearish signal."
            },
            {
              type: "text",
              title: "Volume Patterns",
              content: "Low volume during price moves suggests weak conviction. High volume during breakouts confirms the move is legitimate."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is volume?",
                options: ["Price of stock", "Number of shares traded", "Market cap", "P/E ratio"],
                correct: 1
              },
              {
                question: "What does high volume with price increase indicate?",
                options: ["Weak signal", "Strong bullish signal", "Bearish signal", "No signal"],
                correct: 1
              },
              {
                question: "What confirms a breakout?",
                options: ["Low volume", "High volume", "No volume", "Price only"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 15,
          title: "RSI and MACD",
          description: "Popular technical indicators for trading decisions",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "Relative Strength Index (RSI)",
              content: "RSI measures the speed and magnitude of price changes. Values above 70 indicate overbought conditions, below 30 indicate oversold conditions."
            },
            {
              type: "text",
              title: "Moving Average Convergence Divergence (MACD)",
              content: "MACD shows the relationship between two moving averages. It helps identify momentum and potential trend changes."
            },
            {
              type: "text",
              title: "Using Indicators Together",
              content: "Don't rely on just one indicator. Use multiple indicators together to confirm signals and reduce false positives."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What does RSI above 70 indicate?",
                options: ["Oversold", "Overbought", "Neutral", "Strong buy"],
                correct: 1
              },
              {
                question: "What does MACD measure?",
                options: ["Volume", "Price momentum", "Market cap", "P/E ratio"],
                correct: 1
              },
              {
                question: "Should you use only one indicator?",
                options: ["Yes", "No", "Sometimes", "Never"],
                correct: 1
              }
            ]
          }
        }
      ],
      unitTest: {
        questions: [
          {
            question: "Which chart type shows the most detail?",
            options: ["Line charts", "Bar charts", "Candlestick charts", "All show equal detail"],
            correct: 2
          },
          {
            question: "What is support?",
            options: ["A price level where stock stops falling", "A price level where stock stops rising", "A technical indicator", "A trading strategy"],
            correct: 0
          },
          {
            question: "Which moving average is more responsive?",
            options: ["SMA", "EMA", "Both are equal", "Neither"],
            correct: 1
          },
          {
            question: "What does high volume with price increase indicate?",
            options: ["Weak signal", "Strong bullish signal", "Bearish signal", "No signal"],
            correct: 1
          },
          {
            question: "What does RSI above 70 indicate?",
            options: ["Oversold", "Overbought", "Neutral", "Strong buy"],
            correct: 1
          }
        ],
        xp: 140,
        coins: 70
      }
    },
    {
      id: 4,
      title: "Risk Management",
      description: "Essential strategies to protect your investments",
      lessons: [
        {
          id: 16,
          title: "Position Sizing",
          description: "How much to invest in each position",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "The 1% Rule",
              content: "Never risk more than 1% of your total portfolio on any single trade. This helps protect your capital and allows you to survive losing streaks."
            },
            {
              type: "text",
              title: "Portfolio Allocation",
              content: "Diversify your portfolio across different sectors and asset classes. Don't put all your eggs in one basket."
            },
            {
              type: "text",
              title: "Risk vs Reward",
              content: "Always consider the potential reward relative to the risk. A good rule is to aim for at least a 2:1 reward-to-risk ratio."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is the 1% rule?",
                options: ["Risk 1% per trade", "Gain 1% per trade", "Invest 1% of income", "Save 1% of income"],
                correct: 0
              },
              {
                question: "Why diversify?",
                options: ["To avoid all risk", "To reduce risk", "To increase risk", "To save money"],
                correct: 1
              },
              {
                question: "What is a good reward-to-risk ratio?",
                options: ["1:1", "2:1", "1:2", "3:1"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 17,
          title: "Stop Losses",
          description: "Setting automatic exit points to limit losses",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "What are Stop Losses?",
              content: "A stop loss is an order to sell a stock when it reaches a certain price, automatically limiting your potential losses."
            },
            {
              type: "text",
              title: "Types of Stop Losses",
              content: "Fixed stop losses are set at a specific price. Trailing stop losses move with the stock price to lock in profits."
            },
            {
              type: "text",
              title: "Setting Stop Losses",
              content: "Place stop losses below support levels or at a percentage that fits your risk tolerance. Never remove a stop loss once set."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is a stop loss?",
                options: ["A profit target", "An automatic sell order", "A buy order", "A market order"],
                correct: 1
              },
              {
                question: "What is a trailing stop?",
                options: ["Fixed price stop", "Moving stop that follows price", "Time-based stop", "Volume-based stop"],
                correct: 1
              },
              {
                question: "Where should you place a stop loss?",
                options: ["Above current price", "Below support levels", "At market price", "At any price"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 18,
          title: "Diversification Strategies",
          description: "Building a well-diversified portfolio",
          duration: "18 min",
          xp: 40,
          coins: 30,
          content: [
            {
              type: "text",
              title: "Asset Allocation",
              content: "Spread your investments across different asset classes: stocks, bonds, real estate, commodities, and cash."
            },
            {
              type: "text",
              title: "Sector Diversification",
              content: "Don't concentrate in one sector. Invest across technology, healthcare, finance, consumer goods, and other sectors."
            },
            {
              type: "text",
              title: "Geographic Diversification",
              content: "Consider international investments to reduce country-specific risks and access global growth opportunities."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is asset allocation?",
                options: ["Investing in one asset", "Spreading across asset classes", "Timing the market", "Day trading"],
                correct: 1
              },
              {
                question: "Why diversify sectors?",
                options: ["To avoid all risk", "To reduce sector risk", "To increase returns", "To save time"],
                correct: 1
              },
              {
                question: "What is geographic diversification?",
                options: ["Investing in one country", "Investing globally", "Investing locally", "Investing in space"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 19,
          title: "Emotional Control",
          description: "Managing emotions in trading decisions",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "Fear and Greed",
              content: "Fear and greed are the two biggest enemies of successful trading. Fear causes you to sell too early, greed causes you to hold too long."
            },
            {
              type: "text",
              title: "Sticking to Your Plan",
              content: "Create a trading plan and stick to it. Don't let emotions override your strategy. Review and adjust your plan regularly."
            },
            {
              type: "text",
              title: "Taking Breaks",
              content: "If you're feeling emotional about trading, take a break. Clear your mind before making important decisions."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What are the biggest trading enemies?",
                options: ["Fear and greed", "Bulls and bears", "Buy and sell", "High and low"],
                correct: 0
              },
              {
                question: "What should you do with your trading plan?",
                options: ["Ignore it", "Stick to it", "Change it daily", "Forget about it"],
                correct: 1
              },
              {
                question: "What should you do when emotional?",
                options: ["Trade more", "Take a break", "Double down", "Panic sell"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 20,
          title: "Portfolio Rebalancing",
          description: "Maintaining your target asset allocation",
          duration: "10 min",
          xp: 25,
          coins: 15,
          content: [
            {
              type: "text",
              title: "What is Rebalancing?",
              content: "Rebalancing is adjusting your portfolio back to your target asset allocation when it drifts due to market movements."
            },
            {
              type: "text",
              title: "When to Rebalance",
              content: "Rebalance when your allocation drifts more than 5% from your target, or at regular intervals like quarterly or annually."
            },
            {
              type: "text",
              title: "Rebalancing Benefits",
              content: "Rebalancing helps maintain your risk level, forces you to sell high and buy low, and keeps your portfolio aligned with your goals."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is rebalancing?",
                options: ["Buying more stocks", "Adjusting allocation", "Selling everything", "Day trading"],
                correct: 1
              },
              {
                question: "When should you rebalance?",
                options: ["Never", "When allocation drifts 5%", "Daily", "Only when losing money"],
                correct: 1
              },
              {
                question: "What does rebalancing force you to do?",
                options: ["Sell high, buy low", "Buy high, sell low", "Hold everything", "Panic sell"],
                correct: 0
              }
            ]
          }
        }
      ],
      unitTest: {
        questions: [
          {
            question: "What is the 1% rule?",
            options: ["Risk 1% per trade", "Gain 1% per trade", "Invest 1% of income", "Save 1% of income"],
            correct: 0
          },
          {
            question: "What is a stop loss?",
            options: ["A profit target", "An automatic sell order", "A buy order", "A market order"],
            correct: 1
          },
          {
            question: "What is asset allocation?",
            options: ["Investing in one asset", "Spreading across asset classes", "Timing the market", "Day trading"],
            correct: 1
          },
          {
            question: "What are the biggest trading enemies?",
            options: ["Fear and greed", "Bulls and bears", "Buy and sell", "High and low"],
            correct: 0
          },
          {
            question: "What is rebalancing?",
            options: ["Buying more stocks", "Adjusting allocation", "Selling everything", "Day trading"],
            correct: 1
          }
        ],
        xp: 160,
        coins: 80
      }
    },
    {
      id: 5,
      title: "Advanced Strategies",
      description: "Sophisticated trading techniques and portfolio management",
      lessons: [
        {
          id: 21,
          title: "Options Basics",
          description: "Understanding options trading fundamentals",
          duration: "20 min",
          xp: 45,
          coins: 35,
          content: [
            {
              type: "text",
              title: "What are Options?",
              content: "Options are contracts that give you the right (but not obligation) to buy or sell a stock at a specific price by a certain date."
            },
            {
              type: "text",
              title: "Call Options",
              content: "Call options give you the right to buy a stock at a specific price. You buy calls when you expect the stock to go up."
            },
            {
              type: "text",
              title: "Put Options",
              content: "Put options give you the right to sell a stock at a specific price. You buy puts when you expect the stock to go down."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What are options?",
                options: ["Stocks", "Contracts with rights", "Bonds", "Mutual funds"],
                correct: 1
              },
              {
                question: "When do you buy call options?",
                options: ["When stock goes down", "When stock goes up", "When stock stays same", "Never"],
                correct: 1
              },
              {
                question: "What do put options give you?",
                options: ["Right to buy", "Right to sell", "Obligation to buy", "Obligation to sell"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 22,
          title: "Swing Trading",
          description: "Medium-term trading strategies",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "What is Swing Trading?",
              content: "Swing trading holds positions for days to weeks, capturing medium-term price movements. It's less time-intensive than day trading."
            },
            {
              type: "text",
              title: "Swing Trading Setup",
              content: "Look for stocks with clear trends, good volume, and strong support/resistance levels. Use technical analysis to time entries and exits."
            },
            {
              type: "text",
              title: "Risk Management",
              content: "Set stop losses and profit targets before entering trades. Don't risk more than 2% of your portfolio on any swing trade."
            }
          ],
          quiz: {
            questions: [
              {
                question: "How long do swing trades typically last?",
                options: ["Minutes", "Days to weeks", "Months to years", "Seconds"],
                correct: 1
              },
              {
                question: "What should you look for in swing trading?",
                options: ["Clear trends", "Random movements", "No volume", "High fees"],
                correct: 0
              },
              {
                question: "How much should you risk per swing trade?",
                options: ["10%", "5%", "2%", "20%"],
                correct: 2
              }
            ]
          }
        },
        {
          id: 23,
          title: "Value Investing",
          description: "Finding undervalued stocks",
          duration: "18 min",
          xp: 40,
          coins: 30,
          content: [
            {
              type: "text",
              title: "What is Value Investing?",
              content: "Value investing involves finding stocks that are trading below their intrinsic value. You buy when others are fearful and sell when others are greedy."
            },
            {
              type: "text",
              title: "Fundamental Analysis",
              content: "Analyze company financials, earnings, debt, and growth prospects. Look for strong companies with good fundamentals trading at reasonable prices."
            },
            {
              type: "text",
              title: "Patience is Key",
              content: "Value investing requires patience. It may take time for the market to recognize the true value of a stock."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What is value investing?",
                options: ["Buying expensive stocks", "Buying undervalued stocks", "Day trading", "Short selling"],
                correct: 1
              },
              {
                question: "What should you analyze?",
                options: ["Only price", "Only volume", "Fundamentals", "Only charts"],
                correct: 2
              },
              {
                question: "What does value investing require?",
                options: ["Speed", "Patience", "High frequency", "Low capital"],
                correct: 1
              }
            ]
          }
        },
        {
          id: 24,
          title: "Dividend Investing",
          description: "Building income-generating portfolios",
          duration: "12 min",
          xp: 30,
          coins: 20,
          content: [
            {
              type: "text",
              title: "What are Dividends?",
              content: "Dividends are payments companies make to shareholders from their profits. They provide regular income and can compound over time."
            },
            {
              type: "text",
              title: "Dividend Yield",
              content: "Dividend yield is the annual dividend payment divided by the stock price. Higher yields aren't always better - consider sustainability."
            },
            {
              type: "text",
              title: "Dividend Growth",
              content: "Look for companies that consistently increase their dividends. This shows financial strength and commitment to shareholders."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What are dividends?",
                options: ["Stock splits", "Company payments to shareholders", "Trading fees", "Taxes"],
                correct: 1
              },
              {
                question: "What is dividend yield?",
                options: ["Annual dividend / stock price", "Stock price / dividend", "Dividend growth rate", "P/E ratio"],
                correct: 0
              },
              {
                question: "What shows financial strength?",
                options: ["High debt", "Dividend cuts", "Dividend growth", "Low revenue"],
                correct: 2
              }
            ]
          }
        },
        {
          id: 25,
          title: "Portfolio Optimization",
          description: "Maximizing returns while minimizing risk",
          duration: "15 min",
          xp: 35,
          coins: 25,
          content: [
            {
              type: "text",
              title: "Modern Portfolio Theory",
              content: "Diversification reduces risk without necessarily reducing returns. The goal is to find the optimal balance of risk and return."
            },
            {
              type: "text",
              title: "Correlation",
              content: "Invest in assets that don't move together. Low correlation between investments provides better diversification benefits."
            },
            {
              type: "text",
              title: "Regular Review",
              content: "Review your portfolio regularly and rebalance as needed. Your allocation should reflect your goals, time horizon, and risk tolerance."
            }
          ],
          quiz: {
            questions: [
              {
                question: "What does diversification do?",
                options: ["Increases risk", "Reduces risk", "Guarantees returns", "Eliminates all risk"],
                correct: 1
              },
              {
                question: "What is good for diversification?",
                options: ["High correlation", "Low correlation", "No correlation", "Perfect correlation"],
                correct: 1
              },
              {
                question: "How often should you review your portfolio?",
                options: ["Never", "Annually", "Regularly", "Only when losing money"],
                correct: 2
              }
            ]
          }
        }
      ],
      unitTest: {
        questions: [
          {
            question: "What are options?",
            options: ["Stocks", "Contracts with rights", "Bonds", "Mutual funds"],
            correct: 1
          },
          {
            question: "How long do swing trades typically last?",
            options: ["Minutes", "Days to weeks", "Months to years", "Seconds"],
            correct: 1
          },
          {
            question: "What is value investing?",
            options: ["Buying expensive stocks", "Buying undervalued stocks", "Day trading", "Short selling"],
            correct: 1
          },
          {
            question: "What are dividends?",
            options: ["Stock splits", "Company payments to shareholders", "Trading fees", "Taxes"],
            correct: 1
          },
          {
            question: "What does diversification do?",
            options: ["Increases risk", "Reduces risk", "Guarantees returns", "Eliminates all risk"],
            correct: 1
          }
        ],
        xp: 185,
        coins: 95
      }
    }
  ],
  finalTest: {
    questions: [
      {
        question: "What is the primary goal of investing?",
        options: ["To preserve money", "To grow wealth over time", "To spend money immediately", "To avoid taxes"],
        correct: 1
      },
      {
        question: "What is compound interest?",
        options: ["Interest on principal only", "Interest on principal and accumulated interest", "Simple interest", "A type of tax"],
        correct: 1
      },
      {
        question: "What do you own when you buy a stock?",
        options: ["A piece of the company", "A loan to the company", "A bond", "A mutual fund"],
        correct: 0
      },
      {
        question: "What primarily determines stock prices?",
        options: ["Government regulation", "Supply and demand", "Company size", "CEO salary"],
        correct: 1
      },
      {
        question: "What is the spread?",
        options: ["The difference between bid and ask", "The stock price", "Trading volume", "Market hours"],
        correct: 0
      },
      {
        question: "Which account offers tax-free withdrawals in retirement?",
        options: ["Traditional IRA", "Roth IRA", "401(k)", "Taxable brokerage"],
        correct: 1
      },
      {
        question: "What is diversification?",
        options: ["Investing in one company", "Spreading risk across different investments", "Avoiding all risk", "Only investing in safe options"],
        correct: 1
      },
      {
        question: "What are regular market hours?",
        options: ["9:30 AM - 4:00 PM ET", "8:00 AM - 5:00 PM ET", "24 hours", "10:00 AM - 3:00 PM ET"],
        correct: 0
      },
      {
        question: "What does the S&P 500 track?",
        options: ["30 major companies", "500 large US companies", "Technology stocks only", "International stocks"],
        correct: 1
      },
      {
        question: "What is the most important factor in long-term investing success?",
        options: ["Amount invested", "Time in the market", "Interest rate", "Investment type"],
        correct: 1
      }
    ],
    xp: 500,
    coins: 250,
    unlockCost: 100
  }
};

// XP to level conversion
export const xpToLevel = (xp) => {
  const levels = [
    0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450
  ];
  
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i]) {
      return i;
    }
  }
  return 0;
};

export const getLevelProgress = (xp) => {
  const currentLevel = xpToLevel(xp);
  const nextLevel = currentLevel + 1;
  const xpForCurrentLevel = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450][currentLevel] || 0;
  const xpForNextLevel = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450][nextLevel] || 0;
  
  const xpInCurrentLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  return {
    currentLevel,
    nextLevel,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progress: (xpInCurrentLevel / xpNeededForNextLevel) * 100
  };
}; 