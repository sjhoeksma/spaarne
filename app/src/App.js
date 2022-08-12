import React, { useEffect, useState } from 'react';
import MaterialTable, { MTableBodyRow }  from 'material-table';
import './App.css';
import axios from 'axios';
import { Alert, AlertTitle,Autocomplete} from '@material-ui/lab'
import { TextField} from '@material-ui/core'
import ActivityDetector from 'react-activity-detector';

var url = "http://localhost:1323/data/"
if (process.env.NODE_ENV === 'production') {
  url = "/data/"
}

var idleTimer = 0

const App = () => {

  const [booking, setBooking] = useState([]);
  const [boat, setBoat] = useState([]);
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState([]);
  const [iserror, setIserror] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  let columns = [
    { title: 'State', field: 'state' , editable : 'never' },
    { title: 'Boat', field: 'boat', editable : 'onAdd',
     editComponent: props => (
     <Autocomplete
          freeSolo
          id="boats"
          options={boat}
          value={props.value}
          renderInput={params => {
            return (
              <TextField
                {...params}
                fullWidth
              />
            );
          }}
          onChange={e =>{if (e) props.onChange(e.target.innerText)}}
          onInputChange={e =>{if (e) props.onChange(e.target.value)}}
        />)
    },
    { title: 'Date', field: 'date' ,  type : 'date', defaultSort : 'desc'},
    { title: 'Time', field: 'time', sorting :false, 
      // type : 'time',
      initialEditValue : "09:30",
      lookup: {
        "08:00" : "08:00",  "08:15" : "08:15", "08:30" : "08:30", "08:45" : "08:45",
        "09:00" : "09:00",  "09:15" : "09:15", "09:30" : "09:30", "09:45" : "09:45",
        "10:00" : "10:00",  "10:15" : "10:15", "10:30" : "10:30", "10:45" : "10:45",
        "11:00" : "11:00",  "11:15" : "11:15", "11:30" : "11:30", "11:45" : "11:45",
        "12:00" : "12:00",  "12:15" : "12:15", "12:30" : "12:30", "12:45" : "12:45",
        "13:00" : "13:00",  "13:15" : "13:15", "13:30" : "13:30", "13:45" : "13:45",
        "14:00" : "14:00",  "14:15" : "14:15", "14:30" : "14:30", "14:45" : "14:45",
        "15:00" : "15:00",  "15:15" : "15:15", "15:30" : "15:30", "15:45" : "15:45",
        "16:00" : "16:00",  "16:15" : "16:15", "16:30" : "16:30", "16:45" : "16:45",
        "17:00" : "17:00",  "17:15" : "17:15", "17:30" : "17:30", "17:45" : "17:45",
        "18:00" : "18:00",  "18:15" : "18:15", "18:30" : "18:30", "18:45" : "18:45",
        "19:00" : "19:00",  "19:15" : "19:15", "19:30" : "19:30", "19:45" : "19:45",
        "20:00" : "20:00",  "20:15" : "20:15", "20:30" : "20:30", "20:45" : "20:45",
        "21:00" : "21:00",  "21:15" : "21:15", "21:30" : "21:30", "21:45" : "21:45",
        "22:00" : "22:00",  "22:15" : "22:15", "22:30" : "22:30", "22:45" : "22:45",
        "07:00" : "07:00",  "07:15" : "07:15", "07:30" : "07:30", "07:45" : "07:45",
        "06:00" : "06:00",  "06:15" : "06:15", "06:30" : "06:30", "06:45" : "06:45",
        "05:00" : "05:00",  "05:15" : "05:15", "05:30" : "05:30", "05:45" : "05:45"
       }
     },
    { title: 'Duration', field: 'duration', type : 'numeric', sorting :false ,initialEditValue : 90, 
      lookup: {60: 60, 75: 75, 90: 90, 105: 105, 120: 120}  },
    { title: 'User', field: 'user',  
     editComponent: props => (
      <Autocomplete
           freeSolo
           id="username"
           options={users.length!==0 ? users : refreshUsers()}
           getOptionLabel={(option) => { 
            return (!option || typeof option === "string" || option instanceof String) ? option: option.user
          }}
           value={props.value}
           onChange={(e,v) =>{
            if (e && e.target && e.target.innerText) {
              for(var i=0; i<users.length; i++) {
                if (users[i]["user"] === e.target.innerText.toUpperCase() && 
                  props.rowData["password"] !== users[i]["password"]) {
                    props.rowData["password"] = users[i]["password"]
                }
              }
              props.onChange(e.target.innerText)
            } else {
              props.onChange(v)
            }
          }}
           onInputChange={(e,v) =>{
            if (e && e.target && e.target.value) {
              for(var i=0; i<users.length; i++) {
                if (users[i]["user"] === e.target.value.toUpperCase() && 
                  props.rowData["password"] !== users[i]["password"]) {
                    props.rowData["password"] = users[i]["password"]
                }
              }
               props.onChange(e.target.value)
            } else {
              props.onChange(v)
            }
          }}
          renderInput={(params) => (
            <TextField {...params}  
            fullWidth
            />
           )}
         />)
    },
    { title: 'Password', field: 'password', sorting :false , 
      render: rowData => <p>{rowData.password.split('').map(() => '*')}</p>,
      editComponent: props => (
        <TextField 
            type="password"
            value={props.value}
            onChange={e => props.onChange(e.target.value)} 
        />) },
    { title: 'Comment', field: 'comment', editable : 'onAdd', sorting :false },
    { title: 'Message', field: 'message', editable : 'never', sorting :false  },
    { title: 'UserComment', field: 'usercomment', type : 'boolean', hidden: true  },
    { title: 'Id', field: 'id', hidden: true },
  ]

  const refreshData = () =>{
    axios.get(`${url}booking`)
    .then(res => {
      const booking = res.data;
      setBooking(booking);
      //console.log(booking);
    })
    //return booking
  }

  const refreshBoat = () =>{
    axios.get(`${url}boat`)
    .then(res => {
      const boat = res.data;
      setBoat(boat);
      //console.log(boat);
    })
    //return boat
  }

  const refreshConfig = () =>{
    axios.get(`${url}config`)
    .then(res => {
      const config = res.data;
      setConfig(config);
      //console.log(config);
    })
    //return config
  }

  const refreshUsers = () =>{
    axios.get(`${url}users`)
    .then(res => {
      const users = res.data;
      setUsers(users);
      //console.log(users);
    })
    return users
  }
  useEffect(() => {
    refreshData()
    refreshBoat()
    refreshConfig()
   }, [])
 

  //function for updating the existing row details
  const handleRowUpdate = (newData, oldData, resolve,reject) => {
    //validating the data inputs
    let errorList = []
    if (!('password' in newData) || newData.password === ""  || newData.password === null) {
      errorList.push("Try Again, You didn't enter the Password field")
    }
    if (!('user' in newData) || newData.user === "" || newData.user == null) {
      errorList.push("Try Again, You didn't enter the User field")
    } else  {
     newData.user = newData.user.toUpperCase() 
    }
    if (!('boat' in newData) || newData.boat === "" || newData.boat === null) {
      errorList.push("Try Again, You didn't enter the Boat field")
    }
    if (!('date' in newData) || newData.date === ""  || newData.date === null) {
      errorList.push("Try Again, You didn't enter a valid Date field")
    }

    if (!('time' in newData) || newData.time === "" ) {
      errorList.push("Try Again, You didn't enter a valid  Time field")
    }
    if (!('duration' in newData) || newData.duration === "") {
      errorList.push("Try Again, You didn't enter the Duration field")
    } else {
      newData.duration = parseInt(newData.duration)
    }

    if (errorList.length < 1) {
      newData.usercomment = oldData.usercomment || oldData.commment !== newData.comment
      axios.put(`${url}booking/${newData.id}`, newData)
        .then(response => {
          const data = response.data;
          setBooking(data);
          setIserror(false)
          setErrorMessages([])
          resolve()
        })
        .catch(error => {
          setErrorMessages(["Update failed! Server error"])
          setIserror(true)
          reject()
        })
    } else {
      setErrorMessages(errorList)
      setIserror(true)
      reject()
    }
  }


  //function for deleting a row
  const handleRowDelete = (oldData, resolve,reject) => {
    axios.delete(`${url}booking/${oldData.id}`)
      .then(response => {
        const data = response.data;
        setBooking(data);
        setIserror(false)
        setErrorMessages([])
        resolve()
      })
      .catch(error => {
        setErrorMessages(["Delete failed! Server error"])
        setIserror(true)
        reject()
      })
  }


  //function for adding a new row to the table
  const handleRowAdd = (newData, resolve, reject) => {
    //validating the data inputs
    let errorList = []
    if (!('password' in newData) || newData.password === ""  || newData.password === null) {
      errorList.push("Try Again, You didn't enter the Password field")
    }
    if (!('user' in newData) || newData.user === "" || newData.user === null) {
      errorList.push("Try Again, You didn't enter the User field")
    } else  {
     newData.user = newData.user.toUpperCase() 
    }
    if (!('boat' in newData) || newData.boat === "" || newData.boat === null) {
      errorList.push("Try Again, You didn't enter the Boat field")
    }
    if (!('date' in newData) || newData.date === "" || newData.date === null) {
      errorList.push("Try Again, You didn't enter the Date field")
    }
    if (!('time' in newData) || newData.time === "") {
      errorList.push("Try Again, You didn't enter the Time field")
    }
    if (!('duration' in newData) || newData.duration === "") {
      errorList.push("Try Again, You didn't enter the Duration field")
    } else {
      newData.duration = parseInt(newData.duration)
    }

    if (errorList.length < 1) {
      axios.post(`${url}booking`, newData)
        .then(response => {
          const data = response.data;
          setBooking(data);
          setErrorMessages([])
          setIserror(false)
          resolve()
        })
        .catch(error => {
          setErrorMessages(["Cannot add data. Server error!"])
          setIserror(true)
          reject()
        })
    } else {
      setErrorMessages(errorList)
      setIserror(true)
      reject()
    }
  }

  const customActivityEvents = [
    'click', 'keydown', 'mousedown', 'touchstart', 'focus'
  ];

  const onIdle = () => {
    //Refresh data every minute
    idleTimer = setInterval(refreshData, 60000)
  }

  const onActive = () => {
    if (idleTimer !== 0) {
      clearInterval(idleTimer);
      refreshData()
      refreshBoat()
    }
    idleTimer=0
  }

  return (
    <div className="app">
      <ActivityDetector activityEvents={customActivityEvents} enabled={true} timeout={30*1000} onIdle={onIdle} onActive={onActive}/>
      <MaterialTable
        title={<div className="MTableToolbar-title-9"><img src="favicon.ico" height="25" alt=""></img><h6 className="MuiTypography-root MuiTypography-h6" style={{"whiteSpace": "nowrap", "overflow": "hidden", "textOverflow": "ellipsis"}}>&nbsp;MyFleet Robot</h6></div>}
        columns={columns}
        data={booking}
        options={{
          headerStyle: { borderBottomColor: 'red', borderBottomWidth: '3px', fontFamily: 'verdana' },
          actionsColumnIndex: -1,
          paging: false,
          showTitle:true,
          draggable:false,
          addRowPosition : "first",
          rowStyle: rowData => ({
            backgroundColor: (selectedRow === rowData.tableData.id) ? '#EEE' : '#FFF'
          }), 
        }}
        components={{
          Row: props => (
            <MTableBodyRow
              {...props}
              onDoubleClick={(e) => {
                props.actions[1]().onClick(e,props.data);
              }}
           />
          )
        }}
        onRowClick={((evt, selectedRow) => setSelectedRow(selectedRow.tableData.id))}
        editable={{
          isEditable: rowData => (!rowData || !(rowData.state === 'Finished' || rowData.state === 'Cancel' || rowData.state === 'Confirmed')), // only editable if not finished
          onRowUpdate: (newData, oldData) =>
            new Promise((resolve,reject) => {
              handleRowUpdate(newData, oldData, resolve,reject);
            }),
          onRowAdd: (newData) =>
            new Promise((resolve,reject) => {
              handleRowAdd(newData, resolve,reject)
            }),
          onRowDelete: (oldData) =>
            new Promise((resolve,reject) => {
              handleRowDelete(oldData, resolve,reject)
            }),
          onRowAddCancelled: (rowData) =>
            new Promise((resolve,reject) => {
              setErrorMessages([])
              setIserror(false)
              resolve()
          }),
          onRowUpdateCancelled: (rowData) =>
            new Promise((resolve,reject) => {
              setErrorMessages([])
              setIserror(false)
              resolve()
          }),
        }}
      />

      <div>
        {iserror &&
          <Alert severity="error">
            <AlertTitle>ERROR</AlertTitle>
            {errorMessages.map((msg, i) => {
              return <div key={i}>{msg}</div>
            })}
          </Alert>
        }
      </div>
      <small className="version">v {config && config.version ? config.version : "?.?.?"}</small>
    </div>
  );
}

export default App;
