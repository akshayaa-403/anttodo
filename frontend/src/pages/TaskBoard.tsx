import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, createTask, updateTask, deleteTask, Task } from '../api/taskApi';

export default function TaskBoard() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', urgency_score: 5, mental_load: 5, duration_minutes: 30 });

  const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreating(false);
      setNewTask({ title: '', urgency_score: 5, mental_load: 5, duration_minutes: 30 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Tasks</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Task
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded shadow mb-4 border">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div>
              <label className="block text-sm">Urgency (1-10)</label>
              <input
                type="number"
                value={newTask.urgency_score}
                onChange={(e) => setNewTask({ ...newTask, urgency_score: parseFloat(e.target.value) })}
                className="border p-2 rounded w-full"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm">Mental Load (1-10)</label>
              <input
                type="number"
                value={newTask.mental_load}
                onChange={(e) => setNewTask({ ...newTask, mental_load: parseFloat(e.target.value) })}
                className="border p-2 rounded w-full"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm">Duration (mins)</label>
              <input
                type="number"
                value={newTask.duration_minutes}
                onChange={(e) => setNewTask({ ...newTask, duration_minutes: parseInt(e.target.value) })}
                className="border p-2 rounded w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMutation.mutate(newTask)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {tasks?.map((task) => (
          <div key={task.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{task.title}</h3>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>🔥 Urgency: {task.urgency_score}/10</span>
                <span>🧠 Load: {task.mental_load}/10</span>
                <span>⏱ {task.duration_minutes}min</span>
                {task.deadline && <span>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
              </div>
            </div>
            <button
              onClick={() => deleteMutation.mutate(task.id)}
              className="text-red-600 hover:text-red-800"
            >
              Archive
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}