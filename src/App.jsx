import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Minus, History, User, ChevronRight, X, Wallet, 
  ArrowUpRight, ArrowDownLeft, Bell, Eye, EyeOff, 
  ShieldCheck, CheckCircle2, Clock, LogOut, Lock, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  // --- STATE AUTH & NAVIGASI ---
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('userName') || '');
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

  // --- AMBIL DATA DARI BACKEND ---
  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/ledger/data');
      setBalance(res.data.balance);
      setTransactions(res.data.transactions);
      
      // Buat Notifikasi otomatis dari 5 transaksi terakhir
      const newNotifs = res.data.transactions.slice(0, 5).map(tx => ({
        id: tx._id,
        sender: tx.user,
        amount: tx.amount,
        type: tx.type,
        time: new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        dateRaw: tx.date
      }));
      setNotifications(newNotifs);
    } catch (err) {
      console.error("Koneksi ke server gagal");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // Auto-sync setiap 10 detik
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // --- LOGIKA AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, authData);
      if (!isRegister) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        setCurrentUser(res.data.user.name);
        setIsLoggedIn(true);
      } else {
        alert("Berhasil Daftar! Silakan Login.");
        setIsRegister(false);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Terjadi kesalahan");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
  };

  // --- LOGIKA TRANSAKSI ---
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    try {
      await axios.post('http://localhost:5000/api/ledger/add', {
        type: showModal === 'nabung' ? 'plus' : 'minus',
        amount: parseInt(formData.amount),
        note: formData.note || (showModal === 'nabung' ? 'Setoran' : 'Penarikan'),
        user: currentUser
      });
      fetchData();
      setFormData({ amount: '', note: '' });
      setShowModal(null);
    } catch (err) {
      alert("Gagal memproses transaksi");
    }
  };

  const getNotifMessage = (notif) => {
    const action = notif.type === 'plus' ? 'menambahkan' : 'menarik';
    const amountStr = `Rp ${notif.amount.toLocaleString('id-ID')}`;
    return notif.sender === currentUser 
      ? `Anda telah ${action} ${amountStr}` 
      : `${notif.sender} telah ${action} ${amountStr}`;
  };

  // --- TAMPILAN LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white">
              <Wallet size={30} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">
              {isRegister ? 'Buat Akun' : 'Selamat Datang'}
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase mt-2 tracking-widest">Sistem Tabungan Bersama</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input type="text" placeholder="NAMA LENGKAP" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, name: e.target.value})} required />
            )}
            <input type="email" placeholder="EMAIL" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, email: e.target.value})} required />
            <input type="password" placeholder="PASSWORD" className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-black outline-none" onChange={(e) => setAuthData({...authData, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-200">
              {isRegister ? 'Daftar' : 'Masuk'}
            </button>
          </form>
          <button onClick={() => setIsRegister(!isRegister)} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- TAMPILAN UTAMA ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-28">
      {/* Header */}
      <div className="bg-indigo-700 px-6 pt-12 pb-20 rounded-b-[3.5rem] shadow-xl relative">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white"><User size={20} /></div>
            <h1 className="text-sm font-black text-white uppercase tracking-tight">{currentUser}</h1>
          </div>
          <button onClick={() => setShowNotifications(true)} className="relative p-2.5 bg-white/10 rounded-xl text-white">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-indigo-700"></span>
          </button>
        </div>

        {/* Card Saldo */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative z-10 overflow-hidden border border-white/5">
          <div className="flex justify-between items-center mb-4 opacity-50">
            <span className="text-[9px] font-bold uppercase tracking-widest">Total Saldo Bersama</span>
            <button onClick={() => setShowBalance(!showBalance)}>{showBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          </div>
          <div className="flex items-center gap-3 mb-8">
             <span className="text-indigo-400 text-xl font-bold italic">IDR</span>
             <h2 className="text-4xl font-black tracking-tighter">{showBalance ? balance.toLocaleString('id-ID') : "••••••••"}</h2>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Protected Ledger</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-10 -mt-7 relative z-20 grid grid-cols-2 gap-4">
        <button onClick={() => setShowModal('nabung')} className="bg-white p-6 rounded-[2.2rem] shadow-xl flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Plus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Nabung</span>
        </button>
        <button onClick={() => setShowModal('tarik')} className="bg-white p-6 rounded-[2.2rem] shadow-xl flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center"><Minus size={24} /></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Tarik</span>
        </button>
      </div>

      {/* List Transaksi */}
      <div className="px-6 mt-10">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] mb-5 px-1">Riwayat Transaksi</h3>
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx._id} className="bg-white p-5 rounded-[2rem] flex items-center justify-between border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tx.type === 'plus' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.type === 'plus' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{tx.note}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{tx.user} • {new Date(tx.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <p className={`font-black text-sm ${tx.type === 'plus' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'plus' ? '+' : '-'} {tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black">
                  {currentUser.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-black uppercase text-slate-900">{currentUser}</h2>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Verified Member</p>
              </div>
              <button onClick={handleLogout} className="w-full bg-slate-900 text-white p-6 rounded-[2rem] flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200">
                <LogOut size={18} /> Logout System
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigasi Bawah */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[60%] bg-slate-950 h-16 rounded-[2rem] shadow-2xl flex items-center justify-around px-2 z-40 border border-white/5">
        <button onClick={() => setView('home')} className={view === 'home' ? 'text-white' : 'text-slate-600'}><History size={22} /></button>
        <button onClick={() => setView('profile')} className={view === 'profile' ? 'text-white' : 'text-slate-600'}><User size={22} /></button>
      </div>

      {/* Overlay Notifikasi */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed inset-0 bg-[#F8FAFC] z-[100] flex flex-col">
            <div className="bg-white px-6 pt-12 pb-6 border-b flex items-center gap-3">
              <button onClick={() => setShowNotifications(false)} className="p-2 bg-slate-50 rounded-xl"><ChevronRight className="rotate-180" size={20} /></button>
              <h2 className="text-lg font-black uppercase tracking-widest">Aktivitas Terbaru</h2>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 flex items-start gap-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'plus' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 leading-relaxed">{getNotifMessage(notif)}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest"><Clock size={10} /> {notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Input Saldo */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full bg-white rounded-t-[3.5rem] p-10 max-w-lg shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-widest mb-10">{showModal === 'nabung' ? 'Tambah Saldo' : 'Tarik Saldo'}</h3>
              <form onSubmit={handleSubmitTransaction} className="space-y-10">
                <input type="number" placeholder="Nominal Rp" className="w-full py-4 text-4xl font-black border-b-4 border-slate-100 focus:border-indigo-600 outline-none transition-all" onChange={(e) => setFormData({...formData, amount: e.target.value})} autoFocus />
                <input type="text" placeholder="Catatan Transaksi" className="w-full py-2 border-b-2 text-sm font-bold outline-none" onChange={(e) => setFormData({...formData, note: e.target.value})} />
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