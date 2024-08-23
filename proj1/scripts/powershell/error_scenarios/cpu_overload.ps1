# This script simulates a server cpu overload after receiving a request,
# but before sending the reply and saving it to the persistence storage
# When this happens the System stays in an invalid state, because it won't be able to
# respond to requests, as the timeout the client has to receive them, is smaller than
# the time the server takes to process them

# get server code path
$server_code_path = Resolve-Path -LiteralPath '../../../src/server/Server.py'
$line_number = 230
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

# add code alteration to the server
$content = Get-Content $server_code_path
$content[$line_number-1] = "            time.sleep(5)"
$content | Set-Content $server_code_path


# set current path to server path and run server in separate shell
Push-Location $server_path
$server_process = start-process cmd -Argument '/c python .\Server.py 4444' -passthru
Pop-Location

# set current path to clients path
Push-Location $clients_path
python .\Subscriber.py $port 1 SUB topic # it should exit, because server takes to long to answer

Start-Sleep -Seconds $wait_time
python .\Subscriber.py $port 1 SUB topic
Pop-Location

# remove server code alteration
$content = Get-Content $server_code_path
$content[$line_number-1] = ""
$content | Set-Content $server_code_path
