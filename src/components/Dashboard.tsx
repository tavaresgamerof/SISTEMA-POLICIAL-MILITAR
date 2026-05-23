/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  ShieldAlert, 
  FileSignature, 
  Radio, 
  Activity, 
  Plus, 
  Clock, 
  Layers
} from 'lucide-react';
import { Policial, Documento, OperacaoPM, LogPM, DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  policiais: Policial[];
  documentos: Documento[];
  operacoes: OperacaoPM[];
  logs: LogPM[];
  onCreateDocument: () => void;
  onViewDocument: (id: string) => void;
}

export default function Dashboard({ 
  stats, 
  policiais, 
  documentos, 
  operacoes, 
  logs, 
  onCreateDocument,
  onViewDocument
}: DashboardProps) {

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'Criar': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'Editar': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'Assinar': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Login': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Banner / Header */}
      <div className="relative bg-[#0b1322] border border-slate-800 rounded-xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-slate-900/40 to-slate-950 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 h-full w-1/3 opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_right,rgba(251,191,36,0.3),transparent)]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">Painel de Comando 18º BPM/M</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Sistema unificado de gestão administrativa do Décimo Oitavo Batalhão de Polícia Militar Metropolitano. 
              Geração de portarias, ordens de serviço e sindicâncias oficiais integradas com auto-apropriação via IA.
            </p>
          </div>
          <button
            onClick={onCreateDocument}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs shadow-md shadow-amber-500/10 transition-colors uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Documento</span>
          </button>
        </div>
      </div>

      {/* Grid: Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Efetivo Cadastrado</span>
            <span className="text-lg font-bold text-slate-100 block">{stats.totalPoliciais}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Documentos</span>
            <span className="text-lg font-bold text-slate-100 block">
              {stats.totalDocumentos} <span className="text-xs font-normal text-slate-500">({stats.totalAssinados} assinados)</span>
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Promoções Ativas</span>
            <span className="text-lg font-bold text-slate-100 block">{stats.promocoesMes} Mês</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#0b1322] border border-slate-800/80 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Corregedoria / Sindicâncias</span>
            <span className="text-lg font-bold text-slate-100 block">{stats.sindicanciasAtivas} Ativas</span>
          </div>
        </div>
      </div>

      {/* Grid: Primary content + operations sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Recent Documents (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Últimos Documentos Registrados</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">Atualizado em tempo real</span>
            </div>

            <div className="divide-y divide-slate-800/60 font-sans">
              {documentos.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhum documento registrado na mesa do comando.
                </div>
              ) : (
                documentos.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="py-3 flex justify-between items-center hover:bg-slate-800/20 px-2 rounded-md transition-colors group">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10 shrink-0 font-bold">
                          {doc.numeracao}
                        </span>
                        <span className="text-xs text-slate-400 capitalize truncate font-semibold">
                          {doc.tipo}
                        </span>
                      </div>
                      <h4 className="text-slate-200 font-medium text-xs mt-1 truncate max-w-md group-hover:text-blue-400 transition-colors">
                        {doc.titulo}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Autor:</span>
                        <span className="font-medium text-slate-400">{doc.autor.patente} {doc.autor.nome}</span>
                        <span>•</span>
                        <span>{new Date(doc.dataCriacao).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded border font-mono ${
                        doc.status === 'Assinado' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {doc.status}
                      </span>
                      <button
                        onClick={() => onViewDocument(doc.id)}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        Abrir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Logs (Audit Trailing) */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Histórico de Auditoria Disciplinar (Logs)</h3>
              </div>
              <span className="text-[10px] text-amber-500 font-mono tracking-widest uppercase">Segurança Ativa</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40 text-slate-300">
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${getLogTypeBadge(log.tipo)}`}>
                      {log.tipo}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono">{formatTime(log.data)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-400 text-[11px]">
                      {log.autor}
                    </p>
                    <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                      {log.acao}
                    </p>
                    {log.ip && (
                      <span className="text-[8px] text-slate-600 block font-mono">Chave de Assinatura IP: {log.ip}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Status Operacional / Escalas Side (Span 1) */}
        <div className="space-y-6">
          
          {/* Active Operations Card */}
          <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Status das Operações de Rua</h3>
            </div>

            <div className="space-y-4">
              {operacoes.map((op) => (
                <div key={op.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-200 uppercase">{op.nome}</h4>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      op.status === 'Em Andamento' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : op.status === 'Planejamento' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {op.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {op.descricao}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono flex flex-wrap justify-between items-center border-t border-slate-800/60 pt-2 gap-1">
                    <span>CMD: {op.comandante}</span>
                    <span>Setor: {op.local}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick-Rules Panel */}
          <div className="bg-gradient-to-b from-[#111927] to-[#0b1322] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Layers className="w-20 h-20 text-slate-300" />
            </div>
            
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Doutrina de Serviço</span>
            </h3>
            
            <ul className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed font-sans">
              <li className="flex gap-1.5 items-start">
                <span className="text-amber-500 font-bold shrink-0">1.</span>
                <span>Qualquer documento oficial assinado eletronicamente por Oficial de Patente Cel ou Ten Cel é considerado soberano e inalterável de imediato.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-amber-500 font-bold shrink-0">2.</span>
                <span>Promovidos via assistente de Inteligência Artificial do Batalhão são imediatamente atualizados no RG funcional.</span>
              </li>
              <li className="flex gap-1.5 items-start">
                <span className="text-amber-500 font-bold shrink-0">3.</span>
                <span>A abertura de Sindicâncias exige formalidade de Corregedoria sob sanções disciplinares previstas na Constituição PMESP.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
