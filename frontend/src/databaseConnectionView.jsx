import { useState } from "react";
import "./DatabaseConnectionView.scss";

 function DatabaseSelector( {setConnectionSuccess}) {

     //const API_URL = process.env.REACT_APP_API_URL;
     const API_URL = "https://crud-cloud-app-backend.azurewebsites.net";
     console.error(API_URL);


     const [form, setForm] = useState({
        user: "admin_db",
        host: "my-crud-db.postgres.database.azure.com",
        database: "postgres",
        password: "rthjbv1@",
        port: 5432,
        ssl: true,
    });

    const [status, setStatus] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const connectToDatabase = async () => {
        setStatus("Łączenie...");

        try {
            const res = await fetch(`${API_URL}/set-db`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            const data = await res.json();
            if (data.success) {
                setStatus("Connected to database: " + form.database);
                setConnectionSuccess(true);
            } else {
                setStatus("Error: " + data.error);
            }
        } catch (err) {
            setStatus("Error:" + err.message);
        }
    };

    return (
        <div className="form">

            <label htmlFor="host">host</label>
            <input
                type="text"
                name="host"
                value={form.host}
                onChange={handleChange}
                placeholder="host"
            />

            <label htmlFor="user">user</label>
            <input
                type="text"
                name="user"
                value={form.user}
                onChange={handleChange}
                placeholder="user"
            />

            <label htmlFor="database">database</label>
            <input
                type="text"
                name="database"
                value={form.database}
                onChange={handleChange}
                placeholder="database"
            />

            <label htmlFor="password">password</label>
            <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="password"
            />

            <label htmlFor="port">port</label>
            <input
                type="number"
                name="port"
                value={form.port}
                onChange={handleChange}
                placeholder="port"
            />

            <label htmlFor="ssl">SSL</label>
            <input type="checkbox" name="ssl" checked={form.ssl} onChange={handleChange} />


            <button onClick={connectToDatabase}>Connect</button>

            <p style={{marginTop: 10}}>{status}</p>
        </div>
    );
 }

export default DatabaseSelector;
