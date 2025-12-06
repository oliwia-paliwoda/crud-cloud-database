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

    useEffect(() => {
        fetchTables();
    }, []);

    const [showDetails, setShowDetails] = useState(false);
    const [activeTable, setActiveTable] = useState(null);

    const handleClick = (name) => {
        setShowDetails(true);
        setActiveTable(name);
    }

    const handleReturn = () => {
        setShowDetails(false);
    };

    const handleCancel = () => {
        setActionType(null);
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
                <button onClick={ () => handleActionType("remove")}>Remove table</button>
            </div>
                }
                <div className="action-bar-tables">


                    {actionType === "remove" &&
                        <div className="action-bar-remove">

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