import type { BookType } from './Booktype.js';

const books: BookType[] = [
    {
        id: 1,
        title: 'Дюна',
        author: 'Френк Герберт',
        year: 1965,
        description: 'Эпическая сага о власти, вере и выживании на пустынной планете Арракис.',
        genre: 'Фантастика',
        quote: '«Пустыня учит видеть не глазами, а сердцем.»',
    },
    {
        id: 2,
        title: 'Властелин колец',
        author: 'Дж. Р. Р. Толкин',
        year: 1954,
        description: 'Путешествие по Средиземью, где дружба, мужество и честь становятся главными героями.',
        genre: 'Фэнтези',
        quote: '«Не все те, кто бродят, потеряны.»',
    },
    {
        id: 3,
        title: 'Гордость и предубеждение',
        author: 'Джейн Остин',
        year: 1813,
        description: 'Классическая история о любви, достоинстве и социальном мире.',
        genre: 'Классика',
        quote: '«Ум и характер редко могут быть в равновесии.»',
    },
];

export const showBooks = () => {
    return books
        .map(
            (book) => `
                <div class="book-item">
                    <h2>${book.title}</h2>
                    <p><strong>Автор:</strong> ${book.author}</p>
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
