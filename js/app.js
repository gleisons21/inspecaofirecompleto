const SENHA_ADMIN = "admin123"; 
let currentTeam = localStorage.getItem('firesys_current_team'); 
let currentUser = localStorage.getItem('firesys_current_user');
let filaOffline = (() => { try { const q=JSON.parse(localStorage.getItem('firesys_offline_queue')||'[]'); return Array.isArray(q)?q:[]; } catch { return []; } })();
window.obterFilaOffline = () => filaOffline;
window.atualizarFilaOffline = (nova) => { filaOffline.splice(0, filaOffline.length, ...nova); updateSyncStatus(); };
function escapeHTML(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function mensagemGravacao(r, entidade) { return r?.status === 'confirmado' ? `${entidade} salvo na nuvem.` : `${entidade} registrado localmente; sincronização pendente.`; }


let equipamentos = []; let inspecoes = []; let ordensServico = [];
let lixeiraItens = []; // Array da lixeira
let html5QrcodeScanner = null; 
let frotaMap = null; 
let pendingUserLogin = null;

function normalizarString(str) { if (!str) return ''; return str.toUpperCase().trim(); }
function formatarDataBR(d) { return !d ? '-' : d.split('-').reverse().join('/'); }

function entrarNoSistema() {
    const l = normalizarString(document.getElementById('loginInput').value);
    const p = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('loginErrorMsg');

    // Função interna para mostrar o erro na tela rapidinho
    const mostrarErro = (mensagem) => {
        errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-2"></i> ${mensagem}`;
        errorMsg.classList.remove('hidden');
    };

    // Esconde o erro sempre que tenta logar de novo
    errorMsg.classList.add('hidden');

    if (!l || !p) return mostrarErro("Digite o usuário e a senha!");

    // Acesso Master do Administrador
    if (l === 'ADMIN' && p === SENHA_ADMIN) { 
        localStorage.setItem('firesys_current_user', 'ADMIN');
        localStorage.setItem('firesys_current_team', 'ADMIN');
        localStorage.setItem('firesys_current_login', 'ADMIN');
        playLoginAnimation(checkLogin);
        return;
    } 

    // Acesso dos Fiscais/Usuários na Nuvem
    if (!window.allUsuariosNuvem || window.allUsuariosNuvem.length === 0) {
        return mostrarErro("Conectando ao banco ou nenhum usuário cadastrado...");
    }

    const u = window.allUsuariosNuvem.find(x => normalizarString(x.login) === l && x.senha === p);
    if (!u) return mostrarErro("Usuário ou senha incorretos!");

    if (u.ativo === false || u.bloqueado === true) {
        return mostrarErro(u.bloqueado ? 'Acesso bloqueado. Procure o administrador.' : 'Usuário inativo. Procure o administrador.');
    }

    // Se for o primeiro acesso, trava na tela de criar nova senha
    if (u.primeiroAcesso) {
        window.pendingUserLogin = u;
        document.getElementById('novaSenhaInp').value = '';
        document.getElementById('confirmaNovaSenhaInp').value = '';
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('flex');
        openModal('modalTrocarSenha');
        return;
    }

    // Login normal de usuário
    localStorage.setItem('firesys_current_user', u.nome);
    localStorage.setItem('firesys_current_team', u.unidade);
    localStorage.setItem('firesys_current_login', u.login);
    playLoginAnimation(checkLogin);
}

function playLoginAnimation(cb) {
 const a = document.getElementById('loginAnimation'); const l = document.getElementById('loginScreen'); const f = document.getElementById('animFire'); const e = document.getElementById('animExt'); const s = document.getElementById('animSpray'); const t = document.getElementById('animText');
 l.classList.add('hidden'); l.classList.remove('flex'); a.classList.remove('hidden'); a.classList.add('flex');
 f.style.transform = 'scale(1) translateY(0)'; f.style.opacity = '1'; e.style.transform = 'translateX(50px) scaleX(-1)'; e.style.opacity = '0'; s.style.width = '0px'; s.style.opacity = '0'; s.style.transform = 'translateX(0) scaleY(1)'; t.innerText = "INICIANDO...";
 setTimeout(() => { e.style.transform = 'translateX(-30px) scaleX(-1)'; e.style.opacity = '1'; t.innerText = "COMBATENDO INCÊNDIO..."; }, 600); 
setTimeout(() => { s.style.opacity = '1'; s.style.width = '200px'; s.style.transform = 'translateX(-40px) scaleY(1.2)'; }, 1200); 
setTimeout(() => { f.style.transform = 'scale(0) translateY(80px)'; f.style.opacity = '0'; }, 1350); 
setTimeout(() => { s.style.opacity = '0'; t.innerText = "SISTEMA PRONTO!"; }, 2000); 
setTimeout(() => { a.classList.add('hidden'); a.classList.remove('flex'); cb(); }, 2600);
}

function checkLogin() {
 currentTeam = localStorage.getItem('firesys_current_team');
 currentUser = localStorage.getItem('firesys_current_user');
 if (currentTeam && currentUser) {
 document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('flex'); 
document.getElementById('nomeEquipeSidebar').innerText = currentTeam === 'ADMIN' ? 'ADMIN MASTER' : currentTeam;
 document.getElementById('nomeUserSidebar').innerText = currentUser;
 
const nU = document.getElementById('navUnidades');
const nL = document.getElementById('navLixeira');
const nUsrs = document.getElementById('navUsuarios');
const btnPrintExt = document.getElementById('btnPrintExtAdmin');
const btnPrintMan = document.getElementById('btnPrintManAdmin');
const btnPrintInsp = document.getElementById('btnPrintInspAdmin');
const btnPrintOs = document.getElementById('btnPrintOsAdmin');
const btnLoteExt = document.getElementById('btnLoteExt');
const btnLoteMan = document.getElementById('btnLoteMan');
 
if (currentTeam === 'ADMIN') { 
document.getElementById('dashEquipesContainer').classList.remove('hidden'); 
if(nU) { nU.classList.remove('hidden'); nU.classList.add('block'); }
if(nL) { nL.classList.remove('hidden'); nL.classList.add('block'); }
if(nUsrs) { nUsrs.classList.remove('hidden'); nUsrs.classList.add('block'); }
if(btnPrintExt) btnPrintExt.classList.remove('hidden');
if(btnPrintMan) btnPrintMan.classList.remove('hidden');
if(btnPrintInsp) btnPrintInsp.classList.remove('hidden');
if(btnPrintOs) btnPrintOs.classList.remove('hidden');
 } else { 
document.getElementById('dashEquipesContainer').classList.add('hidden'); 
if(nU) { nU.classList.add('hidden'); nU.classList.remove('block'); } 
if(nL) { nL.classList.add('hidden'); nL.classList.remove('block'); } 
if(nUsrs) { nUsrs.classList.add('hidden'); nUsrs.classList.remove('block'); }
if(btnPrintExt) btnPrintExt.classList.add('hidden');
if(btnPrintMan) btnPrintMan.classList.add('hidden');
if(btnPrintInsp) btnPrintInsp.classList.add('hidden');
if(btnPrintOs) btnPrintOs.classList.add('hidden');
if(btnLoteExt) btnLoteExt.classList.add('hidden');
if(btnLoteMan) btnLoteMan.classList.add('hidden');
}
 if (window.atualizarVisaoDaEquipe) window.atualizarVisaoDaEquipe(); 
} else { document.getElementById('loginScreen').classList.remove('hidden'); document.getElementById('loginScreen').classList.add('flex'); }
}

window.onload = () => { checkLogin(); window.addEventListener('online', flushFilaOffline); window.addEventListener('offline', updateSyncStatus); updateSyncStatus(); };

function sairDoSistema() { document.getElementById('confirmText').innerText = "Deseja realmente sair?"; document.getElementById('btnConfirmarAcao').onclick = () => { localStorage.removeItem('firesys_current_team'); localStorage.removeItem('firesys_current_user'); localStorage.removeItem('firesys_current_login'); location.reload(); }; document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex'); }
function fecharConfirm() { document.getElementById('modalConfirm').classList.add('hidden'); document.getElementById('modalConfirm').classList.remove('flex'); }

window.activeTableView = { ext: null, man: null, insp: null, os: null };

function sortByNumero(a, b) {
    const extrairNumero = (str) => {
        if (!str) return 999999;
        const primeiroBloco = str.toString().trim().split(' ')[0];
        const num = parseInt(primeiroBloco, 10);
        return isNaN(num) ? 999999 : num;
    };
    return extrairNumero(a.numero) - extrairNumero(b.numero);
}

function formatarMotivoText(motivo, categoria) {
    if(!motivo) return '-';
    let formatted = motivo;
    const mapExt = {
        "Item 1 Reprovado": "1. O acesso ao equipamento está desobstruído?",
        "Item 2 Reprovado": "2. A sinalização está correta e visível?",
        "Item 3 Reprovado": "3. O lacre de segurança está intacto?",
        "Item 4 Reprovado": "4. Manômetro na faixa verde (pressurizado)?",
        "Item 5 Reprovado": "5. Mangote/Esguicho sem ressecamento ou danos?",
        "Item 6 Reprovado": "6. Carga e cilindro dentro da validade?"
    };
    const mapMan = {
        "Item 1 Reprovado": "1. O acesso ao abrigo do hidrante está desobstruído?",
        "Item 2 Reprovado": "2. A sinalização (parede e solo) está correta e visível?",
        "Item 3 Reprovado": "3. Mangueiras estão aduchadas corretamente e secas?",
        "Item 4 Reprovado": "4. O esguicho e as chaves Storz estão no abrigo?",
        "Item 5 Reprovado": "5. Registro/válvula sem vazamentos ou oxidação?",
        "Item 6 Reprovado": "6. Mangueiras dentro do prazo de teste hidrostático?"
    };
    let map = categoria === 'mangueira' ? mapMan : mapExt;
    Object.keys(map).forEach(key => { formatted = formatted.replace(new RegExp(key, 'g'), map[key]); });
    if (formatted.includes(', ') && formatted.match(/\d\./) && !formatted.includes('\n')) {
       formatted = formatted.split(', ').map(s => s.trim().startsWith('•') ? s.trim() : '• ' + s.trim()).join('\n');
    }
    return formatted;
}

function renderizarAlertasProativos() {
    const alertDiv = document.getElementById('alertasProativos');
    const h = new Date(); h.setHours(0,0,0,0);
    let alertas = [];

    // Checar vencimentos
    equipamentos.forEach(eq => {
        let title = eq.categoria === 'extintor' ? 'Extintor' : 'Hidrante';
        
        if (eq.dataUltimaRecarga) {
            const parts = eq.dataUltimaRecarga.split('-');
            const dVenc = new Date(parseInt(parts[0]) + 1, parts[1]-1, parts[2]); 
            const diff = Math.ceil((dVenc - h) / (1000 * 60 * 60 * 24));
            if (diff < 0) alertas.push(`🚨 <b>${title} ${eq.numero || 'S/N'} (${eq.unidade})</b>: Recarga Vencida há ${Math.abs(diff)} dias.`);
            else if (diff <= 30) alertas.push(`⚠️ <b>${title} ${eq.numero || 'S/N'} (${eq.unidade})</b>: Recarga Vence em ${diff} dias.`);
        }
        if (eq.dataProxTeste) {
            const parts = eq.dataProxTeste.split('-');
            const dVenc = new Date(parts[0], parts[1]-1, parts[2]); 
            const diff = Math.ceil((dVenc - h) / (1000 * 60 * 60 * 24));
            if (diff < 0) alertas.push(`🚨 <b>${title} ${eq.numero || 'S/N'} (${eq.unidade})</b>: Teste Vencido há ${Math.abs(diff)} dias.`);
            else if (diff <= 30) alertas.push(`⚠️ <b>${title} ${eq.numero || 'S/N'} (${eq.unidade})</b>: Teste Vence em ${diff} dias.`);
        }
    });

    // Checar OS Aberta
    ordensServico.forEach(os => {
        if(os.status === 'Aberta' || os.status === 'Terceirizada') {
            const statusTxt = os.status === 'Aberta' ? 'Pendente' : 'Manutenção Externa';
            alertas.push(`🛠️ <b>O.S. ${os.idDoc.slice(-4)} (${os.unidade})</b>: ${statusTxt} para ${os.numeroEquip || 'equipamento'}.`);
        }
    });

    if (alertas.length > 0) {
        let html = `<h4 class="font-bold text-red-700 mb-2"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Atenção Imediata (${alertas.length} avisos)</h4><ul class="list-disc pl-5 text-sm text-red-900 space-y-1">`;
        alertas.forEach(a => html += `<li>${a}</li>`);
        html += `</ul>`;
        alertDiv.innerHTML = html;
        alertDiv.classList.remove('hidden');
    } else {
        alertDiv.classList.add('hidden');
    }
}

function atualizarTabelas() {
 const extB = document.getElementById('extintoresTableBody'); const manB = document.getElementById('mangueirasTableBody'); 
 const insB = document.getElementById('inspecoesTableBody'); const osB = document.getElementById('osTableBody');
 extB.innerHTML = ''; manB.innerHTML = ''; insB.innerHTML = ''; osB.innerHTML = '';
 
 const extList = equipamentos.filter(e => e.categoria === 'extintor').sort(sortByNumero);
 const manList = equipamentos.filter(e => e.categoria === 'mangueira').sort(sortByNumero);
 const inspList = [...inspecoes].sort((a,b) => b.timestamp - a.timestamp);
 const osList = [...ordensServico].sort((a,b) => b.timestamp - a.timestamp);

 function renderGrouped(tbody, list, renderFn, colspan, prefix) {
     const thead = tbody.previousElementSibling;
     const tableWrapper = tbody.parentElement.parentElement; 
     const btnLote = document.getElementById(`btnLote${prefix === 'ext' ? 'Ext' : 'Man'}`);
     
     let backContainer = document.getElementById(`back_${prefix}`);
     if(!backContainer) {
         backContainer = document.createElement('div');
         backContainer.id = `back_${prefix}`;
         backContainer.className = "mb-4 ml-1"; 
         tableWrapper.parentNode.insertBefore(backContainer, tableWrapper);
     }

     if (currentTeam === 'ADMIN') {
         const activeUnit = window.activeTableView[prefix];
         if (activeUnit) {
             if(thead) { 
                 thead.style.display = ''; 
                 const chkCol = thead.querySelector('.chk-col');
                 if(chkCol) chkCol.classList.remove('hidden'); 
             }
             if(btnLote) btnLote.classList.remove('hidden'); 

             backContainer.innerHTML = `<span class="text-gray-800 font-black text-xl flex items-center mb-2"><i class="fa-solid fa-building text-red-600 mr-2"></i> ${escapeHTML(activeUnit)}</span>`;
             backContainer.style.display = 'block';
             
             const filteredList = list.filter(item => (item.unidade || 'SEM UNIDADE') === activeUnit);
             if (filteredList.length === 0) {
                 tbody.innerHTML = `<tr><td colspan="${colspan}" class="p-4 text-left text-gray-500 font-bold">Nenhum registro encontrado nesta unidade.</td></tr>`;
             } else {
                 filteredList.forEach(item => tbody.appendChild(renderFn(item, true)));
             }
         } else {
             if(thead) thead.style.display = 'none'; 
             if(btnLote) btnLote.classList.add('hidden');
             backContainer.style.display = 'none';
             
             const groups = {};
             list.forEach(item => { const u = item.unidade || 'SEM UNIDADE'; if(!groups[u]) groups[u]=[]; groups[u].push(item); });
             
             if(Object.keys(groups).length === 0) {
                 tbody.innerHTML = `<tr><td colspan="${colspan}" class="p-4 text-left text-gray-500 font-bold">Nenhum registro encontrado no sistema.</td></tr>`;
                 return;
             }
             Object.keys(groups).sort().forEach(unidade => {
                 const trGroup = document.createElement('tr');
                 trGroup.className = "cursor-pointer bg-white hover:bg-gray-50 border-b border-gray-200 transition-colors";
                 trGroup.onclick = () => { window.activeTableView[prefix] = unidade; atualizarTabelas(); };
                 trGroup.innerHTML = `<td colspan="${colspan}" class="p-4 font-bold text-gray-800 uppercase text-left hover:text-red-600 text-base">
                    <div class="flex justify-between items-center">
                        <div><i class="fa-solid fa-building text-red-600 mr-3"></i> ${unidade}</div>
                        <span class="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">${groups[unidade].length} registro(s)</span>
                    </div>
                 </td>`;
                 tbody.appendChild(trGroup);
             });
         }
     } else {
         if(thead) { 
             thead.style.display = ''; 
             const chkCol = thead.querySelector('.chk-col');
             if(chkCol) chkCol.classList.add('hidden'); 
         }
         if(btnLote) btnLote.classList.add('hidden');
         backContainer.style.display = 'none';
         if (list.length === 0) {
             tbody.innerHTML = `<tr><td colspan="${colspan}" class="p-4 text-left text-gray-500 font-bold">Nenhum registro encontrado.</td></tr>`;
         } else {
             list.forEach(item => tbody.appendChild(renderFn(item, false)));
         }
     }
 }

 renderGrouped(extB, extList, renderRowExtintor, 13, 'ext');
 renderGrouped(manB, manList, renderRowMangueira, 12, 'man');
 
 renderGrouped(insB, inspList, (i) => {
     const tr = document.createElement('tr');
     const isReprovado = i.status === 'Reprovado';
     const stBadge = isReprovado ? `<span class="bg-red-100 text-red-800 font-bold px-2 py-1 rounded text-xs"><i class="fa-solid fa-xmark"></i> Reprovado</span>` : `<span class="bg-green-100 text-green-800 font-bold px-2 py-1 rounded text-xs"><i class="fa-solid fa-check"></i> Aprovado</span>`;
     const eq = equipamentos.find(e => e.idDoc === i.equipamento_id);
     const uRecarga = eq ? eq.dataUltimaRecarga : '-';
     tr.innerHTML = `<td class="p-3 border-b text-left">${stBadge}</td><td class="p-3 border-b text-left">${formatarDataBR(i.data)}</td><td class="p-3 border-b font-bold text-left">${escapeHTML(i.unidade || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(i.fiscal || '-')}</td><td class="p-3 border-b font-bold text-left">${escapeHTML(i.numero || '-')}</td><td class="p-3 border-b text-center">${getVencimentoRecargaBadge(uRecarga)}</td><td class="p-3 border-b text-center">${getVencimentoBadge(i.dataProxTeste)}</td><td class="p-3 border-b uppercase text-left">${escapeHTML(i.categoria)}</td><td class="p-3 border-b text-left">${escapeHTML(i.localizacao || '-')}</td><td class="p-3 border-b text-center no-print space-x-2 sticky right-0 bg-white z-10">${gerarBotoesMidia(i)}</td>`;
     return tr;
 }, 10, 'insp');

 renderGrouped(osB, osList, (os) => {
     const tr = document.createElement('tr');
     
     let stBadge = '';
     if(os.status === 'Aberta') stBadge = `<span class="bg-red-500 text-white font-bold px-2 py-1 rounded text-xs">Pendente</span>`;
     else if(os.status === 'Concluída') stBadge = `<span class="bg-green-500 text-white font-bold px-2 py-1 rounded text-xs">Concluída</span>`;
     else if(os.status === 'Terceirizada') stBadge = `<span class="bg-purple-600 text-white font-bold px-2 py-1 rounded text-xs" title="Na Empresa: ${os.terceirizadaNome}">Externa</span>`;

     let acaoBtn = '-';
     if(os.status === 'Aberta' || os.status === 'Terceirizada') {
         acaoBtn = `<button onclick="abrirModalResolverOS('${os.idDoc}')" class="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-green-700 transition"><i class="fa-solid fa-wrench mr-1"></i> Resolver</button>`;
     } else if (os.fotoResolucao) {
         acaoBtn = `<button onclick='abrirGaleria(["${os.fotoResolucao}"])' class="text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 border border-indigo-200 px-2 py-1 rounded shadow-sm transition" title="Ver Evidência da Resolução"><i class="fa-solid fa-camera mr-1"></i> Evidência</button>`;
     }
     if (currentTeam === 'ADMIN') {
         acaoBtn += ` <button onclick="confirmarExclusao('${os.idDoc}', 'ordens_servico')" class="text-red-600 hover:text-red-800 ml-2" title="Excluir O.S."><i class="fa-solid fa-trash text-lg"></i></button>`;
     }
     
     const eq = equipamentos.find(e => e.idDoc === os.equipamento_id);
     const loc = eq ? eq.localizacao : '-';
     const cat = eq ? eq.categoria : 'extintor';
     
     const motivoTexto = formatarMotivoText(os.motivo, cat);
     let motivoHTML = `<div class="text-[11px] leading-tight min-w-[200px] whitespace-pre-wrap max-w-sm text-gray-800">${motivoTexto}</div>`;

     tr.innerHTML = `<td class="p-3 border-b font-bold text-gray-600 text-left">OS-${os.idDoc.slice(-4)}</td>
                     <td class="p-3 border-b text-left">${stBadge}</td>
                     <td class="p-3 border-b text-left">${formatarDataBR(os.dataGeracao)}</td>
                     <td class="p-3 border-b text-left">${os.unidade || '-'}</td>
                     <td class="p-3 border-b font-bold text-left">${os.numeroEquip || '-'}</td>
                     <td class="p-3 border-b text-left">${loc}</td>
                     <td class="p-3 border-b text-red-600 font-semibold text-left">${motivoHTML}</td>
                     <td class="p-3 border-b text-center whitespace-nowrap sticky right-0 bg-white z-10">${acaoBtn}</td>`;
     return tr;
 }, 8, 'os');

 renderizarAlertasProativos();
 atualizarDashboard(); renderizarGraficos(); renderizarMapa();
 renderizarLixeira();
}

// INVENTÁRIO DETALHADO POR UNIDADE COM CAPACIDADE E ETIQUETAS NO MAPA
function renderizarInventarioDetalhado() {
    const container = document.getElementById('dashInventarioContainer');
    const tbody = document.getElementById('dashInventarioBody');
    if(!container || !tbody) return;

    if (currentTeam !== 'ADMIN') {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');
    tbody.innerHTML = '';

    let invByUnit = {};

    equipamentos.forEach(e => {
        const u = e.unidade || e.team || 'SEM UNIDADE';
        if (!invByUnit[u]) {
            invByUnit[u] = { extintores: {}, hidrantes: 0, mangueiras: {} };
        }

        if (e.categoria === 'extintor') {
            let tipo = e.tipo || 'Outros';
            if(tipo === 'Agua') tipo = 'Água';
            else if(tipo === 'PoQuimico') tipo = 'Pó Químico';
            else if(tipo === 'ClasseK') tipo = 'Classe K';
            
            let capacidade = e.capacidade ? ` - ${e.capacidade}` : '';
            let chave = `${tipo}${capacidade}`;
            
            invByUnit[u].extintores[chave] = (invByUnit[u].extintores[chave] || 0) + 1;
        } else if (e.categoria === 'mangueira') {
            invByUnit[u].hidrantes++;
            let qtd = parseInt(e.quantidade) || 0;
            let tipoTam = `${e.tipo || 'S/T'} - ${e.dimensao || 'S/D'}`;
            invByUnit[u].mangueiras[tipoTam] = (invByUnit[u].mangueiras[tipoTam] || 0) + qtd;
        }
    });

    if (Object.keys(invByUnit).length === 0) {
         tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500 font-bold">Nenhum dado encontrado no momento.</td></tr>`;
         return;
    }

    Object.keys(invByUnit).sort().forEach(unidade => {
        const data = invByUnit[unidade];

        let extArr = [];
        Object.keys(data.extintores).sort().forEach(t => {
            extArr.push(`<span class="inline-block bg-red-100 text-red-800 text-[11px] px-2 py-1 rounded mr-1 mb-1 font-bold border border-red-200 shadow-sm">${t} (Qtd: ${data.extintores[t]})</span>`);
        });
        let extStr = extArr.length > 0 ? extArr.join('') : '<span class="text-gray-400 italic">Nenhum</span>';

        let manArr = [];
        Object.keys(data.mangueiras).sort().forEach(tt => {
            manArr.push(`<span class="inline-block bg-orange-100 text-orange-800 text-[11px] px-2 py-1 rounded mr-1 mb-1 font-bold border border-orange-200 shadow-sm">${tt} (Qtd: ${data.mangueiras[tt]})</span>`);
        });
        let manStr = manArr.length > 0 ? manArr.join('') : '<span class="text-gray-400 italic">Nenhuma</span>';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 border-b border-gray-200 transition-colors";
        tr.innerHTML = `
            <td class="p-3 font-bold text-gray-800 text-left"><i class="fa-solid fa-building text-red-600 mr-2"></i> ${unidade}</td>
            <td class="p-3 text-left whitespace-normal min-w-[250px] leading-relaxed">${extStr}</td>
            <td class="p-3 text-center font-bold text-blue-600 text-lg bg-blue-50">${data.hidrantes}</td>
            <td class="p-3 text-left whitespace-normal min-w-[250px] leading-relaxed">${manStr}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarLixeira() {
    const tbody = document.getElementById('lixeiraTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if(lixeiraItens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 font-bold">A lixeira está vazia.</td></tr>';
        return;
    }
    
    lixeiraItens.forEach(item => {
        const tr = document.createElement('tr');
        let dataExc = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('pt-BR') + ' ' + new Date(item.deletedAt).toLocaleTimeString('pt-BR') : '-';
        let idText = item.numero || item.idDoc || '-';
        if(item._col === 'ordens_servico') idText = "OS-" + item.idDoc.slice(-4);
        if(item._col === 'inspecoes') idText = "Insp. do Eq: " + (item.numero || 'S/N');
        let detalhe = item.localizacao || item.motivo || item.observacoes || '-';
        
        tr.innerHTML = `
            <td class="p-3 border-b text-gray-500">${dataExc}</td>
            <td class="p-3 border-b font-bold uppercase text-xs text-left">${item._tipo}</td>
            <td class="p-3 border-b text-left"><span class="font-bold text-gray-800">${idText}</span> <span class="text-gray-500 text-xs truncate max-w-[150px] inline-block ml-2">${detalhe}</span></td>
            <td class="p-3 border-b text-left">${item.unidade || '-'}</td>
            <td class="p-3 border-b text-center space-x-2">
                <button onclick="restaurarDaLixeira('${item._col}', '${item.idDoc}')" class="bg-green-100 text-green-700 px-3 py-1.5 rounded shadow-sm hover:bg-green-200 font-bold text-xs transition mb-1 sm:mb-0"><i class="fa-solid fa-rotate-left mr-1"></i> Restaurar</button>
                <button onclick="excluirDefinitivo('${item._col}', '${item.idDoc}')" class="bg-red-100 text-red-700 px-3 py-1.5 rounded shadow-sm hover:bg-red-200 font-bold text-xs transition" title="Apagar Permanentemente"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.esvaziarLixeira = function() {
    if(lixeiraItens.length === 0) return window.showAlert("A lixeira já está vazia.", true);
    document.getElementById('confirmText').innerText = "ATENÇÃO: Deseja apagar TODOS os itens da lixeira permanentemente?\nEsta ação é irreversível e os dados serão perdidos!";
    document.getElementById('btnConfirmarAcao').onclick = async () => {
        fecharConfirm();
        window.showAlert("Esvaziando lixeira... Aguarde.", false, "Aviso");
        try {
            const promises = [];
            lixeiraItens.forEach(item => {
                promises.push(window.excluirDefinitivoDoFirebase(item._col, item.idDoc));
            });
            const resultados = await Promise.allSettled(promises);
                const falhas = resultados.filter(r=>r.status === 'rejected');
                if(falhas.length) throw new Error(`${falhas.length} registros não foram restaurados. Confira as permissões e tente novamente.`);
            window.showAlert("Lixeira esvaziada com sucesso!", false);
        } catch(e) {
            window.showAlert("Erro ao esvaziar lixeira: " + e.message, true);
        }
    };
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
}

window.restaurarDaLixeira = function(col, id) {
    if (window.restaurarDaLixeiraNuvem) {
        window.restaurarDaLixeiraNuvem(col, id);
    }
}

window.excluirDefinitivo = function(id, col) {
    document.getElementById('confirmText').innerText = "ATENÇÃO: Deseja apagar este item DEFINITIVAMENTE?\nNão será possível recuperar depois disso!";
    document.getElementById('btnConfirmarAcao').onclick = async () => {
        fecharConfirm();
        if (window.excluirDefinitivoDoFirebase) {
            window.excluirDefinitivoDoFirebase(col, id);
            window.showAlert("Item apagado permanentemente!", false);
        }
    };
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
}

window.fazerBackupCompleto = function() {
    const data = {
        schemaVersion: 2,
        origem: 'InspecaoFire',
        usuarios: window.allUsuariosNuvem,
        equipamentos: window.allEquipamentosNuvem,
        inspecoes: window.allInspecoesNuvem,
        ordensServico: window.allOsNuvem,
        timestamp: Date.now()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const dataHoraFormatada = obterDataHoraFormatada();
    a.download = `backup_inspecaofire_${dataHoraFormatada}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    localStorage.setItem('firesys_ultimo_backup', dataHoraFormatada);
    const lblBkp = document.getElementById('lblUltimoBackup');
    if (lblBkp) lblBkp.innerText = dataHoraFormatada.replace('_', ' às ');
    
    window.showAlert("Backup preparado para download. Confirme que o arquivo foi salvo em seu dispositivo.", false);
};

window.processarRestauracaoBackup = function(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('confirmText').innerText = "🚨 ALERTA CRÍTICO:\nA restauração irá ADICIONAR ou SOBRESCREVER registros com os mesmos IDs. Registros ausentes do backup NÃO serão apagados.\n\nTem certeza que deseja continuar?";
    document.getElementById('btnConfirmarAcao').onclick = () => {
        fecharConfirm();
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (file.size > 30 * 1024 * 1024) throw new Error('Backup excede 30 MB.');
                if(!data || !['equipamentos','inspecoes','ordensServico'].every(k => Array.isArray(data[k])) || (data.usuarios !== undefined && !Array.isArray(data.usuarios)) || ![...data.equipamentos,...data.inspecoes,...data.ordensServico].every(x => x && typeof x.idDoc === 'string' && x.idDoc.length > 0) || (data.usuarios||[]).some(x=>!x || typeof x.login !== 'string' || !x.login)) {
                    window.showAlert("Arquivo de backup inválido ou corrompido!", true);
                    return;
                }
                
                window.showAlert("Restaurando sistema... Aguarde.", false, "Aviso");
                const promises = [];
                data.equipamentos.forEach(item => promises.push(window.salvarNoFirebaseDireto('equipamentos', item.idDoc, item)));
                data.inspecoes.forEach(item => promises.push(window.salvarNoFirebaseDireto('inspecoes', item.idDoc, item)));
                data.ordensServico.forEach(item => promises.push(window.salvarNoFirebaseDireto('ordens_servico', item.idDoc, item)));
                if(data.usuarios) data.usuarios.forEach(item => promises.push(window.salvarNoFirebaseDireto('usuarios', item.login, item)));
                
                const resultados = await Promise.allSettled(promises);
                const falhas = resultados.filter(r=>r.status === 'rejected');
                if(falhas.length) throw new Error(`${falhas.length} registros não foram restaurados. Confira as permissões e tente novamente.`);
                window.showAlert("Sistema Restaurado com Sucesso a partir do Backup!", false);
                document.getElementById('fileRestore').value = ''; 
            } catch(err) {
                window.showAlert("Erro ao processar arquivo: " + err.message, true);
            }
        };
        reader.readAsText(file);
    };
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
};

// ============================================
// GESTÃO DE ACESSOS E USUÁRIOS (ADMIN)
// ============================================
// Revoga sessões de usuários inativados/bloqueados assim que a coleção atualiza.
window.verificarSituacaoUsuarioLogado = function() {
    const login = localStorage.getItem('firesys_current_login');
    if (!login || login === 'ADMIN') return;
    const usuario = (window.allUsuariosNuvem || []).find(u => u.login === login);
    if (!usuario || usuario.ativo === false || usuario.bloqueado === true) {
        localStorage.removeItem('firesys_current_user');
        localStorage.removeItem('firesys_current_team');
        localStorage.removeItem('firesys_current_login');
        window.alert('Seu acesso foi desativado ou bloqueado pelo administrador.');
        location.reload();
    }
};

window.renderizarUsuarios = function() {
    const tbody = document.getElementById('usuariosTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(window.allUsuariosNuvem.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 font-bold">Nenhum usuário cadastrado no momento.</td></tr>';
        return;
    }
    
    // Agrupa os usuários por unidade
    let groupedUsers = {};
    window.allUsuariosNuvem.forEach(u => {
        const und = u.unidade || 'SEM UNIDADE';
        if(!groupedUsers[und]) groupedUsers[und] = [];
        groupedUsers[und].push(u);
    });
    
    // Organiza por ordem alfabética das unidades
    Object.keys(groupedUsers).sort().forEach((unidade, idx) => {
        
        let safeUnitId = "grp_usr_" + idx; // ID seguro para o grupo
        
        // Cria a linha de cabeçalho da Unidade separadora (Agora clicável)
        const trGroup = document.createElement('tr');
        trGroup.className = "bg-gray-100 border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors";
        trGroup.innerHTML = `
            <td colspan="5" class="p-3 font-bold text-gray-800 uppercase text-left text-base">
                <div class="flex justify-between items-center">
                    <div>
                        <i class="fa-solid fa-building text-red-600 mr-3"></i> ${escapeHTML(unidade)} 
                        <span class="text-xs bg-white border border-gray-300 px-2 py-0.5 rounded-full ml-2 text-gray-600">${groupedUsers[unidade].length} usuário(s)</span>
                    </div>
                    <i class="fa-solid fa-chevron-down text-gray-500 transition-transform duration-300" id="icon_${safeUnitId}"></i>
                </div>
            </td>
        `;
        
        // Função de clique para abrir/fechar a "gaveta" de usuários
        trGroup.onclick = () => {
            const rows = document.querySelectorAll(`.${safeUnitId}`);
            const icon = document.getElementById(`icon_${safeUnitId}`);
            let isHidden = false;
            rows.forEach(r => {
                r.classList.toggle('hidden');
                if (r.classList.contains('hidden')) isHidden = true;
            });
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
            }
        };
        
        tbody.appendChild(trGroup);

        // Organiza os usuários dentro desta unidade por ordem alfabética do nome
        let users = groupedUsers[unidade].sort((a,b) => a.nome.localeCompare(b.nome));
        
        users.forEach(u => {
            const tr = document.createElement('tr');
            // Começa as linhas com a classe "hidden" para as gavetas iniciarem fechadas
            tr.className = `hover:bg-gray-50 border-b border-gray-200 transition-colors hidden ${safeUnitId}`;
            const badgeSenha = u.primeiroAcesso ? `<span class="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm"><i class="fa-solid fa-clock"></i> Pendente (Senha Padrão)</span>` : `<span class="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm"><i class="fa-solid fa-check"></i> Senha Ativa (Alterada)</span>`;
            
            const situacao = u.bloqueado === true
                ? '<span class="text-red-700 font-bold">Bloqueado</span>'
                : u.ativo === false
                    ? '<span class="text-gray-600 font-bold">Inativo</span>'
                    : '<span class="text-green-700 font-bold">Ativo</span>';
            const badge = `${situacao}<div class="mt-1">${badgeSenha}</div>`;
            const loginArg = JSON.stringify(u.login).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            // Coluna de ações fixada na direita (sticky right-0 bg-white z-10)
            tr.innerHTML = `
                <td class="p-3 border-b font-bold text-gray-800 uppercase pl-6">${escapeHTML(u.login)}</td>
                <td class="p-3 border-b text-gray-700 font-semibold">${escapeHTML(u.nome)}</td>
                <td class="p-3 border-b text-gray-600 font-bold">${escapeHTML(u.unidade)}</td>
                <td class="p-3 border-b">${badge}</td>
                <td class="p-3 border-b text-center space-x-2 sticky right-0 bg-white z-10">
                    <button onclick="resetarSenhaUsuario(${loginArg})" class="bg-orange-100 text-orange-700 px-3 py-1.5 rounded shadow-sm hover:bg-orange-200 font-bold text-xs transition mb-1 sm:mb-0" title="Resetar para mudar123"><i class="fa-solid fa-key mr-1"></i> Reset</button>
                    <button onclick="alterarSituacaoUsuario(${loginArg}, 'ativo', ${u.ativo === false})" class="bg-blue-100 text-blue-800 px-3 py-1.5 rounded font-bold text-xs mb-1" title="Ativar ou desativar usuário">${u.ativo === false ? 'Ativar' : 'Desativar'}</button>
                    <button onclick="alterarSituacaoUsuario(${loginArg}, 'bloqueado', ${u.bloqueado !== true})" class="bg-purple-100 text-purple-800 px-3 py-1.5 rounded font-bold text-xs mb-1" title="Bloquear ou desbloquear usuário">${u.bloqueado === true ? 'Desbloquear' : 'Bloquear'}</button>
                    <button onclick="excluirUsuario(${loginArg})" class="bg-red-100 text-red-700 px-3 py-1.5 rounded shadow-sm hover:bg-red-200 font-bold text-xs transition" title="Apagar Acesso Definitivo"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
};

window.abrirModalNovoUsuario = function() {
    document.getElementById('cadUserLogin').value = '';
    document.getElementById('cadUserNome').value = '';
    document.getElementById('cadUserUnidade').value = '';
    openModal('modalNovoUsuario');
};

window.salvarNovoUsuario = async function(e) {
    e.preventDefault();
    const login = document.getElementById('cadUserLogin').value.trim().toUpperCase();
    const nome = document.getElementById('cadUserNome').value.trim().toUpperCase();
    const unidade = document.getElementById('cadUserUnidade').value.trim().toUpperCase();
    const senha = "mudar123";

    const existe = window.allUsuariosNuvem.find(u => u.login === login);
    if (existe) return window.showAlert(`A matrícula ou login "${login}" já está em uso por outro usuário!`, true);

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerText = "Salvando...";

    const novoUsr = { login, nome, unidade, senha, primeiroAcesso: true, role: 'fiscal', ativo: true, bloqueado: false, timestamp: Date.now() };
    
    try {
        if(window.salvarNoFirebaseDireto) await window.salvarNoFirebaseDireto('usuarios', login, novoUsr);
        window.showAlert("Acesso criado com sucesso!\n\nA senha provisória é: mudar123", false);
        closeModal('modalNovoUsuario');
    } catch(err) {
        window.showAlert("Erro ao criar usuário: " + err.message, true);
    }
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Criar Acesso';
};

window.alterarSituacaoUsuario = function(login, campo, valor) {
    if (localStorage.getItem('firesys_current_team') !== 'ADMIN') return;
    if (!['ativo', 'bloqueado'].includes(campo)) return;
    const acao = campo === 'ativo' ? (valor ? 'ativar' : 'desativar') : (valor ? 'bloquear' : 'desbloquear');
    document.getElementById('confirmText').innerText = `Deseja ${acao} o usuário ${login}?`;
    document.getElementById('btnConfirmarAcao').onclick = async () => {
        fecharConfirm();
        const usuario = (window.allUsuariosNuvem || []).find(u => u.login === login);
        if (!usuario) return window.showAlert('Usuário não encontrado.', true);
        try {
            if (!window.salvarNoFirebaseDireto) throw new Error('Firebase indisponível');
            const atualizado = {...usuario, [campo]: valor, alteradoEm: Date.now(), alteradoPor: 'ADMIN'};
            await window.salvarNoFirebaseDireto('usuarios', login, atualizado);
            window.showAlert(`Usuário ${login}: operação concluída.`, false);
        } catch (e) { window.showAlert('Não foi possível alterar o usuário: ' + e.message, true); }
    };
    document.getElementById('modalConfirm').classList.remove('hidden');
    document.getElementById('modalConfirm').classList.add('flex');
};

window.resetarSenhaUsuario = function(login) {
    document.getElementById('confirmText').innerText = `Deseja resetar a senha do usuário ${login}?\n\nA senha voltará a ser "mudar123" e ele terá que criar uma nova senha no próximo acesso.`;
    document.getElementById('btnConfirmarAcao').onclick = async () => {
        fecharConfirm();
        let u = window.allUsuariosNuvem.find(x => x.login === login);
        if(u) {
            u.senha = "mudar123";
            u.primeiroAcesso = true;
            if(window.salvarNoFirebaseDireto) await window.salvarNoFirebaseDireto('usuarios', login, u);
            window.showAlert(`Senha de ${login} resetada para "mudar123"!`, false);
        }
    };
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
};

window.excluirUsuario = function(login) {
    document.getElementById('confirmText').innerText = `ATENÇÃO: Deseja apagar definitivamente o acesso do usuário ${login}? Ele não poderá mais acessar o sistema.`;
    document.getElementById('btnConfirmarAcao').onclick = async () => {
        fecharConfirm();
        if(window.excluirDefinitivoDoFirebase) await window.excluirDefinitivoDoFirebase('usuarios', login);
        window.showAlert("Acesso removido com sucesso!", false);
    };
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
};

// FLUXO DO PRIMEIRO ACESSO (Obrigatório trocar senha)
window.salvarNovaSenha = async function(e) {
    e.preventDefault();
    const s1 = document.getElementById('novaSenhaInp').value;
    const s2 = document.getElementById('confirmaNovaSenhaInp').value;
    
    if(s1 !== s2) return window.showAlert("Atenção: As senhas não coincidem!", true);
    if(s1.length < 4) return window.showAlert("Sua nova senha deve ter pelo menos 4 caracteres para ser segura.", true);
    if(s1 === "mudar123") return window.showAlert("Você não pode manter a mesma senha padrão. Crie uma nova.", true);

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerText = "Salvando e Entrando...";

    try {
        let u = {...window.pendingUserLogin};
        const usuarioAtual = (window.allUsuariosNuvem || []).find(x => x.login === u.login);
        if (!usuarioAtual || usuarioAtual.ativo === false || usuarioAtual.bloqueado === true) throw new Error('Usuário inativo ou bloqueado');
        u.senha = s1;
        u.primeiroAcesso = false;
        
        if(window.salvarNoFirebaseDireto) await window.salvarNoFirebaseDireto('usuarios', u.login, u);
        
        closeModal('modalTrocarSenha');
        
        // Loga o usuário de fato no sistema
        localStorage.setItem('firesys_current_user', u.nome);
        localStorage.setItem('firesys_current_team', u.unidade);
        localStorage.setItem('firesys_current_login', u.login);
        playLoginAnimation(checkLogin);
        window.pendingUserLogin = null;
    } catch(err) {
        window.showAlert("Erro ao salvar sua nova senha: " + err.message, true);
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> Salvar e Entrar';
    }
};

window.imprimirRelacao = function(tipo) {
    let activeUnit = null;
    let list = [];
    let titulo = '';
    let fileName = '';

    if (tipo === 'extintor' || tipo === 'mangueira') {
        activeUnit = tipo === 'extintor' ? window.activeTableView['ext'] : window.activeTableView['man'];
        list = equipamentos.filter(e => e.categoria === tipo);
        titulo = tipo === 'extintor' ? 'Relação de Extintores' : 'Relação de Hidrantes / Mangueiras';
        fileName = tipo === 'extintor' ? 'Extintores' : 'Hidrantes';
    } else if (tipo === 'inspecao') {
        activeUnit = window.activeTableView['insp'];
        list = [...inspecoes];
        titulo = 'Relatório de Inspeções';
        fileName = 'Inspecoes';
    } else if (tipo === 'os') {
        activeUnit = window.activeTableView['os'];
        list = [...ordensServico];
        titulo = 'Relatório de Ordens de Serviço';
        fileName = 'Ordens_Servico';
    }
    
    if (activeUnit) {
        list = list.filter(e => (e.unidade || 'SEM UNIDADE') === activeUnit);
    }
    
    if (tipo === 'inspecao' || tipo === 'os') {
        list.sort((a, b) => b.timestamp - a.timestamp); 
    } else {
        list.sort((a, b) => {
            const cmp = (a.unidade || '').localeCompare(b.unidade || '');
            if (cmp !== 0) return cmp;
            return sortByNumero(a, b);
        }); 
    }
    
    if(list.length === 0) return window.showAlert("Nenhum registro para imprimir.", true);
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        if (activeUnit) titulo += ` - Unidade: ${escapeHTML(activeUnit)}`;
        else titulo += ` - Visão Geral (Todas as Unidades)`;
        
        doc.setFontSize(16); doc.text(titulo, 14, 15);
        doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 22);

        let tableColumn = [];
        let tableRows = [];

        if (tipo === 'extintor') {
            tableColumn = ["Unidade", "Nº/Patrimônio", "Últ. Recarga", "Próx. Teste", "Localização", "Marca", "Tipo/Classe", "Capacidade", "Cap. Ext."];
            list.forEach(e => {
                let t = e.tipo || '-';
                if(t === 'ClasseK') t = 'Classe K';
                else if(t === 'Agua') t = 'Água';
                else if(t === 'PoQuimico') t = 'Pó Químico';
                tableRows.push([
                    e.unidade || '-', e.numero || '-', formatarDataBR(e.dataUltimaRecarga), formatarDataBR(e.dataProxTeste), e.localizacao || '-', e.marca || '-', t, e.capacidade || '-', e.capacidadeExtintora || '-'
                ]);
            });
        } else if (tipo === 'mangueira') {
            tableColumn = ["Unidade", "Nº/Patrimônio", "Localização", "Diâmetro", "Qtd Mangueiras", "Dimensão", "Tipo Mang.", "Próx. Teste"];
            list.forEach(e => {
                tableRows.push([
                    e.unidade || '-', e.numero || '-', e.localizacao || '-', e.diametro || '-', e.quantidade || '-', e.dimensao || '-', e.tipo || '-', formatarDataBR(e.dataProxTeste)
                ]);
            });
        } else if (tipo === 'inspecao') {
            tableColumn = ["Unidade", "Data", "Status", "Fiscal", "Nº Equip.", "Categoria", "Localização", "Val. Teste", "Observações"];
            list.forEach(i => {
                let obs = i.observacoes || (i.checklistFails ? i.checklistFails.join(', ') : '-');
                tableRows.push([
                    i.unidade || '-', formatarDataBR(i.data), i.status, i.fiscal || '-', i.numero || '-', i.categoria.toUpperCase(), i.localizacao || '-', formatarDataBR(i.dataProxTeste), obs
                ]);
            });
        } else if (tipo === 'os') {
            tableColumn = ["O.S. ID", "Status", "Data Geração", "Unidade", "Nº Equip.", "Localização", "Motivo (Falhas)"];
            list.forEach(os => {
                const id = "OS-" + os.idDoc.slice(-4);
                const eq = equipamentos.find(e => e.idDoc === os.equipamento_id);
                const loc = eq ? eq.localizacao : '-';
                const cat = eq ? eq.categoria : 'extintor';
                const st = os.status === 'Terceirizada' ? 'Externa' : os.status;
                tableRows.push([
                    id, st, formatarDataBR(os.dataGeracao), os.unidade || '-', os.numeroEquip || '-', loc, formatarMotivoText(os.motivo, cat)
                ]);
            });
        }

        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 28, theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
            styles: { fontSize: 8, cellPadding: 3, lineColor: [180, 180, 180], lineWidth: 0.1 },
            didParseCell: function(data) {
                if (data.section === 'body' && data.row.index % 2 === 0) data.cell.styles.fillColor = [240, 240, 240];
                if (tipo === 'inspecao' && data.section === 'body' && data.column.index === 2) {
                    if (data.cell.raw === 'Aprovado') { data.cell.styles.textColor = [0, 128, 0]; data.cell.styles.fontStyle = 'bold'; }
                    else if (data.cell.raw === 'Reprovado') { data.cell.styles.textColor = [200, 0, 0]; data.cell.styles.fontStyle = 'bold'; }
                }
                if (tipo === 'os' && data.section === 'body' && data.column.index === 1) {
                    if (data.cell.raw === 'Concluída') { data.cell.styles.textColor = [0, 128, 0]; data.cell.styles.fontStyle = 'bold'; }
                    else if (data.cell.raw === 'Aberta') { data.cell.styles.textColor = [200, 0, 0]; data.cell.styles.fontStyle = 'bold'; }
                    else if (data.cell.raw === 'Externa') { data.cell.styles.textColor = [139, 92, 246]; data.cell.styles.fontStyle = 'bold'; }
                }
            }
        });

        const strDataHora = obterDataHoraFormatada();
        doc.save(`Relatorio_${fileName}_${strDataHora}.pdf`);
    } catch(e) {
        alert("Erro ao gerar PDF: " + e.message);
    }
};

window.abrirModalResolverOS = function(idOS) {
 document.getElementById('osResolverId').value = idOS;
 document.getElementById('osFotoCam').value = '';
 document.getElementById('osFotoGal').value = '';
 document.getElementById('lblFotoOS').classList.add('hidden');
 document.getElementById('osAcaoTipo').value = 'concluir';
 document.getElementById('osNomeEmpresa').value = '';
 toggleOSFields();
 openModal('modalResolverOS');
};

window.toggleOSFields = function() {
    const v = document.getElementById('osAcaoTipo').value;
    if (v === 'concluir') {
        document.getElementById('osFieldFoto').classList.remove('hidden');
        document.getElementById('osFieldTerceiro').classList.add('hidden');
    } else {
        document.getElementById('osFieldFoto').classList.add('hidden');
        document.getElementById('osFieldTerceiro').classList.remove('hidden');
    }
};

window.atualizarLabelFotoOS = function() {
 const c1 = document.getElementById('osFotoCam').files.length;
 const c2 = document.getElementById('osFotoGal').files.length;
 if (c1 + c2 > 0) {
 document.getElementById('lblFotoOS').innerText = "Foto anexada com sucesso!";
 document.getElementById('lblFotoOS').classList.remove('hidden');
 } else {
 document.getElementById('lblFotoOS').classList.add('hidden');
 }
};

window.confirmarResolucaoOS = async function(e) {
 e.preventDefault();
 const btn = e.target.querySelector('button[type="submit"]');
 btn.disabled = true; btn.innerHTML = "Salvando...";

 const idOS = document.getElementById('osResolverId').value;
 const acao = document.getElementById('osAcaoTipo').value;
 const os = ordensServico.find(o => o.idDoc === idOS);
 if(!os) { btn.disabled = false; return; }

 const dCon = new Date(); dCon.setMinutes(dCon.getMinutes() - dCon.getTimezoneOffset());

 if (acao === 'concluir') {
     const fCam = document.getElementById('osFotoCam').files ? Array.from(document.getElementById('osFotoCam').files) : [];
     const fGal = document.getElementById('osFotoGal').files ? Array.from(document.getElementById('osFotoGal').files) : [];
     const allFiles = [...fCam, ...fGal];

     if(allFiles.length === 0) {
         window.showAlert("É obrigatório anexar uma foto para concluir a O.S.", true);
         btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar';
         return;
     }

     let fotosCompress;
     try { fotosCompress = await processarArquivosImagem(allFiles.slice(0, 1)); }
     catch(error) { window.showAlert(error.message, true); btn.disabled = false; btn.innerText = 'Salvar'; return; }
     if (!fotosCompress.length) { window.showAlert('Não foi possível processar a foto.', true); btn.disabled = false; btn.innerText = 'Salvar'; return; }
     os.fotoResolucao = fotosCompress[0]; 

     os.status = "Concluída";
     os.dataConclusao = dCon.toISOString().split('T')[0];
 } else {
     const emp = document.getElementById('osNomeEmpresa').value.trim();
     if(!emp) {
         window.showAlert("Digite o nome da empresa terceirizada.", true);
         btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar';
         return;
     }
     os.status = "Terceirizada";
     os.terceirizadaNome = emp;
     os.dataEnvioTerceiro = dCon.toISOString().split('T')[0];
 }

 if(window.salvarNoFirebase) {
     await window.salvarNoFirebase('ordens_servico', idOS, os);
     window.showAlert(acao === 'concluir' ? "O.S. Concluída com Sucesso!" : "O.S. enviada para Manutenção Externa!", false);
 }

 closeModal('modalResolverOS');
 btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Salvar';
};

function renderizarGraficos() {
 if (typeof Chart === 'undefined') return;
 const c1 = document.getElementById('chartTipos'); const c2 = document.getElementById('chartStatus');
 if(!c1||!c2) return;
 const eqs = equipamentos; const ins = inspecoes;
 const counts = { 'Água':0, 'Pó BC':0, 'Pó ABC':0, 'Pó Químico': 0, 'CO2':0, 'Espuma':0, 'Classe K':0, 'Hidrantes':0 };
 eqs.forEach(e => { 
     if(e.categoria==='mangueira') counts['Hidrantes']++; 
     else { 
         if(e.tipo==='Agua' || e.tipo==='Água') counts['Água']++; 
         else if(e.tipo==='PoQuimico' || e.tipo==='Pó Químico') counts['Pó Químico']++; 
         else if(e.tipo==='Pó Químico BC') counts['Pó BC']++; 
         else if(e.tipo==='Pó Químico ABC') counts['Pó ABC']++; 
         else if(e.tipo==='CO2') counts['CO2']++; 
         else if(e.tipo==='Espuma') counts['Espuma']++; 
         else if(e.tipo==='ClasseK' || e.tipo==='Classe K') counts['Classe K']++; 
     } 
 });
 
 Object.keys(counts).forEach(k => { if(counts[k] === 0) delete counts[k]; });

 if(window.chT) window.chT.destroy(); window.chT = new Chart(c1, { type: 'pie', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#3b82f6','#eab308','#f59e0b','#374151','#f97316','#8b5cf6','#ef4444','#64748b'] }] }, options: { plugins: { title: { display:true, text:'Divisão da Frota' } }, maintainAspectRatio: false } });
 
let g=0, y=0, r=0;
 eqs.forEach(e => { if(!e.dataProxTeste) return; const diff = (new Date(e.dataProxTeste.split('-').join('/')) - new Date()) / (1000*3600*24); if(diff < 0) r++; else if(diff <= 30) y++; else g++; });
 if(window.chS) window.chS.destroy(); window.chS = new Chart(c2, { type: 'doughnut', data: { labels: ['OK (Verde)', 'Atenção (Amarelo)', 'Vencidos (Vermelho)'], datasets: [{ data: [g, y, r], backgroundColor: ['#22c55e','#eab308','#ef4444'] }] }, options: { plugins: { title: { display:true, text:'Saúde dos Testes (Validade)' } }, maintainAspectRatio: false } });
}

function atualizarDashboard() {
 document.getElementById('dashExtintores').innerText = equipamentos.filter(e => e.categoria === 'extintor').length; 
document.getElementById('dashHidrantes').innerText = equipamentos.filter(e => e.categoria === 'mangueira').length; 
document.getElementById('dashMangueirasTotal').innerText = equipamentos.filter(e => e.categoria === 'mangueira').reduce((a, eq) => a + (parseInt(eq.quantidade) || 0), 0); 
document.getElementById('dashInspecoes').innerText = inspecoes.length;
 if(typeof renderizarUnidadesGrid === 'function') renderizarUnidadesGrid();
 renderizarInventarioDetalhado();
}

// LOGICA DE LOTE (Massa)
window.toggleTodosLote = function(chkbox, classe) {
    const chks = document.querySelectorAll('.' + classe);
    chks.forEach(c => c.checked = chkbox.checked);
};

window.abrirModalLote = function(categoria) {
    const cls = categoria === 'extintor' ? 'chk-ext' : 'chk-man';
    const chks = document.querySelectorAll(`.${cls}:checked`);
    if(chks.length === 0) return window.showAlert("Selecione pelo menos um equipamento na caixa de seleção para atualizar em lote.", true);
    
    document.getElementById('loteCount').innerText = chks.length;
    document.getElementById('loteCategoria').value = categoria;
    document.getElementById('loteDataRecarga').value = '';
    document.getElementById('loteDataTeste').value = '';
    openModal('modalAcaoLote');
};

window.salvarLote = async function(e) {
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.innerHTML = "Atualizando...";
    
    const cat = document.getElementById('loteCategoria').value;
    const nRecarga = document.getElementById('loteDataRecarga').value;
    const nTeste = document.getElementById('loteDataTeste').value;
    
    if(!nRecarga && !nTeste) {
        window.showAlert("Nenhuma data informada.", true);
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Aplicar em Todos';
        return;
    }
    
    const cls = cat === 'extintor' ? 'chk-ext' : 'chk-man';
    const chks = document.querySelectorAll(`.${cls}:checked`);
    let ids = Array.from(chks).map(c => c.value);
    
    for(let id of ids) {
        const eq = equipamentos.find(e => e.idDoc === id);
        if(eq) {
            if(nRecarga) eq.dataUltimaRecarga = nRecarga;
            if(nTeste) eq.dataProxTeste = nTeste;
            if(window.salvarNoFirebase) await window.salvarNoFirebase('equipamentos', id, eq);
        }
    }
    
    closeModal('modalAcaoLote');
    window.showAlert(`Sucesso! ${ids.length} equipamentos atualizados.`, false);
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Aplicar em Todos';
};

// LOGICA LINHA DO TEMPO (Raio-X)
window.abrirTimeline = function(id) {
    const eq = equipamentos.find(e => e.idDoc === id);
    if(!eq) return;
    
    document.getElementById('ltEquipName').innerText = `[${eq.numero || 'S/N'}] ${eq.categoria.toUpperCase()} - ${eq.unidade}`;
    
    let eventos = [];
    
    // Cadastro
    eventos.push({ 
        data: eq.timestamp ? new Date(eq.timestamp) : new Date(), 
        tipo: 'cadastro', 
        titulo: 'Equipamento Cadastrado no Sistema', 
        desc: `Registrado por: ${eq.user || 'Desconhecido'}` 
    });
    
    // Inspeções
    inspecoes.filter(i => i.equipamento_id === id).forEach(i => {
        let isOk = i.status === 'Aprovado';
        eventos.push({
            data: i.timestamp ? new Date(i.timestamp) : new Date(i.data + "T12:00:00"),
            tipo: isOk ? 'insp_ok' : 'insp_warn',
            titulo: `Inspeção Operacional - ${i.status}`,
            desc: `Fiscal: ${i.fiscal}<br>Obs: ${i.observacoes || (i.checklistFails ? i.checklistFails.join(', ') : 'Tudo em conformidade')}`
        });
    });
    
    // O.S.
    ordensServico.filter(o => o.equipamento_id === id).forEach(os => {
        eventos.push({
            data: os.timestamp ? new Date(os.timestamp) : new Date(os.dataGeracao + "T12:00:00"),
            tipo: 'os',
            titulo: `O.S. Aberta: ${os.idDoc.slice(-4)}`,
            desc: `Motivo: ${os.motivo}`
        });
        if(os.status === 'Concluída' && os.dataConclusao) {
            eventos.push({
                data: new Date(os.dataConclusao + "T18:00:00"),
                tipo: 'insp_ok',
                titulo: `O.S. Concluída: ${os.idDoc.slice(-4)}`,
                desc: `Manutenção resolvida com sucesso.`
            });
        }
    });
    
    // Ordenar do mais novo para o mais velho
    eventos.sort((a,b) => b.data - a.data);
    
    const container = document.getElementById('ltContainer');
    container.innerHTML = '';
    
    eventos.forEach(ev => {
        let div = document.createElement('div');
        div.className = 'timeline-item relative';
        
        if (ev.tipo === 'insp_ok') div.classList.add('ok');
        else if (ev.tipo === 'insp_warn') div.classList.add('warn');
        else if (ev.tipo === 'os') div.classList.add('os');
        
        const dataStr = ev.data.toLocaleDateString('pt-BR');
        div.innerHTML = `
            <span class="block text-xs font-bold text-gray-400 mb-1">${dataStr}</span>
            <h4 class="text-sm font-bold text-gray-800">${ev.titulo}</h4>
            <p class="text-xs text-gray-600 mt-1">${ev.desc}</p>
        `;
        container.appendChild(div);
    });
    
    openModal('modalLinhaTempo');
};

// LOGICA MAPA FROTA (Leaflet Spiderfy Cluster + Etiquetas)
window.renderizarMapa = function() {
    if (!document.getElementById('mapa').classList.contains('active')) return;
    
    if (frotaMap) { 
        frotaMap.remove(); 
        frotaMap = null;
    }
    
    frotaMap = L.map('mapContainer').setView([-5.2, -39.3], 7); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(frotaMap);
    
    let markersCluster = L.markerClusterGroup({
        maxClusterRadius: 40, 
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    
    let bounds = [];
    let unitCoords = {}; // Para agrupar coordenadas por unidade e achar o centro
    
    equipamentos.forEach(eq => {
        if (eq.gps && eq.gps.lat && eq.gps.lng) {
            
            // Agrupar coordenadas para a etiqueta flutuante
            let u = eq.unidade || 'SEM UNIDADE';
            if (!unitCoords[u]) unitCoords[u] = [];
            unitCoords[u].push({lat: parseFloat(eq.gps.lat), lng: parseFloat(eq.gps.lng)});

            let color = 'green';
            let statusText = 'OK';
            let title = eq.categoria === 'extintor' ? 'Extintor' : 'Hidrante';
            
            let hasOs = ordensServico.some(o => o.equipamento_id === eq.idDoc && (o.status === 'Aberta' || o.status === 'Terceirizada'));
            
            const h = new Date(); h.setHours(0,0,0,0);
            let diasVencimento = 9999; 
            
            if(eq.dataProxTeste) {
                const pts = eq.dataProxTeste.split('-');
                const dv = new Date(pts[0], pts[1]-1, pts[2]);
                const diff = Math.ceil((dv - h) / (1000 * 60 * 60 * 24));
                if (diff < diasVencimento) diasVencimento = diff;
            }
            if(eq.dataUltimaRecarga) {
                const pts = eq.dataUltimaRecarga.split('-');
                const dv = new Date(parseInt(pts[0]) + 1, pts[1]-1, pts[2]);
                const diff = Math.ceil((dv - h) / (1000 * 60 * 60 * 24));
                if (diff < diasVencimento) diasVencimento = diff;
            }

            if (hasOs || diasVencimento < 0) {
                color = 'red';
                statusText = 'Alerta / Vencido / OS Pendente';
            } else if (diasVencimento <= 30) {
                color = 'yellow';
                statusText = `Atenção (Vence em ${diasVencimento} dias)`;
            }

            let faIcon = eq.categoria === 'extintor' ? 'fa-fire-extinguisher' : 'fa-droplet';
            let bgClass = color === 'red' ? 'bg-red-600' : (color === 'yellow' ? 'bg-yellow-500' : 'bg-green-600');
            
            const customIcon = L.divIcon({
                className: '', 
                html: `<div class="flex items-center justify-center w-9 h-9 rounded-full ${bgClass} text-white shadow-md border-2 border-white"><i class="fa-solid ${faIcon} text-lg"></i></div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36]
            });

            const marker = L.marker([eq.gps.lat, eq.gps.lng], {icon: customIcon});
            
            let textColor = color === 'red' ? '#dc2626' : (color === 'yellow' ? '#d97706' : '#16a34a');
            let detalhes = '';
            if (eq.categoria === 'extintor') {
                let t = eq.tipo || '-';
                if(t === 'ClasseK') t = 'Classe K';
                else if(t === 'Agua') t = 'Água';
                else if(t === 'PoQuimico') t = 'Pó Químico';
                detalhes = `<span class="block mb-1"><b>Tipo/Classe:</b> ${t}</span><span class="block"><b>Capacidade:</b> ${eq.capacidade || '-'}</span>`;
            } else {
                detalhes = `<span class="block mb-1"><b>Tipo:</b> ${eq.tipo || '-'}</span><span class="block"><b>Dimensão:</b> ${eq.dimensao || '-'}</span>`;
            }

            marker.bindPopup(`
                <div class="text-sm min-w-[200px]">
                    <b class="text-base text-gray-800 border-b border-gray-200 pb-1 block mb-2">${title} - Nº ${eq.numero || 'S/N'}</b>
                    <i class="fa-solid fa-building text-red-600 w-4"></i> ${eq.unidade}<br>
                    <i class="fa-solid fa-location-dot text-blue-600 w-4"></i> Local: ${eq.localizacao || '-'}<br>
                    <div class="my-2 bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-700 shadow-inner">
                        ${detalhes}
                    </div>
                    <span style="color:${textColor};font-weight:bold;font-size:12px;" class="flex items-center"><i class="fa-solid ${color === 'green' ? 'fa-check' : 'fa-triangle-exclamation'} mr-1"></i> ${statusText}</span>
                </div>
            `);
            
            markersCluster.addLayer(marker);
            bounds.push([eq.gps.lat, eq.gps.lng]);
        }
    });
    
    frotaMap.addLayer(markersCluster);

    // INSERINDO AS ETIQUETAS DAS UNIDADES (Calculando o centro)
    Object.keys(unitCoords).forEach(unidade => {
        let coords = unitCoords[unidade];
        if (coords.length > 0) {
            let sumLat = 0, sumLng = 0;
            coords.forEach(c => { sumLat += c.lat; sumLng += c.lng; });
            let centerLat = sumLat / coords.length;
            let centerLng = sumLng / coords.length;

            let labelIcon = L.divIcon({
                className: 'unit-map-label',
                html: `<div class="bg-gray-900 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full shadow-lg border-2 border-white whitespace-nowrap inline-flex items-center"><i class="fa-solid fa-building text-red-500 mr-2"></i> ${unidade}</div>`,
                iconSize: [0, 0] 
            });

            L.marker([centerLat, centerLng], {icon: labelIcon, interactive: false}).addTo(frotaMap);
        }
    });

    if(bounds.length > 0) frotaMap.fitBounds(bounds);
};

window.regiaoAtual = 'Todas';
window.filtrarRegiaoGrid = function(regiao, btn) {
 window.regiaoAtual = regiao;
 if(btn) {
 document.querySelectorAll('.btn-regiao').forEach(b => {
 b.classList.remove('bg-red-600', 'text-white');
 b.classList.add('bg-gray-200', 'text-gray-700');
 });
 btn.classList.remove('bg-gray-200', 'text-gray-700');
 btn.classList.add('bg-red-600', 'text-white');
 }
 renderizarUnidadesGrid();
};

function obterRegiao(unidade) {
 if (!unidade) return 'Fortaleza/RMF';
 const u = unidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
 if (u.includes('IGUATU') || u.includes('CEDRO') || u.includes('CENTRO SUL') || u.includes('CENTROSUL')) return 'Centro-Sul';
 if (u.includes('CRATO') || u.includes('JUAZEIRO') || u.includes('BARBALHA') || u.includes('CARIRI')) return 'Cariri';
 if (u.includes('SOBRAL') || u.includes('TIANGUA') || u.includes('ZONA NORTE') || u.includes('IBIAPABA')) return 'Zona Norte/Ibiapaba';
 if (u.includes('QUIXADA') || u.includes('TAUA') || u.includes('SERTAO') || u.includes('INHAMUNS')) return 'Sertão Central/Inhamuns';
 if (u.includes('LIMOEIRO') || u.includes('ARACATI') || u.includes('JAGUARIBE') || u.includes('LITORAL') || u.includes('RUSSAS') || u.includes('QUIXERAMOBIM')) return 'Jaguaribe/Litoral';
 if (u.includes('MOVEL') || u.includes('MOVEIS')) return 'Unidades Móveis';
 return 'Fortaleza/RMF';
}

function renderizarUnidadesGrid() {
 const containerUnidades = document.getElementById('unidadesGrid');
 const containerDash = document.getElementById('dashEquipesGrid');
 if(!containerUnidades || !containerDash) return;
 
containerUnidades.innerHTML = ''; containerDash.innerHTML = '';

 let equipesStats = {};
 equipamentos.forEach(e => {
 const t = e.team && e.team !== 'ADMIN' ? e.team : 'SEM EQUIPE';
 if(!equipesStats[t]) equipesStats[t] = { extintores: 0, hidrantes: 0, inspecoes: 0, os: 0 };
 if(e.categoria === 'extintor') equipesStats[t].extintores++; else equipesStats[t].hidrantes++;
 });
 inspecoes.forEach(i => {
 const t = i.team && i.team !== 'ADMIN' ? i.team : 'SEM EQUIPE';
 if(!equipesStats[t]) equipesStats[t] = { extintores: 0, hidrantes: 0, inspecoes: 0, os: 0 };
 equipesStats[t].inspecoes++;
 });
 ordensServico.forEach(o => {
 const t = o.team && o.team !== 'ADMIN' ? o.team : 'SEM EQUIPE';
 if(!equipesStats[t]) equipesStats[t] = { extintores: 0, hidrantes: 0, inspecoes: 0, os: 0 };
 if(o.status === 'Aberta' || o.status === 'Terceirizada') equipesStats[t].os++;
 });

 Object.keys(equipesStats).sort().forEach(equipe => {
 const stat = equipesStats[equipe]; const regiaoDaEquipe = obterRegiao(equipe);
 const cardHTML = `
 <div class="bg-white p-5 rounded-lg shadow-sm border-t-4 border-red-600 flex flex-col justify-between">
 <div>
 <h4 class="font-bold text-gray-800 text-lg mb-3 flex items-center"><i class="fa-solid fa-building mr-2 text-red-600"></i> ${equipe}</h4>
 <div class="grid grid-cols-2 gap-2 text-sm mb-4">
 <div class="bg-gray-50 p-2 rounded border"><span class="block text-gray-500 text-xs">Extintores</span><span class="font-bold text-red-600">${stat.extintores}</span></div>
 <div class="bg-gray-50 p-2 rounded border"><span class="block text-gray-500 text-xs">Hidrantes</span><span class="font-bold text-blue-600">${stat.hidrantes}</span></div>
 <div class="bg-gray-50 p-2 rounded border"><span class="block text-gray-500 text-xs">Total Inspeções</span><span class="font-bold text-green-600">${stat.inspecoes}</span></div>
 <div class="bg-gray-50 p-2 rounded border ${stat.os > 0 ? 'bg-orange-50 border-orange-200' : ''}"><span class="block text-gray-500 text-xs">OS Pendentes</span><span class="font-bold ${stat.os > 0 ? 'text-orange-600' : 'text-gray-600'}">${stat.os}</span></div>
 </div>
 </div>
 <div class="flex flex-col space-y-2 pt-3 border-t border-gray-100">
 <button onclick="abrirModalFiltroRelatorio('${equipe}')" class="w-full bg-blue-600 text-white text-xs font-bold py-2 px-2 rounded shadow hover:bg-blue-700 transition flex items-center justify-center">
 <i class="fa-solid fa-filter mr-2"></i> Relatório de Inspeções
 </button>
 ${currentTeam === 'ADMIN' ? `
 <button onclick="confirmarExclusaoUnidade('${equipe}')" class="w-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold py-2 px-2 rounded shadow-sm hover:bg-red-100 transition flex items-center justify-center">
 <i class="fa-solid fa-trash-can mr-2"></i> Excluir Unidade
 </button>
 ` : ''}
 </div>
 </div>`;
 containerDash.innerHTML += cardHTML;
 if(window.regiaoAtual === 'Todas' || window.regiaoAtual === regiaoDaEquipe || equipe === 'SEM EQUIPE') { containerUnidades.innerHTML += cardHTML; }
 });
}

function getVencimentoBadge(dStr) {
 if (!dStr || dStr === '-') return '-'; const parts = dStr.split('-'); if (parts.length !== 3) return formatarDataBR(dStr);
 const dVenc = new Date(parts[0], parts[1]-1, parts[2]); const h = new Date(); h.setHours(0,0,0,0);
 const diff = Math.ceil((dVenc - h) / (1000 * 60 * 60 * 24)); const dBR = formatarDataBR(dStr);
 if (diff < 0) return `<span class="bg-red-100 text-red-800 font-bold px-2 py-1 rounded inline-block"><i class="fa-solid fa-triangle-exclamation"></i> ${dBR}</span>`;
 if (diff <= 30) return `<span class="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded inline-block"><i class="fa-solid fa-clock"></i> ${dBR}</span>`;
 return `<span class="bg-green-100 text-green-800 font-bold px-2 py-1 rounded inline-block"><i class="fa-solid fa-check"></i> ${dBR}</span>`;
}

function getVencimentoRecargaBadge(dStr) {
 if (!dStr || dStr === '-') return '-';
 const parts = dStr.split('-');
 if (parts.length !== 3) return formatarDataBR(dStr);
 const dVenc = new Date(parseInt(parts[0]) + 1, parts[1]-1, parts[2]); 
const h = new Date(); h.setHours(0,0,0,0);
 const diff = Math.ceil((dVenc - h) / (1000 * 60 * 60 * 24)); 
const dBR = formatarDataBR(dStr);
 if (diff < 0) return `<span class="bg-red-100 text-red-800 font-bold px-2 py-1 rounded inline-block" title="Recarga Vencida (+ de 1 ano)"><i class="fa-solid fa-triangle-exclamation"></i> ${dBR}</span>`;
 if (diff <= 30) return `<span class="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded inline-block" title="Recarga Próxima do Vencimento"><i class="fa-solid fa-clock"></i> ${dBR}</span>`;
 return `<span class="bg-green-100 text-green-800 font-bold px-2 py-1 rounded inline-block" title="Recarga no Prazo"><i class="fa-solid fa-check"></i> ${dBR}</span>`;
}

function renderRowExtintor(d, showChk) {
 const tr = document.createElement('tr'); 
 let gpsBtn = (d.gps && d.gps.lat) ? `<a href="https://www.google.com/maps?q=${d.gps.lat},${d.gps.lng}" target="_blank" class="text-blue-600 hover:text-blue-800 mx-1" title="Localização GPS do Cadastro"><i class="fa-solid fa-map-location-dot text-lg"></i></a>` : '';
 
 let t = d.tipo || '-';
 if(t === 'ClasseK') t = 'Classe K';
 else if(t === 'Agua') t = 'Água';
 else if(t === 'PoQuimico') t = 'Pó Químico';
 
 let chkHTML = showChk ? `<td class="p-3 border-b text-center chk-col"><input type="checkbox" class="chk-ext w-4 h-4" value="${d.idDoc}"></td>` : `<td class="p-3 border-b text-center chk-col hidden"></td>`;

 tr.innerHTML = `${chkHTML}<td class="p-3 border-b text-left">${formatarDataBR(d.dataInspecao)}</td><td class="p-3 border-b text-gray-900 font-bold text-left">${escapeHTML(d.unidade || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.user || '-')}</td><td class="p-3 border-b font-bold text-left">${escapeHTML(d.numero || '-')}</td><td class="p-3 border-b text-center">${getVencimentoRecargaBadge(d.dataUltimaRecarga)}</td><td class="p-3 border-b text-center">${getVencimentoBadge(d.dataProxTeste)}</td><td class="p-3 border-b text-left">${escapeHTML(d.localizacao || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.marca || '-')}</td><td class="p-3 border-b text-left">${t}</td><td class="p-3 border-b text-left">${escapeHTML(d.capacidade || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.capacidadeExtintora || '-')}</td><td class="p-3 border-b text-center no-print sticky right-0 bg-gray-100 z-10"><button onclick="abrirTimeline('${d.idDoc}')" class="text-blue-600 hover:text-blue-800 mx-1" title="Histórico do Equipamento"><i class="fa-solid fa-clock-rotate-left text-lg"></i></button>${gpsBtn}<button onclick="gerarQRCodeSeguro('${d.idDoc}')" class="text-gray-600 hover:text-black mx-1" title="Gerar QR Code"><i class="fa-solid fa-qrcode text-lg"></i></button>${currentTeam==='ADMIN'?`<button onclick="confirmarExclusao('${d.idDoc}', 'equipamentos')" class="text-red-600 hover:text-red-800 mx-1"><i class="fa-solid fa-trash text-lg"></i></button>`:''}</td>`; 
 return tr;
}
function renderRowMangueira(d, showChk) {
 const tr = document.createElement('tr'); 
let gpsBtn = (d.gps && d.gps.lat) ? `<a href="https://www.google.com/maps?q=${d.gps.lat},${d.gps.lng}" target="_blank" class="text-blue-600 hover:text-blue-800 mx-1" title="Localização GPS do Cadastro"><i class="fa-solid fa-map-location-dot text-lg"></i></a>` : '';

 let chkHTML = showChk ? `<td class="p-3 border-b text-center chk-col"><input type="checkbox" class="chk-man w-4 h-4" value="${d.idDoc}"></td>` : `<td class="p-3 border-b text-center chk-col hidden"></td>`;

 tr.innerHTML = `${chkHTML}<td class="p-3 border-b text-left">${formatarDataBR(d.dataInspecao)}</td><td class="p-3 border-b text-gray-900 font-bold text-left">${escapeHTML(d.unidade || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.user || '-')}</td><td class="p-3 border-b font-bold text-left">${escapeHTML(d.numero || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.localizacao || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.diametro || '-')}</td><td class="p-3 border-b font-bold text-orange-600 text-left">${escapeHTML(d.quantidade || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.dimensao || '-')}</td><td class="p-3 border-b text-left">${escapeHTML(d.tipo || '-')}</td><td class="p-3 border-b text-center">${getVencimentoBadge(d.dataProxTeste)}</td><td class="p-3 border-b text-center no-print sticky right-0 bg-gray-100 z-10"><button onclick="abrirTimeline('${d.idDoc}')" class="text-blue-600 hover:text-blue-800 mx-1" title="Histórico do Equipamento"><i class="fa-solid fa-clock-rotate-left text-lg"></i></button>${gpsBtn}<button onclick="gerarQRCodeSeguro('${d.idDoc}')" class="text-gray-600 hover:text-black mx-1" title="Gerar QR Code"><i class="fa-solid fa-qrcode text-lg"></i></button>${currentTeam==='ADMIN'?`<button onclick="confirmarExclusao('${d.idDoc}', 'equipamentos')" class="text-red-600 hover:text-red-800 mx-1"><i class="fa-solid fa-trash text-lg"></i></button>`:''}</td>`; return tr;
}

function gerarBotoesMidia(i) {
 let h = '';
 if (i.gps && i.gps.lat) h += `<a href="https://www.google.com/maps?q=${i.gps.lat},${i.gps.lng}" target="_blank" class="text-blue-600 hover:text-blue-800 mx-1" title="GPS da Inspeção"><i class="fa-solid fa-map-location-dot text-lg"></i></a>`;
 if (i.fotos && i.fotos.length > 0) h += `<button onclick='abrirGaleria(${JSON.stringify(i.fotos)})' class="text-indigo-600 hover:text-indigo-800 mx-1" title="Ver Fotos"><i class="fa-solid fa-camera text-lg"></i></button>`;
 if (i.assinatura) h += `<button onclick='abrirGaleria(["${i.assinatura}"])' class="text-gray-800 hover:text-black mx-1" title="Ver Assinatura"><i class="fa-solid fa-file-signature text-lg"></i></button>`;
 if(currentTeam === 'ADMIN') h += `<button onclick="confirmarExclusao('${i.idDoc}', 'inspecoes')" class="text-red-600 hover:text-red-800 mx-1"><i class="fa-solid fa-trash text-lg"></i></button>`;
 return h;
}
window.abrirGaleria = function(arrImgs) { const c = document.getElementById('fotoGaleriaContainer'); c.innerHTML = ''; arrImgs.forEach(b64 => { c.innerHTML += `<img src="${b64}" class="w-full h-auto rounded border border-gray-300 shadow-sm">`; }); openModal('modalViewFoto'); };

function confirmarExclusao(id, col) { 
    document.getElementById('confirmText').innerText = "Esta ação vai mover o item para a Lixeira.\nDeseja continuar?"; 
    document.getElementById('btnConfirmarAcao').onclick = () => { 
        fecharConfirm(); 
        if (window.deletarNoFirebase) window.deletarNoFirebase(col, id); 
    }; 
    document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex'); 
}

window.confirmarExclusaoUnidade = function(equipe) {
 document.getElementById('confirmText').innerHTML = `Apagar <b>toda a unidade ${escapeHTML(equipe)}</b>?<br><br>Isso moverá TODOS os equipamentos e inspeções dela para a Lixeira.`;
 document.getElementById('btnConfirmarAcao').onclick = () => { fecharConfirm(); apagarUnidadeCompleta(equipe); };
 document.getElementById('modalConfirm').classList.remove('hidden'); document.getElementById('modalConfirm').classList.add('flex');
};

window.apagarUnidadeCompleta = async function(equipe) {
 if(!window.deletarNoFirebase || currentTeam !== 'ADMIN') return;
 window.showAlert("Movendo unidade para a lixeira...", false, "Aviso");
 const eqIds = equipamentos.filter(e => e.team === equipe).map(e => e.idDoc);
 const inIds = inspecoes.filter(i => i.team === equipe).map(i => i.idDoc);
 const osIds = ordensServico.filter(o => o.team === equipe).map(o => o.idDoc);
 try {
 for(let id of eqIds) await window.deletarNoFirebase('equipamentos', id, true);
 for(let id of inIds) await window.deletarNoFirebase('inspecoes', id, true);
 for(let id of osIds) await window.deletarNoFirebase('ordens_servico', id, true);
 window.showAlert(`Unidade ${equipe} movida para a Lixeira com sucesso!`, false);
 } catch(e) {
 window.showAlert("Erro ao excluir alguns itens: " + e.message, true);
 }
};

function prepararNovoEquipamento(cat) { 
const p = cat === 'extintor' ? 'ext' : 'man'; 
document.getElementById(cat === 'extintor' ? 'formExtintor' : 'formMangueira').reset(); 
const elUnid = document.getElementById(p + 'Unidade');
 elUnid.value = currentTeam === 'ADMIN' ? '' : currentTeam;
 if (currentTeam !== 'ADMIN') { elUnid.readOnly = true; elUnid.className = "w-full p-2 border rounded text-gray-500 bg-gray-100 font-bold cursor-not-allowed"; } 
else { elUnid.readOnly = false; elUnid.className = "w-full p-2 border rounded text-gray-900"; }
 document.getElementById(p + 'GpsLat').value = ''; 
document.getElementById(p + 'GpsLng').value = ''; 
const st = document.getElementById(p + 'GpsStatus'); 
if(st) { st.innerText = "Nenhum GPS capturado."; st.classList.remove('text-green-600', 'text-red-600'); st.classList.add('text-blue-800'); } 
openModal(cat === 'extintor' ? 'modalExtintor' : 'modalMangueira'); 
}

async function salvarEquipamentoLocal(e, cat) {
 e.preventDefault(); let nE = { categoria: cat, timestamp: Date.now(), idDoc: Date.now().toString(), team: currentTeam, user: currentUser };
 const p = cat === 'extintor' ? 'ext' : 'man'; const lat = document.getElementById(p + 'GpsLat').value; const lng = document.getElementById(p + 'GpsLng').value; 
 
 if(!lat || !lng) {
    window.showAlert("A captura da localização (GPS) é obrigatória para este cadastro!", true);
    return false;
 }
 nE.gps = { lat: lat, lng: lng };
 
// --- TRAVA DE SEGURANÇA: EVITAR CADASTRO DUPLICADO EM 7 DIAS ---
 const numDig = document.getElementById(p + 'Numero').value;
 const uniDig = cat === 'extintor' ? document.getElementById('extUnidade').value : document.getElementById('manUnidade').value;
 
const duplicado = equipamentos.find(eq => eq.categoria === cat && eq.unidade === uniDig && eq.numero === numDig && (Date.now() - eq.timestamp) < 7 * 24 * 60 * 60 * 1000);
 if (duplicado) { 
window.showAlert(`Atenção: O Equipamento Nº ${numDig} já foi cadastrado nesta unidade nos últimos 7 dias!`, true); 
return false; 
}
 // -----------------------------------------------------------------

 if (cat === 'extintor') { 
    nE.dataInspecao=document.getElementById('extDataInspecao').value; 
    nE.unidade=document.getElementById('extUnidade').value; 
    nE.localizacao=document.getElementById('extLocalizacao').value; 
    nE.marca=document.getElementById('extMarca').value; 
    nE.tipo=document.getElementById('extTipo').value; 
    nE.capacidade=document.getElementById('extCapacidade').value; 
    nE.capacidadeExtintora=document.getElementById('extCapacidadeExtintora').value; 
    nE.dataUltimaRecarga=document.getElementById('extDataUltimaRecarga').value; 
    nE.dataProxTeste=document.getElementById('extDataProxTeste').value; 
    nE.numero=document.getElementById('extNumero').value; 
 } else { 
    nE.dataInspecao=document.getElementById('manDataInspecao').value; 
    nE.unidade=document.getElementById('manUnidade').value;
    nE.localizacao=document.getElementById('manLocalizacao').value; 
    nE.diametro=document.getElementById('manDiametro').value; 
    nE.quantidade=document.getElementById('manQuantidade').value; 
    nE.dimensao=document.getElementById('manDimensao').value; 
    nE.tipo=document.getElementById('manTipo').value; 
    nE.dataProxTeste=document.getElementById('manProxTeste').value; 
    nE.numero=document.getElementById('manNumero').value; 
 }
 
try { if (!window.salvarNoFirebase) throw new Error('Serviço de gravação indisponível'); const resultado=await window.salvarNoFirebase('equipamentos', nE.idDoc, nE); e.target.reset(); closeModal(cat === 'extintor' ? 'modalExtintor' : 'modalMangueira'); window.showAlert(mensagemGravacao(resultado, 'Equipamento'), resultado.status !== 'confirmado'); } catch (err) { window.showAlert('Erro ao salvar: ' + err.message, true); } return false;
}

const canvasAssinatura = document.getElementById('assinaturaCanvas'); const ctxAssinatura = canvasAssinatura.getContext('2d');
let isDrawing = false; let hasAssinatura = false;
function getPos(e) { const rect = canvasAssinatura.getBoundingClientRect(); return { x: (e.clientX || e.touches[0].clientX) - rect.left, y: (e.clientY || e.touches[0].clientY) - rect.top }; }
canvasAssinatura.addEventListener('mousedown', e => { isDrawing = true; const p = getPos(e); ctxAssinatura.beginPath(); ctxAssinatura.moveTo(p.x, p.y); });
canvasAssinatura.addEventListener('mousemove', e => { if(isDrawing){ const p = getPos(e); ctxAssinatura.lineTo(p.x, p.y); ctxAssinatura.stroke(); hasAssinatura = true; } });
canvasAssinatura.addEventListener('mouseup', () => isDrawing = false); canvasAssinatura.addEventListener('mouseout', () => isDrawing = false);
canvasAssinatura.addEventListener('touchstart', e => { e.preventDefault(); isDrawing = true; const p = getPos(e); ctxAssinatura.beginPath(); ctxAssinatura.moveTo(p.x, p.y); });
canvasAssinatura.addEventListener('touchmove', e => { e.preventDefault(); if(isDrawing){ const p = getPos(e); ctxAssinatura.lineTo(p.x, p.y); ctxAssinatura.stroke(); hasAssinatura = true; } });
canvasAssinatura.addEventListener('touchend', () => isDrawing = false);

window.limparAssinatura = function(){ ctxAssinatura.clearRect(0,0, canvasAssinatura.width, canvasAssinatura.height); hasAssinatura = false; };
function redimensionarCanvas() { canvasAssinatura.width = canvasAssinatura.offsetWidth; canvasAssinatura.height = canvasAssinatura.offsetHeight; ctxAssinatura.lineWidth = 2; ctxAssinatura.lineCap = 'round'; ctxAssinatura.strokeStyle = '#000'; }

window.capturarGPS = function(prefix = 'insp') {
 const st = document.getElementById(prefix + 'GpsStatus'); 
st.innerText = "Buscando satélites..."; 
st.classList.remove('text-blue-800', 'text-green-600', 'text-red-600'); 
st.classList.add('text-blue-800');
 
if(!navigator.geolocation) { 
st.innerText = "GPS não suportado."; 
st.classList.replace('text-blue-800', 'text-red-600'); 
return; 
}
 
navigator.geolocation.getCurrentPosition(
 p => { 
document.getElementById(prefix + 'GpsLat').value = p.coords.latitude; 
document.getElementById(prefix + 'GpsLng').value = p.coords.longitude; 
st.innerText = "Localização capturada com sucesso!"; 
st.classList.replace('text-blue-800', 'text-green-600'); 
}, 
e => { 
let msg = "Erro ao capturar GPS."; 
if(e.code === 1) {
 msg = "PERMISSÃO NEGADA!"; 
window.showAlert("Seu navegador bloqueou o acesso ao GPS!\n\nPara resolver no Celular:\n1. Clique no cadeado 🔒 na barra de endereços (lá em cima).\n2. Vá em 'Permissões' e permita a 'Localização'.\n3. Atualize a página e tente novamente.", true);
 }
 else if(e.code === 2) msg = "Sinal GPS fraco ou inativo."; 
else if(e.code === 3) msg = "Tempo esgotado."; 
st.innerText = msg; 
st.classList.replace('text-blue-800', 'text-red-600'); 
},
 { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
 );
};

window.preencherDadosInspecao = function() {
 const id = document.getElementById('inspEquipamento').value;
 const eq = equipamentos.find(e => e.idDoc === id);
 const infoDiv = document.getElementById('inspEqInfo');
 const checkContainer = document.getElementById('checklistContainer');
 const checkItems = document.getElementById('checklistItems');
 
if(eq) {
 let t = eq.tipo || '-';
 if(t === 'ClasseK') t = 'Classe K';
 else if(t === 'Agua') t = 'Água';
 else if(t === 'PoQuimico') t = 'Pó Químico';

 let det = eq.categoria === 'extintor' ? `${t} (Cap: ${eq.capacidade})` : `${t} (Dim: ${eq.dimensao})`;
 infoDiv.innerHTML = `
 <div class="text-xs text-gray-700 bg-blue-50 p-3 rounded border border-blue-200 shadow-inner">
 <p class="mb-1"><i class="fa-solid fa-location-dot text-blue-600 w-4"></i> <strong>Local:</strong> ${eq.localizacao || 'Não informado'}</p>
 <p class="mb-1"><i class="fa-solid fa-tag text-blue-600 w-4"></i> <strong>Tipo:</strong> ${det}</p>
 <div class="flex items-center space-x-4 mt-2 border-t border-blue-100 pt-2">
 <div class="flex items-center"><strong>Recarga:</strong> &nbsp;${getVencimentoRecargaBadge(eq.dataUltimaRecarga)}</div>
 <div class="flex items-center"><strong>Validade:</strong> &nbsp;${getVencimentoBadge(eq.dataProxTeste)}</div>
 </div>
 </div>
 `;
 infoDiv.classList.remove('hidden');
 
let perguntas = [];
 if(eq.categoria === 'extintor') {
 perguntas = [
 "1. O acesso ao equipamento está desobstruído?",
 "2. A sinalização está correta e visível?",
 "3. O lacre de segurança está intacto?",
 "4. Manômetro na faixa verde (pressurizado)?",
 "5. Mangote/Esguicho sem ressecamento ou danos?",
 "6. Carga e cilindro dentro da validade?"
 ];
 } else {
 perguntas = [
 "1. O acesso ao abrigo do hidrante está desobstruído?",
 "2. A sinalização (parede e solo) está correta e visível?",
 "3. Mangueiras estão aduchadas corretamente e secas?",
 "4. O esguicho e as chaves Storz estão no abrigo?",
 "5. Registro/válvula sem vazamentos ou oxidação?",
 "6. Mangueiras dentro do prazo de teste hidrostático?"
 ];
 }

 checkItems.innerHTML = perguntas.map((p, i) => `
 <div class="flex justify-between items-center border-b border-gray-200 pb-2">
 <span>${p}</span> 
<select class="check-item p-1 border rounded w-20 bg-white" required>
 <option value="" selected disabled>Selecione</option>
 <option value="Sim">Sim</option>
 <option value="Não">Não</option>
 <option value="N/A">N/A</option>
 </select>
 </div>
 `).join('');
 checkContainer.classList.remove('hidden');
 } else { 
infoDiv.innerHTML = ''; infoDiv.classList.add('hidden'); 
if(checkContainer) checkContainer.classList.add('hidden');
 }
}

window.prepararInspecaoManual = function(eqId = '') {
 const s = document.getElementById('inspEquipamento'); 
s.innerHTML = '<option value="">Selecione o Equipamento</option>';
 equipamentos.forEach(eq => { const o = document.createElement('option'); o.value = eq.idDoc; o.text = `[${eq.numero||'S/N'}] ${eq.categoria.toUpperCase()} - ${eq.localizacao||''}`; s.appendChild(o); });
 
document.getElementById('inspGpsLat').value = ''; document.getElementById('inspGpsLng').value = ''; 
const st = document.getElementById('inspGpsStatus'); st.innerText = "Nenhum GPS capturado."; st.classList.remove('text-green-600', 'text-red-600'); st.classList.add('text-blue-800');
 
const dInsp = new Date(); dInsp.setMinutes(dInsp.getMinutes() - dInsp.getTimezoneOffset());
 document.getElementById('inspData').value = dInsp.toISOString().split('T')[0];
 
document.getElementById('inspFotoCam').value = ''; document.getElementById('inspFotoGal').value = ''; document.getElementById('lblFotosSelecionadas').classList.add('hidden'); document.getElementById('inspObservacoes').value = '';
 
document.getElementById('inspEqInfo').innerHTML = ''; document.getElementById('inspEqInfo').classList.add('hidden');
 const checkCont = document.getElementById('checklistContainer');
 if (checkCont) checkCont.classList.add('hidden');

 if (eqId) { 
const cleanId = eqId.trim();
 const exists = equipamentos.some(e => e.idDoc === cleanId);
 if(exists) { s.value = cleanId; preencherDadosInspecao(); } 
else { window.showAlert("Equipamento (" + cleanId + ") não encontrado nesta unidade.", true); s.value = ''; }
 } else { s.value = ''; }
 
openModal('modalInspecao'); setTimeout(redimensionarCanvas, 200); limparAssinatura();
}

window.iniciarScanner = function() { 
document.getElementById('modalScanner').classList.add('active'); 
if(!html5QrcodeScanner) { html5QrcodeScanner = new Html5Qrcode("reader"); }
 html5QrcodeScanner.start(
 { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, 
(txt) => { fecharScanner(); prepararInspecaoManual(txt); }, 
(err) => {}
 ).catch(err => { fecharScanner(); window.showAlert("Câmera não permitida ou não encontrada.", true); }); 
};
window.fecharScanner = function() { document.getElementById('modalScanner').classList.remove('active'); if (html5QrcodeScanner) { try { html5QrcodeScanner.stop().then(() => html5QrcodeScanner.clear()).catch(e => console.log(e)); } catch(e) {} } };

window.atualizarLabelFotos = function() { const c1 = document.getElementById('inspFotoCam').files.length; const c2 = document.getElementById('inspFotoGal').files.length; const tot = c1 + c2; const lbl = document.getElementById('lblFotosSelecionadas'); if (tot > 0) { lbl.innerText = tot + " foto(s) selecionada(s) prontas para envio!"; lbl.classList.remove('hidden'); } else { lbl.classList.add('hidden'); } };

async function processarArquivosImagem(files) {
 const selecionados = Array.from(files || []);
 if (selecionados.length > 3) throw new Error('Selecione no máximo 3 fotografias.');
 return Promise.all(selecionados.map(file => new Promise((resolve, reject) => {
   if (!file.type.startsWith('image/')) return reject(new Error('Arquivo não é uma imagem: ' + file.name));
   if (file.size > 12 * 1024 * 1024) return reject(new Error('Imagem excede 12 MB: ' + file.name));
   const reader = new FileReader();
   reader.onerror = () => reject(new Error('Não foi possível ler ' + file.name));
   reader.onload = () => {
     const img = new Image();
     img.onerror = () => reject(new Error('Imagem inválida: ' + file.name));
     img.onload = () => {
       try {
         const scale = Math.min(1, 600 / Math.max(img.width, img.height));
         const cv = document.createElement('canvas');
         cv.width = Math.max(1, Math.round(img.width * scale));
         cv.height = Math.max(1, Math.round(img.height * scale));
         cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
         resolve(cv.toDataURL('image/jpeg', 0.6));
       } catch (error) { reject(error); }
     };
     img.src = reader.result;
   };
   reader.readAsDataURL(file);
 })));
}

window.salvarInspecaoLocal = async function(e) {
 e.preventDefault(); 
const btnSubmit = e.target.querySelector('button[type="submit"]');
 btnSubmit.disabled = true; btnSubmit.innerText = "Salvando...";
 
const id = document.getElementById('inspEquipamento').value; 
const eq = equipamentos.find(e => e.idDoc === id); 
if(!eq) {
 btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Finalizar Inspeção`;
 return;
 }

 // --- TRAVA DE SEGURANÇA: 7 DIAS E O.S. PENDENTE ---
 const limiteTempo = Date.now() - (7 * 24 * 60 * 60 * 1000);
 const inspsDoEq = inspecoes.filter(i => i.equipamento_id === id).sort((a,b) => b.timestamp - a.timestamp);
 if (inspsDoEq.length > 0) {
 const ultInsp = inspsDoEq[0];
 if (ultInsp.timestamp > limiteTempo) {
 if (ultInsp.status === 'Aprovado') {
 window.showAlert("Este equipamento já foi inspecionado e APROVADO nos últimos 7 dias. Não é necessário duplicar a inspeção.", true);
 btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Finalizar Inspeção`;
 return false;
 } else if (ultInsp.status === 'Reprovado') {
 const osAberta = ordensServico.find(o => o.equipamento_id === id && (o.status === 'Aberta' || o.status === 'Terceirizada'));
 if (osAberta) {
 window.showAlert("Bloqueado: Existe uma Ordem de Serviço PENDENTE ou na TERCEIRIZADA para este equipamento! Resolva o problema primeiro.", true);
 btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Finalizar Inspeção`;
 return false;
 }
 }
 }
 }
 // --------------------------------------------------

 const respostas = Array.from(document.querySelectorAll('#checklistItems .check-item'));
 if (!respostas.length || respostas.some(c => !['Sim', 'Não', 'N/A'].includes(c.value))) {
   window.showAlert('Responda todos os itens do checklist antes de finalizar.', true);
   btnSubmit.disabled = false; btnSubmit.innerText = 'Finalizar Inspeção'; return false;
 }
 // Captura a pergunta exata que foi reprovada e não apenas "Item X"
 let checksFail = []; 
 document.querySelectorAll('.check-item').forEach((el) => { 
    if(el.value === "Não") {
        let text = el.previousElementSibling.textContent || el.previousElementSibling.innerText;
        checksFail.push(text.trim()); 
    }
 });
 
 const isReprovado = checksFail.length > 0; 
 const obs = document.getElementById('inspObservacoes').value;
 
 // Cria um texto detalhado para a O.S. listando tudo que reprovou
 let motivoStr = "";
 if (isReprovado) {
    if (checksFail.length > 1) motivoStr = `Falha em ${checksFail.length} item(ns):\n`;
    motivoStr += checksFail.map(f => "• " + f).join('\n');
 }
 if (obs) {
    motivoStr += (motivoStr ? '\n\n' : '') + "Obs: " + obs;
 }

 let insp = { idDoc: (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + '_' + Math.random().toString(36).slice(2)), equipamento_id: id, categoria: eq.categoria, team: currentTeam, fiscal: currentUser, data: document.getElementById('inspData').value, unidade: eq.unidade, numero: eq.numero, localizacao: eq.localizacao, dataProxTeste: eq.dataProxTeste, timestamp: Date.now(), status: isReprovado ? 'Reprovado' : 'Aprovado', observacoes: obs, checklistFails: checksFail };
 const lat = document.getElementById('inspGpsLat').value; const lng = document.getElementById('inspGpsLng').value; 
 
 if(!lat || !lng) {
     window.showAlert("A captura da localização (GPS) é obrigatória para registrar a inspeção!", true);
     btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Finalizar Inspeção`;
     return false;
 }
 insp.gps = { lat: lat, lng: lng };
 
 if(hasAssinatura) insp.assinatura = canvasAssinatura.toDataURL();
 
const fCam = document.getElementById('inspFotoCam').files ? Array.from(document.getElementById('inspFotoCam').files) : [];
 const fGal = document.getElementById('inspFotoGal').files ? Array.from(document.getElementById('inspFotoGal').files) : [];
 const allFiles = [...fCam, ...fGal];
 let fotosCompress;
 try { fotosCompress = await processarArquivosImagem(allFiles); }
 catch (error) { window.showAlert(error.message, true); btnSubmit.disabled = false; btnSubmit.innerText = 'Finalizar Inspeção'; return false; }
 if(fotosCompress.length > 0) insp.fotos = fotosCompress;

 try {
   if (!window.salvarInspecaoComOS) throw new Error('Serviço de gravação indisponível');
   const os = isReprovado ? { idDoc: 'OS_' + insp.idDoc, inspecao_id: insp.idDoc, equipamento_id: id, numeroEquip: eq.numero, unidade: eq.unidade, dataGeracao: insp.data, motivo: motivoStr, status: 'Aberta', team: currentTeam, timestamp: Date.now() } : null;
   const resultado = await window.salvarInspecaoComOS(insp, os);
   window.showAlert(mensagemGravacao(resultado, 'Inspeção' + (os ? ' e O.S.' : '')), resultado.status !== 'confirmado');
 } catch (erro) { window.showAlert('Não foi possível registrar: ' + erro.message, true); btnSubmit.disabled=false; btnSubmit.innerText='Finalizar Inspeção'; return false; }

 e.target.reset(); closeModal('modalInspecao'); 
 if (isReprovado) {
     window.showAlert("Equipamento reprovado. A ordem de serviço foi incluída no registro (confira o status da sincronização).", true);
 } else {
     /* A confirmação de nuvem ou pendência já foi exibida acima. */
 }
btnSubmit.disabled = false; btnSubmit.innerHTML = `<i class="fa-solid fa-check mr-2"></i> Finalizar Inspeção`;
};

window.abrirModalFiltroRelatorio = function(unidade) { document.getElementById('relUnidade').value = unidade; document.getElementById('relUnidadeTexto').innerText = unidade; document.getElementById('relDataInicio').value = ''; document.getElementById('relDataFim').value = ''; document.getElementById('relTipo').value = 'Todos'; openModal('modalRelatorio'); };

function getInspecoesFiltradas() {
 const unid = document.getElementById('relUnidade').value; const dIni = document.getElementById('relDataInicio').value; const dFim = document.getElementById('relDataFim').value; const tipo = document.getElementById('relTipo').value;
 return inspecoes.filter(i => { let ok = true; if (unid && i.team !== unid) ok = false; if (dIni && i.data < dIni) ok = false; if (dFim && i.data > dFim) ok = false; if (tipo === 'Extintor' && i.categoria !== 'extintor') ok = false; if (tipo === 'Hidrante' && i.categoria !== 'mangueira') ok = false; return ok; }).sort((a, b) => new Date(a.data) - new Date(b.data));
}

function obterDataHoraFormatada() { const now = new Date(); const data = now.toLocaleDateString('pt-BR').replace(/\//g, '-'); const hora = now.toLocaleTimeString('pt-BR').replace(/:/g, '-'); return `${data}_${hora}`; }

function switchTab(tId) { 
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active')); 
    document.getElementById(tId).classList.add('active'); 
    
    // Zera a memória de navegação de todas as abas para voltar para as Unidades
    window.activeTableView = { ext: null, man: null, insp: null, os: null };
    atualizarTabelas(); // Força as tabelas a voltarem pro estado inicial
    
    if(tId === 'dashboard') atualizarDashboard(); 
    if(tId === 'mapa') setTimeout(() => { if(frotaMap) frotaMap.invalidateSize(); renderizarMapa(); }, 200);
    document.getElementById('pageTitle').innerText = tId === 'unidades' ? 'Região' : (tId === 'mapa' ? 'Mapa' : tId.charAt(0).toUpperCase() + tId.slice(1)); 
    if(window.innerWidth < 768) toggleSidebar(); 
}

function toggleSidebar() { const sb = document.getElementById('sidebar'); if (sb.classList.contains('-translate-x-full')) { sb.classList.remove('-translate-x-full'); } else { sb.classList.add('-translate-x-full'); } }
window.showAlert = function(msg, isError = false, customTitle = null) { document.getElementById('customAlertTitle').innerText = customTitle ? customTitle : (isError ? "Erro" : "Sucesso"); document.getElementById('customAlertTitle').className = isError ? "text-lg font-bold mb-2 text-red-600" : "text-lg font-bold mb-2 text-green-600"; document.getElementById('customAlertText').innerText = msg; document.getElementById('customAlertButton').className = isError ? "bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 w-full font-bold" : "bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 w-full font-bold"; document.getElementById('customAlertModal').classList.remove('hidden'); document.getElementById('customAlertModal').classList.add('flex'); };
window.fecharCustomAlert = function() { document.getElementById('customAlertModal').classList.add('hidden'); document.getElementById('customAlertModal').classList.remove('flex'); };
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

window.gerarQRCodeSeguro = function(id) { 
document.getElementById('qrCodeContainer').innerHTML = ''; 
new QRCode(document.getElementById('qrCodeContainer'), { text: id, width: 220, height: 220, colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H }); 

const eq = equipamentos.find(e => e.idDoc === id);
 let tituloQRC = "QR CODE";
 if (eq && eq.numero) { tituloQRC = "Nº " + eq.numero.split(' ')[0]; }
 
document.getElementById('qrTitle').innerText = tituloQRC; 
openModal('modalViewQR'); 
};

window.atualizarVisaoDaEquipe = function() { 
    if(!currentTeam) return; 
    
    // Atualiza label do ultimo backup
    const ultBkp = localStorage.getItem('firesys_ultimo_backup');
    const lblBkp = document.getElementById('lblUltimoBackup');
    if (lblBkp) lblBkp.innerText = ultBkp ? ultBkp.replace('_', ' às ') : 'Nunca realizado neste dispositivo';
    
    // Filtro de Lixeira para ocultar os itens "apagados" das tabelas normais
    let allEq = window.allEquipamentosNuvem || [];
    let allIn = window.allInspecoesNuvem || [];
    let allOs = window.allOsNuvem || [];

    let ativosEq = allEq.filter(e => !e.deleted);
    let ativosIn = allIn.filter(e => !e.deleted);
    let ativosOs = allOs.filter(e => !e.deleted);

    lixeiraItens = [
        ...allEq.filter(e => e.deleted).map(e => ({...e, _col: 'equipamentos', _tipo: e.categoria})),
        ...allIn.filter(e => e.deleted).map(e => ({...e, _col: 'inspecoes', _tipo: 'inspeção'})),
        ...allOs.filter(e => e.deleted).map(e => ({...e, _col: 'ordens_servico', _tipo: 'ordem de serviço'}))
    ].sort((a,b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    
    if (currentTeam === 'ADMIN') { 
        equipamentos = ativosEq; inspecoes = ativosIn; ordensServico = ativosOs; 
    } else { 
        equipamentos = ativosEq.filter(e => e.team === currentTeam); 
        inspecoes = ativosIn.filter(i => i.team === currentTeam); 
        ordensServico = ativosOs.filter(o => o.team === currentTeam); 
    } 
    atualizarTabelas();
    if(window.renderizarUsuarios) window.renderizarUsuarios();
};

let sincronizacaoEmCurso = false;
function updateSyncStatus() {
 const st = document.getElementById('statusSync'); if (!st) return;
 if (!navigator.onLine) st.textContent = `Offline (${filaOffline.length} pendentes)`;
 else if (filaOffline.length) st.textContent = `Pendente de sincronização (${filaOffline.length})`;
 else st.textContent = 'Sem alterações pendentes (verifique conexão Firebase)';
}
async function flushFilaOffline() {
 if (sincronizacaoEmCurso || !navigator.onLine || !window.firebaseUser || !window.salvarNoFirebaseDireto) { updateSyncStatus(); return; }
 sincronizacaoEmCurso = true;
 try {
   while (filaOffline.length) {
     const item = filaOffline[0];
     try { await window.salvarItemPendenteDireto(item); }
     catch (error) { console.error('Falha ao sincronizar', error); window.showAlert('Sincronização pendente: ' + error.message, true); break; }
     filaOffline.shift();
     localStorage.setItem('firesys_offline_queue', JSON.stringify(filaOffline));
   }
 } finally { sincronizacaoEmCurso = false; updateSyncStatus(); }
}
