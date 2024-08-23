# This script simulates a server crash after receiving and processing a request,
# but before saving it to the persistence storage
# When this happens the System stays in an invalid state and it will accept duplicate requests

# get server code path
$server_code_path = Resolve-Path -LiteralPath '../../../src/server/Server.py'
$line_number = 233
$port = 4444
$wait_time = 2

# get server and clients paths
$server_path = Resolve-Path -LiteralPath '../../../src/server'
$clients_path = Resolve-Path -LiteralPath '../../../src/client'
$scripts_path = Resolve-Path -LiteralPath '../../../scripts/powershell'

# set current path to server path and run server in separate shell
Push-Location $scripts_path
.\remove_data.ps1
.\remove_pycache.ps1
Pop-Location

# set current path to server path and run server in separate shell
Push-Location $server_path
$server_process = start-process cmd -Argument '/c python .\Server.py 4444' -passthru
Pop-Location

# set current path to clients path and set up message environment
Push-Location $clients_path

python .\Subscriber.py $port 1 SUB topic

Start-Sleep -Seconds $wait_time
python .\Publisher.py $port 1 topic msg

Start-Sleep -Seconds $wait_time
python .\Publisher.py $port 1 topic msg2

Start-Sleep -Seconds $wait_time
python .\Publisher.py $port 1 topic msg3

Start-Sleep -Seconds $wait_time
python .\Subscriber.py $port 1 GET topic

Pop-Location

# killing server to create server with altered code
# Start-sleep -Seconds $wait_time
# Stop-Process -Id $server_pid -Force
# taskkill /PID $server_pid.Id /F
# $server_process.kill()
# Start-sleep -Seconds $wait_time

# add code alteration to the server
$content = Get-Content $server_code_path
$content[$line_number-1] = "            sys.exit()"
$content | Set-Content $server_code_path

# set current path to server path and run server in separate shell
Push-Location $server_path
start powershell {python .\Server.py 5555; Read-Host}
Pop-Location

# set current path to clients path and retrieve a message
Push-Location $clients_path
python .\Subscriber.py 5555 1 GET topic # triggers the server crash
Pop-Location

Start-Sleep -Seconds $wait_time

# remove server code alteration
$content = Get-Content $server_code_path
$content[$line_number-1] = ""
$content | Set-Content $server_code_path

# set current path to server path and run server in separate shell
Push-Location $server_path
start powershell {python .\Server.py 6666; Read-Host}
Pop-Location

Start-Sleep -Seconds $wait_time

Push-Location $clients_path
python .\Subscriber.py 6666 1 GET topic # it shouldn't work, because now sequence numbers are not the same
Pop-Location
