
import React, { useEffect, useCallback, useRef } from "react";
import { AgGridReact } from 'ag-grid-react';
import { utils, writeFile } from 'xlsx';
import './reports-grid.css';

const ReportsGrid = (props) => {

  const gridRef = useRef();
  const [tableData, setTableData] = React.useState(props.tableData);
  const [gridApi, setGridApi] = React.useState(null);
  const [gridColumnApi, setGridColumnApi] = React.useState(null);
  const [filteredRows, setFilteredRows] = React.useState(props.tableData);

  const onFilterChanged = (value) => {
    if(gridApi)
    gridApi.setQuickFilter(value);
    gridApi.onFilterChanged()
  }

  const onBtExport = () => {
    const headings = [['ID', '1', '2', '3', '4', '5', 'Company']];
    const wb = utils.book_new();
    const ws = utils.json_to_sheet([]);
    utils.sheet_add_aoa(ws, headings);

    let reports = filteredRows;
    reports.forEach(object => {
      delete object['Link'];
    });

    utils.sheet_add_json(ws, reports, { origin: 'A2', skipHeader: true });
    utils.book_append_sheet(wb, ws, 'Report');
    writeFile(wb, 'Reports.xlsx');

  }

  useEffect(() => {
    if (props.tableData !== tableData) {
      setTableData(props.tableData);
    }
    if (gridApi && gridColumnApi) {
      const model = gridApi.getModel();
      const rows = model.rowsToDisplay.map(row => row.data);
        setFilteredRows(rows);

    }
    if (props.isExportExcel) {
      // onBtExport();
    }

  }, [props.tableData, gridApi, gridColumnApi, props.isExportExcel, filteredRows]);
 
  
  const [columnDefs, setColumnDefs] = React.useState([
    {
      headerName: "ID", field: "0", filter: false

    },
    {
      headerName: "1", field: "1", filter: 'agTextColumnFilter', floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      suppressMenu: true
    },

    {
      headerName: "2", field: "2", filter: 'agTextColumnFilter', floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      suppressMenu: true
    },
    {
      headerName: "3", field: "3", filter: 'agTextColumnFilter', floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      suppressMenu: true
    },
    {
      headerName: "4", field: "4", filter: 'agTextColumnFilter', floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      suppressMenu: true
    },
    {
      headerName: "5", field: "5", filter: 'agTextColumnFilter', floatingFilterComponentParams: {
        suppressFilterButton: true,
      },
      suppressMenu: true
    },
    {
      headerName: "Company", field: 'Transporter', filter: false

    }
  ])
  const defaultColDef = React.useMemo(() => {
    return {
      flex: 1,
      minWidth: 150,
      filter: true,
      floatingFilter: false,

    };
  }, []);

  const onGridReady = (params) => {
    setTableData(tableData)
    setFilteredRows(tableData);
    setTimeout(() => {
      setGridApi(params.api);
      setGridColumnApi(params.columnApi);
    })


  };

  return (
    <div className="ag-grid-container  ag-theme-quartz">
      <AgGridReact
        ref={gridRef}
        rowData={tableData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        onFilterChanged={onFilterChanged}
        pagination={true}
      />
    </div>
  );
};

export default ReportsGrid; 