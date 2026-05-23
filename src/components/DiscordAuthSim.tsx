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
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

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

  const handleAuthorizeSim = () => {
    if (!selectedPolicial) {
      alert('Por favor, selecione um policial militar para simular a autenticação do Discord.');
      return;
    }
    setAuthorizing(true);
    setTimeout(() => {
      setAuthorizing(false);
      setIsDiscordModalOpen(false);
      onLogin(selectedPolicial, derivedRole);
    }, 1500);
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
        let errMsg = 'Falha tática ao registrar o militar no banco de dados.';
        try {
          const errData = await resPol.json();
          if (errData && errData.error) errMsg += ` Detalhes: ${errData.error}`;
        } catch (e) {}
        throw new Error(errMsg);
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

      const resSig = await fetch('/api/assinaturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSig)
      });

      if (!resSig.ok) {
        let errMsg = 'Falha tática ao registrar a chancela oficial do Comandante.';
        try {
          const errData = await resSig.json();
          if (errData && errData.error) errMsg += ` Detalhes: ${errData.error}`;
        } catch (e) {}
        throw new Error(errMsg);
      }

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
          <div className="space-y-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              O sistema de chancelaria eletrônica, escalas de serviço e relatórios táticos necessita de autorização ativa via Discord institucional do Batalhão.
            </p>

            {/* Official Discord Authentication Simulator Button */}
            <button
              onClick={() => setIsDiscordModalOpen(true)}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#5865f2]/20 hover:shadow-[#5865f2]/40 text-xs uppercase tracking-wider cursor-pointer font-sans"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Autenticar via Discord</span>
            </button>

            <div className="flex flex-col items-center gap-1 bg-[#182130]/40 rounded-lg p-3 border border-slate-800/40 mt-3 text-center">
              <span className="text-[10px] text-slate-400 font-mono">Status da Conexão: Prontidão Operativo</span>
              <p className="text-[9px] text-slate-500 max-w-[280px] leading-relaxed">
                Integração estandartizada com banco de dados de whitelist de RP.
              </p>
            </div>
          </div>
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
                  className="w-full bg-[#0d1420] text-slate-100 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
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
                    className="w-full bg-[#0d1420] text-slate-100 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Patente Inicial</label>
                  <select
                    value={initPatente}
                    onChange={(e: any) => setInitPatente(e.target.value)}
                    className="w-full bg-[#0d1420] text-slate-100 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
                  >
                    <option value="Cel PM" className="bg-[#0d1420] text-slate-100">Cel PM (Coronel)</option>
                    <option value="Ten Cel PM" className="bg-[#0d1420] text-slate-100">Ten Cel PM (Tenente-Coronel)</option>
                    <option value="Maj PM" className="bg-[#0d1420] text-slate-100">Maj PM (Major)</option>
                    <option value="Cap PM" className="bg-[#0d1420] text-slate-100">Cap PM (Capitão)</option>
                    <option value="1º Ten PM" className="bg-[#0d1420] text-slate-100">1º Ten PM (Primeiro-Tenente)</option>
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
                  className="w-full bg-[#0d1420] text-slate-100 border border-slate-700/50 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-sans"
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

      {/* FULL-SCREEN SIMULATED DISCORD OAUTH INTERACTIVE SCREEN */}
      {isDiscordModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 font-sans backdrop-blur-sm">
          <div className="w-full max-w-[480px] bg-[#313338] text-[#dbdee1] rounded-lg shadow-2xl relative overflow-hidden border border-[#1e1f22]">
            {/* Discord Branding Accent */}
            <div className="h-1.5 bg-[#5865F2]" />
            
            <div className="p-6 md:p-8">
              {/* Connected States Visualization */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold shadow-lg">
                  {/* Styled Discord Icon representation */}
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.9-.65,1.76-1.34,2.58-2a75.58,75.58,0,0,0,72.9,0c.82.72,1.68,1.4,2.58,2a68.45,68.45,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,48.24,124.05,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.88,46,53.88,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.12,46,96.12,53,91,65.69,84.69,65.69Z" />
                  </svg>
                </div>
                <div className="flex-1 h-[2px] bg-slate-600 relative flex items-center justify-center">
                  <span className="px-2 py-0.5 bg-[#2b2d31] border border-slate-700 rounded text-[9px] text-[#248046] font-mono font-bold uppercase tracking-wider">
                    Sincronizado
                  </span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#1e1f22] border border-amber-500/30 flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* Server Access Text */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">AUTORIZAR ACESSO DA CONTA</h3>
                <p className="text-[#949ba4] text-xs mt-1.5 leading-relaxed">
                  O aplicativo <span className="text-white font-semibold uppercase">Sistema Policial Militar 18º BPM/M</span> solicita acesso para identificar suas credenciais funcionais com base no banco de dados de RP.
                </p>
              </div>

              {/* Scopes and permissions list */}
              <div className="space-y-4 pt-4 border-t border-[#3f4147]">
                <div>
                  <span className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider block mb-2">Este aplicativo receberá acesso para:</span>
                  <ul className="space-y-1.5 text-xs text-[#dbdee1]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#248046] font-bold text-sm">✓</span>
                      <span>Bucar seu Nome Completo, Registro Geral (RG) e Ficha de Serviço Militar</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#248046] font-bold text-sm">✓</span>
                      <span>Carregar cargo de comando e habilitar chancelas oficiais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#248046] font-bold text-sm">✓</span>
                      <span>Gerar carimbos criptográficos de SP nos relatórios do quartel</span>
                    </li>
                  </ul>
                </div>

                {/* Identity Selection Block */}
                <div className="bg-[#2b2d31] p-4 rounded-md border border-[#202225] mt-4">
                  <label className="block text-[10px] uppercase font-bold text-[#b5bac1] mb-2 tracking-wider">
                    Selecione seu Registro Policial cadastrado:
                  </label>
                  
                  <select
                    className="w-full bg-[#1e1f22] text-[#dbdee1] border border-[#202225] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#5865F2] transition-colors cursor-pointer"
                    value={currentSelectedId}
                    onChange={(e) => setSelectedPolicialId(e.target.value)}
                  >
                    {availablePoliciais.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#1e1f22] text-[#dbdee1]">
                        [{p.patente}] {p.nome} - RG {p.rg}
                      </option>
                    ))}
                  </select>

                  {/* Selected Cop Details Card */}
                  {selectedPolicial && (
                    <div className="mt-3.5 pt-3 border-t border-[#3f4147] text-xs">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div>
                          <span className="block text-[9px] uppercase font-semibold text-slate-500">Patente Ativa:</span>
                          <span className="text-white font-medium">{selectedPolicial.patente}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-semibold text-slate-500">Discord ID Atrelado:</span>
                          <span className="text-[#5865f2] font-mono font-bold text-[10px]">{selectedPolicial.discordId}</span>
                        </div>
                        <div className="col-span-2 mt-1">
                          <span className="block text-[9px] uppercase font-semibold text-slate-500">Função/Cargo Correlato:</span>
                          <span className="text-emerald-400 font-semibold">{selectedPolicial.funcao}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões do rodapé igual ao estilo oficial Discord */}
              <div className="bg-[#2b2d31] p-4 -mx-6 -mb-6 md:-mx-8 md:-mb-8 mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[9px] text-[#949ba4] text-center sm:text-left leading-tight max-w-[200px]">
                  Ambiente blindado criptograficamente com suporte à whitelist PMESP.
                </span>
                
                <div className="flex gap-2.5 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    disabled={authorizing}
                    onClick={() => setIsDiscordModalOpen(false)}
                    className="px-4 py-2 rounded text-[#dbdee1] text-xs font-semibold hover:bg-[#35373c] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={authorizing}
                    onClick={handleAuthorizeSim}
                    className="px-5 py-2 rounded bg-[#248046] hover:bg-[#1a6535] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {authorizing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                        <span>Autorizando...</span>
                      </>
                    ) : (
                      <span>Autorizar</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
