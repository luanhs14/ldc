-- CreateTable: new acoes with expanded schema
CREATE TABLE "acoes_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bra_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "data_prevista" DATETIME,
    "data_concluida" DATETIME,
    "resultado" TEXT,
    "risco" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "acoes_bra_id_fkey" FOREIGN KEY ("bra_id") REFERENCES "bras" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing acoes into new table
INSERT INTO "acoes_new" ("id", "bra_id", "tipo", "descricao", "responsavel", "data_prevista", "data_concluida", "resultado", "risco", "status", "criado_em")
SELECT "id", "bra_id", "tipo", "descricao", "responsavel", "data_prevista", "data_concluida", "resultado", NULL,
  CASE WHEN "data_concluida" IS NOT NULL THEN 'CONCLUIDA' ELSE 'ABERTA' END,
  CURRENT_TIMESTAMP
FROM "acoes";

-- Migrate pendencias into new acoes table
INSERT INTO "acoes_new" ("id", "bra_id", "tipo", "descricao", "responsavel", "data_prevista", "data_concluida", "resultado", "risco", "status", "criado_em")
SELECT "id", "bra_id", "categoria", "descricao", '', NULL, NULL, NULL, "risco",
  CASE WHEN "status" = 'RESOLVIDA' THEN 'CONCLUIDA' ELSE "status" END,
  "criado_em"
FROM "pendencias";

-- Drop old tables
DROP TABLE "acoes";
DROP TABLE "pendencias";

-- Rename new table
ALTER TABLE "acoes_new" RENAME TO "acoes";
