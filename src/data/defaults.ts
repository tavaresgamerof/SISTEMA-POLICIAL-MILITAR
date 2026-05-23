/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Policial, Documento, Template, AssinaturaMembro, OperacaoPM, LogPM } from '../types';

export const DEFAULT_POLICIAIS: Policial[] = [
  {
    id: 'p-1',
    nome: 'Francisco de Souza Camargo',
    rg: 'PM-12.340',
    patente: 'Cel PM',
    funcao: 'Comandante Geral do 18º BPM/M',
    dataIngresso: '2010-02-15',
    discordId: '3210987654321098',
    situação: 'Ativo'
  },
  {
    id: 'p-2',
    nome: 'Alexandre Magno Guedes',
    rg: 'PM-25.671',
    patente: 'Ten Cel PM',
    funcao: 'Subcomandante do Batalhão',
    dataIngresso: '2012-05-10',
    discordId: '9876543210987654',
    situação: 'Ativo'
  },
  {
    id: 'p-3',
    nome: 'Roberta Martins Neves',
    rg: 'PM-48.905',
    patente: 'Maj PM',
    funcao: 'Chefe da Seção de Recursos Humanos (Seção P/1)',
    dataIngresso: '2014-08-22',
    discordId: '1234567890123456',
    situação: 'Ativo'
  },
  {
    id: 'p-4',
    nome: 'Rodrigo Augusto Silva',
    rg: 'PM-81.209',
    patente: 'Cap PM',
    funcao: 'Oficial Coordenador de Operações (Seção P/3)',
    dataIngresso: '2016-11-03',
    discordId: '2345678901234567',
    situação: 'Ativo'
  },
  {
    id: 'p-5',
    nome: 'Erick Rodrigues Oliveira',
    rg: 'PM-90.111',
    patente: '1º Ten PM',
    funcao: 'Comandante da 1ª Cia PM',
    dataIngresso: '2018-04-12',
    discordId: '3456789012345678',
    situação: 'Ativo'
  },
  {
    id: 'p-6',
    nome: 'Marcos de Souza Pontes',
    rg: 'PM-12.775',
    patente: '1º Sgt PM',
    funcao: 'Encarregado Administrativo da Cia PM',
    dataIngresso: '2015-01-20',
    discordId: '4567890123456789',
    situação: 'Ativo'
  },
  {
    id: 'p-7',
    nome: 'Douglas Ricardo Souza',
    rg: 'PM-23.456',
    patente: 'Cb PM',
    funcao: 'Motorista de Rota de Patrulhamento',
    dataIngresso: '2020-09-14',
    discordId: '5678901234567890',
    situação: 'Ativo'
  },
  {
    id: 'p-8',
    nome: 'Felipe Dias Silva',
    rg: 'PM-33.780',
    patente: 'Sd PM',
    funcao: 'Rádio Patrulha - Operador de Computador de Bordo',
    dataIngresso: '2022-03-01',
    discordId: '6789012345678901',
    situação: 'Ativo'
  },
  {
    id: 'p-9',
    nome: 'Ana Beatriz Mendes',
    rg: 'PM-56.402',
    patente: 'Sd PM',
    funcao: 'Rádio Patrulha - Integrante',
    dataIngresso: '2023-01-15',
    discordId: '7890123456789012',
    situação: 'Ativo'
  }
];

export const DEFAULT_ASSINATURAS: AssinaturaMembro[] = [
  {
    id: 'a-1',
    nome: 'Francisco de Souza Camargo',
    rg: 'PM-12.340',
    patente: 'Cel PM',
    cargo: 'Comandante Geral Geral do 18º BPM/M',
    rubricaSimbolo: 'ASSINATURA DIGITAL GERAL: [CEL PM F. CAMARGO - COMANDANTE - CHAVE: #F8293KA]',
    ativo: true
  },
  {
    id: 'a-2',
    nome: 'Alexandre Magno Guedes',
    rg: 'PM-25.671',
    patente: 'Ten Cel PM',
    cargo: 'Subcomandante do Batalhão',
    rubricaSimbolo: 'ASSINATURA DIGITAL SUB: [TEN CEL A. GUEDES - SUBCOMAN - CHAVE: #G1094JD]',
    ativo: true
  },
  {
    id: 'a-3',
    nome: 'Roberta Martins Neves',
    rg: 'PM-48.905',
    patente: 'Maj PM',
    cargo: 'Chefe da Seção P/1',
    rubricaSimbolo: 'ASSINATURA DIGITAL EM: [MAJ PM R. NEVES - ESTADO MAIOR - CHAVE: #M4481KL]',
    ativo: true
  }
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 't-1',
    titulo: 'Promoção por Destaque Operacional',
    tipo: 'Promoção',
    categoria: 'RECURSOS HUMANOS',
    descricao: 'Template padrão de ascensão funcional devido ao meritório destaque na radiopatrulha ou operações especiais.',
    conteudo: `### PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-###

O COMANDANTE DO 18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO, no uso de suas atribuições legais e em conformidade com o Regulamento de Promoções da Polícia Militar do Estado de São Paulo,

**RESOLVE:**

**Artigo 1º** - Promover, por Destaque Operacional, ao posto de \`[Nova Patente]\`, o policial militar \`[Nome do Policial]\`, RG \`[RG]\`, atualmente figurando na patente de \`[Patente Atual]\`.

**Artigo 2º** - A referida ascensão fundamenta-se nos excepcionais serviços operacionais prestados à comunidade do 18º BPM/M, notadamente na ação de combate ao crime organizado datada de \`[Data da Ocorrência]\`, onde demonstrou tirocínio policial avançado, bravura, e total apego à doutrina de preservação da ordem pública e defesa da vida.

**Artigo 3º** - Ficam atribuídos ao promovido todos os direitos pecuniários e prerrogativas inerentes ao novo posto militar.

**Artigo 4º** - Esta Portaria entra em vigor na data de sua publicação no Boletim Interno de Serviço do Batalhão.

Quartel em São Paulo, SP, [Data Atual].


__________________________________
[Assinatura Autorizada]
Comandante Geral do 18º BPM/M`
  },
  {
    id: 't-2',
    titulo: 'Nota de Elogio Individual',
    tipo: 'Elogio Individual',
    categoria: 'RECURSOS HUMANOS',
    descricao: 'Elogio oficial inserido nos assentamentos individuais do militar por conduta exemplar e dedicação extrema ao serviço.',
    conteudo: `### NOTA DE ELOGIO INDIVIDUAL Nº PMESP-18BPMM-2026-###

FAZ SABER, o Comando da Seção de Recursos Humanos (M-1) e Estado-Maior do 18º BPM/M, que é dever de justiça consignar nos assentamentos individuais do policial militar abaixo apontado, o seguinte reconhecimento público:

**INTEGRANTE ELOGIADO:**
- **Nome:** \`[Nome do Policial]\`
- **RG:** \`[RG]\`
- **Patente:** \`[Patente Atual]\`

**FATO MERITÓRIO:**
Durante a execução do Plano de Metas da Polícia Militar contra crimes violentos contra o patrimônio na Zona Norte da Capital Paulista, o referido policial demonstrou dedicação infatigável e extraordinário profissionalismo que ultrapassaram as exigências rotineiras de sua função.

Através de paciência investigativa e agilidade de reação operacional, conseguiu apreender numeroso arsenal clandestino sem disparar tiros, garantindo incolumidade pública. Tal atitude dignifica a farda paulista de Tiradentes e estabelece paradigma ético-operativo aos seus pares.

Registra-se o presente Elogio para fins de qualificação técnica para promoções futuras.

Dê-se publicidade em Boletim Interno.

Quartel em São Paulo, SP, [Data Atual].


__________________________________
[Assinatura Autorizada]
Seção P/1 - Recursos Humanos`
  },
  {
    id: 't-3',
    titulo: 'Ordem de Serviço (Policiamento)',
    tipo: 'Ordem de Serviço',
    categoria: 'OPERACIONAL',
    descricao: 'Distribuição tática de viaturas e contingente militar para operações sazonais de patrulhamento repressivo.',
    conteudo: `### ORDEM DE SERVIÇO OPERACIONAL Nº PMESP-18BPMM-2026-###

**ASSUNTO:** Planejamento e Execução do Policiamento Sazonal - OPERAÇÃO FORÇA TOTAL 18

**COORDENADOR:** Seção de Operações (P/3) - 18º BPM/M

**RESOLVE:**

**1. SITUAÇÃO:**
Detectou-se aumento de delitos de oportunidade no perímetro do Subsetor Sul do 18º BPM/M. Torna-se imperativo o aumento da densidade visual do fardamento militar e a realização de bloqueios pontuais.

**2. EXECUÇÃO:**
- **Período de Execução:** [Data e Hora de Início] a [Data e Hora de Fim].
- **Emprego Operacional:** Força Patrulha, ROTA (Rondas Ostensivas Tobias de Aguiar) simuladas pelo Comando do Setor, e viaturas de Rádio Patrulha Padrão.
- **Foco Tático:** Abordagem a motocicletas com dois ocupantes, vistoria veicular estrita e ponto de estacionamento dinâmico.

**3. INSTRUÇÕES COORDENADAS:**
Os comandantes de viatura deverão manter contato rádio intermitente na sintonia principal com o COPOM do Batalhão. O uso de colete à prova de balas nível III é obrigatório.

**4. REGISTRO DE EXECUÇÃO:**
A produtividade coletada (RAs, boletins, apreensões) deve ser consolidada e enviada via SEI/Express até 2 horas pós-término.

Quartel em São Paulo, SP, [Data Atual].


__________________________________
[Assinatura Autorizada]
Seção P/3 - Operações e Planejamento`
  },
  {
    id: 't-4',
    titulo: 'Instauração de Sindicância Administrativa',
    tipo: 'Sindicância',
    categoria: 'CORREGEDORIA',
    descricao: 'Portaria de abertura oficial de sindicância disciplinar interna de apuração de conduta ou danos a patrimônio público.',
    conteudo: `### PORTARIA DE INSTAURAÇÃO DE SINDICÂNCIA DISCIPLINAR Nº PMESP-18BPMM-2026-###

O SUBCOMANDANTE DO 18º BATALHÃO DE POLÍCIA DISCIPLINAR METROPOLITANO, no uso de suas competências de órgão de corregedoria setorial subordinada,

**CONSIDERANDO** as notícias trazidas a este Comando referente à avaria mecânica sofrida pela Viatura Prefixada M-18204 (Toyota Hilux) no dia \`[Data do Dano]\` no subsetor Central, durante o encerramento do patrulhamento rotineiro comandado pelo militar encarregado \`[Nome do Encarregado]\`, RG \`[RG]\`.

**RESOLVE:**

**Artigo 1º** - Determinar a instauração de SINDICÂNCIA disciplinar regulamentar para apurar as circunstâncias e determinar responsabilidades quanto ao dano patrimonial avaliado.

**Artigo 2º** - Designar o Capitão PM \`[Capitão Designado]\`, RG \`[RG Capitão]\`, para atuar como Oficial Presidente e Encarregado da presente fase inquisitorial de apuração.

**Artigo 3º** - Conceder ao militar implicado o contraditório constitucional e a ampla defesa, facultando-lhe juntada de laudo técnico ou testemunhas no prazo regimental de 10 (dez) dias úteis.

**Artigo 4º** - Estipula-se o prazo estrito de 30 (trinta) dias para apresentação do relatório final conclusivo a esta subcomissão disciplinar.

Quartel em São Paulo, SP, [Data Atual].


__________________________________
[Assinatura Autorizada]
Corregedoria Interna Setorial`
  },
  {
    id: 't-5',
    titulo: 'Memorando de Requisição de Material',
    tipo: 'Memorando',
    categoria: 'ADMINISTRATIVO',
    descricao: 'Formalidade de correspondência interna entre escalões e seções requisitando insumos de intendência.',
    conteudo: `### MEMORANDO INTERNO Nº PMESP-18BPMM-2026-###

**DE:** Seção de Logística, Tecnologia e Intendência (P/4)
**PARA:** Comando de Almoxarifado Geral do Quartel Central

**ASSUNTO:** Solicitação em Caráter de Urgência de Lote de Insumos Táticos para Patrulhamento

**1. REQUISIÇÃO:**
Solicita-se a este almoxarifado a liberação de cotas suplementares dos seguintes materiais operacionais para recomposição do estoque tático das viaturas da 1ª Cia:
- **Dispositivos Máscara de Gás Ativo:** 10 unidades.
- **Cartuchos Municiamento Calibre 5.56mm:** 1.200 cartuchos de treinamento e 500 de dotação operacional ativa.
- **Bastões Balísticos de Impacto (Tático):** 15 unidades.

**2. JUSTIFICATIVA:**
O estoque corrente encontra-se reduzido em face às constantes operações conjuntas e escoltas policiais armadas no limite de nossa circunscrição.

Agradecemos a presteza e o pronto atendimento institucional.

Quartel em São Paulo, SP, [Data Atual].


__________________________________
[Assinatura Autorizada]
Seção P/4 - Suporte Logístico`
  }
];

export const DEFAULT_DOCUMENTOS: Documento[] = [
  {
    id: 'doc-1',
    numeracao: 'PORT-2026-001',
    tipo: 'Portaria',
    categoria: 'RECURSOS HUMANOS',
    titulo: 'PORTARIA DE PROMOÇÃO POR DESTAQUE - SD FELIPE SILVA',
    conteudo: `### PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-001

O COMANDANTE DO 18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO, no uso de suas atribuições legais,

**RESOLVE:**

**Artigo 1º** - Promover, por Destaque Operacional, à patente de **Cabo PM**, o militar **Felipe Dias Silva**, RG **PM-33.780**, atualmente Soldado PM de 1ª Classe.

**Artigo 2º** - A referida medida baseia-se na irrepreensível ação de resposta em 18 de Maio de 2026, onde o militar procedeu com o salvamento de um refém sob grave ameaça fardando técnica exemplar de negociação tática.

**Artigo 3º** - Dê-se andamento, registrando na ficha funcional e aplicando efeitos de folha salarial imediata.

Quartel em São Paulo, SP, 2026-05-18.`,
    status: 'Assinado',
    autor: {
      nome: 'Francisco de Souza Camargo',
      rg: 'PM-12.340',
      patente: 'Cel PM'
    },
    dataCriacao: '2026-05-18T10:30:00Z',
    assinaturaId: 'a-1',
    assinaturaNome: 'Francisco de Souza Camargo',
    assinaturaPatente: 'Cel PM',
    assinaturaData: '2026-05-18T11:00:00Z'
  },
  {
    id: 'doc-2',
    numeracao: 'OS-2026-001',
    tipo: 'Ordem de Serviço',
    categoria: 'OPERACIONAL',
    titulo: 'OPERACIONAL: PATRULHAMENTO INTENSIVO - BAIRRO PIRITUBA',
    conteudo: `### ORDEM DE SERVIÇO Nº PMESP-18BPMM-2026-001

**ASSUNTO:** OPERAÇÃO SATURAÇÃO SETOR NORTE

**Artigo 1º** - Determinar o policiamento reforçado com 4 viaturas táticas no subsetor de Pirituba das 18:00 às 02:00 de amanhã.

**Artigo 2º** - Viaturas escaladas: M-18115, M-18230. Coordenados pelo Tenente Erick Rodrigues.

**Artigo 3º** - Foco em inibição de delitos comerciais e revista veicular sistemática tática preventivas.

Dado no Quartel PM, 2026-05-22.`,
    status: 'Assinado',
    autor: {
      nome: 'Rodrigo Augusto Silva',
      rg: 'PM-81.209',
      patente: 'Cap PM'
    },
    dataCriacao: '2026-05-22T14:15:00Z',
    assinaturaId: 'a-2',
    assinaturaNome: 'Alexandre Magno Guedes',
    assinaturaPatente: 'Ten Cel PM',
    assinaturaData: '2026-05-22T15:00:00Z'
  },
  {
    id: 'doc-3',
    numeracao: 'BI-2026-001',
    tipo: 'Boletim Interno',
    categoria: 'COMUNICAÇÃO',
    titulo: 'BOLETIM INTERNO DIÁRIO Nº 102/2026',
    conteudo: `### BOLETIM INTERNO DE SERVIÇO Nº 102

Para conhecimento deste Batalhão e devida execução, publica-se o seguinte:

**I - PARTE DIÁRIA DO COMANDO**
Escala de serviço regular ativada para o final de semana de 23 e 24 de Maio.

**II - ASSUNTOS PESSOAIS E RH**
Licença médica autorizada de 3 dias para o Cabo PM Douglas Ricardo Souza por recomendação de junta de saúde.

**III - LOGÍSTICA**
Devolução de fardamentos para troca de blindagem balística programada pela Intendência.

São Paulo, SP, 2026-05-23.`,
    status: 'Rascunho',
    autor: {
      nome: 'Roberta Martins Neves',
      rg: 'PM-48.905',
      patente: 'Maj PM'
    },
    dataCriacao: '2026-05-23T06:00:00Z'
  }
];

