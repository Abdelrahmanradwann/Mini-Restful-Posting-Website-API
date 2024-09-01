CREATE DATABASE IF NOT EXISTS `Mini-posting-website`;
USE `Mini-posting-website`;


CREATE TABLE `LikesOfComment`(
    `commentId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    PRIMARY KEY(`commentId`, `userId`)
);

/* userId -> should be handled at app level cuz HP does not yet support FK*/
CREATE TABLE `Posts` (
    `id` BIGINT  NOT NULL AUTO_INCREMENT,
    `content` TEXT NULL,
    `media` BOOLEAN NOT NULL,
    `userId` BIGINT NOT NULL,   
    `createdAt` DATETIME NOT NULL,
    `numComments` BIGINT NULL,
    `numLikes` BIGINT NULL,
    PRIMARY KEY (`id`)
)
PARTITION BY RANGE (`id`) (   
    PARTITION `p0` VALUES LESS THAN (5),    
    PARTITION `p1` VALUES LESS THAN (10),
    PARTITION `p2` VALUES LESS THAN (20),
    PARTITION `p3` VALUES LESS THAN (MAXVALUE)
);




CREATE TABLE `Friends` (
    `userId` BIGINT NOT NULL,
    `friendId` BIGINT NOT NULL,
    `status` ENUM('accepted', 'rejected', 'pending') NOT NULL,
    PRIMARY KEY (`userId`, `friendId`, `status`)
);


-- postId should be FK but will be handled at app layer
CREATE TABLE `LikesOfPost`(
    `postId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,
    PRIMARY KEY(`postId`, `userId`)
);

-- postId should be FK but will be handled at app layer
CREATE TABLE `Comments`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `postId` BIGINT NOT NULL,
    `numLikes` BIGINT NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `media` BOOLEAN NOT NULL,
    PRIMARY KEY(`id`)
);


CREATE TABLE `UserMetaData`(
    `id` BIGINT  NOT NULL AUTO_INCREMENT,
    `email` TEXT NOT NULL,
    `password` TEXT NOT NULL,
    `verificationCode` SMALLINT NULL,
    `timeOfCode` DATETIME NULL,
    `confirmation` BOOLEAN NULL,
    PRIMARY KEY(`id`)
);
ALTER TABLE 
    `UserMetaData` ADD INDEX `usermetadata_email_password_index`(`email`(255), `password`(255));

ALTER TABLE
    `UserMetaData` ADD UNIQUE `usermetadata_email_unique`(`email`(255));



CREATE TABLE `Users`(
    `id` BIGINT  NOT NULL AUTO_INCREMENT,
    `userName` TEXT NOT NULL,
    `isPicExist` BOOLEAN NOT NULL,
    `friendsNo` BIGINT NOT NULL,
    `bio` TEXT NULL,
    `numFollowers` BIGINT NOT NULL,
    `numFollowing` BIGINT NOT NULL,
    PRIMARY KEY(`id`)
);
ALTER TABLE
    `Users` ADD INDEX `users_username_index`(`userName`(255));


ALTER TABLE
    `LikesOfComment` ADD CONSTRAINT `likesofcomment_commentid_foreign` FOREIGN KEY(`commentId`) REFERENCES `Comments`(`id`);


ALTER TABLE
    `UserMetaData` ADD CONSTRAINT `usermetadata_id_foreign` FOREIGN KEY(`id`) REFERENCES `Users`(`id`);

-- ALTER TABLE
--     `Posts` ADD CONSTRAINT `posts_userid_foreign` FOREIGN KEY(`userId`) REFERENCES `Users`(`id`);

ALTER TABLE
    `Friends` ADD CONSTRAINT `friends_userid_foreign` FOREIGN KEY(`userId`) REFERENCES `Users`(`id`);

-- ALTER TABLE
--     `Comments` ADD CONSTRAINT `comments_postid_foreign` FOREIGN KEY(`postId`) REFERENCES `Posts`(`id`);

ALTER TABLE
    `LikesOfComment` ADD CONSTRAINT `likesofcomment_userid_foreign` FOREIGN KEY(`userId`) REFERENCES `Users`(`id`);

ALTER TABLE
    `LikesOfPost` ADD CONSTRAINT `likesofpost_userid_foreign` FOREIGN KEY(`userId`) REFERENCES `Users`(`id`);

-- ALTER TABLE
--     `LikesOfPost` ADD CONSTRAINT `likesofpost_postid_foreign` FOREIGN KEY(`postId`) REFERENCES `Posts`(`id`);

ALTER TABLE
    `Friends` ADD CONSTRAINT `friends_friendid_foreign` FOREIGN KEY(`friendId`) REFERENCES `Users`(`id`);

ALTER TABLE
    `Comments` ADD CONSTRAINT `comments_userid_foreign` FOREIGN KEY(`userId`) REFERENCES `Users`(`id`);