# CLAUDE.md - HEALTH AI Project Guidelines

## 📋 Project Overview

**HEALTH AI** is a secure co-creation platform for healthcare innovation. Engineers and healthcare professionals connect to form interdisciplinary partnerships.

- **Tech Stack:** Node.js + Express + PostgreSQL + React + Vite + Docker
- **Architecture:** Microservices-ready with clear separation of concerns
- **Key Principle:** Minimal friction, maximum security, exceptional UX/UI

---

## 🎯 Core Principles

### 1. UX/UI First
- Minimal, clean interface - no more than 2-3 sections per view
- Fast registration (3 fields max)
- Obvious action buttons (sticky, prominent)
- Real-time feedback (no page reloads)
- Mobile responsive

### 2. Security & Privacy
- Zero file uploads (no file repository)
- Email verification (.edu only)
- NDA required before sensitive chat
- Password hashing (bcrypt)
- JWT tokens (1 hour expiry)
- Role-based access control (RBAC)

### 3. Developer Experience
- Clear project structure
- Type safety where possible
- Error handling at all levels
- Comprehensive logging
- Easy local development

---

## 📁 Project Structure

```
healthai-project/
├── backend/
│   ├── src/
│   │   ├── index.js                 (Express server setup)
│   │   ├── middleware/
│   │   │   ├── auth.js              (JWT verification)
│   │   │   ├── errorHandler.js      (Error handling)
│   │   │   └── logger.js            (Request logging)
│   │   ├── routes/
│   │   │   ├── auth.js              (Login, register, verify)
│   │   │   ├── posts.js             (CRUD posts)
│   │   │   ├── messages.js          (Chat + NDA)
│   │   │   └── admin.js             (Admin dashboard)
│   │   ├── services/
│   │   │   ├── auth.js              (Bcrypt, JWT)
│   │   │   ├── email.js             (SendGrid)
│   │   │   ├── posts.js             (Post logic)
│   │   │   └── users.js             (User logic)
│   │   └── prisma/
│   │       ├── schema.prisma        (Database models)
│   │       └── seed.js              (Test data)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PostCard.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── api/
│   │   │   └── client.js            (Axios setup)
│   │   ├── App.jsx                  (Main app)
│   │   └── index.css
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── docker-compose.yml
├── .env.docker
├── .gitignore
├── CLAUDE.md                        (This file)
└── README.md
```

---

## 🔌 MCP Tools: code-review-graph

**IMPORTANT: Use MCP tools BEFORE file reading when exploring codebase.**

The project has a knowledge graph. Use these tools for efficient code review:

### When to Use Graph Tools FIRST

| Scenario | Tool | Why |
|----------|------|-----|
| Exploring code structure | `semantic_search_nodes` | Faster than grep, structural context |
| Understanding impact of changes | `get_impact_radius` | Shows all affected files/functions |
| Reviewing a code change | `detect_changes` | Risk-scored analysis, token-efficient |
| Finding callers/dependents | `query_graph` (pattern: callers_of) | Direct relationship queries |
| Finding tests for a function | `query_graph` (pattern: tests_for) | Automatic test discovery |
| Understanding architecture | `get_architecture_overview` | High-level structure, modules, layers |
| Finding execution paths | `get_affected_flows` | Which flows are impacted by changes |

### Key Graph Tools

```
detect_changes
├─ Analyzes code diffs
├─ Risk scoring (1-10)
├─ Shows affected functions
└─ Returns file snippets

get_review_context
├─ Source code snippets
├─ Caller/callee context
├─ Test coverage info
└─ Token-efficient

get_impact_radius
├─ Blast radius analysis
├─ File dependency tree
├─ Function call chains
└─ Architecture impact

query_graph
├─ Flexible pattern queries
├─ callers_of(function)
├─ callees_of(function)
├─ imports_of(module)
├─ tests_for(function)
└─ dependencies_of(file)

get_affected_flows
├─ Execution path analysis
├─ Dataflow tracking
├─ Which functions trigger which
└─ Call sequence mapping
```

### Workflow Example

```javascript
// Step 1: Understand change impact
detect_changes({
  before_path: "backend/src/routes/posts.js",
  after_path: "backend/src/routes/posts.js"
})
// Returns: Risk score, affected functions, snippet

// Step 2: Find all callers
query_graph({
  pattern: "callers_of",
  target: "createPost"
})
// Returns: All functions that call createPost()

// Step 3: Check if covered by tests
query_graph({
  pattern: "tests_for",
  target: "backend/src/routes/posts.js"
})
// Returns: Test files and coverage

// Step 4: Understand architecture
get_architecture_overview()
// Returns: Module structure, layers, dependencies
```

### When to Fall Back to File Tools

Use Grep/Glob/Read **only** when:
- Graph doesn't have specific node (new code)
- You need full file content (not just snippets)
- Inspecting configuration files (.env, package.json)
- Reading documentation

---

## 🛠️ Development Workflow

### Local Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
npm install
# .env already created

# Docker
cd ..
docker-compose up --build
```

### Running Locally (Without Docker)

```bash
# Terminal 1: Start PostgreSQL (via Docker or local)
docker run --rm -p 5432:5432 \
  -e POSTGRES_USER=healthai_user \
  -e POSTGRES_PASSWORD=healthai_password \
  -e POSTGRES_DB=healthai_db \
  postgres:15-alpine

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Docker Workflow

```bash
# Build all services
docker-compose up --build

# See logs
docker-compose logs -f backend

# Stop
docker-compose down

# Rebuild one service
docker-compose up -d --build backend
```

---

## 📊 API Endpoints

