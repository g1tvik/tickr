/**
 * Skeleton loading components
 * Provides visual placeholders while content is loading.
 */
import styled, { keyframes } from 'styled-components';
import tk from '../theme/terminal';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${tk.inset} 25%,
    ${tk.raised} 50%,
    ${tk.inset} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  border-radius: ${tk.rXs}px;
`;

/**
 * Basic skeleton line
 */
export const SkeletonLine = styled(SkeletonBase)`
  height: ${props => props.$height || '16px'};
  width: ${props => props.$width || '100%'};
  margin: ${props => props.$margin || '0'};
`;

/**
 * Skeleton circle (avatar, etc.)
 */
export const SkeletonCircle = styled(SkeletonBase)`
  width: ${props => props.$size || '48px'};
  height: ${props => props.$size || '48px'};
  border-radius: 50%;
`;

/**
 * Skeleton rectangle (image, card, etc.)
 */
export const SkeletonRect = styled(SkeletonBase)`
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '200px'};
  border-radius: ${props => props.$radius || '8px'};
`;

/**
 * Chart skeleton
 */
const ChartContainer = styled.div`
  width: 100%;
  padding: 20px;
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartBody = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 200px;
`;

const ChartBar = styled(SkeletonBase)`
  flex: 1;
  height: ${props => props.$height || '50%'};
  border-radius: 4px 4px 0 0;
`;

export function ChartSkeleton() {
  return (
    <ChartContainer>
      <ChartHeader>
        <div>
          <SkeletonLine $width="120px" $height="24px" $margin="0 0 8px 0" />
          <SkeletonLine $width="80px" $height="14px" />
        </div>
        <SkeletonLine $width="100px" $height="32px" />
      </ChartHeader>
      <ChartBody>
        {[40, 60, 35, 80, 55, 70, 45, 90, 65, 50, 75, 60].map((h, i) => (
          <ChartBar key={i} $height={`${h}%`} />
        ))}
      </ChartBody>
    </ChartContainer>
  );
}

/**
 * Portfolio card skeleton
 */
const PortfolioContainer = styled.div`
  padding: 20px;
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
`;

const PortfolioHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const PortfolioItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${tk.hair};

  &:last-child {
    border-bottom: none;
  }
`;

export function PortfolioSkeleton() {
  return (
    <PortfolioContainer>
      <PortfolioHeader>
        <div>
          <SkeletonLine $width="100px" $height="14px" $margin="0 0 8px 0" />
          <SkeletonLine $width="150px" $height="28px" />
        </div>
        <SkeletonLine $width="80px" $height="32px" />
      </PortfolioHeader>
      {[1, 2, 3, 4].map(i => (
        <PortfolioItem key={i}>
          <SkeletonCircle $size="40px" />
          <div style={{ flex: 1 }}>
            <SkeletonLine $width="80px" $height="16px" $margin="0 0 6px 0" />
            <SkeletonLine $width="60px" $height="12px" />
          </div>
          <div style={{ textAlign: 'right' }}>
            <SkeletonLine $width="70px" $height="16px" $margin="0 0 6px 0" />
            <SkeletonLine $width="50px" $height="12px" />
          </div>
        </PortfolioItem>
      ))}
    </PortfolioContainer>
  );
}

/**
 * AI Coach chat skeleton
 */
const ChatContainer = styled.div`
  padding: 20px;
  background: ${tk.surface};
  border: 1px solid ${tk.hair};
  border-radius: ${tk.r}px;
  min-height: 400px;
`;

const ChatMessage = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  
  &.user {
    flex-direction: row-reverse;
  }
`;

const MessageBubble = styled(SkeletonBase)`
  padding: 16px;
  border-radius: ${tk.r}px;
  max-width: 70%;
  background: linear-gradient(
    90deg,
    rgba(244, 241, 233, 0.06) 25%,
    rgba(244, 241, 233, 0.12) 50%,
    rgba(244, 241, 233, 0.06) 75%
  );
  background-size: 200% 100%;
`;

export function CoachChatSkeleton() {
  return (
    <ChatContainer>
      <ChatMessage>
        <SkeletonCircle $size="36px" style={{ background: 'rgba(244,241,233,0.08)' }} />
        <div>
          <MessageBubble style={{ width: '200px', height: '60px', marginBottom: '8px' }} />
          <MessageBubble style={{ width: '280px', height: '40px' }} />
        </div>
      </ChatMessage>
      <ChatMessage className="user">
        <div>
          <MessageBubble style={{ width: '180px', height: '40px' }} />
        </div>
      </ChatMessage>
      <ChatMessage>
        <SkeletonCircle $size="36px" style={{ background: 'rgba(244,241,233,0.08)' }} />
        <div>
          <MessageBubble style={{ width: '240px', height: '80px' }} />
        </div>
      </ChatMessage>
    </ChatContainer>
  );
}

export default {
  SkeletonLine,
  SkeletonCircle,
  SkeletonRect,
  ChartSkeleton,
  PortfolioSkeleton,
  CoachChatSkeleton
};

