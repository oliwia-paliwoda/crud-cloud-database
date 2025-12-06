// db.js
const { Client } = require("pg");

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "baza",
    password: "123",
    port: 5432
});

client.connect()
    .then(() => console.log("Połączono z PostgreSQL"))
    .catch(err => console.error("Błąd połączenia", err));

module.exports = client;
