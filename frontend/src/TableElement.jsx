import "./TableElement.scss"

function TableElement({ tableName, onClick, isFocused }) {
    return (
        <div
            onClick={onClick}
            className={`table-container ${isFocused ? "focused" : ""}`}
        >
            {tableName}
        </div>
    );
}

export default TableElement