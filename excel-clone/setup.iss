[Setup]
AppName=Excel Clone
AppVersion=1.0
DefaultDirName={pf}\ExcelClone
DefaultGroupName=Excel Clone
OutputDir=output
OutputBaseFilename=ExcelCloneSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin

[Files]
Source: "excel-clone.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "*\node_modules\*\node_modules\*"
Source: "public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Excel Clone"; Filename: "{app}\excel-clone.exe"
Name: "{commondesktop}\Excel Clone"; Filename: "{app}\excel-clone.exe"

[Run]
Filename: "{app}\excel-clone.exe"; Description: "Run Excel Clone"; Flags: postinstall nowait skipifsilent unchecked
Filename: "http://localhost:3000"; Description: "Open in browser"; Flags: postinstall shellexec nowait skipifsilent unchecked

[Registry]
Root: HKCR; Subkey: ".csv\OpenWithProgids"; ValueType: string; ValueName: "ExcelClone.csv"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "ExcelClone.csv"; ValueType: string; ValueName: ""; ValueData: "CSV File"; Flags: uninsdeletekey
Root: HKCR; Subkey: "ExcelClone.csv\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\excel-clone.exe,0"
Root: HKCR; Subkey: "ExcelClone.csv\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\excel-clone.exe"" ""%1"""

Root: HKCR; Subkey: ".xlsx\OpenWithProgids"; ValueType: string; ValueName: "ExcelClone.xlsx"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "ExcelClone.xlsx"; ValueType: string; ValueName: ""; ValueData: "Excel File"; Flags: uninsdeletekey
Root: HKCR; Subkey: "ExcelClone.xlsx\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\excel-clone.exe,0"
Root: HKCR; Subkey: "ExcelClone.xlsx\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\excel-clone.exe"" ""%1"""
