const { BrowserWindow, Tray, Menu, app, globalShortcut, nativeImage, ipcMain } = require('electron');
const { exec } = require('child_process');
const parser = require('fast-xml-parser');

let win = null;
let tray = null;
let menuToBeShown = {};
app.on("ready", () => {
    // Hide window and BrowserWindow
    app.dock.hide();
    win = new BrowserWindow({
        width: 0,
        height: 0,
        frame: false,
        resizable: false
    });
    win.loadURL("file://" + __dirname + "/notifications.html");

    // Create Tray
    tray = new Tray(nativeImage.createEmpty());
    tray.setTitle("Batteries");

    // Show tray mecanics
    tray.on("click", () => {
        tray.popUpContextMenu(menuToBeShown);
    });

    globalShortcut.register("Command+Control+Shift+D", () => {
        tray.popUpContextMenu(menuToBeShown);
    });

    // Data Updates
    setMenuContent(tray);
});

// Unregister everything
app.on("will-quit", () => {
    win.destroy();
    tray.destroy();
    globalShortcut.unregisterAll();
});

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function setMenuContent(tray) {
    updateMenuToBeShown(tray);
    setInterval(() => {
        updateMenuToBeShown(tray);
    }, 15 * 60 * 1000); // 10 minutes
}

function updateMenuToBeShown(tray) {
    execute("system_profiler SPBluetoothDataType -xml", (xml) => {
        let json = parser.parse(xml);
        let arr = json.plist.array.dict.array[1].dict.array[0].dict.map((item) => {
            item.dict = objectFromKeyValues(item.dict.key, item.dict.string);
            if (item.dict.device_batteryPercent) {
                return {
                    name: item.key,
                    value: item.dict.device_addr
                };
            }
        });
        arr.clean(undefined);
        console.log(arr);
        let menuTemplate = [];
        arr.forEach((item) => {
            if (menuTemplate.length > 0) {
                menuTemplate.push({
                    type: 'separator'
                });
            }
            menuTemplate.push({
                label: item.name,
                enabled: false
            }, {
                label: item.value
            });

            if (Number(item.value.replace("%", "")) <= 5) {
                win.webContents.send("critical-battery", 5);
            }else if (Number(item.value.replace("%", "")) <= 10) {
                win.webContents.send("low-battery", 10);
            }
        });
        menuToBeShown = Menu.buildFromTemplate(menuTemplate);
    });
}

function objectFromKeyValues(keys, values) {
    let obj = Object.create(null);

    for (var i = 0; i < keys.length; i++) {
        obj[keys[i]] = values[i];
    }

    return obj;
}

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
}
