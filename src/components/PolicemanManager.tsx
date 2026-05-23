/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  UserCheck, 
  AlertCircle,
  Plus, 
  Edit2, 
  UserX,
  X
} from 'lucide-react';
import { Policial, RankPM, UserRole } from '../types';

interface PolicemanManagerProps {
  policiais: Policial[];
  userRole: UserRole;
  onAddPolicial: (policial: Omit<Policial, 'id'>) => void;
  onUpdatePolicial: (id: string, updates: Partial<Policial>) => void;
}

export default function PolicemanManager({ 
  policiais, 
  userRole, 
  onAddPolicial, 
  onUpdatePolicial 
}: PolicemanManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [rankFilter, setRankFilter] = useState<string>('todos');
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [rg, setRg] = useState('');
  const [patente, setPatente] = useState<RankPM>('Sd PM');
  const [funcao, setFuncao] = useState('');
  const [dataIngresso, setDataIngresso] = useState(new Date().toISOString().split('T')[0]);
  const [discordId, setDiscordId] = useState('');
  const [situacao, setSituacao] = useState<'Ativo' | 'Afastado' | 'Reserva' | 'Férias' | 'Inativo'>('Ativo');

  const rankOptions: RankPM[] = [
    'Cel PM', 'Ten Cel PM', 'Maj PM', 'Cap PM', '1º Ten PM', 'Subten PM', 
    '1º Sgt PM', '2º Sgt PM', '3º Sgt PM', 'Cb PM', 'Sd PM'
  ];

  // Permissions guard
  const canModify = userRole === 'Comandante' || userRole === 'Subcomandante';

  const resetForm = () => {
    setNome('');
    setRg('');
    setPatente('Sd PM');
    setFuncao('');
    setDataIngresso(new Date().toISOString().split('T')[0]);
    setDiscordId('');
    setSituacao('Ativo');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Policial) => {
    setEditingId(p.id);
    setNome(p.nome);
    setRg(p.rg);
    setPatente(p.patente);
    setFuncao(p.funcao);
    setDataIngresso(p.dataIngresso);
    setDiscordId(p.discordId);
    setSituacao(p.situação);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !rg || !funcao) {
      alert('Preencha os campos obrigatórios (Nome, RG e Função).');
      return;
    }

    const payload = {
      nome,
      rg,
      patente,
      funcao,
      dataIngresso,
      discordId: discordId || 'Simulado - ' + String(Math.floor(Math.random() * 9000000000000000 + 1000000000000000)),
      situação: situacao
    };

    if (editingId) {
      onUpdatePolicial(editingId, payload);
    } else {
      onAddPolicial(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const getRankBadgeColor = (pat: RankPM) => {
    if (['Cel PM', 'Ten Cel PM', 'Maj PM'].includes(pat)) {
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    }
    if (['Cap PM', '1º Ten PM'].includes(pat)) {
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    }
    if (['Subten PM', '1º Sgt PM', '2º Sgt PM', '3º Sgt PM'].includes(pat)) {
      return 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
    }
    return 'bg-slate-500/15 text-slate-300 border border-slate-700';
  };

  const getStatusBadgeColor = (sit: string) => {
    switch (sit) {
      case 'Ativo': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'Férias': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Afastado': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-red-500/10 text-red-500 border border-red-500/30';
    }
  };

  // Filter lists dynamically
  const filteredPoliciais = policiais.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.rg.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || p.situação === statusFilter;
    const matchesRank = rankFilter === 'todos' || p.patente === rankFilter;
    return matchesSearch && matchesStatus && matchesRank;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Search and action header */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Efetivo de Policiais Militares (18º BPM/M)</h2>
            <p className="text-xs text-slate-400">Total cadastrado: {policiais.length} policiais militares ativos/reserva.</p>
          </div>
        </div>

        {canModify && (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Soldado / Oficial</span>
          </button>
        )}
      </div>

      {/* Filter and search bars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0b1322] border border-slate-800/60 rounded-xl p-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Nome Policial ou número de RG..."
            className="w-full bg-[#0d1420] text-slate-200 border border-slate-700/50 rounded-md pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Patente Filter */}
        <div className="flex items-center gap-2 bg-[#0d1420] border border-slate-700/50 rounded-md px-3 py-1 text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            className="w-full bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
          >
            <option value="todos">Todas Patentes</option>
            {rankOptions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Situação Filter */}
        <div className="flex items-center gap-2 bg-[#0d1420] border border-slate-700/50 rounded-md px-3 py-1 text-slate-300">
          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            className="w-full bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todas Situações</option>
            <option value="Ativo">Ativo</option>
            <option value="Férias">Férias</option>
            <option value="Afastado">Afastado</option>
            <option value="Reserva">Reserva</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Officers List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPoliciais.length === 0 ? (
          <div className="col-span-full bg-[#0b1322] border border-slate-800 text-center py-12 text-xs text-slate-500">
            Nenhum militar localizado com os filtros selecionados.
          </div>
        ) : (
          filteredPoliciais.map((p) => (
            <div 
              key={p.id} 
              className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header card info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${getRankBadgeColor(p.patente)}`}>
                      {p.patente}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2">RG: {p.rg}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 font-mono ${getStatusBadgeColor(p.situação)}`}>
                    {p.situação}
                  </span>
                </div>

                {/* Military Profile */}
                <div>
                  <h3 className="text-slate-200 font-bold text-sm tracking-tight truncate group-hover:text-blue-400 transition-colors">
                    {p.nome}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">{p.funcao}</span>
                  </p>
                </div>

                {/* Meta details */}
                <div className="border-t border-slate-800/80 pt-3 flex justify-between text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Ingresso: {p.dataIngresso}</span>
                  </div>
                </div>

                {/* Discord sync sim */}
                <div className="bg-[#080d17] border border-slate-800 p-2 rounded text-[10px] font-mono text-indigo-400 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <span>Discord ID: {p.discordId}</span>
                </div>
              </div>

              {/* Actions footer if authorized */}
              {canModify && (
                <div className="border-t border-slate-800/80 mt-4 pt-3 flex justify-end gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 px-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded flex items-center gap-1 shadow transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                    <span>Ficha Ficha</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reg Modal / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e1624] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative font-sans animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{editingId ? 'Editar Detalhes do Militar' : 'Cadastrar Policial Militar'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800 rounded p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Nome */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    placeholder="ex: João Batista da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                {/* RG */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Número RG Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono placeholder-slate-600"
                    placeholder="PM-XX.XXX"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                  />
                </div>

                {/* Patente / Graduação */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Patente (PMESP)
                  </label>
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value as RankPM)}
                  >
                    {rankOptions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Função desempenhada */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Função Desempenhada *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    placeholder="ex: Encarregado da Força Patrulha M-18115"
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value)}
                  />
                </div>

                {/* Data de ingresso */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Data de Ingresso
                  </label>
                  <input
                    type="date"
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    value={dataIngresso}
                    onChange={(e) => setDataIngresso(e.target.value)}
                  />
                </div>

                {/* Situação funcional */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Situação Atual
                  </label>
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    value={situacao}
                    onChange={(e) => setSituacao(e.target.value as any)}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Afastado">Afastado</option>
                    <option value="Reserva">Reserva</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>

                {/* Discord Sync simulated id */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                    ID Usuário Discord (Opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono placeholder-slate-600"
                    placeholder="Para vincular ao bot do Discord de RP"
                    value={discordId}
                    onChange={(e) => setDiscordId(e.target.value)}
                  />
                </div>
              </div>

              {/* Form submit/cancel */}
              <div className="border-t border-slate-800 pt-4 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{editingId ? 'Salvar Alterações' : 'Contratar/Registrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
