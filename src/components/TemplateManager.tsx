/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Search, 
  Edit3, 
  X, 
  Check, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Template, DocumentCategory, UserRole } from '../types';

interface TemplateManagerProps {
  templates: Template[];
  userRole: UserRole;
  onAddTemplate: (temp: Omit<Template, 'id'>) => void;
  onUpdateTemplate: (id: string, temp: Partial<Template>) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function TemplateManager({
  templates,
  userRole,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}: TemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Portaria');
  const [categoria, setCategoria] = useState<DocumentCategory>('ADMINISTRATIVO');
  const [descricao, setDescricao] = useState('');
  const [conteudo, setConteudo] = useState('');

  const canEdit = userRole === 'Comandante' || userRole === 'Subcomandante';

  const resetForm = () => {
    setTitulo('');
    setTipo('Portaria');
    setCategoria('ADMINISTRATIVO');
    setDescricao('');
    setConteudo('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Template) => {
    setEditingId(t.id);
    setTitulo(t.titulo);
    setTipo(t.tipo);
    setCategoria(t.categoria);
    setDescricao(t.descricao);
    setConteudo(t.conteudo);
    setIsModalOpen(true);
  };

  const handleDuplicate = (t: Template) => {
    const payload = {
      titulo: `${t.titulo} (Cópia)`.toUpperCase(),
      tipo: t.tipo,
      categoria: t.categoria,
      descricao: `Cópia duplicada do modelo original para edições pontuais.`,
      conteudo: t.conteudo
    };
    onAddTemplate(payload);
    alert('Modelo duplicado com sucesso!');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descricao || !conteudo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      titulo: titulo.toUpperCase(),
      tipo,
      categoria,
      descricao,
      conteudo
    };

    if (editingId) {
      onUpdateTemplate(editingId, payload);
    } else {
      onAddTemplate(payload);
    }
    setIsModalOpen(false);
    resetForm();
  };

  // Filter list
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'todos' || t.categoria === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Deck */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Acervo Geral de Modelos Regimentais</h2>
            <p className="text-xs text-slate-400">Total disponível: {templates.length} modelos de expedientes oficiais organizados.</p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Modelo</span>
          </button>
        )}
      </div>

      {/* Grid: Search and category tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0b1322] border border-slate-800/60 rounded-xl p-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por Título da portaria ou especificações do modelo..."
            className="w-full bg-[#0d1420] text-slate-200 border border-slate-700/50 rounded-md pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="bg-[#0d1420] text-xs text-slate-300 border border-slate-700/50 rounded-md px-3 py-2 focus:outline-none cursor-pointer"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="todos">Todas Categorias</option>
          <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
          <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
          <option value="OPERACIONAL">OPERACIONAL</option>
          <option value="COMUNICAÇÃO">COMUNICAÇÃO</option>
          <option value="CORREGEDORIA">CORREGEDORIA</option>
        </select>
      </div>

      {/* Templates listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full bg-[#0b1322] border border-slate-800 text-center py-12 text-xs text-slate-500">
            Nenhum modelo militar localizado com os filtros indicados.
          </div>
        ) : (
          filteredTemplates.map((t) => (
            <div 
              key={t.id}
              className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 uppercase font-bold">
                    {t.categoria}
                  </span>
                  <span className="text-slate-500">Expediente: {t.tipo}</span>
                </div>

                <div>
                  <h3 className="text-slate-200 font-bold text-sm tracking-tight truncate group-hover:text-blue-400 transition-colors">
                    {t.titulo}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 lines-2 leading-relaxed">
                    {t.descricao}
                  </p>
                </div>
              </div>

              {/* Duplicate/edit/delete buttons */}
              <div className="border-t border-slate-800/80 mt-4 pt-3 flex justify-between items-center">
                <button
                  onClick={() => handleDuplicate(t)}
                  className="p-1 px-2.5 text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 font-bold rounded flex items-center gap-1 transition-colors border border-slate-800 cursor-pointer"
                  title="Duplicar modelo para reuso"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicar</span>
                </button>

                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1 px-2.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza de que deseja apagar o modelo ${t.titulo}?`)) {
                          onDeleteTemplate(t.id);
                        }
                      }}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Excluir Modelo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0e1624] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative font-sans animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{editingId ? 'Editar Detalhes do Modelo' : 'Cadastrar Novo Modelo Regimental'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800 rounded p-1 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Título */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nome / Título do Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    placeholder="ex: PORTARIA DE PREVENÇÃO DISCIPLINAR DE PATRIMÔNIO"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value.toUpperCase())}
                  />
                </div>

                {/* Tipo de Documento */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Tipo do Expediente militar
                  </label>
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="Portaria">Portaria</option>
                    <option value="Ordem de Serviço">Ordem de Serviço</option>
                    <option value="Memorando">Memorando</option>
                    <option value="Circular">Circular</option>
                    <option value="Ata">Ata</option>
                    <option value="Sindicância">Sindicância</option>
                    <option value="Elogio Individual">Elogio Individual</option>
                    <option value="Promoção">Promoção</option>
                    <option value="Relatório">Relatório</option>
                  </select>
                </div>

                {/* Categoria Oficial */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Categoria Geral
                  </label>
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
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

                {/* Descrição curta */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Descrição Curta / Instrução de Reuso *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    placeholder="Instrução sintetizada que aparecerá no card do modelo..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>

                {/* Corpo do Template */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Esqueleto de Conteúdo de Texto em Markdown *
                  </label>
                  <textarea
                    required
                    className="w-full min-h-[220px] bg-[#080d17] text-slate-200 border border-slate-800 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={`### TÍTULO DO MODELO DE DOCUMENTO Nº PMESP-###\n\n**CONSIDERANDO**...`}
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                  />
                </div>
              </div>

              {/* Save / Cancel buttons */}
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
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  <span>Gravar e Habilitar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
