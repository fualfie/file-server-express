const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const fileUpload = require('express-fileupload');

const port = 5566

const randomName = (length, number, text = "") => {
    let possible = number ? "0987654321" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < (length || 8); i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

const filesDir = path.resolve(process.cwd(), '.\\files')

if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, '0777')

// default options
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB
}));

app.get('/upload', (req, res) => { res.sendFile(path.join(__dirname, '\\upload.html')) })
app.get('/upload.html', (req, res) => { res.sendFile(path.join(__dirname, '\\upload.html')) })
app.get('/files.html', (req, res) => { res.sendFile(path.join(__dirname, '\\files.html')) })
app.post('/upload', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let samples = req.files.sample;

    if (!Array.isArray(samples)) samples = [samples];

    // Use the mv() method to place the file somewhere on your server
    let result = []
    samples.forEach(sample => {
        sample.mv(path.join(filesDir, '\\' + sample.name), function (err) {
            if (err) {
                result.push({ name: sample.name, success: false, error: err })
            } else {
                result.push({ name: sample.name, success: true, error: false })
                // console.log(randomName(6, true), sample.name, sample.size + ' bytes')
                console.log('【Upload】', sample.name, sample.size > (1024 * 1024) ? Math.round(sample.size * 1000 / (1024 * 1024)) / 1000 + ' MB' : Math.round(sample.size * 1000 / 1024) / 1000 + ' KB')
            }
            if (result.length == samples.length) res.json(result);
        });
    })
});

// default
app.get('/', (req, res) => res.redirect('/upload'))

// list
app.all('/list', (req, res) => {
    let list = fs.readdirSync(filesDir)
    res.json(list)
})

app.use('/files', express.static(filesDir));

app.listen(port, () => console.log(`File server start at http://localhost:${port}`)).on('error', console.error)