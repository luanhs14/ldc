import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ─── Usuário admin ────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { usuario: 'admin' },
    update: {
      nome: 'Administrador',
      senhaHash,
      role: 'ADMIN',
    },
    create: {
      nome: 'Administrador',
      usuario: 'admin',
      senhaHash,
      role: 'ADMIN',
    },
  });

  // ─── Tipos de Elemento (DC-97) ────────────────────────────────────────
  const elementoTipos = [
    { codigo: 'ESTRUTURA',    nome: 'Estrutura',          vidaUtilPadraoAnos: 50 },
    { codigo: 'TELHADO',      nome: 'Telhado',            vidaUtilPadraoAnos: 20 },
    { codigo: 'ELETRICA',     nome: 'Sistema Elétrico',   vidaUtilPadraoAnos: 25 },
    { codigo: 'HIDRAULICA',   nome: 'Hidráulica',         vidaUtilPadraoAnos: 30 },
    { codigo: 'AUDIO_VIDEO',  nome: 'Áudio e Vídeo',      vidaUtilPadraoAnos: 10 },
    { codigo: 'CLIMATIZACAO', nome: 'Climatização',       vidaUtilPadraoAnos: 15 },
    { codigo: 'ESQUADRIAS',   nome: 'Esquadrias',         vidaUtilPadraoAnos: 20 },
    { codigo: 'ILUMINACAO',   nome: 'Iluminação',         vidaUtilPadraoAnos: 15 },
    { codigo: 'SEGURANCA',    nome: 'Segurança',          vidaUtilPadraoAnos: 10 },
    { codigo: 'INTERNET',     nome: 'Internet/Rede',      vidaUtilPadraoAnos: 8  },
    { codigo: 'JARDINS',      nome: 'Jardins',            vidaUtilPadraoAnos: null },
    { codigo: 'EXTINTORES',   nome: 'Extintores',         vidaUtilPadraoAnos: 5  },
    { codigo: 'OUTRO',        nome: 'Outro',              vidaUtilPadraoAnos: null },
  ];

  for (const tipo of elementoTipos) {
    await prisma.elementoTipo.upsert({
      where: { codigo: tipo.codigo },
      update: { nome: tipo.nome, vidaUtilPadraoAnos: tipo.vidaUtilPadraoAnos },
      create: tipo,
    });
  }

  // ─── EPIs (DC-82) ─────────────────────────────────────────────────────
  const epis = [
    { codigo: 'CAPACETE',          nome: 'Capacete' },
    { codigo: 'OCULOS',            nome: 'Óculos de proteção' },
    { codigo: 'LUVAS',             nome: 'Luvas' },
    { codigo: 'PROTETOR_AUDITIVO', nome: 'Protetor auditivo' },
    { codigo: 'MASCARA',           nome: 'Máscara' },
    { codigo: 'CALCADO_PROTECAO',  nome: 'Calçado de proteção' },
    { codigo: 'COLETE',            nome: 'Colete' },
    { codigo: 'OUTRO',             nome: 'Outro' },
  ];

  for (const epi of epis) {
    await prisma.epi.upsert({
      where: { codigo: epi.codigo },
      update: { nome: epi.nome },
      create: epi,
    });
  }

  // ─── Períodos de manutenção ───────────────────────────────────────────
  const periodos = [
    {
      codigo: 'PRE_CELEBRACAO',
      nome: 'Manutenção Pré-Celebração',
      mesInicio: 2,
      mesFim: 3,
      descricao: 'Manutenção realizada entre fevereiro e março, antes das celebrações.',
    },
    {
      codigo: 'POS_CONGRESSO',
      nome: 'Manutenção Pós-Congresso',
      mesInicio: 9,
      mesFim: 10,
      descricao: 'Manutenção realizada entre setembro e outubro, após o congresso.',
    },
    {
      codigo: 'REVISAO_FINANCEIRA',
      nome: 'Revisão Financeira',
      mesInicio: 6,
      mesFim: 6,
      descricao: 'Revisão anual de gastos e orçamento em junho.',
    },
  ];

  for (const periodo of periodos) {
    await prisma.periodoManutencao.upsert({
      where: { codigo: periodo.codigo },
      update: {},
      create: periodo,
    });
  }

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
