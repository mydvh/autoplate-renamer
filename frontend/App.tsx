import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { dbService } from './services/dbService';
import { apiService } from './services/apiService';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import RenamerTool from './components/RenamerTool';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'TOOL' | 'ADMIN'>('LOGIN');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initialize DB (Run Migrations)
    // 2. Check for active session (Simulated)
    const init = async () => {
      await dbService.initDatabase();
      
      const sessionUser = localStorage.getItem('autolpr_session');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
        setUser(u);
        setView(u.role === UserRole.ADMIN ? 'ADMIN' : 'TOOL');
      } else {
        setView('LOGIN');
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('autolpr_session', JSON.stringify(u));
    if (u.role === UserRole.ADMIN) {
      setView('ADMIN');
    } else {
      setView('TOOL');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('autolpr_session');
    apiService.clearToken();
    setView('LOGIN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-200">
      {view === 'LOGIN' && <Login onLogin={handleLogin} />}
      
      {view === 'ADMIN' && user && (
        <AdminDashboard 
          currentUser={user} 
          onLogout={handleLogout} 
          onNavigateToTool={() => setView('TOOL')} 
        />
      )}

      {view === 'TOOL' && user && (
        <RenamerTool 
          user={user} 
          onLogout={handleLogout} 
          onNavigateToAdmin={user.role === UserRole.ADMIN ? () => setView('ADMIN') : undefined}
        />
      )}
    </div>
  );
};

export default App;
