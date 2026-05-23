/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  FileSignature, 
  Bot, 
  Layers, 
  Briefcase, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  Clock, 
  Activity,
  User,
  ShieldCheck,
  RefreshCw,
  Bell,
  ClipboardCheck,
  Settings
} from 'lucide-react';

import { Policial, Documento, Template, AssinaturaMembro, OperacaoPM, LogPM, DashboardStats, UserRole, DocumentCategory } from './types';

// Import our modular custom components
import DiscordAuthSim from './components/DiscordAuthSim';
import Dashboard from './components/Dashboard';
import PolicemanManager from './components/PolicemanManager';
import DocumentGenerator from './components/DocumentGenerator';
import AiDocumentAssistant from './components/AiDocumentAssistant';
import TemplateManager from './components/TemplateManager';
import SignatureStamps from './components/SignatureStamps';
import SettingsManager from './components/SettingsManager';

// RSO Components
import RsoFormPublic from './components/RsoFormPublic';
import RsoManager from './components/RsoManager';

// Recruitment PM Modulo
import RecrutamentoManager from './components/RecrutamentoManager';

export default function App() {
  // Check if we started on public RSO link directly
  const [isRsoFormActive, setIsRsoFormActive] = useState<boolean>(() => {
    return window.location.pathname === '/rso' || 
           window.location.pathname === '/rso/preencher' || 
           window.location.hash === '#/rso' || 
           window.location.hash === '#/rso/preencher';
  });

  // Check if we started on public recruitment portal (Edital)
  const [isEditalActive, setIsEditalActive] = useState<boolean>(() => {
    return window.location.pathname === '/edital' || 
           window.location.pathname.startsWith('/edital/') || 
           window.location.hash === '#/edital' || 
           window.location.hash.startsWith('#/edital/');
  });

  // Session Authentication state
  const [currentUser, setCurrentUser] = useState<Policial | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Praca');

  // Nav Tabs selection
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'POLICIAIS' | 'GERADOR' | 'ASSISTENTE' | 'TEMPLATES' | 'ASSINATURAS' | 'RSO' | 'CONFIGURACOES' | 'RECRUTAMENTO'>('DASHBOARD');

  // Database State hooks
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assinaturas, setAssinaturas] = useState<AssinaturaMembro[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoPM[]>([]);
  const [logs, setLogs] = useState<LogPM[]>([]);
  const [batalhaoConfig, setBatalhaoConfig] = useState<any>({
    nome: "18º Batalhão de Polícia Militar Metropolitano",
    sigla: "18º BPM/M",
    secretaria: "SECRETARIA DE SEGURANÇA PÚBLICA",
    pmesp: "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO",
    endereco: "Av. Deputado Cantídio Sampaio, 1234 - São Paulo/SP",
    slogan: "Sentinela da Zona Norte - Preservando a Ordem, Protegendo a Vida",
    logoUrl: "",
    webhookGeral: "",
    webhookRso: "",
    webhookLogs: ""
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalPoliciais: 0,
    totalDocumentos: 0,
    totalAssinados: 0,
    totalRascunhos: 0,
    promocoesMes: 0,
    sindicanciasAtivas: 0,
    advertenciasAno: 0,
    operacoesAtivas: 0
  });

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Selected Document reference for Generator quick-open
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Time tracker for PMESP institutional clocks
  const [currentTime, setCurrentTime] = useState(new Date());

  // Tick clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch full dataset from API triggers
  const refreshAllData = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const [polRes, docRes, tempRes, assRes, opRes, logsRes, statsRes, configRes] = await Promise.all([
        fetch('/api/policiais'),
        fetch('/api/documentos'),
        fetch('/api/templates'),
        fetch('/api/assinaturas'),
        fetch('/api/operacoes'),
        fetch('/api/logs'),
        fetch('/api/stats'),
        fetch('/api/config')
      ]);

      if (!polRes.ok || !docRes.ok || !tempRes.ok || !statsRes.ok) {
        throw new Error('Falha tática na sincronização das tabelas administrativas com o servidor.');
      }

      const [polData, docData, tempData, assData, opData, logsData, statsData, configData] = await Promise.all([
        polRes.json(),
        docRes.json(),
        tempRes.json(),
        assRes.json(),
        opRes.json(),
        logsRes.json(),
        statsRes.json(),
        configRes.ok ? configRes.json() : Promise.resolve({})
      ]);

      setPoliciais(polData);
      setDocumentos(docData);
      setTemplates(tempData);
      setAssinaturas(assData);
      setOperacoes(opData);
      setLogs(logsData);
      setStats(statsData);
      if (configData && configData.sigla) {
        setBatalhaoConfig(configData);
      }
    } catch (e: any) {
      console.error(e);
      setApiError(e.message || 'Erro de conexão com o painel militar.');
    } finally {
      setLoading(false);
    }
  };

  // Perform full synchrony on startup
  useEffect(() => {
    refreshAllData();
  }, []);

  // Sync current user role changes or auto log database sessions
  const handleLogin = async (user: Policial, role: UserRole) => {
    setCurrentUser(user);
    setUserRole(role);
    
    // Auto sync dashboard triggers
    refreshAllData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRole('Praca');
    setActiveTab('DASHBOARD');
  };

  // --- Database Action Triggers ---

  const handleAddPolicial = async (polData: Omit<Policial, 'id'>) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando';
      const response = await fetch(`/api/policiais?user=${encodeURIComponent(queryUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(polData)
      });
      if (!response.ok) throw new Error('Não foi possível registrar PM.');
      
      refreshAllData();
    } catch (e) {
      alert('Erro ao cadastrar policial militar: ' + e);
    }
  };

  const handleUpdatePolicial = async (id: string, updates: Partial<Policial>) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando';
      const response = await fetch(`/api/policiais/${id}?user=${encodeURIComponent(queryUser)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Falha ao atualizar dados funcionais.');
      
      refreshAllData();
    } catch (e) {
      alert('Erro ao atualizar policial: ' + e);
    }
  };

  const handleSaveDocument = async (docPayload: any) => {
    try {
      const isEdit = !!docPayload.id;
      const url = isEdit ? `/api/documentos/${docPayload.id}` : '/api/documentos';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url + (currentUser ? `?user=${encodeURIComponent(currentUser.patente + ' ' + currentUser.nome)}` : ''), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docPayload,
          autor: docPayload.autor || {
            nome: currentUser?.nome || 'Operador',
            rg: currentUser?.rg || 'PM-99.999',
            patente: currentUser?.patente || 'Sd PM'
          }
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro operacional salvando documento.');
      }

      refreshAllData();
    } catch (e: any) {
      alert(e.message || 'Erro ao gravar documento.');
    }
  };

  const handleSignDocument = async (docId: string, signMembro: AssinaturaMembro) => {
    try {
      const response = await fetch(`/api/documentos/${docId}/assinar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assinaturaId: signMembro.id,
          signatarioNome: signMembro.nome,
          signatarioPatente: signMembro.patente
        })
      });

      if (!response.ok) throw new Error('Falha tática ao aplicar assinatura digital militar.');
      refreshAllData();
    } catch (e) {
      alert('Erro ao assinar documento: ' + e);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Administrador';
      const response = await fetch(`/api/documentos/${docId}?user=${encodeURIComponent(queryUser)}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao reverter rascunho.');
      }
      refreshAllData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddTemplate = async (templateData: any) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando';
      const response = await fetch(`/api/templates?user=${encodeURIComponent(queryUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
      if (!response.ok) throw new Error('Não foi possível gravar modelo regimental.');
      refreshAllData();
    } catch (e) {
      alert('Erro ao gravar template: ' + e);
    }
  };

  const handleUpdateTemplate = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Não foi possível atualizar o modelo.');
      refreshAllData();
    } catch (e) {
      alert('Erro ao atualizar modelo: ' + e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando';
      const response = await fetch(`/api/templates/${id}?user=${encodeURIComponent(queryUser)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Não foi possível excluir o modelo.');
      refreshAllData();
    } catch (e) {
      alert('Erro ao deletar modelo: ' + e);
    }
  };

  const handleAddAssinatura = async (assData: any) => {
    try {
      const queryUser = currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando';
      const response = await fetch(`/api/assinaturas?user=${encodeURIComponent(queryUser)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assData)
      });
      if (!response.ok) throw new Error('Não foi possível obter credencial de chancela.');
      refreshAllData();
    } catch (e) {
      alert('Erro ao salvar assinatura: ' + e);
    }
  };

  // UI trigger to quick load document in composer
  const handleOpenDocInGenerator = (id: string) => {
    setSelectedDocId(id);
    setActiveTab('GERADOR');
  };

  // Assistente trigger that imports formatted model straight into composer
  const handleImportGenDoc = (doc: { titulo: string; tipo: string; categoria: DocumentCategory; conteudo: string }) => {
    // Generate simulated id to distinguish as temporary
    handleSaveDocument({
      titulo: doc.titulo,
      tipo: doc.tipo,
      categoria: doc.categoria,
      conteudo: doc.conteudo,
      status: 'Rascunho'
    });
    alert('✓ Minuta gerada pela IA importada com sucesso no Gerador de Expedientes!');
    setActiveTab('GERADOR');
  };

  // If public RSO path is requested, go directly to form
  if (isRsoFormActive) {
    return (
      <RsoFormPublic 
        onBackToLogin={() => {
          setIsRsoFormActive(false);
          // Standard cleanup of URL representation
          if (window.location.pathname.startsWith('/rso') || window.location.hash.includes('rso')) {
            window.history.pushState(null, '', '/');
          }
        }} 
      />
    );
  }

  // If public recruitment path is requested, go directly to edital portal
  if (isEditalActive) {
    return (
      <div className="min-h-screen bg-[#060a12] p-4 md:p-8">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-[#0a101b] border border-slate-900 rounded-xl px-5 py-3 shadow">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-500 font-mono tracking-widest leading-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              SALA SELETIVA CENTRAL PMESP
            </span>
            <button
              onClick={() => {
                setIsEditalActive(false);
                if (window.location.pathname.startsWith('/edital') || window.location.hash.includes('edital')) {
                  window.history.pushState(null, '', '/');
                }
              }}
              className="text-[10px] text-slate-400 hover:text-slate-200 font-mono cursor-pointer underline decoration-dotted"
            >
              Portal Interno do Batalhão
            </button>
          </div>
          <RecrutamentoManager 
            userRole="Praca" 
            currentUserNome="Candidato" 
            batalhaoConfig={batalhaoConfig} 
          />
        </div>
      </div>
    );
  }

  // State: Guard login simulated redirection
  if (!currentUser) {
    return (
      <DiscordAuthSim 
        onLogin={handleLogin} 
        availablePoliciais={policiais.length > 0 ? policiais : []} 
        onGoToRsoForm={() => setIsRsoFormActive(true)}
        onGoToEdital={() => setIsEditalActive(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col md:flex-row font-sans relative selection:bg-blue-600/30">
      
      {/* Visual Ambient Background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-950/15 blur-[120px] pointer-events-none" />

      {/* LEFT COLUMN: Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0a101b] border-r border-slate-900 flex flex-col justify-between shrink-0 relative z-20 md:h-screen sticky top-0">
        
        {/* Superior Insitution Signature Logo */}
        <div className="p-5 border-b border-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-gradient-to-b from-blue-950 to-[#0e1624] border border-amber-500/30 flex items-center justify-center p-1 font-mono font-bold text-amber-500 shrink-0 shadow">
              {batalhaoConfig.logoUrl ? (
                <img src={batalhaoConfig.logoUrl} className="w-full h-full object-contain" alt="Emblema" referrerPolicy="no-referrer" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight block truncate max-w-[135px]" title={batalhaoConfig.nome}>
                {batalhaoConfig.sigla || "18º BPM/M"}
              </h2>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mt-0.5">SISTEMA POLICIAL MILITAR</span>
            </div>
          </div>
          
          {/* Institutional clock */}
          <div className="mt-4 bg-[#060a12] p-2.5 rounded border border-slate-800/40 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Hora Local SP:</span>
            </div>
            <span className="text-slate-200">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Dynamic Nav Menu buttons */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest pl-2 block mb-2">Painéis Administrativos</span>
          
          {/* Item 1: Dashboard */}
          <button
            onClick={() => { setActiveTab('DASHBOARD'); setSelectedDocId(null); }}
            className={`w-full flex items-center gap-3.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'DASHBOARD' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Mesa de Trabalho</span>
          </button>

          {/* Item: Auditoria RSO */}
          <button
            onClick={() => { setActiveTab('RSO'); setSelectedDocId(null); }}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'RSO' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ClipboardCheck className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Auditoria RSO (CGP/CFP)</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Painel do Comando" />
          </button>

          {/* Item 2: Policiais */}
          <button
            onClick={() => setActiveTab('POLICIAIS')}
            className={`w-full flex items-center gap-3.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'POLICIAIS' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Diretório de Policiais</span>
          </button>

          {/* Item 3: Document Generator */}
          <button
            onClick={() => setActiveTab('GERADOR')}
            className={`w-full flex items-center gap-3.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'GERADOR' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <FileSignature className="w-4 h-4 shrink-0" />
            <span>Gerador de Expedientes</span>
          </button>

          {/* Item 4: AI Intelligent Assistant */}
          <button
            onClick={() => setActiveTab('ASSISTENTE')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'ASSISTENTE' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bot className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Gerador Inteligente IA</span>
            </div>
            <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold px-1.5 rounded animate-pulse shrink-0">Gemini</span>
          </button>

          {/* Item 5: Templates list */}
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`w-full flex items-center gap-3.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'TEMPLATES' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Biblioteca de Modelos</span>
          </button>

          {/* Item 6: Chancelarias / Signatures */}
          <button
            onClick={() => setActiveTab('ASSINATURAS')}
            className={`w-full flex items-center gap-3.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'ASSINATURAS' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Chancelas Digitais</span>
          </button>

          {/* Item 6.5: Edital e Recrutamento */}
          <button
            onClick={() => setActiveTab('RECRUTAMENTO')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'RECRUTAMENTO' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Edital e Recrutamento</span>
            </div>
            {['Comandante', 'Subcomandante', 'Estado-Maior'].includes(userRole) && (
              <span className="bg-blue-500/10 text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase">Adm</span>
            )}
          </button>

          {/* Item 7: Configurações do Batalhão */}
          <button
            onClick={() => setActiveTab('CONFIGURACOES')}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              activeTab === 'CONFIGURACOES' 
                ? 'bg-blue-600 border-blue-500/30 text-white shadow shadow-blue-600/10' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Settings className="w-4 h-4 shrink-0 animate-spin-slow" />
              <span>Configurações</span>
            </div>
            {userRole === 'Comandante' && (
              <span className="bg-amber-500 text-slate-950 font-mono text-[8px] font-extrabold px-1 py-0.5 rounded scale-95 uppercase tracking-wide">Comando</span>
            )}
          </button>
        </nav>

        {/* INFERIOR: Logged Account Display */}
        <div className="p-4 border-t border-slate-900/80 bg-[#060a11]/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-amber-500 block leading-tight font-mono">{userRole}</span>
              <span className="text-[11px] font-semibold text-slate-200 block truncate leading-tight mt-0.5" title={currentUser.nome}>
                {currentUser.nome.split(' ')[0]} {currentUser.nome.split(' ').pop()}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block leading-none">RG: {currentUser.rg}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-[10px] font-bold py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Desconectar RP</span>
          </button>
        </div>

      </aside>

      {/* RIGHT COLUMN: Scrolling Core Content Shell */}
      <main className="flex-1 overflow-y-auto relative z-10 p-5 md:p-8 space-y-6 md:h-screen">
        
        {/* Top Operational Status Belt */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a101b]/70 border border-slate-800 rounded-xl px-5 py-3 gap-2 backdrop-blur-sm shadow shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[10px] text-slate-400 font-mono">SISTEMA INTEGRADO DE DOCUMENTAÇÃO DE SÃO PAULO</span>
          </div>

          <div className="flex gap-4 text-[10px] font-mono text-slate-400">
            <span>Sessão: {userRole.toUpperCase()}</span>
            <span>•</span>
            <button 
              onClick={refreshAllData}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer shrink-0 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 px-2 py-0.5 rounded"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sincronizar Banco</span>
            </button>
          </div>
        </section>

        {/* Global Loading screens and error readouts */}
        {loading && (
          <div className="bg-[#0b1322] border border-slate-850 p-6 rounded-xl flex items-center justify-center gap-3 shadow">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
            <span className="text-xs text-slate-400 font-mono">Processando requisições com o banco de dados local...</span>
          </div>
        )}

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-2 leading-relaxed">
            <span className="font-bold">⚠️ Falha no Servidor:</span>
            <span>{apiError} (Verifique se executou npm install e as portas locais estão abertas).</span>
          </div>
        )}

        {/* TAB RENDERING ROUTER CASE */}
        {!loading && (
          <div className="min-h-[500px]">
            {activeTab === 'DASHBOARD' && (
              <Dashboard 
                stats={stats}
                policiais={policiais}
                documentos={documentos}
                operacoes={operacoes}
                logs={logs}
                onCreateDocument={() => { setActiveTab('GERADOR'); setSelectedDocId(null); }}
                onViewDocument={handleOpenDocInGenerator}
              />
            )}

            {activeTab === 'RSO' && (
              <RsoManager 
                userRole={userRole}
                currentUserNome={currentUser?.nome || 'Operador'}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'POLICIAIS' && (
              <PolicemanManager 
                policiais={policiais}
                userRole={userRole}
                onAddPolicial={handleAddPolicial}
                onUpdatePolicial={handleUpdatePolicial}
              />
            )}

            {activeTab === 'GERADOR' && (
              <DocumentGenerator 
                initialTemplates={templates}
                initialAssinaturas={assinaturas}
                activeUser={currentUser}
                documents={documentos}
                onSaveDocument={handleSaveDocument}
                onSignDocument={handleSignDocument}
                onDeleteDocument={handleDeleteDocument}
                selectedDocId={selectedDocId}
                clearSelectedDoc={() => setSelectedDocId(null)}
                batalhaoConfig={batalhaoConfig}
              />
            )}

            {activeTab === 'ASSISTENTE' && (
              <AiDocumentAssistant 
                activeUser={currentUser}
                onImportGeneratedDocument={handleImportGenDoc}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'TEMPLATES' && (
              <TemplateManager 
                templates={templates}
                userRole={userRole}
                onAddTemplate={handleAddTemplate}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />
            )}

            {activeTab === 'ASSINATURAS' && (
              <SignatureStamps 
                assinaturas={assinaturas}
                userRole={userRole}
                onAddAssinatura={handleAddAssinatura}
              />
            )}

            {activeTab === 'CONFIGURACOES' && (
              <SettingsManager 
                userRole={userRole}
                currentUserNome={currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando'}
                onRefreshData={refreshAllData}
                onGoToRsoForm={() => setIsRsoFormActive(true)}
                onGoToEdital={() => setIsEditalActive(true)}
              />
            )}

            {activeTab === 'RECRUTAMENTO' && (
              <RecrutamentoManager 
                userRole={userRole}
                currentUserNome={currentUser ? `${currentUser.patente} ${currentUser.nome}` : 'Comando'}
                batalhaoConfig={batalhaoConfig}
                onRefreshData={refreshAllData}
              />
            )}
          </div>
        )}

      </main>

    </div>
  );
}
