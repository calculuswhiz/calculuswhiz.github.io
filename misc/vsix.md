Installing VSIX packages the hard way (VS 2017)
===============================================

Tools I used: PowerShell, Node.js, and 7zip

At work, I don't have an Internet connection. This is a rather troublesome thing because it leaves me unable to install Visual Studio packages at my discretion. And even if you did manage to get the .VSIX packages downloaded, you'd **still** have to be connected to install the packages.

However, VS2017 does allow you to specify your own package server. This means that even http://localhost works! So as long as you're allowed to run an http server at localhost, you're off to a good start!

If you go to Tools>Extensions and Updates, you can add a connection. For my custom connection I used http://localhost:31415. When we set everything up, the downloadable vsix packages will appear under the 'Online' menu.

## Setting up an Atom feed

Unfortunately, you can't just serve a directory listing of vsix files. The Updater specifically requires an [Atom feed](https://docs.microsoft.com/en-us/visualstudio/extensibility/how-to-create-an-atom-feed-for-a-private-gallery?view=vs-2017). Fortunately, Microsoft tells us how to make one. Using this template, we can generate a proper atom.xml file.

Using this template, we can generate an xml file using powershell. Yes, I am aware Expand-Archive is a thing. If you can't get 7-zip I suggest you modify the script. Remember that Expand-Archive only accepts .zip files (as in the extension name).

```powershell
# Generates a fresh atom.xml file
param($Directory = ".")

if (-not (Test-Path "C:\Program Files\7-Zip"))
{
  Write-Host -ForegroundColor Red "This script requires 7-zip to run. Please install it."
  return
}

# Encode escape characters properly for xml output
Add-Type -AssemblyName System.Web
$HttpUtility = [System.Web.HttpUtility]

Write-Host "Erasing backup atom.xml~"
Remove-Item atom.xml~ -ErrorAction Continue

Write-Host "Creating backup atom.xml~"
Rename-Item atom.xml atom.xml~ -ErrorAction Continue

Write-Host "Creating atom.xml"
New-Item -Name atom.xml -ItemType File

Write-Host "Writing Contents..."
Add-Content -Encoding UTF8 -Path .\atom.xml -Value @"
<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated with Generate-Atomfeed.ps1 -->
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text" />
  <id>uuid:bcecded5-97c8-4d24-96f1-7d9e16652433;id=1</id>
  <updated>$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")</updated>
"@

Get-ChildItem "$Directory\*.vsix" | ForEach-Object -Process (
{
  $filename = $_.Name
  Write-Host "Reading $filename..."
  
  # Parse file
  $fileContents = [xml](& 'C:\Program Files\7-Zip\7z.exe' e $_ extension.vsixmanifest -so)
  
  $metadata = $fileContents.PackageManifest.Metadata
  
  $id = $HttpUtility::HtmlEncode($metadata.Identity.GetAttribute("Id"))
  $version = $HttpUtility::HtmlEncode($metadata.Identity.GetAttribute("Version"))
  $publisher = $HttpUtility::HtmlEncode($metadata.Identity.GetAttribute("Publisher"))
  
  $title = $HttpUtility::HtmlEncode($metadata.DisplayName.ToString())
  $description = $HttpUtility::HtmlEncode($metadata.Description.InnerText)
  
  $outXML = @"
  <entry>
    <id>$id</id>
    <title type="text">$title</title>
    <summary type="text">$description</summary>
    <author>
      <name>$pulisher</name>
    </author>
    <content type="application/octet-stream" src="$filename" />
    <Vsix xmlns="http://schemas.microsoft.com/developer/vsx-syndication-schema/2010" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="$version">
      <Id>$id</Id>
      <Version>$version</Version>
      <References />
      <Rating xsi:nil="true" />
      <RatingCount xsi:nil="true" />
      <DownloadCount xsi:nil="true" />
    </Vsix>
  </entry>
"@
  Add-Content -Encoding UTF8 -Path .\atom.xml -Value $outXML
})

Add-Content -Encoding UTF8 -Path .\atom.xml -Value "</feed>"
Write-Host "Complete."
Get-ChildItem .\atom.xml
```

When you run this in the folder containing your VSIX packages, it generates the atom.xml file in that directory.

## Setting up the Node.js server

A basic Node.js server looks like this:

```es6
const http = require('http')
const port = 31415;
const host = 'localhost';

let server = http.createServer((req, res) => {});
server.listen(port, host);
```
If you can run this, this means you can set up the server.

The server code I used looks like:
```es6
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
```

When you run this in Node.js, it will start up the http server on port 31415. You should then be able to install these packages.
