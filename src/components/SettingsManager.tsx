import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  Globe, 
  Slack, 
  Save, 
  HelpCircle, 
  Webhook, 
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle,
  Hash,
  Link,
  Copy,
  ExternalLink,
  Database,
  Download
} from 'lucide-react';

interface BatalhaoConfig {
  nome: string;
  sigla: string;
  secretaria: string;
  pmesp: string;
  endereco: string;
  slogan: string;
  logoUrl: string;
  webhookGeral: string;
  webhookRso: string;
  webhookLogs: string;
  webhookRecrutamento: string;
}

interface SettingsManagerProps {
  userRole: string;
  currentUserNome: string;
  onRefreshData: () => void;
  onGoToRsoForm?: () => void;
  onGoToEdital?: () => void;
}

export default function SettingsManager({ 
  userRole, 
  currentUserNome, 
  onRefreshData,
  onGoToRsoForm,
  onGoToEdital
}: SettingsManagerProps) {
  const [config, setConfig] = useState<BatalhaoConfig>({
    nome: '',
    sigla: '',
    secretaria: '',
    pmesp: '',
    endereco: '',
    slogan: '',
    logoUrl: '',
    webhookGeral: '',
    webhookRso: '',
    webhookLogs: '',
    webhookRecrutamento: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [copiedRso, setCopiedRso] = useState(false);
  const [copiedEdital, setCopiedEdital] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // Check if user has commander clearance
  const isComandante = userRole === 'Comandante';

  const copyRsoLink = () => {
    const url = window.location.origin + '/rso';
    navigator.clipboard.writeText(url);
    setCopiedRso(true);
    setTimeout(() => setCopiedRso(false), 2000);
  };

  const copyEditalLink = () => {
    const url = window.location.origin + '/edital';
    navigator.clipboard.writeText(url);
    setCopiedEdital(true);
    setTimeout(() => setCopiedEdital(false), 2000);
  };

  const handleDownloadDbBackup = async () => {
    try {
      setBackingUp(true);
      const [resPol, resDoc, resTemp, resOps, rConfig] = await Promise.all([
        fetch('/api/policiais').then(r => r.json()).catch(() => []),
        fetch('/api/documentos').then(r => r.json()).catch(() => []),
        fetch('/api/templates').then(r => r.json()).catch(() => []),
        fetch('/api/operacoes').then(r => r.json()).catch(() => []),
        fetch('/api/config').then(r => r.json()).catch(() => ({}))
      ]);
      
      const fullDbDump = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUserNome,
        policiais: resPol,
        documentos: resDoc,
        templates: resTemp,
        operacoes: resOps,
        config: rConfig
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDbDump, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Batalhao_18_Backup_DB_${new Date().getFullYear()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert("Erro ao realizar backup do banco de dados: " + err.message);
    } finally {
      setBackingUp(false);
    }
  };

  // Load configuration from API
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig({
          nome: data.nome || '18º Batalhão de Polícia Militar Metropolitano',
          sigla: data.sigla || '18º BPM/M',
          secretaria: data.secretaria || 'SECRETARIA DE SEGURANÇA PÚBLICA',
          pmesp: data.pmesp || 'POLÍCIA MILITAR DO ESTADO DE SÃO PAULO',
          endereco: data.endereco || 'Av. Deputado Cantídio Sampaio, 1234 - São Paulo/SP',
          slogan: data.slogan || 'Sentinela da Zona Norte - Preservando a Ordem, Protegendo a Vida',
          logoUrl: data.logoUrl || '',
          webhookGeral: data.webhookGeral || '',
          webhookRso: data.webhookRso || '',
          webhookLogs: data.webhookLogs || '',
          webhookRecrutamento: data.webhookRecrutamento || ''
        });
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComandante) {
      setMessage({ type: 'error', text: 'Apenas o Comandante do Batalhão possui credenciais táticas para alterar estes parâmetros.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`/api/config?user=${encodeURIComponent(currentUserNome)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!res.ok) throw new Error('Falha ao comunicar alterações com o servidor central.');
      
      setMessage({ type: 'success', text: 'Parâmetros institucionais e canais Discord atualizados com absoluto sucesso!' });
      onRefreshData();
      
      // Auto-hide success message
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro tático no salvamento.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0b1322] border border-slate-900 rounded-xl p-8 flex items-center justify-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Resgatando variáveis administrativas do Batalhão...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-amber-500" />
            Configurações do Batalhão
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Painel tático exclusivo das Forças de Comando para reformular a assinatura de cabeçalho regimentais do batalhão e direcionar as canaletas de integração do Discord.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0d1525] border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-400">Credencial Atual: </span>
          <span className={`font-mono font-bold uppercase ${isComandante ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>
            {userRole}
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs flex gap-3 items-start animate-fadeIn ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <div>
            <span className="font-semibold block">{message.type === 'success' ? '✓ Operação Homologada' : '⚠️ Erro de Permissão'}</span>
            <span className="mt-0.5 block opacity-95">{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bloco 1: Informações Básicas do Batalhão */}
        <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Building className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Identidade Institucional</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Secretaria Ministerial
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-medium uppercase placeholder:text-slate-600"
                value={config.secretaria}
                onChange={e => setConfig({ ...config, secretaria: e.target.value })}
                placeholder="Ex: SECRETARIA DE SEGURANÇA PÚBLICA"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Instituição / Polícia Militar
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-medium uppercase placeholder:text-slate-600"
                value={config.pmesp}
                onChange={e => setConfig({ ...config, pmesp: e.target.value })}
                placeholder="Ex: POLÍCIA MILITAR DO ESTADO DE SÃO PAULO"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome por Extenso do Batalhão
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all placeholder:text-slate-600 font-medium"
                value={config.nome}
                onChange={e => setConfig({ ...config, nome: e.target.value })}
                placeholder="Ex: 18º Batalhão de Polícia Militar Metropolitano"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Acrônimo / Sigla do Batalhão
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all placeholder:text-slate-600 font-bold"
                value={config.sigla}
                onChange={e => setConfig({ ...config, sigla: e.target.value })}
                placeholder="Ex: 18º BPM/M"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Slogan / Divisa Militar
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all italic placeholder:text-slate-600"
                value={config.slogan}
                onChange={e => setConfig({ ...config, slogan: e.target.value })}
                placeholder="Ex: Sentinela da Zona Norte - Preservando a Ordem, Protegendo a Vida"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Endereço Físico / Quartel-Sede
              </label>
              <input
                type="text"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all placeholder:text-slate-600"
                value={config.endereco}
                onChange={e => setConfig({ ...config, endereco: e.target.value })}
                placeholder="Ex: Av. Deputado Cantídio Sampaio, 1234 - São Paulo/SP"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                URL do Logotipo do Batalhão (Brasão)
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  disabled={!isComandante}
                  className="flex-1 bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all placeholder:text-slate-600 font-mono"
                  value={config.logoUrl}
                  onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/brasao.png (Deixe vazio para usar brasão padrão)"
                />
                
                {config.logoUrl && (
                  <div className="w-9 h-9 border border-slate-800 rounded bg-[#070b14] flex items-center justify-center p-1 overflow-hidden">
                    <img 
                      src={config.logoUrl} 
                      alt="Brasão" 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Caso utilize brasão customizado, utilize links HTTPS estáveis. Em branco, o sistema utilizará o brazão regimental militar padrão da Polícia Militar do Estado de São Paulo.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Discord Webhooks Integration (Canaletas) */}
        <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Slack className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Integração Discord (Canaletas & Webhooks)</h3>
          </div>

          <div className="p-4 bg-blue-950/20 border border-blue-900/35 rounded-xl text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
              <Webhook className="w-3.5 h-3.5 shrink-0" />
              Sincronização Ativa de Informações Operacionais via Discord Webhooks
            </div>
            O Batalhão pode sincronizar as ações do sistema diretamente com canais dedicados no Discord. Cole abaixo os links de Webhooks gerados no Discord de sua corporação:
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Canaleta Geral (Expedientes e Operações)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">#documentos-operacoes</span>
              </div>
              <input
                type="url"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-mono placeholder:text-slate-700"
                value={config.webhookGeral}
                onChange={e => setConfig({ ...config, webhookGeral: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Dispara avisos quando: Documentos Oficiais (Portarias, Ordens de Serviço, Elogios) são devidamente **assinados** pelo Comando ou quando uma **Nova Operação** é registrada.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Canaleta de RSO (Relatórios de Serviço)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">#rso-recebidos</span>
              </div>
              <input
                type="url"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-mono placeholder:text-slate-700"
                value={config.webhookRso}
                onChange={e => setConfig({ ...config, webhookRso: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Dispara avisos quando: Um policial envia um **Relatório de Serviço Operacional (RSO)** na ponta via formulário público de patrulhamento.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Canaleta de Auditoria (Logs do Sistema)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">#auditoria-logs</span>
              </div>
              <input
                type="url"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-mono placeholder:text-slate-700"
                value={config.webhookLogs}
                onChange={e => setConfig({ ...config, webhookLogs: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Dispara avisos em tempo real quando: Acontecem logins táticos, assinaturas de chancelas, cadastro ou exclusão de cabos e policiais militantes, ou reajustes globais do sistema.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Canaleta de Recrutamento (Módulo Edital & Prova)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">#recrutamento-efetivo</span>
              </div>
              <input
                type="url"
                disabled={!isComandante}
                className="w-full bg-[#070b14] text-slate-100 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-all font-mono placeholder:text-slate-700"
                value={config.webhookRecrutamento}
                onChange={e => setConfig({ ...config, webhookRecrutamento: e.target.value })}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Dispara avisos quando: Candidatos realizarem novas inscrições, completarem provas com os respectivos desempenhos percentuais, forem admitidos pelo Comando, ou convocados para entrevistas.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 3: Páginas de Acesso Público */}
        <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Link className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Links de Acesso à Comunidade (Canais Públicos)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Estas são as páginas livres que qualquer cidadão, recrutando ou policial na rua pode acessar externamente sem precisar logar no painel administrativo principal. Copie os links para divulgar nos canais do Discord:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: RSO */}
            <div className="bg-[#070b14] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-extrabold">Formulário Externo</span>
                <span className="text-[10px] text-slate-500 font-mono">/rso</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase">RSO - Relatório de Serviço Operacional</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                Destinado aos policiais na rua para relatar apreensões, veículos, multas e ocorrências do plantão em tempo real.
              </p>
              <div className="flex items-center gap-1.5 bg-[#0b1322] border border-slate-850 px-2 py-1.5 rounded overflow-x-auto select-all">
                <span className="text-[9px] text-slate-400 font-mono break-all font-medium">
                  {window.location.origin}/rso
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyRsoLink}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 hover:text-slate-200 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>{copiedRso ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
                {onGoToRsoForm && (
                  <button
                    type="button"
                    onClick={onGoToRsoForm}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded-md text-[10px] font-bold uppercase transition-transform flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Acessar Canal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Recrutamento */}
            <div className="bg-[#070b14] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-mono bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-extrabold">Portal de Candidatura</span>
                <span className="text-[10px] text-slate-500 font-mono">/edital</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200 uppercase">Processo Seletivo (Inscrição & Prova)</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                Permite a candidatos civis ler o edital ativo, submeter inscrição e realizar a prova de conhecimentos militares.
              </p>
              <div className="flex items-center gap-1.5 bg-[#0b1322] border border-slate-850 px-2 py-1.5 rounded overflow-x-auto select-all">
                <span className="text-[9px] text-slate-400 font-mono break-all font-medium">
                  {window.location.origin}/edital
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={copyEditalLink}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded-md text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 hover:text-slate-200 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>{copiedEdital ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
                {onGoToEdital && (
                  <button
                    type="button"
                    onClick={onGoToEdital}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded-md text-[10px] font-bold uppercase transition-transform flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Acessar Canal</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Banco de Dados Completo (Download e Integridade) */}
        <div className="bg-[#0a101b] border border-slate-900 rounded-xl p-5 md:p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Banco de Dados Geral do Batalhão</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Ações de Chancelaria e Salvaguarda</span>
              <h4 className="text-xs font-bold text-slate-200 uppercase">Exportação Completa e Backup do Acervo</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans max-w-xl">
                Realiza o download consolidado em formato estruturado JSON contendo todos os registros de policiais, cadastros funcionais, expedientes, provas de recrutamento, e dados logísticos ativos.
              </p>
            </div>

            <button
              type="button"
              disabled={backingUp}
              onClick={handleDownloadDbBackup}
              className="w-full md:w-auto shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{backingUp ? 'Processando...' : 'Fazer Backup Completo (JSON)'}</span>
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        {isComandante ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 text-xs font-bold py-2.5 px-6 rounded-lg transition-all uppercase tracking-wider cursor-pointer font-mono disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                  <span>Transmitindo Configurações...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Parâmetros do Batalhão</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-amber-500/80 flex gap-2.5 items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Painel em Modo de Visualização Regimental</span>
              Sua credencial atual ({userRole}) não é dotada de autoria administrativa para atualizar dados estruturais ou chaves de canais Discord. Para alterar o cabeçalho funcional e ativar os webhooks, conecte-se com a conta do Comandante do Batalhão.
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
