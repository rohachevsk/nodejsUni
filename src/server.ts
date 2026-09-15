import path from "node:path";
import fs from "node:fs";
import express, { type Request, type Response } from "express";
import "dotenv/config";
import { renderMainPage, renderBookPage } from './pageRenderer.js';
import books, { getBooksByTitle } from './showBooks.js';
import type { BookType } from './Booktype.js';
import { authors } from './authors.js';

type BookResponseType = {
    data: BookType[] | null;
    error: string | null;
    status: number;
};

const PATH_TO_PAGES = path.join(process.cwd(), 'src', 'pages');
const PORT = Number(process.env.PORT) || 3003;
const SERVER_NAME = process.env.SERVER_NAME || 'My Server';
const HOST = process.env.HOST || 'localhost';

const app = express();

app.use(express.json());

app.get('/books/:title/:is_active', (req: Request, res: Response) => {
    const titleFilter = String(req.params.title ?? '').trim().toLowerCase();
    const isActiveFilter = String(req.params.is_active ?? '').trim().toLowerCase();

    const activeOnly = isActiveFilter === 'true' || isActiveFilter === '1';

    const filteredBooks = books.filter((book) => {
        const matchesStatus = book.is_active === activeOnly;
        const matchesTitle = book.title.toLowerCase().includes(titleFilter);
        return matchesStatus && matchesTitle;
    });

    if (!filteredBooks.length) {
        res.status(404).json({
            status: 404,
            error: 'No books found for the given title and active status',
            data: [],
        });
        return;
    }

    res.status(200).json({
        status: 200,
        data: filteredBooks,
    });
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

app.get('/books', (req: Request, res: Response) => {
    const title: string = String(req.query.title || "").trim();

    const response: BookResponseType = {
        data: null,
        error: null,
        status: 200,
    };

    if (title === "") {
        if (books.length > 0) {
            response.data = books;
        } else {
            response.error = "Books list is empty";
            response.status = 404;
        }
    } else {
        const our_books: BookType[] | null = getBooksByTitle(title, books);

        if (our_books !== null) {
            response.data = our_books;
        } else {
            response.error = `The book "${title}" not found`;
            response.status = 404;
        }
    }

    res.writeHead(response.status, {
        "Content-Type": "application/json",
    });
    res.end(JSON.stringify(response));
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
    const { title, authorIds, author, year, description, genre, quote, is_active } = req.body ?? {};

    const parsedAuthorIds = Array.isArray(authorIds)
        ? authorIds
            .map((id) => Number(id))
            .filter((id) => Number.isFinite(id) && authors.some((item) => item.id === id))
        : [];

    if (!title || (!parsedAuthorIds.length && !author) || !description || !genre || !quote) {
        res.status(400).json({
            error: 'Missing required fields: title, authorIds or author, description, genre, quote',
        });
        return;
    }

    const nextId = books.reduce((maxId, book) => Math.max(maxId, book.id), 0) + 1;
    const resolvedAuthorIds = parsedAuthorIds.length
        ? parsedAuthorIds
        : author
            ? authors
                .filter((item) => item.name.toLowerCase() === String(author).trim().toLowerCase())
                .map((item) => item.id)
            : [];

    const newBook: BookType = {
        id: nextId,
        title: String(title),
        authorIds: resolvedAuthorIds,
        year: Number(year) || new Date().getFullYear(),
        description: String(description),
        genre: String(genre),
        quote: String(quote),
        is_active: is_active === undefined ? true : Boolean(is_active),
    };

    books.push(newBook);

    res.status(201).json({
        message: 'Book added successfully',
        data: newBook,
    });
});

app.get('/authors', (req: Request, res: Response) => {
    const id = Number(req.query.id);

    if (Number.isFinite(id)) {
        const author = authors.find((item) => item.id === id);

        if (!author) {
            res.status(404).json({
                status: 404,
                error: 'Author not found',
                data: null,
            });
            return;
        }

        const authorBooks = books.filter((book) => book.authorIds.includes(author.id));

        res.status(200).json({
            status: 200,
            data: {
                author,
                books: authorBooks,
            },
        });
        return;
    }

    res.status(200).json({
        status: 200,
        data: authors,
    });
});

app.get('/authors/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const author = authors.find((item) => item.id === id);

    if (!author) {
        res.status(404).json({
            status: 404,
            error: 'Author not found',
            data: null,
        });
        return;
    }

    const authorBooks = books.filter((book) => book.authorIds.includes(author.id));

    res.status(200).json({
        status: 200,
        data: {
            author,
            books: authorBooks,
        },
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
