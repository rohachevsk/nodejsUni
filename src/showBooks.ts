import type { BookType } from './Booktype.js';
import { authors } from './authors.js';
import { books } from './data/books.js';

const getAuthorLinks = (authorIds: number[]) => {
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

export const showBooks = () => {
    return books
        .map(
            (book) => `
                <div class="book-item">
                    <h2>${book.title}</h2>
                    <p><strong>Автори:</strong> ${getAuthorLinks(book.authorIds)}</p>
                    <p><strong>Год:</strong> ${book.year}</p>
                    <p>${book.description}</p>
                    <a href="/book?id=${book.id}">Смотреть</a>
                </div>
            `
        )
        .join('');
};

export const getBookById = (id: number) => {
    return books.find((book) => book.id === id);
};

export default books;
