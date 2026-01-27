const { contextBridge, shell } = require('electron');

contextBridge.exposeInMainWorld('api', {
    openExternal: (url) => shell.openExternal(url)
});
