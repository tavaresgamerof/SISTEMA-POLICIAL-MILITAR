/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileSignature, 
  ShieldCheck, 
  Plus, 
  Lock, 
  Key, 
  User, 
  X,
  PlusCircle,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { AssinaturaMembro, RankPM, UserRole } from '../types';

interface SignatureStampsProps {
  assinaturas: AssinaturaMembro[];
  userRole: UserRole;
  onAddAssinatura: (ass: Omit<AssinaturaMembro, 'id' | 'ativo'>) => void;
}

export default function SignatureStamps({
  assinaturas,
  userRole,
  onAddAssinatura
}: SignatureStampsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [nome, setNome] = useState('');
  const [rg, setRg] = useState('');
  const [patente, setPatente] = useState<RankPM>('cap-pm' as any);
  const [cargo, setCargo] = useState('');

  const canRegister = userRole === 'Comandante' || userRole === 'Subcomandante';

  const rankOptions: RankPM[] = [
    'Cel PM', 'Ten Cel PM', 'Maj PM', 'Cap PM', '1º Ten PM', 'Subten PM', 
    '1º Sgt PM', '2º Sgt PM', '3º Sgt PM', 'Cb PM', 'Sd PM'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !rg || !cargo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Generate simulated cryptographic stamp token
    const tokenPart = 'ASSINATURA DIGITAL: [' + patente.toUpperCase() + ' ' + nome.split(' ')[0].toUpperCase() + ' - ' + cargo.substring(0, 10).toUpperCase() + ' - CHAVE: #' + Math.random().toString(36).substring(2, 9).toUpperCase() + ']';

    onAddAssinatura({
      nome,
      rg,
      patente,
      cargo,
      rubricaSimbolo: tokenPart
    });

    setIsModalOpen(false);
    // Reset Form
    setNome('');
    setRg('');
    setPatente('Cap PM' as any);
    setCargo('');
    alert('Nova chancela cadastrada com sucesso e homologada no sistema!');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header Panel */}
      <div className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-505 flex items-center justify-center text-blue-500">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Chancelaria e Assinaturas Digitais Criptográficas</h2>
            <p className="text-xs text-slate-400">Total homologado: {assinaturas.length} chancelas eletrônicas autorizadas.</p>
          </div>
        </div>

        {canRegister && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs uppercase cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Assinatura</span>
          </button>
        )}
      </div>

      {/* Corporate Stamp list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assinaturas.map((ass) => (
          <div 
            key={ass.id}
            className="bg-[#0b1322] border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between"
          >
            {/* Header watermarks */}
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <FileSignature className="w-16 h-16 text-slate-300" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono font-bold uppercase">
                  {ass.cargo}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/35" title="Selo Ativo" />
              </div>

              {/* Graphic Stamp Representation */}
              <div className="bg-[#080d17] border border-slate-800 p-4 rounded-lg flex flex-col items-center justify-center border-dashed border-blue-900/50 text-center font-mono py-6 relative">
                
                {/* Visual Seal Border */}
                <div className="absolute inset-2 border border-dashed border-indigo-950/20 rounded pointer-events-none" />

                <Lock className="w-4 h-4 text-indigo-400 absolute top-2 right-2 opacity-50" />
                <span className="text-[8px] tracking-widest text-[#10b981] font-bold uppercase">POLÍCIA MILITAR DO ESTADO DE SP</span>
                <h4 className="text-xs font-bold text-slate-200 mt-1 uppercase mt-1">
                  {ass.patente} {ass.nome.split(' ')[0]}
                </h4>
                <p className="text-[8px] text-slate-500 mt-1">PROTOCOLO DE SEGURANÇA SEI IP</p>
                <div className="text-[8px] text-blue-400 truncate max-w-full font-semibold border-t border-slate-800 mt-3 pt-2">
                  {ass.rubricaSimbolo.split('CHAVE:')[1]?.replace(']', '') || 'VERIFICADO'}
                </div>
              </div>

              {/* Full Meta data card */}
              <div className="text-xs space-y-1 text-slate-400 bg-[#080d17]/50 rounded p-3 border border-slate-800/40 font-sans">
                <div className="flex justify-between">
                  <span>Signatário:</span>
                  <span className="font-bold text-slate-300">{ass.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span>Identidade RG:</span>
                  <span className="font-mono">{ass.rg}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patente:</span>
                  <span className="font-mono">{ass.patente}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-4 text-[10px] text-slate-500 border-t border-slate-805 pt-3 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Chave de tempo ativa do Batalhão</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Signature Stamp Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e1624] border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative font-sans animate-scale-up">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-blue-400" />
                <span>Registrar Nova Chancela Digital</span>
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
              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Nome Completo do Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    placeholder="ex: Alexandre Magno Guedes"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                {/* RG */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Identidade RG *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="PM-XX.XXX"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                  />
                </div>

                {/* Patente */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Patente Militar
                  </label>
                  <select
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    value={patente as any}
                    onChange={(e) => setPatente(e.target.value as RankPM)}
                  >
                    {rankOptions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Cargo */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Cargo Executivo Associado *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#080d17] text-slate-200 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans"
                    placeholder="ex: Chefe de Estado-Maior"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                  />
                </div>
              </div>

              {/* Action buttons */}
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
                  <span>Gravar e Homologar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
