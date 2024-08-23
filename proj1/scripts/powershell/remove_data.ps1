write-host "Deleting all data files and folders..."
$path = Resolve-Path -LiteralPath '../../src'
Get-ChildItem $path -Recurse -Filter 'data' | Remove-Item -Force -Recurse
write-host "Finish deleting data files and folders."