Set WshShell = CreateObject("WScript.Shell")
appDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Start node server in a normal (visible) window titled "LM Passo Server"
' Window style 2 = minimized, 1 = normal
WshShell.Run "cmd /k ""title LM Passo - Servidor & cd /d """ & appDir & """ & node server.js""", 2, False

' Wait 1 second for server to start
WScript.Sleep 1000

' Open browser
WshShell.Run "http://localhost:3000"
