const http = require('http');

http.get('http://localhost:3000/cms/settings', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
