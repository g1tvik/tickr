import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SidebarWrapper = styled.aside`
  position: fixed;
  top: 4.5rem;
  right: 2.5rem;
  height: calc(100vh - 7rem);
  width: 400px;
  max-width: 95vw;
  background: rgba(30, 32, 34, 0.7);
  border-radius: 48px;
  box-shadow: 0 12px 40px 0 #0003;
  border: 2px solid rgba(255,255,255,0.22);
  padding: 3rem 2.5rem 2.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  z-index: 200;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s;
  transform: ${props => (props.open ? 'translateX(0)' : 'translateX(110%)')};
  opacity: ${props => (props.open ? 1 : 0.7)};
  backdrop-filter: blur(20px) saturate(1.3);
  box-shadow: 0 12px 40px 0 #0003, 0 2px 0 0 rgba(255,255,255,0.13) inset;
  overflow-y: auto;
  max-height: calc(100vh - 7rem);

  /* Custom scrollbar for dark mode, minimal and modern */
  &::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #23272a;
    border-radius: 8px;
    min-height: 40px;
    transition: background 0.2s;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #333;
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
  /* Hide scrollbar arrows (Webkit browsers) */
  &::-webkit-scrollbar-button {
    display: none;
    height: 0;
    width: 0;
  }
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: #23272a transparent;
`;

const OpenSidebarTab = styled.button`
  position: fixed;
  left: calc(100vw - 10px - 48px); /* 10px scrollbar + 48px button width */
  z-index: 201;
  background: #23272a;
  color: #00c805;
  border: none;
  border-radius: 8px 0 0 8px;
  padding: 0.5rem 0.8rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 #0002;
  transition: background 0.2s, color 0.2s, top 0.2s;
  &:hover {
    background: #181a1b;
    color: #00e805;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 385px;
  right: 8px;
  background: #23272a;
  border: none;
  color: #00c805;
  cursor: pointer;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px 0 #0002;
  transition: background 0.2s, color 0.2s;
  z-index: 202;
  padding: 0;
  &:hover {
    background: #181a1b;
    color: #00e805;
  }
`;

const HamburgerMirrored = styled.span`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  gap: 2.5px;
  transform: scaleX(-1); /* mirror horizontally */
  > span {
    display: block;
    height: 2px;
    width: 14px;
    background: #00c805;
    border-radius: 2px;
    transition: background 0.2s;
  }
`;

const Section = styled.div`
  margin-bottom: 3.5rem;
  padding-left: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 1.7rem;
  margin-top: 2.5rem;
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.3;
`;

const Divider = styled.hr`
  border: none;
  border-top: 2px solid rgba(255,255,255,0.15);
  margin: 2rem 0;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0.3rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
  cursor: pointer;
  &:hover {
    background: #181a1b;
  }
`;

const StockInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const StockName = styled.span`
  font-weight: 500;
`;

const StockPrice = styled.span`
  font-weight: 600;
  color: #f7e600;
`;

const PriceChange = styled.span`
  font-size: 0.95rem;
  font-weight: 500;
  margin-left: 0.5rem;
  color: ${props => props.up ? '#00c805' : '#ff3b30'};
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #b0b3b8;
  font-size: 1.1rem;
  margin-left: 0.7rem;
  cursor: pointer;
  border-radius: 0.3rem;
  padding: 0.1rem 0.4rem;
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: #23272a;
    color: #ff3b30;
  }
`;

const Notification = styled.div`
  background: rgba(36, 38, 40, 0.45);
  color: var(--text-muted, #b0b3b8);
  border-radius: 1.5rem;
  padding: 1.7rem 2rem;
  margin-bottom: 1.5rem;
  font-size: 1.13rem;
  box-shadow: 0 2px 8px 0 #0001;
  border: 1.2px solid rgba(255,255,255,0.10);
  line-height: 1.7;
`;

const AccountSummary = styled.div`
  background: rgba(36, 38, 40, 0.55);
  border-radius: 2rem;
  padding: 2.5rem 2rem;
  margin-bottom: 1.5rem;
  color: var(--text-main, #f5f6fa);
  display: flex;
  flex-direction: column;
  gap: 1.3rem;
  box-shadow: 0 4px 16px 0 #0001;
  border: 1.5px solid rgba(255,255,255,0.13);
  font-size: 1.13rem;
  line-height: 1.6;
`;

const AccountLabel = styled.div`
  font-size: 0.98rem;
  color: var(--text-muted, #b0b3b8);
`;

