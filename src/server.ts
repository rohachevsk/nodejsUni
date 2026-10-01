// import path from "node:path";
// import fs from "node:fs";
// import express, { type Request, type Response } from "express";
// import "dotenv/config";
// import { renderMainPage, renderBookPage } from './pageRenderer.js';
// import { books } from './data/books.js';
// import { authors } from './authors.js';
// import booksRouter from './routes/books.js';
// import { checkDatabaseConnection, db } from './db.js';

// const PATH_TO_PAGES = path.join(process.cwd(), 'src', 'pages');
// const PORT = Number(process.env.PORT) || 3003;
// const SERVER_NAME = process.env.SERVER_NAME || 'My Server';
// const HOST = process.env.HOST || 'localhost';

// const app = express();
// app.set('view engine', 'ejs');
// app.set('views', path.join(process.cwd(), 'views'));
// app.use(express.static("public"));
// app.use(express.json());
// app.use('/books', booksRouter);

// app.get('/db/health', async (_req: Request, res: Response) => {
//     try {
//         await checkDatabaseConnection();
//         res.status(200).json({ status: 200, data: { connected: true }, error: null });
//     } catch (error) {
//         console.error('Database health check failed:', error);
//         res.status(503).json({ status: 503, data: { connected: false }, error: 'Database unavailable' });
//     }
// });

// app.get('/authors', (req: Request, res: Response) => {
//     const id = Number(req.query.id);

//     if (Number.isFinite(id)) {
//         const author = authors.find((item) => item.id === id);

//         if (!author) {
//             res.status(404).json({
//                 status: 404,
//                 error: 'Author not found',
//                 data: null,
//             });
//             return;
//         }

//         const authorBooks = books.filter((book) => book.authorIds.includes(author.id));

//         res.status(200).json({
//             status: 200,
//             data: {
//                 author,
//                 books: authorBooks,
//             },
//         });
//         return;
//     }

//     res.status(200).json({
//         status: 200,
//         data: authors,
//     });
// });

// app.get('/authors/:id', (req: Request, res: Response) => {
//     const id = Number(req.params.id);
//     const author = authors.find((item) => item.id === id);

//     if (!author) {
//         res.status(404).json({
//             status: 404,
//             error: 'Author not found',
//             data: null,
//         });
//         return;
//     }

//     const authorBooks = books.filter((book) => book.authorIds.includes(author.id));

//     res.status(200).json({
//         status: 200,
//         data: {
//             author,
//             books: authorBooks,
//         },
//     });
// });

// app.get('/', (_req: Request, res: Response) => {
//     res.render('layouts/main', { title: 'Litera', page: 'pages/home' });
// });

// app.get('/about-page', (_req: Request, res: Response) => {
//     res.render('layouts/main', { title: 'О нас | Litera', page: 'pages/about' });
// });

// app.get('/books-page', (_req: Request, res: Response) => {
//     res.render('layouts/main', { title: 'Книги | Litera', page: 'pages/books', books });
// });

// app.get('/book', (req: Request, res: Response) => {
//     const id = Number(req.query.id);
//     res.type('html');
//     res.send(renderBookPage(id));
// });

// app.get('/image/:filename', (req: Request<{ filename: string }>, res: Response) => {
//     const filename = path.basename(req.params.filename);
//     const imagePath = path.join(PATH_TO_PAGES, 'images', filename);

//     if (filename !== req.params.filename || !/\.(?:jpg|jpeg|png|gif|webp)$/i.test(filename)) {
//         res.status(400).json({ status: 400, data: null, error: 'Invalid image filename' });
//         return;
//     }

//     res.sendFile(imagePath, (error) => {
//         if (error && !res.headersSent) {
//             const statusCode = (error as Error & { statusCode?: number }).statusCode;
//             const responseStatus = statusCode === 404 ? 404 : 500;
//             res.status(responseStatus).json({
//                 status: responseStatus,
//                 data: null,
//                 error: responseStatus === 404 ? 'Image not found' : 'Unable to send image',
//             });
//         }
//     });
// });

// app.use(express.static(PATH_TO_PAGES));

// app.use((req: Request, res: Response) => {
//     const relativePath = req.originalUrl.replace(/^\/+/, '');
//     const normalizedPath = path.normalize(relativePath);
//     const fullPath = path.join(PATH_TO_PAGES, normalizedPath);

//     if (!fullPath.startsWith(PATH_TO_PAGES)) {
//         res.status(403).send('Forbidden');
//         return;
//     }

//     fs.readFile(fullPath, 'utf-8', (err, content) => {
//         if (err) {
//             res.status(404).send('File not found');
//             return;
//         }

//         res.type(path.extname(fullPath));
//         res.send(content);
//     });
// });

// const server = app.listen(PORT, () => {
//     console.log(`${SERVER_NAME} is running on http://${HOST}:${PORT}`);
// });

// const shutdown = async () => {
//     server.close();
//     await db.end();
// };

// process.on('SIGINT', shutdown);
// process.on('SIGTERM', shutdown);


