import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, ProcessingLog, UserRole, SystemConfig } from '../types';
import { Users, FileText, Calendar, Search, Plus, Trash2, Edit2, Download, LogOut, Wrench, Settings, DollarSign, Calculator, Image as ImageIcon } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onNavigateToTool: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onNavigateToTool }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'config'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [sysConfig, setSysConfig] = useState<SystemConfig>({ pricePerRequest: 0 });
  const [loading, setLoading] = useState(false);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [editingConfig, setEditingConfig] = useState<number>(0);
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // Filter states - Initialize with today's date
  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());
  const [filterUserId, setFilterUserId] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const config = await dbService.getConfig();
      setSysConfig(config);
      setEditingConfig(config.pricePerRequest);

      if (activeTab === 'users') {
        const data = await dbService.getUsers();
        setUsers(data);
      } else if (activeTab === 'logs') {
        await handleFilterLogs();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterLogs = async () => {
    setLoading(true);
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : undefined;
    const toTs = dateTo ? new Date(dateTo).getTime() + 86400000 : undefined; // End of day
    try {
      // First get users to populate the filter dropdown properly even if we are in logs tab
      if (users.length === 0) {
         const userData = await dbService.getUsers();
         setUsers(userData);
      }

      const data = await dbService.getLogs({ from: fromTs, to: toTs, userId: filterUserId || undefined });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser.id) {
        await dbService.updateUser(editingUser.id, editingUser);
      } else {
        await dbService.createUser({
            username: editingUser.username!,
            email: editingUser.email!,
            phoneNumber: editingUser.phoneNumber || '',
            password: editingUser.password!,
            role: editingUser.role || UserRole.USER
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await dbService.deleteUser(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dbService.updateConfig({ pricePerRequest: editingConfig });
      setSysConfig({ pricePerRequest: editingConfig });
      alert("Configuration saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Navbar */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Users className="w-5 h-5 text-white" /></div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{currentUser.username}</p>
            <p className="text-xs text-slate-400">{currentUser.email}</p>
          </div>
          <button onClick={onNavigateToTool} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
            <Wrench className="w-4 h-4" /> Tool
          </button>
          <button onClick={onLogout} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-4 h-4" /> Processing Logs
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'config' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-4 h-4" /> System Config
          </button>
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-blue-400"/> Registered Users</h2>
              <button 
                onClick={() => { setEditingUser({}); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-green-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Username</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{user.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === UserRole.ADMIN ? 'bg-purple-900/50 text-purple-300 border border-purple-700' : 'bg-slate-700 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded mr-2 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            {/* Summary Dashboard */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg shadow-blue-900/20 border border-blue-500/30 flex items-center justify-between">
                   <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Total Requests</p>
                      <h3 className="text-3xl font-bold text-white">{formatNumber(logs.length)}</h3>
                      <p className="text-blue-200/60 text-xs mt-1">Filtered records</p>
                   </div>
                   <div className="bg-white/10 p-3 rounded-xl">
                      <FileText className="w-8 h-8 text-white" />
                   </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 shadow-lg shadow-emerald-900/20 border border-emerald-500/30 flex items-center justify-between">
                   <div>
                      <p className="text-emerald-100 text-sm font-medium mb-1">Total Revenue (Estimated)</p>
                      <h3 className="text-3xl font-bold text-white">{formatCurrency(logs.length * sysConfig.pricePerRequest)}</h3>
                      <p className="text-emerald-200/60 text-xs mt-1">@ {formatCurrency(sysConfig.pricePerRequest)} / request</p>
                   </div>
                    <div className="bg-white/10 p-3 rounded-xl">
                      <DollarSign className="w-8 h-8 text-white" />
                   </div>
                </div>
             </div>

            {/* Filter Bar */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex flex-wrap gap-4 items-end shadow-lg">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">Filter by User</label>
                <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
                  <option value="">All Users</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
                </select>
              </div>
              <button onClick={handleFilterLogs} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                <Search className="w-4 h-4" /> Filter Logs
              </button>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Timestamp</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Original Filename</th>
                    <th className="px-6 py-4 font-medium">New Filename</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No logs found matching your criteria</td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-white">{log.username}</td>
                      <td className="px-6 py-4 text-slate-400 truncate max-w-xs" title={log.originalName}>{log.originalName}</td>
                      <td className="px-6 py-4 text-green-400 font-mono truncate max-w-xs font-semibold" title={log.newName}>{log.newName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
           <div className="space-y-6">
             {/* Price Config and Google Photos Status - Side by Side */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Price Configuration */}
               <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                     <DollarSign className="w-6 h-6 text-orange-500" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-white">Price Configuration</h2>
                     <p className="text-slate-400 text-xs">Global pricing settings</p>
                   </div>
                 </div>

                 <form onSubmit={handleSaveConfig} className="space-y-6">
                   <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Price Per Request (VND)</label>
                      <div className="relative">
                         <Calculator className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                         <input 
                           type="number" 
                           min="0"
                           step="100"
                           value={editingConfig} 
                           onChange={(e) => setEditingConfig(parseInt(e.target.value) || 0)} 
                           className="w-full bg-slate-900 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                         />
                         <div className="absolute right-3 top-2.5 text-slate-500 text-sm font-medium">VND</div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Used to calculate total cost in reports.</p>
                   </div>

                   <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all">
                      Save Price Config
                   </button>
                 </form>
               </div>
             </div>
           </div>
        )}
      </main>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {editingUser.id ? <Edit2 className="w-5 h-5 text-blue-400"/> : <Plus className="w-5 h-5 text-green-400"/>}
              {editingUser.id ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Username</label>
                  <input required value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Role</label>
                   <select value={editingUser.role || UserRole.USER} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                     <option value={UserRole.USER}>User</option>
                     <option value={UserRole.ADMIN}>Admin</option>
                   </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Email</label>
                <input type="email" required value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              
               <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Phone Number</label>
                <input value={editingUser.phoneNumber || ''} onChange={e => setEditingUser({...editingUser, phoneNumber: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Password {editingUser.id && '(Leave blank to keep current)'}</label>
                <input type="password" required={!editingUser.id} value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="******" />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDashboard;