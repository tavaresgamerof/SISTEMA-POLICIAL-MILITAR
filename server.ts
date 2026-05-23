/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Initialize default DB if it doesn't exist
async function initDatabase() {
  if (!existsSync(DB_FILE)) {
    const initialDb = {
      policiais: [
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
          funcao: 'Rádio Patrulha - Integrante',
          dataIngresso: '2022-03-01',
          discordId: '6789012345678901',
          situação: 'Ativo'
        }
      ],
      assinaturas: [
        {
          id: 'a-1',
          nome: 'Francisco de Souza Camargo',
          rg: 'PM-12.340',
          patente: 'Cel PM',
          cargo: 'Comandante Geral do 18º BPM/M',
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
      ],
      templates: [
        {
          id: 't-1',
          titulo: 'Promoção por Destaque Operacional',
          tipo: 'Promoção',
          categoria: 'RECURSOS HUMANOS',
          descricao: 'Template padrão de ascensão funcional devido ao meritório destaque na radiopatrulha ou operações especiais.',
          conteudo: `### PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-###\n\nO COMANDANTE DO 18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO, no uso de suas atribuições legais,\n\n**RESOLVE:**\n\n**Artigo 1º** - Promover, por Destaque Operacional, à patente de \`[Nova Patente]\`, o policial militar \`[Nome do Policial]\`, RG \`[RG]\`, atualmente figurando na patente de \`[Patente Atual]\`.\n\n**Artigo 2º** - A referida ascensão fundamenta-se nos excepcionais serviços operacionais prestados à comunidade do 18º BPM/M, notadamente onde demonstrou tirocínio policial avançado, audácia militar e total apego à doutrina de preservação da ordem pública e defesa da vida.\n\n**Artigo 3º** - Ficam atribuídos ao promovido todos os direitos pecuniários e prerrogativas inerentes à nova graduação.\n\n**Artigo 4º** - Esta Portaria entra em vigor na data de sua assinatura.\n\nQuartel em São Paulo, SP, [Data Atual].\n\n\n__________________________________\nComandante Geral do 18º BPM/M`
        },
        {
          id: 't-2',
          titulo: 'Nota de Elogio Individual',
          tipo: 'Elogio Individual',
          categoria: 'RECURSOS HUMANOS',
          descricao: 'Elogio oficial inserido nos assentamentos individuais do militar por conduta exemplar e dedicação extrema ao serviço.',
          conteudo: `### NOTA DE ELOGIO INDIVIDUAL Nº PMESP-18BPMM-2026-###\n\nFAZ SABER, o Comando da Seção de Recursos Humanos (P/1) do 18º BPM/M, que é dever de justiça consignar nos assentamentos individuais do policial militar abaixo apontado, o seguinte reconhecimento público:\n\n**INTEGRANTE ELOGIADO:**\n- **Nome:** \`[Nome do Policial]\`\n- **RG:** \`[RG]\`\n- **Patente:** \`[Patente Atual]\`\n\n**FATO MERITÓRIO:**\nDurante a execução do Plano Metas da Polícia Militar na circunscrição do 18º BPM/M, o referido policial demonstrou dedicação infatigável e extraordinário profissionalismo.\n\nTal atitude dignifica a farda paulista e estabelece paradigma ético-operativo aos seus pares.\n\nRegistra-se o presente Elogio para fins de qualificação técnica para promoções futuras.\n\nDê-se publicidade em Boletim Interno.\n\nQuartel em São Paulo, SP, [Data Atual].\n\n\n__________________________________\nSeção P/1 - Recursos Humanos`
        },
        {
          id: 't-3',
          titulo: 'Ordem de Serviço (Policiamento)',
          tipo: 'Ordem de Serviço',
          categoria: 'OPERACIONAL',
          descricao: 'Distribuição tática de viaturas e contingente militar para operações sazonais de patrulhamento repressivo.',
          conteudo: `### ORDEM DE SERVIÇO OPERACIONAL Nº PMESP-18BPMM-2026-###\n\n**ASSUNTO:** Planejamento e Execução do Policiamento Sazonal - OPERAÇÃO FORÇA TOTAL 18\n\n**COORDENADOR:** Seção de Operações (P/3) - 18º BPM/M\n\n**RESOLVE:**\n\n**1. SITUAÇÃO:**\nDetectou-se necessidade de aumento de delitos de oportunidade no perímetro do Subsetor Sul do 18º BPM/M. Torna-se imperativo o aumento da densidade visual do fardamento militar e bloqueios táticos.\n\n**2. EXECUÇÃO:**\n- **Período de Execução:** [Data e Hora de Início] a [Data e Hora de Fim].\n- **Emprego Operacional:** Força Patrulha e viaturas de Rádio Patrulha Padrão.\n- **Foco Tático:** Abordagem a motocicletas com dois ocupantes, vistoria veicular estrita e ponto de estacionamento dinâmico.\n\n**3. INSTRUÇÕES COORDENADAS:**\nOs comandantes de viatura deverão manter contato rádio intermitente na sintonia principal com o COPOM do Batalhão.\n\nQuartel em São Paulo, SP, [Data Atual].\n\n\n__________________________________\nSeção P/3 - Operações e Planejamento`
        }
      ],
      documentos: [
        {
          id: 'doc-1',
          numeracao: 'PORT-2026-001',
          tipo: 'Portaria',
          categoria: 'RECURSOS HUMANOS',
          titulo: 'PORTARIA DE PROMOÇÃO POR DESTAQUE - SD FELIPE SILVA',
          conteudo: `### PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-001\n\nO COMANDANTE DO 18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO, no uso de suas atribuições legais,\n\n**RESOLVE:**\n\n**Artigo 1º** - Promover, por Destaque Operacional, à patente de **Cabo PM**, o militar **Felipe Dias Silva**, RG **PM-33.780**, atualmente Soldado PM de 1ª Classe.\n\n**Artigo 2º** - A referida medida baseia-se na irrepreensível ação de resposta em 18 de Maio de 2026, onde o militar procedeu com o salvamento de um refém sob grave ameaça portando técnica exemplar de negociação tática.\n\n**Artigo 3º** - Dê-se andamento, registrando na ficha funcional e aplicando efeitos de folha salarial imediata.\n\nQuartel em São Paulo, SP, 2026-05-18.`,
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
          conteudo: `### ORDEM DE SERVIÇO Nº PMESP-18BPMM-2026-001\n\n**ASSUNTO:** OPERAÇÃO SATURAÇÃO SETOR NORTE\n\n**Artigo 1º** - Determinar o policiamento reforçado com 4 viaturas táticas no subsetor de Pirituba das 18:00 às 02:00 de amanhã.\n\n**Artigo 2º** - Coordenados pelo Primeiro Tenente Erick Rodrigues.\n\n**Artigo 3º** - Foco em inibição de delitos comerciais e revista veicular sistemática tática preventivas.\n\nDado no Quartel PM, 2026-05-22.`,
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
        }
      ],
      operacoes: [
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
        }
      ],
      logs: [
        {
          id: 'log-1',
          data: '2026-05-23T06:30:00Z',
          autor: 'Cel PM Francisco Camargo (Discord Sim)',
          acao: 'Sessão iniciada como Comandante através do Discord',
          tipo: 'Login',
          ip: '189.44.20.103'
        },
        {
          id: 'log-2',
          data: '2026-05-22T15:00:00Z',
          autor: 'Ten Cel PM Alexandre Guedes',
          acao: 'Assinou documento operacional OS-2026-001',
          tipo: 'Assinar',
          ip: '200.180.45.19'
        }
      ]
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    console.log('Database initialized successfully at:', DB_FILE);
  }
}

