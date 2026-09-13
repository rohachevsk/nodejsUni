import path from "node:path";
import fs from "node:fs";
import express, { type Request, type Response } from "express";
import "dotenv/config";
import { renderMainPage, renderBookPage } from './pageRenderer.js';
import books from './showBooks.js';

const PATH_TO_PAGES = path.join(process.cwd(), 'src', 'pages');
const PORT = Number(process.env.PORT) || 3003;
const SERVER_NAME = process.env.SERVER_NAME || 'My Server';
const HOST = process.env.HOST || 'localhost';

const app = express();

app.use(express.json());

app.get('/books', (_req: Request, res: Response) => {
    console.log(JSON.stringify(books, null, 2));
    res.json(books);
});

app.get('/books/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const book = books.find((item) => item.id === id);
    const response: { data: typeof book | null; error: string | null; status: number } = {
        data: null,
        error: null,
        status: 200,
    };

    if (!book) {
        response.status = 404;
        response.error = 'The book not found';
        res.status(404).json(response);
        return;
    }

    response.data = book;
    res.status(200).json(response);
});

app.delete('/books/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const bookIndex = books.findIndex((book) => book.id === id);
    const response: { data: (typeof books[number]) | null; error: string | null; status: number } = {
        data: null,
        error: null,
        status: 200,
    };

    if (bookIndex === -1) {
        response.status = 404;
        response.error = 'The book not found';
        res.status(404).json(response);
        return;
    }

    const deletedBook = books[bookIndex];
    books.splice(bookIndex, 1);

    response.data = deletedBook;
    res.status(200).json(response);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
});

app.post('/books', (req: Request, res: Response) => {
    const { title, author, year, description, genre, quote } = req.body ?? {};

    if (!title || !author || !description || !genre || !quote) {
        res.status(400).json({
            error: 'Missing required fields: title, author, description, genre, quote',
        });
        return;
    }

    const nextId = books.reduce((maxId, book) => Math.max(maxId, book.id), 0) + 1;
    const newBook = {
        id: nextId,
        title: String(title),
        author: String(author),
        year: Number(year) || new Date().getFullYear(),
        description: String(description),
        genre: String(genre),
        quote: String(quote),
    };

    books.push(newBook);

    res.status(201).json({
        message: 'Book added successfully',
        data: newBook,
    });
});

app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(PATH_TO_PAGES, 'index.html'));
});

app.get('/book', (req: Request, res: Response) => {
    const id = Number(req.query.id);
    res.type('html');
    res.send(renderBookPage(id));
});

app.use(express.static(PATH_TO_PAGES));

app.use((req: Request, res: Response) => {
    const relativePath = req.originalUrl.replace(/^\/+/, '');
    const normalizedPath = path.normalize(relativePath);
    const fullPath = path.join(PATH_TO_PAGES, normalizedPath);

    if (!fullPath.startsWith(PATH_TO_PAGES)) {
        res.status(403).send('Forbidden');
        return;
    }

    fs.readFile(fullPath, 'utf-8', (err, content) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }

        res.type(path.extname(fullPath));
        res.send(content);
    });
});

app.listen(PORT, () => {
    console.log(`${SERVER_NAME} is running on http://${HOST}:${PORT}`);
});
