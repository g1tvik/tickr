import React from 'react';
import styled from 'styled-components';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  width: 100%;
`;

const AboutSection = styled.section`
  width: 100%;
  max-width: 1200px;
  padding: 2rem 2rem 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
`;

const AboutTitle = styled.h1`
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  letter-spacing: -2px;
  color: var(--text-main, #f5f6fa);
  text-shadow: 0 0 20px rgba(245, 246, 250, 0.3);
  line-height: 1.1;
`;

const AboutSubtitle = styled.p`
  font-size: 1.5rem;
  color: var(--text-muted, #b0b3b8);
  font-weight: 400;
  max-width: 800px;
  line-height: 1.4;
  margin-bottom: 2rem;
`;

const ContentSection = styled.div`
  width: 100%;
  max-width: 900px;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
`;

const ContentTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-main, #f5f6fa);
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ContentText = styled.p`
  font-size: 1.1rem;
  color: var(--text-muted, #b0b3b8);
  line-height: 1.7;
  margin-bottom: 1.5rem;
  text-align: justify;
`;

const About = () => {
  return (
    <PageWrapper>
      <AboutSection>
        <AboutTitle>About StockBuddy</AboutTitle>
        <AboutSubtitle>
          Empowering the next generation of investors through education and innovation
        </AboutSubtitle>
        
        <ContentSection>
          <ContentTitle>Our Mission</ContentTitle>
          <ContentText>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </ContentText>
          
          <ContentText>
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </ContentText>
          
          <ContentTitle>Our Story</ContentTitle>
          <ContentText>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </ContentText>
          
          <ContentText>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
          </ContentText>
          
          <ContentTitle>Our Values</ContentTitle>
          <ContentText>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.
          </ContentText>
          
          <ContentText>
            Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
          </ContentText>
        </ContentSection>
      </AboutSection>
    </PageWrapper>
  );
};

export default About; 