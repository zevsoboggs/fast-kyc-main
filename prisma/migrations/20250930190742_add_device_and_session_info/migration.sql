-- AlterTable
ALTER TABLE "verifications" ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "ipGeoLocation" JSONB,
ADD COLUMN     "sessionEvents" JSONB;
