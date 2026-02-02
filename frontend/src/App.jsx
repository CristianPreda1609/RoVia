import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/MapPage';
import QuizPage from './pages/QuizPage';
import AttractionPage from './pages/AttractionPage';
import Contact from './pages/Contact.jsx';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import RequireAuth from './components/RequireAuth';
import Dashboard from './pages/Dashboard';
import PromoterPortal from './pages/PromoterPortal';
import AdminPanel from './pages/AdminPanel';
import Leaderboard from './pages/Leaderboard';
import VoucherStore from './pages/VoucherStore';


function App() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const sidebarWidth = sidebarOpen ? 280 : 72;

	useEffect(() => {
		document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
	}, [sidebarWidth]);

	return (
		<Router>
			<div style={{ display: 'flex', minHeight: '100vh' }}>
				{/* Sidebar */}
				<Sidebar 
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>

				{/* TopBar */}
				<TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarWidth={sidebarWidth} />

				{/* Main Content */}
				<main style={{ 
					flex: 1, 
					marginLeft: `${sidebarWidth}px`,
					marginTop: '56px',
					transition: 'margin-left 300ms ease',
					background: 'var(--bg)'
				}}>
					<Routes>
						<Route path="/" element={<Navigate to="/dashboard" />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						
						{/* User Dashboard */}
						<Route
							path="/dashboard"
							element={
								<RequireAuth>
									<Dashboard />
								</RequireAuth>
							}
						/>

						{/* Promoter Portal */}
						<Route
							path="/promoter"
							element={
								<RequireAuth>
									<PromoterPortal />
								</RequireAuth>
							}
						/>

						<Route path="/map" element={<MapPage />} />
						<Route path="/attractions/:id" element={<AttractionPage />} />
						<Route
							path="/profile"
							element={<Navigate to="/dashboard?tab=account" />}
						/>
						<Route path="/quiz/:quizId" element={<QuizPage />} />
						<Route path="/leaderboard" element={<Leaderboard />} />
						<Route
							path="/rewards"
							element={
								<RequireAuth>
									<VoucherStore />
								</RequireAuth>
							}
						/>
						<Route path="/contact" element={<Contact />} />
						<Route
							path="/admin"
							element={
								<RequireAuth allowedRoles={['Administrator']}>
									<AdminPanel />
								</RequireAuth>
							}
						/>
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;