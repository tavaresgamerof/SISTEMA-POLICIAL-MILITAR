/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Calendar, 
  Car, 
  MapPin, 
  Eye, 
  UserCheck, 
  Download, 
  Printer, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Trash2,
  Filter,
  CheckCircle2,
  Users,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Rso, RankPM, UserRole } from '../types';

interface RsoManagerProps {
  userRole: UserRole;
  currentUserNome: string;
  onRefreshData: () => void;
}

export default function RsoManager({ userRole, currentUserNome, onRefreshData }: RsoManagerProps) {
  const [rsos, setRsos] = useState<Rso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filterPolicial, setFilterPolicial] = useState('');
  const [filterData, setFilterData] = useState('');
  const [filterViatura, setFilterViatura] = useState('');
  const [filterSetor, setFilterSetor] = useState('');
  const [filterPoliciaisPatrulha, setFilterPoliciaisPatrulha] = useState('');

  // Selected single RSO for modal details
  const [selectedRso, setSelectedRso] = useState<Rso | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Load RSOs on component mount
  const fetchRsos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/rso');
      if (!res.ok) throw new Error('Não foi possível obter os Relatórios de Serviço Operacional (RSO).');
      const data = await res.json();
      setRsos(data);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com as APIs de RSO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsos();
  }, []);

  // Filtered dataset
  const filteredRsos = rsos.filter(rso => {
    const matchPolicial = !filterPolicial || rso.nome_policial.toLowerCase().includes(filterPolicial.toLowerCase()) || rso.rg.includes(filterPolicial);
    const matchData = !filterData || rso.data_servico === filterData;
    const matchViatura = !filterViatura || rso.prefixo_viatura.toLowerCase().includes(filterViatura.toLowerCase());
    const matchSetor = !filterSetor || rso.setor.toLowerCase().includes(filterSetor.toLowerCase());
    const matchPoliciaisPatrulha = !filterPoliciaisPatrulha || (rso.policiais_patrulha || rso.supervisor || '').toLowerCase().includes(filterPoliciaisPatrulha.toLowerCase());
    return matchPolicial && matchData && matchViatura && matchSetor && matchPoliciaisPatrulha;
  });

  // Calculate dynamic dashboard stats
  const totalReports = rsos.length;
  const totalAbordagens = rsos.reduce((acc, r) => acc + (r.abordagens || 0), 0);
  const totalVeiculos = rsos.reduce((acc, r) => acc + (r.veiculos_abordados || 0), 0);
  const totalPessoas = rsos.reduce((acc, r) => acc + (r.pessoas_abordadas || 0), 0);
  const totalPrisoes = rsos.reduce((acc, r) => acc + (r.prisoes || 0), 0);
  const totalApreensoes = rsos.reduce((acc, r) => acc + (r.apreensoes || 0), 0);
  const totalOcorrencias = rsos.reduce((acc, r) => acc + (r.ocorrencias || 0), 0);

  // Dynamic ranking logic
  // 1. Policiais mais ativos (most RSOs submitted)
  const policeActivityMap: Record<string, { nome: string; patente: RankPM; count: number; approaches: number }> = {};
  rsos.forEach(r => {
    const key = `${r.patente}_${r.nome_policial}`;
    if (!policeActivityMap[key]) {
      policeActivityMap[key] = { nome: r.nome_policial, patente: r.patente, count: 0, approaches: 0 };
    }
    policeActivityMap[key].count += 1;
    policeActivityMap[key].approaches += (r.abordagens || 0);
  });
  const topPoliciais = Object.values(policeActivityMap)
    .sort((a, b) => b.count - a.count || b.approaches - a.approaches)
    .slice(0, 5);

  // 2. Viaturas mais produtivas (most approaches / prisoes sum)
  const viaturaActivityMap: Record<string, { prefixo: string; count: number; metrics: number }> = {};
  rsos.forEach(r => {
    const key = r.prefixo_viatura.toUpperCase().trim();
    if (!viaturaActivityMap[key]) {
      viaturaActivityMap[key] = { prefixo: r.prefixo_viatura, count: 0, metrics: 0 };
    }
    viaturaActivityMap[key].count += 1;
    viaturaActivityMap[key].metrics += (r.abordagens || 0) + (r.prisoes || 0) * 10 + (r.ocorrencias || 0) * 2;
  });
  const topViaturas = Object.values(viaturaActivityMap)
    .sort((a, b) => b.metrics - a.metrics)
    .slice(0, 5);

  // Export Filtered RSOs as Excel/CSV compatible formatting
  const handleExportExcel = () => {
    if (filteredRsos.length === 0) {
      alert('Nenhum relatório RSO catalogado sob os filtros atuais para exportação.');
      return;
    }

    // Prepare CSV data headers to represent Rso database schema exactly
    const csvHeaders = [
      'Protocolo',
      'Data Envio',
      'Policial Militar',
      'Patente',
      'RG Funcional',
      'Viatura Prefixo',
      'Funcao',
      'Data Servico',
      'Hora Inicio',
      'Hora Fim',
      'Setor Patrulhamento',
      'Policiais em Patrulhamento (Guarnição)',
      'Abordagens',
      'Veiculos Abordados',
      'Pessoas Abordadas',
      'Prisoes Realizadas',
      'Apreensoes',
      'Ocorrencias Atendidas',
      'Observacoes'
    ];

    const csvRows = filteredRsos.map(r => [
      r.protocolo,
      new Date(r.data_envio).toLocaleString('pt-BR'),
      `"${r.nome_policial.replace(/"/g, '""')}"`,
      r.patente,
      r.rg,
      r.prefixo_viatura,
      r.funcao,
      r.data_servico,
      r.hora_inicio,
      r.hora_fim,
      `"${r.setor.replace(/"/g, '""')}"`,
      `"${(r.policiais_patrulha || r.supervisor || '').replace(/"/g, '""')}"`,
      r.abordagens,
      r.veiculos_abordados,
      r.pessoas_abordadas,
      r.prisoes,
      r.apreensoes,
      r.ocorrencias,
      `"${(r.observacoes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    // Build CSV file string using unicode BOM helper for flawless Excel parsing
    const csvContent = '\uFEFF' + [csvHeaders.join(';'), ...csvRows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Auto-formatted current year filename
    const year = new Date().getFullYear();
    link.setAttribute('download', `Estatistica_RSO_18BPMM_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRso = async (id: string, userQuery: string) => {
    if (!window.confirm('Confirma a exclusão definitiva deste RSO? Esta ação registrará um log de controle militar e é irreversível.')) {
      return;
    }
    try {
      const res = await fetch(`/api/rso/${id}?user=${encodeURIComponent(userQuery)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Não foi possível excluir o RSO.');
      
      alert('✓ Relatório RSO removido da base com sucesso.');
      fetchRsos();
      onRefreshData(); // refresh parent logs/activities
    } catch (err: any) {
      alert('Erro na exclusão: ' + err.message);
    }
  };

  // Check role authorization
  const isAuthorized = ['Comandante', 'Subcomandante', 'Estado-Maior', 'Oficial'].includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="bg-[#0f192b] border border-red-500/10 p-8 rounded-2xl flex flex-col items-center text-center justify-center space-y-4 max-w-xl mx-auto shadow-lg">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 tracking-tight uppercase">ACESSO NEGADO AO COMANDO</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          De acordo com os regulamentos regimentais do 18º BPM/M, apenas oficiais administrativos e praças designados (Comandante, Subcomandante, CFP, CGP ou membros da Assessoria do Estado-Maior) possuem autorização tática de acesso à base de estatísticas e auditoria de RSOs operacionais.
        </p>
        <span className="text-[10px] text-amber-500 font-mono bg-amber-500/5 px-2.5 py-1 rounded">
          SUA REGRA DE RECURSO ATUAL: {userRole.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      
      {/* Printable template view for individual RSO */}
      {selectedRso && (
        <RsoPrintModal 
          rso={selectedRso} 
          onClose={() => setSelectedRso(null)} 
        />
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <span>MÓDULO RSO – GESTÃO DE RELATÓRIOS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Painel Geral do Batalhão para auditoria operacional das escalas do 18º BPM/M
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow shadow-emerald-900/40 cursor-pointer self-stretch sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Relatórios Excel</span>
        </button>
      </div>

      {/* DASHBOARD SUMMARY CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">RSOs Enviados</span>
          <span className="text-xl font-mono font-bold text-slate-100 block mt-2">{totalReports}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Abordagens</span>
          <span className="text-xl font-mono font-bold text-blue-400 block mt-2">{totalAbordagens}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Veículos Abord.</span>
          <span className="text-xl font-mono font-bold text-indigo-400 block mt-2">{totalVeiculos}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Pessoas Abord.</span>
          <span className="text-xl font-mono font-bold text-purple-400 block mt-2">{totalPessoas}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-emerald-400 font-mono block">Prisões Realiz.</span>
          <span className="text-xl font-mono font-bold text-emerald-400 block mt-2">{totalPrisoes}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-amber-500 font-mono block">Apreensões</span>
          <span className="text-xl font-mono font-bold text-amber-500 block mt-2">{totalApreensoes}</span>
        </div>
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 flex flex-col justify-between shadow-md">
          <span className="text-[9px] uppercase font-bold text-slate-450 font-mono block">Ocorrências Atend.</span>
          <span className="text-xl font-mono font-bold text-slate-100 block mt-2">{totalOcorrencias}</span>
        </div>
      </section>

      {/* DYNAMIC LEADERBOARDS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Policiais PM */}
        <div className="bg-[#0d1421] border border-slate-850 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Efetivo Mais Ativo de Patrulhamento
            </h3>
          </div>
          <div className="space-y-2">
            {topPoliciais.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono block py-2">Sem histórico funcional no sistema ainda.</span>
            ) : (
              topPoliciais.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-[#0b0e16] px-3 py-2 rounded border border-slate-900">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-slate-500 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 truncate leading-none block">
                      [{p.patente}] {p.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-mono font-semibold shrink-0 pl-3">
                    <span>{p.count} RSOs</span>
                    <span className="text-blue-400">{p.approaches} Abordagens</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Viaturas PM */}
        <div className="bg-[#0d1421] border border-slate-850 p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800/80">
            <Car className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Viaturas Mais Produtivas (Pontuação Operacional)
            </h3>
          </div>
          <div className="space-y-2">
            {topViaturas.length === 0 ? (
              <span className="text-xs text-slate-500 font-mono block py-2">Nenhuma viatura reportada na base.</span>
            ) : (
              topViaturas.map((v, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs bg-[#0b0e16] px-3 py-2 rounded border border-slate-900">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-slate-500 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 truncate uppercase">
                      Viatura: {v.prefixo}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-450 font-mono text-[10px] uppercase font-bold shrink-0 pl-3">
                    <span>{v.count} Turnos</span>
                    <span className="text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded">
                      Pt: {v.metrics}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FILTER BAR GRID */}
      <section className="bg-[#0c1322] border border-slate-850 p-4 rounded-xl space-y-3 shadow-inner">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
            Filtros Avançados de Auditoria
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Policial */}
          <div>
            <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Policial / RG</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar por nome ou RG..."
                className="w-full bg-[#070b13] text-slate-200 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-blue-500"
                value={filterPolicial}
                onChange={(e) => setFilterPolicial(e.target.value)}
              />
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Data Serviço</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="date"
                className="w-full bg-[#070b13] text-slate-200 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none"
                value={filterData}
                onChange={(e) => setFilterData(e.target.value)}
              />
            </div>
          </div>

          {/* Viatura */}
          <div>
            <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Prefixo Viatura</label>
            <div className="relative">
              <Car className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Ex M-18012..."
                className="w-full bg-[#070b13] text-slate-200 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-blue-500"
                value={filterViatura}
                onChange={(e) => setFilterViatura(e.target.value)}
              />
            </div>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Setor</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Ex Sul, Norte..."
                className="w-full bg-[#070b13] text-slate-200 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-blue-500"
                value={filterSetor}
                onChange={(e) => setFilterSetor(e.target.value)}
              />
            </div>
          </div>

          {/* Policiais em Patrulha */}
          <div>
            <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Guarnição / Efetivo</label>
            <div className="relative">
              <UserCheck className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar policiais..."
                className="w-full bg-[#070b13] text-slate-200 border border-slate-800 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-blue-500"
                value={filterPoliciaisPatrulha}
                onChange={(e) => setFilterPoliciaisPatrulha(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button row */}
        {(filterPolicial || filterData || filterViatura || filterSetor || filterPoliciaisPatrulha) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setFilterPolicial('');
                setFilterData('');
                setFilterViatura('');
                setFilterSetor('');
                setFilterPoliciaisPatrulha('');
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-[#162035]/60 border border-slate-800 rounded px-2.5 py-1 transition-all cursor-pointer hover:bg-[#1f2d4a]"
            >
              Limpar Filtros Ativos
            </button>
          </div>
        )}
      </section>

      {/* RSO RECORDS DATATABLE CORE */}
      <section className="bg-[#0c1322] border border-slate-850 rounded-xl overflow-hidden shadow">
        <div className="p-4 border-b border-slate-900 bg-[#10192d] flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
            Auditoria de Protocolos RSO ({filteredRsos.length} listados)
          </span>

          <span className="text-[10px] text-slate-400 font-mono">
            Mostrando {filteredRsos.length} de {rsos.length} relatórios catalogados.
          </span>
        </div>

        {/* Sizing of results */}
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-450 font-mono space-y-2 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span>Processando auditoria de RSO...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400 leading-normal font-mono border-t border-slate-900">
            {error} (Verifique se as rotas da API estão executando no servidor).
          </div>
        ) : filteredRsos.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 font-mono border-t border-slate-900">
            Nenhum Relatório de Serviço Operacional (RSO) coincide com suas diretrizes de filtragem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#090f1a] border-b border-slate-950 text-slate-400 font-mono text-[9px] uppercase tracking-wider select-none">
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Policial Militar</th>
                  <th className="p-3">Viatura</th>
                  <th className="p-3">Setor</th>
                  <th className="p-3">Data Serviço</th>
                  <th className="p-3 text-center">Abordagens</th>
                  <th className="p-3 text-center">Prisões</th>
                  <th className="p-3 text-center">Anexos</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredRsos.map((rso) => (
                  <tr key={rso.id} className="hover:bg-[#111929]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-500">{rso.protocolo}</td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">
                          [{rso.patente}] {rso.nome_policial}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">RG: {rso.rg}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 uppercase">{rso.prefixo_viatura}</span>
                        <span className="text-[10px] text-slate-500 font-sans">{rso.funcao}</span>
                      </div>
                    </td>
                    <td className="p-3 uppercase font-mono text-slate-350">{rso.setor}</td>
                    <td className="p-3 font-mono">
                      {rso.data_servico.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-300">
                      {rso.abordagens}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">
                      {rso.prisoes}
                    </td>
                    <td className="p-3 text-center">
                      {rso.anexos && rso.anexos.length > 0 ? (
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                          {rso.anexos.length} Arq
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[10px]">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {/* Inspect Print single */}
                        <button
                          onClick={() => setSelectedRso(rso)}
                          className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded font-bold cursor-pointer transition-colors"
                          title="Ficha Oficial do RSO (PDF/Imprimir)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Comandante / Subcomandante Delete safeguard */}
                        {['Comandante', 'Subcomandante'].includes(userRole) && (
                          <button
                            onClick={() => handleDeleteRso(rso.id, `${userRole} ${currentUserNome}`)}
                            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-1 rounded font-bold cursor-pointer transition-all border border-red-500/20 hover:border-transparent"
                            title="Remover RSO da Base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

// Subcomponent: modal representation of printable black and white police RSO dispatch
interface RsoPrintModalProps {
  rso: Rso;
  onClose: () => void;
}

function RsoPrintModal({ rso, onClose }: RsoPrintModalProps) {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-[#050810]/70 backdrop-blur-sm">
      {/* Printable setup rules embedding */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide app elements */
          body * {
            visibility: hidden;
          }
          /* Show print content exclusively */
          #print-zone, #print-zone * {
            visibility: visible;
          }
          #print-zone {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .custom-shadow {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />

      <div className="w-full max-w-2xl bg-[#0c1322] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header toolbar - hidden in printer */}
        <div className="bg-[#10192e] p-3 border-b border-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
              REVISÃO E IMPRESSÃO DE EXPEDIENTE OPERACIONAL
            </span>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inspector printable content page */}
        <div 
          id="print-zone" 
          className="p-6 md:p-8 overflow-y-auto bg-slate-950 text-slate-100 flex-1 leading-relaxed text-xs font-sans print:bg-white print:text-black"
        >
          {/* Institutional letterhead */}
          <div className="flex flex-col items-center text-center border-b border-double border-slate-800/80 pb-5 mb-5 print:border-black print:text-black">
            {/* Elegant Shield graphic for PMESP */}
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center p-2.5 mb-2 print:border-black print:bg-slate-100">
              <Shield className="w-full h-full text-amber-500 print:text-black" />
            </div>
            
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#94a3b8] uppercase print:text-black">
              SECRETARIA DE SEGURANÇA PÚBLICA DE SÃO PAULO
            </span>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-100 uppercase mt-0.5 print:text-black font-sans">
              POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
            </h2>
            <h3 className="text-xs font-bold tracking-tight text-slate-200 uppercase print:text-black font-sans">
              18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO - "18º BPM/M"
            </h3>
            <span className="text-[9px] font-mono text-amber-500 font-bold block mt-1 uppercase print:text-black">
              SEÇÃO DE OPERAÇÕES METROPOLITANAS (SEÇÃO P/3)
            </span>
          </div>

          {/* Record title with double margin */}
          <div className="text-center font-mono font-bold text-sm text-slate-200 mb-6 uppercase tracking-wider print:text-black">
            RELATÓRIO DE SERVIÇO OPERACIONAL (RSO) <br />
            <span className="text-amber-500 text-base print:text-black">{rso.protocolo}</span>
          </div>

          {/* Core Table Grid layout */}
          <div className="space-y-5">
            {/* Table block 1: Efetivo */}
            <div>
              <h4 className="text-[10px] font-bold font-mono tracking-wider text-amber-500/90 border-b border-slate-800 pb-1 mb-2 uppercase print:border-black print:text-black">
                1. DADOS SOCIAIS / COMPOSIÇÃO DA GUARNIÇÃO
              </h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Policial Militar Comandante</span>
                  <span className="font-semibold text-slate-200 print:text-black">[{rso.patente}] {rso.nome_policial}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Regulamento Funcional RE / RG</span>
                  <span className="font-semibold text-slate-200 print:text-black">{rso.rg}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Prefixo da viatura</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">{rso.prefixo_viatura}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Função desempenhada</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">{rso.funcao}</span>
                </div>
              </div>
            </div>

            {/* Table block 2: Plantao */}
            <div>
              <h4 className="text-[10px] font-bold font-mono tracking-wider text-amber-500/90 border-b border-slate-800 pb-1 mb-2 uppercase print:border-black print:text-black">
                2. DADOS DO PERÍODO DO PLANTÃO
              </h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Data do Relatório de Serviço</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {rso.data_servico.split('-').reverse().join('/')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Horário do Policiamento</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {rso.hora_inicio}h às {rso.hora_fim}h
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Setor de Atuação</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">{rso.setor}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Policiais em Patrulhamento (Guarnição)</span>
                  <span className="font-semibold text-slate-200 print:text-black uppercase">
                    {rso.policiais_patrulha || rso.supervisor}
                  </span>
                </div>
              </div>
            </div>

            {/* Table block 3: Produtividade */}
            <div>
              <h4 className="text-[10px] font-bold font-mono tracking-wider text-amber-500/90 border-b border-slate-800 pb-1 mb-2 uppercase print:border-black print:text-black">
                3. PRODUTIVIDADE OPERACIONAL REGISTRADA
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Abordagens</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{rso.abordagens}</span>
                </div>
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Veíc. Geral Abordados</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{rso.veiculos_abordados}</span>
                </div>
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-400 font-mono text-[9px] block uppercase">Pessoas Abordadas</span>
                  <span className="text-sm font-bold font-mono text-slate-200 print:text-black">{rso.pessoas_abordadas}</span>
                </div>
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-450 font-mono text-[9px] block uppercase">Prisões Flagrantes</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 print:text-black">{rso.prisoes}</span>
                </div>
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-450 font-mono text-[9px] block uppercase">Armas / Drogas Apreendidas</span>
                  <span className="text-sm font-bold font-mono text-amber-500 print:text-black">{rso.apreensoes}</span>
                </div>
                <div className="border border-slate-800 p-2 rounded bg-[#0b101d] print:bg-slate-100 print:border-black">
                  <span className="text-slate-450 font-mono text-[9px] block uppercase">Ocorrências Atendidas</span>
                  <span className="text-sm font-bold font-mono text-blue-400 print:text-black">{rso.ocorrencias}</span>
                </div>
              </div>
            </div>

            {/* Table block 4: Narrative Narrative */}
            {rso.observacoes && (
              <div>
                <h4 className="text-[10px] font-bold font-mono tracking-wider text-amber-500/90 border-b border-slate-800 pb-1 mb-2 uppercase print:border-black print:text-black">
                  4. HISTÓRICO GERAL / NARRATIVA DAS FATOS DO SERVIÇO
                </h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap print:text-black pr-1 font-sans">
                  {rso.observacoes}
                </p>
              </div>
            )}

            {/* Table block 5: Attachments list in inspect */}
            {rso.anexos && rso.anexos.length > 0 && (
              <div className="print:hidden">
                <h4 className="text-[10px] font-bold font-mono tracking-wider text-purple-400 border-b border-slate-800 pb-1 mb-2 uppercase">
                  5. ANEXOS OPERACIONAIS (TOTAL: {rso.anexos.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {rso.anexos.map((anexo, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#121927] border border-slate-800 p-1.5 rounded">
                      <Download className="w-3.5 h-3.5 text-purple-400 bg-purple-500/5 px-0.5 rounded shrink-0" />
                      <span className="truncate text-slate-300 flex-1 text-[11px]">{anexo.name}</span>
                      {anexo.base64 && (
                        <a 
                          href={anexo.base64} 
                          download={anexo.name}
                          className="text-purple-400 hover:text-purple-300 font-mono text-[10px] underline font-bold pl-2 pr-1"
                        >
                          Baixar
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Print Signature block */}
            <div className="border-t border-slate-800/80 pt-4 mt-6 text-center flex flex-col items-center justify-center print:border-black print:text-black">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 font-mono print:text-black">
                TERMO ASSINADO DIGITALMENTE RECONHECIDO NO SISTEMA
              </span>
              <p className="text-[10px] text-slate-400 italic max-w-sm mt-0.5 print:text-black">
                "Declaro sob as penas da Lei Militar e Penal que as informações operacionais preenchidas acima refletem estritamente a verdade."
              </p>
              <div className="mt-4 border-b border-dashed border-slate-700 w-60 pb-1 print:border-black">
                <span className="font-mono text-sm font-bold text-slate-200 tracking-wide select-none print:text-black" style={{ fontFamily: 'Georgia, serif' }}>
                  {rso.assinatura_digital}
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 mt-1 uppercase print:text-black">
                RELAÇÃO DE AUTENTICIDADE: SHA256-RSO-{rso.id.split('-')[1]}
              </span>
            </div>

          </div>
        </div>

        {/* Modal interactive footer toolbar */}
        <div className="bg-[#10192e] p-3 border-t border-slate-900 flex justify-between shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Fechar Ficha (ESC)
          </button>
          
          <button
            onClick={triggerPrint}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors shadow shadow-blue-950/40 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Expediente (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
