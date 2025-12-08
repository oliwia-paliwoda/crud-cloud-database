const express = require("express");
const cors = require("cors");
const { createClient } = require("./db");


let client = null;
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post("/set-db", async (req, res) => {
    try {
        const { user, host, database, password, port, ssl } = req.body;

        if (client) {
            await client.end();
        }

        const config = { user, host, database, password, port: Number(port) };

        if (ssl) {
            config.ssl = { rejectUnauthorized: false };
        }

        client = createClient(config);
        await client.connect();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, error: err.message });
    }
});


app.post("/create-table", async (req, res) => {
    const { tableName, columns } = req.body;

    if (!tableName || !tableName.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
        let columnDefinitions = ["id SERIAL PRIMARY KEY"];

        if (Array.isArray(columns) && columns.length > 0) {
            for (let col of columns) {
                const colName = (col.name || "").trim().replace(/[^a-zA-Z0-9_]/g, "");
                const colType = (col.type || "").trim().toUpperCase();

                if (!colName || !colType) {
                    return res.status(400).json({ error: "Each column must have a name and type" });
                }

                let sqlDefault = "";

                const defaultValue = col.default;
                if (defaultValue === "" || defaultValue?.toLowerCase?.() === "null" || defaultValue === null || defaultValue === undefined) {
                    sqlDefault = "DEFAULT NULL";
                } else {
                    try {
                        switch(colType) {
                            case "INT":
                                if (isNaN(defaultValue)) throw new Error(`Default for '${colName}' must be a number`);
                                sqlDefault = `DEFAULT ${defaultValue}`;
                                break;
                            case "BOOLEAN":
                                if (!["true","false"].includes(defaultValue.toLowerCase())) throw new Error(`Default for '${colName}' must be true/false`);
                                sqlDefault = `DEFAULT ${defaultValue.toLowerCase()}`;
                                break;
                            case "DATE":
                                if (isNaN(Date.parse(defaultValue))) throw new Error(`Default for '${colName}' must be a valid date`);
                                sqlDefault = `DEFAULT '${defaultValue}'`;
                                break;
                            case "VARCHAR(100)":
                            case "VARCHAR":
                                sqlDefault = `DEFAULT '${defaultValue}'`;
                                break;
                            default:
                                throw new Error(`Unknown type '${colType}'`);
                        }
                    } catch(err) {
                        return res.status(400).json({ error: err.message });
                    }
                }

                columnDefinitions.push(`${colName} ${colType} ${sqlDefault}`.trim());
            }
        }

        const query = `CREATE TABLE ${safeTableName} (${columnDefinitions.join(", ")});`;
        await client.query(query);

        res.json({ message: `Table '${safeTableName}' has been created.` });

    } catch (err) {
        console.error(err);
        if (err.code === '42P07') {
            return res.status(400).json({ error: `Table '${tableName}' already exists.` });
        }
        res.status(500).json({ error: "SQL error", details: err.message });
    }
});


app.get("/tables", async (req, res) => {
    try {
        if (!client) {
            return res.json({ tables: [] });
        }

        const result = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        const tables = result.rows.map(r => r.table_name);
        res.json({ tables });

    } catch (err) {
        console.error(err);
        res.status(500).json({ tables: [], error: "SQL error" });
    }
});


app.get("/get-table", async (req, res) => {
    const { name } = req.query;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        const safeTableName = name.replace(/[^a-zA-Z0-9_]/g, "");

        const colsQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `;
        const colsResult = await client.query(colsQuery, [safeTableName]);
        const columns = colsResult.rows.map(r => ({
            name: r.column_name,
            type: r.data_type
        }));

        const rowsQuery = `SELECT * FROM ${safeTableName};`;
        const rowsResult = await client.query(rowsQuery);

        res.json({
            table: safeTableName,
            columns,
            rows: rowsResult.rows
        });

    } catch (err) {
        console.error(err);

        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table ${name} does not exist` });
        }

        res.status(500).json({ error: "SQL error" });
    }
});


app.post("/add-record", async (req, res) => {
    const { tableName, record } = req.body;

    if (!tableName || !record) {
        return res.status(400).json({ error: "tableName and record are required" });
    }

    try {
        const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");

        const colsQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = $1
        `;
        const colsResult = await client.query(colsQuery, [safeTable]);
        const columns = {};
        colsResult.rows.forEach(c => {
            columns[c.column_name] = c.data_type;
        });

        for (const [key, value] of Object.entries(record)) {
            if (value === null || value === "null") continue;

            const type = columns[key];
            if (!type) continue;

            if (type.includes("int")) {
                if (isNaN(value)) {
                    return res.status(400).json({ error: `Column '${key}' expects an integer.` });
                }
            } else if (type.includes("character") || type.includes("text")) {
            } else if (type === "boolean") {
                if (value !== true && value !== false && value !== "true" && value !== "false") {
                    return res.status(400).json({ error: `Column '${key}' expects a boolean.` });
                }
            } else if (type === "date") {
                if (isNaN(Date.parse(value))) {
                    return res.status(400).json({ error: `Column '${key}' expects a valid date.` });
                }
            }
        }

        const payload = { ...record };
        if (!payload.id) delete payload.id;

        const keys = Object.keys(payload);
        const values = Object.values(payload);

        let query;
        if (keys.length > 0) {
            const cols = keys.join(", ");
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
            query = `INSERT INTO ${safeTable} (${cols}) VALUES (${placeholders}) RETURNING *;`;
        } else {
            query = `INSERT INTO ${safeTable} DEFAULT VALUES RETURNING *;`;
        }

        const result = await client.query(query, values);

        res.json({
            message: "Record added",
            inserted: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${tableName}' does not exist.` });
        }

        if (err.code === "23505") {
            return res.status(400).json({ error: "Duplicate ID. This ID already exists." });
        }

        res.status(500).json({ error: "SQL error", details: err.message });
    }
});

