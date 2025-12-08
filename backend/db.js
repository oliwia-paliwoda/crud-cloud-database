const { Client } = require("pg");

function createClient(config) {
    return new Client(config);
}

module.exports = { createClient };

