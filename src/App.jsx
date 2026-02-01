import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Minus, History, User, ChevronRight, X, Wallet, 
  ArrowUpRight, ArrowDownLeft, Bell, Eye, EyeOff, 
  ShieldCheck, CheckCircle2, Clock, LogOut, Lock, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Konfigurasi Axios Dasar
const api = axios.create({
  baseURL: 'https://mollusklike-intactly-kennedi.ngrok-free.dev/api',
  headers: { 'ngrok-skip-browser-warning': 'true' }
});

const App = () => {
  // --- STATE UTAMA ---
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('userName') || '');
  const [isAppReady, setIsAppReady] = useState(false); 
  const [authData, setAuthData] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);

  // --- STATE DATA ---
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // --- STATE UI ---
  const [view, setView] = useState('home'); 
  const [showBalance, setShowBalance] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModal, setShowModal] = useState(null); 
  const [formData, setFormData] = useState({ amount: '', note: '' });

  const fetchData = async () => {
    if (!isLoggedIn) return;
    try {
      const config = { headers: { 'x-auth-token': localStorage.getItem('token') } };
      const res = await api.get('/ledger/data', config);
      setBalance(res.data.balance);
      setTransactions(res.data.transactions);
      
      const newNotifs = res.data.transactions.slice(0, 5).map(tx => ({
        id: tx._id,
        sender: tx.user,
        amount: tx.amount,
        type: tx.type,
        time: new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }));
      setNotifications(newNotifs);
    } catch (err) {
      console.error("Gagal sinkron");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const timer = setTimeout(() => setIsAppReady(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && isAppReady) {
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, isAppReady]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    try {
      const res = await api.post(endpoint, authData);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        setCurrentUser(res.data.user.name);
        setIsLoggedIn(true);
        setIsAppReady(false); 
      } else {
        alert("Berhasil Daftar!");
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Gagal masuk");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setIsAppReady(false);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    try {
      await api.post('/ledger/add', {
        type: showModal === 'nabung' ? 'plus' : 'minus',
        amount: parseInt(formData.amount),
        note: formData.note || (showModal === 'nabung' ? 'Setoran' : 'Penarikan'),
        user: currentUser
      }, { headers: { 'x-auth-token': localStorage.getItem('token') } });
      fetchData();
      setFormData({ amount: '', note: '' });
      setShowModal(null);
    } catch (err) {
      alert("Gagal transaksi");
    }
  };

  const getNotifMessage = (notif) => {
    const action = notif.type === 'plus' ? 'menambahkan' : 'menarik';
    const amountStr = `Rp ${notif.amount.toLocaleString('id-ID')}`;
    return notif.sender === currentUser 
      ? `Anda telah ${action} ${amountStr}` 
      : `${notif.sender} telah ${action} ${amountStr}`;
  };

  // --- 1. WELCOME SCREEN ---
  if (isLoggedIn && !isAppReady) {
    return (
     <div className="min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden relative">
        {/* Lingkaran Biru Melingkar (Glow Effect) */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[300px] h-[300px] bg-indigo-600 rounded-full blur-[100px]"
        />
        
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-2">Authorized Access</h2>
            <motion.h1 
              initial={{ letterSpacing: "0.2em", opacity: 0 }}
              animate={{ letterSpacing: "0.5em", opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="text-white text-4xl font-black uppercase"
            >
              WELCOME
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 1.2 }}
              className="text-white text-[10px] font-bold mt-4 uppercase tracking-widest"
            >
              {currentUser}
            </motion.p>
          </motion.div>
          
          {/* Animated Ring */}
          <svg className="w-20 h-20 mx-auto mt-10" viewBox="0 0 100 100">
            <motion.circle
              cx="50" cy="50" r="40"
              stroke="#4f46e5" strokeWidth="4" fill="transparent"
              initial={{ pathLength: 0, rotate: 0 }}
              animate={{ pathLength: 1, rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>
      </div>
    );
  }

  // --- 2. LOGIN VIEW ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10">
          <div className="text-center mb-10 text-slate-900">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white"><Wallet size={30} /></div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Selamat Datang</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Sistem Tabungan Bersama</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && <input type="text" placeholder="NAMA LENGKAP" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, name: e.target.value})} required />}
            <input type="email" placeholder="EMAIL" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, email: e.target.value})} required />
            <input type="password" placeholder="PASSWORD" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-xl">Masuk</button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}</button>
        </motion.div>
      </div>
    );
  }

  // --- 3. DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28">
      {/* Header */}
      <div className="bg-indigo-700 px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10 text-white font-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><User size={20} /></div>
            <h1 className="text-sm uppercase">{currentUser}</h1>
          </div>
          <button onClick={() => setShowNotifications(true)} className="p-2.5 bg-white/10 rounded-xl"><Bell size={20} /></button>
        </div>

        {/* Card Saldo */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative z-10 border border-white/5">
          <div className="flex justify-between items-center mb-4 opacity-50 text-[9px] font-bold uppercase tracking-widest">
            <span>Saldo Bersama</span>
            <button onClick={() => setShowBalance(!showBalance)}>{showBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          </div>
          <div className="flex items-center gap-3 mb-8">
             <span className="text-indigo-400 text-xl font-bold italic">IDR</span>
             <h2 className="text-4xl font-black tracking-tighter">{showBalance ? balance.toLocaleString('id-ID') : "••••••••"}</h2>
          </div>
          <div className="flex items-center gap-2 opacity-80 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} className="text-emerald-400" /> Protected Ledger
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-10 -mt-7 relative z-20 grid grid-cols-2 gap-4">
        <button onClick={() => setShowModal('nabung')} className="bg-white p-6 rounded-[2.2rem] shadow-xl flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Plus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Nabung</span>
        </button>
        <button onClick={() => setShowModal('tarik')} className="bg-white p-6 rounded-[2.2rem] shadow-xl flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center"><Minus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Tarik</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-10">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] mb-5">Riwayat Transaksi</h3>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx._id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 text-slate-800">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tx.type === 'plus' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.type === 'plus' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight">{tx.note}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.user} • {new Date(tx.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${tx.type === 'plus' ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.type === 'plus' ? '+' : '-'} {tx.amount.toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="profile" className="text-center space-y-6">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 font-black uppercase">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] mx-auto mb-4 flex items-center justify-center text-white text-3xl">{currentUser.charAt(0)}</div>
                <h2 className="text-xl text-slate-900">{currentUser}</h2>
              </div>
              <button onClick={handleLogout} className="w-full bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[10px] uppercase shadow-xl"><LogOut size={18} /> Logout</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Bawah */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[60%] bg-slate-950 h-16 rounded-[2rem] shadow-2xl flex items-center justify-around px-2 z-40 border border-white/5">
        <button onClick={() => setView('home')} className={view === 'home' ? 'text-white' : 'text-slate-600'}><History size={22} /></button>
        <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-white' : 'text-slate-600'}><User size={22} /></button>
      </div>

      {/* --- MODAL NOTIFIKASI --- */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 bg-[#F8FAFC] z-[100] flex flex-col">
            <div className="bg-white px-6 pt-12 pb-6 border-b flex items-center gap-3">
              <button onClick={() => setShowNotifications(false)} className="p-2 bg-slate-50 rounded-xl"><ChevronRight className="rotate-180" size={20} /></button>
              <h2 className="text-lg font-black uppercase tracking-widest text-slate-900">Aktivitas</h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 flex items-start gap-4 shadow-sm text-slate-800">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'plus' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><CheckCircle2 size={20} /></div>
                  <div className="flex-1">
                    <p className="text-xs font-black">{getNotifMessage(notif)}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-slate-400 text-[9px] font-bold uppercase"><Clock size={10} /> {notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL INPUT TRANSAKSI --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full bg-white rounded-t-[3.5rem] p-10 max-w-lg shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-widest mb-10 text-slate-900">{showModal === 'nabung' ? 'Tambah' : 'Tarik'}</h3>
              <form onSubmit={handleSubmitTransaction} className="space-y-10">
                <input type="number" placeholder="Rp 0" className="w-full py-4 text-4xl font-black border-b-4 border-slate-100 focus:border-indigo-600 outline-none transition-all text-slate-900" onChange={(e) => setFormData({...formData, amount: e.target.value})} autoFocus />
                <input type="text" placeholder="Catatan" className="w-full py-2 border-b text-sm font-bold outline-none border-slate-100 focus:border-indigo-600 text-slate-900" onChange={(e) => setFormData({...formData, note: e.target.value})} />
                <button type="submit" className={`w-full p-6 rounded-[2rem] text-white font-black text-xs uppercase tracking-widest ${showModal === 'nabung' ? 'bg-indigo-600' : 'bg-slate-900'}`}>Konfirmasi</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;