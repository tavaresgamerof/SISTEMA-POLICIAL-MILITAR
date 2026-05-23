/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  HelpCircle,
  Cpu,
  RefreshCw,
  User,
  Download,
  Printer,
  Share2,
  Save,
  Edit3,
  Eye,
  Check
} from 'lucide-react';
import { Policial, Documento, DocumentCategory } from '../types';

interface AiDocumentAssistantProps {
  activeUser: Policial;
  onImportGeneratedDocument: (doc: { titulo: string; tipo: string; categoria: DocumentCategory; conteudo: string }) => void;
  onRefreshData: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isClarificationQuestion?: boolean;
  generatedDoc?: {
    documentType: string;
    categoria: DocumentCategory;
    titulo: string;
    conteudo: string;
    systemActionApplied?: {
      success: boolean;
      message: string;
      policial?: Policial;
    };
  };
}

export default function AiDocumentAssistant({ 
  activeUser, 
  onImportGeneratedDocument,
  onRefreshData
}: AiDocumentAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `Entrando no sistema de inteligência de gabinete do 18º BPM/M. Eu sou o Inteligente Redator Operacional e Administrativo da PMESP.

Instrua-me em linguagem natural com fatos, nomes, RGs ou contextos e eu interpretarei automaticamente as informações para redigir expedientes íntegros sob o mais rígido e elegante padrão militar bandeirante.

**Dica de Sincronismo Funcional:** A IA lê em tempo real o efetivo completo do batalhão. Se você escrever "Felipe Silva", eu autocompletarei o documento com seu Nome Completo real, RG e a patente atualizada dele!`,
      timestamp: new Date()
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Assistant mode variables
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [missingInfoQuestion, setMissingInfoQuestion] = useState('');
  const [waitingForClarification, setWaitingForClarification] = useState(false);

  // Previewing document state
  const [previewDoc, setPreviewDoc] = useState<{
    documentType: string;
    categoria: DocumentCategory;
    titulo: string;
    conteudo: string;
    tempId?: string;
  } | null>(null);

  // Success checklist states
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Mapped standard presets from 18º BPM/M instructions
  const presetsList = [
    {
      label: "Promoção por Bravura",
      category: "RH / Promoção",
      text: "Promover Felipe Silva RG 780 de Soldado para Cabo por destaque operacional durante a Operação Saturação."
    },
    {
      label: "Advertência abandono",
      category: "Corregedoria / Punição",
      text: "Aplicar advertência ao Soldado Lucas por abandono de posto durante patrulhamento ostensivo."
    },
    {
      label: "Boletim Equipe ROCAM",
      category: "Comunicação / Boletim",
      text: "Gerar boletim interno informando a criação da equipe tática de ROCAM no âmbito da Zona Norte."
    },
    {
      label: "Bloqueio Policial OS",
      category: "Operacional / Serviço",
      text: "Criar ordem de serviço para operação tática de bloqueio policial no dia 15/06/2026 às 14:00."
    },
    {
      label: "Relatório de Inquirição",
      category: "Corregedoria / Disciplina",
      text: "Gerar relatório disciplinar referente à ocorrência envolvendo descumprimento do policial João Santos."
    },
    {
      label: "Doutrina de Patrulha",
      category: "Administrativo / Doutrina",
      text: "Gerar doutrina operacional de patrulhamento RPM (Rádio Patrulhamento com Motocicletas) para o 18º BPM/M."
    }
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt;
    setInputPrompt('');
    setIsLoading(true);

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);

    // Build perfect prompt using active assistant-mode parameters
    let finalPrompt = userText;
    if (waitingForClarification) {
      finalPrompt = `Documento original solicitado: "${originalPrompt}". O sistema acusou que faltavam dados solicitando o seguinte: "${missingInfoQuestion}". Resposta do usuário preenchendo as lacunas: "${userText}". Por favor, utilize este contexto consolidado e gere o documento final completo respeitando todos os requisitos.`;
    }

    try {
      const response = await fetch('/api/gemini/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          actor: `${activeUser.patente} ${activeUser.nome}`
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro na resposta do servidor.');
      }

      const data = await response.json();

      // Check if Gemini triggered Assistant Mode (incomplete prompt)
      if (data.missingInfoRequest) {
        setOriginalPrompt(waitingForClarification ? originalPrompt : userText);
        setMissingInfoQuestion(data.missingInfoRequest);
        setWaitingForClarification(true);

        const aiMsg: Message = {
          id: 'msg-' + Date.now(),
          sender: 'assistant',
          text: `⚠️ **MODO ASSISTENTE PMESP RESGATADO**\n\nIdentifiquei a intenção de formalizar este documento, todavia, para redigirmos com absoluta validade institucional, necessito de dados pendentes:\n\n👉 **${data.missingInfoRequest}**\n\n_Por favor, informe os dados solicitados no campo abaixo para concluirmos a confecção._`,
          timestamp: new Date(),
          isClarificationQuestion: true
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
        return;
      }

      // Generation succeeded! Clear clarification flags.
      setWaitingForClarification(false);
      setOriginalPrompt('');
      setMissingInfoQuestion('');

      let assistantText = `### 📋 Expediente Gerado pela IA com Sincronismo do Efetivo!\n\n**Expediente:** ${data.documentType}\n**Padrão Metropolitano:** ${data.categoria}\n\nO documento foi constituído com bases regulamentares, decretos operacionais, marcas de autoria e preâmbulo regimental do 18º BPM/M.`;

      const aiMsg: Message = {
        id: 'msg-' + Date.now(),
        sender: 'assistant',
        text: assistantText,
        timestamp: new Date(),
        generatedDoc: {
          documentType: data.documentType,
          categoria: data.categoria,
          titulo: data.titulo,
          conteudo: data.conteudo,
          systemActionApplied: data.systemActionApplied
        }
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Load generated doc into live visual preview card
      setPreviewDoc({
        documentType: data.documentType,
        categoria: data.categoria,
        titulo: data.titulo,
        conteudo: data.conteudo
      });
      setIsSaved(false);
      setIsShared(false);

      // Refresh database states (specifically if automatic functional upgrades took place)
      if (data.systemActionApplied?.success) {
        onRefreshData();
      }

    } catch (error: any) {
      console.error(error);
      const errMsg: Message = {
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        text: `Falha técnica durante comunicação com o motor do Gemini: ${error.message || 'Chave de API inativa, adicione GEMINI_API_KEY nos Secrets.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPreset = (text: string) => {
    setInputPrompt(text);
  };

  // Immediate Save to General Database
  const handleSaveToDb = async () => {
    if (!previewDoc || isSaved) return;

    try {
      const response = await fetch('/api/documentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: previewDoc.titulo.toUpperCase(),
          tipo: previewDoc.documentType,
          categoria: previewDoc.categoria,
          conteudo: previewDoc.conteudo,
          status: 'Rascunho',
          autor: {
            nome: activeUser.nome,
            rg: activeUser.rg,
            patente: activeUser.patente
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar documento.');
      }

      const savedData = await response.json();
      setIsSaved(true);
      // Associate saved temporary ID for references
      setPreviewDoc(prev => prev ? { ...prev, tempId: savedData.id } : null);
      onRefreshData();
      alert(`Expediente indexado com sucesso no acervo geral do batalhão sob numeração automática: ${savedData.numeracao || 'Atribuída'}.`);
    } catch (err: any) {
      alert(`Falha ao arquivar expediente: ${err.message}`);
    }
  };

  // Export to standard Microsoft Word .doc stream
  const handleExportWord = () => {
    if (!previewDoc) return;
    
    const plainText = `
      POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
      18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO - "SENTINELA DA ZONA NORTE"

      EXPEDIENTE OFICIAL: ${previewDoc.documentType} (${previewDoc.categoria})
      TÍTULO: ${previewDoc.titulo}
      EMISSÃO CONTEXTUAL: GERADOR INTELIGENTE IA GEMINI
      AUTOR: ${activeUser.patente} ${activeUser.nome} - RG: ${activeUser.rg}
      MÉTODO: FORMATO ADMINISTRATIVO PMESP
      DATA: ${new Date().toLocaleDateString('pt-BR')}

      -------------------------------------------------------------------------

      ${previewDoc.conteudo}

      -------------------------------------------------------------------------
      Este documento foi minutado por Inteligência Artificial do 18º BPM/M.
      Assinaturas e rubricas táticas digitais podem ser aplicadas no módulo geral sob token SEI.
    `;

    const blob = new Blob(['\ufeff' + plainText], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${previewDoc.documentType.replace(/\s+/g, '_')}_IA_18BPM_${new Date().getFullYear()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print to save PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Copy document sharing link or dispatch warning
  const handleShareDoc = () => {
    if (!previewDoc) return;
    const shareText = `*EXPEDIENTE MILITAR - 18º BPM/M*\n\n*Tipo:* ${previewDoc.documentType}\n*Título:* ${previewDoc.titulo}\n\n${previewDoc.conteudo.slice(0, 300)}...\n\n_Documento gerado através do Módulo de Geração Inteligente IA do 18º Batalhão Metropolitano._`;
    navigator.clipboard.writeText(shareText);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 3000);
    alert('Minuta do expediente copiada para a área de transferência! Pronta para ser compartilhada com a tropa ou canais do batalhão.');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Visual Title Header */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shrink-0">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-widest">Gerador Inteligente de Documentos</h2>
            <p className="text-xs text-slate-400">Motor de redação jurídica e militar baseado na inteligência artificial Google Gemini.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#080d17] px-3 py-1.5 rounded-lg border border-slate-850">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">Sincronismo do Efetivo Ativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Chat and Inputs workspace (Span 7) */}
        <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
          
          {/* Main workspace frame */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col h-[600px] justify-between shadow-2xl">
            
            {/* Header label */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">M-18 Coordenador da Inteligência</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Modelo Ativo: Gemini-3.5-Flash (Redação Jurídico-Militar)</p>
                </div>
              </div>
              <Cpu className="w-4 h-4 text-slate-600 shrink-0" />
            </div>

            {/* Conversation Log Box */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : ''}`}>
                  
                  {m.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-xl p-4 leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow shadow-blue-600/10' 
                      : m.isClarificationQuestion 
                        ? 'bg-amber-500/10 border border-amber-500/30 text-slate-200 rounded-tl-none font-sans'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-sans'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-[11px] md:text-xs">
                      {m.text}
                    </div>

                    {/* Ficha Functional Auto Update Success Sync report */}
                    {m.generatedDoc?.systemActionApplied && (
                      <div className={`mt-4 p-3 rounded-lg border flex gap-2.5 items-start ${
                        m.generatedDoc.systemActionApplied.success
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-yellow-500/5 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {m.generatedDoc.systemActionApplied.success ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider block">Relatório do Sincronismo da Ficha</span>
                          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                            {m.generatedDoc.systemActionApplied.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                </div>
              ))}

              {/* Loader */}
              {isLoading && (
                <div className="flex gap-3 text-xs animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px]">Aguarde. O Gemini está interpretando os fatos, sincronizando dados funcionais do efetivo e redigindo minuta oficial paulista...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Workspace Frame */}
            <form onSubmit={handleSend} className="space-y-3 border-t border-slate-800/80 pt-4 shrink-0">
              <label htmlFor="prompt-field" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                {waitingForClarification ? "📋 Responda à pergunta do Assistente de Gabinete PMESP *" : "Descreva o documento que deseja gerar *"}
              </label>
              
              <div className="flex gap-2">
                <input
                  id="prompt-field"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder={waitingForClarification ? "Forneça as informações em falta..." : "ex: Promover o Sd Felipe Dias de Sd para Cabo por destaque ontem."}
                  className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-40 font-sans shadow-inner placeholder-slate-700"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 h-10 shrink-0 transition-colors flex items-center justify-center disabled:opacity-40 cursor-pointer shadow hover:shadow-blue-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* Right Side: Clickable Presets AND Live Document Preview Card (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Presets block */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 pb-2.5 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Diretrizes e Exemplos Oficiais</span>
            </h3>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-2 mb-3.5">
              Toque em qualquer exemplo tático abaixo para preencher automaticamente o campo e ver a IA estruturar o expediente do Batalhão:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {presetsList.map((p, i) => (
                <button
                  key={i}
                  disabled={isLoading}
                  onClick={() => handleLoadPreset(p.text)}
                  className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-lg p-3 transition-all text-xs flex justify-between gap-3 group cursor-pointer disabled:opacity-50"
                  title={p.text}
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[8px] uppercase font-mono font-bold text-amber-500 tracking-wider block">{p.category}</span>
                    <p className="text-slate-200 font-semibold truncate group-hover:text-blue-400 font-sans">{p.label}</p>
                    <p className="text-[10px] text-slate-500 truncate italic">{p.text}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 shrink-0 self-center transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Paper Sheet Visualizer */}
          {previewDoc ? (
            <div className="bg-[#0b1322] border border-amber-500/10 rounded-xl p-5 space-y-4 shadow-xl animate-fade-in relative">
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-500 font-mono font-bold text-[8px] px-1.5 py-0.5 rounded tracking-widest uppercase">
                  Geração Ativa
                </span>
                <button 
                  onClick={() => setPreviewDoc(null)} 
                  className="text-slate-500 hover:text-slate-400 text-xs font-mono"
                  title="Fechar visualização"
                >
                  [X]
                </button>
              </div>

              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Prancheta de Homologação</span>
              </h3>

              {/* Miniature visual representation of PMESP document sheet */}
              <div className="bg-white text-slate-950 p-5 rounded border border-slate-300 shadow-inner max-h-[300px] overflow-y-auto select-text font-serif text-[9px] leading-relaxed">
                {/* Traditional Coat Header */}
                <div className="flex flex-col items-center text-center border-b border-slate-950 pb-2 mb-3">
                  <div className="w-10 h-10 mb-1 flex items-center justify-center p-0.5 bg-slate-50 border border-slate-900 rounded-full font-mono text-[5px] font-bold text-slate-900">
                    PMESP
                  </div>
                  <h1 className="text-[7px] font-bold uppercase tracking-wider">POLÍCIA MILITAR DO ESTADO DE SÃO PAULO</h1>
                  <h2 className="text-[6px] font-bold uppercase text-slate-800">18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO</h2>
                </div>

                <div className="font-mono text-[7px] text-slate-600 flex justify-between mb-2 pb-1 border-b border-dashed border-slate-200 uppercase">
                  <span>Numeração: [EM PROCESSAMENTO]</span>
                  <span>Data: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>

                <h3 className="text-[8px] font-bold text-center underline uppercase mb-2 truncate">
                  {previewDoc.titulo}
                </h3>

                <div className="whitespace-pre-wrap">
                  {previewDoc.conteudo}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-400 text-center font-mono text-[6px] text-slate-500 uppercase">
                  SISTEMA DE GESTÃO AUTOMATIZADA GEMINI • 18º BPM/M
                </div>
              </div>

              {/* Action Toolbar on Preview */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleSaveToDb}
                  disabled={isSaved}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isSaved 
                      ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-400' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvo</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareDoc}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Compartilhar</span>
                </button>

                <button
                  onClick={handleExportWord}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Exportar Word</span>
                </button>

                <button
                  onClick={handlePrintPdf}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Exportar PDF</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onImportGeneratedDocument({
                    titulo: previewDoc.titulo,
                    tipo: previewDoc.documentType,
                    categoria: previewDoc.categoria,
                    conteudo: previewDoc.conteudo
                  })}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-shadow cursor-pointer hover:shadow hover:shadow-blue-600/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Carregar para Prancheta de Redação</span>
                </button>
                <p className="text-[9px] text-slate-500 text-center leading-relaxed font-sans mt-2">
                  Carregando para redigir manualmente, aplicar carimbos oficiais e assinar com chave criptográfica SEI.
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-[#0b1322]/40 border border-dashed border-slate-800/80 p-12 text-center rounded-xl font-sans min-h-[300px] flex flex-col justify-center items-center">
              <Bot className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
              <p className="text-slate-500 text-xs font-sans leading-relaxed">
                Minuta não gerada.<br />Informe o que deseja redigir no chat para que a folha institucional apareça aqui!
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
