const mysql = require("mysql2/promise");

const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_PORT, MYSQL_DB } =
  process.env;

const connection = async () => {
  const conn = await mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
  });

  //   await conn.prepare(
  //     `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT,name varchar(50) NOT NULL,email varchar(50) NOT NULL,password varchar(50)  ,PRIMARY KEY (id))`
  //   );

  return conn;
};

async function insert(table, data) {
  try {
    const db = await connection();
    const keys = Object.keys(data);
    const values = keys.map((key) => data[key]);
    const [result] = await db.execute(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (?,?,?)`,
      values
    );

    return result;
  } catch (error) {
    console.log(error);
    throw new Error(`Erro ao inserir dados na tabela ${table}`);
  }
}

module.exports = { insert };
