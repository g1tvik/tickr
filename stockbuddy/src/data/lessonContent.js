export const lessonContent = {
  1: {
    id: 1,
    title: "Intro to Stocks",
    status: "completed",
    duration: "15 minutes",
    objectives: [
      "Understand what stocks are and how they work",
      "Learn the difference between stocks and other investments",
      "Identify key stock market terms",
      "Understand the concept of ownership in companies"
    ],
    content: [
      {
        type: "text",
        title: "What Are Stocks?",
        content: `
          <p>A stock represents ownership in a company. When you buy a stock, you're purchasing a small piece of that company, called a "share."</p>
          
          <h3>Key Concepts:</h3>
          <ul>
            <li><strong>Share:</strong> A single unit of ownership in a company</li>
            <li><strong>Shareholder:</strong> Someone who owns shares in a company</li>
            <li><strong>Dividend:</strong> A portion of company profits paid to shareholders</li>
            <li><strong>Market Cap:</strong> Total value of all company shares</li>
          </ul>
          
          <h3>Why Do Companies Issue Stocks?</h3>
          <p>Companies sell stocks to raise money for growth, research, expansion, or other business needs. In return, investors get partial ownership and potential profits.</p>
        `
      },
      {
        type: "interactive",
        title: "Interactive Example",
        content: `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4>Let's say you buy 10 shares of Apple (AAPL) at $150 per share:</h4>
            <ul>
              <li>You own 10 shares × $150 = $1,500 worth of Apple</li>
              <li>If Apple's stock price rises to $160, your investment is now worth $1,600</li>
              <li>You've made a $100 profit (before taxes and fees)</li>
            </ul>
          </div>
        `
      },
      {
        type: "text",
        title: "Types of Stocks",
        content: `
          <h3>Common Stocks</h3>
          <p>Most stocks are common stocks, which give you voting rights and potential dividends.</p>
          
          <h3>Preferred Stocks</h3>
          <p>These typically pay fixed dividends and have priority over common stocks if the company goes bankrupt.</p>
          
          <h3>Growth vs. Value Stocks</h3>
          <ul>
            <li><strong>Growth stocks:</strong> Companies expected to grow faster than the market average</li>
            <li><strong>Value stocks:</strong> Companies that appear undervalued based on their fundamentals</li>
          </ul>
        `
      }
    ],
    quiz: {
      title: "Knowledge Check",
      questions: [
        {
          id: 1,
          question: "What does it mean when you buy a stock?",
          options: [
            "You're lending money to the company",
            "You're buying ownership in the company",
            "You're buying a product from the company",
            "You're becoming an employee of the company"
          ],
          correct: 1,
          explanation: "When you buy a stock, you're purchasing ownership (shares) in that company. This makes you a partial owner and gives you certain rights as a shareholder."
        },
        {
          id: 2,
          question: "What is a dividend?",
          options: [
            "The total value of all company shares",
            "A portion of company profits paid to shareholders",
            "The price you pay for a stock",
            "The fee charged by your broker"
          ],
          correct: 1,
          explanation: "A dividend is a portion of the company's profits that is distributed to shareholders. Not all companies pay dividends, and the amount can vary."
        },
        {
          id: 3,
          question: "Which type of stock typically gives you voting rights?",
          options: [
            "Preferred stocks",
            "Common stocks",
            "Bond stocks",
            "Index stocks"
          ],
          correct: 1,
          explanation: "Common stocks typically give shareholders voting rights on company matters, such as electing board members and approving major decisions."
        }
      ]
    }
  },
  
  2: {
    id: 2,
    title: "How Trading Works",
    status: "current",
    duration: "20 minutes",
    objectives: [
      "Understand how stock trading actually works",
      "Learn about market orders and limit orders",
      "Understand bid/ask spreads",
      "Learn about market hours and trading sessions"
    ],
    content: [
      {
        type: "text",
        title: "The Trading Process",
        content: `
          <p>Stock trading happens on exchanges like the New York Stock Exchange (NYSE) or NASDAQ. Here's how it works:</p>
          
          <h3>Step-by-Step Process:</h3>
          <ol>
            <li><strong>Place an Order:</strong> You tell your broker what stock you want to buy/sell and at what price</li>
            <li><strong>Order Matching:</strong> The exchange matches your order with someone who wants to do the opposite</li>
            <li><strong>Execution:</strong> The trade is completed and shares change hands</li>
            <li><strong>Settlement:</strong> Money and shares are transferred (usually takes 2 business days)</li>
          </ol>
        `
      },
      {
        type: "interactive",
        title: "Order Types",
        content: `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4>Market Order vs Limit Order:</h4>
            
            <h5>Market Order</h5>
            <p>Buy or sell immediately at the current market price. You get the trade done quickly, but the price might not be exactly what you expected.</p>
            
            <h5>Limit Order</h5>
            <p>Set a specific price you're willing to pay or accept. The trade only happens if someone meets your price. You control the price, but the trade might not happen immediately.</p>
            
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px;">
              <strong>Example:</strong> If Apple is trading at $150, you could:
              <ul>
                <li>Market order: Buy immediately at around $150</li>
                <li>Limit order: Set a limit to buy at $148, and only buy if the price drops to that level</li>
              </ul>
            </div>
          </div>
        `
      },
      {
        type: "text",
        title: "Bid and Ask",
        content: `
          <h3>Understanding Bid/Ask Spread</h3>
          <p>Every stock has two prices:</p>
          <ul>
            <li><strong>Bid:</strong> The highest price someone is willing to pay for the stock</li>
            <li><strong>Ask:</strong> The lowest price someone is willing to sell the stock for</li>
          </ul>
          
          <p>The difference between bid and ask is called the "spread." A smaller spread usually means the stock is more liquid (easier to trade).</p>
          
          <h3>Market Hours</h3>
          <p>Regular market hours are 9:30 AM to 4:00 PM Eastern Time, Monday through Friday. Pre-market and after-hours trading are also available but with less liquidity.</p>
        `
      }
    ],
    quiz: {
      title: "Trading Knowledge Check",
      questions: [
        {
          id: 1,
          question: "What is a market order?",
          options: [
            "An order to buy or sell at a specific price",
            "An order to buy or sell immediately at the current market price",
            "An order that only executes during market hours",
            "An order to buy stocks from a specific market"
          ],
          correct: 1,
          explanation: "A market order is an instruction to buy or sell a stock immediately at the current market price. It's the fastest way to execute a trade."
        },
        {
          id: 2,
          question: "What is the 'bid' price?",
          options: [
            "The price you pay to buy a stock",
            "The highest price someone is willing to pay for a stock",
            "The lowest price someone is willing to sell a stock for",
            "The difference between buy and sell prices"
          ],
          correct: 1,
          explanation: "The bid price is the highest price that a buyer is willing to pay for a stock at that moment."
        },
        {
          id: 3,
          question: "How long does it typically take for a stock trade to settle?",
          options: [
            "Immediately",
            "1 business day",
            "2 business days",
            "1 week"
          ],
          correct: 2,
          explanation: "Most stock trades settle in 2 business days (T+2). This means the money and shares are transferred 2 business days after the trade is executed."
        }
      ]
    }
  },
  
  3: {
    id: 3,
    title: "Reading Stock Charts",
    status: "locked",
    duration: "25 minutes",
    objectives: [
      "Learn to read basic stock charts",
      "Understand candlestick patterns",
      "Learn about support and resistance levels",
      "Understand volume and its importance"
    ],
    content: [
      {
        type: "text",
        title: "Basic Chart Types",
        content: `
          <h3>Line Charts</h3>
          <p>The simplest type of chart showing just the closing price over time. Good for seeing overall trends.</p>
          
          <h3>Candlestick Charts</h3>
          <p>More detailed charts showing open, high, low, and close prices for each period. Each candlestick represents one time period (day, week, etc.).</p>
          
          <h3>Bar Charts</h3>
          <p>Similar to candlesticks but using bars instead. Shows the same information but in a different visual format.</p>
        `
      },
      {
        type: "interactive",
        title: "Understanding Candlesticks",
        content: `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4>Candlestick Components:</h4>
            
            <div style="display: flex; gap: 20px; margin: 15px 0;">
              <div style="text-align: center;">
                <div style="width: 20px; height: 40px; background: #22c55e; margin: 0 auto 10px; border-radius: 2px;"></div>
                <strong>Green/White</strong><br/>
                Price closed higher than it opened
              </div>
              <div style="text-align: center;">
                <div style="width: 20px; height: 40px; background: #ef4444; margin: 0 auto 10px; border-radius: 2px;"></div>
                <strong>Red/Black</strong><br/>
                Price closed lower than it opened
              </div>
            </div>
            
            <p><strong>Body:</strong> The thick part shows the opening and closing prices</p>
            <p><strong>Wick/Shadow:</strong> The thin lines show the highest and lowest prices during that period</p>
          </div>
        `
      },
      {
        type: "text",
        title: "Support and Resistance",
        content: `
          <h3>Support Level</h3>
          <p>A price level where the stock tends to stop falling and bounce back up. Think of it as a "floor" that supports the price.</p>
          
          <h3>Resistance Level</h3>
          <p>A price level where the stock tends to stop rising and fall back down. Think of it as a "ceiling" that resists further price increases.</p>
          
          <h3>Volume</h3>
          <p>The number of shares traded during a given period. High volume often indicates strong interest and can confirm price movements.</p>
        `
      }
    ],
    quiz: {
      title: "Chart Reading Quiz",
      questions: [
        {
          id: 1,
          question: "What does a green candlestick typically indicate?",
          options: [
            "The stock price went down",
            "The stock price went up",
            "The stock had high volume",
            "The stock had low volume"
          ],
          correct: 1,
          explanation: "A green (or white) candlestick indicates that the stock's closing price was higher than its opening price for that period."
        },
        {
          id: 2,
          question: "What is a support level?",
          options: [
            "A price level where the stock tends to stop rising",
            "A price level where the stock tends to stop falling",
            "The highest price a stock has ever reached",
            "The average price of a stock over time"
          ],
          correct: 1,
          explanation: "A support level is a price level where the stock tends to stop falling and bounce back up, acting like a floor for the price."
        },
        {
          id: 3,
          question: "What does volume measure in stock trading?",
          options: [
            "The price change of a stock",
            "The number of shares traded",
            "The market capitalization",
            "The dividend yield"
          ],
          correct: 1,
          explanation: "Volume measures the number of shares traded during a given period. It's an important indicator of market activity and interest in a stock."
        }
      ]
    }
  },
  
  4: {
    id: 4,
    title: "Risk Management",
    status: "locked",
    duration: "30 minutes",
    objectives: [
      "Understand the importance of risk management",
      "Learn about diversification",
      "Understand position sizing",
      "Learn about stop-loss orders"
    ],
    content: [
      {
        type: "text",
        title: "Why Risk Management Matters",
        content: `
          <p>Risk management is crucial for long-term investing success. Even the best investors lose money on individual trades, but they manage their risk to stay in the game.</p>
          
          <h3>Key Principles:</h3>
          <ul>
            <li><strong>Never invest more than you can afford to lose</strong></li>
            <li><strong>Diversify your investments</strong></li>
            <li><strong>Use position sizing</strong></li>
            <li><strong>Have an exit strategy</strong></li>
          </ul>
        `
      },
      {
        type: "interactive",
        title: "Diversification Example",
        content: `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4>Portfolio A vs Portfolio B:</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0;">
              <div style="background: white; padding: 15px; border-radius: 8px;">
                <h5>Portfolio A (Not Diversified)</h5>
                <ul>
                  <li>100% in Tech stocks</li>
                  <li>High risk, high potential reward</li>
                  <li>If tech crashes, entire portfolio suffers</li>
                </ul>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px;">
                <h5>Portfolio B (Diversified)</h5>
                <ul>
                  <li>40% Tech, 30% Healthcare, 20% Consumer, 10% Energy</li>
                  <li>Lower risk, more stable returns</li>
                  <li>If one sector crashes, others may offset losses</li>
                </ul>
              </div>
            </div>
          </div>
        `
      },
      {
        type: "text",
        title: "Position Sizing and Stop-Loss",
        content: `
          <h3>Position Sizing</h3>
          <p>Don't put all your money in one stock. A common rule is to risk no more than 1-2% of your portfolio on any single trade.</p>
          
          <h3>Stop-Loss Orders</h3>
          <p>A stop-loss order automatically sells your stock if it falls to a certain price, limiting your potential losses.</p>
          
          <h3>Example:</h3>
          <p>If you buy a stock at $100 and set a stop-loss at $90, you're limiting your potential loss to 10%.</p>
        `
      }
    ],
    quiz: {
      title: "Risk Management Quiz",
      questions: [
        {
          id: 1,
          question: "What is diversification?",
          options: [
            "Putting all your money in one stock",
            "Spreading your investments across different assets",
            "Buying stocks at the lowest price",
            "Selling stocks at the highest price"
          ],
          correct: 1,
          explanation: "Diversification means spreading your investments across different assets, sectors, or companies to reduce risk."
        },
        {
          id: 2,
          question: "What is a stop-loss order?",
          options: [
            "An order to buy more shares when the price drops",
            "An order to automatically sell if the price falls to a certain level",
            "An order to buy at the market price",
            "An order to hold a stock forever"
          ],
          correct: 1,
          explanation: "A stop-loss order automatically sells your stock if it falls to a predetermined price, helping to limit potential losses."
        },
        {
          id: 3,
          question: "What percentage of your portfolio should you typically risk on a single trade?",
          options: [
            "10-20%",
            "5-10%",
            "1-2%",
            "50% or more"
          ],
          correct: 2,
          explanation: "Most professional investors recommend risking no more than 1-2% of your portfolio on any single trade to manage risk effectively."
        }
      ]
    }
  },
  
  5: {
    id: 5,
    title: "Advanced Strategies",
    status: "locked",
    duration: "35 minutes",
    objectives: [
      "Learn about fundamental vs technical analysis",
      "Understand different investment strategies",
      "Learn about market timing",
      "Understand the importance of a trading plan"
    ],
    content: [
      {
        type: "text",
        title: "Fundamental vs Technical Analysis",
        content: `
          <h3>Fundamental Analysis</h3>
          <p>Analyzing a company's financial health, business model, and growth prospects. Looks at:</p>
          <ul>
            <li>Revenue and earnings growth</li>
            <li>Profit margins</li>
            <li>Debt levels</li>
            <li>Competitive advantages</li>
          </ul>
          
          <h3>Technical Analysis</h3>
          <p>Analyzing price patterns and market data to predict future movements. Looks at:</p>
          <ul>
            <li>Price charts and patterns</li>
            <li>Trading volume</li>
            <li>Moving averages</li>
            <li>Support and resistance levels</li>
          </ul>
        `
      },
      {
        type: "interactive",
        title: "Investment Strategies",
        content: `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h4>Popular Investment Strategies:</h4>
            
            <div style="margin: 15px 0;">
              <h5>1. Value Investing</h5>
              <p>Buying stocks that appear undervalued based on fundamental analysis. Warren Buffett is famous for this approach.</p>
            </div>
            
            <div style="margin: 15px 0;">
              <h5>2. Growth Investing</h5>
              <p>Buying stocks of companies expected to grow faster than the market average, even if they seem expensive.</p>
            </div>
            
            <div style="margin: 15px 0;">
              <h5>3. Dividend Investing</h5>
              <p>Focusing on stocks that pay regular dividends, providing income and potential for growth.</p>
            </div>
            
            <div style="margin: 15px 0;">
              <h5>4. Index Investing</h5>
              <p>Buying index funds that track the overall market, providing diversification and lower fees.</p>
            </div>
          </div>
        `
      },
      {
        type: "text",
        title: "Creating a Trading Plan",
        content: `
          <h3>Essential Elements of a Trading Plan:</h3>
          <ol>
            <li><strong>Investment Goals:</strong> What are you trying to achieve?</li>
            <li><strong>Risk Tolerance:</strong> How much risk can you handle?</li>
            <li><strong>Time Horizon:</strong> How long do you plan to invest?</li>
            <li><strong>Asset Allocation:</strong> How will you divide your money?</li>
            <li><strong>Entry/Exit Rules:</strong> When will you buy and sell?</li>
            <li><strong>Review Schedule:</strong> How often will you review your plan?</li>
          </ol>
          
          <h3>Remember:</h3>
          <p>Stick to your plan! Emotional decisions often lead to poor investment results. The market will test your discipline, but staying the course usually pays off.</p>
        `
      }
    ],
    quiz: {
      title: "Advanced Strategies Quiz",
      questions: [
        {
          id: 1,
          question: "What is fundamental analysis?",
          options: [
            "Analyzing price charts and patterns",
            "Analyzing a company's financial health and business model",
            "Analyzing market trends",
            "Analyzing trading volume"
          ],
          correct: 1,
          explanation: "Fundamental analysis involves evaluating a company's financial statements, business model, competitive advantages, and growth prospects."
        },
        {
          id: 2,
          question: "What is value investing?",
          options: [
            "Buying the most expensive stocks",
            "Buying stocks that appear undervalued",
            "Buying only growth stocks",
            "Buying only dividend stocks"
          ],
          correct: 1,
          explanation: "Value investing involves buying stocks that appear to be trading for less than their intrinsic value, often based on fundamental analysis."
        },
        {
          id: 3,
          question: "Why is it important to have a trading plan?",
          options: [
            "It's required by law",
            "It helps you make emotional decisions",
            "It provides structure and helps avoid emotional decisions",
            "It guarantees profits"
          ],
          correct: 2,
          explanation: "A trading plan provides structure and helps you avoid making emotional decisions that can lead to poor investment results."
        }
      ]
    }
  }
}; 