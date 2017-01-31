const { ipcRenderer } = require("electron");

ipcRenderer.on("low-battery", (event, percent) => {
    new Notification("Low battery", {
        body: "A Bluetooth device has less than " + percent + "% left",
        silent: true
    });
});

ipcRenderer.on("critical-battery", (event, percent) => {
    new Notification("Critical battery level", {
        body: "A Bluetooth device has less than " + percent + "% left",
        silent: false
    });
});
