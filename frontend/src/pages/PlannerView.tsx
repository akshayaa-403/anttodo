import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { triggerPlan, getPlanStatus } from '../api/planApi';

export default function PlannerView() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [result, setResult] = useState<{ order: number[]; fitness: number } | null>(null);

  const planMutation = useMutation({
    mutationFn: triggerPlan,
    onSuccess: (data) => {
      setTaskId(data.task_id);
      setStatus('pending');
      pollStatus(data.task_id);
    },
  });

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const statusData = await getPlanStatus(id);
        if (statusData.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setResult({
            order: statusData.order || [],
            fitness: statusData.fitness || 0,
          });
        } else if (statusData.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
        }
      } catch (error) {
        clearInterval(interval);
        setStatus('failed');
      }
    }, 1000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🧠 AI Planner</h1>

      <button
        onClick={() => planMutation.mutate({ n_ants: 15, n_iterations: 20 })}
        disabled={planMutation.isPending}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {planMutation.isPending ? 'Generating...' : 'Generate Optimal Plan'}
      </button>

      {status === 'pending' && (
        <div className="mt-6 p-4 bg-yellow-100 rounded">
          ⏳ Ants are working on your plan... (Task ID: {taskId})
        </div>
      )}

      {status === 'completed' && result && (
        <div className="mt-6 bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">✅ Recommended Order</h2>
          <p className="text-sm text-gray-600 mb-4">Fitness Score: {result.fitness.toFixed(2)} (lower is better)</p>
          <ol className="list-decimal list-inside space-y-2">
            {result.order.map((taskId, idx) => (
              <li key={idx} className="p-2 bg-gray-50 rounded border">
                Task #{taskId}
              </li>
            ))}
          </ol>
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded">
          ❌ Failed to generate plan. Check backend logs.
        </div>
      )}
    </div>
  );
}