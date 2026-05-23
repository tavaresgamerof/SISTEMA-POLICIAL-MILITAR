/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  FileSignature, 
  Download, 
  Printer, 
  Send, 
  Briefcase, 
  User, 
  RefreshCw, 
  Layers, 
  PenTool, 
  FileCheck, 
  Image as ImageIcon,
  Check, 
  Copy, 
  Plus, 
  X
} from 'lucide-react';
import { Documento, Template, AssinaturaMembro, DocumentCategory, Policial } from '../types';

interface DocumentGeneratorProps {
  initialTemplates: Template[];
  initialAssinaturas: AssinaturaMembro[];
  activeUser: Policial;
  documents: Documento[];
  onSaveDocument: (doc: Omit<Documento, 'id' | 'dataCriacao' | 'numeracao'> & { id?: string; numeracao?: string }) => void;
  onSignDocument: (id: string, signature: AssinaturaMembro) => void;
  onDeleteDocument: (id: string) => void;
  selectedDocId: string | null;
  clearSelectedDoc: () => void;
  batalhaoConfig?: any;
}

export default function DocumentGenerator({
  initialTemplates,
  initialAssinaturas,
  activeUser,
  documents,
  onSaveDocument,
  onSignDocument,
  onDeleteDocument,
  selectedDocId,
  clearSelectedDoc,
  batalhaoConfig
}: DocumentGeneratorProps) {
  const [docId, setDocId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Portaria');
  const [categoria, setCategoria] = useState<DocumentCategory>('ADMINISTRATIVO');
  const [conteudo, setConteudo] = useState('');
  const [status, setStatus] = useState<'Rascunho' | 'Assinado' | 'Arquivado'>('Rascunho');
  const [autor, setAutor] = useState({ nome: activeUser.nome, rg: activeUser.rg, patente: activeUser.patente });
  
  // Custom PMESP Emblem State
  const [logoBase64, setLogoBase64] = useState<string>(''); // For custom uploaded crest
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'PREVIEW'>('EDITOR');
  const [selectedSignatureId, setSelectedSignatureId] = useState('a-1');
  const [viewingSignedStamp, setViewingSignedStamp] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypesList = [
    // Administrativos
    'Portaria', 'Ordem de Serviço', 'Memorando', 'Circular', 'Ata', 'Regulamento Interno', 'Doutrina Operacional', 'Código Disciplinar', 'Manual de Procedimentos',
    // RH
    'Promoção', 'Rebaixamento', 'Nomeação', 'Exoneração', 'Transferência', 'Advertência', 'Suspensão', 'Elogio Individual', 'Elogio Coletivo',
    // Operacionais
    'Relatório de Ocorrência', 'Relatório de Patrulhamento', 'Ordem de Operação', 'Planejamento Operacional', 'Auto de Prisão', 'Relatório Pós-Operação',
    // Comunicação
    'Boletim Interno', 'Boletim Geral', 'Nota Oficial', 'Comunicado',
    // Corregedoria
    'Sindicância', 'Processo Administrativo', 'Relatório Disciplinar', 'Termo de Ciência', 'Termo de Advertência'
  ];

  // Sync edit selected doc from system state
  useEffect(() => {
    if (selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if (doc) {
        setDocId(doc.id);
        setTitulo(doc.titulo);
        setTipo(doc.tipo);
        setCategoria(doc.categoria);
        setConteudo(doc.conteudo);
        setStatus(doc.status);
        setAutor(doc.autor);
        if (doc.status === 'Assinado') {
          setViewingSignedStamp({
            nome: doc.assinaturaNome,
            patente: doc.assinaturaPatente,
            data: doc.assinaturaData,
            stamp: initialAssinaturas.find(a => a.id === doc.assinaturaId)?.rubricaSimbolo || 'CHANCELA ELETRÔNICA HOMOLOGADA'
          });
        } else {
          setViewingSignedStamp(null);
        }
        setActiveTab('PREVIEW');
      }
    } else {
      handleNewDocument();
    }
  }, [selectedDocId, documents]);

  // Handle template selection
  const handleLoadTemplate = (t: Template) => {
    const formatted = t.conteudo
      .replace(/\[Nome do Policial\]/g, activeUser.nome)
      .replace(/\[RG\]/g, activeUser.rg)
      .replace(/\[Patente Atual\]/g, activeUser.patente)
      .replace(/\[Data Atual\]/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/###/g, String(documents.length + 1).padStart(3, '0'));
    
    setTitulo(t.titulo.toUpperCase());
    setTipo(t.tipo);
    setCategoria(t.categoria);
    setConteudo(formatted);
    setActiveTab('EDITOR');
  };

  const handleNewDocument = () => {
    setDocId(null);
    setTitulo('');
    setTipo('Portaria');
    setCategoria('ADMINISTRATIVO');
    setConteudo('');
    setStatus('Rascunho');
    setAutor({ nome: activeUser.nome, rg: activeUser.rg, patente: activeUser.patente });
    setViewingSignedStamp(null);
    clearSelectedDoc();
    setActiveTab('EDITOR');
  };

  const handleSave = () => {
    if (!titulo || !conteudo) {
      alert('Por favor, preencha o Título e o Conteúdo do documento antes de salvar.');
      return;
    }
    const payload = {
      id: docId || undefined,
      titulo: titulo.toUpperCase(),
      tipo,
      categoria,
      conteudo,
      status,
      autor
    };
    onSaveDocument(payload);
    alert('Rascunho gravado e indexado no banco de dados com protocolo temporário.');
  };

  const handleApplySignature = () => {
    if (!docId) {
      alert('Grave o rascunho temporário do documento antes de aplicar a chancela de assinatura.');
      return;
    }
    const selectedAss = initialAssinaturas.find(a => a.id === selectedSignatureId);
    if (!selectedAss) return;

    onSignDocument(docId, selectedAss);
    setViewingSignedStamp({
      nome: selectedAss.nome,
      patente: selectedAss.patente,
      data: new Date().toISOString(),
      stamp: selectedAss.rubricaSimbolo
    });
    setStatus('Assinado');
    alert(`Documento assinado digitalmente em nome de ${selectedAss.patente} ${selectedAss.nome}. Bloqueado para edições!`);
  };

  // Simulated Seal / Badge Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Convert HTML wrapper for standard Word doc download which uses MS Word direct schema
  const handleExportWord = () => {
    if (!titulo || !conteudo) return;
    
    const plainText = `
      POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
      18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO

      DOCUMENTO: ${tipo} (${categoria})
      TÍTULO: ${titulo}
      AUTOR: ${autor.patente} ${autor.nome} - RG: ${autor.rg}
      DATA: ${new Date().toLocaleDateString('pt-BR')}

      --------------------------------------------------------------

      ${conteudo}

      --------------------------------------------------------------
      ${status === 'Assinado' ? `DOCUMENTO ASSINADO DIGITALMENTE POR:\n${viewingSignedStamp?.patente || ''} ${viewingSignedStamp?.nome || ''}\nData: ${viewingSignedStamp?.data ? new Date(viewingSignedStamp.data).toLocaleString() : ''}\nAutenticador: ${viewingSignedStamp?.stamp || ''}` : 'RASCUNHO NÃO HOMOLOGADO.'}
    `;

    const blob = new Blob(['\ufeff' + plainText], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tipo.replace(/\s+/g, '_')}_18BPMM_${new Date().getFullYear()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Standard Print View Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Top Banner */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Gerador de Expedientes PMESP</h2>
            <p className="text-xs text-slate-400">Cadastre rascunhos, selecione modelos oficiais e aplique chancelas criptográficas.</p>
          </div>
        </div>

        <div className="flex gap-2">
          {docId && (
            <button
              onClick={handleNewDocument}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded text-xs uppercase flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Rascunho</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Editor controls + Paper renderer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Compose Panel (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick-loader of PMESP Templates */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>Modelos Pré-Configurados (Template Rápido)</span>
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {initialTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleLoadTemplate(t)}
                  className="w-full text-left bg-slate-900/50 hover:bg-slate-850 p-2.5 rounded-lg border border-slate-800/65 flex justify-between items-center transition-all group cursor-pointer"
                  disabled={status === 'Assinado'}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] uppercase font-bold text-amber-500 block mb-0.5">{t.categoria}</span>
                    <h4 className="text-slate-200 font-semibold text-xs truncate group-hover:text-blue-400">{t.titulo}</h4>
                    <span className="text-[9px] text-slate-500 font-mono italic truncate block mt-0.5">{t.descricao}</span>
                  </div>
                  <PenTool className="w-4 h-4 text-slate-500 opacity-40 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Core metadata form */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-2">
              Propriedades do Rascunho
            </h3>

            <div className="space-y-3">
              {/* Título */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  disabled={status === 'Assinado'}
                  placeholder="ex: NOTA DE ADVERTÊNCIA - INVESTIGAÇÃO PREVENTIVA"
                  className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value.toUpperCase())}
                />
              </div>

              {/* Grid: Type and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Tipo Administrativo</label>
                  <select
                    disabled={status === 'Assinado'}
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none disabled:opacity-50"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {documentTypesList.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
                  <select
                    disabled={status === 'Assinado'}
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none disabled:opacity-50"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as DocumentCategory)}
                  >
                    <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                    <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                    <option value="OPERACIONAL">OPERACIONAL</option>
                    <option value="COMUNICAÇÃO">COMUNICAÇÃO</option>
                    <option value="CORREGEDORIA">CORREGEDORIA</option>
                  </select>
                </div>
              </div>

              {/* Autor info readout */}
              <div className="bg-[#080d17] border border-slate-800 p-2.5 rounded text-xs">
                <span className="text-[10px] text-slate-500 font-mono tracking-wider block">Redator Responsável:</span>
                <span className="text-slate-300 font-bold font-sans mt-0.5 block">
                  {autor.patente} {autor.nome} (RG {autor.rg})
                </span>
              </div>

              {/* Brasão PMESP upload simulation */}
              <div className="border border-slate-800/80 bg-[#080d17] rounded p-3 space-y-2">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Simulador de Brasão Oficial</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  Insira o Brasão do seu Clan ou Servidor para ser incorporado na folha de impressão e visualização virtual:
                </p>
                
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerUploadClick}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 text-[10px] rounded font-bold uppercase shrink-0 transition-colors cursor-pointer"
                  >
                    Efetuar Carregamento
                  </button>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64('')}
                      className="text-red-500 hover:text-red-400 font-mono text-[9px] uppercase font-bold shrink-0 cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signatures sealing block */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-2 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-amber-500" />
              <span>Chancela Eletrônica de Homologação</span>
            </h3>

            {status === 'Assinado' ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-xs text-emerald-400 leading-relaxed font-sans">
                <p className="font-bold">DOCUMENTO JÁ HOMOLOGADO E ASSINADO:</p>
                <p className="mt-1 font-mono text-[11px]">
                  Signatário: {viewingSignedStamp?.patente} {viewingSignedStamp?.nome}
                </p>
                <p className="font-mono text-[10px] text-slate-500 mt-1">
                  Chave Token de Segurança: {viewingSignedStamp?.stamp}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Para selar este expediente de forma definitiva, escolha a chancela cadastrada autorizada compatível com sua patente operacional:
                </p>
                
                <div className="space-y-2">
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded px-2 py-1.5 text-xs focus:outline-none"
                    value={selectedSignatureId}
                    onChange={(e) => setSelectedSignatureId(e.target.value)}
                  >
                    {initialAssinaturas.map(a => (
                      <option key={a.id} value={a.id}>
                        [{a.patente}] {a.nome} - {a.cargo}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleApplySignature}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-3 rounded text-xs uppercase flex items-center justify-center gap-1.5 transition-shadow cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 shrink-0" />
                    <span>Aplicar Assinatura Digital</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Composition and Preview Paper Sheet (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Navigation Tab */}
          <div className="flex justify-between items-center bg-[#0b1322] border border-slate-800 rounded-lg p-2 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('EDITOR')}
                className={`px-4 py-1 rounded text-xs uppercase font-bold transition-all cursor-pointer ${
                  activeTab === 'EDITOR' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-900'
                }`}
                disabled={status === 'Assinado'}
              >
                Escrever Conteúdo
              </button>
              <button
                onClick={() => setActiveTab('PREVIEW')}
                className={`px-4 py-1 rounded text-xs uppercase font-bold transition-all cursor-pointer ${
                  activeTab === 'PREVIEW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Visualizar Folha PMESP
              </button>
            </div>

            <div className="flex gap-2">
              {activeTab === 'PREVIEW' && (
                <>
                  <button
                    onClick={handleExportWord}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/50 p-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer"
                    title="Exportar como Word formatado"
                  >
                    <Download className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="hidden md:inline">Word</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/50 p-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-bold uppercase transition-colors cursor-pointer"
                    title="Imprimir / Exportar Oficial PDF"
                  >
                    <Printer className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="hidden md:inline">Imprimir</span>
                  </button>
                </>
              )}
              {status !== 'Assinado' && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gravar</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Compose Editor */}
          {activeTab === 'EDITOR' && (
            <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Roteamento Oficial: {tipo} ({categoria})</span>
                <span className="font-mono text-slate-500">Formato Suportado: Markdown</span>
              </div>
              <textarea
                className="w-full min-h-[500px] bg-[#070b13] text-slate-200 border border-slate-800 rounded-xl p-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-700 leading-relaxed"
                placeholder={`### PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-004\n\nRESOLVE:\n\nArtigo 1º - Promover o Sd PM...`}
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
              />
            </div>
          )}

          {/* Tab 2: Beautiful Paper Mockup rendering PMESP corporate brand style */}
          {activeTab === 'PREVIEW' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
              {/* Paper Layout Mockup */}
              <div 
                id="pmesp-paper-doc"
                className="w-[100%] max-w-[800px] min-h-[850px] bg-white text-slate-950 p-10 md:p-14 mx-auto rounded shadow-2xl relative font-sans print:shadow-none print:p-0"
              >
                {/* Traditional Coat PMESP Headers */}
                <div className="flex flex-col items-center text-center border-b-[2px] border-slate-900 pb-5 mb-8">
                  {/* Coat of arms asset placement with responsive sizing fallback */}
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    {logoBase64 || (batalhaoConfig && batalhaoConfig.logoUrl) ? (
                      <img src={batalhaoConfig?.logoUrl || logoBase64} alt="Brasão Customizado" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      /* Stylized high-fidelity PMESP Shield Vector for standard output */
                      <div className="w-16 h-16 rounded-full border-[2.5px] border-slate-950 flex flex-col items-center justify-center p-1.5 bg-slate-50">
                        <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-slate-50">
                          {/* Inner Emblem representation */}
                          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse mb-0.5" />
                          <span className="text-[7px] font-mono font-bold leading-none tracking-widest text-[#f59e0b]">PMESP</span>
                          <span className="text-[6px] font-mono leading-none tracking-tighter mt-0.5">{batalhaoConfig?.sigla || '18º BPM/M'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase font-sans">
                    {batalhaoConfig?.pmesp || 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO'}
                  </h1>
                  <h2 className="text-xs font-bold tracking-wider text-slate-800 uppercase font-sans mt-0.5">
                    {batalhaoConfig?.secretaria || 'SECRETARIA DE SEGURANÇA PÚBLICA'} - {batalhaoConfig?.sigla || '18º BPM/M'}
                  </h2>
                  <p className="text-[9px] uppercase tracking-normal text-slate-500 font-serif mt-1">
                    {batalhaoConfig?.nome || '18º Batalhão de Polícia Militar Metropolitano'} • {batalhaoConfig?.slogan || 'Sentinela da Zona Norte - Preservando a Ordem, Protegendo a Vida'}
                  </p>
                </div>

                {/* Subheader and numbers */}
                <div className="flex justify-between items-start text-[10px] font-mono text-slate-700 mb-6 uppercase border-b border-dashed border-slate-300 pb-3">
                  <div>
                    <span className="block">Roteamento: {categoria}</span>
                    <span className="block font-bold">Tipo: {tipo}</span>
                  </div>
                  <div className="text-right">
                    <span className="block">Ano do Exercício: {new Date().getFullYear()}</span>
                    <span className="block text-slate-950 font-bold">Data: {new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Main Formal content */}
                <div className="text-slate-900 text-xs leading-relaxed space-y-4 font-serif whitespace-pre-wrap min-h-[400px]">
                  {conteudo ? (
                    conteudo
                  ) : (
                    <div className="text-center py-20 text-slate-400 italic">
                      [Documento sem conteúdo redigido. Por favor, adicione texto na aba de Edição ou carregue um Modelo.]
                    </div>
                  )}
                </div>

                {/* Signature Chancellery Stamp Box at bottom */}
                <div className="border-t-[1.5px] border-slate-900 mt-10 pt-6 flex flex-col items-center text-center">
                  {status === 'Assinado' ? (
                    <div className="relative inline-flex flex-col items-center p-4 border border-blue-900 rounded bg-slate-50 font-sans max-w-sm">
                      {/* Certified police validation seal stamp graphic */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center border border-blue-500">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[8px] font-mono text-blue-700 font-bold uppercase tracking-widest block mb-1">
                        Chancela Digital de Segurança PMESP
                      </span>
                      <p className="text-[11px] font-bold text-slate-950">
                        {viewingSignedStamp?.patente} {viewingSignedStamp?.nome}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        CHAVE DE AUTENTICIDADE REGISTRADA NO SEI PMESP
                      </p>
                      <span className="text-[9px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 mt-2 block">
                        {viewingSignedStamp?.stamp}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 mt-1 block">
                        Sincronismo: ID de Sessão Oauth Criptografada ({new Date(viewingSignedStamp?.data || '').toLocaleDateString()})
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 italic text-slate-400 text-[10px]">
                      Este documento figura provisoriamente como ROTEIRO RASCUNHO. Assinaturas institucionais e rubricas táticas não foram inseridas até aprovação final.
                    </div>
                  )}
                </div>

                {/* Footer Watermark */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-[7px] text-slate-400 font-mono tracking-widest print:hidden uppercase">
                  SISTEMA POLICIAL MILITAR • {batalhaoConfig?.sigla || '18º BPM/M'} • SÃO PAULO
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
