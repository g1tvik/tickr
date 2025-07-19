# Content Management Migration Guide

## Current State: Frontend-Only Articles
- Articles stored in `src/data/articles.js`
- Fast for development and small content
- Bundle size grows with content

## Migration Paths

### Option 1: Headless CMS (Recommended)
**Best for:** Content that changes frequently, multiple authors, rich media

#### Setup with Strapi (Free, Self-hosted):
```bash
# Install Strapi
npx create-strapi-app@latest stockbuddy-cms --quickstart

# Create Article content type with fields:
# - title (Text)
# - description (Text)
# - content (Rich Text)
# - category (Relation)
# - featuredImage (Media)
# - tags (JSON)
```

#### Update useArticles hook:
```javascript
const fetchArticles = async () => {
  const response = await fetch('http://localhost:1337/api/articles?populate=*');
  const data = await response.json();
  return data.data.map(item => ({
    id: item.id,
    title: item.attributes.title,
    // ... map other fields
  }));
};
```

### Option 2: Database + API (Most Scalable)
**Best for:** Large scale, real-time features, user-generated content

#### Setup with MongoDB:
```javascript
// Backend (Express + MongoDB)
const ArticleSchema = new mongoose.Schema({
  title: String,
  description: String,
  content: Object,
  category: String,
  tags: [String],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: Date,
  featuredImage: String
});

// API Routes
app.get('/api/articles', async (req, res) => {
  const articles = await Article.find().populate('author');
  res.json(articles);
});

app.get('/api/articles/:id', async (req, res) => {
  const article = await Article.findById(req.params.id).populate('author');
  res.json(article);
});
```

### Option 3: Static Site Generation (Best Performance)
**Best for:** Content that rarely changes, SEO focus

#### Setup with Next.js:
```javascript
// pages/articles/[id].js
export async function getStaticPaths() {
  const articles = await fetchAllArticles();
  return {
    paths: articles.map(article => ({ params: { id: article.id } })),
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  const article = await fetchArticle(params.id);
  return { props: { article } };
}
```

## Migration Strategy

### Phase 1: Prepare (Current)
- ✅ Use `useArticles` hook (already implemented)
- ✅ Keep articles in `articles.js`
- ✅ Test all functionality

### Phase 2: Choose Platform
- **< 50 articles, infrequent updates:** Keep current approach
- **50-500 articles, regular updates:** Headless CMS
- **500+ articles, real-time features:** Database + API
- **SEO critical, static content:** Static Site Generation

### Phase 3: Implement
1. Set up chosen platform
2. Migrate existing articles
3. Update `useArticles` hook
4. Test thoroughly
5. Deploy

## Performance Comparison

| Approach | Bundle Size | Load Time | SEO | Scalability |
|----------|-------------|-----------|-----|-------------|
| Current (Frontend) | ⚠️ Grows with content | ✅ Fast | ✅ Good | ❌ Limited |
| Headless CMS | ✅ Small | ⚠️ API calls | ✅ Good | ✅ High |
| Database + API | ✅ Small | ⚠️ API calls | ✅ Good | ✅ Very High |
| Static Generation | ✅ Small | ✅ Fastest | ✅ Best | ⚠️ Build time |

## Recommendation for StockBuddy

**Start with current approach** → **Migrate to Headless CMS when you have 20+ articles**

This gives you:
- Fast development now
- Easy migration path
- Room to grow
- No upfront complexity 