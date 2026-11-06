CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "layerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "coords" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Drawing_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "Layer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Drawing_layerId_idx" ON "Drawing"("layerId");
