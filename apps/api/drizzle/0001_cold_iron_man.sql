DROP TABLE IF EXISTS `secrets`;--> statement-breakpoint
CREATE TABLE `secrets` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`content_id` varchar(32) NOT NULL,
	`data` text NOT NULL,
	`access_verifier` binary(32) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`accessed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `secrets_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_uidx` UNIQUE(`content_id`)
) ENGINE=InnoDB;
