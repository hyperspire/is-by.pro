ALTER USER 'root'@'localhost' IDENTIFIED BY 'cmA,NXw<q(|:&%mU';
CREATE USER 'hyperuser'@'localhost';
CREATE USER 'hyperuser'@'%';
CREATE DATABASE isby;
CREATE TABLE isby.pro (id varchar(64), ibp varchar(256), pro varchar(128), location varchar(128), services varchar(256), website varchar(512), github varchar(128));
CREATE TABLE isby.user (id varchar(64), username varchar(128), password varchar(64), lastlog varchar(32), authtoken varchar(64));
CREATE TABLE isby.post (id varchar(64), postid varchar(64), forthe varchar(1024), isby varchar(1024), iswith varchar(1024), timestamp varchar(32));
GRANT UPDATE, SELECT, INSERT ON isby.* TO 'hyperuser'@'localhost';
GRANT UPDATE, SELECT, INSERT ON isby.* TO 'hyperuser'@'%';
GRANT UPDATE, SELECT, INSERT, DELETE ON isby.post TO 'hyperuser'@'localhost';
GRANT UPDATE, SELECT, INSERT, DELETE ON isby.post TO 'hyperuser'@'%';
INSERT INTO isby.pro VALUES ('e13bf898c143d065623b4d5fe2ebaa137dd2a5cdd01170dde1cc4bb9b5709a2c', ':[[ "We the living people revoke permission to fictional legal constructs for censorship, surveillance, personage and conversion as a trespass of divine law." ]]:', ':HyperSpire-Foundation:', 'MOORHEAD, MN', ':Cloud-Solutions:', 'hyperspire.com', 'hyperspire');
ALTER USER 'hyperuser'@'%' IDENTIFIED WITH mysql_native_password BY '*&DUGioj%^dji>p}';
FLUSH PRIVILEGES;