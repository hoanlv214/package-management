var getPackageJsonFromGithub = require('get-package-json-from-github');

getPackageJsonFromGithub('https://github.com/hoanlv214/Rest-full-api')
    .then(packageJson => {
        console.log('packageJson', packageJson);
    });

// can also load a caching version

// const cached = getPackageJsonFromGithub.cached();

// cached('https://github.com/hoanlv214/Rest-full-api')
//     .then(packageJson => {
//         console.log('packageJson', packageJson);
//     });

// get repo package.json
// const getPackage = require('get-repo-package-json')
// getPackage('hoanlv214/Rest-full-api')
//     .then(pkg => { console.log(pkg) })

// const { MongooseFileDb } = require('file-easy-database')

// let filedb = new MongooseFileDb('mongodb://127.0.0.1')

// async function awaitAll() {

//     await filedb.set('./save.json')

//     console.log(await filedb.list())

//     console.log(await filedb.has('save.json')) // check if the file your saved is actually saved in the database

//     await filedb.get('save.json', './myfile.recieved')
//     //   Filename identifier ^  Output File Name ^

//     await filedb.delete('save.json') // delete these specific file in the database

//     await filedb.reset() // reset your filedb
// }

// awaitAll()