const {execute} = require('@getvim/execute');
const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const fs = require('fs');

const compress = require('gzipme');

dotenv.config();
const username = process.env.DB_USERNAME;
const database = process.env.DB_NAME;
const date = new Date();
const currentDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
const fileName = `database-backup-${currentDate}.tar`;

const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.AWS_SECRET;

const BUCKET_NAME = 'test-bucket';

const s3 = new AWS.S3({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
});

async function backup() {
    try {
        await execute(`pg_dump -U ${username} -d ${database} -f ${fileName} -F t`,)
        console.log(`Start ${fileName}`);
        await compress(fileName);
        fs.unlinkSync(fileName);
        console.log(`Finito ${fileName}`);
    }
    catch (err) {
        console.log();
    } 

} 

function restore() {
    execute(`pg_restore -cC -d ${database} ${fileNameGzip}`).then(async () => {
        console.log("Restored");
    }).catch(err => {
        console.log(err);
    })
}

const uploadFile = () => {
    const fileContent = fs.readFileSync(`${fileName}.gz`);

    const params = {
        Bucket: BUCKET_NAME,
        Key: `./${fileName}.gz`, 
        Body: fileContent
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

async function doBackup () {
     await backup();
     await uploadFile();
}

 doBackup();