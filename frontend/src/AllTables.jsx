import "./AllTables.scss"
import TableElement from "./TableElement";
import Table from "./Table";
import React, {useState} from "react";
function AllTables(){

    const tables = ["Users", "Projects", "Credentials", "Test"];

    const [showDetails, setShowDetails] = useState(false);
    const handleClick = () => {
        setShowDetails(!showDetails);
    }

    return (
        <div className="container">
            {!showDetails &&
            <div className="table-view">
            <div className="table-list">
                {tables.map((name,index) => (<TableElement onClick={handleClick} key={index} tableName={name}/>))}

            </div>
            <div className="manage-tables">
                <button>Add table</button>
                <button>Remove table</button>
            </div>
            </div>
            }

            {showDetails &&
            <div className="details-view">
                <Table></Table>
            </div>
            }
        </div>
    );
}


export default AllTables