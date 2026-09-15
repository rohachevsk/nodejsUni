import type { BookType } from './Booktype.js';
import { authors } from './authors.js';

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

const books: BookType[] = [
    {
        id: 1,
        title: 'Дюна',
        authorIds: [1],
        year: 1965,
        description: 'Эпическая сага о власти, вере и выживании на пустынной планете Арракис.',
        genre: 'Фантастика',
        quote: '«Пустыня учит видеть не глазами, а сердцем.»',
        is_active: true,
    },
    {
        id: 2,
        title: 'Властелин колец',
        authorIds: [2],
        year: 1954,
        description: 'Путешествие по Средиземью, где дружба, мужество и честь становятся главными героями.',
        genre: 'Фэнтези',
        quote: '«Не все те, кто бродят, потеряны.»',
        is_active: true,
    },
    {
        id: 3,
        title: 'Гордость и предубеждение',
        authorIds: [3],
        year: 1813,
        description: 'Классическая история о любви, достоинстве и социальном мире.',
        genre: 'Классика',
        quote: '«Ум и характер редко могут быть в равновесии.»',
        is_active: false,
    },
    {
        id: 4,
        title: 'Testing',
        authorIds: [5, 6],
        year: 2024,
        description: 'Example book for filtering by title and active status.',
        genre: 'Test',
        quote: '«Test quote.»',
        is_active: true,
    },
    {
        id: 5,
        title: 'My Test Book',
        authorIds: [1, 6],
        year: 2023,
        description: 'Another example book with the word test in the title.',
        genre: 'Test',
        quote: '«Another test quote.»',
        is_active: true,
    },
];
export type getBooksByTitleType = (title: string, books: BookType[]) => BookType[] | null;
export const getBooksByTitle: getBooksByTitleType = (title: string, books: BookType[]) => {
    const booksFiltered = books.filter(
        (book: BookType) => title.toLowerCase().trim() === book.title.toLocaleLowerCase().trim()
    );

    if (booksFiltered.length > 0) {
        return booksFiltered;
    }

    return null;
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