export const DEFAULT_OPERACOES: OperacaoPM[] = [
  {
    id: 'op-1',
    nome: 'Operação Força Total 18',
    data: '2026-05-24',
    local: 'Zona Sul - circunscrição 18º BPM/M',
    status: 'Planejamento',
    comandante: 'Cap PM Rodrigo Silva',
    descricao: 'Ação saturação para coibir roubo de cargas e aumento de segurança comercial nas vias de acesso periféricas.'
  },
  {
    id: 'op-2',
    nome: 'Cerco Tático Metropolitano',
    data: '2026-05-23',
    local: 'Pontes de Ligação e Subsetor Leste',
    status: 'Em Andamento',
    comandante: 'Ten Cel PM Alexandre Guedes',
    descricao: 'Bloqueios dinâmicos estruturados com suporte rádio em tempo real para controle de veículos furtados.'
  },
  {
    id: 'op-3',
    nome: 'Operação Divisa Segura',
    data: '2026-05-15',
    local: 'Perímetro Divisa Estadual da Zona Norte',
    status: 'Conclúida',
    comandante: 'Cel PM Francisco Camargo',
    descricao: 'Patrulhamento ostensivo integrado tático que logrou apreender 2 veículos adulterados e apreensão de facas e drogas.'
  }
];

export const DEFAULT_LOGS: LogPM[] = [
  {
    id: 'log-1',
    data: '2026-05-23T06:30:00Z',
    autor: 'Sd PM Felipe Santos (Discord Sim)',
    acao: 'Login de Praça efetuado com sucesso',
    tipo: 'Login',
    ip: '189.44.20.103'
  },
  {
    id: 'log-2',
    data: '2026-05-23T06:15:00Z',
    autor: 'Maj PM Roberta Neves',
    acao: 'Criação do Boletim Diário BI-2026-001 como rascunho',
    tipo: 'Criar',
    ip: '177.102.33.15'
  },
  {
    id: 'log-3',
    data: '2026-05-22T15:00:00Z',
    autor: 'Ten Cel PM Alexandre Guedes',
    acao: 'Assinou documento operacional OS-2026-001',
    tipo: 'Assinar',
    ip: '200.180.45.19'
  }
];
