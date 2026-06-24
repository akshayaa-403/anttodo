import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TaskBoard from './pages/TaskBoard';
import PlannerView from './pages/PlannerView';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow p-4">
          <div className="container mx-auto flex gap-6">
            <Link to="/" className="font-bold text-xl text-blue-600">🐜 AntPlan</Link>
            <Link to="/" className="text-gray-700 hover:text-blue-600">Tasks</Link>
            <Link to="/planner" className="text-gray-700 hover:text-blue-600">Planner</Link>
          </div>
        </nav>
        <div className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<TaskBoard />} />
            <Route path="/planner" element={<PlannerView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;