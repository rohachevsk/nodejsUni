import { Router, type Request, type Response } from 'express';
import { db } from '../db.js';
import type { BookType } from '../types/BookType.js';
import type { BookResponseType } from '../types/BookResponseType.js';

const router = Router();

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

// Створення книжки в БД
router.post('/', async (req: Request, res: Response) => {
    const { title, price, is_active, image } = req.body ?? {};
    if (!title) {
        res.status(400).json({ status: 400, data: null, error: 'Missing required field: title' });
        return;
    }
    try {
        const { rows } = await db.query(
            'INSERT INTO books (title, price, is_active, image) VALUES ($1, $2, $3, $4) RETURNING id, title, price, is_active, image',
            [String(title), Number(price) || 0, is_active ?? true, image ?? null]
        );
        res.status(201).json({ status: 201, data: mapRow(rows[0]), error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// Повне оновлення книжки в БД
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ status: 400, data: null, error: 'Invalid book id' });
        return;
    }
    const { title, price, is_active, image } = req.body ?? {};
    try {
        const { rows } = await db.query(
            'UPDATE books SET title = COALESCE($1, title), price = COALESCE($2, price), is_active = COALESCE($3, is_active), image = COALESCE($4, image) WHERE id = $5 RETURNING id, title, price, is_active, image',
            [title ?? null, price ?? null, is_active ?? null, image ?? null, id]
        );
        if (rows.length === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        res.status(200).json({ status: 200, data: mapRow(rows[0]), error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

// Видалення книжки за id з БД
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        res.status(400).json({ status: 400, data: null, error: 'Invalid book id' });
        return;
    }
    try {
        const { rowCount } = await db.query('DELETE FROM books WHERE id = $1', [id]);
        if (rowCount === 0) {
            res.status(404).json({ status: 404, data: null, error: 'The book not found' });
            return;
        }
        res.status(200).json({ status: 200, data: { id }, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 500, data: null, error: 'Database error' });
    }
});

export default router;
