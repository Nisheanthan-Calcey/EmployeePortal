import { Sequelize } from 'sequelize-typescript';
import { dbconfig } from './config';

export const sequelize = new Sequelize({
    username: dbconfig.username,
    password: dbconfig.password,
    database: dbconfig.database,
    host: dbconfig.host,
    // dialect: dbconfig.dialect,
    port: dbconfig.port
});
// sequelize.authenticate().then(() => {
//  console.log('Connected to DB');
// })
// .catch((err) => {
//  console.log(err);
// });
