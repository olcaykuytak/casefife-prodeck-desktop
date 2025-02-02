const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('node:path');
const robot = require('robotjs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');

const settingsFilePath = path.join(app.getPath('userData'), 'all-data.json');

let mainWindow = null;
let tray = null;
const productId = '8038';
let serialPortStatus = null;

function createWindow () {
  mainWindow = new BrowserWindow({
    resizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: './img/cf.ico',
    width: 1473,
    height: 681,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.webContents.openDevTools();

  const macroData = [ 
    { "name": "macroBtn1", "key": "b" }, 
    { "name": "macroBtn2", "key": "m" }, 
    { "name": "macroBtn3", "key": "f12" }, 
    { "name": "macroBtn4", "key": "f13" }, 
    { "name": "macroBtn5", "key": "f14" }, 
    { "name": "macroBtn6", "key": "f15" },
    { "name": "macroBtn7", "key": "f16" }, 
    { "name": "macroBtn8", "key": "f17" }, 
    { "name": "macroBtn9", "key": "f18" }, 
    { "name": "macroBtn10", "key": "f19" }, 
    { "name": "macroBtn11", "key": "f20" }, 
    { "name": "macroBtn12", "key": "f21" }, 
    { "name": "macroBtn13", "key": "f22" }, 
    { "name": "macroBtn14", "key": "f23" }, 
    { "name": "macroBtn15", "key": "f24" }, 
    { "name": "macroBtn16", "key": "f25" }, 
    { "name": "macroBtn17", "key": '"' }, 
    { "name": "macroBtn18", "key": "*" }, 
    { "name": "macroBtn19", "key": "," }, 
    { "name": "macroBtn20", "key": "." } 
  ];
  
  macroData.forEach((macro) => {
    ipcMain.on(macro.name, () => {
      robot.keyTap(macro.key);
    });
  });

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  setTimeout(connectToSerialPort, 3000);
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'img/cf.ico'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Çıkış',
      click: () => {
        app.exit();
      },
    },
  ]);

  tray.on('click', () => {
    mainWindow.show();
  });

  tray.setToolTip('Casefife Prodeck');
  tray.setContextMenu(contextMenu);
}

async function connectToSerialPort() {
  try {
    const ports = await SerialPort.list();
    const portInfo = ports.find(p => p.productId === productId);
    if (!portInfo) {
      serialPortStatus = "disconnect";
      if (mainWindow) {
        mainWindow.webContents.send('serial-port-status', serialPortStatus);
      }
      setTimeout(connectToSerialPort, 1000);
      return;
    }

    const serialPort = new SerialPort({ path: portInfo.path, baudRate: 57600 });
    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    serialPort.on('open', () => {
      serialPortStatus = "connected";
      if (mainWindow) {
        mainWindow.webContents.send('serial-port-status', serialPortStatus);
      }

      const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
      fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading JSON file:', err);
          return;
        }
    
        // JSON verisini parse et
        const jsonData = JSON.parse(data);
    
        // settingsDeviceColor dizisini al
        const settingsDeviceColor = jsonData.settingsDeviceColor;
        const lightModeValue = jsonData.settingsDevice[0].lightMode;

        serialPort.write("SET," + lightModeValue + "\n");
        serialPort.write("SET,AL1\n");
    
        // Her bir item için veri gönder
        settingsDeviceColor.forEach(item => {
          const id = item.id;
          const color = item.color;

          const rgbValues = color.match(/\d+/g); // \d+ sayıları yakalar

          // Sonuç: ["255", "152", "0"]
          const formattedColor = rgbValues.join(","); // "255, 152, 0"

          serialPort.write("CUS," + id + "," + formattedColor + "\n");
          console.log("CUS," + id + "," + formattedColor + "\n");
        });
      });
    });

    serialPort.on('close', () => {
      serialPortStatus = "disconnect";
      if (mainWindow) {
        mainWindow.webContents.send('serial-port-status', serialPortStatus);
      }
      setTimeout(connectToSerialPort, 1000);
    });

    serialPort.on('data', function (data) {
      const dataSp = data.toString().trim();
      console.log(dataSp);
      if (mainWindow) {
        mainWindow.webContents.send('serial-port-data', dataSp);
      }
    });

    ipcMain.on('get-serial-port-status', (event, data) => {
      if (mainWindow) {
        mainWindow.webContents.send('serial-port-status', serialPortStatus);
      }
    });

    ipcMain.on('checkboxLightSP', (event, data) => {
      if (data === "AL1") {
        serialPort.write('SET,AL1\n');
      } else if (data === "AL0") {
        serialPort.write('SET,AL0\n');
      }
    });

    ipcMain.on("lightMode", (event, data) => {
      if( data === "STATIC") {
        serialPort.write('SET,STATIC\n');
      }else if( data === "FADE") {
        serialPort.write('SET,FADE\n');
      }else if( data === "RAINBOW") {
        serialPort.write('SET,RAINBOW\n');
      }
    });

    ipcMain.on("ledColor", (event, id, data) => {
      //serialPort.write(id +", " + data);
      serialPort.write("CUS," + id + "," + data);
      console.log("CUS," + id + ","  + data);
    });
  } catch (error) {
    console.error('Error connecting to serial port:', error);
    serialPortStatus = "error";
    if (mainWindow) {
      mainWindow.webContents.send('serial-port-status', serialPortStatus);
    }
    setTimeout(connectToSerialPort, 1000);
  }
}

