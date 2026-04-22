// =========================
// FULLSTACK MVP PROJECT
// =========================
// Tech Stack:
// Frontend: Next.js (React)
// Backend: Node.js (Express)
// DB: PostgreSQL (via Prisma)
// AI: OpenAI API

// =========================
// 1. BACKEND (Node.js + Express)
// =========================

// backend/package.json
{
  "name": "ai-task-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "openai": "^4.0.0"
  }
}

// backend/index.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, "SECRET");
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(403);
  }
};

// Auth
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash } });
  res.json(user);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.sendStatus(401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.sendStatus(401);

  const token = jwt.sign({ userId: user.id }, "SECRET");
  res.json({ token });
});

// Tasks CRUD
app.post('/tasks', authMiddleware, async (req, res) => {
  const { title, datetime } = req.body;
  const task = await prisma.task.create({
    data: { title, datetime: new Date(datetime), userId: req.user.userId }
  });
  res.json(task);
});

app.get('/tasks', authMiddleware, async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { userId: req.user.userId } });
  res.json(tasks);
});

app.put('/tasks/:id', authMiddleware, async (req, res) => {
  const task = await prisma.task.update({
    where: { id: Number(req.params.id) },
    data: req.body
  });
  res.json(task);
});

app.delete('/tasks/:id', authMiddleware, async (req, res) => {
  await prisma.task.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

// AI Intent Parsing
app.post('/ai', authMiddleware, async (req, res) => {
  const { message } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Extract task title and datetime" },
      { role: "user", content: message }
    ]
  });

  res.json(response.choices[0].message);
});

app.listen(4000, () => console.log('Backend running'));

// =========================
// Prisma Schema
// =========================

// backend/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  password String
  tasks    Task[]
}

model Task {
  id       Int      @id @default(autoincrement())
  title    String
  datetime DateTime
  userId   Int
  user     User     @relation(fields: [userId], references: [id])
}

// =========================
// 2. FRONTEND (Next.js)
// =========================

// frontend/pages/index.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    const res = await axios.get('http://localhost:4000/tasks', {
      headers: { Authorization: token }
    });
    setTasks(res.data);
  };

  const sendAI = async () => {
    const res = await axios.post('http://localhost:4000/ai',
      { message: input },
      { headers: { Authorization: token } }
    );

    console.log(res.data);
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Task Assistant</h1>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a command..."
      />

      <button onClick={sendAI}>Send</button>

      <h2>Tasks</h2>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title} - {new Date(t.datetime).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

// =========================
// RUN INSTRUCTIONS
// =========================
// 1. cd backend
// 2. npm install
// 3. npx prisma migrate dev
// 4. npm run dev

// 5. cd frontend
// 6. npx create-next-app
// 7. npm install axios
// 8. npm run dev

// =========================
// NOTES
// =========================
// - Add .env for DATABASE_URL and OPENAI_API_KEY
// - JWT secret should be secured
// - Notification system can be added via cron or queue (BullMQ)
