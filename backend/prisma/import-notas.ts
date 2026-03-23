import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertPessoa(
  nome: string,
  funcao: string,
  autorizadoAltoRisco = false,
  observacoesAutorizacao?: string,
) {
  const existing = await prisma.pessoa.findFirst({ where: { nome } });
  if (existing) return existing;
  return prisma.pessoa.create({
    data: {
      nome,
      autorizadoAltoRisco,
      observacoesAutorizacao,
      funcoes: { create: { funcao } },
    },
  });
}

async function upsertResponsavel(salaoId: string, pessoaId: string, papel: string) {
  return prisma.salaoResponsavel.upsert({
    where: { salaoId_pessoaId: { salaoId, pessoaId } },
    update: {},
    create: { salaoId, pessoaId, papel },
  });
}

async function main() {
  console.log('Importando dados das notas...\n');

  // ─── SALÕES ──────────────────────────────────────────────────────────────
  const [s4990, s2115, s1338, s1100, s1822, s10285, s9027] = await Promise.all([
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA4990' },
      update: {},
      create: { nome: 'Salão BRA4990', codigoBRA: 'BRA4990' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA2115' },
      update: {},
      create: { nome: 'Salão BRA2115', codigoBRA: 'BRA2115' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA1338' },
      update: {},
      create: { nome: 'Salão BRA1338', codigoBRA: 'BRA1338' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA1100' },
      update: {},
      create: { nome: 'Salão BRA1100', codigoBRA: 'BRA1100' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA1822' },
      update: {},
      create: { nome: 'Salão BRA1822', codigoBRA: 'BRA1822', observacoes: 'Em reforma geral' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA10285' },
      update: {},
      create: { nome: 'Salão BRA10285', codigoBRA: 'BRA10285' },
    }),
    prisma.salao.upsert({
      where: { codigoBRA: 'BRA9027' },
      update: {},
      create: { nome: 'Salão BRA9027', codigoBRA: 'BRA9027' },
    }),
  ]);
  console.log('✓ Salões criados: BRA4990, BRA2115, BRA1338, BRA1100, BRA1822, BRA10285, BRA9027');

  // ─── PESSOAS ─────────────────────────────────────────────────────────────
  // Equipe LDC (visitam os salões)
  const luan     = await upsertPessoa('Luan', 'LDC');
  const rafael   = await upsertPessoa('Rafael', 'LDC');
  const danilo   = await upsertPessoa('Danilo', 'LDC');

  // Responsáveis locais de manutenção
  const valdecyr    = await upsertPessoa('Valdecyr', 'RESPONSAVEL_MANUTENCAO');
  const francisco   = await upsertPessoa('Francisco', 'VOLUNTARIO');
  const jurandir    = await upsertPessoa('Jurandir', 'RESPONSAVEL_MANUTENCAO');
  const alexandre   = await upsertPessoa('Alexandre', 'RESPONSAVEL_MANUTENCAO');
  const dileno      = await upsertPessoa('Dileno', 'RESPONSAVEL_MANUTENCAO');
  const luizMedronho = await upsertPessoa('Luiz Medronho', 'RESPONSAVEL_MANUTENCAO');
  const lucas       = await upsertPessoa('Lucas', 'RESPONSAVEL_MANUTENCAO');

  // Outros envolvidos
  await upsertPessoa('Leonardo', 'TM');   // ex-TM BRA4990, vai passar relatório da mesa de som
  await upsertPessoa('Fábio Assis', 'TM'); // antigo TM BRA4990
  await upsertPessoa('Edy', 'VOLUNTARIO'); // áudio e vídeo BRA1338
  await upsertPessoa('Zé Pereira', 'OUTRO'); // indicou irmão para calha BRA2115

  // Autorizados para trabalhos em altura / ar-condicionado – BRA10285
  const tales  = await upsertPessoa('Tales', 'VOLUNTARIO', true,
    'Treinamento/experiência profissional em trabalhos em altura e ar-condicionado (BRA10285)');
  const felix  = await upsertPessoa('Félix', 'VOLUNTARIO', true,
    'Treinamento/experiência profissional em trabalhos em altura e ar-condicionado (BRA10285)');

  // Autorizados para trabalhos em altura / ar-condicionado – BRA9027
  const roberto  = await upsertPessoa('Roberto', 'VOLUNTARIO', true,
    'Treinamento/experiência profissional em trabalhos em altura e ar-condicionado (BRA9027)');
  const rodrigo  = await upsertPessoa('Rodrigo', 'VOLUNTARIO', true,
    'Treinamento/experiência profissional em trabalhos em altura e ar-condicionado (BRA9027)');
  const reinaldo = await upsertPessoa('Reinaldo', 'VOLUNTARIO', true,
    'Treinamento/experiência profissional em trabalhos em altura e ar-condicionado (BRA9027)');

  console.log('✓ Pessoas criadas: Luan, Rafael, Danilo, Valdecyr, Francisco, Jurandir, Alexandre, Dileno,');
  console.log('                   Luiz Medronho, Lucas, Leonardo, Fábio Assis, Edy, Zé Pereira,');
  console.log('                   Tales, Félix, Roberto, Rodrigo, Reinaldo');

  // ─── RESPONSÁVEIS DOS SALÕES ─────────────────────────────────────────────
  await Promise.all([
    upsertResponsavel(s4990.id,  valdecyr.id,    'Responsável de Manutenção'),
    upsertResponsavel(s2115.id,  jurandir.id,    'Responsável de Manutenção'),
    upsertResponsavel(s1338.id,  alexandre.id,   'Responsável de Manutenção'),
    upsertResponsavel(s1100.id,  dileno.id,      'Responsável de Manutenção'),
    upsertResponsavel(s10285.id, luizMedronho.id,'Responsável de Manutenção'),
    upsertResponsavel(s9027.id,  lucas.id,       'Responsável de Manutenção'),
  ]);
  console.log('✓ Responsáveis vinculados aos salões');

  // ─── VISITAS ─────────────────────────────────────────────────────────────

  // BRA4990 — visita de manutenção em 28/02/2026
  const visita4990 = await prisma.visita.create({
    data: {
      salaoId: s4990.id,
      tipo: 'MANUTENCAO',
      data: new Date('2026-02-28'),
      visitanteId: luan.id,
      visitanteNome: 'Rafael, Luan e Danilo',
      relatorio:
        'Verificação de pendências junto ao responsável Valdecyr. ' +
        'Combinado uso de mão de obra local (Valdecyr e Francisco) após manutenção pré celebração. ' +
        'Fichas do TM a serem feitas em março. ' +
        'Pontos tratados: Rampa (aguardar autorização LDC), Mesa de Som (aguardar relatório do irmão Leonardo / Fábio Assis), ' +
        'Motor do pedestal (indicar para os irmãos), Pintura da parede da tribuna (verificar cores permitidas).',
    },
  });

  // BRA10285 — reunião em 06/02/2026
  const visita10285 = await prisma.visita.create({
    data: {
      salaoId: s10285.id,
      tipo: 'VISITA_TM',
      data: new Date('2026-02-06'),
      visitanteId: luan.id,
      visitanteNome: 'Luan',
      relatorio:
        'Reunião com Luiz Medronho. Esclarecidos todos os pontos pendentes. ' +
        'Luiz é novo na função e precisa de apoio do zero. ' +
        'Irmãos locais com treinamento/experiência para trabalhos em altura e ar-condicionado: Tales e Félix.',
    },
  });

  // BRA9027 — VTM em 07/02/2026
  const visita9027 = await prisma.visita.create({
    data: {
      salaoId: s9027.id,
      tipo: 'VISITA_TM',
      data: new Date('2026-02-07'),
      visitanteId: luan.id,
      visitanteNome: 'Luan',
      relatorio:
        'VTM com Lucas, Roberto e Rodrigo. Esclarecidos todos os pontos pendentes. ' +
        'Finalizar VTM no Builder. ' +
        'Irmãos locais com treinamento/experiência para trabalhos em altura e ar-condicionado: Roberto, Rodrigo e Reinaldo.',
    },
  });

  console.log('✓ Visitas criadas: BRA4990 (28/02), BRA10285 (06/02), BRA9027 (07/02)');

  // ─── PENDÊNCIAS ──────────────────────────────────────────────────────────

  // BRA4990 — pendências levantadas na visita de 28/02
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s4990.id,
        visitaId: visita4990.id,
        descricao: 'Rampa: aguardar autorização do LDC para execução',
        prioridade: 'MEDIA',
        responsavel: 'Valdecyr',
        status: 'EM_ANDAMENTO',
      },
      {
        salaoId: s4990.id,
        visitaId: visita4990.id,
        descricao: 'Mesa de Som: aguardar relatório do irmão Leonardo (ex-TM Fábio Assis vai repassar informações)',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
      },
      {
        salaoId: s4990.id,
        visitaId: visita4990.id,
        descricao: 'Motor do pedestal: indicar motor adequado para os irmãos',
        prioridade: 'BAIXA',
        responsavel: 'Valdecyr',
        status: 'PENDENTE',
      },
      {
        salaoId: s4990.id,
        visitaId: visita4990.id,
        descricao: 'Pintura da parede da tribuna: verificar cores permitidas e passar orientação ao Valdecyr',
        prioridade: 'BAIXA',
        responsavel: 'Valdecyr',
        status: 'PENDENTE',
      },
    ],
  });

  // BRA2115
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s2115.id,
        descricao:
          'Serviço nas calhas: Jurandir solicitou, sem mão de obra local. ' +
          'Zé Pereira indicou um irmão — agendar visita com Jurandir para definir o dia',
        prioridade: 'ALTA',
        responsavel: 'Jurandir',
        status: 'PENDENTE',
      },
    ],
  });

  // BRA1338
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s1338.id,
        descricao: 'Finalizar serviço de áudio e vídeo com o irmão Edy (solicitado por Alexandre e Rafael)',
        prioridade: 'MEDIA',
        responsavel: 'Alexandre',
        status: 'PENDENTE',
      },
      {
        salaoId: s1338.id,
        descricao: "Caixa d'água: situação apertada, necessita avaliação e intervenção",
        prioridade: 'ALTA',
        risco: 'MEDIO',
        status: 'PENDENTE',
      },
      {
        salaoId: s1338.id,
        descricao: 'Ar-condicionado no telhado: necessita inspeção e avaliação de risco',
        prioridade: 'ALTA',
        risco: 'ALTO',
        status: 'PENDENTE',
      },
      {
        salaoId: s1338.id,
        descricao: 'Banheiro: necessita reforma',
        prioridade: 'MEDIA',
        responsavel: 'Alexandre',
        status: 'PENDENTE',
      },
    ],
  });

  // BRA1100
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s1100.id,
        descricao:
          'Dileno está com dificuldade de apoio dos irmãos para manutenção — verificar situação e reforçar suporte',
        prioridade: 'ALTA',
        responsavel: 'Dileno',
        status: 'PENDENTE',
      },
    ],
  });

  // BRA10285 — pendências da visita de 06/02
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: 'Vazamento/goteiras no telhado — ponto crítico de atenção',
        prioridade: 'ALTA',
        risco: 'MEDIO',
        responsavel: 'Luiz Medronho',
        status: 'PENDENTE',
      },
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: 'Inspeção de calhas e beirais (fichas TM — necessita irmãos locais treinados)',
        prioridade: 'ALTA',
        risco: 'ALTO',
        status: 'PENDENTE',
      },
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: 'Inspeção da estrutura do telhado (fichas TM)',
        prioridade: 'ALTA',
        risco: 'ALTO',
        status: 'PENDENTE',
      },
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: 'Inspeção do forro (fichas TM)',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
      },
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: 'Inspeção das telhas (fichas TM)',
        prioridade: 'ALTA',
        status: 'PENDENTE',
      },
      {
        salaoId: s10285.id,
        visitaId: visita10285.id,
        descricao: "Inspeção da caixa d'água (fichas TM)",
        prioridade: 'MEDIA',
        status: 'PENDENTE',
      },
    ],
  });

  // BRA9027 — pendências da VTM de 07/02
  await prisma.pendencia.createMany({
    data: [
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: 'Vazamento/goteiras no telhado — ponto crítico de atenção',
        prioridade: 'ALTA',
        risco: 'MEDIO',
        responsavel: 'Lucas',
        status: 'PENDENTE',
      },
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: 'Inspeção de calhas e beirais (fichas TM — necessita irmãos locais treinados)',
        prioridade: 'ALTA',
        risco: 'ALTO',
        status: 'PENDENTE',
      },
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: 'Inspeção da estrutura do telhado (fichas TM)',
        prioridade: 'ALTA',
        risco: 'ALTO',
        status: 'PENDENTE',
      },
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: 'Inspeção do forro (fichas TM)',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
      },
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: 'Inspeção das telhas (fichas TM)',
        prioridade: 'ALTA',
        status: 'PENDENTE',
      },
      {
        salaoId: s9027.id,
        visitaId: visita9027.id,
        descricao: "Inspeção da caixa d'água (fichas TM)",
        prioridade: 'MEDIA',
        status: 'PENDENTE',
      },
    ],
  });

  console.log('✓ Pendências criadas: BRA4990 (4), BRA2115 (1), BRA1338 (4), BRA1100 (1), BRA10285 (6), BRA9027 (6)');
  console.log('\n✅ Importação concluída com sucesso!');

  // Totais
  const totais = await Promise.all([
    prisma.salao.count(),
    prisma.pessoa.count(),
    prisma.visita.count(),
    prisma.pendencia.count(),
  ]);
  console.log(`\nTotais no banco: ${totais[0]} salões | ${totais[1]} pessoas | ${totais[2]} visitas | ${totais[3]} pendências`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
