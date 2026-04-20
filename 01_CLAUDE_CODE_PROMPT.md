# 🔧 CLAUDE CODE PROMPT - HEALTH AI BACKEND

## HOW TO USE

1. VS Code'u aç
2. Claude Code panelini aç (Cmd+Shift+P → "Claude: Open in Editor")
3. Bu prompt'un tamamını kopyala
4. Backend klasöründe çalıştır: `cd backend && [paste prompt]`

---

## THE PROMPT

```
Generate a complete Node.js + Express backend for HEALTH AI platform with the following specifications:

PROJECT NAME: HEALTH AI Backend
FRAMEWORK: Express.js
DATABASE: PostgreSQL + Prisma ORM
PORT: 5000
ENVIRONMENT: Docker-ready (development)

REQUIREMENTS:

1. PROJECT STRUCTURE:
   src/
   ├── index.js (main server)
   ├── middleware/
   │   ├── auth.js (JWT verification)
   │   ├── errorHandler.js (error handling)
   │   └── logger.js (request logging)
   ├── routes/
   │   ├── auth.js (register, login, verify email)
   │   ├── posts.js (CRUD posts, filtering)
   │   ├── messages.js (messaging + NDA)
   │   └── admin.js (admin dashboard)
   ├── services/
   │   ├── auth.js (bcrypt, JWT tokens)
   │   ├── email.js (SendGrid integration)
   │   ├── posts.js (post business logic)
   │   └── users.js (user business logic)
   └── prisma/
       ├── schema.prisma (database models)
       └── seed.js (test data)

2. DATABASE SCHEMA (Prisma):
   
   User model:
   - id (Int, primary key, autoincrement)
   - email (String, unique, must end with .edu)
   - passwordHash (String)
   - name (String)
   - role (String: engineer | doctor | admin)
   - institution (String, optional)
   - verifiedAt (DateTime, optional - for email verification)
   - createdAt (DateTime, default now)
   - updatedAt (DateTime, updatedAt)
   - deletedAt (DateTime, optional - soft delete)
   - relationships: posts, sentMessages, receivedMessages, notifications

   Post model:
   - id (Int, primary key)
   - authorId (Int, foreign key to User)
   - title (String, max 100)
   - domain (String)
   - description (String, max 500)
   - expertiseNeeded (String)
   - commitmentLevel (String)
   - projectStage (String: idea | concept | prototype | pilot | deployed)
   - confidentiality (String: public | private, default public)
   - status (String: draft | active | meeting_scheduled | partner_found | expired, default active)
   - expiresAt (DateTime, optional)
   - city (String)
   - createdAt (DateTime)
   - updatedAt (DateTime)
   - deletedAt (DateTime, optional - soft delete)

   Message model:
   - id (Int, primary key)
   - postId (Int, foreign key to Post)
   - senderId (Int, foreign key to User)
   - recipientId (Int, foreign key to User)
   - content (String)
   - ndaAcceptedAt (DateTime, optional)
   - readAt (DateTime, optional)
   - createdAt (DateTime)

   MeetingRequest model:
   - id (Int, primary key)
   - postId (Int, foreign key to Post)
   - requestorId (Int, foreign key to User)
   - recipientId (Int, foreign key to User)
   - proposedTimes (Json - array of DateTime)
   - agreedTime (DateTime, optional)
   - status (String: pending | scheduled | completed | cancelled)
   - externalUrl (String, optional - Zoom/Teams link)
   - createdAt (DateTime)
   - updatedAt (DateTime)

   Notification model:
   - id (Int, primary key)
   - userId (Int, foreign key to User)
   - type (String)
   - relatedPostId (Int, optional)
   - relatedUserId (Int, optional)
   - message (String)
   - readAt (DateTime, optional)
   - createdAt (DateTime)

3. AUTHENTICATION:
   - Email validation: must end with .edu
   - Email verification: token expires in 24 hours
   - Password hashing: bcrypt with 10 salt rounds
   - JWT tokens: access token (1 hour), refresh token (30 days)
   - Role detection: auto-detect from email (contains "dr" or "doc" → doctor, else → engineer)

4. API ENDPOINTS:

   AUTH:
   POST /api/auth/register
     Body: { email, password, name }
     Returns: { user, token }
     Validation: .edu email only, password strength check
   
   POST /api/auth/login
     Body: { email, password }
     Returns: { user, token }
   
   POST /api/auth/verify-email
     Query: ?token=xyz
     Returns: { message: "Email verified" }
   
   POST /api/auth/refresh
     Body: { refreshToken }
     Returns: { token }

   POSTS:
   GET /api/posts
     Query: ?domain=cardiology&stage=prototype&search=AI&role=doctor
     Returns: [posts] (filtered by role)
   
   GET /api/posts/:id
     Returns: { full post with author details }
   
   POST /api/posts (engineer only)
     Body: { title, domain, description, expertise_needed, commitment, stage, confidentiality }
     Returns: { post }
   
   PUT /api/posts/:id (author only)
     Body: { title, description, ... }
     Returns: { updated post }
   
   DELETE /api/posts/:id (author only)
     Returns: 204 No Content (soft delete)
   
   POST /api/posts/:id/mark-closed (author only)
     Returns: { post with status: "partner_found" }

   MESSAGES:
   GET /api/messages
     Query: ?post_id=123&with_user=456
     Returns: [messages]
   
   POST /api/messages
     Body: { post_id, recipient_id, content, nda_accepted }
     Returns: { message }
     Action: Send email notification to recipient
   
   POST /api/messages/:id/accept-nda
     Returns: { message with nda_accepted_at }

   NOTIFICATIONS:
   GET /api/notifications
     Returns: [notifications]
   
   POST /api/notifications/:id/mark-read
     Returns: { notification }
   
   DELETE /api/notifications/:id
     Returns: 204

   ADMIN:
   GET /api/admin/users (admin only)
     Query: ?role=engineer&verified=false
     Returns: [users]
   
   GET /api/admin/posts (admin only)
     Returns: [all posts with metrics]

5. MIDDLEWARE:
   - CORS: allow http://localhost:3000
   - Body parser: JSON limit 10mb
   - Auth middleware: verify JWT, extract user, attach to req.user
   - Error handler: catch all errors, return 500 with generic message
   - Logger: console log method, path, status

6. SERVICES:

   auth.js:
   - hashPassword(password) → returns bcrypt hash
   - comparePassword(password, hash) → returns boolean
   - generateJWT(userId, expiresIn) → returns token
   - verifyJWT(token) → returns decoded payload

   email.js:
   - sendEmail(to, template, data) → uses SendGrid
   - Templates:
     * welcome_email
     * verify_email
     * interest_received
     * message_received
     * meeting_request
     * meeting_confirmed

   posts.js:
   - getPostsByRole(role) → returns posts visible to that role
   - getPostWithAuthor(postId) → returns post + author details
   - filterPosts(domain, stage, search) → returns filtered posts

7. SECURITY:
   - HTTPS ready (use helmet middleware)
   - Rate limiting: 100 requests/minute per IP
   - Input validation: trim, sanitize strings
   - SQL injection prevention: Prisma parameterized queries
   - CORS: strict whitelist (frontend URL only)
   - Passwords: never returned in API responses
   - Email verification: required before posting

8. ERROR HANDLING:
   - 400 Bad Request: validation failed
   - 401 Unauthorized: no token or invalid
   - 403 Forbidden: no permission for resource
   - 404 Not Found: resource doesn't exist
   - 409 Conflict: email already exists
   - 422 Unprocessable: validation error details
   - 500 Server Error: generic error (no details to client)
   
   Response format:
   {
     error: "string message",
     code: "ERROR_CODE",
     status: 400
   }

9. ENVIRONMENT VARIABLES (.env):
   NODE_ENV=development
   DATABASE_URL=postgresql://healthai_user:healthai_password@postgres:5432/healthai_db
   JWT_SECRET=your_super_secret_key_change_in_production
   SENDGRID_API_KEY=your_sendgrid_api_key
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   LOG_LEVEL=debug

10. PACKAGE.JSON SCRIPTS:
    - "dev": run with nodemon
    - "start": production start
    - "build": compile if needed
    - "seed": run prisma seed

11. DOCKER READINESS:
    - Dockerfile provided separately
    - Uses node:18-alpine base
    - Runs migrations automatically
    - Healthcheck endpoint: GET /api/health

DELIVERABLES:
- src/ folder structure (all files)
- prisma/schema.prisma
- prisma/seed.js (test data)
- .env.example
- package.json (with all dependencies)
- .dockerignore
- All endpoints working and tested with examples

IMPORTANT:
- Use ES6 import/export (not require)
- Use async/await (not .then())
- Add JSDoc comments on functions
- Handle edge cases (null checks, empty arrays)
- Return meaningful error messages
- Never expose sensitive data in logs
- All database queries through Prisma

START NOW: Generate complete backend project structure and code.
```

