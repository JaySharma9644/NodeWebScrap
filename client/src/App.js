
import React, { useState, useRef } from "react";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css"; // Theme
import { styled } from '@mui/material/styles';
import "./App.css";
import LoopIcon from '@mui/icons-material/Loop';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { read, utils, writeFile } from 'xlsx';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem'
import ReportSample from './Report_Template.xlsx';
import { Helmet } from 'react-helmet';
import ReportsGrid from './reports-grid';
import Sidebar from './side-bar';
const pako = require('pako');

const App = () => {

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoader, setLoader] = useState(false);
  const [label, setLabel] = useState('');
  const [isReportReady, setStatus] = useState(false);
  const [isProcessFailed, setError] = useState(false);
  const [exportExcel, setExportExcel] = useState(false);
  const [transporters, setTransporters] = useState([]);
  const [selectedTransporter, setselectedTransporter] = useState('');

  const handleImport = ($event) => {
    setLoader(true);
    setLabel('Uploading....');
    const files = $event.target.files;
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const wb = read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          let Data_List = [];
          let sheet = wb.Sheets[sheets[0]];
          //const rows = utils.sheet_to_json(sheet);
          var range = utils.decode_range(sheet['!ref']);
          for (var R = range.s.r; R <= range.e.r; ++R) {
            let object = {};
            let index = 0;
            for (var C = range.s.c; C <= range.e.c; ++C) {
              var cell_address = { c: C, r: R };
              /* if an A1-style address is needed, encode the address */
              var cell_ref = utils.encode_cell(cell_address);
              if (sheet[cell_ref] && sheet[cell_ref] !== undefined) {

                object[index.toString()] = sheet[cell_ref].v;
                // object["3"] = new Date(sheet[cell_ref].v);
                if (sheet[cell_ref].l && sheet[cell_ref].l.Target) {
                  sheet[cell_ref].v = sheet[cell_ref].l.Target;
                  let link_URL = sheet[cell_ref].l.Target.trim();
                  object["Link"] = link_URL;
                  object["Transporter"] = "";
                }
                
              }
              index = index + 1;
            }
            if (Object.keys(object).length > 0) {
              Data_List.push(object);
            }


          }
          setData(Data_List)
          setFilteredData(Data_List);
          //console.log("json data", Data_List);
        }
        setLoader(false);
        setLabel('');
      }
      reader.readAsArrayBuffer(file);
    }
  }
  const handleError = () => {
    setLoader(false);
    setError(true);
  }

  const sendGzippedPayload = async (url, payload) => {
    const compressedPayload = pako.deflate(JSON.stringify(payload));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Encoding": "gzip",
      },
      body: compressedPayload,
    }).catch(handleError);

    return response;
  };

  const handleTransporterChange = (event) => {
    if (event?.target?.value != "") {
      if (event?.target?.value.trim() != "Select All") {
        let filteredRows = data.filter(row => row["Transporter"]?.trim()?.toLowerCase() == event?.target?.value?.trim()?.toLowerCase());
        setFilteredData(filteredRows ? filteredRows : data);
      } else {
        setFilteredData(data);
      }
    }
    else {
      setFilteredData(data);
    }
    setselectedTransporter(event.target.value);

  };

  const makeAPICall = async () => {

    try {
      setLoader(true);
      setLabel('Processing Data....');
      const response = await sendGzippedPayload("/api/process", data);
      const responseData = await response.json();
      console.log("response data", responseData);
      setLoader(false);
      setLabel('');
      if (responseData) {
        setStatus(true);
      }
      const uniqueTransporter = [...new Set(responseData.map(obj => obj?.Transporter))];
      setData(responseData);
      setTransporters(uniqueTransporter);
      setFilteredData(responseData);


    }
    catch (e) {
      handleError();
    }
  }

  const downloadTemplate = () => {

  }
  const handleExport = () => {
    console.log(data)
    makeAPICall();
  }
  const handleClose = () => {
    setStatus(false);
    setError(false);

  }
  const downloadReport = () => {
    setStatus(false);
    const headings = [[
      'ID',
      '1',
      '2',
      '3',
      '4',
      '5',
      'Company'
    ]];

    const wb = utils.book_new();
    const ws = utils.json_to_sheet([]);
    utils.sheet_add_aoa(ws, headings);



    let reports = data;
    reports.forEach(object => {
      delete object['Link'];
    });
    utils.sheet_add_json(ws, reports, { origin: 'A2', skipHeader: true });
    utils.book_append_sheet(wb, ws, 'Report');
    if (transporters && transporters.length > 0) {
      const summaryHeadings = [[
        'S.no',
        'Company',
        'Cont Of Trips',
        'Sum Of Tons',
      ]];
      const ws1 = utils.json_to_sheet([]);
      utils.sheet_add_aoa(ws1, summaryHeadings);
      let summaryData = [];
      transporters.forEach((transporter, index) => {
        if(transporter && transporter?.trim()!=""){
          let selectedTransporters = data.filter(row => row["Transporter"]?.trim()?.toLowerCase() == transporter?.trim()?.toLowerCase());
          let totalTons = selectedTransporters.reduce(function (acc, obj) { return acc + (obj[5] ? obj[5] : 0); }, 0);
          var summaryObject = {
            'Company': transporter,
            'count': selectedTransporters ? selectedTransporters.length : 0,
            'tons': totalTons ? totalTons : 0
          }
          summaryData.push(summaryObject)
        }
       
      })
      utils.sheet_add_json(ws1, summaryData, { origin: 'A2', skipHeader: true });
      utils.book_append_sheet(wb, ws1, 'Summary');
    }
    writeFile(wb, 'Reports.xlsx');
  }
  const Loader = () => (
    <div className="spinner-container">
      <div className="spinner" title="Loading"></div>
      <div className="spinner-lable" >{label}</div>
    </div>
  )
  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });
  return (

    <div className="main-container">
      <Helmet>
        <title>Report Generator | Home</title>
      </Helmet>
      <div className="sidebar-container ">
        <Sidebar />
      </div>
      <div className="content-container mat-elevation-z7">
        <div className="action-container">

          <div className="button-container">
            <div className="button-container-left"  >
              <Button variant="outlined" startIcon={<DownloadForOfflineIcon />} onClick={downloadTemplate}>
                <a href={ReportSample} >Download Template</a>

              </Button>
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload file
                <VisuallyHiddenInput type="file" name="file" className="custom-file-input" id="inputGroupFile" required onChange={handleImport}
                  accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
              </Button>

              <Button disabled={!data || data && data.length <= 0} variant="outlined" startIcon={<LoopIcon />} onClick={handleExport}>
                Process
              </Button>
            </div>
            <div className="button-container-right"  >
              {/*
                (transporters && transporters.length > 0) &&
                <Button className="btn-select" variant="outlined" >
                  <Select className="select"
                    value={selectedTransporter}
                    onChange={handleTransporterChange}
                  >
                    {transporters.map((option, index) => (
                      <MenuItem key={index} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </Button>

                    */}
              <Button variant="outlined" disabled={!transporters || transporters && transporters.length <= 0} onClick={downloadReport} startIcon={<DownloadForOfflineIcon />} >
                Download Reports
              </Button>

            </div>



          </div>
        </div>
        <div className="grid-container">
          {<Snackbar open={isReportReady} autoHideDuration={6000} onClose={handleClose}>
            <Alert
              severity="success"
              action={
                <Button variant="outlined" startIcon={<DownloadForOfflineIcon />} onClick={downloadReport}>
                  Downlaod Reports
                </Button>
              }
            >
              Report is Ready To Download  download!
            </Alert></Snackbar>}


          {<Snackbar open={isProcessFailed} autoHideDuration={6000} onClose={handleClose}>
            <Alert severity="warning" onClose={() => { setError(false) }}>
              Server Error Please Try Again Later !
            </Alert></Snackbar>}

          {<ReportsGrid tableData={filteredData} isExportExcel={exportExcel} />}
          {isLoader && <Loader />}


        </div>

      </div>
    </div>

  );
};

export default App;