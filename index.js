const path = require("path");
const fs = require("fs");
const MemoryFileSystem = require('memory-fs');

// use the webpack that's included in the Next.js project
const webpackPath = path.join(__dirname, 'node_modules/next/dist/compiled/webpack');
const projectNodeModulesDir = path.join(__dirname, 'node_modules');
const entryFileName = path.join(__dirname, 'entry.js');

const {webpack} = require(webpackPath)();

const compiler = webpack({
    "mode": "development",
    "devtool": false,
    "entry": entryFileName,
    externals: {
        "react": true,
        "react-dom": true,
        "prop-types": true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript']
                    }
                }
            }
        ]
    },
    "resolve": {
        extensions: ['.wasm', '.mjs', '.js', '.json', '.ts'],
        modules: [projectNodeModulesDir]
    },
    "output": {
        "library": '__node_modules__',
        "libraryTarget": 'var',
        "path": '/dist',
        "filename": "[name].js"
    }
});


// use in-memory FS to bundle
const memfs = new MemoryFileSystem();

compiler.outputFileSystem = memfs;

const run = new Promise((resolve, reject) => {
    compiler.run((err) => {
        if (err) {
            reject(err);
        }
        const bundle = memfs.readFileSync('/dist/main.js').toString();
        resolve(bundle);
    });
});

(async function bundle() {
    const output = await run;
    fs.writeFileSync('./output.js', output);
    console.log('Wrote bundle to output.js');
    if (output.includes('undefined(')) {
        console.error('Invalid calls to undefined as function:');
        const numberedLines = output.split(/[\n]/).map((line, idx) => ({line: idx + 1, text: line}));
        const invalidLines = numberedLines.filter(nl => nl.text.includes('undefined('));
        console.error('Invalid bundle lines:', JSON.stringify(invalidLines, null, 2));
    }
})();