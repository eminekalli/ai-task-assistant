import { useState, useEffect } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    const res = await fetch('http://localhost:5001/api/tasks');
    const data = await res.json();
    setTasks(data);
  };

  const handleSendMessage = async () => {
    setLoading(true);
    await fetch('http://localhost:5001/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });
    setInput('');
    fetchTasks();
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-600">AI Task Assistant</h1>
        
        {/* Chat Input */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex gap-2">
          <input 
            className="flex-1 border p-2 rounded" 
            placeholder="Örn: Yarın saat 15:00'e toplantı ekle..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'İşleniyor...' : 'Gönder'}
          </button>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Görevlerim</h2>
          {tasks.length === 0 && <p className="text-gray-500">Henüz görev yok.</p>}
          <ul className="space-y-3">
            {tasks.map(task => (
              <li key={task.id} className="border-b pb-2 flex justify-between">
                <span>{task.title}</span>
                <span className="text-sm text-gray-400">{task.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
