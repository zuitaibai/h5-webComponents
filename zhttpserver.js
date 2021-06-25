const port = 8848;
const baseDir = './';
const defIndex = 'index.html';
const mockApiPrefix = '/vmerp/';
const mockData = {};

const http = require('http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    os = require('os'),
    mine = {
		'css': 'text/css', 'gif': 'image/gif','png': 'image/png','jpg': 'image/jpeg','jpeg': 'image/jpeg',
		'html': 'text/html', 'ico': 'image/x-icon', 'xml': 'text/xml','js': 'text/javascript', 'json': 'application/json',
		'pdf': 'application/pdf',  'svg': 'image/svg+xml', 'woff':'application/x-font-woff',
		'woff2': 'application/x-font-woff', 'ttf':'application/x-font-truetype', 'tiff': 'image/tiff',
		'otf': 'application/x-font-opentype', 'eot': 'application/vnd.ms-fontobject','wmv': 'video/x-ms-wmv',
		'swf': 'application/x-shockwave-flash', 'txt': 'text/plain', 'wav': 'audio/x-wav', 'wma': 'audio/x-ms-wma',
	},
    clientIP = (() => {
        let nets = os.networkInterfaces();
        for (let a in nets) {
            let ifaces = nets[a];
            for (let o in ifaces) {
                if (ifaces[o].family == 'IPv4' /*&& alias.address !== '127.0.0.1'*/ && !ifaces[o].internal) return ifaces[o].address;
            }
        }
        return '';
    })();
http.createServer(function (req, res) {
    const mockApi = url => {
        console.log(`++++ [ajax]: ${url}`);
        let apiUrl = mockApiPrefix.indexOf('/')===0 ? url : url.slice(1);
        if(apiUrl in mockData){
            res.writeHead(200, { 'Content-Type': 'application/json;charset=UTF-8' });
            res.end(JSON.stringify(mockData[apiUrl]));
        }else{
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('no data & no such url');
        }
        console.log(` ...done`);
    };
    const readHtml = name => {
        console.log(`++++ request: ${name}`);
        let status = 200, exist = fs.existsSync(name), data;
        if(exist) data = fs.readFileSync(name, 'utf-8');
        else  data = `file:${name} not exist!`, status = 404;
        res.writeHead(status, {'Content-Type': 'text/html'});
        res.end(data);
        console.log(` ...done`);
    };
    const readBinary = name =>{
        console.log(`++++ request: ${name}`);
        let exist = fs.existsSync(name);
        if(exist){
            res.writeHead(200, {'Content-Type': mine[ext] || 'text/plain'});
            res.end(fs.readFileSync(name, 'binary'), 'binary');
        }else{
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end(`file:${name} not exist!`);
        }
        console.log(` ...done`);
    };
    let pathname = url.parse(req.url).pathname, realPath = path.join(baseDir, pathname), ext = path.extname(realPath);
    ext = ext ? ext.slice(1) : 'unknown';
    if(pathname==='/') readHtml(path.join(baseDir, defIndex));
    else if(ext === 'html') readHtml(realPath);
    else if(ext in mine) readBinary(realPath);
    else if(pathname.indexOf(mockApiPrefix)>-1) mockApi(pathname);
    else{
        console.log(`++++ request: / => ${realPath}`);
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('no data');
        console.log(` ...done`);
        res.end();
    }

}).listen(port, '0.0.0.0', function () {
    console.log('===== Server running: localhost => http://%s:%s =============================================', clientIP || 'localhost', port);
});