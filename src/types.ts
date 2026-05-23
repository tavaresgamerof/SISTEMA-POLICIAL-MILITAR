/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RankPM = 
  | 'Cel PM' 
  | 'Ten Cel PM' 
  | 'Maj PM' 
  | 'Cap PM' 
  | '1º Ten PM' 
  | 'Subten PM' 
  | '1º Sgt PM' 
  | '2º Sgt PM' 
  | '3º Sgt PM' 
  | 'Cb PM' 
  | 'Sd PM';

export type UserRole = 'Comandante' | 'Subcomandante' | 'Estado-Maior' | 'Oficial' | 'Praca';

export interface Policial {
  id: string;
  nome: string;
  rg: string;
  patente: RankPM;
  funcao: string;
  dataIngresso: string;
  discordId: string;
  situação: 'Ativo' | 'Afastado' | 'Reserva' | 'Férias' | 'Inativo';
}

export type DocumentCategory = 
  | 'ADMINISTRATIVO' 
  | 'RECURSOS HUMANOS' 
  | 'OPERACIONAL' 
  | 'COMUNICAÇÃO' 
  | 'CORREGEDORIA';

export interface Documento {
  id: string;
  numeracao: string;
  tipo: string; // Portaria, Ordem de Serviço, etc.
  categoria: DocumentCategory;
  titulo: string;
  conteudo: string; // markdown or plain text
  status: 'Rascunho' | 'Assinado' | 'Arquivado';
  autor: {
    nome: string;
    rg: string;
    patente: RankPM;
  };
  dataCriacao: string;
  assinaturaId?: string;
  assinaturaNome?: string;
  assinaturaPatente?: RankPM;
  assinaturaData?: string;
}

export interface Template {
  id: string;
  titulo: string;
  tipo: string;
  categoria: DocumentCategory;
  conteudo: string;
  descricao: string;
}

export interface AssinaturaMembro {
  id: string;
  nome: string;
  rg: string;
  patente: RankPM;
  cargo: string; // Comandante, Subcomandante, Chefe de Estado-Maior, etc.
  rubricaSimbolo: string; // base64 or stylized SVG string
  ativo: boolean;
}

export interface OperacaoPM {
  id: string;
  nome: string;
  data: string;
  local: string;
  status: 'Planejamento' | 'Em Andamento' | 'Conclúida' | 'Cancelada';
  comandante: string;
  descricao: string;
}

export interface LogPM {
  id: string;
  data: string;
  autor: string;
  acao: string;
  tipo: 'Criar' | 'Editar' | 'Assinar' | 'Login' | 'Acesso Negado' | 'Sistema';
  ip?: string;
}

export interface DashboardStats {
  totalPoliciais: number;
  totalDocumentos: number;
  totalAssinados: number;
  totalRascunhos: number;
  promocoesMes: number;
  sindicanciasAtivas: number;
  advertenciasAno: number;
  operacoesAtivas: number;
}

export interface RsoAnexo {
  name: string;
  size: number;
  type: string;
  base64: string;
}

export interface Rso {
  id: string;
  protocolo: string;
  nome_policial: string;
  rg: string;
  patente: RankPM;
  prefixo_viatura: string;
  funcao: 'Encarregado' | 'Motorista' | 'Apoio';
  data_servico: string;
  hora_inicio: string;
  hora_fim: string;
  setor: string;
  policiais_patrulha: string;
  supervisor?: string;
  abordagens: number;
  veiculos_abordados: number;
  pessoas_abordadas: number;
  prisoes: number;
  apreensoes: number;
  ocorrencias: number;
  observacoes: string;
  anexos: RsoAnexo[];
  data_envio: string;
  declaracao_veracidade: boolean;
  assinatura_digital: string;
}

