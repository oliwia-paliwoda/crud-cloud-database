import "./Table.scss";

function Table(){

    const data = [
        { imie: "Jan", nazwisko: "Kowalski", wiek: 25 },
        { imie: "Anna", nazwisko: "Nowak", wiek: 30 },
        { imie: "Piotr", nazwisko: "Wiśniewski", wiek: 28 },
        { imie: "Katarzyna", nazwisko: "Wójcik", wiek: 22 },
        { imie: "Marek", nazwisko: "Lewandowski", wiek: 35 }
    ];

    const tableName = "Table";

    const headers = data.length > 0 ? Object.keys(data[0]) : [];


    return(
        <div className="table-page">
            <div className="dashboard">
                <button>Return</button>
            </div>
            <div className="table-name"></div>
        <div className="table-details">
            <table style={{ borderCollapse: "collapse", width: "60%" }}>
                <thead>
                <tr>
                    {headers.map((key) => (
                        <th
                            key={key}
                            style={{
                                border: "1px solid #333",
                                padding: "8px",
                                backgroundColor: "#f2f2f2",
                                textTransform: "capitalize"
                            }}
                        >
                            {key}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {headers.map((key) => (
                            <td
                                key={key}
                                style={{ border: "1px solid #333", padding: "8px", textAlign: "center" }}
                            >
                                {row[key]}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        </div>

    );

}



export default Table;