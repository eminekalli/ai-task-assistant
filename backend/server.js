const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock Database (Geliştirmede PostgreSQL'e bağlanacak)
let tasks = [];

// FR-01: AI Intent Parsing & Task Creation
app.post('/api/ai/process', async (req, res) => {
    const { message } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Sen bir görev asistanısın. Kullanıcıdan gelen metni analiz et ve JSON formatında döndür: { title: string, date: string, action: 'create'|'list'|'delete' }. Tarih belirtilmemişse 'today' kullan."
            }, {
                role: "user",
                content: message
            }],
            response_format: { type: "json_object" }
        });

        const intent = JSON.parse(response.choices[0].message.content);
        
        if (intent.action === 'create') {
            const newTask = { id: Date.now(), title: intent.title, date: intent.date, completed: false };
            tasks.push(newTask);
            return res.json({ message: "Görev oluşturuldu!", task: newTask });
        }

        res.json({ message: "Anlaşıldı, ancak şu an sadece görev oluşturabiliyorum.", intent });
    } catch (error) {
        res.status(500).json({ error: "AI Error" });
    }
});

// FR-02: Task CRUD
app.get('/api/tasks', (req, res) => res.json(tasks));

app.listen(5001, () => console.log('Backend 5001 portunda çalışıyor.'));
