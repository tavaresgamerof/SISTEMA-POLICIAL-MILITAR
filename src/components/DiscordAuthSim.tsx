/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, Check, LogIn } from 'lucide-react';
import { Policial, UserRole } from '../types';

interface DiscordAuthSimProps {
  onLogin: (user: Policial, role: UserRole) => void;
  availablePoliciais: Policial[];
  onGoToRsoForm?: () => void;
  onGoToEdital?: () => void;
}

export default function DiscordAuthSim({ onLogin, availablePoliciais, onGoToRsoForm, onGoToEdital }: DiscordAuthSimProps) {
  const [selectedPolicialId, setSelectedPolicialId] = useState<string>('');

  // First administrator form state
  const [initNome, setInitNome] = useState('');
  const [initRg, setInitRg] = useState('PM-');
  const [initPatente, setInitPatente] = useState<'Cel PM' | 'Ten Cel PM' | 'Maj PM' | 'Cap PM' | '1º Ten PM' | 'Subten PM' | '1º Sgt PM' | '2º Sgt PM' | '3º Sgt PM' | 'Cb PM' | 'Sd PM'>('Cel PM');
  const [initFuncao, setInitFuncao] = useState('Comandante Geral');
  const [registering, setRegistering] = useState(false);

  // Determine user system permission tier based on PMESP rank
  const getRoleFromPolicial = (p: Policial): UserRole => {
    if (p.patente === 'Cel PM') return 'Comandante';
    if (p.patente === 'Ten Cel PM') return 'Subcomandante';
    if (p.patente === 'Maj PM') return 'Estado-Maior';
    if (['Cap PM', '1º Ten PM', '2º Ten PM', 'Asp PM'].includes(p.patente)) return 'Oficial';
    return 'Praca';
  };

  // If there are policemen, auto-select the first one if none is selected
  const hasPoliciais = availablePoliciais && availablePoliciais.length > 0;
  const currentSelectedId = selectedPolicialId || (hasPoliciais ? availablePoliciais[0].id : '');
  const selectedPolicial = hasPoliciais ? (availablePoliciais.find(p => p.id === currentSelectedId) || availablePoliciais[0]) : null;
  const derivedRole = selectedPolicial ? getRoleFromPolicial(selectedPolicial) : 'Praca';

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Comandante': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Subcomandante': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'Estado-Maior': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'Oficial': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'Comandante': return 'Acesso irrestrito a todas as ordens de comando, auditorias de log e chancelas institucionais.';
      case 'Subcomandante': return 'Administração plena, assinatura de portarias administrativas e gestão de efetivo ativo.';
      case 'Estado-Maior': return 'Emissão e assessoria documental completa para todas as seções regimentais (P/1 a P/4).';
      case 'Oficial': return 'Elaboração técnica de planos de operações, ordens de saturação e consultas integradas.';
      default: return 'Recurso de consulta restrita a notas públicas, escalas homologadas e folha ordinária. Sem permissão de assinatura.';
    }
  };

  const handleConnect = () => {
    if (selectedPolicial) {
      onLogin(selectedPolicial, derivedRole);
    }
  };

  const handleRegisterFirstComandante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initNome.trim() || !initRg.trim() || !initFuncao.trim()) {
      alert('Por favor, preencha todos os campos táticos para fundar o Comando Geral.');
      return;
    }

    setRegistering(true);
    try {
      // 1. Create Policial Militar Object
      const newPol: Omit<Policial, 'id'> = {
        nome: initNome.trim(),
        rg: initRg.trim(),
        patente: initPatente,
        funcao: initFuncao.trim(),
        dataIngresso: new Date().toISOString().split('T')[0],
        discordId: '18BPM-' + String(Math.floor(Math.random() * 900000000 + 100000000)),
        situação: 'Ativo'
      };

      const resPol = await fetch('/api/policiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPol)
      });

      if (!resPol.ok) {
        throw new Error('Falha tática ao registrar o militar no banco de dados.');
      }

      const savedPol = await resPol.json();

      // 2. Automate creation of official Signature for new commander to sign templates
      const newSig = {
        nome: initNome.trim(),
        rg: initRg.trim(),
        patente: initPatente,
        cargo: initFuncao.trim(),
        rubricaSimbolo: `CHANCELAR OFICIAL: [${initPatente} ${initNome.toUpperCase()} - COMANDO-GERAL - CHAVE: #${Math.random().toString(36).substring(2, 8).toUpperCase()}]`
      };

      await fetch('/api/assinaturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSig)
      });

      // 3. Initiate seamless login session
      onLogin(savedPol, getRoleFromPolicial(savedPol));
    } catch (err: any) {
      alert('Erro crítico ao fundar policial e emitir chancelas: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 selection:bg-blue-600/30 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,40,90,0.15)_0,transparent_60%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#131a26]/90 border border-slate-800 rounded-xl shadow-2xl p-6 relative overflow-hidden backdrop-blur-md">
        {/* Institutional PMESP Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-blue-500 to-amber-500" />
        
        {/* Emblem Illustration */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center p-2 mb-4 shadow-inner relative">
            {/* Styled PMESP Shield Emblem */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-blue-950 to-indigo-900 border border-amber-500/40 flex flex-col items-center justify-center">
              <Shield className="w-7 h-7 text-amber-500 animate-pulse" />
              <span className="text-[7px] font-mono tracking-widest text-slate-300 font-bold mt-1">18º BPM/M</span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">SISTEMA POLICIAL MILITAR</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">18º Batalhão de Polícia Militar Metropolitano</p>
          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono mt-2">
            FiveM RP - Cop Simulator Edition
          </span>
        </div>

        {hasPoliciais ? (
          <>
            {/* Discord Simulation Block */}
            <div className="bg-[#182130] rounded-lg border border-slate-800 p-4 mb-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Autenticar via Discord ID
              </label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-2">
                    Selecione o Policial Militar cadastrado no painel para simular a autorização enviada pelo Bot do Discord:
                  </p>
                  <select
                    className="w-full bg-[#0d1420] text-slate-200 border border-slate-700/50 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={currentSelectedId}
                    onChange={(e) => setSelectedPolicialId(e.target.value)}
                  >
                    {availablePoliciais.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.patente}] {p.nome} - RG {p.rg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simulated Permissions Metadata */}
                {selectedPolicial && (
                  <div className="bg-[#0c121e] rounded p-3 border border-slate-800/40 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-slate-400 font-medium">Patente Oficial:</span>
                      <span className="text-slate-200 font-mono text-xs">{selectedPolicial.patente}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-slate-400 font-medium">Discord ID Atrelado:</span>
                      <span className="text-indigo-400 font-mono text-[10px]">{selectedPolicial.discordId}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 font-medium">Nivel COR:</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 rounded border ${getRoleBadgeColor(derivedRole)}`}>
                        {derivedRole}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px] pt-1.5 border-t border-slate-800/70">
                      {getRoleDescription(derivedRole)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action button simulating genuine third-party Oauth redirection */}
            <button
              onClick={handleConnect}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 hover:shadow-indigo-600/20 text-sm group cursor-pointer"
            >
              <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              <span>Confirmar e Entrar no Quartel</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleRegisterFirstComandante} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] leading-relaxed p-3.5 rounded-lg font-sans">
              ⚠️ **Base de Efetivos Vazia:** Nenhum Policial Militar cadastrado no banco de dados. Para inicializar o sistema como Novo Comando Geral, preencha a ficha funcional abaixo para criar a primeira praça/oficial administrativo (Cel PM).
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Nome Completo do Oficial</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tavares Rodrigues de Oliveira"
                  value={initNome}
                  onChange={(e) => setInitNome(e.target.value)}
                  className="w-full bg-[#0d1420] text-slate-250 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Registro Geral (RG)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PM-12.345"
                    value={initRg}
                    onChange={(e) => setInitRg(e.target.value)}
                    className="w-full bg-[#0d1420] text-slate-250 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Patente Inicial</label>
                  <select
                    value={initPatente}
                    onChange={(e: any) => setInitPatente(e.target.value)}
                    className="w-full bg-[#0d1420] text-slate-250 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="Cel PM">Cel PM (Coronel)</option>
                    <option value="Ten Cel PM">Ten Cel PM (Tenente-Coronel)</option>
                    <option value="Maj PM">Maj PM (Major)</option>
                    <option value="Cap PM">Cap PM (Capitão)</option>
                    <option value="1º Ten PM">1º Ten PM (Primeiro-Tenente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Função / Cargo Operativo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Comandante Geral do Batalhão"
                  value={initFuncao}
                  onChange={(e) => setInitFuncao(e.target.value)}
                  className="w-full bg-[#0d1420] text-slate-250 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full mt-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition-all flex items-center justify-center gap-2 text-xs shadow-md uppercase tracking-wider cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{registering ? 'Inicializando Comando...' : 'Fundar Comando e Entrar'}</span>
            </button>
          </form>
        )}

        <div className="mt-5 text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Shield className="w-3 h-3" />
            <span>Encriptação por Chave Criptográfica Interna PMESP</span>
          </div>
          <span className="text-[9px] text-slate-600">
            Assinaturas digitais de documentos criadas utilizam chaves com carimbo de tempo inviolável de SP.
          </span>
        </div>
      </div>
    </div>
  );
}