/*SOUND EFFECT.HTML KODLAR*/

ipcMain.handle('get-json-data', async () => {
  // JSON dosyasının yolunu belirliyoruz
  const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
  
  // Dosyayı okuyup JSON formatında parse ediyoruz
  try {
      const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
      return JSON.parse(jsonData);
  } catch (error) {
      console.error('JSON dosyası okunamadı:', error);
      return null;
  }
});

ipcMain.handle('update-sound-effect', async (event, { id, keybind, volume, color }) => {
  try {
    // JSON dosyasını oku
    const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
    const data = await fs.promises.readFile(jsonFilePath, 'utf8');

    // Dosyanın boş olup olmadığını kontrol et
    if (!data || data.trim().length === 0) {
      throw new Error("JSON dosyası boş veya eksik.");
    }

    let jsonData = JSON.parse(data);

    const soundEffect = jsonData.soundEffect.find(effect => effect.id === Number(id));

    if (soundEffect) {
      // volume değerini güncelle
      soundEffect.keybind = String(keybind);
      soundEffect.volume = String(volume);  // Volume string olarak tutuluyor
      soundEffect.color = String(color);
    } else {
      console.log("İlgili id bulunamadı.");
      return 'İlgili id bulunamadı.';
    }

    // Güncellenmiş JSON'u dosyaya yaz
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

    // Diğer işlemler
  } catch (error) {
    console.error('Hata:', error);
    return 'Güncelleme sırasında hata oluştu: ' + error.message;
  }
});

/*SETTINGS.HTML KODLAR*/

ipcMain.handle('settings-json-data', async () => {
  // JSON dosyasının yolunu belirliyoruz
  const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
  
  // Dosyayı okuyup JSON formatında parse ediyoruz
  try {
      const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
      return JSON.parse(jsonData);
  } catch (error) {
      console.error('JSON dosyası okunamadı:', error);
      return null;
  }
});

ipcMain.handle('settings-json-update', async (event, { id, lightMode }) => {
  try {
    const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
    const data = await fs.promises.readFile(jsonFilePath, 'utf8');

    // Dosyanın boş olup olmadığını kontrol et
    if (!data || data.trim().length === 0) {
      throw new Error("JSON dosyası boş veya eksik.");
    }

    let jsonData = JSON.parse(data);

    const settingsUpdate = jsonData.settingsDevice[0];

    if (settingsUpdate) {
      // volume değerini güncelle
      settingsUpdate.lightMode = String(lightMode);  
    } else {
      console.log("İlgili id bulunamadı.");
      return 'İlgili id bulunamadı.';
    }

    console.log(settingsUpdate);

    await fs.promises.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

  } catch (error) {
    
  }
});

ipcMain.handle('settings-color-data', async () => {
  // JSON dosyasının yolunu belirliyoruz
  const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
  
  // Dosyayı okuyup JSON formatında parse ediyoruz
  try {
      const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
      return JSON.parse(jsonData);
  } catch (error) {
      console.error('JSON dosyası okunamadı:', error);
      return null;
  }
});

ipcMain.handle('settings-color-update', async (event, { id, colorName }) => {
  try {
    // JSON dosyasını oku
    const jsonFilePath = path.join(app.getPath('appData'), 'testert', 'all-data.json');
    const data = await fs.promises.readFile(jsonFilePath, 'utf8');

    // Dosyanın boş olup olmadığını kontrol et
    if (!data || data.trim().length === 0) {
      throw new Error("JSON dosyası boş veya eksik.");
    }

    let jsonData = JSON.parse(data);

    const settingsDeviceColor = jsonData.settingsDeviceColor.find(effect => effect.id === Number(id));

    if (settingsDeviceColor) {
      settingsDeviceColor.color = colorName;
    } else {
      console.log("İlgili id bulunamadı.");
      return 'İlgili id bulunamadı.';
    }

    // Güncellenmiş JSON'u dosyaya yaz
    await fs.promises.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

    // Diğer işlemler
  } catch (error) {
    console.error('Hata:', error);
    return 'Güncelleme sırasında hata oluştu: ' + error.message;
  }
});

////////////////////////////

///////////////////////////

app.whenReady().then(() => {
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
