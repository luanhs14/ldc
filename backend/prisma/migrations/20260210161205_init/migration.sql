-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'usuario',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bras" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'A_FAZER',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "mes_referencia" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "acoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bra_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data_prevista" DATETIME NOT NULL,
    "data_concluida" DATETIME,
    "resultado" TEXT,
    CONSTRAINT "acoes_bra_id_fkey" FOREIGN KEY ("bra_id") REFERENCES "bras" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pendencias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bra_id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "risco" TEXT NOT NULL DEFAULT 'MEDIO',
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pendencias_bra_id_fkey" FOREIGN KEY ("bra_id") REFERENCES "bras" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bras_codigo_key" ON "bras"("codigo");