const AccountValue = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-green, #00c805);
`;

const PlaceholderBox = styled.div`
  background: rgba(36, 38, 40, 0.45);
  border-radius: 1.5rem;
  padding: 1.5rem 1.7rem;
  color: var(--text-muted, #b0b3b8);
  margin-bottom: 1.5rem;
  font-size: 1.09rem;
  box-shadow: 0 2px 8px 0 #0001;
  border: 1.2px solid rgba(255,255,255,0.10);
  line-height: 1.7;
`;

const Chevron = styled.span`
  font-size: 1.1rem;
  margin-left: 0.5rem;
  user-select: none;
`;

const initialWatchlist = [
  { symbol: 'AAPL', price: 212.50, change: -0.49 },
  { symbol: 'TSLA', price: 294.80, change: -6.52 },
  { symbol: 'MSFT', price: 499.70, change: 0.17 },
  { symbol: 'SNAP', price: 9.19, change: -0.86 },
];

const Sidebar = () => {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [open, setOpen] = useState(true);
  const [listsOpen, setListsOpen] = useState(true);
  const [tabTop, setTabTop] = useState(0);

  const removeStock = (symbol) => {
    setWatchlist(watchlist.filter(stock => stock.symbol !== symbol));
  };

  // Track scrollbar thumb position
  useEffect(() => {
    if (open) return; // Only move tab when sidebar is closed
    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollbarHeight = winHeight * winHeight / docHeight;
      const maxScroll = docHeight - winHeight;
      const thumbTop = scrollY * (winHeight - scrollbarHeight) / (maxScroll || 1);
      // Center the button on the thumb
      setTabTop(thumbTop + scrollbarHeight / 2 - 24); // 24px is half button height
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  return (
    <>
      <SidebarWrapper open={open}/>
        <CloseBtn title="Close Sidebar" onClick={() => setOpen(false)}>
          <HamburgerMirrored>
            <span />
            <span />
            <span />
          </HamburgerMirrored>
        </CloseBtn>
        <Section>
          <SectionTitle>
            Lists
            <Chevron onClick={() => setListsOpen(v => !v)}>{listsOpen ? '▲' : '▼'}</Chevron>
          </SectionTitle>
          <Divider />
          {listsOpen && (
            <List>
              {watchlist.map(stock => (
                <ListItem key={stock.symbol}>
                  <StockInfo>
                    <StockName>{stock.symbol}</StockName>
                    <span>
                      <StockPrice>${stock.price.toFixed(2)}</StockPrice>
                      <PriceChange up={stock.change >= 0}>
                        {stock.change >= 0 ? '+' : ''}{stock.change}%
                      </PriceChange>
                    </span>
                  </StockInfo>
                  <RemoveBtn title={`Remove ${stock.symbol}`} onClick={() => removeStock(stock.symbol)}>&times;</RemoveBtn>
                </ListItem>
              ))}
            </List>
          )}
        </Section>
        <Divider />
        <Section>
          <SectionTitle>Account Summary</SectionTitle>
          <AccountSummary>
            <AccountLabel>Investing</AccountLabel>
            <AccountValue>$10,000.00</AccountValue>
            <AccountLabel>Buying Power</AccountLabel>
            <AccountValue>$10,000.00</AccountValue>
          </AccountSummary>
        </Section>
        <Divider />
        <Section>
          <SectionTitle>Notifications</SectionTitle>
          <Notification>Welcome to StockBuddy! 🎉</Notification>
          <Notification>Your account is ready to trade.</Notification>
        </Section>
        <Divider />
        <Section>
          <SectionTitle>Recent Activity</SectionTitle>
          <PlaceholderBox>
            • Bought 1 AAPL @ $190<br />
            • Completed "What is a stock?" lesson<br />
            • Added TSLA to watchlist
          </PlaceholderBox>
        </Section>
        <Divider />
        <Section>
          <SectionTitle>Quick Links</SectionTitle>
          <PlaceholderBox>
            <a href="#" style={{ color: '#00c805', textDecoration: 'none' }}>Deposit Funds</a><br />
            <a href="#" style={{ color: '#00c805', textDecoration: 'none' }}>Withdraw</a><br />
            <a href="#" style={{ color: '#00c805', textDecoration: 'none' }}>Help Center</a>
          </PlaceholderBox>
        </Section>
      </SidebarWrapper>
      {!open && (
        <OpenSidebarTab style={{ top: tabTop }} onClick={() => setOpen(true)}>
          <HamburgerMirrored>
            <span />
            <span />
            <span />
          </HamburgerMirrored>
        </OpenSidebarTab>
      )}
    </>
  );
};

export default Sidebar;
     