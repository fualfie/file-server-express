const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const bodyParser = require('body-parser')
const session = require('express-session');
const fileUpload = require('express-fileupload');

const port = process.env.port || 5566
const account = process.env.account || 'admin'
const password = process.env.password || 'admin'

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
//解析body
app.use(bodyParser.json({ limit: '1024mb' }))
app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true, parameterLimit: 10000 })) //巢狀資料結構
//session
app.use(session({
    resave: true,  // 新增
    saveUninitialized: true,  // 新增
    secret: 'recommand 128 bytes random string and number', // 使用長度128隨機字符
    cookie: { maxAge: 1 * 60 * 60 * 1000 } // 1 hr
}));

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '\\login.html'))
})
app.get('/logout.html', (req, res) => {
    req.session.user = null
    res.redirect('/login.html')
})
app.post('/login', (req, res) => {
    if (req.body.account == account && req.body.password == password) {
        req.session.user = {
            account: req.body.account,
            password: req.body.password
        }
    }
    if (!req.session.user) {
        res.sendFile(path.join(__dirname, '\\login.html'))
    } else {
        res.redirect('/download.html')
    }
})
app.get('/download.html', (req, res) => {
    if (!req.session.user) {
        res.sendFile(path.join(__dirname, '\\login.html'))
    } else {
        res.sendFile(path.join(__dirname, '\\download.html'))
    }
})
app.get('/upload.html', (req, res) => {
    if (!req.session.user) {
        res.sendFile(path.join(__dirname, '\\login.html'))
    } else {
        res.sendFile(path.join(__dirname, '\\upload.html'))
    }
})
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
app.get('/', (req, res) => res.redirect('/login.html'))

// list
app.all('/list', (req, res) => {
    if (!req.session.user) {
        res.json([])
    } else {
        let list = fs.readdirSync(filesDir)
        res.json(list)
    }
})

app.use('/files', express.static(filesDir));

app.listen(port, '0.0.0.0', () => console.log(`Server start at http://localhost:${port}`)).on('error', console.error)