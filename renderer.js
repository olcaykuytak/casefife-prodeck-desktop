const { ipcRenderer } = require('electron');

let statusConn = document.querySelector('#status');
let disconnectCount = 0;

ipcRenderer.send('get-serial-port-status');

ipcRenderer.on('serial-port-status', (event, serialPortStatus) => {
    if(serialPortStatus == "connected"){
        setTimeout(function() { document.getElementById("intro").style.display = "none"; }, 500);
        document.getElementById("no-connecting").style.display = "none";
        statusConn.classList.remove('disconnect');
        statusConn.classList.add('connect');
        console.log("bagli");
        disconnectCount = 0;
    }else if(serialPortStatus == "disconnect") {
        if(disconnectCount == 1) {
            document.getElementById("intro").style.display = "none";
            document.getElementById("no-connecting").style.display = "flex";
            statusConn.classList.remove('connect');
            statusConn.classList.add('disconnect');
            console.log("baglanti yok: " + disconnectCount);
        }else {
            setTimeout(function() { document.getElementById("intro").style.display = "none"; }, 3000);
            document.getElementById("no-connecting").style.display = "flex";
            statusConn.classList.remove('connect');
            statusConn.classList.add('disconnect');
            console.log("baglanti yok: " + disconnectCount);
            disconnectCount = 1;
        }
    }
});

const checkboxLight = document.getElementById('app-center-area-bottom-item-light-toggle');
        
if (checkboxLight.checked) {
  ipcRenderer.send('checkboxLightSP', 'AL1');
}
    
checkboxLight.addEventListener('change', () => {
    if (checkboxLight.checked) {
        ipcRenderer.send('checkboxLightSP', 'AL1');
    } else {
        ipcRenderer.send('checkboxLightSP', 'AL0');
    }
});

const checkboxFunctional = document.getElementById('app-center-area-bottom-item-function-toggle');
    
if (checkboxFunctional.checked) {
    //serialPort.write('AF1\n');
}
    
checkboxFunctional.addEventListener('change', () => {
    if (checkboxFunctional.checked) {
        //serialPort.write('AF1\n');
    } else {
        //serialPort.write('AF0\n');
    }
});

//settings.html KODLARI//


