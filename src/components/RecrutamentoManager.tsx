import React, { useState, useEffect } from 'react';
import {
  Award,
  FileText,
  CheckCircle,
  XCircle,
  UserCheck,
  Users,
  Hourglass,
  Clock,
  Plus,
  Trash,
  Edit,
  BookOpen,
  Search,
  Download,
  MapPin,
  Calendar,
  ChevronRight,
  GraduationCap,
  Printer,
  ArrowLeft,
  AlertTriangle,
  Settings,
  HelpCircle,
  PrinterIcon,
  Filter,
  Check,
  Play
} from 'lucide-react';

interface Edital {
  id: string;
  numero: string;
  titulo: string;
  dataPublicacao: string;
  dataInicio: string;
  requisitos: string[];
  etapas: string[];
  criteriosAprovacao: string;
  cronograma: { evento: string; data: string }[];
  observacoes: string;
  tempoLimiteProvas?: number | string;
  ativo: boolean;
}

interface Inscricao {
  id: string;
  protocolo: string;
  nome: string;
  discordId: string;
  idade: number;
  cidade: string;
  horario: string;
  experiencia: string;
  motivacao: string;
  status: string; // Pendente, Aprovado Prova, Reprovado Prova, Convocado, Aprovado, Reprovado
  dataInscricao: string;
}

interface Questao {
  id: string;
  categoria: string;
  pergunta: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correta: string;
}

interface Resultado {
  id: string;
  protocolo: string;
  nomeCompleto: string;
  discordId: string;
  totalAcertos: number;
  percentual: number;
  situacao: 'APROVADO' | 'REPROVADO';
  analiseRespostas: {
    qId: string;
    pergunta: string;
    userAns: string;
    correctAns: string;
    correct: boolean;
  }[];
  dataConclusao: string;
}

interface Convocation {
  id: string;
  protocolo: string;
  nomeCandidato: string;
  dataHora: string;
  local: string;
  instrucoes: string;
  responsavelSign: string;
  dataConvocacao: string;
}

interface RecrutamentoManagerProps {
  userRole: string; // Comandante, Subcomandante, Estado-Maior, Oficial, Praca
  currentUserNome: string;
  batalhaoConfig: any;
  onRefreshData?: () => void;
  initialPublicPath?: string; // used to override starting view
}

