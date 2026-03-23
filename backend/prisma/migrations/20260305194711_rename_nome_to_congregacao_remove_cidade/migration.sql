/*
  Warnings:

  - You are about to drop the column `cidade` on the `saloes` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_saloes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigo_bra" TEXT NOT NULL,
    "endereco" TEXT,
    "data_construcao" DATETIME,
    "data_ultima_reforma" DATETIME,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);
INSERT INTO "new_saloes" ("atualizado_em", "codigo_bra", "criado_em", "data_construcao", "data_ultima_reforma", "endereco", "id", "nome", "observacoes") SELECT "atualizado_em", "codigo_bra", "criado_em", "data_construcao", "data_ultima_reforma", "endereco", "id", "nome", "observacoes" FROM "saloes";
DROP TABLE "saloes";
ALTER TABLE "new_saloes" RENAME TO "saloes";
CREATE UNIQUE INDEX "saloes_codigo_bra_key" ON "saloes"("codigo_bra");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
