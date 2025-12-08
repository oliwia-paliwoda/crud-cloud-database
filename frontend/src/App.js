import logo from './logo.svg';
import './App.css';
import './AllTables.jsx';
import AllTables from "./AllTables";
import {BrowserRouter} from "react-router-dom";
import DatabaseSelector from "./databaseConnectionView";
import {useState} from "react";

function App() {
    const [connectionSuccess, setConnectionSuccess] = useState(false);

    return (
        <div className="App">
            {connectionSuccess ? (
                <AllTables />
            ) : (
                <DatabaseSelector setConnectionSuccess={setConnectionSuccess} />
            )}
        </div>
    );
}


export default App;
