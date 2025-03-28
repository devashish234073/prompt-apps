// In your app.js or main JavaScript file
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