import express, { type Request, type Response } from "express"
import cookieParser from "cookie-parser"
import "dotenv/config"
import router from "./routes/books.js"
import authRouter from "./routes/auth.js"
import { authMiddleware } from "./middlewares/authMiddleware.js"
import { books as fallbackBooks } from "./data/books.js"
import type { BookType } from "./types/BookType.js"
import { db } from "./db.js"
import { loggerMiddleware } from "./middlewares/loggerMiddleware.js"
import path from "node:path"
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cl = console.log
const PORT = process.env.PORT || 3003
const HOST = process.env.HOST || "http://localhost"

const app = express()

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "../public")))
app.use("/images", express.static(path.join(__dirname, "../public/images")))
app.use(express.json()) //body -> json
app.use(express.urlencoded({ extended: false })) //body -> form
app.use(cookieParser()) //req.cookies
app.use(loggerMiddleware) // логує ВСІ запити: сторінки, /api, статику ні (вона вище)
app.use(authMiddleware) // res.locals.username: імʼя з кукі або "guest"

// Книги из PostgreSQL (таблица books: id, title, price, is_active, image).
// Если база недоступна — показываем локальный массив-заглушку.
const getBooks = async (): Promise<BookType[]> => {
    try {
        const { rows } = await db.query('SELECT id, title, price, is_active, image FROM books ORDER BY id');
        return rows.map((row: Record<string, unknown>) => ({
            id: Number(row.id),
            title: String(row.title ?? ''),
            authorIds: [],
            year: new Date().getFullYear(),
            description: '',
            genre: '',
            quote: '',
            is_active: Boolean(row.is_active ?? true),
            image: (row.image as string | null) ?? null,
            price: row.price === null || row.price === undefined ? null : Number(row.price),
        }));
    } catch (error) {
        console.error('PostgreSQL unavailable, using fallback books:', (error as Error).message);
        return fallbackBooks;
    }
};

app.get('/', (_req, res) => {
    res.render("layouts/main", { title: "Litera", activePage: "home", body: "<p>Hello World</p>" })
})

app.get('/about-page', (_req, res) => {
    res.render("layouts/main", { title: "О нас | Litera", activePage: "home", body: "<p>О нас</p>" })
})
app.get("/cookie", (req: Request, res: Response) => {
    res.cookie("username", "Vanya");
    res.send("Cookie created");
});

app.get('/contacts', (_req, res, next) => {
    app.render("pages/contacts", {}, (err, body) => {
        if (err) {
            next(err);
            return;
        }
        res.render("layouts/main", { title: "Contacts | Litera", activePage: "contacts", body });
    });
})

app.get('/books', async (_req, res, next) => {
    try {
        const books = await getBooks();
        app.render("pages/books", { books }, (err, body) => {
            if (err) {
                next(err);
                return;
            }
            res.render("layouts/main", { title: "Книги | Litera", activePage: "books", body });
        });
    } catch (err) {
        next(err);
    }
})

app.get('/books-page', async (_req, res, next) => {
    try {
        const books = await getBooks();
        app.render("pages/books", { books }, (err, body) => {
            if (err) {
                next(err);
                return;
            }
            res.render("layouts/main", { title: "Книги | Litera", activePage: "books", body });
        });
    } catch (err) {
        next(err);
    }
})

// Фронтенд сторінка однієї книги
app.get('/books/:id', async (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).render("layouts/main", { title: "Помилка | Litera", activePage: "books", body: "<p>Невірний id книги</p>" });
        return;
    }
    try {
        const { rows } = await db.query('SELECT id, title, price, is_active, image FROM books WHERE id = $1', [id]);
        if (rows.length === 0) {
            const fallback = fallbackBooks.find((b) => b.id === id);
            if (!fallback) {
                res.status(404).render("layouts/main", { title: "Не знайдено | Litera", activePage: "books", body: "<p>Книгу не знайдено</p>" });
                return;
            }
            app.render("pages/book", { book: fallback }, (err, body) => {
                if (err) {
                    next(err);
                    return;
                }
                res.render("layouts/main", { title: `${fallback.title} | Litera`, activePage: "books", body });
            });
            return;
        }
        const book: BookType = {
            id: Number(rows[0].id),
            title: String(rows[0].title ?? ''),
            authorIds: [],
            year: new Date().getFullYear(),
            description: '',
            genre: '',
            quote: '',
            is_active: Boolean(rows[0].is_active ?? true),
            image: (rows[0].image as string | null) ?? null,
            price: rows[0].price === null || rows[0].price === undefined ? null : Number(rows[0].price),
        };
        app.render("pages/book", { book }, (err, body) => {
            if (err) {
                next(err);
                return;
            }
            res.render("layouts/main", { title: `${book.title} | Litera`, activePage: "books", body });
        });
    } catch (err) {
        next(err);
    }
})

app.use("/api/books", router);
app.use("/", authRouter);

app.listen(PORT, () => {
    cl(`Server has been started ${HOST}:${PORT}`)
})
