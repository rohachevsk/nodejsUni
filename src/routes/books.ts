import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { db } from '../db.js';
import type { BookType } from '../types/BookType.js';
import type { BookResponseType } from '../types/BookResponseType.js';

const router = Router();
// Логер підключено глобально в server.ts (app.use), тут дублювати не треба

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

mkdirSync(IMAGES_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, unique);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error('Невалідний тип файлу: дозволені лише jpg, jpeg, png, gif, webp'));
    },
});

// Обгортка над upload.single: помилки multer/fileFilter → 400 JSON, а не 500 HTML.
const uploadCover = (req: Request, res: Response, next: NextFunction): void => {
    upload.single('cover')(req, res, (err: unknown) => {
        if (err) {
            const message =
                err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
                    ? 'Файл завеликий: максимальний розмір 5 МБ'
                    : err instanceof Error && err.message
                      ? err.message
                      : 'Помилка завантаження файлу';
            res.status(400).json({ status: 400, data: null, error: message });
            return;
        }
        next();
    });
};

// is_active може прийти як boolean (JSON) або рядком (multipart FormData).
const parseIsActive = (value: unknown, fallback: boolean): boolean => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (['true', '1', 'on'].includes(v)) return true;
        if (['false', '0', 'off'].includes(v)) return false;
    }
    return Boolean(value);
};

function mapRow(row: Record<string, unknown>): BookType {
    return {
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
    };
}

// 2) Отримання всіх книг з БД
router.get('/', async (_req: Request, res: Response) => {
    try {
        const { rows } = await db.query('SELECT id, title, price, is_active, image FROM books ORDER BY id');
        const books = rows.map(mapRow);
        const response: BookResponseType = {
            data: books,
            error: books.length === 0 ? 'Books list is empty' : null,
            status: books.length === 0 ? 404 : 200,
        };
        res.status(response.status).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// 4) Отримання книг за полем title з БД
router.get('/search', async (req: Request, res: Response) => {
    const title = String(req.query.title ?? '').trim();
    if (!title) {
        res.status(400).json({ status: 400, data: null, error: 'Query param "title" is required' });
        return;
    }
    try {
        const { rows } = await db.query(
            'SELECT id, title, price, is_active, image FROM books WHERE LOWER(title) LIKE LOWER($1) ORDER BY id',
            [`%${title}%`]
        );
        const books = rows.map(mapRow);
        const response: BookResponseType = {
            data: books,
            error: books.length === 0 ? 'No books found matching that title' : null,
            status: books.length === 0 ? 404 : 200,
        };
        res.status(response.status).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// 3) Отримання книги за id з БД
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ status: 400, data: null, error: 'Invalid book id' });
        return;
    }
    try {
        const { rows } = await db.query(
            'SELECT id, title, price, is_active, image FROM books WHERE id = $1',
            [id]
        );
        if (rows.length === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        const response: BookResponseType = {
            data: mapRow(rows[0]),
            error: null,
            status: 200,
        };
        res.status(200).json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// Створення книжки в БД: multipart з файлом cover (multer) або JSON з полем image
router.post('/', uploadCover, async (req: Request, res: Response) => {
    const { title, price, is_active, image } = req.body ?? {};
    if (!title) {
        res.status(400).json({ status: 400, data: null, error: 'Missing required field: title' });
        return;
    }
    // Пріоритет: завантажений файл > рядок image > null
    const coverImage = req.file ? req.file.filename : (image ?? null);
    try {
        const { rows } = await db.query(
            'INSERT INTO books (title, price, is_active, image) VALUES ($1, $2, $3, $4) RETURNING id, title, price, is_active, image',
            [String(title), Number(price) || 0, parseIsActive(is_active, true), coverImage]
        );
        res.status(201).json({ status: 201, data: mapRow(rows[0]), error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// Повне оновлення книжки в БД: новий файл cover замінює обкладинку (старий файл видаляється)
router.put('/:id', uploadCover, async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ status: 400, data: null, error: 'Invalid book id' });
        return;
    }
    const { title, price, is_active, image } = req.body ?? {};
    const hasActive = is_active !== undefined && is_active !== null && is_active !== '';
    const newImage = req.file ? req.file.filename : (image ?? null);
    try {
        const previous = await db.query('SELECT image FROM books WHERE id = $1', [id]);
        if (previous.rows.length === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        const { rows } = await db.query(
            'UPDATE books SET title = COALESCE($1, title), price = COALESCE($2, price), is_active = COALESCE($3, is_active), image = COALESCE($4, image) WHERE id = $5 RETURNING id, title, price, is_active, image',
            [title ?? null, price ?? null, hasActive ? parseIsActive(is_active, true) : null, newImage, id]
        );
        if (rows.length === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        // Замінили обкладинку файлом — видаляємо старий файл з диска
        const oldImage = previous.rows[0].image as string | null;
        if (req.file && oldImage && oldImage !== newImage) {
            const filePath = path.join(IMAGES_DIR, path.basename(oldImage));
            if (filePath.startsWith(IMAGES_DIR)) {
                await unlink(filePath).catch(() => undefined);
            }
        }
        res.status(200).json({ status: 200, data: mapRow(rows[0]), error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// Видалення книжки за id з БД + видалення файлу обкладинки з сервера
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ status: 400, data: null, error: 'Invalid book id' });
        return;
    }
    try {
        const { rows } = await db.query('SELECT image FROM books WHERE id = $1', [id]);
        if (rows.length === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [id]);
        if (rowCount === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        const image = rows[0].image as string | null;
        if (image) {
            // basename + перевірка префікса: файл має лежати всередині public/images
            const filePath = path.join(IMAGES_DIR, path.basename(image));
            if (filePath.startsWith(IMAGES_DIR)) {
                await unlink(filePath).catch(() => undefined); // файлу вже може не бути — не помилка
            }
        }
        res.status(200).json({ status: 200, data: { id }, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

export default router;
