const {Pool, Client} = require('pg');

    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'Company',
        password: 'user@123',
        port: 5432
    });
    const sql = 'SELECT * FROM employee';


    pool.query(sql, ( err, res) => {
      console.log(err, res);
      pool.end();
    });