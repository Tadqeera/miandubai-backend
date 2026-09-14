-- CreateTable
CREATE TABLE `whatsapp_interactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` ENUM('GLOBAL', 'PRODUCT', 'BAG', 'CONTACT') NOT NULL DEFAULT 'GLOBAL',
    `productId` INTEGER NULL,
    `productSlug` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NULL,
    `pagePath` VARCHAR(300) NOT NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `sessionId` VARCHAR(64) NULL,
    `contactName` VARCHAR(120) NULL,
    `contactPhone` VARCHAR(40) NULL,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `whatsapp_interactions_createdAt_idx`(`createdAt`),
    INDEX `whatsapp_interactions_source_idx`(`source`),
    INDEX `whatsapp_interactions_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
