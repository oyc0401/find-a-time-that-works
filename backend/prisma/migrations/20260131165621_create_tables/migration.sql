-- CreateTable
CREATE TABLE "room" (
    "id" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "dates" DATE[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_expires_at_idx" ON "room"("expires_at");

-- CreateIndex
CREATE INDEX "participant_room_id_idx" ON "participant"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "participant_room_id_user_id_key" ON "participant"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "availability_participant_id_idx" ON "availability"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "availability_participant_id_date_start_time_key" ON "availability"("participant_id", "date", "start_time");

-- AddForeignKey
ALTER TABLE "participant" ADD CONSTRAINT "participant_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
