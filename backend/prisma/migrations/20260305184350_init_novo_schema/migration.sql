/*
  Warnings:

  - You are about to drop the `acoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bras` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "bras_codigo_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "acoes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "bras";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "saloes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo_bra" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "data_construcao" DATETIME,
    "data_ultima_reforma" DATETIME,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "congregacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "salao_id" TEXT NOT NULL,
    CONSTRAINT "congregacoes_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "congregacao_id" TEXT,
    "autorizado_alto_risco" BOOLEAN NOT NULL DEFAULT false,
    "observacoes_autorizacao" TEXT,
    CONSTRAINT "pessoas_congregacao_id_fkey" FOREIGN KEY ("congregacao_id") REFERENCES "congregacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pessoa_funcoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pessoa_id" TEXT NOT NULL,
    "funcao" TEXT NOT NULL,
    CONSTRAINT "pessoa_funcoes_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "salao_responsaveis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "pessoa_id" TEXT NOT NULL,
    "papel" TEXT,
    CONSTRAINT "salao_responsaveis_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "salao_responsaveis_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "elemento_tipos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "vida_util_padrao_anos" INTEGER
);

-- CreateTable
CREATE TABLE "elementos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "elemento_tipo_id" TEXT NOT NULL,
    "nome_customizado" TEXT,
    "data_instalacao" DATETIME,
    "condicao_atual" TEXT NOT NULL DEFAULT 'BOM',
    "vida_util_anos" INTEGER,
    "proxima_manutencao" DATETIME,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "elementos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "elementos_elemento_tipo_id_fkey" FOREIGN KEY ("elemento_tipo_id") REFERENCES "elemento_tipos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "elemento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modelo" TEXT,
    "fabricante" TEXT,
    "data_instalacao" DATETIME,
    "garantia_ate" DATETIME,
    "proxima_manutencao" DATETIME,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "equipamentos_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elementos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "avaliador" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacoes_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacao_elementos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "avaliacao_id" TEXT NOT NULL,
    "elemento_id" TEXT NOT NULL,
    "condicao" TEXT NOT NULL,
    "previsao_substituicao" DATETIME,
    "planejamento_reforma" TEXT,
    "observacoes" TEXT,
    CONSTRAINT "avaliacao_elementos_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "avaliacao_elementos_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elementos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "visitante_id" TEXT,
    "visitante_nome" TEXT,
    "congregacao_id" TEXT,
    "relatorio" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visitas_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visitas_visitante_id_fkey" FOREIGN KEY ("visitante_id") REFERENCES "pessoas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "visitas_congregacao_id_fkey" FOREIGN KEY ("congregacao_id") REFERENCES "congregacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "avaliacao_id" TEXT,
    "visita_id" TEXT,
    "elemento_id" TEXT,
    "equipamento_id" TEXT,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "risco" TEXT,
    "responsavel" TEXT,
    "data_limite" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluido_em" DATETIME,
    CONSTRAINT "pendencias_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pendencias_avaliacao_id_fkey" FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pendencias_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pendencias_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elementos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pendencias_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servicos_alto_risco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "visita_id" TEXT,
    "pendencia_id" TEXT,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "autorizado_por" TEXT,
    "treinamentos_necessarios" TEXT,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADO',
    CONSTRAINT "servicos_alto_risco_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "servicos_alto_risco_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analises_risco" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "servico_id" TEXT NOT NULL,
    "riscos_identificados" TEXT NOT NULL,
    "medidas_controle" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    CONSTRAINT "analises_risco_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos_alto_risco" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "epis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "servico_epis" (
    "servico_id" TEXT NOT NULL,
    "epi_id" TEXT NOT NULL,

    PRIMARY KEY ("servico_id", "epi_id"),
    CONSTRAINT "servico_epis_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos_alto_risco" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "servico_epis_epi_id_fkey" FOREIGN KEY ("epi_id") REFERENCES "epis" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidentes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "visita_id" TEXT,
    "servico_id" TEXT,
    "data" DATETIME NOT NULL,
    "local" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "gravidade" TEXT NOT NULL,
    "acao_corretiva" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incidentes_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "incidentes_visita_id_fkey" FOREIGN KEY ("visita_id") REFERENCES "visitas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "incidentes_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos_alto_risco" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "periodos_manutencao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mes_inicio" INTEGER NOT NULL,
    "mes_fim" INTEGER NOT NULL,
    "descricao" TEXT
);

-- CreateTable
CREATE TABLE "cronogramas_anuais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "periodo_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "observacoes" TEXT,
    CONSTRAINT "cronogramas_anuais_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cronogramas_anuais_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos_manutencao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orcamentos_anuais" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "orcamento_previsto" REAL NOT NULL,
    "saldo_reserva" REAL NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    CONSTRAINT "orcamentos_anuais_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lancamentos_custo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salao_id" TEXT NOT NULL,
    "orcamento_anual_id" TEXT,
    "pendencia_id" TEXT,
    "elemento_id" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "categoria" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lancamentos_custo_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lancamentos_custo_orcamento_anual_id_fkey" FOREIGN KEY ("orcamento_anual_id") REFERENCES "orcamentos_anuais" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lancamentos_custo_pendencia_id_fkey" FOREIGN KEY ("pendencia_id") REFERENCES "pendencias" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lancamentos_custo_elemento_id_fkey" FOREIGN KEY ("elemento_id") REFERENCES "elementos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERADOR',
    "pessoa_id" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("criado_em", "email", "id", "nome", "role", "senha_hash") SELECT "criado_em", "email", "id", "nome", "role", "senha_hash" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_pessoa_id_key" ON "users"("pessoa_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "saloes_codigo_bra_key" ON "saloes"("codigo_bra");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_funcoes_pessoa_id_funcao_key" ON "pessoa_funcoes"("pessoa_id", "funcao");

-- CreateIndex
CREATE UNIQUE INDEX "salao_responsaveis_salao_id_pessoa_id_key" ON "salao_responsaveis"("salao_id", "pessoa_id");

-- CreateIndex
CREATE UNIQUE INDEX "elemento_tipos_codigo_key" ON "elemento_tipos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_elementos_avaliacao_id_elemento_id_key" ON "avaliacao_elementos"("avaliacao_id", "elemento_id");

-- CreateIndex
CREATE UNIQUE INDEX "analises_risco_servico_id_key" ON "analises_risco"("servico_id");

-- CreateIndex
CREATE UNIQUE INDEX "epis_codigo_key" ON "epis"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_manutencao_codigo_key" ON "periodos_manutencao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cronogramas_anuais_salao_id_periodo_id_ano_key" ON "cronogramas_anuais"("salao_id", "periodo_id", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_anuais_salao_id_ano_key" ON "orcamentos_anuais"("salao_id", "ano");
