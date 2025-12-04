import logo from './logo.svg';
import './App.css';
import './AllTables.jsx';
import AllTables from "./AllTables";
import {BrowserRouter} from "react-router-dom";

function App() {
  return (
    <div className="App">
    <AllTables></AllTables>
    </div>
  );
}

export default App;
