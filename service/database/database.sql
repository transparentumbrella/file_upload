-- ----------------------------
-- 文件信息表
-- ----------------------------
CREATE TABLE "upload_info" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modular" varchar(32) NOT NULL DEFAULT '',/** 模块 **/
    "user_id" INTEGER unsigned NOT NULL DEFAULT '0',/** 用户id **/
    "file_md5" varchar(128) NOT NULL DEFAULT '',/** 文件md5 **/
    "file_size" INTEGER unsigned NOT NULL DEFAULT '0',/** 文件总大小 **/
    "file_name" varchar(2018) NOT NULL DEFAULT '',/** 文件名称 **/
    "file_path" varchar(2018) NOT NULL DEFAULT '',/** 文件地址，为所有分块上传成功后合并的新文件 **/
    "chunk_size" INTEGER unsigned NOT NULL DEFAULT '0',/** 分块最大大小 **/
    "chunk_num" INTEGER unsigned NOT NULL DEFAULT '0',/** 分块数量 **/
    "web_path" varchar(2018) NOT NULL DEFAULT '',/** 公网地址 **/
    "status" INTEGER NOT NULL DEFAULT '0',/** 状态  **/
    "expire_time" datetime NOT NULL DEFAULT '2000-01-01 00:00:00',/** 过期时间 **/
    "create_time" datetime NOT NULL DEFAULT '2000-01-01 00:00:00',/** 创建时间 **/
    "update_time" datetime NOT NULL DEFAULT '2000-01-01 00:00:00'/** 更新时间 **/
);
-- ----------------------------
-- 文件分块临时表
-- ----------------------------
CREATE TABLE "upload_tmp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_id" INTEGER unsigned NOT NULL DEFAULT '0',/** 文件id **/
    "file_no" INTEGER unsigned NOT NULL DEFAULT '0',/** 文件索引编号，由前端自行编号，一个正整数 **/
    "file_md5" varchar(128) NOT NULL DEFAULT '',/** 文件md5 **/
    "file_path" varchar(2018) NOT NULL DEFAULT '',/** 文件临时保存地址 **/
    "status" INTEGER NOT NULL DEFAULT '0',/** 状态  **/
    "create_time" datetime NOT NULL DEFAULT '2000-01-01 00:00:00'
);