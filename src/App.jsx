import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, Minus, History, User, ChevronRight, X, Wallet, 
  ArrowUpRight, ArrowDownLeft, Bell, Eye, EyeOff, 
  ShieldCheck, CheckCircle2, Clock, LogOut, Lock, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalNotifications } from '@capacitor/local-notifications';

// --- Konfigurasi Axios ---
const api = axios.create({
  baseURL: 'https://tabungan-backend.vercel.app/api',
});

// Interceptor untuk menyisipkan token secara otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => Promise.reject(error));

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
  const lastTxIdRef = useRef(null); // Menyimpan ID transaksi terakhir untuk pengecekan notif

  // --- STATE UI ---
  const [view, setView] = useState('home'); 
  const [showBalance, setShowBalance] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showModal, setShowModal] = useState(null); 
  const [formData, setFormData] = useState({ amount: '', note: '' });

  // --- FUNGSI NOTIFIKASI NATIVE ---
  const requestNotificationPermission = async () => {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  };

  const triggerNativeNotification = async (notifData) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notifData.type === 'plus' ? "Uang Masuk! 💰" : "Uang Keluar! 💸",
            body: getNotifMessage(notifData),
            id: Date.now(), 
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } catch (err) {
      console.error("Gagal mengirim notifikasi native", err);
    }
  };

  const getNotifMessage = (notif) => {
    const action = notif.type === 'plus' ? 'menambahkan' : 'menarik';
    const amountStr = `Rp ${parseInt(notif.amount).toLocaleString('id-ID')}`;
    return notif.sender === currentUser 
      ? `Anda telah ${action} ${amountStr}` 
      : `${notif.sender} telah ${action} ${amountStr}`;
  };

  // --- FETCH DATA ---
  const fetchData = useCallback(async (isInitialFetch = false) => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get('/ledger/data');
      const { balance: newBalance, transactions: newTransactions } = res.data;
      
      setBalance(newBalance);
      setTransactions(newTransactions);

      if (newTransactions.length > 0) {
        const latestTx = newTransactions[0];

        // LOGIKA NOTIFIKASI: 
        // Jika ID berbeda dari ID terakhir DAN bukan fetch pertama kali (cegah spam notif saat baru buka app)
        if (!isInitialFetch && lastTxIdRef.current && latestTx._id !== lastTxIdRef.current) {
          // Hanya trigger jika sender bukan kita (karena kita sudah trigger manual di handleSubmit)
          if (latestTx.user !== currentUser) {
            triggerNativeNotification({
              sender: latestTx.user,
              amount: latestTx.amount,
              type: latestTx.type
            });
          }
        }
        lastTxIdRef.current = latestTx._id;
      }

      setNotifications(newTransactions.slice(0, 5).map(tx => ({
        id: tx._id,
        sender: tx.user,
        amount: tx.amount,
        type: tx.type,
        time: new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      })));
    } catch (err) {
      console.error("Gagal sinkron data");
      if (err.response?.status === 401) handleLogout();
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    if (isLoggedIn) {
      requestNotificationPermission();
      fetchData(true); // Initial fetch
      const timer = setTimeout(() => setIsAppReady(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, fetchData]);

  useEffect(() => {
    if (isLoggedIn && isAppReady) {
      const interval = setInterval(() => fetchData(false), 15000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, isAppReady, fetchData]);

  // --- HANDLERS ---
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
    const amountVal = parseInt(formData.amount);
    const typeVal = showModal === 'nabung' ? 'plus' : 'minus';

    try {
      await api.post('/ledger/add', {
        type: typeVal,
        amount: amountVal,
        note: formData.note || (showModal === 'nabung' ? 'Setoran' : 'Penarikan'),
        user: currentUser
      });

      // NOTIFIKASI INSTAN UNTUK DIRI SENDIRI
      triggerNativeNotification({
        sender: currentUser,
        amount: amountVal,
        type: typeVal
      });

      fetchData(false);
      setFormData({ amount: '', note: '' });
      setShowModal(null);
    } catch (err) {
      alert("Gagal transaksi");
    }
  };

  // --- UI RENDER (Splash Screen, Login, Dashboard) ---
  if (isLoggedIn && !isAppReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute w-80 h-80 bg-indigo-600 rounded-full blur-[100px]" />
        <div className="relative z-10 text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-2">Syncing Data</h2>
          <h1 className="text-white text-4xl font-black tracking-widest">WELCOME</h1>
          <p className="text-white/40 text-[10px] mt-4 font-bold uppercase">{currentUser}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-lg"><Wallet size={30} /></div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{isRegister ? 'Buat Akun' : 'Selamat Datang'}</h2>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && <input type="text" placeholder="NAMA LENGKAP" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none border border-transparent focus:border-indigo-600" onChange={(e) => setAuthData({...authData, name: e.target.value})} required />}
            <input type="email" placeholder="EMAIL" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none border border-transparent focus:border-indigo-600" onChange={(e) => setAuthData({...authData, email: e.target.value})} required />
            <input type="password" placeholder="PASSWORD" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none border border-transparent focus:border-indigo-600" onChange={(e) => setAuthData({...authData, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">
              {isRegister ? 'Daftar' : 'Masuk'}
            </button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Header */}
      <div className="bg-indigo-700 px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 text-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><User size={20} /></div>
            <h1 className="text-sm font-black uppercase">{currentUser}</h1>
          </div>
          <button onClick={() => setShowNotifications(true)} className="p-2.5 bg-white/10 rounded-xl active:scale-90"><Bell size={20} /></button>
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
            <ShieldCheck size={12} className="text-emerald-400" /> Secure Ledger
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
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Minus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Tarik</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="px-6 mt-10">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest mb-5">Riwayat Transaksi</h3>
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
              <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black uppercase">{currentUser.charAt(0)}</div>
                <h2 className="text-xl font-black text-slate-900 uppercase">{currentUser}</h2>
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

      {/* MODAL NOTIFIKASI */}
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

      {/* MODAL INPUT */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full bg-white rounded-t-[3.5rem] p-10 max-w-lg shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-widest mb-10 text-slate-900">{showModal === 'nabung' ? 'Tambah Tabungan' : 'Tarik Saldo'}</h3>
              <form onSubmit={handleSubmitTransaction} className="space-y-10">
                <input type="number" placeholder="Rp 0" className="w-full py-4 text-4xl font-black border-b-4 border-slate-100 focus:border-indigo-600 outline-none text-slate-900" onChange={(e) => setFormData({...formData, amount: e.target.value})} autoFocus />
                <input type="text" placeholder="Catatan (opsional)" className="w-full py-2 border-b text-sm font-bold outline-none border-slate-100 focus:border-indigo-600 text-slate-900" onChange={(e) => setFormData({...formData, note: e.target.value})} />
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