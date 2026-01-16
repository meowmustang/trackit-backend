-- CreateTable
CREATE TABLE "vendors" (
    "vendor_id" INTEGER NOT NULL,
    "vendor_name" TEXT NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "room_id" INTEGER NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "fact_worker_sessions" (
    "id" SERIAL NOT NULL,
    "worker_id" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),

    CONSTRAINT "fact_worker_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_worker_sessions_worker_id_work_date_idx" ON "fact_worker_sessions"("worker_id", "work_date");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_worker_sessions" ADD CONSTRAINT "fact_worker_sessions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("worker_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_worker_sessions" ADD CONSTRAINT "fact_worker_sessions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_worker_sessions" ADD CONSTRAINT "fact_worker_sessions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;
