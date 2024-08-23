write-host "Deleting all pycache files and folders..."
$path = Resolve-Path -LiteralPath '../../'
Get-ChildItem $path -Recurse -Filter '__pycache__' | Remove-Item -Force -Recurse
write-host "Finish deleting pycache files and folders."