app.delete("/table/:name", async (req, res) => {
    const tableName = req.params.name;

    if (!tableName || !tableName.trim()) {
        return res.status(400).json({ error: "Table name is required" });
    }

    try {
        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "");
        await client.query(`DROP TABLE IF EXISTS ${safeTableName};`);
        res.json({ message: `Table ${safeTableName} has been deleted` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SQL error" });
    }
});


app.delete("/delete-record", async (req, res) => {
    const { tableName, id } = req.body;

    if (!tableName || !id) {
        return res.status(400).json({ error: "tableName and id are required" });
    }

    try {
        const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
        const query = `DELETE FROM ${safeTable} WHERE id = $1 RETURNING *;`;
        const result = await client.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Record not found" });
        }

        res.json({
            message: "Record deleted",
            deleted: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SQL error", details: err.message });
    }
});

app.post("/add-column", async (req, res) => {
    const { tableName, newColumn } = req.body;
    const { name, type, default: defaultValue } = newColumn || {};

    if (!tableName || !name || !type) {
        return res.status(400).json({ error: "tableName, name and type are required" });
    }

    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const safeColumn = name.replace(/[^a-zA-Z0-9_]/g, "");

    let sqlDefault = "";
    let value = defaultValue;

    if (value === "" || (typeof value === "string" && value.toLowerCase() === "null")) {
        value = null;
    }

    if (value !== null && value !== undefined) {
        try {
            switch (type.toUpperCase()) {
                case "INT":
                    if (isNaN(value)) throw new Error("Default must be a number");
                    sqlDefault = `DEFAULT ${value}`;
                    break;
                case "BOOLEAN":
                    if (!["true", "false"].includes(value.toLowerCase())) {
                        throw new Error("Default must be true or false");
                    }
                    sqlDefault = `DEFAULT ${value.toLowerCase()}`;
                    break;
                case "DATE":
                    if (isNaN(Date.parse(value))) throw new Error("Default must be a valid date");
                    sqlDefault = `DEFAULT '${value}'`;
                    break;
                case "VARCHAR(100)":
                case "VARCHAR":
                    sqlDefault = `DEFAULT '${value}'`;
                    break;
                default:
                    throw new Error("Unknown type");
            }
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }

    try {
        const query = `ALTER TABLE ${safeTable} ADD COLUMN ${safeColumn} ${type} ${sqlDefault};`;
        await client.query(query);

        res.json({ message: `Column '${name}' added to table '${tableName}'.` });
    } catch (err) {
        console.error(err);

        if (err.code === "42701") {
            return res.status(400).json({ error: `Column '${name}' already exists.` });
        }
        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${tableName}' does not exist.` });
        }

        res.status(500).json({ error: "SQL error", details: err.message });
    }
});

app.put("/edit-record", async (req, res) => {
    const { tableName, id, updatedFields } = req.body;

    if (!tableName || !id || !updatedFields) {
        return res.status(400).json({ error: "tableName, id and updatedFields are required" });
    }

    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");

    const setClauses = [];
    const values = [];

    let i = 1;
    for (const [col, val] of Object.entries(updatedFields)) {
        let finalVal = val;

        if (val === "" || val === "null") {
            setClauses.push(`${col} = NULL`);
        } else {
            setClauses.push(`${col} = $${i}`);
            values.push(finalVal);
            i++;
        }
    }

    try {
        const query = `UPDATE ${safeTable} SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *;`;
        values.push(id);

        const result = await client.query(query, values);

        res.json({
            message: "Record updated",
            updated: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${tableName}' does not exist.` });
        }
        res.status(500).json({ error: "SQL error", details: err.message });
    }
});

app.delete("/remove-column", async (req, res) => {
    const { tableName, columnName } = req.body;

    if (!tableName || !columnName) {
        return res.status(400).json({ error: "tableName and columnName are required" });
    }

    const safeTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
    const safeColumn = columnName.replace(/[^a-zA-Z0-9_]/g, "");

    if (safeColumn.toLowerCase() === "id") {
        return res.status(400).json({ error: "Cannot remove 'id' column" });
    }

    try {
        const query = `ALTER TABLE ${safeTable} DROP COLUMN ${safeColumn};`;
        await client.query(query);
        res.json({ message: `Column '${safeColumn}' removed from table '${safeTable}'.` });
    } catch (err) {
        console.error(err);

        if (err.code === "42703") {
            return res.status(400).json({ error: `Column '${safeColumn}' does not exist` });
        }

        if (err.code === "42P01") {
            return res.status(400).json({ error: `Table '${safeTable}' does not exist` });
        }

        res.status(500).json({ error: "SQL error", details: err.message });
    }
});



app.listen(PORT, () => console.log(`Server działa na http://localhost:${PORT}`));
