import { authors } from './authors.js';
import { getBookById, showBooks } from './showBooks.js';

const getAuthorLinksHtml = (authorIds: number[]) => {
    if (!authorIds.length) {
        return 'Не вказано';
    }

    return authorIds
        .map((authorId) => {
            const author = authors.find((item) => item.id === authorId);
            return author ? `<a href="/authors?id=${author.id}">${author.name}</a>` : 'Невідомий автор';
        })
        .join(', ');
};

export const renderMainPage = () => `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Книжный каталог</title>
        <style>
            body {
                margin: 0;
                padding: 40px;
                font-family: Arial, sans-serif;
                background: #111827;
                color: #f9fafb;
            }
            .book-item {
                border: 1px solid #374151;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                background: #1f2937;
            }
            a {
                color: #60a5fa;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <h1>Книги</h1>
        ${showBooks()}
    </body>
    </html>
`;

export const renderBookPage = (id: number) => {
    const book = getBookById(id);

    if (!book) {
        return `
            <!DOCTYPE html>
            <html lang="ru">
            <head><meta charset="UTF-8" /><title>Книга не найдена</title></head>
            <body>
                <h1>Книга не найдена</h1>
                <a href="/">Назад</a>
            </body>
            </html>
        `;
    }

    return `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${book.title}</title>
            <style>
                body {
                    margin: 0;
                    padding: 40px;
                    font-family: Arial, sans-serif;
                    background: #111827;
                    color: #f9fafb;
                }
                .book-card {
                    max-width: 700px;
                    border: 1px solid #374151;
                    border-radius: 12px;
                    background: #1f2937;
                    padding: 24px;
                }
                a {
                    color: #60a5fa;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="book-card">
                <h1>${book.title}</h1>
                <p><strong>Автори:</strong> ${getAuthorLinksHtml(book.authorIds)}</p>
                <p><strong>Год:</strong> ${book.year}</p>
                <p><strong>Жанр:</strong> ${book.genre}</p>
                <p>${book.description}</p>
                <blockquote>${book.quote}</blockquote>
                <a href="/">Назад к каталогу</a>
            </div>
        </body>
        </html>
    `;
};
