const {Pool, Client} = require('pg');

const pool = new Pool({
    user:'postgres',
    host:'localhost',
    database:'Company',
    password:'user@123',
    port:5432
});

let sql = 'CREATE TABLE test( ID int, name VARCHAR(10))';

pool.query(sql,(err,res)=>{
    console.log(err,res);
    pool.end();
});
