import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import UserProfile from "./pages/UserProfile";
import QuizPage from './pages/QuizPage';
import AttractionPage from './pages/AttractionPage';
import Contact from './pages/Contact.jsx';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

function Leaderboard() {
  // simplu fallback: ar trebui înlocuit cu API call real
  const top = [
    { name: 'alex', points: 420 },
    { name: 'maria', points: 380 },
    { name: 'ion', points: 300 }
  ];
  return (
    <div style={{ padding: 24 }}>
      <h2>Clasament</h2>
      <ol>
        {top.map(u => <li key={u.name}>{u.name} — {u.points} puncte</li>)}
      </ol>
    </div>
  );
}



function App() {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<Router>
			<div style={{ display: 'flex', minHeight: '100vh' }}>
				{/* Sidebar */}
				<Sidebar 
					isOpen={sidebarOpen} 
					onToggle={() => setSidebarOpen(!sidebarOpen)}
					onClose={() => setSidebarOpen(false)}
				/>

				{/* TopBar */}
				<TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

				{/* Main Content */}
				<main style={{ 
					flex: 1, 
					marginLeft: sidebarOpen ? '280px' : '72px',
					marginTop: '56px',
					transition: 'margin-left 300ms ease',
					background: 'var(--bg)'
				}}>
					<Routes>
						<Route path="/" element={<Navigate to="/map" />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/map" element={<MapPage />} />
						<Route path="/attractions/:id" element={<AttractionPage />} />
						<Route path="/profile" element={<UserProfile />} />
						<Route path="/quiz/:quizId" element={<QuizPage />} />
						<Route path="/leaderboard" element={<Leaderboard />} />
						<Route path="/contact" element={<Contact />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;