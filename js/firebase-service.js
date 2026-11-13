import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
const firebaseConfig = { apiKey: "AIzaSyBKkPZK2P45gU7iZZ9Qb8LmoGgq0rSpeZs", authDomain: "inspecaofire-2b4bd.firebaseapp.com", projectId: "inspecaofire-2b4bd", storageBucket: "inspecaofire-2b4bd.firebasestorage.app", messagingSenderId: "121153338311", appId: "1:121153338311:web:3ffbfe3064356b5b4b77e2" };
const nomeDoBanco = 'inspecaofire-db'; 
 try {
 const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app);
 window.allEquipamentosNuvem = []; window.allInspecoesNuvem = []; window.allOsNuvem = []; window.allUnidadesNuvem = []; window.allUsuariosNuvem = []; window.firebaseUser = null;
 async function initCloud() { try { await signInAnonymously(auth); window.firebaseUser = auth.currentUser; if (window.firebaseUser) { onSnapshot(collection(db, nomeDoBanco, 'public', 'equipamentos'), (s) => { window.allEquipamentosNuvem = []; s.forEach(d => window.allEquipamentosNuvem.push(d.data())); if(window.atualizarVisaoDaEquipe) window.atualizarVisaoDaEquipe(); }); onSnapshot(collection(db, nomeDoBanco, 'public', 'inspecoes'), (s) => { window.allInspecoesNuvem = []; s.forEach(d => window.allInspecoesNuvem.push(d.data())); if(window.atualizarVisaoDaEquipe) window.atualizarVisaoDaEquipe(); }); onSnapshot(collection(db, nomeDoBanco, 'public', 'ordens_servico'), (s) => { window.allOsNuvem = []; s.forEach(d => window.allOsNuvem.push(d.data())); if(window.atualizarVisaoDaEquipe) window.atualizarVisaoDaEquipe(); }); onSnapshot(collection(db, nomeDoBanco, 'public', 'usuarios'), (s) => { window.allUsuariosNuvem = []; s.forEach(d => window.allUsuariosNuvem.push(d.data())); if(window.renderizarUsuarios) window.renderizarUsuarios(); if(window.verificarSituacaoUsuarioLogado) window.verificarSituacaoUsuarioLogado(); }); } flushFilaOffline(); } catch (e) { console.error(e); } }
 const caminho = (c,id) => doc(db, nomeDoBanco, 'public', c, id);
 const podeEnfileirar = (e) => !e || /unavailable|deadline-exceeded|network-request-failed/i.test(e.code||'');
 function guardarPendente(item) {
   const fila = window.obterFilaOffline ? window.obterFilaOffline() : JSON.parse(localStorage.getItem('firesys_offline_queue') || '[]');
   const nova = [...fila.filter(x => !(x.col===item.col && x.id===item.id)), item];
   try { localStorage.setItem('firesys_offline_queue', JSON.stringify(nova)); }
   catch(e) { throw new Error('Armazenamento offline cheio. Não foi possível salvar este registro; reduza as fotos ou reconecte.'); }
   if (window.atualizarFilaOffline) window.atualizarFilaOffline(nova);
   if (window.updateSyncStatus) window.updateSyncStatus();
 }
 window.salvarNoFirebaseDireto = async function(c,id,d) { await setDoc(caminho(c,id),d); };
 window.salvarNoFirebase = async function(c,id,d) {
   if (!navigator.onLine || !window.firebaseUser) { guardarPendente({col:c,id,data:d}); return {status:'pendente'}; }
   try { await window.salvarNoFirebaseDireto(c,id,d); return {status:'confirmado'}; }
   catch(e) { if (!podeEnfileirar(e)) throw e; guardarPendente({col:c,id,data:d}); return {status:'pendente'}; }
 };
 window.salvarInspecaoComOS = async function(insp,os) {
   const item={col:'inspecoes',id:insp.idDoc,data:insp,os:os||null};
   if (!navigator.onLine || !window.firebaseUser) { guardarPendente(item); return {status:'pendente'}; }
   try { await window.salvarItemPendenteDireto(item); return {status:'confirmado'}; }
   catch(e) { if (!podeEnfileirar(e)) throw e; guardarPendente(item); return {status:'pendente'}; }
 };
 window.salvarItemPendenteDireto = async function(item) {
   if(item.os) { const batch=writeBatch(db); batch.set(caminho(item.col,item.id),item.data); batch.set(caminho('ordens_servico',item.os.idDoc),item.os); await batch.commit(); }
   else await window.salvarNoFirebaseDireto(item.col,item.id,item.data);
 };
 
 window.deletarNoFirebase = async function(c, id, silent = false) { if(!window.firebaseUser) return; try { await setDoc(doc(db, nomeDoBanco, 'public', c, id), { deleted: true, deletedAt: Date.now() }, { merge: true }); if(!silent) window.showAlert("Movido para a Lixeira de Segurança!", false, "Sucesso"); } catch(e) { if(!silent) window.showAlert("Erro: " + e.message, true); } };
 window.restaurarDaLixeiraNuvem = async function(c, id) { if(!window.firebaseUser) return; try { await setDoc(doc(db, nomeDoBanco, 'public', c, id), { deleted: false, deletedAt: null }, { merge: true }); window.showAlert("Item Restaurado com Sucesso!", false); } catch(e) { window.showAlert("Erro: " + e.message, true); } };
 window.excluirDefinitivoDoFirebase = async function(c, id) { if(!window.firebaseUser) return; try { await deleteDoc(doc(db, nomeDoBanco, 'public', c, id)); } catch(e) { console.error(e); } };

 initCloud();
} catch (e) {}
