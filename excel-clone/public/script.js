document.addEventListener('DOMContentLoaded', function () {

    // Add these variables at the top
    let filters = {};
    let filterDropdown = null;

    // Add these variables at the top
    let isSelecting = false;
    let startCell = null;
    let selectedRange = {
        startRow: -1,
        startCol: -1,
        endRow: -1,
        endCol: -1
    };

    if (window.preloadedFile) {
        fetch('/load-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: window.preloadedFile })
        })
            .then(response => response.json())
            .then(data => displayData(data))
            .catch(error => console.error('Error:', error));
    }

    document.addEventListener('mousemove', function (e) {
        if (!isSelecting) return;

        const hoveredCell = e.target.closest('td');
        if (!hoveredCell || !startCell) return;

        clearSelection();

        const startRow = parseInt(startCell.dataset.row);
        const startCol = parseInt(startCell.dataset.col);
        const endRow = parseInt(hoveredCell.dataset.row);
        const endCol = parseInt(hoveredCell.dataset.col);
        console.log("yes its selecting");

        selectedRange = {
            startRow: Math.min(startRow, endRow),
            startCol: Math.min(startCol, endCol),
            endRow: Math.max(startRow, endRow),
            endCol: Math.max(startCol, endCol)
        };

        highlightSelection();
    });

    document.addEventListener('mouseup', function () {
        isSelecting = false;
    });

    // Add copy functionality
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'c') {
            copySelection();
        }
        // Add to your existing keydown listener
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            selectAll();
        }
    });

    function clearSelection() {
        document.querySelectorAll('.cell-selected, .range-selected, .range-corner').forEach(el => {
            el.classList.remove('cell-selected', 'range-selected', 'range-corner');
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                console.log("text to be pasted",text);
                //console.log("pasteData",pasteData);
                pasteData(text);
            });
        }
    });

    function pasteData(csvData) {
        //console.log("selectedRange",selectedRange)
        const { startRow, startCol } = selectedRange;
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        console.log("rows",rows);

        rows.forEach((row, rowOffset) => {
            const values = parseCSVRow(row);
            console.log("processing",values);
            const rowElement = sheetBody.querySelector(`tr:nth-child(${startRow + rowOffset + 1})`);
            console.log("rowElement",rowElement);
            if (!rowElement) return;

            values.forEach((value, colOffset) => {
                const cell = rowElement.querySelector(`td:nth-child(${startCol + colOffset + 2})`);
                console.log("cell",cell);
                if (!cell) return;

                const input = cell.querySelector('input');
                if (input) {
                    input.value = value;
                    console.log("input",input);
                    console.log("value",value);
                    input.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    function parseCSVRow(row) {
        // Simple CSV parser - for more complex cases use a library
        const result = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        result.push(currentValue);
        return result;
    }

    function highlightSelection() {
        const { startRow, startCol, endRow, endCol } = selectedRange;

        for (let row = startRow; row <= endRow; row++) {
            const rowElement = sheetBody.querySelector(`tr:nth-child(${row + 1})`);
            if (!rowElement) continue;

            for (let col = startCol; col <= endCol; col++) {
                const cell = rowElement.querySelector(`td:nth-child(${col + 2})`); // +2 for row number column
                if (!cell) continue;

                // Add appropriate class based on cell position
                if ((row === startRow && col === startCol) ||
                    (row === endRow && col === endCol) ||
                    (row === startRow && col === endCol) ||
                    (row === endRow && col === startCol)) {
                    cell.classList.add('range-corner');
                } else {
                    cell.classList.add('range-selected');
                }
            }
        }
    }

    function copySelection() {
        const { startRow, startCol, endRow, endCol } = selectedRange;
        let csvData = '';

        for (let row = startRow; row <= endRow; row++) {
            const rowElement = sheetBody.querySelector(`tr:nth-child(${row + 1})`);
            if (!rowElement) continue;

            let rowValues = [];

            for (let col = startCol; col <= endCol; col++) {
                const cell = rowElement.querySelector(`td:nth-child(${col + 2})`);
                if (!cell) continue;

                const input = cell.querySelector('input');
                let value = input ? input.value : '';

                // Handle CSV escaping
                if (value.includes('"') || value.includes(',') || value.includes('\n')) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }

                rowValues.push(value);
            }

            csvData += rowValues.join(',') + '\r\n';
        }

        // Copy to clipboard
        navigator.clipboard.writeText(csvData).then(() => {
            console.log('Copied to clipboard',csvData);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    function selectAll() {
        const rows = sheetBody.querySelectorAll('tr');
        if (rows.length === 0) return;

        selectedRange = {
            startRow: 0,
            startCol: 0,
            endRow: rows.length - 1,
            endCol: rows[0].children.length - 2 // -2 for row number column
        };

        clearSelection();
        highlightSelection();
    }

    // Add event listeners for the new menu items
    document.getElementById('add-filter').addEventListener('click', addFilters);
    document.getElementById('clear-filter').addEventListener('click', clearFilters);

    // Add filter functionality
    function addFilters() {
        // Clear any existing filters first
        clearFilters();

        // Create filter dropdowns for each column
        const headers = headerRow.querySelectorAll('th');
        headers.forEach((header, index) => {
            if (index === 0) return; // Skip row number column

            // Add filter icon
            const filterIcon = document.createElement('span');
            filterIcon.className = 'filter-icon';
            filterIcon.innerHTML = '▼';
            filterIcon.dataset.column = index;
            header.appendChild(filterIcon);

            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'filter-dropdown';
            dropdown.style.display = 'none';
            dropdown.dataset.column = index;
            document.body.appendChild(dropdown);

            // Get unique values for this column
            const values = getColumnValues(index);

            // Populate dropdown
            values.forEach(value => {
                const item = document.createElement('div');
                item.className = 'filter-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'filter-checkbox';
                checkbox.value = value;
                checkbox.checked = true;

                item.appendChild(checkbox);
                item.appendChild(document.createTextNode(value));
                dropdown.appendChild(item);
            });

            // Add filter controls
            const controls = document.createElement('div');
            controls.className = 'filter-controls';

            const selectAll = document.createElement('a');
            selectAll.textContent = 'Select All';
            selectAll.style.marginRight = '10px';
            selectAll.addEventListener('click', () => {
                dropdown.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = true);
                applyFilter(index);
            });

            const clearAll = document.createElement('a');
            clearAll.textContent = 'Clear All';
            clearAll.addEventListener('click', () => {
                dropdown.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
                applyFilter(index);
            });

            controls.appendChild(selectAll);
            controls.appendChild(clearAll);
            dropdown.appendChild(controls);

            // Toggle dropdown on icon click
            filterIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllDropdowns();

                // Position dropdown
                const rect = filterIcon.getBoundingClientRect();
                dropdown.style.left = `${rect.left}px`;
                dropdown.style.top = `${rect.bottom}px`;
                dropdown.style.display = 'block';
                filterDropdown = dropdown;
            });

            // Update filters when checkboxes change
            dropdown.querySelectorAll('.filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', () => applyFilter(index));
            });
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', closeAllDropdowns);
    }

    function getColumnValues(columnIndex) {
        const values = new Set();
        const rows = sheetBody.querySelectorAll('tr');

        rows.forEach(row => {
            const cell = row.children[columnIndex];
            if (cell) {
                const input = cell.querySelector('input');
                if (input) {
                    values.add(input.value.trim() || '(Blank)');
                }
            }
        });

        return Array.from(values).sort();
    }

    function applyFilter(columnIndex) {
        const dropdown = document.querySelector(`.filter-dropdown[data-column="${columnIndex}"]`);
        if (!dropdown) return;

        // Get selected values
        const selectedValues = [];
        dropdown.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
            selectedValues.push(checkbox.value);
        });

        // Store filter
        filters[columnIndex] = selectedValues;

        // Apply filter to rows
        const rows = sheetBody.querySelectorAll('tr');
        rows.forEach(row => {
            if (row.children.length <= columnIndex) return;

            const cell = row.children[columnIndex];
            const input = cell.querySelector('input');
            const value = input ? (input.value.trim() || '(Blank)') : '';

            // Show/hide row based on filter
            let shouldShow = true;
            for (const [col, values] of Object.entries(filters)) {
                const cell = row.children[col];
                const input = cell.querySelector('input');
                const cellValue = input ? (input.value.trim() || '(Blank)') : '';

                if (!values.includes(cellValue)) {
                    shouldShow = false;
                    break;
                }
            }

            row.style.display = shouldShow ? '' : 'none';
        });
    }

    function clearFilters() {
        // Remove all filter UI
        document.querySelectorAll('.filter-icon').forEach(icon => icon.remove());
        document.querySelectorAll('.filter-dropdown').forEach(dd => dd.remove());
        filters = {};

        // Show all rows
        sheetBody.querySelectorAll('tr').forEach(row => {
            row.style.display = '';
        });

        // Remove event listener
        document.removeEventListener('click', closeAllDropdowns);
        filterDropdown = null;
    }

    function closeAllDropdowns() {
        if (filterDropdown) {
            filterDropdown.style.display = 'none';
            filterDropdown = null;
        }
    }

    const fileInput = document.getElementById('file-input');
    const openFileBtn = document.getElementById('open-file');
    const spreadsheet = document.getElementById('spreadsheet');
    const headerRow = document.getElementById('header-row');
    const sheetBody = document.getElementById('sheet-body');

    let spreadsheetData = [];
    let selectedCell = null;

    // Initialize with empty spreadsheet
    initializeSpreadsheet(10, 10);

    // File menu click handler
    openFileBtn.addEventListener('click', function () {
        fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            uploadFile(file);
        }
    });

    // Upload file to server
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                displayData(data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading file');
            });
    }

    function getCellReference(row, col) {
        // Convert column number to letters (0 -> A, 1 -> B, ..., 25 -> Z, 26 -> AA, etc.)
        let colLetters = '';
        let colNum = col + 1; // 1-based

        while (colNum > 0) {
            const remainder = (colNum - 1) % 26;
            colLetters = String.fromCharCode(65 + remainder) + colLetters;
            colNum = Math.floor((colNum - 1) / 26);
        }

        return colLetters + (row + 1);
    }

    // Display data in spreadsheet
    function displayData(data) {
        // Clear existing data
        headerRow.innerHTML = '';
        sheetBody.innerHTML = '';

        // Determine number of columns from data or use default
        const dataCols = data.headers ? data.headers.length :
            (data.rows && data.rows.length > 0 ? data.rows[0].length : 0);
        const totalCols = Math.max(dataCols, 10) + 2; // Add 2 extra columns

        // Determine number of rows from data or use default
        const dataRows = data.rows ? data.rows.length : 0;
        const totalRows = Math.max(dataRows, 10) + 4; // Add 4 extra rows

        // Create headers
        // Add empty cell for corner
        headerRow.appendChild(document.createElement('th'));

        // Add column headers (A, B, C, ...)
        for (let i = 0; i < totalCols; i++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + i);
            headerRow.appendChild(th);
        }

        // Create rows
        for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
            const tr = document.createElement('tr');

            // Add row number
            const th = document.createElement('th');
            th.textContent = rowIndex + 1;
            tr.appendChild(th);

            // Add cells
            for (let colIndex = 0; colIndex < totalCols; colIndex++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                // Modify cell creation to add mouse event listeners
                input.addEventListener('mousedown', function (e) {
                    if (e.detail === 2) { // Double click
                        console.log("double click done...");
                        isSelecting = true;
                        startCell = this.parentElement;
                        clearSelection();
                        startCell.classList.add('cell-selected');

                        const row = parseInt(startCell.dataset.row);
                        const col = parseInt(startCell.dataset.col);
                        selectedRange = {
                            startRow: row,
                            startCol: col,
                            endRow: row,
                            endCol: col
                        };
                    }
                });

                // Set cell reference as data attributes
                td.dataset.row = rowIndex;
                td.dataset.col = colIndex;
                input.dataset.cellRef = getCellReference(rowIndex, colIndex);
                // Fill with file data if available
                if (rowIndex < dataRows && colIndex < dataCols) {
                    input.value = data.rows[rowIndex][colIndex] || '';
                } else {
                    input.value = '';
                }

                input.addEventListener('focus', function () {
                    if (selectedCell) {
                        selectedCell.classList.remove('selected');
                    }
                    selectedCell = td;
                    td.classList.add('selected');
                });

                input.addEventListener('dblclick', function () {
                    if (this.dataset.formula) {
                        this.value = this.dataset.formula;
                        this.classList.remove('formula-cell');
                    }
                });

                input.addEventListener('blur', function () {
                    // If it's a formula cell and we're showing the formula (from double-click)
                    if (this.dataset.formula && !this.classList.contains('formula-cell')) {
                        evaluateFormulas();
                    }
                    // For regular cells, just evaluate
                    else {
                        evaluateFormulas();
                    }
                });

                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        // Similar logic to blur
                        if (this.dataset.formula && !this.classList.contains('formula-cell')) {
                            evaluateFormulas();
                        } else {
                            evaluateFormulas();
                        }
                        // Move to next cell
                        const currentTd = this.parentElement;
                        const nextRow = currentTd.parentElement.nextElementSibling;
                        if (nextRow) {
                            const nextInput = nextRow.children[currentTd.cellIndex].querySelector('input');
                            if (nextInput) nextInput.focus();
                        }
                    }
                });

                td.appendChild(input);
                tr.appendChild(td);
            }

            sheetBody.appendChild(tr);
        }

        // Store the data
        spreadsheetData = Array(totalRows).fill().map((_, rowIndex) => {
            return Array(totalCols).fill().map((_, colIndex) => {
                return (rowIndex < dataRows && colIndex < dataCols) ?
                    (data.rows[rowIndex][colIndex] || '') : '';
            });
        });
    }

    // Initialize empty spreadsheet
    function initializeSpreadsheet(rows, cols) {
        // Clear existing data
        headerRow.innerHTML = '';
        sheetBody.innerHTML = '';

        // Add column headers (A, B, C, ...)
        headerRow.appendChild(document.createElement('th'));
        for (let i = 0; i < cols; i++) {
            const th = document.createElement('th');
            th.textContent = String.fromCharCode(65 + i);
            headerRow.appendChild(th);
        }

        // Add rows
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
            const tr = document.createElement('tr');

            // Add row number
            const th = document.createElement('th');
            th.textContent = rowIndex + 1;
            tr.appendChild(th);

            // Add empty cells
            for (let colIndex = 0; colIndex < cols; colIndex++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'text';
                input.value = '';

                input.addEventListener('focus', function () {
                    if (selectedCell) {
                        selectedCell.classList.remove('selected');
                    }
                    selectedCell = td;
                    td.classList.add('selected');
                });

                input.addEventListener('blur', function () {
                    evaluateFormulas();
                });

                td.appendChild(input);
                tr.appendChild(td);
            }

            sheetBody.appendChild(tr);
        }

        // Initialize empty data
        spreadsheetData = Array(rows).fill().map(() => Array(cols).fill(''));
    }

    // Evaluate formulas in the spreadsheet
    function evaluateFormulas() {
        const allCells = sheetBody.querySelectorAll('td');

        // First pass: collect all cell values
        const cellValues = {};
        allCells.forEach(td => {
            const input = td.querySelector('input');
            const cellRef = input.dataset.cellRef;
            const value = input.value.trim();

            // Store original formula if it is one
            if (value.startsWith('=')) {
                input.dataset.formula = value;
                cellValues[cellRef] = value; // Store the formula
            } else {
                cellValues[cellRef] = value; // Store the value
            }
        });

        // Second pass: evaluate formulas
        allCells.forEach(td => {
            const input = td.querySelector('input');
            const formula = input.dataset.formula;

            if (formula) {
                try {
                    const result = evaluateFormula(formula, cellValues);
                    input.value = result;
                    input.classList.add('formula-cell');
                } catch (e) {
                    input.value = '#ERROR!';
                    input.classList.add('formula-cell');
                }
            }
        });
    }

    function evaluateFormula(formula, cellValues) {
        formula = formula.substring(1).toUpperCase();

        // Extract function name and arguments using regex
        const fnMatch = formula.match(/^([A-Z]+)\(([^)]*)\)$/);
        if (!fnMatch) return '#SYNTAX_ERROR!';

        const fnName = fnMatch[1]; // "SUM", "AVERAGE", etc.
        const args = fnMatch[2];   // Everything inside parentheses

        if (fnName === 'SUM' || fnName === 'AVERAGE' || fnName === 'AVG') {
            const [startRef, endRef] = args.split(':');

            if (startRef && endRef) {
                return calculate(fnName, startRef, endRef, cellValues);
            }
        }

        return `#UNKNOWN_FN: ${fnName}!`;
    }

    function calculate(operation, startRef, endRef, cellValues) {
        const startCoords = parseCellReference(startRef);
        const endCoords = parseCellReference(endRef);

        if (!startCoords || !endCoords) return 0;

        let operationOut = 0;
        let count = 0;

        for (let col = startCoords.col; col <= endCoords.col; col++) {
            for (let row = startCoords.row; row <= endCoords.row; row++) {
                const cellRef = getCellReference(row, col);
                const value = cellValues[cellRef] || '';

                // Skip if it's a formula or empty
                if (value.startsWith('=')) continue;
                if (value === '') continue;

                const num = parseFloat(value);
                if (!isNaN(num)) {
                    operationOut += num;
                    count++;
                }
            }
        }
        if (operation == "SUM") {
            //operationOut = operationOut;
        } else if (operation == "AVG") {
            operationOut = operationOut / count;
        }

        return count > 0 ? operationOut : 0;
    }

    function parseCellReference(ref) {
        const match = ref.match(/^([A-Z]+)(\d+)$/i);
        if (!match) return null;

        const colLetters = match[1].toUpperCase();
        const rowNumber = parseInt(match[2]);

        // Convert column letters to 0-based index
        let colNumber = 0;
        for (let i = 0; i < colLetters.length; i++) {
            colNumber = colNumber * 26 + (colLetters.charCodeAt(i) - 64);
        }
        colNumber--; // Convert to 0-based

        return { row: rowNumber - 1, col: colNumber };
    }
});