async function getDb() {
  await initDatabase();
  const fileContent = await fs.readFile(DB_FILE, 'utf-8');
  const db = JSON.parse(fileContent);
  let changed = false;
  if (!db.rsos) {
    db.rsos = [];
    changed = true;
  }
  if (!db.batalhaoConfig) {
    db.batalhaoConfig = {
      nome: "18º Batalhão de Polícia Militar Metropolitano",
      sigla: "18º BPM/M",
      secretaria: "SECRETARIA DE SEGURANÇA PÚBLICA",
      pmesp: "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO",
      endereco: "Av. Deputado Cantídio Sampaio, 1234 - São Paulo/SP",
      slogan: "Sentinela da Zona Norte - Preservando a Ordem, Protegendo a Vida",
      logoUrl: "",
      webhookGeral: "",
      webhookRso: "",
      webhookLogs: ""
    };
    changed = true;
  }
  if (!db.editais) {
    db.editais = [
      {
        id: "edital-1",
        numero: "18BPM-001/2026",
        titulo: "Concurso Público de Admissão - Soldado de 2ª Classe PM",
        dataPublicacao: "24/05/2026",
        dataInicio: "2026-05-24",
        requisitos: [
          "Ter nacionalidade brasileira",
          "Estar em dia com as obrigações eleitorais e militares",
          "Ter idade mínima de 18 e máxima de 35 anos",
          "Ter concluído o Ensino Médio ou equivalente",
          "Ter altura mínima de 1,60m (homens) ou 1,55m (mulheres)",
          "Possuir Carteira Nacional de Habilitação (CNH) de categoria 'B' ou superior",
          "Não possuir antecedentes criminais desabonadores"
        ],
        etapas: [
          "1ª Etapa: Prova Escrita Objetiva de Conhecimentos (Online via SISDEC-RECRUTA)",
          "2ª Etapa: Exame Psicológico e de Perfil Comportamental",
          "3ª Etapa: Teste de Aptidão Física (TAF) Regimental no Quartel-Sede",
          "4ª Etapa: Investigação Social de Idoneidade e Vida Pregressa"
        ],
        criteriosAprovacao: "O candidato deverá obter pontuação de no mínimo 70% (setenta por cento) de acertos na Prova Escrita Objetiva. Candidatos com notas inferiores serão eliminados compulsoriamente.",
        cronograma: [
          { "evento": "Início das Inscrições e Abertura do Portal", "data": "24/05/2026 às 08h00" },
          { "evento": "Realização da Prova Teórica Online", "data": "Até 30/06/2026 às 23h59" },
          { "evento": "Divulgação do Gabarito e Resultados da Prova", "data": "Fluxo automático imediato" },
          { "evento": "Chamada para Entrevista Técnica Operacional", "data": "A agendar pelo Estado-Maior" }
        ],
        observacoes: "A veracidade de todas as declarações prestadas no formulário de inscrição é de inteira responsabilidade do candidato, sujeitando o infrator às sanções do Código Penal Militar (Falsidade Ideológica de documento militar).",
        ativo: true
      }
    ];
    changed = true;
  }
  if (!db.inscricoes) {
    db.inscricoes = [];
    changed = true;
  }
  if (!db.questoes) {
    db.questoes = [
      {
        id: "q-1",
        categoria: "Hierarquia Militar",
        pergunta: "Na escala hierárquica das corporações militares estaduais, qual das alternativas apresenta a correta precedência funcional (do maior para o menor grau relacional)?",
        alternativas: {
          A: "Coronel, Major, Tenente-Coronel, Capitão",
          B: "Coronel, Tenente-Coronel, Major, Capitão",
          C: "Major, Coronel, Tenente-Coronel, Tenente",
          D: "Coronel, Capitão, Major, Tenente"
        },
        correta: "B"
      },
      {
        id: "q-2",
        categoria: "Hierarquia Militar",
        pergunta: "Qual graduação militar representa a maior praça da Polícia Militar do Estado de São Paulo?",
        alternativas: {
          A: "Subtenente PM",
          B: "1º Sgt PM",
          C: "Sargento-Mor PM",
          D: "Aspirante a Oficial"
        },
        correta: "A"
      },
      {
        id: "q-3",
        categoria: "Regulamento Interno",
        pergunta: "No âmbito do RDPM (Regulamento Disciplinar da Polícia Militar), a transgressão disciplinar militar pode ser classificada em quais graus de gravidade?",
        alternativas: {
          A: "Mínima, Mediana e Máxima",
          B: "Leve, Média e Grave",
          C: "Atenuada, Regular e Agravada",
          D: "Simples e Qualificada"
        },
        correta: "B"
      },
      {
        id: "q-4",
        categoria: "Doutrina Policial",
        pergunta: "Qual é o princípio fundamental absoluto que orienta o uso da força policial na preservação da ordem pública?",
        alternativas: {
          A: "Uso letal antecipado para dissuasão em massa",
          B: "Proporcionalidade, necessidade extrema, legalidade e conveniência técnica",
          C: "Superioridade bélica incondicional em todas as abordagens",
          D: "Autonomia individual do policial de patrulha para definir armamento"
        },
        correta: "B"
      },
      {
        id: "q-5",
        categoria: "Procedimentos Operacionais",
        pergunta: "Durante um bloqueio de via tático (Blitz), qual o primeiro procedimento tático regulamentar a ser observado pela guarnição?",
        alternativas: {
          A: "Realizar disparos de alerta para condicionamento dos motoristas",
          B: "Posicionar a viatura em local seguro com giroflex ligado de forma visível e sinalizar a via com cones adequados",
          C: "Solicitar o RG e CPF de todos os ocupantes antes de ordenar a parada do veículo",
          D: "Confiscar as chaves de todos os veículos que se aproximarem da barreira"
        },
        correta: "B"
      },
      {
        id: "q-6",
        categoria: "Português",
        pergunta: "Assinale a frase que respeita integralmente as regras oficiais de concordância verbal da Língua Portuguesa:",
        alternativas: {
          A: "Haviam muitos cidadãos aguardando atendimento no batalhão.",
          B: "Deve haver punições exemplares para transgressões graves no quartel.",
          C: "Fazem dez anos que os sargentos ingressaram na corporação paulista.",
          D: "Somos nós que coordena o patrulhamento preventivo do subsetor sul."
        },
        correta: "B"
      },
      {
        id: "q-7",
        categoria: "Matemática",
        pergunta: "Se uma guarnição realiza um patrulhamento médio de 45 km em 3 horas operacionais, qual a média de quilometragem percorrida em um turno regimental completo de 12 horas sob a mesma velocidade média?",
        alternativas: {
          A: "200 km",
          B: "135 km",
          C: "180 km",
          D: "150 km"
        },
        correta: "C"
      },
      {
        id: "q-8",
        categoria: "Informática",
        pergunta: "Qual protocolo de internet criptografado é utilizado por padrão para garantir a segurança dos dados enviados ao preencher o Relatório de Serviço Operacional (RSO)?",
        alternativas: {
          A: "HTTP",
          B: "FTP",
          C: "HTTPS",
          D: "SMTP"
        },
        correta: "C"
      },
      {
        id: "q-9",
        categoria: "Conhecimentos Gerais",
        pergunta: "Quem é constitucionalmente o Comandante em Chefe da Polícia Militar e do Corpo de Bombeiros em cada unidade federativa (Estado) do Brasil?",
        alternativas: {
          A: "O Secretário de Segurança Pública",
          B: "O Comandante Geral do Batalhão Regional",
          C: "O Governador do Estado",
          D: "O Presidente do Tribunal de Justiça Militar"
        },
        correta: "C"
      },
      {
        id: "q-10",
        categoria: "Regulamento Interno",
        pergunta: "O recolhimento disciplinar de um policial militar infrator deve ser sempre precedido por qual instituto constitucional fundamental?",
        alternativas: {
          A: "Inquérito Policial Militar instantâneo sem ampla defesa",
          B: "Amplo contraditório e direito à ampla defesa técnica ou autodefesa",
          C: "Decretação em Diário Oficial assinado exclusivamente pelo prefeito",
          D: "Aprovação unânime de toda a guarnição de patrulha"
        },
        correta: "B"
      },
      {
        id: "q-11",
        categoria: "Procedimentos Operacionais",
        pergunta: "Se um policial se depara com um veículo em atitude suspeita durante a patrulha, o que caracteriza a busca pessoal ('enquadro/abordagem') legítima sem mandado judicial?",
        alternativas: {
          A: "Mera antipatia pessoal ou dedução aleatória do patrulheiro",
          B: "Fundada suspeita de que o indivíduo pretenda cometer ou tenha cometido crime, ou porte arma/drogas",
          C: "O fato de o condutor ser jovem ou possuir veículo de valor reduzido",
          D: "Todas as alternativas anteriores estão corretas"
        },
        correta: "B"
      },
      {
        id: "q-12",
        categoria: "Doutrina Policial",
        pergunta: "A sigla GOC, no contexto operacional de policiamento tático e de choque militar estadual, refere-se comumente a qual Grupamento?",
        alternativas: {
          A: "Gabinete de Ocorrências Críticas",
          B: "Grupo de Operações com Cães",
          C: "Guarnição de Operações Civis",
          D: "Diretoria de Guarda e Organização de Choque"
        },
        correta: "B"
      },
      {
        id: "q-13",
        categoria: "Português",
        pergunta: "Escolha a grafia correta da palavra destacada: 'O capitão agiu com muita _______ ao mediar o conflito na comunidade regulada.'",
        alternativas: {
          A: "Descrição (referindo-se ao silêncio reservado)",
          B: "Discrição (referindo-se ao bom senso e reserva)",
          C: "Discreção (como derivado do francês)",
          D: "Disquisição (como termo erudito)"
        },
        correta: "B"
      },
      {
        id: "q-14",
        categoria: "Matemática",
        pergunta: "Em uma escala de serviço, há 40 policiais operacionais disponíveis. Se 25% deles forem alocados na guarda do quartel e o restante no patrulhamento externo de viaturas, quantos policiais estarão patrulhando?",
        alternativas: {
          A: "10 policiais",
          B: "15 policiais",
          C: "30 policiais",
          D: "25 policiais"
        },
        correta: "C"
      },
      {
        id: "q-15",
        categoria: "Informática",
        pergunta: "Qual componente físico de hardware é responsável por armazenar permanentemente os bancos de dados de logs e relatórios RSO no servidor?",
        alternativas: {
          A: "Memória Cache L3",
          B: "Unidade de Armazenamento de Estado Sólido (SSD) ou Disco Rígido (HD)",
          C: "Placa Mãe (Chipset)",
          D: "Unidade Central de Processamento (CPU)"
        },
        correta: "B"
      },
      {
        id: "q-16",
        categoria: "Conhecimentos Gerais",
        pergunta: "Qual Batalhão é historicamente conhecido na Polícia Militar paulista como sendo a 'Rondas Ostensivas Tobias de Aguiar'?",
        alternativas: {
          A: "18º BPM/M",
          B: "1º BPChq (ROTA)",
          C: "3º BPM/M",
          D: "COE (Comandos e Operações Especiais)"
        },
        correta: "B"
      },
      {
        id: "q-17",
        categoria: "Hierarquia Militar",
        pergunta: "Na estrutura militar, do que se encarrega essencialmente a Seção Operacional denominada P/3 do Estado-Maior?",
        alternativas: {
          A: "Gestão de Pessoal e Recursos Humanos",
          B: "Logística, Suprimentos e Finanças",
          C: "Planejamento, Operações e Instrução Coletiva",
          D: "Comunicação Social e Assessoria de Imprensa"
        },
        correta: "C"
      },
      {
        id: "q-18",
        categoria: "Português",
        pergunta: "Indique a afirmativa onde o uso da crase está absolutamente correto:",
        alternativas: {
          A: "O oficial instrutor dirigiu-se à pé para a sala de aula operacional.",
          B: "O sargento prestou juramento de honra à pátria frente ao Comando Geral.",
          C: "A guarnição retornou à uma hora da manhã ao batalhão.",
          D: "Solicito à Vossa Senhoria as planilhas de patrulhamento tático."
        },
        correta: "B"
      },
      {
        id: "q-19",
        categoria: "Matemática",
        pergunta: "Uma ocorrência complexa levou 2 horas e 15 minutos para ser devidamente registrada. Em segundos, qual a duração total dessa intervenção?",
        alternativas: {
          A: "8100 segundos",
          B: "7200 segundos",
          C: "135 segundos",
          D: "810 segundos"
        },
        correta: "A"
      },
      {
        id: "q-20",
        categoria: "Doutrina Policial",
        pergunta: "A filosofia de patrulhamento da Polícia Militar que prioriza a cooperação direta entre moradores de um subsetor urbano e a guarnição é denominada:",
        alternativas: {
          A: "Policiamento de Choque",
          B: "Policiamento Comunitário",
          C: "Policiamento Velado Secreto",
          D: "Policiamento de Força Tática"
        },
        correta: "B"
      }
    ];
    changed = true;
  }
  if (!db.provas) {
    db.provas = [];
    changed = true;
  }
  if (!db.resultados) {
    db.resultados = [];
    changed = true;
  }
  if (!db.convocacoes) {
    db.convocacoes = [];
    changed = true;
  }
  if (db.batalhaoConfig && !db.batalhaoConfig.webhookRecrutamento) {
    db.batalhaoConfig.webhookRecrutamento = "";
    changed = true;
  }
  if (changed) {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
  return db;
}

async function saveDb(data: any) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Generate unique Document Numeration automatically without repetition
function generateNextNumber(docs: any[], docType: string) {
  const currentYear = new Date().getFullYear();
  let prefix = 'PORT';
  const typeLower = (docType || '').toLowerCase();

  if (typeLower.includes('boletim') || typeLower.includes('comunicado') || typeLower.includes('circular') || typeLower.includes('nota') || typeLower.includes('ata') || typeLower.includes('convocação') || typeLower.includes('comunicação')) {
    prefix = 'BI';
  } else if (typeLower.includes('diretriz') || typeLower.includes('ordem de serviço') || typeLower.includes('serviço') || typeLower.includes('operação') || typeLower.includes('patrulhamento') || typeLower.includes('plano') || typeLower.includes('doutrina') || typeLower.includes('manual') || typeLower.includes('regulamento')) {
    prefix = 'OS';
  } else if (typeLower.includes('portaria') || typeLower.includes('sindicância') || typeLower.includes('sindic') || typeLower.includes('processo') || typeLower.includes('termo')) {
    prefix = 'PORT';
  } else if (typeLower.includes('promoção') || typeLower.includes('promoc') || typeLower.includes('rebaixamento') || typeLower.includes('nomeação') || typeLower.includes('transferência') || typeLower.includes('elogio') || typeLower.includes('certificado')) {
    prefix = 'PROM';
  } else if (typeLower.includes('advertência') || typeLower.includes('advert') || typeLower.includes('suspensão') || typeLower.includes('disciplinar') || typeLower.includes('aviso')) {
    prefix = 'ADV';
  }

  const filterPrefix = `${prefix}-${currentYear}-`;
  const matchingDocs = docs.filter(d => d.numeracao && d.numeracao.startsWith(filterPrefix));

  let maxNum = 0;
  matchingDocs.forEach(d => {
    const parts = d.numeracao.split('-');
    const numPart = parseInt(parts[2], 10);
    if (!isNaN(numPart) && numPart > maxNum) {
      maxNum = numPart;
    }
  });

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}-${currentYear}-${nextNum}`;
}

// Write Audit Log helper
async function writeAuditLog(autor: string, acao: string, tipo: string, ip: string = '127.0.0.1') {
  const db = await getDb();
  const newLog = {
    id: 'log-' + Date.now(),
    data: new Date().toISOString(),
    autor,
    acao,
    tipo,
    ip
  };
  db.logs.unshift(newLog);
  // Keep logs at a reasonable limit (e.g. 100)
  if (db.logs.length > 100) {
    db.logs = db.logs.slice(0, 100);
  }
  await saveDb(db);

  // Send to Discord logs webhook if present
  if (db.batalhaoConfig && db.batalhaoConfig.webhookLogs) {
    const formattedContent = `🔔 **LOG DE AUDITORIA MILITAR (${tipo.toUpperCase()})**\n👥 **Autor:** ${autor}\n⚡ **Ação:** ${acao}\n🌐 **IP de Acesso:** ${ip}\n📅 *Data/Hora:* ${new Date().toLocaleString('pt-BR')}`;
    try {
      fetch(db.batalhaoConfig.webhookLogs, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: formattedContent })
      }).catch(err => console.error("Error sending log to Discord:", err));
    } catch (e) {
      console.error("Failed sending log to Discord:", e);
    }
  }
}

// --- API System Routes ---

// Obter Configurações do Batalhão
app.get('/api/config', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.batalhaoConfig || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar Configurações do Batalhão
app.put('/api/config', async (req, res) => {
  try {
    const db = await getDb();
    db.batalhaoConfig = { ...(db.batalhaoConfig || {}), ...req.body };
    await saveDb(db);

    const userQuery = req.query.user || 'Comando Geral';
    await writeAuditLog(
      String(userQuery),
      `Atualizou as configurações institucionais e canais de integração Discord do Batalhão`,
      'Editar'
    );

    res.json(db.batalhaoConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Stats
app.get('/api/stats', async (req, res) => {
  try {
    const db = await getDb();
    const docs = db.documentos || [];
    const policiais = db.policiais || [];

    // Filter indicators
    const totalPoliciais = policiais.length;
    const totalDocumentos = docs.length;
    const totalAssinados = docs.filter((d: any) => d && d.status === 'Assinado').length;
    const totalRascunhos = docs.filter((d: any) => d && d.status === 'Rascunho').length;

    // Logs metrics
    const pMes = docs.filter((d: any) => d && d.tipo === 'Promoção' && d.status === 'Assinado').length;
    const sindicancias = docs.filter((d: any) => d && typeof d.tipo === 'string' && d.tipo.toLowerCase().includes('sindic') && d.status !== 'Arquivado').length;
    const advertencias = docs.filter((d: any) => d && typeof d.tipo === 'string' && d.tipo.toLowerCase().includes('advert')).length;
    const operacoes = (db.operacoes || []).filter((op: any) => op && (op.status === 'Em Andamento' || op.status === 'Planejamento')).length;

    res.json({
      totalPoliciais,
      totalDocumentos,
      totalAssinados,
      totalRascunhos,
      promocoesMes: pMes || 1,
      sindicanciasAtivas: sindicancias || 2,
      advertenciasAno: advertencias || 0,
      operacoesAtivas: operacoes
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logs Endpoint
app.get('/api/logs', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Policiais CRUD
app.get('/api/policiais', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.policiais);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/policiais', async (req, res) => {
  try {
    const db = await getDb();
    const newPolicial = {
      id: 'p-' + Date.now(),
      ...req.body
    };
    db.policiais.push(newPolicial);
    await saveDb(db);
    
    await writeAuditLog(
      req.query.user as string || 'Comandante (Simulado)',
      `Cadastrou o policial militar: ${newPolicial.nome} (RG: ${newPolicial.rg}, Patente: ${newPolicial.patente})`,
      'Criar'
    );

    res.json(newPolicial);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/policiais/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.policiais.findIndex((p: any) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Policial militar não encontrado.' });
    
    const original = { ...db.policiais[idx] };
    db.policiais[idx] = { ...original, ...req.body };
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante (Simulado)',
      `Atualizou ficha funcional de: ${db.policiais[idx].nome} (Alterações: de ${original.patente}/${original.situação} para ${db.policiais[idx].patente}/${db.policiais[idx].situação})`,
      'Editar'
    );

    res.json(db.policiais[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Documentos CRUD
app.get('/api/documentos', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.documentos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documentos', async (req, res) => {
  try {
    const db = await getDb();
    const docData = req.body;
    
    // Auto design numbering!
    const numeracao = docData.numeracao || generateNextNumber(db.documentos, docData.tipo);

    const newDoc = {
      id: 'doc-' + Date.now(),
      numeracao,
      status: docData.status || 'Rascunho',
      conteudo: docData.conteudo || '',
      titulo: docData.titulo || '',
      tipo: docData.tipo || 'Relatório',
      categoria: docData.categoria || 'ADMINISTRATIVO',
      autor: docData.autor || { nome: 'Operador', rg: 'PM-99.999', patente: 'Sd PM' },
      dataCriacao: new Date().toISOString()
    };
    db.documentos.unshift(newDoc);
    await saveDb(db);

    await writeAuditLog(
      `${newDoc.autor.patente} ${newDoc.autor.nome}`,
      `Criou o documento oficial: [${newDoc.numeracao}] ${newDoc.titulo}`,
      'Criar'
    );

    res.json(newDoc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.documentos.findIndex((d: any) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Documento não encontrado.' });

    // Validate signatures lock
    if (db.documentos[idx].status === 'Assinado' && req.body.status !== 'Rascunho') {
      return res.status(400).json({ error: 'Documentos assinados oficialmente estão bloqueados para edição.' });
    }

    db.documentos[idx] = { ...db.documentos[idx], ...req.body };
    await saveDb(db);

    const autorStr = req.query.user as string || 'Administrador';
    await writeAuditLog(
      autorStr,
      `Editou o conteúdo do documento [${db.documentos[idx].numeracao}] ${db.documentos[idx].titulo}`,
      'Editar'
    );

    res.json(db.documentos[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.documentos.findIndex((d: any) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Documento não encontrado.' });

    const doc = db.documentos[idx];
    if (doc.status === 'Assinado') {
      return res.status(400).json({ error: 'Proibido excluir um documento oficial devidamente assinado e homologado!' });
    }

    db.documentos.splice(idx, 1);
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Administrador',
      `Excluiu rascunho de documento: [${doc.numeracao}] ${doc.titulo}`,
      'Sistema'
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assinar Documento
app.post('/api/documentos/:id/assinar', async (req, res) => {
  try {
    const { id } = req.params;
    const { assinaturaId, signatarioNome, signatarioPatente } = req.body;
    
    const db = await getDb();
    const idx = db.documentos.findIndex((d: any) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Documento não encontrado.' });

    const doc = db.documentos[idx];
    doc.status = 'Assinado';
    doc.assinaturaId = assinaturaId;
    doc.assinaturaNome = signatarioNome;
    doc.assinaturaPatente = signatarioPatente;
    doc.assinaturaData = new Date().toISOString();

    await saveDb(db);

    await writeAuditLog(
      `${signatarioPatente} ${signatarioNome}`,
      `Assinou digitalmente o documento [${doc.numeracao}] ${doc.titulo}`,
      'Assinar'
    );

    // Notify Discord Geral if configured
    if (db.batalhaoConfig && db.batalhaoConfig.webhookGeral) {
      const bSigla = db.batalhaoConfig.sigla || "18º BPM/M";
      const bNome = db.batalhaoConfig.nome || "18º Batalhão de Polícia Militar Metropolitano";
      const pmesp = db.batalhaoConfig.pmesp || "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO";
      const gerContent = `📜 **DOCUMENTAMENTO OFICIAL ASSINADO [${doc.numeracao}]**\n\n🏛️ **${pmesp}**\n🏢 **${bNome} (${bSigla})**\n\n📝 **Título:** ${doc.titulo}\n📌 **Tipo:** ${doc.tipo} (${doc.categoria})\n✍️ **Assinado por:** ${signatarioPatente} ${signatarioNome}\n\n*Documento oficial validado eletronicamente e publicado em boletim tático.*`;
      try {
        fetch(db.batalhaoConfig.webhookGeral, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: gerContent })
        }).catch(err => console.error("Error sending doc sign to Discord:", err));
      } catch (e) {
        console.error(e);
      }
    }

    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Templates CRUD
app.get('/api/templates', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const db = await getDb();
    const newTemplate = {
      id: 't-' + Date.now(),
      ...req.body
    };
    db.templates.push(newTemplate);
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante',
      `Criou o modelo de documento: ${newTemplate.titulo}`,
      'Criar'
    );

    res.json(newTemplate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.templates.findIndex((t: any) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Template não encontrado.' });

    db.templates[idx] = { ...db.templates[idx], ...req.body };
    await saveDb(db);

    res.json(db.templates[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.templates.findIndex((t: any) => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Template não encontrado.' });

    const temp = db.templates[idx];
    db.templates.splice(idx, 1);
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante',
      `Excluiu modelo ordinário: ${temp.titulo}`,
      'Sistema'
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assinaturas CRUD
app.get('/api/assinaturas', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.assinaturas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assinaturas', async (req, res) => {
  try {
    const db = await getDb();
    const newAssinatura = {
      id: 'a-' + Date.now(),
      ...req.body,
      ativo: true
    };
    db.assinaturas.push(newAssinatura);
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante',
      `Cadastrou nova chancela oficial para: ${newAssinatura.patente} ${newAssinatura.nome}`,
      'Criar'
    );

    res.json(newAssinatura);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Operações CRUD
app.get('/api/operacoes', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.operacoes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/operacoes', async (req, res) => {
  try {
    const db = await getDb();
    const newOp = {
      id: 'op-' + Date.now(),
      ...req.body
    };
    db.operacoes.push(newOp);
    await saveDb(db);

    // Notify Discord Geral if configured
    if (db.batalhaoConfig && db.batalhaoConfig.webhookGeral) {
      const bSigla = db.batalhaoConfig.sigla || "18º BPM/M";
      const bNome = db.batalhaoConfig.nome || "18º Batalhão de Polícia Militar Metropolitano";
      const opContent = `🚨 **NOVA OPERAÇÃO POLICIAL DETECTADA NO SISTEMA**\n\n🏢 **Batalhão:** ${bNome} (${bSigla})\n🚔 **Operação:** ${newOp.nome}\n📅 **Início/Data:** ${newOp.data}\n📍 **Local:** ${newOp.local}\n⭐ **Comandante da Operação:** ${newOp.comandante}\n💬 **Descrição:** ${newOp.descricao}\n\n*Por determinação superior, policiamento tático acionado na área.*`;
      try {
        fetch(db.batalhaoConfig.webhookGeral, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: opContent })
        }).catch(err => console.error("Error sending operation to Discord:", err));
      } catch (e) {
        console.error(e);
      }
    }

    res.json(newOp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/operacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.operacoes.findIndex((op: any) => op.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Operação não encontrada.' });

    db.operacoes[idx] = { ...db.operacoes[idx], ...req.body };
    await saveDb(db);
    res.json(db.operacoes[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- Relatório de Serviço Operacional (RSO) CRUD ---

function generateNextRsoProtocol(rsos: any[]) {
  const currentYear = new Date().getFullYear();
  const prefix = `RSO-${currentYear}-`;

  const matchingRsos = rsos.filter((r: any) => r.protocolo && r.protocolo.startsWith(prefix));

  let maxNum = 0;
  matchingRsos.forEach((r: any) => {
    const parts = r.protocolo.split('-');
    if (parts.length >= 3) {
      const numPart = parseInt(parts[2], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  const nextNum = String(maxNum + 1).padStart(4, '0');
  return `${prefix}${nextNum}`;
}

// ==========================================
// EDITAL E RECRUTAMENTO PM ENDPOINTS
// ==========================================

async function notifyRecrutamentoDiscord(type: 'inscricao' | 'prova_finalizada' | 'candidato_aprovado' | 'candidato_convocado', data: any) {
  const db = await getDb();
  const config = db.batalhaoConfig || {};
  // Use custom webhookRecrutamento if configured, fallback to webhookGeral
  const webhookUrl = config.webhookRecrutamento || config.webhookGeral;
  
  if (!webhookUrl) {
    console.log(`[DISCORD SIMULATOR] Recrutamento webhook not configured. Notification type: ${type}`);
    return;
  }

  const bSigla = config.sigla || "18º BPM/M";
  const bNome = config.nome || "18º Batalhão de Polícia Militar Metropolitano";
  let opContent = "";

  if (type === 'inscricao') {
    opContent = `🚨 **NOVA INSCRIÇÃO DE RECRUTAMENTO MILITAR RECEBIDA**\n\n` +
                `🏢 **Batalhão:** ${bNome} (${bSigla})\n` +
                `📝 **Protocolo de Inscrição:** \`${data.protocolo}\`\n` +
                `👤 **Candidato:** ${data.nome}\n` +
                `🆔 **Discord ID:** <@${data.discordId}> (ID: \`${data.discordId}\`)\n` +
                `🎂 **Idade:** ${data.idade} anos\n` +
                `📍 **Cidade Natal:** ${data.cidade}\n` +
                `⏰ **Disponibilidade Habitual:** ${data.horario}\n` +
                `⭐ **Experiência Corporativa:** ${data.experiencia}\n` +
                `💬 **Motivação Regimental:** _"${data.motivacao}"_\n\n` +
                `_Status: Triagem Curricular Registrada no Sistema._`;
  } else if (type === 'prova_finalizada') {
    const statusEmoji = data.situacao === 'APROVADO' ? '🟢 APPROVED' : '🔴 REJECTED';
    opContent = `⏱️ **EXAME TEÓRICO MILITAR CONCLUÍDO AUTOMATICAMENTE**\n\n` +
                `🏢 **Batalhão:** ${bNome} (${bSigla})\n` +
                `📝 **Protocolo de Inscrição:** \`${data.protocolo}\`\n` +
                `👤 **Candidato:** ${data.nomeCompleto}\n` +
                `🎯 **Total de Acertos:** \`${data.totalAcertos} de 20\`\n` +
                `📊 **Percentual de Desempenho:** \`${data.percentual}%\`\n` +
                `🏁 **Situação Homologada:** **${statusEmoji}**\n\n` +
                `_Por determinação regimental, o candidato obteve a pontuação estipulada._`;
  } else if (type === 'candidato_aprovado') {
    opContent = `🏆 **HOMOLOGAÇÃO DE ADMISSÃO MILITAR CONVENIADA**\n\n` +
                `🏢 **Batalhão:** ${bNome}\n` +
                `📝 **Protocolo:** \`${data.protocolo}\`\n` +
                `👤 **Candidato:** ${data.nome}\n` +
                `🎖️ **Aviso Oficial:** O candidato foi legalmente **APROVADO E ADMITIDO** nas fileiras da corporação por outorga do Comando!`;
  } else if (type === 'candidato_convocado') {
    opContent = `📢 **CONVOCAÇÃO OFICIAL PARA ENTREVISTA PRESENCIAL**\n\n` +
                `🏢 **Batalhão:** ${bNome}\n` +
                `📝 **Protocolo:** \`${data.protocolo}\`\n` +
                `👤 **Candidato:** ${data.nome}\n` +
                `📅 **Data/Instrução:** O candidato está formalmente convocado para assembleia e entrevista militar.`;
  }

  try {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: opContent })
    }).catch(err => console.error("Error sending recruitment hook to Discord:", err));
  } catch (e) {
    console.error(e);
  }
}

