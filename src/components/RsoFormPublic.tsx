/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  Upload, 
  FileText, 
  X, 
  Lock, 
  Printer, 
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  Building
} from 'lucide-react';
import { Rso, RsoAnexo, RankPM } from '../types';

interface RsoFormPublicProps {
  onBackToLogin: () => void;
}

const PATENTES: RankPM[] = [
  'Cel PM', 
  'Ten Cel PM', 
  'Maj PM', 
  'Cap PM', 
  '1º Ten PM', 
  'Subten PM', 
  '1º Sgt PM', 
  '2º Sgt PM', 
  '3º Sgt PM', 
  'Cb PM', 
  'Sd PM'
];

export default function RsoFormPublic({ onBackToLogin }: RsoFormPublicProps) {
  // Form submission state
  const [nome, setNome] = useState('');
  const [rg, setRg] = useState('');
  const [patente, setPatente] = useState<RankPM>('Sd PM');
  const [prefixoViatura, setPrefixoViatura] = useState('');
  const [funcao, setFuncao] = useState<'Encarregado' | 'Motorista' | 'Apoio'>('Encarregado');
  const [dataServico, setDataServico] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFim, setHoraFim] = useState('19:00');
  const [setor, setSetor] = useState('');
  const [policiaisPatrulha, setPoliciaisPatrulha] = useState('');
  
  // Operational Metrics
  const [abordagens, setAbordagens] = useState<number>(0);
  const [veiculosAbordados, setVeiculosAbordados] = useState<number>(0);
  const [pessoasAbordadas, setPessoasAbordadas] = useState<number>(0);
  const [prisoes, setPrisoes] = useState<number>(0);
  const [apreensoes, setApreensoes] = useState<number>(0);
  const [ocorrencias, setOcorrencias] = useState<number>(0);
  
  const [observacoes, setObservacoes] = useState('');
  const [anexos, setAnexos] = useState<RsoAnexo[]>([]);
  const [declaracaoVeracidade, setDeclaracaoVeracidade] = useState(false);
  const [assinaturaDigital, setAssinaturaDigital] = useState('');

  // Status and result states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRso, setSubmittedRso] = useState<Rso | null>(null);

  // Drag and drop focus tracking
  const [isDragging, setIsDragging] = useState(false);

  // Time tracker for PMESP institutional clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAnexos(prev => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
          base64: reader.result as string
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach((file: any) => {
        processFile(file);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: any) => {
        processFile(file);
      });
    }
  };

  const removeAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Frontend validations
    if (!nome || !rg || !prefixoViatura || !setor || !policiaisPatrulha) {
      setSubmitError('Por favor, preencha todos os campos obrigatórios do formulário.');
      return;
    }

    if (!declaracaoVeracidade) {
      setSubmitError('É obrigatório declarar a veracidade das informações prestadas.');
      return;
    }

    if (!assinaturaDigital || assinaturaDigital.trim().toLowerCase() !== nome.trim().toLowerCase()) {
      setSubmitError(`A assinatura digital deve coincidir exatamente com seu nome completo (${nome}).`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nome_policial: nome,
        rg,
        patente,
        prefixo_viatura: prefixoViatura,
        funcao,
        data_servico: dataServico,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        setor,
        policiais_patrulha: policiaisPatrulha,
        abordagens: Number(abordagens) || 0,
        veiculos_abordados: Number(veiculosAbordados) || 0,
        pessoas_abordadas: Number(pessoasAbordadas) || 0,
        prisoes: Number(prisoes) || 0,
        apreensoes: Number(apreensoes) || 0,
        ocorrencias: Number(ocorrencias) || 0,
        observacoes,
        anexos,
        declaracao_veracidade: declaracaoVeracidade,
        assinatura_digital: assinaturaDigital
      };

      const response = await fetch('/api/rso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Falha de comunicação com o servidor militar para envio do RSO.');
      }

      const data: Rso = await response.json();
      setSubmittedRso(data);
    } catch (err: any) {
      setSubmitError(err.message || 'Erro inesperado ao registrar o RSO.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const resetForm = () => {
    setNome('');
    setRg('');
    setPatente('Sd PM');
    setPrefixoViatura('');
    setFuncao('Encarregado');
    setDataServico(new Date().toISOString().split('T')[0]);
    setHoraInicio('07:00');
    setHoraFim('19:00');
    setSetor('');
    setPoliciaisPatrulha('');
    setAbordagens(0);
    setVeiculosAbordados(0);
    setPessoasAbordadas(0);
    setPrisoes(0);
    setApreensoes(0);
    setOcorrencias(0);
    setObservacoes('');
    setAnexos([]);
    setDeclaracaoVeracidade(false);
    setAssinaturaDigital('');
    setSubmittedRso(null);
    setSubmitError(null);
  };

  if (submittedRso) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 selection:bg-blue-600/30 font-sans relative">
        {/* Print-only CSS layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-card {
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
              max-width: 100% !important;
              width: 100% !important;
              padding: 0 !important;
            }
            .print-border {
              border: 1px solid black !important;
            }
            .print-text-dark {
              color: black !important;
            }
          }
        `}} />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,40,90,0.12)_0,transparent_60%)] pointer-events-none no-print" />
        
        <div className="w-full max-w-2xl bg-[#0c1322] border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative print-card">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-amber-500 no-print" />

          {/* Success Banner */}
          <div className="flex flex-col items-center text-center mb-6 no-print">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">RSO ENVIADO COM SUCESSO!</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              O relatório foi devidamente persistido e retransmitido ao Discord do Batalhão.
            </p>
          </div>

          {/* Institutional Blueprint Receipt layout */}
          <div className="bg-[#0f182a]/70 rounded-xl border border-slate-800 p-5 md:p-6 print-border print-text-dark print:bg-white print:border-black">
            {/* Printable Header */}
            <div className="flex items-center gap-4 border-b border-slate-800/80 pb-4 mb-4 print:border-black">
              <div className="w-12 h-12 rounded-full bg-gradient-to-b from-blue-950 to-[#0e1624] border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-500 shrink-0 print:border-black print:bg-slate-100">
                <Shield className="w-6 h-6 text-amber-500 print:text-black" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block font-mono print:text-black">
                  POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
                </span>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight leading-tight uppercase print:text-black">
                  18º Batalhão de Polícia Militar Metropolitano
                </h3>
                <span className="text-[10px] text-amber-500 font-mono block font-semibold print:text-black">
                  CÓDIGO DE TRANSMISSÃO DE PROTOCOLO OPERACIONAL
                </span>
              </div>
            </div>

            {/* Protocol highlights */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-[#18233c] p-4 rounded-lg border border-slate-700/50 gap-2 print:border-black print:bg-slate-100 print:text-black">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Número do Protocolo</span>
                <span className="text-lg font-mono font-bold text-amber-500 block">{submittedRso.protocolo}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block text-left sm:text-right">Hora do Envio</span>
                <span className="text-xs font-mono text-slate-200 block text-left sm:text-right print:text-black">
                  {new Date(submittedRso.data_envio).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Section 1: Efetivo */}
            <div className="mb-4">
              <h4 className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider mb-2 font-mono border-b border-slate-800 pb-1 print:border-black print:text-black">
                1. DADOS DOS INTEGRANTES DA PATRULHA
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Policial Militar</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    [{submittedRso.patente}] {submittedRso.nome_policial}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">RE / RG Funcional</span>
                  <span className="font-semibold text-slate-200 print:text-black">{submittedRso.rg}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Viatura prefixo</span>
                  <span className="font-semibold text-slate-200 print:text-black">{submittedRso.prefixo_viatura}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Função na Viatura</span>
                  <span className="font-semibold text-slate-200 print:text-black">{submittedRso.funcao}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Detalhes do plantao */}
            <div className="mb-4">
              <h4 className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider mb-2 font-mono border-b border-slate-800 pb-1 print:border-black print:text-black">
                2. DADOS DO PERÍODO DE SERVIÇO
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-sans">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Data do Serviço</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {submittedRso.data_servico.split('-').reverse().join('/')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Horário Operativo</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {submittedRso.hora_inicio}h às {submittedRso.hora_fim}h
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Setor de Patrulhamento</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">{submittedRso.setor}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block uppercase">Policiais em Patrulhamento (Guarnição)</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">{submittedRso.policiais_patrulha}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Produtividade */}
            <div className="mb-4">
              <h4 className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider mb-2 font-mono border-b border-slate-800 pb-1 print:border-black print:text-black">
                3. PRODUTIVIDADE OPERACIONAL OBTIDA
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Abordagens</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{submittedRso.abordagens}</span>
                </div>
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Veíc. Abordados</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{submittedRso.veiculos_abordados}</span>
                </div>
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Pess. Abordadas</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{submittedRso.pessoas_abordadas}</span>
                </div>
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-500 font-mono text-[9px] block uppercase">Prisões</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 print:text-black">{submittedRso.prisoes}</span>
                </div>
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-500 font-mono text-[9px] block uppercase">Apreensões</span>
                  <span className="text-sm font-bold font-mono text-amber-500 print:text-black">{submittedRso.apreensoes}</span>
                </div>
                <div className="bg-[#131b2c] p-2 rounded border border-slate-800/80 print:bg-slate-100 print:border-black">
                  <span className="text-slate-500 font-mono text-[9px] block uppercase">Ocorrências</span>
                  <span className="text-sm font-bold font-mono text-blue-400 print:text-black">{submittedRso.ocorrencias}</span>
                </div>
              </div>
            </div>

            {/* Section 4: Obs */}
            {submittedRso.observacoes && (
              <div className="mb-4">
                <h4 className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider mb-1.5 font-mono border-b border-slate-800 pb-1 print:border-black print:text-black">
                  4. OBSERVAÇÕES GERAIS E RELATO DOS FATOS
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap px-1 print:text-black">
                  {submittedRso.observacoes}
                </p>
              </div>
            )}

            {/* Section 5: Anexos list */}
            {submittedRso.anexos && submittedRso.anexos.length > 0 && (
              <div className="mb-4 no-print">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono border-b border-slate-800 pb-1">
                  X. ANEXOS COMPLEMENTARES ENVIADOS ({submittedRso.anexos.length})
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {submittedRso.anexos.map((anexo, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#141b2b] px-2.5 py-1.5 rounded border border-slate-800/80">
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate text-slate-300 flex-1">{anexo.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {(anexo.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: Assinatura */}
            <div className="border-t border-slate-800/80 pt-4 mt-6 text-center flex flex-col items-center justify-center print:border-black">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 font-mono print:text-black">
                TERMO ASSINADO DIGITALMENTE
              </span>
              <p className="text-[11px] text-slate-400 italic max-w-sm mt-1 print:text-black">
                "Declaro sob as penas da Lei Militar e Penal que as informações operacionais preenchidas acima refletem estritamente a verdade."
              </p>
              <div className="mt-4 border-b border-dashed border-slate-700 w-64 pb-1 print:border-black">
                <span className="font-mono text-sm leading-none font-bold text-slate-200 tracking-wide select-none print:text-black" style={{ fontFamily: 'Georgia, serif' }}>
                  {submittedRso.assinatura_digital}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase print:text-black">
                Chave da Assinatura: SHA256-RSO-{submittedRso.id.split('-')[1] || 'CHAVE'}
              </span>
            </div>
          </div>

          {/* Action row */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between items-center no-print">
            <button
              onClick={onBackToLogin}
              className="w-full sm:w-auto text-xs font-bold text-slate-400 hover:text-slate-200 px-4 py-2 hover:bg-slate-900 border border-transparent rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Quartel Principal</span>
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={resetForm}
                className="flex-1 sm:flex-none text-xs font-bold bg-[#141b2c] hover:bg-[#1a253d] text-slate-300 border border-slate-700 rounded-lg px-4 py-2 transition-colors cursor-pointer"
              >
                Preencher Outro RSO
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 sm:flex-none text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-1.5 shadow shadow-blue-900/40 cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-between py-6 px-4 selection:bg-blue-600/30 font-sans relative">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,40,90,0.15)_0,transparent_65%)] pointer-events-none" />

      {/* Header Panel */}
      <header className="w-full max-w-4xl mx-auto mb-6 bg-[#0c1322] border border-slate-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-[#10192e] to-[#070b13] border border-amber-500/35 flex items-center justify-center p-1.5">
            <Shield className="w-full h-full text-amber-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight block uppercase">
              18º BPM/M - BATALHÃO DA ZONA NORTE
            </h1>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Envio Público de Relatórios de Serviço Operacional (RSO)
            </span>
          </div>
        </div>

        {/* Local time and return button */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="bg-[#050810] px-3 py-1.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <button
            onClick={onBackToLogin}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-[#121c31] border border-slate-800 hover:border-slate-705 px-3 py-1.5 rounded uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Retornar</span>
          </button>
        </div>
      </header>

      {/* Form content */}
      <main className="w-full max-w-4xl mx-auto flex-1 bg-[#0c1322] border border-slate-850 rounded-xl relative overflow-hidden flex flex-col shadow-2xl mb-6">
        
        {/* Form brand marker */}
        <div className="bg-[#10192e] border-b border-slate-900 p-5 flex items-center gap-3">
          <ClipboardCheck className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-100">FORMULÁRIO DE ATIVIDADES DE PATRULHA</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Insira os dados funcionais das equipes e a produtividade total acumulada durante seu turno. Todos os campos são obrigatórios.
            </p>
          </div>
        </div>

        {/* Submission notification reading error validation */}
        {submitError && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 px-5 py-3 text-xs leading-normal">
            <span className="font-semibold">Erro de Validação:</span> {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Section 1: Efetivo e Viatura */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 bg-blue-500 h-4 rounded" />
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">
                1. Identificação do Efetivo e Viatura
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nome */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome do Policial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo de serviço"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              {/* RG */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  RE / RG Funcional <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="PM-XX.XXX ou similar"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                />
              </div>

              {/* Patente */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Patente <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value as RankPM)}
                >
                  {PATENTES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Prefixo da Viatura */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Prefixo da Viatura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M-18012"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={prefixoViatura}
                  onChange={(e) => setPrefixoViatura(e.target.value)}
                />
              </div>

              {/* Função na viatura */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Função na Viatura <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 bg-[#070b14] p-1 border border-slate-800 rounded-md h-[34px] items-center">
                  {(['Encarregado', 'Motorista', 'Apoio'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFuncao(f)}
                      className={`flex-1 text-[10px] font-bold py-1 px-2.5 rounded transition-colors uppercase ${
                        funcao === f 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Policiais em Patrulhamento */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Policiais em Patrulhamento (Guarnição) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sgt PM Ramos, Cb PM Silva, Sd PM Sousa"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={policiaisPatrulha}
                  onChange={(e) => setPoliciaisPatrulha(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data e Horários */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 bg-[#10b981] h-4 rounded" />
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                2. Período e Setor Operacional
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Data do Servico */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data de Serviço <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={dataServico}
                  onChange={(e) => setDataServico(e.target.value)}
                />
              </div>

              {/* Horário Inicial */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Horário Inicial <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>

              {/* Horário Final */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Horário Final <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </div>

              {/* Setor de Patrulhamento */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Setor de Patrulhamento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sul / Cachoeirinha"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Metricas Táticas de Produtividade */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 bg-[#f59e0b] h-4 rounded" />
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider font-mono">
                3. Índices de Produtividade Tática
              </h4>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {/* Abordagens */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Quantidade de abordagens">
                  Abordagens Realizadas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  value={abordagens}
                  onChange={(e) => setAbordagens(Number(e.target.value))}
                />
              </div>

              {/* Veiculos abordados */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Quantidade de veículos abordados">
                  Veíc. Abordados
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  value={veiculosAbordados}
                  onChange={(e) => setVeiculosAbordados(Number(e.target.value))}
                />
              </div>

              {/* Pessoas abordadas */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate" title="Quantidade de pessoas abordadas">
                  Pessoas Abordadas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  value={pessoasAbordadas}
                  onChange={(e) => setPessoasAbordadas(Number(e.target.value))}
                />
              </div>

              {/* Prisoes */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
                  Prisões Realizadas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono text-emerald-400"
                  value={prisoes}
                  onChange={(e) => setPrisoes(Number(e.target.value))}
                />
              </div>

              {/* Apreensoes */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
                  Apreensões Registradas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono text-amber-500"
                  value={apreensoes}
                  onChange={(e) => setApreensoes(Number(e.target.value))}
                />
              </div>

              {/* Ocorrencias */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
                  Ocorrências Atendidas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono text-blue-400"
                  value={ocorrencias}
                  onChange={(e) => setOcorrencias(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Obs */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 bg-indigo-500 h-4 rounded" />
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
                4. Narrativa de Ocorrência e Observações Gerais
              </h4>
            </div>

            <textarea
              rows={4}
              placeholder="Digite de forma estruturada e militar os principais fatos do turno de serviço, deslocamentos relevantes ou observações táticas excepcionais..."
              className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 \n py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-y leading-relaxed font-sans"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          {/* Section 5: Anexos e Drag & Drop */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 bg-[#a855f7] h-4 rounded" />
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                5. Anexos de Relatórios e Evidências
              </h4>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Anexe capturas de tela (prints), laudos operacionais, arquivos PDF de ocorrências ou relatórios complementares necessários.
            </p>

            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
                isDragging 
                  ? 'border-purple-500 bg-purple-500/5' 
                  : 'border-slate-800 hover:border-slate-700 bg-[#070b14]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                id="rso-file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label 
                htmlFor="rso-file-upload" 
                className="flex flex-col items-center justify-center cursor-pointer gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-300 font-semibold">
                  Arraste e solte arquivos aqui ou <span className="text-purple-500 underline">clique para selecionar</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Suporta Imagens (PNG/JPG), capturas de tela (prints), PDF, Planilhas excel ou txt de relato.
                </span>
              </label>
            </div>

            {/* List of uploaded attachments */}
            {anexos.length > 0 && (
              <div className="mt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Arquivos prontos para envio ({anexos.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {anexos.map((anexo, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between bg-[#11192a] px-3 py-2 rounded border border-slate-800"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs text-slate-200 truncate pr-2">{anexo.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {(anexo.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAnexo(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Assinatura Digital de Fé Institucional */}
          <div className="bg-[#10192e]/60 p-4 rounded-lg border border-slate-800/80 space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="term-declaration"
                className="w-4 h-4 rounded border-slate-800 text-blue-600 bg-black focus:ring-0 cursor-pointer mt-0.5"
                checked={declaracaoVeracidade}
                onChange={(e) => setDeclaracaoVeracidade(e.target.checked)}
              />
              <label 
                htmlFor="term-declaration" 
                className="text-xs text-slate-300 select-none cursor-pointer leading-relaxed"
              >
                <strong className="text-slate-100">Declaração de Fé Pública do Policial Militar:</strong> Declaro que passei as informações acima sob o mais alto rigor técnico e deontológico militar. Todas as estatísticas e observações gerais registradas neste RSO refletem estritamente a verdade das ações operativas do policiamento da referida escala, sob as cominações legais cabíveis.
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirme sua Assinatura Digital (Escreva seu Nome Completo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome exatamente como escrito no início"
                  className="w-full bg-[#070b14] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  value={assinaturaDigital}
                  onChange={(e) => setAssinaturaDigital(e.target.value)}
                />
                <span className="text-[10px] text-slate-500 font-sans block mt-1">
                  Para assinar eletronicamente este termo de veracidade, preencha seu nome idêntico ao campo policial.
                </span>
              </div>

              {/* Verified Badge preview */}
              <div className="bg-[#050810] rounded border border-slate-900 flex flex-col justify-center px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${assinaturaDigital && nome && assinaturaDigital.trim().toLowerCase() === nome.trim().toLowerCase() ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                    VALIDADOR DE CHANCELA DIGITAL DO 18BPM:
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {assinaturaDigital && nome && assinaturaDigital.trim().toLowerCase() === nome.trim().toLowerCase() 
                    ? `✓ CHANCELA PRONTA: "${assinaturaDigital}"` 
                    : "✗ AGUARDANDO ASSINATURA COMPATÍVEL"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Action buttons */}
          <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-400 hover:text-slate-300 border border-transparent hover:bg-slate-900 rounded-lg px-4 py-2 transition-colors cursor-pointer"
            >
              Limpar Campos
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-lg transition-colors flex items-center gap-2 shadow shadow-blue-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin shrink-0" />
                  <span>Transmitindo Protocolo...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Finalizar e Transmitir RSO</span>
                </>
              )}
            </button>
          </div>

        </form>

      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-2 text-[10px] text-slate-600">
        © 2026 PMESP - 18º Batalhão de Polícia Militar Metropolitano. Sistema de Gestão RSO - FiveM Cop Roleplay.
      </footer>

    </div>
  );
}
