import "./AllTables.scss"
import TableElement from "./TableElement";
import Table from "./Table";
import CreateTable from "./CreateTable";
import React, {useState, useEffect} from "react";
function AllTables(){

    const [tables, setTables] = useState([]);

    const fetchTables = async () => {
        try {
            const res = await fetch("http://localhost:5000/tables");
            const data = await res.json();
            setTables(data.tables);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveTable = async () => {
        if (!focusedTable) {
            console.error("Table not found");
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/table/${focusedTable}`,
                {method: "DELETE"});

            const data = await res.json();
            if (!res.ok) {


                setErrorMessage(data.error || "Unknown server error");
                return;
            }

            setFocusedTable(null);
            fetchTables();
            setErrorMessage(data.message);        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    const [showDetails, setShowDetails] = useState(false);
    const [activeTable, setActiveTable] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");


    const handleClick = (name) => {
        setShowDetails(true);
        setActiveTable(name);
    }

    const handleReturn = () => {
        setShowDetails(false);
    };

    const handleCancel = () => {
        setActionType(null);
        setFocusedTable(null);
        setErrorMessage("");
        fetchTables();

    }

    const [actionType, setActionType] = useState(null);
    const handleActionType=(action) => {
        setActionType(action);
    };

    const [focusedTable, setFocusedTable] = useState(null);
    const handleSelectTable = (focusedTable) => {
        setFocusedTable(focusedTable);
    };

    return (
        <div className="container">
            {!showDetails &&
            <div className="table-view">

                {actionType === null && tables.length === 0 &&
                    <div className="no-tables">No tables found. Click "Add table" to add a table.</div>
                }

                {actionType === null && <div className="table-list">
                {tables.map((name,index) => (<TableElement onClick={() => handleClick(name)} key={index} tableName={name} />))}

            </div>}

                {actionType === "remove" && <div className="table-list">
                    {tables.map((name, index) => (
                        <TableElement
                            onClick={() => handleSelectTable(name)}
                            key={index}
                            tableName={name}
                            isFocused={focusedTable === name}
                        />
                    ))}                </div>
                }

                {actionType === null &&
            <div className="manage-tables">
                <button onClick={ () => handleActionType("add")}>Add table</button>
                {tables.length > 0 &&
                <button onClick={ () => handleActionType("remove")}>Remove table</button>
                }
            </div>
                }
                <div className="action-bar-tables">


                    {actionType === "remove" &&
                        <div className="action-bar-remove">
                            <div>{errorMessage}</div>
                            {focusedTable === null && tables.length > 0 &&
                        <div style={{marginBottom: "2vmin"}}>Select a table you want to remove.</div>}
                            {focusedTable !== null &&
                            <div className="remove-confirm">
                                <div>Remove table: {focusedTable}?</div>
                            </div>}
                            <div className="remove-buttons">
                                {focusedTable !== null &&
                            <button onClick={handleRemoveTable} style={{backgroundColor: "deeppink"}}>Remove</button>
                                }
                            <button onClick={handleCancel}>Return</button>
                            </div>

                        </div>
                    }


                    {actionType === "add" &&
                        <CreateTable onCancel={handleCancel}></CreateTable>
                    }
                </div>
            </div>
            }

            {showDetails &&
            <div className="details-view">
                <Table tableName={activeTable} onReturn={handleReturn}></Table>
            </div>
            }
        </div>
    );
}


export default AllTables