// 1. Configs & Editais Get
app.get('/api/recrutamento/config', async (req, res) => {
  try {
    const db = await getDb();
    const activeEdital = db.editais && db.editais.length > 0 ? db.editais[0] : null;
    res.json({
      batalhao: db.batalhaoConfig,
      edital: activeEdital
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update active edital parameters
app.put('/api/recrutamento/config', async (req, res) => {
  try {
    const db = await getDb();
    // Only Commander/Subcommander can execute this
    const userRole = req.query.role || 'Oficial';
    if (userRole !== 'Comandante' && userRole !== 'Subcomandante') {
      return res.status(403).json({ error: 'Apenas os Oficiais do Alto Comando possuem outorga tática para parametrizar o edital.' });
    }

    if (!db.editais) db.editais = [];
    if (db.editais.length === 0) {
      db.editais.push({ id: 'edital-1', numero: '18BPM-001/2026', titulo: 'Concurso Público de Admissão', requisitos: [], etapas: [], cronograma: [], criteriosAprovacao: '', observacoes: '', ativo: true });
    }
    
    db.editais[0] = { ...db.editais[0], ...req.body };
    await saveDb(db);
    res.json({ success: true, edital: db.editais[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Banco de Questões (CRUD)
app.get('/api/recrutamento/questoes', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.questoes || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recrutamento/questoes', async (req, res) => {
  try {
    const db = await getDb();
    const newQuestao = {
      id: 'q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      ...req.body
    };
    if (!db.questoes) db.questoes = [];
    db.questoes.push(newQuestao);
    await saveDb(db);
    res.json(newQuestao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/recrutamento/questoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.questoes.findIndex((q: any) => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Questão não encontrada no repositório.' });
    
    db.questoes[idx] = { ...db.questoes[idx], ...req.body };
    await saveDb(db);
    res.json(db.questoes[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/recrutamento/questoes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.questoes = db.questoes.filter((q: any) => q.id !== id);
    await saveDb(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Candidate Inscriptions (Inscrições)
app.post('/api/recrutamento/inscricao', async (req, res) => {
  try {
    const db = await getDb();
    const inscricoes = db.inscricoes || [];
    
    // Check if Discord ID is already signed up in this edital
    const discordId = req.body.discordId;
    const jaInscrito = inscricoes.find((ins: any) => ins.discordId === discordId);
    if (jaInscrito) {
      return res.status(400).json({ error: `Identificador Discord informado já encontra-se vinculado à inscrição protocolo ${jaInscrito.protocolo}.` });
    }

    const year = new Date().getFullYear();
    const count = inscricoes.length;
    const nextNum = String(count + 1).padStart(4, '0');
    const protocolo = `INS-${year}-${nextNum}`;

    const newInscricao = {
      id: 'ins-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      protocolo,
      nome: req.body.nome,
      discordId: req.body.discordId,
      idade: parseInt(req.body.idade) || 18,
      cidade: req.body.cidade,
      horario: req.body.horario,
      experiencia: req.body.experiencia,
      motivacao: req.body.motivacao,
      status: 'Pendente', // Pendente, Prova_Ativa, Aprovado, Reprovado, Convocado
      dataInscricao: new Date().toISOString()
    };

    db.inscricoes.push(newInscricao);
    await saveDb(db);

    // Notify Discord webhook
    await notifyRecrutamentoDiscord('inscricao', newInscricao);

    res.json(newInscricao);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recrutamento/inscricoes', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.inscricoes || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recrutamento/inscricao/:protocolo', async (req, res) => {
  try {
    const { protocolo } = req.params;
    const db = await getDb();
    const ins = db.inscricoes.find((i: any) => i.protocolo === protocolo || i.discordId === protocolo);
    if (!ins) return res.status(404).json({ error: 'Inscrição não encontrada no sistema de triagem.' });
    res.json(ins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/recrutamento/inscricao/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.inscricoes.findIndex((i: any) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Inscrição não encontrada.' });

    const prevStatus = db.inscricoes[idx].status;
    const newStatus = req.body.status;
    db.inscricoes[idx] = { ...db.inscricoes[idx], ...req.body };
    await saveDb(db);

    const data = db.inscricoes[idx];
    // Trigger conditional Discord announcements on status upgrade
    if (prevStatus !== newStatus) {
      if (newStatus === 'Aprovado') {
        await notifyRecrutamentoDiscord('candidato_aprovado', data);
      } else if (newStatus === 'Convocado') {
        await notifyRecrutamentoDiscord('candidato_convocado', data);
      }
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Prova Online Start and Finish
app.post('/api/recrutamento/prova/iniciar', async (req, res) => {
  try {
    const { identificador } = req.body; // Protocolo or Discord ID
    const db = await getDb();
    
    // Check if registered candidate
    const candidate = db.inscricoes.find((i: any) => i.protocolo === identificador || i.discordId === identificador);
    if (!candidate) {
      return res.status(404).json({ error: 'Erro de validação: Candidato não localizado em nossa base de inscritos. Inscreva-se primeiro para poder responder ao teste.' });
    }

    // Check if already completed exam
    const jaFez = db.resultados.find((r: any) => r.protocolo === candidate.protocolo);
    if (jaFez) {
      return res.status(400).json({ error: `Identificação bloqueada: O candidato correspondente já realizou o exame com o resultado: ${jaFez.situacao} (${jaFez.percentual}%). Não são permitidas tentativas suplementares.` });
    }

    // Shuffle questions, pick 20, and strip answers to block cheat console hacks!
    const pool = db.questoes || [];
    if (pool.length === 0) {
      return res.status(400).json({ error: 'Atenção administrativa: O banco de dados do Batalhão de questões está vazio. Por favor, configure as questões antes no painel do Comando.' });
    }

    // Sort randomly and slice to max 20 questions
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 20);

    // Strip answers
    const strippedQuestions = shuffled.map((q: any) => ({
      id: q.id,
      categoria: q.categoria,
      pergunta: q.pergunta,
      alternativas: q.alternativas
    }));

    res.json({
      candidato: {
        id: candidate.id,
        nome: candidate.nome,
        protocolo: candidate.protocolo,
        discordId: candidate.discordId
      },
      questoes: strippedQuestions,
      limiteMinutos: db.editais && db.editais[0]?.tempoLimiteProvas ? parseInt(db.editais[0].tempoLimiteProvas) : 30
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recrutamento/prova/finalizar', async (req, res) => {
  try {
    const { protocolo, respostas } = req.body;
    const db = await getDb();

    const candidate = db.inscricoes.find((i: any) => i.protocolo === protocolo);
    if (!candidate) {
      return res.status(404).json({ error: 'Inscrição inviabilizada ou não localizada.' });
    }

    // Double check if already submitted
    const jaFez = db.resultados.find((r: any) => r.protocolo === protocolo);
    if (jaFez) {
      return res.status(400).json({ error: 'Envio rejeitado: Exame já corrigido e armazenado anteriormente.' });
    }

    const pool = db.questoes || [];
    let correctCount = 0;
    const totalQuestions = 20; // Correct standard length representational limit

    // Gather questions that the candidate was submitted
    const answersAnalysis = Object.keys(respostas).map(qId => {
      const dbQ = pool.find((q: any) => q.id === qId);
      if (!dbQ) return { qId, userAns: respostas[qId], correct: false };
      const isCorrect = dbQ.correta === respostas[qId];
      if (isCorrect) correctCount++;
      return {
        qId,
        pergunta: dbQ.pergunta,
        userAns: respostas[qId],
        correctAns: dbQ.correta,
        correct: isCorrect
      };
    });

    // In case user answers less than 20 questions, count correct relative to 20 total
    const percentage = (correctCount / totalQuestions) * 100;
    const approvalThreshold = 70;
    const situacao = percentage >= approvalThreshold ? 'APROVADO' : 'REPROVADO';

    const newResult = {
      id: 'res-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      protocolo,
      nomeCompleto: candidate.nome,
      discordId: candidate.discordId,
      totalAcertos: correctCount,
      percentual: Math.round(percentage),
      situacao,
      analiseRespostas: answersAnalysis,
      dataConclusao: new Date().toISOString()
    };

    if (!db.resultados) db.resultados = [];
    db.resultados.push(newResult);

    // Update candidate state in database
    const insIdx = db.inscricoes.findIndex((i: any) => i.protocolo === protocolo);
    if (insIdx !== -1) {
      db.inscricoes[insIdx].status = situacao === 'APROVADO' ? 'Aprovado Prova' : 'Reprovado Prova';
    }

    await saveDb(db);

    // Blast Discord Notification
    await notifyRecrutamentoDiscord('prova_finalizada', newResult);

    res.json(newResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recrutamento/resultados', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.resultados || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recrutamento/resultado/:protocolo', async (req, res) => {
  try {
    const { protocolo } = req.params;
    const db = await getDb();
    const result = db.resultados.find((r: any) => r.protocolo === protocolo || r.discordId === protocolo);
    if (!result) return res.status(404).json({ error: 'Gabarito e Resultado do candidato indisponível no momento.' });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recrutamento/convocacoes', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.convocacoes || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/recrutamento/convocacoes', async (req, res) => {
  try {
    const db = await getDb();
    const newConv = {
      id: 'conv-' + Date.now(),
      ...req.body,
      dataConvocacao: new Date().toISOString()
    };
    if (!db.convocacoes) db.convocacoes = [];
    db.convocacoes.push(newConv);
    await saveDb(db);
    res.json(newConv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function notifyDiscord(rso: any) {
  const db = await getDb();
  const webhookUrl = (db.batalhaoConfig && db.batalhaoConfig.webhookRso) || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("Discord Webhook is not configured in settings or .env. Logging simulation...");
    return;
  }

  // Format message exactly as exemplified
  const content = `🚔 **Novo RSO Recebido**\n\n**Policial:** ${rso.nome_policial}\n**RG:** ${rso.rg}\n**Viatura:** ${rso.prefixo_viatura}\n**Setor:** ${rso.setor}\n**Abordagens:** ${rso.abordagens}\n**Prisões:** ${rso.prisoes}\n\n**Protocolo:**\n${rso.protocolo}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    console.log("Notified Discord Webhook successfully.");
  } catch (err) {
    console.error("Failed to post to Discord Webhook:", err);
  }
}

app.get('/api/rso', async (req, res) => {
  try {
    const db = await getDb();
    res.json(db.rsos || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rso/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const rso = db.rsos?.find((r: any) => r.id === id);
    if (!rso) return res.status(404).json({ error: 'RSO não encontrado.' });
    res.json(rso);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rso', async (req, res) => {
  try {
    const db = await getDb();
    const rsos = db.rsos || [];
    const protocolo = generateNextRsoProtocol(rsos);

    const newRso = {
      id: 'rso-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      protocolo,
      data_envio: new Date().toISOString(),
      ...req.body
    };

    rsos.unshift(newRso);
    db.rsos = rsos;
    await saveDb(db);

    // Write log in the system
    await writeAuditLog(
      `${newRso.patente} ${newRso.nome_policial}`,
      `Enviou Relatório de Serviço Operacional (RSO) sob Protocolo: ${newRso.protocolo} (Viatura: ${newRso.prefixo_viatura}, Setor: ${newRso.setor})`,
      'Criar'
    );

    // Notify Discord Channel
    await notifyDiscord(newRso);

    res.status(201).json(newRso);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rso/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.rsos.findIndex((r: any) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'RSO não encontrado.' });

    db.rsos[idx] = { ...db.rsos[idx], ...req.body };
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante',
      `Editou o Relatório de Serviço Operacional (RSO) [${db.rsos[idx].protocolo}] de ${db.rsos[idx].nome_policial}`,
      'Editar'
    );

    res.json(db.rsos[idx]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/rso/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const idx = db.rsos.findIndex((r: any) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'RSO não encontrado.' });

    const deleted = db.rsos[idx];
    db.rsos.splice(idx, 1);
    await saveDb(db);

    await writeAuditLog(
      req.query.user as string || 'Comandante',
      `Excluiu o Relatório de Serviço Operacional (RSO) [${deleted.protocolo}] de ${deleted.nome_policial}`,
      'Sistema'
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- Gemini IA Document Generator Route ---

app.post('/api/gemini/generate-document', async (req, res) => {
  try {
    const { prompt, actor } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'É necessário fornecer instruções para a Inteligência Artificial.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Chave de API do Gemini não configurada no servidor. Por favor, adicione GEMINI_API_KEY nos Secrets.' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const db = await getDb();
    const registeredPoliciais = db.policiais || [];
    const policiaisListFormatted = registeredPoliciais.map((p: any) =>
      `- Policial: ${p.patente} ${p.nome} (RG: ${p.rg}, Unidade: 18º BPM/M, Cargo: ${p.cargo || 'Radiopatrulha'}, Situação: ${p.situacao}, Data de Ingresso: ${p.dataIngresso || '2020-01-01'})`
    ).join('\n');

    const systemInstruction = `
Você é o Assistente Jurídico-Administrativo oficial do 18º Batalhão de Polícia Militar Metropolitano (18º BPM/M) da Polícia Militar do Estado de São Paulo (PMESP), conhecido como o "Batalhão da Zona Norte".
Sua tarefa é redigir documentos oficiais militares em língua portuguesa (Brasil) com extremo formalismo administrativo militar paulista, terminologias regulamentares corretas do meio militar brasileiro e formatação impecável estruturada em Markdown.

MEMÓRIA CONTEXTUAL / INTEGRAÇÃO DE SQUAD:
Aqui está a lista oficial com TODO o efetivo militar de policiais atualmente cadastrados e ativos no banco de dados do 18º BPM/M. Ao ler nomes parciais (ex: "Felipe Silva", "Soldado Lucas", "policial João Santos"), você DEVE cruzar essas informações com esta lista abaixo para identificar automaticamente o Nome Completo correto, RG real e a patente atual da praça ou oficial para autopreencher todos os campos do documento com máxima coerência real:
${policiaisListFormatted}

REQUISITOS DO MODO ASSISTENTE (INFORMAÇÕES INCOMPLETAS):
Se as instruções do usuário forem muito vagas ou incompletas para redigir adequadamente um documento administrativo militar real legítimo (ex: pedir apenas "Promover Felipe Silva", "Punir soldado Lucas" ou "Instaurar sindicância", sem que você possa deduzir ou sem conter a nova patente desejada, a infração cometida para uma punição, a data/locais exatos para uma ordem de serviço, etc.), você DEVE acionar o MODO ASSISTENTE.
Para isso, retorne um objeto JSON contendo APENAS a chave "missingInfoRequest" preenchida com uma pergunta formal, direta e prestativa no tom da instituição militar solicitando exatamente quais variáveis cruciais estão faltando para que você possa redigir o documento completo. No modo assistente, deixe as chaves "documentType", "categoria", "titulo" e "conteudo" vazias ou omitidas.

REQUISITOS DO MODO DE GERAÇÃO (INFORMAÇÕES COMPLETAS):
Se as informações fornecidas no prompt já contiverem os dados necessários (ou se o usuário já forneceu as respostas para as perguntas anteriores), realize a geração final do documento. Você NÃO deve retornar a chave "missingInfoRequest". Em vez disso, preencha:
1. "documentType": Tipo detalhado oficial (ex: "Portaria de Promoção", "Elogio Individual", "Sindicância", "Ordem de Serviço", "Relatório de Ocorrência", "Boletim Interno", "Doutrina Operacional", "Nota de Advertência")
2. "categoria": A categoria exata do documento dentre os seguintes 5 valores obrigatórios: "ADMINISTRATIVO", "RECURSOS HUMANOS", "OPERACIONAL", "CORREGEDORIA" ou "COMUNICAÇÃO"
3. "titulo": Título oficial chamativo em letras maiúsculas (ex: "PORTARIA DE PROMOÇÃO POR DESTAQUE OPERACIONAL Nº PMESP-18BPMM-2026-###")
4. "conteudo": O corpo do documento escrito de forma extremamente formal em Markdown (com grandes cabeçalhos oficiais da PMESP/18º BPM/M, preâmbulo solene invocando as competências do Comando, justificativa ou enquadramento com base em regulamentos do batalhão ou leis administrativas, os artigos, conclusões formais, termos de encerramento e indicação de assinaturas eletrônicas regidas pelo SEI)
5. "proposedAction": (OPCIONAL - Apenas para Promoções, Rebaixamentos ou Advertências) Retorne este objeto para atualizar a ficha funcional do militar no sistema:
   - "actionType": Um destes valores literais: "PROMOTION", "DEMOTION" ou "WARNING"
   - "targetName": Nome pesquisável do policial identificado no texto do prompt
   - "targetRg": RG correspondente do policial
   - "newValue": A nova patente recomendada (ex: "Cb PM", "Sd PM", "1º Sgt PM", "Cap PM") se for promoção/rebaixamento.
   - "reason": Breve justificativa baseada nos fatos descritos.

Exemplo de tom e estrutura do campo "conteudo":
# POLÍCIA MILITAR DO ESTADO DE SÃO PAULO
## 18º BATALHÃO DE POLÍCIA MILITAR METROPOLITANO - "SENTINELA DA ZONA NORTE"

### [TIPO DE DOCUMENTO] Nº PMESP-18BPMM-2026-###

O COMANDANTE DO DEZOITO BATALHÃO DE POLÍCIA MILITAR METROPOLITANO, no uso de suas atribuições regulamentares previstas na legislação corporativa paulista,

RESOLVE:
Artigo 1º - [Artigo Principal]...
Artigo 2º - Diga que as assinaturas eletrônicas estão integradas sob autenticação SEI PMESP.

Quartel em São Paulo, SP, [Data de Emissão].

Siga exatamente o esquema JSON solicitado. Nunca responda em formato diferente de um objeto JSON válido.
`;

    const chatResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Instrução do Usuário: ${prompt}\nSolicitante da Ação Militar no Sistema: ${actor || 'Comandante Geral'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missingInfoRequest: { type: Type.STRING, description: "Mensagem solicitando dados adicionas se o prompt original for incompleto. Caso contrário, retorne vazio ou omita." },
            documentType: { type: Type.STRING, description: "Tipo de documento formal ex. Portaria, Sindicância, Elogio" },
            categoria: { type: Type.STRING, description: "Categoria do documento: ADMINISTRATIVO, RECURSOS HUMANOS, OPERACIONAL, COMUNICAÇÃO ou CORREGEDORIA" },
            titulo: { type: Type.STRING, description: "Título oficial em maiúsculas" },
            conteudo: { type: Type.STRING, description: "Conteúdo completo formatado em Markdown do documento oficial paulista" },
            proposedAction: {
              type: Type.OBJECT,
              properties: {
                actionType: { type: Type.STRING, description: "PROMOTION, DEMOTION, WARNING" },
                targetName: { type: Type.STRING },
                targetRg: { type: Type.STRING },
                newValue: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["actionType", "targetName"]
            }
          }
        }
      }
    });

    const text = chatResponse.text;
    if (!text) {
      throw new Error('Retorno vazio do modelo do Gemini.');
    }

    const parsedResponse = JSON.parse(text.trim());

    // Auto-apply proposed military actions in the simulated database!
    if (parsedResponse.proposedAction) {
      const action = parsedResponse.proposedAction;
      const db = await getDb();
      let applied = false;
      let targetPolicial = null;

      // Try searching by name or RG
      const queryName = (action.targetName || '').toLowerCase().trim();
      const queryRg = (action.targetRg || '').toLowerCase().trim();

      const pIndex = db.policiais.findIndex((p: any) => {
        if (!p) return false;
        const pRg = String(p.rg || '').toLowerCase();
        const pNome = String(p.nome || '').toLowerCase();

        if (queryRg && pRg.includes(queryRg)) return true;
        if (queryName && pNome.includes(queryName)) return true;
        // Split name search
        const parts = queryName.split(' ');
        if (parts.length > 0 && parts[0] && pNome.includes(parts[0])) {
          return true;
        }
        return false;
      });

      if (pIndex !== -1) {
        targetPolicial = db.policiais[pIndex];
        const oldRank = targetPolicial.patente;

        if (action.actionType === 'PROMOTION' && action.newValue) {
          targetPolicial.patente = action.newValue;
          applied = true;
          await writeAuditLog(
            'INTELIGÊNCIA ARTIFICIAL (GEMINI)',
            `PROMOÇÃO AUTOMÁTICA EFETUADA: ${targetPolicial.nome} promovido de ${oldRank} para ${action.newValue}.`,
            'Sistema'
          );
        } else if (action.actionType === 'DEMOTION' && action.newValue) {
          targetPolicial.patente = action.newValue;
          applied = true;
          await writeAuditLog(
            'INTELIGÊNCIA ARTIFICIAL (GEMINI)',
            `REBAIXAMENTO AUTOMÁTICO EFETUADO: ${targetPolicial.nome} rebaixado de ${oldRank} para ${action.newValue}.`,
            'Sistema'
          );
        } else if (action.actionType === 'WARNING') {
          applied = true;
          await writeAuditLog(
            'INTELIGÊNCIA ARTIFICIAL (GEMINI)',
            `ADVERTÊNCIA OFICIAL REGISTRADA NA FICHA de ${targetPolicial.nome}: ${action.reason || 'Sancionado via Portaria Disciplinar.'}`,
            'Sistema'
          );
        }
        
        if (applied) {
          await saveDb(db);
          parsedResponse.systemActionApplied = {
            success: true,
            message: `Ação operacional automatizada aplicada com sucesso! Ficha de ${targetPolicial.nome} atualizada no sistema de banco de dados do 18º BPM/M.`,
            policial: targetPolicial
          };
        }
      } else {
        parsedResponse.systemActionApplied = {
          success: false,
          message: `Policial '${action.targetName}' não pôde ser localizado automaticamente no cadastro para autoprocessamento da ficha funcional.`
        };
      }
    }

    res.json(parsedResponse);
  } catch (error: any) {
    console.error('Gemini processing error:', error);
    res.status(500).json({ error: error.message || 'Erro durante processamento da Inteligência Artificial' });
  }
});


// Start server setting up Vite middleware in Dev & Static serving in Prod
async function startServer() {
  await getDb(); // Ensure db is initialised first

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
