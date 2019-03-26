'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 31415;
const host = 'localhost';

const mimeTypeMap = 
{
  // Note: you can generate your own raw list of mimeTypes with the PowerShell command:
  // Get-ChildItem -Path Registry::HKEY_CLASSES_ROOT | Where-Object {$_.GetValue("Content Type") -ne $null} | ForEach-Object -Process {"$($_.Name) $($_.GetValue(`"Content Type`"))"} > mimeTypes.txt
  // But this is really the only one that matters here:
  '.vsix' : 'application/vsix'
};

let server = http.createServer((req, res) => 
{
  // Relative to root
  let myUrl = unescape(req.url);
  let hostName = `http://${req.headers.host}`;
  let rootDir = __dirname;
  let filePath = hostName + myUrl;
  
  let isDir;
  try
  {
    isDir = fs.lstatSync(rootDir + '/' + myUrl).isDirectory();
  }
  catch (exc)
  {
    console.error(exc);
    return;
  }
  
  if (isDir && myUrl !== '/')
  {
    // DO NOTHING
  }
  else if (myUrl === '/')
  {
    fs.readFile('./atom.xml', 'utf8', (err, data) =>
    {
      if (err)
      {
        throw err;
      }
      console.log('Got atom feed.');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.write(data);
      res.end();
    });
  }
  else
  {
    let extName = path.extname(myUrl);
    let mimeType = mimeTypeMap[extName] || 'text/plain';
    
    console.log(`GET ${myUrl}: ${mimeType}`);
    
    let fileContents = '';
    
    try
    {
      fileContents = fs.readFileSync(`.${myUrl}`);
    }
    catch (exc)
    {
      console.error(exc);
    }
    
    res.writeHead(200, { 'Content-Type' : mimeType });
    res.write(fileContents);
    res.end();
  }
});
server.listen(port, host);