### Auth
- `POST /api/auth/register` - Create account (.edu only)
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/refresh` - Refresh JWT token

### Posts
- `GET /api/posts` - List posts (filtered by role)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (engineer only)
- `PUT /api/posts/:id` - Edit post (author only)
- `DELETE /api/posts/:id` - Delete post (soft delete)
- `POST /api/posts/:id/mark-closed` - Mark as partner found

### Messages
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `POST /api/messages/:id/accept-nda` - Accept NDA

### Admin
- `GET /api/admin/users` - List users (admin only)
- `GET /api/admin/posts` - List all posts (admin only)

---

## 🗄️ Database Schema (Prisma)

### User
- email (unique, .edu validation)
- passwordHash (bcrypt)
- role (engineer | doctor | admin)
- verifiedAt (email verification)
- createdAt, updatedAt, deletedAt (soft delete)

### Post
- title, description, domain
- expertiseNeeded, commitmentLevel
- projectStage (idea | concept | prototype | pilot | deployed)
- status (draft | active | meeting_scheduled | partner_found | expired)
- confidentiality (public | private)
- authorId (foreign key)

### Message
- postId, senderId, recipientId
- content, ndaAcceptedAt
- createdAt

### MeetingRequest
- postId, requestorId, recipientId
- proposedTimes (JSON array)
- agreedTime, externalUrl
- status (pending | scheduled | completed)

---

## 🔐 Security Checklist

- [ ] All routes validate user role
- [ ] Passwords hashed with bcrypt (10 salt rounds)
- [ ] JWT tokens expire in 1 hour
- [ ] Email verification required before posting
- [ ] CORS whitelist only frontend URL
- [ ] Rate limiting: 100 req/min per IP
- [ ] No sensitive data in error messages
- [ ] NDA accepted before sensitive chat
- [ ] Soft deletes on all user data
- [ ] Audit logs for admin actions

---

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### Integration Tests
```bash
# Requires running database
npm run test:integration
```

### E2E Tests
```bash
cd frontend
npm run test:e2e
```

---

## 📝 Code Style

### JavaScript
- ES6 import/export
- async/await (not .then())
- Arrow functions preferred
- 2-space indentation
- Camel case for variables/functions
- SCREAMING_SNAKE_CASE for constants

### React
- Functional components
- Hooks for state management
- JSDoc comments on complex components
- Tailwind for styling

### SQL (via Prisma)
- No raw SQL queries
- Use Prisma ORM for everything
- Run migrations on schema changes

### Naming
- Routes: kebab-case `/api/auth-verify`
- Files: camelCase `authService.js`
- Database: snake_case `verified_at`
- Components: PascalCase `PostCard.jsx`

---

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.yml up -d
```

### Environment Variables (Production)
```
NODE_ENV=production
JWT_SECRET=[generate new]
SENDGRID_API_KEY=[your key]
DATABASE_URL=[production db]
FRONTEND_URL=[production url]
```

### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Environment variables set
- [ ] Database migrations tested
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place

---

## 📚 Documentation

- `README.md` - Project overview, quick start
- `IMPLEMENTATION_PLAN.md` - Architecture decisions
- `CLAUDE_CODE_PROMPT.md` - Backend generation
- `FRONTEND_ADJUSTMENTS.md` - Frontend setup
- `DOCKER_SETUP.md` - Docker configuration
- `SETUP_CHECKLIST.md` - Step-by-step instructions
- `CLAUDE.md` (this file) - Development guidelines

---

## 🐛 Debugging Tips

### Backend
```bash
# Check logs
docker-compose logs -f backend

# Access container
docker exec -it healthai-api sh

# Check database
docker exec -it healthai-db psql -U healthai_user -d healthai_db
```

### Frontend
```bash
# Browser console (F12)
# Check VITE_API_URL in .env
# Network tab for API calls
```

### Common Issues
1. Port in use: Change ports in docker-compose.yml
2. DB connection failed: Wait for postgres healthcheck
3. CORS errors: Check FRONTEND_URL in backend .env
4. API calls fail: Check token in localStorage, JWT expiry

---

## 🔄 Git Workflow

### Branch Naming
- Features: `feature/auth-verification`
- Fixes: `fix/login-bug`
- Docs: `docs/setup-guide`

### Commit Messages
- Good: "feat: add email verification"
- Bad: "update", "fix stuff", "working"

### .gitignore
```
node_modules/
.env
.env.local
dist/
build/
.DS_Store
.vscode/
.idea/
coverage/
```

---

## 📞 Support & Questions

### For Architecture Questions
Use `get_architecture_overview` via MCP tools to understand module relationships.

### For Code Review
1. Use `detect_changes` for risk analysis
2. Use `get_review_context` for snippets
3. Use `query_graph` for relationships

### For Bug Fixes
1. Use `semantic_search_nodes` to find related code
2. Use `get_affected_flows` to trace impact
3. Check test coverage with `query_graph` (tests_for)

---

## ✅ Checklist Before Submission

- [ ] All services run in Docker without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:5000/api
- [ ] Database migrations run automatically
- [ ] Can register with .edu email
- [ ] Can login and see role-appropriate feed
- [ ] Can create posts and filter in real-time
- [ ] Can send messages (no files)
- [ ] NDA appears before sensitive chat
- [ ] Email notifications work
- [ ] No console errors or CORS issues
- [ ] All tests pass
- [ ] Code follows style guide
- [ ] Documentation is complete

---

## 🎉 Ready to Go!

This project is production-ready and fully containerized. Everything runs in Docker, follows best practices, and prioritizes exceptional UX/UI.

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Ready for Presentation