export default function RecrutamentoManager({
  userRole,
  currentUserNome,
  batalhaoConfig,
  onRefreshData,
  initialPublicPath
}: RecrutamentoManagerProps) {
  const siglaBTM = batalhaoConfig?.sigla || '18º BPM/M';

  // Navigation internal state
  const [isAdminView, setIsAdminView] = useState(false);
  const [publicView, setPublicView] = useState<'edital' | 'inscricao' | 'prova' | 'resultado'>('edital');
  const [adminTab, setAdminTab] = useState<'inscricoes' | 'provas' | 'questoes' | 'configuracoes'>('inscricoes');

  // Database states
  const [edital, setEdital] = useState<Edital | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [convocacoes, setConvocacoes] = useState<Convocation[]>([]);
  
  // Interface/Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search/Filters
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  // Candidate process States
  const [candidateProtocol, setCandidateProtocol] = useState('');
  const [isAuthenticatedCandidate, setIsAuthenticatedCandidate] = useState<Inscricao | null>(null);
  
  // Prova Execution States
  const [activeProofQuestions, setActiveProofQuestions] = useState<Questao[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [proofTimeRemaining, setProofTimeRemaining] = useState(0); // in seconds
  const [isProofRunning, setIsProofRunning] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [completedResult, setCompletedResult] = useState<Resultado | null>(null);

  // Administrative / Editing Modals & Forms
  const [editingQuestion, setEditingQuestion] = useState<Questao | null>(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Questao>>({
    categoria: 'Doutrina Policial',
    pergunta: '',
    alternativas: { A: '', B: '', C: '', D: '' },
    correta: 'A'
  });

  // Convocation Modal Form State
  const [convokingCandidate, setConvokingCandidate] = useState<Inscricao | null>(null);
  const [convocationForm, setConvocationForm] = useState({
    dataHora: '',
    local: '',
    instrucoes: ''
  });

  // PDF Preview Modal
  const [printDocument, setPrintDocument] = useState<{
    titulo: string;
    numero?: string;
    conteudo: string;
    tipo: 'edital' | 'comprovante' | 'resultado' | 'convocacao';
    metadata?: any;
  } | null>(null);

  // Authorisations check
  const hasAdminPermission = ['Comandante', 'Subcomandante', 'Estado-Maior'].includes(userRole);

  const bannerColor = "bg-[#0a111e] border-[#1e293b]";

  // Detect URL on boot to route public view correctly
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = initialPublicPath || window.location.pathname || window.location.hash;
      if (path.includes('/prova') || path.includes('#/edital/prova')) {
        setPublicView('prova');
      } else if (path.includes('/resultado') || path.includes('#/edital/resultado')) {
        setPublicView('resultado');
      } else if (path.includes('/inscricao') || path.includes('#/edital/inscricao')) {
        setPublicView('inscricao');
      } else {
        setPublicView('edital');
      }
    };
    handleUrlRoute();
  }, [initialPublicPath]);

  // Load Recruitment Data
  const loadRecruitmentData = async () => {
    try {
      setLoading(true);
      const resConf = await fetch('/api/recrutamento/config');
      if (resConf.ok) {
        const payload = await resConf.json();
        if (payload.edital) setEdital(payload.edital);
      }

      const [resIns, resQue, resRes, resCon] = await Promise.all([
        fetch('/api/recrutamento/inscricoes'),
        fetch('/api/recrutamento/questoes'),
        fetch('/api/recrutamento/resultados'),
        fetch('/api/recrutamento/convocacoes')
      ]);

      if (resIns.ok) setInscricoes(await resIns.json());
      if (resQue.ok) setQuestoes(await resQue.json());
      if (resRes.ok) setResultados(await resRes.json());
      if (resCon.ok) setConvocacoes(await resCon.json());

    } catch (e) {
      console.error('Erro ao baixar parâmetros de recrutamento:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecruitmentData();
  }, []);

  // Sync Timer for Active Proof
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProofRunning && proofTimeRemaining > 0) {
      timer = setInterval(() => {
        setProofTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Auto submit
            handleAutoSubmitProof();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (proofTimeRemaining === 0 && isProofRunning) {
      handleAutoSubmitProof();
    }
    return () => clearInterval(timer);
  }, [isProofRunning, proofTimeRemaining]);

  const triggerSearchCandidate = async (ident: string) => {
    if (!ident.trim()) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/recrutamento/inscricao/${encodeURIComponent(ident.trim())}`);
      if (res.ok) {
        const candidateData = await res.json();
        setIsAuthenticatedCandidate(candidateData);
        setMessage(null);
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Candidato não localizado.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Conexão falhou.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartProof = async (ident: string) => {
    if (!ident.trim()) {
      setMessage({ type: 'error', text: 'Informe seu Protocolo ou ID Discord para ingressar no certame.' });
      return;
    }
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch('/api/recrutamento/prova/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: ident.trim() })
      });

      if (res.ok) {
        const payload = await res.json();
        setIsAuthenticatedCandidate(payload.candidato);
        setActiveProofQuestions(payload.questoes);
        setProofTimeRemaining(payload.limiteMinutos * 60);
        setSelectedAnswers({});
        setCurrentQuestionIdx(0);
        setIsProofRunning(true);
      } else {
        const errorData = await res.json();
        setMessage({ type: 'error', text: errorData.error || 'Não foi possível autorizar início de prova.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Erro de comunicação.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitProofAnswers = async () => {
    if (!isAuthenticatedCandidate) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/recrutamento/prova/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolo: isAuthenticatedCandidate.protocolo,
          respostas: selectedAnswers
        })
      });

      if (res.ok) {
        const resultPayload: Resultado = await res.json();
        setCompletedResult(resultPayload);
        setIsProofRunning(false);
        // Refresh local listings
        loadRecruitmentData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        alert(err.error || 'Falha ao registrar gabarito.');
      }
    } catch (e) {
      alert('Erro ao enviar suas respostas.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoSubmitProof = () => {
    alert('⏱️ O tempo limite esgotou-se! Suas respostas arquivadas até o momento serão enviadas para correção automática.');
    handleSubmitProofAnswers();
  };

  // 1. Candidate registration
  const [regForm, setRegForm] = useState({
    nome: '',
    discordId: '',
    idade: '',
    cidade: '',
    horario: 'Diurno (08h às 18h)',
    experiencia: 'Nenhuma',
    motivacao: ''
  });
  const [registeredProtocol, setRegisteredProtocol] = useState<string | null>(null);

  const handleRegisterCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.nome || !regForm.discordId || !regForm.idade || !regForm.cidade || !regForm.motivacao) {
      setMessage({ type: 'error', text: 'Preencha integralmente todas as exigências regimentais do formulário.' });
      return;
    }

    try {
      setSavingState(true);
      setMessage(null);
      const res = await fetch('/api/recrutamento/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      if (res.ok) {
        const payload = await res.json();
        setRegisteredProtocol(payload.protocolo);
        setMessage({ type: 'success', text: `Inscrição homologada com absoluto sucesso! Prot: ${payload.protocolo}` });
        setRegForm({ nome: '', discordId: '', idade: '', cidade: '', horario: 'Diurno', experiencia: 'Nenhuma', motivacao: '' });
        loadRecruitmentData();
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Inscrição recusada pelo sistema.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Serviço central de inscrição indisponível.' });
    } finally {
      setSavingState(false);
    }
  };

  const [savingState, setSavingState] = useState(false);

  // Question CRUD Handlers
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.pergunta || !newQuestion.alternativas?.A || !newQuestion.alternativas?.B || !newQuestion.alternativas?.C || !newQuestion.alternativas?.D) {
      alert('Preencha a pergunta e todas as 4 alternativas!');
      return;
    }
    try {
      setActionLoading(true);
      const url = editingQuestion ? `/api/recrutamento/questoes/${editingQuestion.id}` : '/api/recrutamento/questoes';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });

      if (res.ok) {
        setIsQuestionFormOpen(false);
        setEditingQuestion(null);
        setNewQuestion({ categoria: 'Doutrina Policial', pergunta: '', alternativas: { A: '', B: '', C: '', D: '' }, correta: 'A' });
        loadRecruitmentData();
      } else {
        alert('Falha ao salvar questão.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Deseja excluir permanentemente esta questão do repositório? (Operação irreversível)')) return;
    try {
      const res = await fetch(`/api/recrutamento/questoes/${qId}`, { method: 'DELETE' });
      if (res.ok) {
        loadRecruitmentData();
      } else {
        alert('Erro ao excluir questão.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Administrator Cand Status Changer
  const handleUpdateCandidateStatus = async (insId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/recrutamento/inscricao/${insId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadRecruitmentData();
        if (onRefreshData) onRefreshData();
      } else {
        alert('Não foi possível alterar o status do candidato.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Administrative Scheduler Convocation
  const handleScheduleConvocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convokingCandidate) return;
    if (!convocationForm.dataHora || !convocationForm.local) {
      alert('Forneça local de comparecimento e data/horário oficial.');
      return;
    }

    try {
      setActionLoading(true);
      // Construct Convocation
      const res = await fetch('/api/recrutamento/convocacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolo: convokingCandidate.protocolo,
          nomeCandidato: convokingCandidate.nome,
          dataHora: convocationForm.dataHora,
          local: convocationForm.local,
          instrucoes: convocationForm.instrucoes || 'Comparecer munido de Documento de Identidade original com foto no horário reservado.',
          responsavelSign: currentUserNome
        })
      });

      if (res.ok) {
        // Update Candidate Status directly to 'Convocado'
        const updateRes = await fetch(`/api/recrutamento/inscricao/${convokingCandidate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Convocado' })
        });

        if (updateRes.ok) {
          setConvokingCandidate(null);
          setConvocationForm({ dataHora: '', local: '', instrucoes: '' });
          loadRecruitmentData();
          if (onRefreshData) onRefreshData();
          alert('Convocação oficial registrada e transmitida com sucesso para o banco de dados e Discord!');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Print sheets simulated engine with authentic PMESP Headers/Footers
  const openPdfViewer = (type: 'edital' | 'comprovante' | 'resultado' | 'convocacao', metadata: any) => {
    let titulo = '';
    let numero = '';
    let conteudo = '';

    if (type === 'edital') {
      titulo = `EDITAL OFICIAL DOS ANEXOS SELETIVOS - CONCURSO Nº ${edital?.numero || '18BPM-001/2026'}`;
      numero = edital?.numero || '18BPM-001/2026';
      conteudo = `Por provisão administrativa do Comando do ${batalhaoConfig?.nome || '18º BPM/M'}, são declarados abertos os procedimentos de triagem curricular e exame online regulamentar de admissão para preenchimento de vagas sob regime e doutrina de Força Pública Estadual.\n\n` +
                 `I. DOS REQUISITOS GERAIS:\n${edital?.requisitos.map((r, i) => `  ${i + 1}. ${r}`).join('\n') || ''}\n\n` +
                 `II. DAS ETAPAS DO CERTAME:\n${edital?.etapas.map((v, i) => `  ${i + 1}. ${v}`).join('\n') || ''}\n\n` +
                 `III. DO CRITÉRIO DE HOMOLOGAÇÃO COGNITIVA:\n  - ${edital?.criteriosAprovacao || 'Desempenho aritmético mínimo de 70% na Prova Objetiva Online.'}\n\n` +
                 `IV. DISPOSIÇÕES FINAIS:\n${edital?.observacoes || ''}`;
    } else if (type === 'comprovante') {
      const ins = metadata as Inscricao;
      titulo = `COMPROVANTE OFICIAL DE INSCRIÇÃO MILITAR`;
      numero = ins.protocolo;
      conteudo = `Certificamos para fins regimentais que o cidadão qualificado abaixo encontra-se inscrito no processo seletivo regido pelo concurso regulamentar do ${siglaBTM}.\n\n` +
                 `DADOS DO PRETENSO CANDIDATO RECRUTA:\n` +
                 `  - NOME COMPLETO: ${ins.nome}\n` +
                 `  - CÉDULA IDENTIDADE DISCORD: ${ins.discordId}\n` +
                 `  - IDADE REGISTRADA: ${ins.idade} anos\n` +
                 `  - CIDADE DE HISTÓRICO: ${ins.cidade}\n` +
                 `  - DISPONIBILIDADE INFORMADA: ${ins.horario}\n` +
                 `  - HISTÓRICO DE SERVIÇO ANTERIOR: ${ins.experiencia}\n\n` +
                 `  - MOTIVAÇÃO PARA ADMISSÃO: "${ins.motivacao}"\n\n` +
                 `GERADO EM: ${new Date(ins.dataInscricao).toLocaleString('pt-BR')} • PROTOCOLO AUTOMÁTICO: ${ins.protocolo}\n` +
                 `Conserve este instrumento impresso para posterior exibição nas comissões de exames presenciais de TAF.`;
    } else if (type === 'resultado') {
      const res = metadata as Resultado;
      titulo = `PRONTUÁRIO DE RESULTADO E GABARITO DE EXAME`;
      numero = `RES-${res.protocolo}`;
      conteudo = `O Comando Geral e Seção de Admissão de Recrutas tornam público o parecer e boletim do Exame de Conhecimentos online prestado via Portal de Instrução do ${siglaBTM}.\n\n` +
                 `DADOS DO EXAMINANDO:\n` +
                 `  - NOME DO CANDIDATO: ${res.nomeCompleto}\n` +
                 `  - PROTOCOLO VINCULADO: ${res.protocolo}\n` +
                 `  - ACERTOS REGISTRADOS: ${res.totalAcertos} de 20 questões objetivas\n` +
                 `  - PERCENTUAL REGIMENTAL DE APROVEITAMENTO: ${res.percentual}%\n` +
                 `  - PARECER COGNITIVO FINAL: ${res.situacao}\n\n` +
                 `MATRIZ ANALÍTICA DE PRESTAÇÃO DE RESPOSTAS:\n` +
                 res.analiseRespostas.map((q, i) => `  Q${i+1}. [${q.correct ? '✓ CORRETO' : '✗ INCORRETO'}] - Escolha: ${q.userAns || 'Branco'} | Gabarito: ${q.correctAns}`).join('\n') +
                 `\n\nEmitido eletronicamente em conformidade com o regulamento do Estado-Maior em ${new Date(res.dataConclusao).toLocaleString('pt-BR')}.`;
    } else if (type === 'convocacao') {
      const conv = metadata as Convocation;
      titulo = `EDITAL DE CONVOCAÇÃO PARA ENTREVISTA CORPORATIVA & EXAMES`;
      numero = `CONV-${conv.protocolo}`;
      conteudo = `O Chefe do Estado-Maior no uso de suas outorgas regulamentares CONVOCA o pretenso recruta qualificado abaixo para comissão seletiva de caráter presencial e sumário:\n\n` +
                 `DADOS DA ASSEMBLEIA DE COMPARECIMENTO:\n` +
                 `  - CANDIDATO CONVOCADO: ${conv.nomeCandidato}\n` +
                 `  - PROTOCOLO SELETIVO: ${conv.protocolo}\n` +
                 `  - DATA E HORÁRIO LIMITE: ${conv.dataHora}\n` +
                 `  - LOCAL DO COMPARECIMENTO: ${conv.local}\n\n` +
                 `INSTRUÇÕES ADICIONAIS DO RECRUTADOR:\n` +
                 `  "${conv.instrucoes}"\n\n` +
                 `Adverte-se que o não comparecimento pontual constituirá renúncia sumária por desinteresse militar do candidato do concurso regimental paulista.\n\n` +
                 `HOMOLOGADO EM: ${new Date(conv.dataConvocacao).toLocaleDateString('pt-BR')} • ASSINADO REGIMENTALMENTE por: ${conv.responsavelSign}`;
    }

    setPrintDocument({
      titulo,
      numero,
      conteudo,
      tipo: type,
      metadata
    });
  };

  const executeWindowPrint = () => {
    window.print();
  };

  // Filter inscriptions list based on states
  const filteredCandidates = inscricoes.filter(ins => {
    const matchesSearch = ins.nome.toLowerCase().includes(searchText.toLowerCase()) || 
                          ins.protocolo.toLowerCase().includes(searchText.toLowerCase()) ||
                          ins.discordId.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || ins.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            Edital e Recrutamento PM
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Sistematização de Admissão, exames cognitivos automatizados, repositório de provas eletrônicas e seleção tática central do {batalhaoConfig?.nome || '18º BPM/M'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main system vs Candidate public toggle */}
          <button
            onClick={() => {
              setIsAdminView(false);
              setPublicView('edital');
            }}
            className={`cursor-pointer border text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg transition-all ${
              !isAdminView
                ? 'bg-amber-600 border-amber-500 text-slate-950 font-extrabold'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Portal do Candidato
          </button>

          {hasAdminPermission ? (
            <button
              onClick={() => {
                setIsAdminView(true);
                setAdminTab('inscricoes');
              }}
              className={`cursor-pointer border text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg transition-all ${
                isAdminView
                  ? 'bg-blue-600 border-blue-500 text-white font-extrabold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Painel de Recrutamento (Adm)
            </button>
          ) : (
            <span className="text-[10px] text-slate-500 bg-[#070b14] border border-slate-850 px-3 py-1.5 rounded-md font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Recrutamento Administrado
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0b1322] border border-slate-900 rounded-xl p-8 flex items-center justify-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Buscando gabarito e diretrizes do Estado-Maior...</span>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* PUBLIC PORTAL VIEW (FOR CANDIDATES)                       */}
          {/* ======================================================== */}
          {!isAdminView && (
            <div className="space-y-6">
              {/* Portal public navigation */}
              <div className="flex border-b border-slate-900 bg-[#080d19] p-1.5 rounded-lg gap-1">
                <button
                  onClick={() => { setPublicView('edital'); setMessage(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    publicView === 'edital' ? 'bg-slate-800 text-amber-500 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Regimento de Edital
                </button>
                <button
                  onClick={() => { setPublicView('inscricao'); setMessage(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    publicView === 'inscricao' ? 'bg-slate-800 text-amber-500 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Formulário Inscrição
                </button>
                <button
                  onClick={() => { setPublicView('prova'); setMessage(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    publicView === 'prova' ? 'bg-slate-800 text-amber-500 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Realizar Prova
                </button>
                <button
                  onClick={() => { setPublicView('resultado'); setMessage(null); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    publicView === 'resultado' ? 'bg-slate-800 text-amber-500 shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Boletim de Resultados
                </button>
              </div>

              {/* MESSAGE GERAL */}
              {message && (
                <div className={`p-4 rounded-xl border text-xs flex gap-3 items-start animate-fadeIn ${
                  message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <div>
                    <span className="font-semibold block">{message.type === 'success' ? '✓ Homologado' : '⚠️ Crítica Operacional'}</span>
                    <span className="mt-0.5 block opacity-95">{message.text}</span>
                  </div>
                </div>
              )}

              {/* TAB 1: SHOW EDITAL DETAILS */}
              {publicView === 'edital' && edital && (
                <div className="bg-[#0a101b] border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
                  {/* Edital Official Header Panel */}
                  <div className="bg-gradient-to-r from-[#0d1626] to-[#080e1a] border-b border-slate-900 p-6 md:p-8 text-center text-slate-100 flex flex-col items-center">
                    {/* Official branding representational insignia fallback */}
                    <div className="w-20 h-20 mb-3 flex items-center justify-center">
                      {batalhaoConfig?.logoUrl ? (
                        <img src={batalhaoConfig.logoUrl} alt="Brasão Batalhão" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 flex flex-col items-center justify-center bg-slate-950 p-2">
                          <span className="text-[9px] font-mono text-amber-500 font-bold tracking-widest leading-none">PMESP</span>
                          <span className="text-[7px] font-mono text-slate-400 mt-0.5">{batalhaoConfig?.sigla || '18º BPM/M'}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">{batalhaoConfig?.pmesp || 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO'}</span>
                    <h2 className="text-lg md:text-xl font-extrabold text-slate-100 uppercase tracking-tight mt-1">{batalhaoConfig?.nome || '18º Batalhão de Polícia Militar Metropolitano'}</h2>
                    <p className="text-[10px] text-slate-400 italic max-w-xl self-center mt-1">"{batalhaoConfig?.slogan || 'Sentinela da Zona Norte'}"</p>
                    
                    <div className="mt-5 inline-flex items-center gap-2.5 bg-slate-950/70 border border-slate-850 px-4.5 py-1.5 rounded-full text-xs text-amber-500 font-mono">
                      <span>Edital Oficial Nº: <strong className="text-white font-bold">{edital.numero}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Publicação: <strong className="text-white font-bold">{edital.dataPublicacao}</strong></span>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8 text-slate-300">
                    <div className="border-l-2 border-amber-500 pl-4">
                      <h3 className="text-base font-bold text-slate-100">{edital.titulo}</h3>
                      <p className="text-xs text-slate-400 mt-1">Instrumento legal militar regulante de vagas para Soldado da Reserva e Ativa do batalhão.</p>
                    </div>

                    {/* Requisitos */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        Requisitos de Admissão Regimental
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {edital.requisitos.map((reqStr, index) => (
                          <li key={index} className="flex gap-2.5 items-start bg-[#060a12]/50 border border-slate-900 px-3.5 py-2.5 rounded-lg">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{reqStr}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Processo Seletivo */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        Etapas Oficiais de Seleção
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {edital.etapas.map((etapStr, index) => {
                          const num = index + 1;
                          return (
                            <div key={index} className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col h-full">
                              <span className="text-xs font-mono font-bold text-amber-500 bg-slate-950 w-7 h-7 rounded-lg flex items-center justify-center mb-2.5 border border-slate-800">0{num}</span>
                              <p className="text-xs text-slate-250 leading-relaxed font-semibold">{etapStr}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Criterios & Cronograma grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="bg-[#070b14] border border-slate-900 rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          Critério de Aprovação na Prova
                        </h4>
                        <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs leading-relaxed text-amber-500/90 font-medium">
                          {edital.criteriosAprovacao}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          A prova é realizada online no portal do {siglaBTM}, com limite temporal regulado e embaralhamento tático contra vazamentos.
                        </p>
                      </div>

                      <div className="bg-[#070b14] border border-slate-900 rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Cronograma Regimental
                        </h4>
                        <div className="space-y-2 text-xs">
                          {edital.cronograma.map((c, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-slate-850/40 pb-2 last:border-0 last:pb-0">
                              <span className="text-slate-400 font-medium">{c.evento}</span>
                              <span className="font-mono text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">{c.data}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#0a1526] border border-blue-950/40 rounded-xl text-xs flex gap-3 text-slate-300">
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-200 block mb-0.5">Observações Regimentais Importantes:</strong>
                        <p className="leading-relaxed opacity-90">{edital.observacoes}</p>
                      </div>
                    </div>

                    {/* Official Commander Stamp */}
                    <div className="flex justify-between items-end border-t border-slate-900 pt-6">
                      <button
                        onClick={() => openPdfViewer('edital', edital)}
                        className="flex items-center gap-2 bg-[#0d1627] hover:bg-[#121f37] text-slate-300 border border-slate-800 text-xs py-2 px-4 rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono"
                      >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        Imprimir Edital PDF
                      </button>

                      <div className="flex flex-col items-center text-center font-mono">
                        <div className="text-[8px] text-slate-500 opacity-90 mb-1 border-b border-dashed border-slate-705 px-6 leading-none pb-1">
                          [ASSINATURA DIGITAL REGIMENTAL REGULAR]
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase">{currentUserNome || 'Comandante Geral'}</span>
                        <span className="text-[8px] text-slate-500 uppercase">Comando Geral PMESP / Diretor Geral de Admissão</span>
                      </div>
                    </div>
                  </div>

                  {/* Public Call to action block */}
                  <div className="bg-[#050912] p-6 text-center flex flex-col sm:flex-row justify-center items-center gap-4 border-t border-slate-900">
                    <span className="text-xs text-slate-400 font-medium font-mono">Pronto para ingressar nas fileiras do {siglaBTM}?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPublicView('inscricao')}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-2 px-5 rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        Inscrever-se Agora
                      </button>
                      
                      <button
                        onClick={() => setPublicView('prova')}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-5 rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Realizar Prova Online
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REGISTRATION FORM */}
              {publicView === 'inscricao' && (
                <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-8 space-y-6">
                  {registeredProtocol ? (
                    <div className="py-8 text-center max-w-xl mx-auto space-y-5 animate-fadeIn">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Inscrição Protocolada</h2>
                        <p className="text-xs text-slate-400">Sua pré-inscrição curricular curricular civil foi devidamente transmitida para a Seção P/1 do Batalhão.</p>
                      </div>

                      <div className="p-5 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Vosso Protocolo Seletivo Central</span>
                        <div className="text-3xl font-extrabold text-amber-500 tracking-widest font-mono select-all select-all select-all">
                          {registeredProtocol}
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Conserve este número! Ele será exigido para iniciar seu exame e consultar se fostes convocado no boletim.</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <button
                          onClick={() => {
                            const foundInstance = inscricoes.find(i => i.protocolo === registeredProtocol);
                            if (foundInstance) openPdfViewer('comprovante', foundInstance);
                          }}
                          className="flex items-center justify-center gap-2 bg-[#0d1627] hover:bg-[#121f37] text-slate-300 border border-slate-800 text-xs py-2.5 px-6 rounded-lg cursor-pointer transition-all uppercase font-mono font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Comprovante PDF
                        </button>

                        <button
                          onClick={() => {
                            setCandidateProtocol(registeredProtocol);
                            setPublicView('prova');
                          }}
                          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2.5 px-6 rounded-lg cursor-pointer transition-all uppercase font-mono font-bold"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Ir para Prova Online
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          Formulário de Candidatura Pública
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Preencha com absoluto zelo. Declarações falsas estarão sujeitas a exclusão compulsória imediata do certame.</p>
                      </div>

                      <form onSubmit={handleRegisterCandidato} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                            <input
                              type="text"
                              value={regForm.nome}
                              onChange={e => setRegForm({ ...regForm, nome: e.target.value })}
                              placeholder="Ex: João da Silva Souza"
                              required
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-1.5.5 text-xs focus:outline-none focus:border-amber-500 transition-all font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ID Discord do Candidato</label>
                            <input
                              type="text"
                              value={regForm.discordId}
                              onChange={e => setRegForm({ ...regForm, discordId: e.target.value })}
                              placeholder="Ex: 1234567890123456 (Deixe sem @)"
                              required
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-1.5.5 text-xs focus:outline-none focus:border-amber-500 transition-all font-mono"
                            />
                            <p className="text-[9px] text-slate-500 mt-1">Será utilizado para comunicação instantânea automática de convocações e exames.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Idade do Candidato</label>
                            <input
                              type="number"
                              min="18"
                              max="60"
                              value={regForm.idade}
                              onChange={e => setRegForm({ ...regForm, idade: e.target.value })}
                              placeholder="Mínimo 18 anos"
                              required
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-1.5.5 text-xs focus:outline-none focus:border-amber-500 transition-all font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cidade e UF de Residência</label>
                            <input
                              type="text"
                              value={regForm.cidade}
                              onChange={e => setRegForm({ ...regForm, cidade: e.target.value })}
                              placeholder="Ex: São Paulo - SP"
                              required
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-1.5.5 text-xs focus:outline-none focus:border-amber-500 transition-all font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Horário Disponível para Escala</label>
                            <select
                              value={regForm.horario}
                              onChange={e => setRegForm({ ...regForm, horario: e.target.value })}
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 cursor-pointer text-slate-200"
                            >
                              <option value="Diurno (08h às 18h)">Diurno (08h às 18h)</option>
                              <option value="Noturno (18h às 06h)">Noturno (18h às 06h)</option>
                              <option value="Misto / Flexível">Misto / Flexível</option>
                              <option value="Finais de semana">Finais de semana</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Possui Experiência Policial Anterior?</label>
                            <input
                              type="text"
                              value={regForm.experiencia}
                              onChange={e => setRegForm({ ...regForm, experiencia: e.target.value })}
                              placeholder="Ex: Ex-Cabo no Exército / Outro Batalhão (Deixe Nenhum se não tiver)"
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-1.5.5 text-xs focus:outline-none focus:border-amber-500 transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Motivação Regimental Regimental</label>
                          <textarea
                            value={regForm.motivacao}
                            onChange={e => setRegForm({ ...regForm, motivacao: e.target.value })}
                            placeholder="Descreva, em termos éticos, sua motivação e pretensões regimentais para incorporar nas fileiras desta corporação paulista..."
                            required
                            rows={4}
                            className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all font-medium resize-none leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={savingState}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-2.5 px-6 rounded-lg cursor-pointer transition-all uppercase tracking-wider font-mono disabled:opacity-50"
                          >
                            {savingState ? (
                              <>
                                <div className="w-3 h-3 rounded-full border border-slate-950 border-t-transparent animate-spin" />
                                <span>Processando Protocolo...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Transmitir Ficha de Inscrição</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: ONLINE PROVA EXAM */}
              {publicView === 'prova' && (
                <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-8">
                  {!isProofRunning && !completedResult ? (
                    <div className="max-w-md mx-auto py-8 text-center space-y-6">
                      <GraduationCap className="w-12 h-12 text-blue-500 mx-auto" />
                      
                      <div className="space-y-1.5">
                        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Acesso ao Exame Escrito Teórico</h2>
                        <p className="text-xs text-slate-400">Insira sua identificação de candidato cadastrado para homologar sua sessao de prova.</p>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={candidateProtocol}
                          onChange={e => setCandidateProtocol(e.target.value)}
                          placeholder="Protocolo INS-2026-X ou ID Discord"
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition-all text-center font-mono font-bold tracking-widest uppercase placeholder:text-slate-700"
                        />
                        
                        <button
                          onClick={() => handleStartProof(candidateProtocol)}
                          disabled={actionLoading}
                          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold py-2.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider disabled:opacity-50"
                        >
                          {actionLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                              <span>Validando Credenciais...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Iniciar Exame Teórico</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        * Apenas candidatos com inscrição ativa possuem autorização de acesso ao exame. Tentativas de fraude serão bloqueadas.
                      </p>
                    </div>
                  ) : isProofRunning ? (
                    // EXAM INTERACTION PANEL (Shuffled, timed, interactive, beautiful!)
                    <div className="space-y-6 animate-fadeIn">
                      {/* Timer & Meta Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400">Examinando:</span>
                          <span className="text-xs font-bold text-slate-100 uppercase font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                            {isAuthenticatedCandidate?.nome} ({isAuthenticatedCandidate?.protocolo})
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-bold font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                          <Clock className="w-4 h-4 text-red-400 animate-pulse" />
                          <span>Tempo Restante: {Math.floor(proofTimeRemaining / 60)}m {proofTimeRemaining % 60}s</span>
                        </div>
                      </div>

                      {/* Question Layout Panel: Single-Question Mode */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Questions sidebar selector grid */}
                        <div className="bg-[#070b14] border border-slate-900 p-4 rounded-xl space-y-3.5 h-fit">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Índice Seletivo</span>
                          <div className="grid grid-cols-5 gap-1.5">
                            {activeProofQuestions.map((_, idx) => {
                              const num = idx + 1;
                              const isSolved = selectedAnswers[activeProofQuestions[idx].id] !== undefined;
                              const isActive = idx === currentQuestionIdx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentQuestionIdx(idx)}
                                  className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition-all border ${
                                    isActive
                                      ? 'bg-blue-600 border-blue-500 text-white'
                                      : isSolved
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="border-t border-slate-850 pt-3">
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza absoluta de que marcou todas as respostas e deseja homologar o envio da prova teórica?')) {
                                  handleSubmitProofAnswers();
                                }
                              }}
                              className="w-full bg-[#0d1627] hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/20 text-[11px] py-2 rounded-lg font-mono font-bold transition-all uppercase cursor-pointer text-center"
                            >
                              Finalizar e Corrigir
                            </button>
                          </div>
                        </div>

                        {/* Active Question Statement & Options */}
                        <div className="lg:col-span-3 bg-[#0c1422] border border-slate-850/80 p-5 md:p-6 rounded-xl space-y-6">
                          {activeProofQuestions[currentQuestionIdx] && (
                            <>
                              {/* Metadata */}
                              <div className="flex justify-between items-center text-[10px] font-bold font-mono uppercase bg-slate-950 p-2.5 rounded border border-slate-900">
                                <span className="text-slate-500 text-slate-550">Questão {currentQuestionIdx + 1} de 20</span>
                                <span className="text-amber-500">Módulo: {activeProofQuestions[currentQuestionIdx].categoria}</span>
                              </div>

                              {/* Question statement */}
                              <p className="text-slate-100 font-bold leading-relaxed text-sm">
                                {activeProofQuestions[currentQuestionIdx].pergunta}
                              </p>

                              {/* Alternatives */}
                              <div className="space-y-3">
                                {Object.entries(activeProofQuestions[currentQuestionIdx].alternativas).map(([key, value]) => {
                                  const qId = activeProofQuestions[currentQuestionIdx].id;
                                  const isSelected = selectedAnswers[qId] === key;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => {
                                        setSelectedAnswers({
                                          ...selectedAnswers,
                                          [qId]: key
                                        });
                                      }}
                                      className={`w-full text-left p-3.5 rounded-lg border text-xs leading-relaxed transition-all cursor-pointer flex gap-3.5 items-start ${
                                        isSelected
                                          ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-semibold'
                                          : 'bg-slate-950 border-slate-900 text-slate-350 hover:bg-slate-900'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                        isSelected ? 'bg-blue-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-500'
                                      }`}>{key}</span>
                                      <span>{value}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Navigation footer buttons */}
                              <div className="flex justify-between items-center border-t border-slate-900 pt-5">
                                <button
                                  disabled={currentQuestionIdx === 0}
                                  onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                                  className="px-4 py-2 bg-slate-950 border border-slate-850 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-30"
                                >
                                  Questão Anterior
                                </button>

                                <button
                                  disabled={currentQuestionIdx === activeProofQuestions.length - 1}
                                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                                  className="px-4 py-2 bg-slate-950 border border-slate-850 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-30"
                                >
                                  Próxima Questão
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // SHOW RETRIEVED EXAM METRICS DIRECTLY (CompletedResult state)
                    <div className="max-w-xl mx-auto py-6 space-y-6 text-center animate-fadeIn">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto text-3.5xl border ${
                        completedResult.situacao === 'APROVADO' 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        {completedResult.situacao === 'APROVADO' ? '🏆' : '☠️'}
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Avaliação Corrigida com Sucesso</h2>
                        <p className="text-xs text-slate-400">O sistema calculou seu percentual instantâneo em conformidade com o gabarito oficial.</p>
                      </div>

                      <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 grid grid-cols-2 gap-4">
                        <div className="text-left border-r border-slate-900 pr-4 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">DADOS DO CONCURSO</span>
                          <span className="text-xs text-slate-200 block font-bold truncate uppercase">{completedResult.nomeCompleto}</span>
                          <span className="font-mono text-[9px] text-slate-400 block">{completedResult.protocolo}</span>
                        </div>

                        <div className="text-right pl-4 space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">PERCENTUAL OBTIDO</span>
                          <div className={`text-3xl font-extrabold font-mono leading-none ${completedResult.situacao === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {completedResult.percentual}%
                          </div>
                          <span className="text-[9px] text-slate-400 block">{completedResult.totalAcertos} de 20 acertos</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex gap-3 text-left ${
                        completedResult.situacao === 'APROVADO' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {completedResult.situacao === 'APROVADO' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                        <div>
                          <strong className="block mb-0.5">{completedResult.situacao === 'APROVADO' ? 'PARABÉNS! CANDIDATO RECREADO E APROVADO' : 'EXAME INSIGNIFICANTE / REPROVADO'}</strong>
                          <span className="opacity-90 leading-normal block text-[11px]">
                            {completedResult.situacao === 'APROVADO' 
                              ? 'Você atingiu o aproveitamento cognitivo regimental mínimo de 70% estipulado em edital Oficial. Aguarde o chamamento da comissão para convocação em data de exame físico presencial.'
                              : 'Infelizmente o vosso aproveitamento aritmético ficou abaixo do corte corporativo (70%). Novos editais serão abertos brevemente em novas provisões do Comando.'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openPdfViewer('resultado', completedResult)}
                          className="flex items-center justify-center gap-2 bg-[#0d1627] hover:bg-[#121f37] text-slate-300 border border-slate-800 text-xs py-2 px-5 rounded-lg cursor-pointer transition-all uppercase font-mono font-bold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimir Gabarito PDF
                        </button>

                        <button
                          onClick={() => {
                            setCompletedResult(null);
                            setCandidateProtocol('');
                          }}
                          className="flex items-center justify-center gap-2 bg-slate-900 text-slate-400 hover:text-slate-100 border border-slate-850 text-xs py-2 px-5 rounded-lg cursor-pointer transition-all uppercase font-mono"
                        >
                          Voltar ao início
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BULLETINS AND RESULTS ENQUIRY */}
              {publicView === 'resultado' && (
                <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-8 space-y-6">
                  <div className="max-w-md mx-auto text-center space-y-5">
                    <Award className="w-10 h-10 text-amber-500 mx-auto" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Consulta de Notas Oficiais</h2>
                      <p className="text-xs text-slate-400 mt-1">Busque sua prestação de notas e gabarito utilizando seu ID Discord ou Protocolo.</p>
                    </div>

                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        placeholder="ID Discord ou Protocolo INS-..."
                        value={candidateProtocol}
                        onChange={e => setCandidateProtocol(e.target.value)}
                        className="flex-1 bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all font-mono placeholder:text-slate-700 font-bold tracking-widest uppercase text-center"
                      />
                      
                      <button
                        onClick={() => triggerSearchCandidate(candidateProtocol)}
                        disabled={actionLoading}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold py-2 px-4.5 rounded-lg transition-all font-mono uppercase shrink-0 cursor-pointer duration-20"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {isAuthenticatedCandidate && (
                    <div className="border-t border-slate-900 pt-6 max-w-xl mx-auto space-y-6 animate-fadeIn">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">Status da Candidatura</span>
                            <h3 className="text-sm font-bold text-slate-100 tracking-tight uppercase mt-0.5">{isAuthenticatedCandidate.nome}</h3>
                            <span className="text-[10px] text-slate-400 font-mono">{isAuthenticatedCandidate.protocolo}</span>
                          </div>

                          <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded border ${
                            isAuthenticatedCandidate.status === 'Aprovado' || isAuthenticatedCandidate.status === 'Aprovado Prova' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : isAuthenticatedCandidate.status === 'Convocado'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : isAuthenticatedCandidate.status === 'Reprovado' || isAuthenticatedCandidate.status === 'Reprovado Prova'
                              ? 'bg-red-500/10 border-red-500/20 text-red-500'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}>
                            {isAuthenticatedCandidate.status}
                          </span>
                        </div>

                        {/* Search in Resultados List */}
                        {(() => {
                          const candRes = resultados.find(r => r.protocolo === isAuthenticatedCandidate.protocolo);
                          const candConv = convocacoes.find(c => c.protocolo === isAuthenticatedCandidate.protocolo);

                          return (
                            <div className="space-y-4">
                              {candRes ? (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-slate-400 font-mono items-center">
                                    <span>Pontuação no Exame:</span>
                                    <span className="text-slate-200 font-bold">{candRes.totalAcertos} de 20 acertos ({candRes.percentual}%)</span>
                                  </div>
                                  <div className="w-full bg-[#050810] rounded-full h-1.5 border border-slate-900 overflow-hidden">
                                    <div 
                                      className={`h-full ${candRes.situacao === 'APROVADO' ? 'bg-emerald-500' : 'bg-red-500'}`}
                                      style={{ width: `${candRes.percentual}%` }}
                                    />
                                  </div>

                                  <div className="flex justify-between text-[11px] items-center text-slate-400 pt-2 font-mono">
                                    <span>Gabarito Completo:</span>
                                    <button 
                                      onClick={() => openPdfViewer('resultado', candRes)}
                                      className="text-amber-500 hover:underline font-bold font-sans uppercase text-[10px] cursor-pointer"
                                    >
                                      Exportar Gabarito PDF
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs leading-relaxed text-amber-500/85">
                                  ⚠️ Este candidato ainda não submeteu ou concluiu o exame online de 20 questões. Prossiga para a aba 'Realizar Prova' para responder o teste.
                                </div>
                              )}

                              {candConv && (
                                <div className="p-4 bg-blue-950/20 border border-blue-900/35 rounded-xl text-xs space-y-2.5 leading-relaxed text-slate-300">
                                  <div className="font-bold text-blue-400 flex items-center gap-1.5 uppercase font-mono border-b border-blue-900/40 pb-1.5">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    Convocação de Comparecimento Homologada
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold text-[10px] uppercase font-mono">📅 Horário Reservado:</span>
                                    <strong className="text-slate-100">{candConv.dataHora}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-bold text-[10px] uppercase font-mono">📍 Local:</span>
                                    <strong className="text-slate-100">{candConv.local}</strong>
                                  </div>
                                  <div className="border-t border-blue-900/40 pt-1.5">
                                    <span className="text-slate-400 block font-bold text-[10px] uppercase font-mono">📝 Exigências regimentais & Instruções:</span>
                                    <p className="italic text-slate-300 mt-0.5 opacity-95">"{candConv.instrucoes}"</p>
                                  </div>
                                  <div className="flex justify-end pt-1">
                                    <button
                                      onClick={() => openPdfViewer('convocacao', candConv)}
                                      className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/35 hover:bg-blue-600 hover:text-white px-3 py-1 rounded transition-all font-mono font-bold uppercase cursor-pointer"
                                    >
                                      Baixar Convocação PDF
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="pt-2">
                          <button
                            onClick={() => openPdfViewer('comprovante', isAuthenticatedCandidate)}
                            className="w-full flex justify-center items-center gap-2 bg-[#0d1627] hover:bg-[#121f37] text-slate-300 border border-slate-800 text-xs py-2 px-4 rounded-lg cursor-pointer transition-all uppercase font-mono"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Imprimir Ficha Cadastral PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ADMINISTRATIVE PORTAL VIEW (ADMIN STAFF)                  */}
          {/* ======================================================== */}
          {isAdminView && hasAdminPermission && (
            <div className="space-y-6">
              {/* Admin Panel Header navigation */}
              <div className="flex border-b border-slate-900 bg-[#080d19] p-1.5 rounded-lg gap-1">
                <button
                  onClick={() => setAdminTab('inscricoes')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    adminTab === 'inscricoes' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fichas e Inscrições ({inscricoes.length})
                </button>
                <button
                  onClick={() => setAdminTab('provas')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    adminTab === 'provas' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Exames e Notas ({resultados.length})
                </button>
                <button
                  onClick={() => setAdminTab('questoes')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    adminTab === 'questoes' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Banco de Questões ({questoes.length})
                </button>
                <button
                  onClick={() => setAdminTab('configuracoes')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    adminTab === 'configuracoes' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Configurações do Edital
                </button>
              </div>

              {/* ADMINISTRATIVE SUB-TAB 1: INSCRICOES MANAGEMENT */}
              {adminTab === 'inscricoes' && (
                <div className="space-y-4">
                  {/* Search and export controller actions Row */}
                  <div className="flex flex-col md:flex-row justify-between gap-3 bg-[#0a101b] border border-slate-900 p-4 rounded-xl">
                    <div className="flex flex-1 gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Pesquisar candidato..."
                          value={searchText}
                          onChange={e => setSearchText(e.target.value)}
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md pl-9 pr-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 cursor-pointer text-slate-200 font-mono"
                      >
                        <option value="Todos">Todos Status</option>
                        <option value="Pendente">Pendentes</option>
                        <option value="Aprovado Prova">Aprovados Prova</option>
                        <option value="Reprovado Prova">Reprovados Prova</option>
                        <option value="Convocado">Convocados</option>
                        <option value="Aprovado">Aprovados</option>
                        <option value="Reprovado">Reprovados</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Mock Excel Exporter: prints scannable table
                          alert('✓ Lista de Inscritos regimentais compilada com sucesso como Excel (XML format) para download!');
                        }}
                        className="bg-[#0b1322] border border-slate-800 hover:text-white hover:bg-[#121f37] text-slate-300 text-xs font-bold font-mono py-2 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 uppercase"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Exportar Excel
                      </button>

                      <button
                        onClick={() => {
                          alert('✓ Homologando e gerando lista digital de todos os candidatos que prestaram o certame regimental em PDF!');
                        }}
                        className="bg-[#0b1322] border border-slate-800 hover:text-white hover:bg-[#121f37] text-slate-300 text-xs font-bold font-mono py-2 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 uppercase"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Emissão de Lista PDF
                      </button>
                    </div>
                  </div>

                  {/* Candidates Data Table */}
                  <div className="bg-[#0a101b] border border-slate-900 rounded-xl overflow-hidden overflow-x-auto shadow-xl">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-[#050810] border-b border-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Protocolo / Data</th>
                          <th className="p-4">Candidato</th>
                          <th className="p-4 font-mono">Discord ID</th>
                          <th className="p-4">Idade/Cidade</th>
                          <th className="p-4 text-center">Desempenho</th>
                          <th className="p-4">Situação</th>
                          <th className="p-4 text-right">Ações de Comando</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {filteredCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center p-8 text-slate-550 font-mono italic">Nenhum candidato localizado em triagem curricular.</td>
                          </tr>
                        ) : (
                          filteredCandidates.map(ins => {
                            // Find corresponding exam performance
                            const matchingExam = resultados.find(r => r.protocolo === ins.protocolo);
                            
                            return (
                              <tr key={ins.id} className="hover:bg-slate-900/25 transition-all">
                                <td className="p-4">
                                  <span className="font-bold text-slate-150 font-mono block">{ins.protocolo}</span>
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{new Date(ins.dataInscricao).toLocaleDateString('pt-BR')}</span>
                                </td>

                                <td className="p-4">
                                  <span className="font-bold text-slate-200 block">{ins.nome}</span>
                                  <span className="text-[10px] text-slate-500 font-medium block">Disp: {ins.horario} | Exp: {ins.experiencia}</span>
                                </td>

                                <td className="p-4 font-mono text-slate-400 select-all">{ins.discordId}</td>
                                
                                <td className="p-4">
                                  <span>{ins.idade} anos</span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[120px]" title={ins.cidade}>{ins.cidade}</span>
                                </td>

                                <td className="p-4">
                                  {matchingExam ? (
                                    <div className="text-center space-y-1">
                                      <span className={`font-mono font-bold font-extrabold ${matchingExam.situacao === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {matchingExam.percentual}%
                                      </span>
                                      <span className="text-[9px] text-slate-500 block font-mono">({matchingExam.totalAcertos}/20)</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-mono block text-center italic">Não fez</span>
                                  )}
                                </td>

                                <td className="p-4">
                                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                    ins.status === 'Aprovado' || ins.status === 'Aprovado Prova' 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : ins.status === 'Convocado'
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-extrabold animate-pulse'
                                      : ins.status === 'Reprovado' || ins.status === 'Reprovado Prova'
                                      ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                      : 'bg-slate-900 border-slate-850 text-slate-400'
                                  }`}>
                                    {ins.status}
                                  </span>
                                </td>

                                <td className="p-4 text-right">
                                  <div className="inline-flex gap-1.5">
                                    <button
                                      title="Imprimir Ficha"
                                      onClick={() => openPdfViewer('comprovante', ins)}
                                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                                    >
                                      <PrinterIcon className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Action button: Convoke interview */}
                                    {ins.status !== 'Convocado' && ins.status !== 'Aprovado' && (
                                      <button
                                        onClick={() => {
                                          setConvokingCandidate(ins);
                                        }}
                                        className="bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white text-blue-400 text-[10px] px-2 py-1 rounded cursor-pointer font-semibold uppercase font-mono"
                                      >
                                        Convocar
                                      </button>
                                    )}

                                    {/* Direct Command Status upgrades */}
                                    <button
                                      onClick={() => {
                                        if (confirm(`Aprovar e admitir definitivamente o candidato ${ins.nome} no batalhão?`)) {
                                          handleUpdateCandidateStatus(ins.id, 'Aprovado');
                                        }
                                      }}
                                      className="bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 text-[10px] px-2 py-1 rounded cursor-pointer font-bold font-mono"
                                    >
                                      Aprovar
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (confirm(`Reprovar e dispensar candidato ${ins.nome}?`)) {
                                          handleUpdateCandidateStatus(ins.id, 'Reprovado');
                                        }
                                      }}
                                      className="bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 text-[10px] px-2 py-1 rounded cursor-pointer font-bold font-mono"
                                    >
                                      Reprovar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADMINISTRATIVE SUB-TAB 2: PROVAS EXAMS COMPLETED */}
              {adminTab === 'provas' && (
                <div className="space-y-4">
                  <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 shadow-xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      Prontuário Histórico de Exames Concluídos
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Painel tático para auditoria de respostas submetidas, apuração de percentuais aritméticos de acerto e correção manual manual suplementar.
                    </p>

                    <div className="bg-[#050810] rounded-xl overflow-hidden overflow-x-auto border border-slate-900">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-[#03060c] border-b border-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-4">Candidato / Prot</th>
                            <th className="p-4">Data/Conclusão</th>
                            <th className="p-4 text-center">Acertos (De 20)</th>
                            <th className="p-4 text-center">Aproveitamento</th>
                            <th className="p-4">Veredito Automático</th>
                            <th className="p-4 text-right">Auditoria</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/40">
                          {resultados.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center p-8 text-slate-550 font-mono italic">Nenhum exame submetido até o presente momento.</td>
                            </tr>
                          ) : (
                            resultados.map(res => (
                              <tr key={res.id} className="hover:bg-slate-900/20 transition-all">
                                <td className="p-4 text-slate-100 font-bold block">
                                  {res.nomeCompleto}
                                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{res.protocolo}</span>
                                </td>
                                
                                <td className="p-4 font-mono text-slate-400">{new Date(res.dataConclusao).toLocaleString('pt-BR')}</td>
                                
                                <td className="p-4 text-center font-bold font-mono text-slate-200">{res.totalAcertos} de 20</td>
                                
                                <td className="p-4 text-center font-bold font-mono">
                                  <span className={res.situacao === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}>{res.percentual}%</span>
                                </td>

                                <td className="p-4">
                                  <span className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 border rounded ${
                                    res.situacao === 'APROVADO' 
                                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                                      : 'bg-red-500/10 border-red-500/25 text-red-400'
                                  }`}>
                                    {res.situacao}
                                  </span>
                                </td>

                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => openPdfViewer('resultado', res)}
                                    className="bg-[#0b1322] border border-slate-800 hover:text-white px-3 py-1.5 rounded text-[10px] font-mono uppercase font-bold text-slate-350 cursor-pointer"
                                  >
                                    Ver Prova / Gabarito
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMINISTRATIVE SUB-TAB 3: QUESTOES BANCO (CRUD) */}
              {adminTab === 'questoes' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#0a101b] border border-slate-900 p-4 rounded-xl">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Banco de Diretrizes do Exame</h3>
                      <p className="text-[10px] text-slate-400">Total de {questoes.length} perguntas registradas no repositório.</p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setNewQuestion({ categoria: 'Doutrina Policial', pergunta: '', alternativas: { A: '', B: '', C: '', D: '' }, correta: 'A' });
                        setIsQuestionFormOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono py-2 px-4 rounded-lg cursor-pointer flex items-center gap-1.5 uppercase tracking-wide"
                    >
                      <Plus className="w-4 h-4" />
                      Injetar Nova Questão
                    </button>
                  </div>

                  {/* CRUD / Active Dialog form inside flow */}
                  {isQuestionFormOpen && (
                    <div className="bg-[#0d1627] border border-blue-500/10 rounded-xl p-5 md:p-6 space-y-4 animate-slideDown">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                          <Settings className="w-4 h-4 text-blue-400" />
                          {editingQuestion ? 'Editar Questão de Exame' : 'Adicionar Nova Diretriz à Grade'}
                        </h4>
                        <button
                          onClick={() => setIsQuestionFormOpen(false)}
                          className="text-xs font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          Cancelar [X]
                        </button>
                      </div>

                      <form onSubmit={handleSaveQuestion} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1.5">Enunciado da Pergunta</label>
                            <input
                              type="text"
                              value={newQuestion.pergunta}
                              onChange={e => setNewQuestion({ ...newQuestion, pergunta: e.target.value })}
                              placeholder="Enunciado por extenso da pergunta..."
                              required
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1.5">Módulo de Categoria</label>
                            <select
                              value={newQuestion.categoria}
                              onChange={e => setNewQuestion({ ...newQuestion, categoria: e.target.value })}
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 cursor-pointer text-slate-200"
                            >
                              <option value="Português">Português</option>
                              <option value="Matemática">Matemática</option>
                              <option value="Informática">Informática</option>
                              <option value="Conhecimentos Gerais">Conhecimentos Gerais</option>
                              <option value="Regulamento Interno">Regulamento Interno</option>
                              <option value="Hierarquia Militar">Hierarquia Militar</option>
                              <option value="Procedimentos Operacionais">Procedimentos Operacionais</option>
                              <option value="Doutrina Policial">Doutrina Policial</option>
                            </select>
                          </div>
                        </div>

                        {/* Core Option Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                          {['A', 'B', 'C', 'D'].map(k => (
                            <div key={k} className="flex gap-2 items-center">
                              <span className="w-6 h-6 rounded bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0 font-mono">{k}</span>
                              <input
                                type="text"
                                placeholder={`Alternativa ${k}`}
                                value={newQuestion.alternativas?.[k as 'A' | 'B' | 'C' | 'D'] || ''}
                                onChange={e => {
                                  setNewQuestion({
                                    ...newQuestion,
                                    alternativas: {
                                      ...newQuestion.alternativas as any,
                                      [k]: e.target.value
                                    }
                                  });
                                }}
                                required
                                className="flex-1 bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Correct Answer Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5 border-t border-slate-850/40">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-405 uppercase mb-1.5">Alternativa Correta (Gabarito Oficial)</label>
                            <select
                              value={newQuestion.correta}
                              onChange={e => setNewQuestion({ ...newQuestion, correta: e.target.value })}
                              className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-bold text-emerald-400 font-mono"
                            >
                              <option value="A">Alternativa A</option>
                              <option value="B">Alternativa B</option>
                              <option value="C">Alternativa C</option>
                              <option value="D">Alternativa D</option>
                            </select>
                          </div>

                          <div className="flex items-end justify-end">
                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs py-2 px-6 rounded transition-all uppercase cursor-pointer"
                            >
                              Salvar Diretriz de Questão
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Active questions List grid */}
                  <div className="space-y-3.5">
                    {questoes.map((q, idx) => (
                      <div key={q.id} className="bg-[#0a101b] border border-slate-900 rounded-xl p-4.5 space-y-3 hover:border-slate-800 transition-all">
                        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase border-b border-slate-950 pb-2.5">
                          <span className="text-slate-500">Questão #0{idx + 1} ({q.id})</span>
                          <div className="flex items-center gap-3">
                            <span className="text-amber-500 tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{q.categoria}</span>
                            
                            {/* Command Edit/Delete Actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingQuestion(q);
                                  setNewQuestion(q);
                                  setIsQuestionFormOpen(true);
                                }}
                                className="text-slate-400 hover:text-blue-400 p-1 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-slate-200 text-xs font-semibold leading-relaxed">{q.pergunta}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {Object.entries(q.alternativas).map(([key, val]) => {
                            const isCorrect = q.correta === key;
                            return (
                              <div key={key} className={`p-2.5 rounded-md border flex items-center gap-2 font-medium ${
                                isCorrect 
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold' 
                                  : 'bg-slate-950 border-slate-950/20 text-slate-400'
                              }`}>
                                <span className={`w-4 h-4 rounded text-[9px] font-mono flex items-center justify-center font-extrabold ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 border border-slate-800 text-slate-500'
                                }`}>{key}</span>
                                <span className="truncate">{val}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMINISTRATIVE SUB-TAB 4: CONFIGURACOES DO EDITAL PARAMETERS */}
              {adminTab === 'configuracoes' && edital && (
                <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-400" />
                      Parametrização do Edital Ativo
                    </h3>
                    <p className="text-xs text-slate-400">Edite as diretrizes e prazos do concurso e controle o cronograma regimental do batalhão.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await fetch(`/api/recrutamento/config?role=${userRole}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(edital)
                        });
                        if (res.ok) {
                          alert('✓ Parâmetros do Edital Oficial salvos com absoluto sucesso!');
                          loadRecruitmentData();
                        } else {
                          const err = await res.json();
                          alert(err.error || 'Erro ao registrar alterações.');
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Número de Série do Edital</label>
                        <input
                          type="text"
                          value={edital.numero}
                          onChange={e => setEdital({ ...edital, numero: e.target.value })}
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5.5 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Título do Certame Seletivo</label>
                        <input
                          type="text"
                          value={edital.titulo}
                          onChange={e => setEdital({ ...edital, titulo: e.target.value })}
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Data de Publicação</label>
                        <input
                          type="text"
                          value={edital.dataPublicacao}
                          onChange={e => setEdital({ ...edital, dataPublicacao: e.target.value })}
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Tempo Limite Provas (Minutos)</label>
                        <input
                          type="number"
                          value={edital.tempoLimiteProvas || 30}
                          onChange={e => setEdital({ ...edital, tempoLimiteProvas: parseInt(e.target.value) || 30 })}
                          className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3 py-1.5.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Editando Requisitos e Cronograma e Critérios:</span>
                      <p className="text-[11px] text-slate-350 italic">
                        Para personalizar de forma massiva, o Estado-Maior pode reformar diretamente os vetores regimentais ou injetar novas cláusulas por meio de API ou modificação no banco de dados centralizado `db.json`.
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs py-2 px-6 rounded transition-all uppercase cursor-pointer"
                      >
                        Salvar Configurações do Edital
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* DIALOG 1: CREATE CONVOCATION TO CANDIDATE                */}
      {/* ======================================================== */}
      {convokingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 md:p-6 w-full max-w-md space-y-5 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Convocar Candidato</h3>
              <button onClick={() => setConvokingCandidate(null)} className="text-slate-500 hover:text-slate-300 font-mono">X</button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs leading-normal">
              <span className="text-slate-500 font-mono">Inscrito:</span>
              <strong className="text-slate-250 block uppercase mt-0.5">{convokingCandidate.nome}</strong>
              <span className="text-[10px] font-mono text-amber-500">{convokingCandidate.protocolo}</span>
            </div>

            <form onSubmit={handleScheduleConvocation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Data, Horário e Escala Oficial</label>
                <input
                  type="text"
                  placeholder="Ex: 10/06/2026 às 14h00"
                  value={convocationForm.dataHora}
                  onChange={e => setConvocationForm({ ...convocationForm, dataHora: e.target.value })}
                  required
                  className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Local da Entrevista / Quartel-Sede</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Deputado Cantídio Sampaio, 1234 - São Paulo/SP"
                  value={convocationForm.local}
                  onChange={e => setConvocationForm({ ...convocationForm, local: e.target.value })}
                  required
                  className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Exigências / Instruções Adicionais</label>
                <textarea
                  placeholder="Instruções aos candidatos convocados..."
                  value={convocationForm.instrucoes}
                  onChange={e => setConvocationForm({ ...convocationForm,  instrucoes: e.target.value })}
                  rows={3}
                  className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setConvokingCandidate(null)}
                  className="px-4 py-2 text-xs bg-slate-900 border border-slate-850 rounded text-slate-400 hover:text-slate-350 font-semibold uppercase cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold font-mono uppercase tracking-wide cursor-pointer"
                >
                  Confirmar Convocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIALOG 2: HIGH-FIDELITY PRINT DECREES / DOCUMENT PREVIEW   */}
      {/* ======================================================== */}
      {printDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn print:relative print:inset-0 print:p-0 print:bg-white print:text-slate-900">
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl max-w-2xl w-full h-[90vh] flex flex-col shadow-2xl animate-scaleUp print:h-auto print:border-0 print:p-0 print:bg-white">
            
            {/* Header Toolbar (hidden in print) */}
            <div className="flex justify-between items-center p-4 border-b border-slate-900 print:hidden shrink-0">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-500" />
                Preview do Documento de Admissão PMESP
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={executeWindowPrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold py-1.5 px-4 rounded cursor-pointer transition-all uppercase tracking-wider"
                >
                  Imprimir PDF Oficial
                </button>

                <button
                  onClick={() => setPrintDocument(null)}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 border border-slate-850 p-1.5 px-3 rounded cursor-pointer"
                >
                  Fechar [X]
                </button>
              </div>
            </div>

            {/* Document Render Body area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 print:overflow-hidden print:p-0">
              {/* Actual Paper Container */}
              <div className="bg-white text-slate-900 rounded-lg p-6 md:p-10 shadow-lg min-h-[11in] relative flex flex-col justify-between border border-slate-200 print:border-0 print:shadow-none font-serif leading-relaxed text-xs">
                
                {/* PMESP Top Official Stamp header */}
                <div className="flex flex-col items-center text-center border-b-[2.5px] border-slate-950 pb-5 mb-8">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    {batalhaoConfig?.logoUrl ? (
                      <img src={batalhaoConfig.logoUrl} alt="Coat of arms" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-[2.5px] border-slate-950 flex flex-col items-center justify-center p-1.5 bg-slate-50">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-red-650 mb-0.5" />
                          <span className="text-[7px] font-mono font-bold leading-none tracking-widest text-[#d97706]">PMESP</span>
                          <span className="text-[6px] font-mono leading-none tracking-tighter mt-0.5">{batalhaoConfig?.sigla || '18º BPM/M'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <h1 className="text-sm font-bold tracking-widest text-slate-950 uppercase font-sans">
                    {batalhaoConfig?.pmesp || 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO'}
                  </h1>
                  <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase font-sans mt-0.5">
                    {batalhaoConfig?.secretaria || 'SECRETARIA DE SEGURANÇA PÚBLICA'} - {batalhaoConfig?.sigla || '18º BPM/M'}
                  </h2>
                  <p className="text-[9px] uppercase tracking-normal text-slate-500 font-sans mt-1">
                    {batalhaoConfig?.nome || '18º Batalhão de Polícia Militar Metropolitano'} • "{batalhaoConfig?.slogan}"
                  </p>
                </div>

                {/* Subtitle / Document Numerator */}
                <div className="space-y-6 flex-1">
                  <div className="flex justify-between items-center text-[10px] font-bold font-sans uppercase">
                    <span>SEÇÃO SELETIVA DE ADMISSÃO (PORTÃO P/1)</span>
                    <span className="font-mono text-slate-600 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">DOCUMENTO Nº: {printDocument.numero}</span>
                  </div>

                  <h3 className="text-center font-bold text-slate-950 text-sm border-y border-dashed border-slate-300 py-3 uppercase tracking-wider font-sans">
                    {printDocument.titulo}
                  </h3>

                  {/* Body Content */}
                  <div className="whitespace-pre-line text-slate-800 text-[11px] leading-relaxed text-justify px-2 leading-extra-loose leading-6 first-letter:text-xl">
                    {printDocument.conteudo}
                  </div>
                </div>

                {/* Footer Stamp, signatures & Watermarks */}
                <div className="mt-12 space-y-6 pt-5">
                  <div className="flex justify-between items-end border-t border-slate-300/60 pt-6">
                    <span className="text-[8px] text-slate-400 font-mono">AUTENTICADO VIA SISDEC-RECRUTA</span>
                    
                    <div className="flex flex-col items-center text-center font-sans">
                      <div className="text-[7px] text-slate-400 uppercase tracking-widest leading-none mb-1">[CHANCELA CHAVE DE ORIGINALIDADE MILITAR]</div>
                      <span className="font-bold text-[10px] text-slate-900 border-b border-slate-900 pb-0.5 uppercase">{batalhaoConfig?.sigla || '18º BPM/M'} COMANDO GERAL</span>
                      <span className="text-[8px] text-slate-500 mt-1">SISTEMA OFICIAL DE RECRUTAMENTO MILITAR DE SÃO PAULO</span>
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="text-center text-[7px] text-slate-400 font-mono tracking-widest uppercase border-t border-slate-150 pt-3">
                    REGIMENTO E ADMISSÃO POLICIAL MILITAR INTEGRADA • {batalhaoConfig?.sigla || '18º BPM/M'} • SÃO PAULO
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
