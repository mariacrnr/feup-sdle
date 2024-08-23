# This script simulates a data integrity error, where a server gets their communication
# data corrupted, more specificaly the sequence number of a given publisher
# When this happens, the publisher is no longer available to make requests to the server,
# having its service unavailable

# get server code path
$server_code_path = Resolve-Path -LiteralPath '../../../src/server/Server.py'
$line_number = 14
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

Pop-Location

Start-Sleep -Seconds $wait_time
$server_data_path = Resolve-Path -LiteralPath '../../../src/data/server/topics.json'

# alter sequence number in the server data
$content = Get-Content $server_data_path
$content[$line_number-1] = '                "seq": 4'
$content | Set-Content $server_data_path

# set current path to server path and run server in separate shell
Push-Location $server_path
$server_process = start-process cmd -Argument '/c python .\Server.py 5555' -passthru
Pop-Location

# set current path to clients path
Push-Location $clients_path

Start-Sleep -Seconds $wait_time
python .\Publisher.py 5555 1 topic msg3  # it sholdn't work, as the seq numbers are corrupted

Pop-Location

# remove server code alteration
$content = Get-Content $server_data_path
$content[$line_number-1] = '                "seq": 2'
$content | Set-Content $server_data_path
