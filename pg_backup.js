const {execute} = require('@getvim/execute');
const dotenv = require('dotenv');
dotenv.config();
const username = process.env.DB_USERNAME;
const database = process.env.DB_NAME;
const date = new Date();
const currentDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}`;
const compress = require('gzipme');
const fileName = `database-backup-${currentDate}.tar`;

const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.AWS_SECRET;

const BUCKET_NAME = 'test-bucket';

const s3 = new AWS.S3({
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
});

function backup() {
    execute(`pg_dump -U ${username} -d ${database} -f ${fileName} -F t`,).then(async () => {
        await compress(fileName);
        fs.unlinkSync(fileName);
        console.log("Finito");
    }).catch(err => {
        console.log(err);
    })
} 

function restore() {
    execute(`pg_restore -cC -d ${database} ${fileNameGzip}`).then(async () => {
        console.log("Restored");
    }).catch(err => {
        console.log(err);
    })
}

function sendToBackupS3(fileName = fileNameGzip) {
    const form = new FormData();
    form.append('file', fileName);
    axios.post('http://my.backupserver.org/private', form, {headers: form.getHeaders(),}).then(result => {
        fs.unlinkSync(fileNameGzip);
        console.log(result.data);
    }).catch(err => {
        console.error(err);
    });
}
const uploadFile = () => {
    const fileContent = fs.readFileSync(fileName);

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileName, 
        Body: fileContent
    };

    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

backup();
uploadFile();