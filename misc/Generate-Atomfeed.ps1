# Generates a fresh atom.xml file
param($Directory = ".")

# Encode escape characters properly for xml output
Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.IO.Compression.FileSystem

$HttpUtility = [System.Web.HttpUtility]
# Removed dependency on 7-zip
$ZipFile = [System.IO.Compression.ZipFile]
$ZipFileExtensions = [System.IO.Compression.ZipFileExtensions]

Write-Host "Erasing backup atom.xml~"
Remove-Item $Directory\atom.xml~ -ErrorAction Continue

Write-Host "Creating backup atom.xml~"
Rename-Item $Directory\atom.xml $Directory\atom.xml~ -ErrorAction Continue

Write-Host "Creating atom.xml"
New-Item -Name $Directory\atom.xml -ItemType File

Write-Host "Writing Contents..."
Add-Content -Encoding UTF8 -Path $Directory\atom.xml -Value @"
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
  $vsix = $ZipFile::OpenRead($_)
  $vsix.Entries | Where-Object { $_.Name -eq "extension.vsixmanifest" } | ForEach-Object -Process (
  {
    $ZipFileExtensions::ExtractToFile($_, "C:\Temp\tempManifest", $true)
  })
  $vsix.Dispose()
  $fileContents = [xml](Get-Content C:\Temp\tempManifest -Encoding UTF8)
  
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
