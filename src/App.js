import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:8080';

function getTaskTitle(task) {
  return task.title ?? task.text ?? '';
}

function getTaskCompleted(task) {
  return Boolean(task.completed ?? task.is_done ?? false);
}

function App() {
  const [taskTitle, setTaskTitle] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const completedCount = tasks.filter((task) => getTaskCompleted(task)).length;
  const pendingCount = tasks.length - completedCount;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setStatusMessage('Ошибка при загрузке задач');
    }
  };

  const resetForm = () => {
    setTaskTitle('');
    setIsCompleted(false);
    setEditingId(null);
    setEditingOriginal(null);
  };

  const getErrorText = (error) => {
    const msg = error.response?.data?.detail;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.map((item) => item?.msg ?? item).join(', ');
    return 'Ошибка запроса';
  };

  const handleSubmit = async () => {
    const title = taskTitle.trim();
    if (!title) return;

    try {
      if (editingId) {
        const patchData = {};

        if (!editingOriginal || title !== editingOriginal.title) {
          patchData.title = title;
        }
        if (!editingOriginal || isCompleted !== editingOriginal.completed) {
          patchData.completed = isCompleted;
        }

        if (Object.keys(patchData).length === 0) {
          setStatusMessage('Изменений нет');
          return;
        }

        await axios.patch(`${API_BASE_URL}/tasks/${editingId}`, patchData);
        setStatusMessage('Задача обновлена');
      } else {
        await axios.post(`${API_BASE_URL}/tasks`, { title });
        setStatusMessage('Задача создана');
      }

      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error submitting task:', error);
      setStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleEdit = (task) => {
    const originalTitle = getTaskTitle(task);
    const originalCompleted = getTaskCompleted(task);

    setTaskTitle(originalTitle);
    setIsCompleted(originalCompleted);
    setEditingId(task.id);
    setEditingOriginal({
      title: originalTitle,
      completed: originalCompleted,
    });
    setStatusMessage('');
  };

  const handleToggleCompleted = async (task) => {
    try {
      await axios.patch(`${API_BASE_URL}/tasks/${task.id}`, {
        completed: !getTaskCompleted(task),
      });

      fetchTasks();
    } catch (error) {
      console.error('Error toggling task status:', error);
      setStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);
      if (editingId === id) {
        resetForm();
      }
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      setStatusMessage(`Ошибка: ${getErrorText(error)}`);
    }
  };

  return (
    <div className="app-shell">
      <main className="App">
        <header className="hero">
          <h1>Мои задачи</h1>
        </header>

        <section className="panel editor-panel">
          <div className="input-row">
            <input
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Введите задачу"
            />
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
          </div>

          {editingId && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(event) => setIsCompleted(event.target.checked)}
              />
              Отметить как выполненную при сохранении
            </label>
          )}

          <div className="action-row">
            <button className="btn" onClick={resetForm}>
              {editingId ? 'Отменить редактирование' : 'Очистить поле'}
            </button>
          </div>

          {statusMessage && <div className="status-message">{statusMessage}</div>}
        </section>

        <section className="panel tasks-panel">
          <div className="tasks-header">
            <h2>Список задач</h2>
            <button className="btn" onClick={fetchTasks}>
              Обновить
            </button>
          </div>

          <div className="stats">
            <span className="stat-pill">Всего: {tasks.length}</span>
            <span className="stat-pill">Активных: {pendingCount}</span>
            <span className="stat-pill">Готово: {completedCount}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">Пока пусто. Добавьте первую задачу выше.</div>
          ) : (
            <ul>
              {tasks.map((task, index) => (
                <li key={task.id} style={{ '--item-index': index }}>
                  <button
                    className={getTaskCompleted(task) ? 'toggle done' : 'toggle'}
                    onClick={() => handleToggleCompleted(task)}
                    aria-label="Переключить статус"
                  >
                    {getTaskCompleted(task) ? '✓' : ''}
                  </button>

                  <div className="task-content">
                    <span className={getTaskCompleted(task) ? 'task-title done' : 'task-title'}>
                      {getTaskTitle(task)}
                    </span>
                    <span className="task-state">{getTaskCompleted(task) ? 'Выполнена' : 'В работе'}</span>
                  </div>

                  <div className="task-actions">
                    <button className="btn" onClick={() => handleEdit(task)}>
                      Изменить
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
