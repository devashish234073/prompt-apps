![image](https://github.com/user-attachments/assets/28ca2959-e9ba-4b39-8ba4-dcc8a9f87879)


# this application was created by doing prompts in deepseek

To start the app do :
```
git clone https://github.com/devashish234073/prompt-apps
cd prompt-apps
cd excel-clone
npm install
node server.js
```
youtube video for reference: https://www.youtube.com/watch?v=5Y0LNj0BRD8

Below were the prompts done:

1. build an excel clone using nodejs as backend and add htmls for ui, html should have a file menu with sub menu that lets me choose an excel file from my machine then it sends it to the backend, backend should be able to open .csv and .xlsx files and send the data to front end. The excel on the front end should have formula processing cababilities , for now just support the SUM formula

2. when loading data from file I want some additional rows and cloumns to be added where formulas can be written, can you do that? like 4 rows and 2 columns additional
3. can you simplify the formula calculation logic by having the cells id like A1, B2, etc depending on row and column so as to make finding the cells easier
4. in this part instead of just onBlur I also want enter pressed to do teh same:
```
input.addEventListener('blur', function () {
                            evaluateFormulas();
                        });
```
5. also don't remove the formula after evaluating, when the cells with formula are double clicked it should show the formula that was used and let me edit it and when it blur or enter is pressed again the formula should re evaluate
6. I modifed some part of the code to support average by changing calculateSum to calculate and adding operation as the first argument. 

I want you to modify the calling function especially this part: instead of it chcking formula.startsWith('SUM(') it should take ot the SUM( part dynamically even not use hardcoded 4 length
```
if (formula.startsWith('SUM(') && formula.endsWith(')')) {
                    const range = formula.substring(4, formula.length - 1);
                    const [startRef, endRef] = range.split(':');

                    if (startRef && endRef) {
                        return calculate("SUM",startRef, endRef, cellValues);
                    }
                }
```
7. can you modify the ui by adding a data menu and undet it add a filter that creates a filter just like excel
8. I want multiple cell selection ability in the ui just like excel. I should be able to just start with a double click on a cell immediately followed by a drag and it should be able to select the cells I have hovered and when I do a ctrl+c it should be able to copy those data as if it were a csv data i.e. commas for separting columns and \r\n for rows
9. also can you add ability to register this as a service in windows laptop, so that see this as a valid app when right clicking on csv or xlsx files
10. I am getting this error:
PS D:\Progs\nodejs\prompt-apps\excel-clone> npm run build    

> excel-clone@1.0.0 build
> pkg . --targets node16-win-x64 --output excel-clone.exe

> pkg@5.8.1
> Error! Property 'bin' does not exist in
  D:\Progs\nodejs\prompt-apps\excel-clone\package.json
11. my inno compile is failing , these are some last lines of logs before it failed:

   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-multipart-fields-100mb-big.js
   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-multipart-fields-100mb-small.js
   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-multipart-files-100mb-big.js
   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-multipart-files-100mb-small.js
   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-urlencoded-fields-100pairs-small.js
   Compressing: D:\Progs\nodejs\prompt-apps\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\excel-clone\node_modules\busboy\bench\bench-urlencoded-fields-900pairs-small-alt.js
*** Compile aborted.
12. why is vscode adding this excel-clone dependency in my package.json. If I am removing it manually , its immediately adding it back:

"dependencies": {
    "cors": "^2.8.5",
    "csv-parser": "^3.0.0",
    "excel-clone": "file:",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "xlsx": "^0.18.5"
  }