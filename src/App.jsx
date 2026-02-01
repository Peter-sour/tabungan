import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  History, 
  User, 
  ChevronRight,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Eye, 
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  // Simulasi User Aktif
  const currentUser = "Lavirix";
  const partnerName = "Si A"; 

  // State Utama
  const [balance, setBalance] = useState(12500000);
  const [showBalance, setShowBalance] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // State Notifikasi
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      sender: partnerName, 
      amount: 500000, 
      type: 'plus', 
      time: '1 jam yang lalu', 
      read: false 
    },
    { 
      id: 2, 
      sender: "Lavirix", 
      amount: 1000000, 
      type: 'plus', 
      time: '3 jam yang lalu', 
      read: true 
    },
  ]);

  const [transactions, setTransactions] = useState([
    { id: 1, type: 'plus', amount: 2500000, note: 'Transfer Masuk - Project A', user: 'Lavirix', date: '31 Jan 2026' },
    { id: 2, type: 'plus', amount: 500000, note: 'Top Up - Saldo Kas', user: partnerName, date: '28 Jan 2026' },
    { id: 3, type: 'minus', amount: 120000, note: 'Biaya Server Ledger', user: 'System', date: '25 Jan 2026' },
  ]);

  // State UI
  const [view, setView] = useState('home'); 
  const [showModal, setShowModal] = useState(null); 
  const [formData, setFormData] = useState({ amount: '', note: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    const amountNum = parseInt(formData.amount);
    const newTx = {
      id: Date.now(),
      type: showModal === 'nabung' ? 'plus' : 'minus',
      amount: amountNum,
      note: formData.note || (showModal === 'nabung' ? 'Setoran Dana' : 'Penarikan Dana'),
      user: currentUser, 
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const newNotif = {
      id: `notif-${Date.now()}`,
      sender: currentUser,
      amount: amountNum,
      type: showModal === 'nabung' ? 'plus' : 'minus',
      time: 'Baru saja',
      read: false
    };

    setNotifications([newNotif, ...notifications]);
    setTransactions([newTx, ...transactions]);
    setBalance(prev => showModal === 'nabung' ? prev + amountNum : prev - amountNum);
    setFormData({ amount: '', note: '' });
    setShowModal(null);
  };

  const getNotifMessage = (notif) => {
    const action = notif.type === 'plus' ? 'menambahkan' : 'menarik';
    const amountStr = `Rp ${notif.amount.toLocaleString('id-ID')}`;
    
    if (notif.sender === currentUser) {
      return `Anda telah ${action} ${amountStr} ke tabungan`;
    }
    return `${notif.sender} telah ${action} ${amountStr} ke tabungan`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-28">
      {/* Header Section */}
      <div className="bg-indigo-700 px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/10">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-tight">{currentUser}</h1>
            </div>
          </div>
          
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 bg-white/10 rounded-xl text-white border border-white/5 active:scale-90 transition-all"
          >
            <Bell size={20} />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-700"></span>
            )}
          </button>
        </div>

        {/* Card Display */}
        <div className="relative z-10 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 opacity-50">
                <Wallet size={12} />
                <span className="text-[9px] font-bold uppercase tracking-[0.25em]">Saldo Rekening Bersama</span>
              </div>
              <button onClick={() => setShowBalance(!showBalance)} className="text-white/40 p-1 active:scale-90 transition-transform">
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-8">
               <span className="text-indigo-400 text-xl font-bold italic tracking-tighter">IDR</span>
               <h2 className="text-4xl font-black tracking-tighter">
                {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
              </h2>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] uppercase tracking-widest opacity-30 font-bold mb-1 text-white">Account Status</p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <p className="text-[10px] font-black tracking-widest opacity-80 uppercase">Verified Ledger</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/80 backdrop-blur-sm border border-white/10 shadow-lg"></div>
                <div className="w-8 h-8 rounded-full bg-slate-700/80 backdrop-blur-sm border border-white/10 shadow-lg"></div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16 opacity-20"></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-10 -mt-7 relative z-20 grid grid-cols-2 gap-4">
        <button onClick={() => setShowModal('nabung')} className="bg-white p-5 rounded-[2.2rem] shadow-xl border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Plus size={24} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Tabung</span>
        </button>
        <button onClick={() => setShowModal('tarik')} className="bg-white p-5 rounded-[2.2rem] shadow-xl border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
            <Minus size={24} strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ambil</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="px-6 mt-10">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex justify-between items-center mb-5 px-1">
                <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em]">Transaksi Terakhir</h3>
                <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">Lihat Semua</button>
              </div>
              
              <div className="space-y-3">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 shadow-sm transition-transform active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tx.type === 'plus' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                        {tx.type === 'plus' ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{tx.note}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tx.user} • {tx.date}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm tracking-tighter ${tx.type === 'plus' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'plus' ? '+' : '-'} {tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <div className="w-full h-full bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white border-4 border-white shadow-2xl overflow-hidden">
                    <span className="text-3xl font-black tracking-tighter">LX</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                {/* Hanya Nama Lavirix */}
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{currentUser}</h2>
              </div>

              {/* Logout Button Only */}
              <button className="w-full bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl">
                <LogOut size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout System</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[60%] bg-slate-950 h-16 rounded-[2rem] shadow-2xl flex items-center justify-around px-2 z-40 border border-white/5">
        <button onClick={() => setView('home')} className={`flex-1 flex justify-center py-2 transition-all duration-300 ${view === 'home' ? 'text-white' : 'text-slate-600'}`}>
          <History size={22} strokeWidth={view === 'home' ? 3 : 2} />
        </button>
        <button onClick={() => setView('profile')} className={`flex-1 flex justify-center py-2 transition-all duration-300 ${view === 'profile' ? 'text-white' : 'text-slate-600'}`}>
          <User size={22} strokeWidth={view === 'profile' ? 3 : 2} />
        </button>
      </div>

      {/* HALAMAN NOTIFIKASI */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#F8FAFC] z-[100] flex flex-col"
          >
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => {
                  setShowNotifications(false);
                  setNotifications(notifications.map(n => ({...n, read: true})));
                }} className="p-2 bg-slate-50 rounded-xl active:bg-slate-200 transition-colors">
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-lg font-black uppercase tracking-widest">Notifikasi</h2>
              </div>
              <button 
                onClick={() => setNotifications([])}
                className="text-[10px] font-black text-rose-500 uppercase tracking-widest"
              >
                Clear All
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-5 rounded-[2.2rem] border transition-all ${notif.read ? 'bg-white border-slate-100' : 'bg-indigo-50 border-indigo-100 shadow-sm'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'plus' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {notif.type === 'plus' ? <CheckCircle2 size={20} /> : <ArrowDownLeft size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 leading-relaxed">
                        {getNotifMessage(notif)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{notif.time}</span>
                      </div>
                    </div>
                    {!notif.read && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full mt-2 shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse"></div>}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                  <Bell size={48} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Recent Activity</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INPUT SALDO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-[3.5rem] p-10 max-w-lg shadow-2xl"
            >
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black uppercase tracking-[0.2em]">
                  {showModal === 'nabung' ? 'Tambah Saldo' : 'Ambil Saldo'}
                </h3>
                <button onClick={() => setShowModal(null)} className="p-3 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-10">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Nominal Value (IDR)</label>
                  <div className="relative border-b-4 border-slate-100 focus-within:border-indigo-600 transition-all duration-300">
                    <span className="absolute left-0 bottom-4 text-slate-300 text-3xl font-black">Rp</span>
                    <input 
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-transparent py-4 pl-12 text-4xl font-black outline-none"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" className={`w-full p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-white ${showModal === 'nabung' ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                  Confirm Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;