---

## STEP BY STEP IN VS CODE

1. **Open Terminal:**
   ```bash
   cd healthai-project
   mkdir -p backend
   cd backend
   ```

2. **Open Claude Code:**
   - Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
   - Type: "Claude: Open in Editor"
   - Click the option

3. **Paste the prompt above** into Claude Code panel

4. **Claude will generate:**
   - File structure
   - All code files
   - package.json with dependencies
   - Prisma schema

5. **After Claude finishes:**
   ```bash
   npm install
   ```

6. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

7. **Edit .env with your values:**
   ```
   NODE_ENV=development
   DATABASE_URL=postgresql://healthai_user:healthai_password@postgres:5432/healthai_db
   JWT_SECRET=change_this_to_random_string
   SENDGRID_API_KEY=your_actual_sendgrid_key_or_leave_for_testing
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   ```

---

## VERIFICATION

After Claude Code generates backend:

```bash
# Check structure
ls -la src/

# Install dependencies
npm install

# Test (without database yet)
npm run dev

# Should show:
# ✓ Server running on port 5000
# ✓ Check health: GET http://localhost:5000/api/health
```

---

## NEXT STEPS

1. ✅ Generate backend (THIS PROMPT)
2. ⏭️ Adjust frontend (see next document)
3. ⏭️ Create docker-compose.yml (see next document)
4. ⏭️ Run: `docker-compose up --build`

---

## 💡 TIPS

- If Claude Code can't handle all at once, ask it per-file
- Start with: index.js, then routes, then services
- Ask for: "Generate package.json with all dependencies"
- Ask for: "Generate Prisma schema.prisma file"
- Ask for: "Generate .env.example"

**Copy this entire prompt into Claude Code - it will generate everything!**