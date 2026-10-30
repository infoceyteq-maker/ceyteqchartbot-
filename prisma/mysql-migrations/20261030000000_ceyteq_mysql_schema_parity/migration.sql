-- Restore a field removed by an earlier MySQL migration and align label
-- uniqueness with the API's per-instance label operations. Existing duplicate
-- (labelId, instanceId) pairs must be resolved before applying this migration.
ALTER TABLE `IsOnWhatsapp` ADD COLUMN `lid` VARCHAR(100) NULL;
CREATE UNIQUE INDEX `Label_labelId_instanceId_key` ON `Label` (`labelId`, `instanceId`);
