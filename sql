create table users (
    id integer primary key autoincrement,
    name string unique,
    password string not null
);

create table posts (
    id integer primary key autoincrement,
    userId integer,
    title string,
    content string,
    timestamp integer
);

create table comments (
    id integer primary key autoincrement,
    postId integer,
    userId integer,
    content string,
    timestamp integer
);


.open /Users/zl/Desktop/miao/vue-react框架及项目/v2ex-bbs/bbs.db
.headers on
.mode column

insert into users (name,password) values ("zs","123456");
insert into posts (userId,title, content, timestamp) values (1, "hello", "world", 23432432434);
insert into comments values (1,1,1,"excellent!",2343243253454);

select * from users;
alter table users add column avatars string;
ALTER TABLE users RENAME COLUMN avatars TO avatar;


{
  "dependencies": {
    "cookie-parser": "^1.4.3",
    "hbs": "^4.0.1",
    "multer": "^1.4.0",
    "sequelize": "^4.39.0",
    "sqlite": "^3.0.0",
    "sqlite3": "^4.0.2",
  }
}





