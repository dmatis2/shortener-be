import dotenv from 'dotenv';
dotenv.config();
import morgan from'morgan';
import express from 'express';
import Database from 'better-sqlite3';
const app = express();
const port = process.env.PORT || 3000;

const tableName = 'Shortener';
const tableFields = '(id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, shortUrl TEXT NOT NULL UNIQUE)';
const db = new Database('shortener.db', {});
const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName} ${tableFields}`;
db.prepare(createQuery).run();

const generateUrl = () => {
    const characterArray = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let output = "";
    for(let i=0;i<7;i++) {
        const randomIndex = Math.floor(Math.random() * characterArray.length);
        output += characterArray[randomIndex]
    }
    return output;
}

const shortenUrl = async (url) => {
    const insertQuery = `INSERT INTO ${tableName} (url, shortUrl) VALUES (?, ?)`;
    const selectStatement = `SELECT * FROM ${tableName} WHERE url=?`;

    const shortened = db.prepare(selectStatement).all(url);
    if(shortened.length === 0) {
        const generatedUrl = generateUrl();
        db.prepare(insertQuery).run(url, generatedUrl);
        return generatedUrl;
    }
    return shortened[0].shortUrl;
}

const getOriginalURL = async (shortURL) => {
    const selectStatement = `SELECT * FROM ${tableName} WHERE shortUrl=?`;
    const url = db.prepare(selectStatement).all(shortURL);
    if (url.length === 0) return null;
    return url[0].url;
}

app.use(morgan('common'));
app.use(express.json());
app.get('/', (req, res) => {
    res.json({status: 'ok'});
})

app.post('/', async (req, res) => {
    try {
        if(!Object.keys(req.body).includes('url')) {
            throw new Error('Missing URL');
        }
        console.log(`som tuuu`);
        const generatedUrl = await shortenUrl(req.body.url);
        res.json({url: generatedUrl});
    } catch (e) {
        res.status(500).json({reason: e});
    }
})

app.get('/:id', async (req, res) => {
    const origURL = await getOriginalURL(req.params.id);
    console.log(origURL);
    if(!origURL) {
        res.status(500).json({status: 'error', reason: 'Not a valid shortened URL.'});
        return;
    }
    res.redirect(origURL);
})

app.listen(port, () => console.log(`Server listening on 0.0.0.0:${port}`));