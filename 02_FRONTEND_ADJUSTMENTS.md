# Frontend Adjustments Guide

## 🎯 What Needs to Change in Your React + Vite Project

Your frontend is ready, just need these 5 adjustments to work with Docker + backend API.

---

## 1️⃣ CREATE .env FILE

In your `frontend/` root (next to package.json):

```bash
touch .env
```

**Content:**
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=HEALTH AI
```

---

## 2️⃣ CREATE API CLIENT

Create file: `src/api/client.js`

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## 3️⃣ UPDATE YOUR APP COMPONENT

Wherever you have authentication/login logic, update it:

### BEFORE (Mock):
```javascript
const handleLogin = (email, password) => {
  if (email.endsWith('.edu')) {
    setAuth({ email, role });
    setView('feed');
  }
};
```

### AFTER (Real API):
```javascript
import API from './api/client';

const handleLogin = async (email, password) => {
  try {
    const response = await API.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    // Save token to localStorage
    localStorage.setItem('token', token);
    
    setAuth(user);
    setView('feed');
  } catch (error) {
    console.error('Login failed:', error.response?.data?.error);
    alert('Login failed. Check credentials.');
  }
};
```

### Register:
```javascript
const handleRegister = async (email, password, name) => {
  try {
    const response = await API.post('/auth/register', { 
      email, 
      password, 
      name 
    });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    setAuth(user);
    setView('feed');
  } catch (error) {
    alert(error.response?.data?.error || 'Registration failed');
  }
};
```

---

## 4️⃣ UPDATE POST FETCHING

### BEFORE (Mock):
```javascript
const [posts, setPosts] = useState([
  { id: 1, title: 'AI for Arrhythmia...', ... }
]);
```

### AFTER (Real API):
```javascript
useEffect(() => {
  const fetchPosts = async () => {
    try {
      const response = await API.get('/posts', {
        params: {
          domain: filters.domain !== 'all' ? filters.domain : undefined,
          stage: filters.stage !== 'all' ? filters.stage : undefined,
          search: filters.search || undefined,
        }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  fetchPosts();
}, [filters]);
```

---

## 5️⃣ UPDATE POST CREATION

### BEFORE (Mock):
```javascript
const handleCreatePost = () => {
  const newPost = { id: posts.length + 1, ...formData };
  setPosts([newPost, ...posts]);
};
```

### AFTER (Real API):
```javascript
const handleCreatePost = async () => {
  try {
    const response = await API.post('/posts', formData);
    setPosts([response.data, ...posts]);
    
    // Reset form
    setFormData({ title: '', description: '', ... });
    setView('feed');
    
    alert('Post created! Waiting for interest...');
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to create post');
  }
};
```

---

## 6️⃣ UPDATE MESSAGE SENDING

### BEFORE (Mock):
```javascript
const handleInterest = () => {
  alert('Interest sent!');
};
```

### AFTER (Real API):
```javascript
const handleInterest = async (postId, recipientId, message) => {
  try {
    await API.post('/messages', {
      post_id: postId,
      recipient_id: recipientId,
      content: message,
      nda_accepted: false // First message, NDA comes after
    });
    
    alert('Interest sent! Email notification sent to them.');
    setView('messages');
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to send interest');
  }
};
```

---

## 7️⃣ HANDLE LOGOUT

```javascript
const handleLogout = () => {
  localStorage.removeItem('token');
  setAuth(null);
  setUser(null);
  setView('login');
};
```

---

## 8️⃣ CREATE DOCKERFILE

Create file: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Install serve to run the build
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 9️⃣ CREATE .dockerignore

Create file: `frontend/.dockerignore`

```
node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.local
README.md
.vscode
.idea
```

---

## 🔟 VERIFY SETUP

Before running Docker:

```bash
# Check if .env exists
cat .env
# Should show:
# VITE_API_URL=http://localhost:5000/api

# Check if src/api/client.js exists
ls src/api/client.js

# Test building locally
npm run build
# Should create dist/ folder without errors
```

---

## ✅ FRONTEND CHECKLIST

- [ ] .env file created with VITE_API_URL
- [ ] src/api/client.js created (API client)
- [ ] handleLogin updated to use API.post()
- [ ] handleRegister updated to use API.post()
- [ ] Post fetching uses API.get() in useEffect
- [ ] Post creation uses API.post()
- [ ] Message sending uses API.post()
- [ ] Logout clears localStorage
- [ ] Dockerfile created
- [ ] .dockerignore created
- [ ] npm run build works without errors

---

## 🚀 NEXT STEP

Once frontend is adjusted:
→ See `02_DOCKER_SETUP.md` for docker-compose configuration

---

## 💡 QUICK REFERENCE

**In your components:**
```javascript
import API from './api/client';

// GET request
const response = await API.get('/posts');

// POST request
const response = await API.post('/posts', { title: '...' });

// PUT request
const response = await API.put('/posts/1', { title: '...' });

// DELETE request
await API.delete('/posts/1');
```

**Store token:**
```javascript
localStorage.setItem('token', token);
```

**Get token:**
```javascript
const token = localStorage.getItem('token');
```

**Remove token (logout):**
```javascript
localStorage.removeItem('token');
```

---

**That's it! Your frontend is ready for Docker + real API.**