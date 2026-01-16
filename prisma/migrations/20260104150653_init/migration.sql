-- CreateTable
CREATE TABLE "workers" (
    "worker_id" TEXT NOT NULL,
    "worker_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("worker_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workers_phone_number_key" ON "workers"("phone_number");
