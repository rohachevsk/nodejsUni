import type { BookType } from '../types/BookType.js';

export type GetBooksByTitle = (title: string, books: BookType[]) => BookType[] | null;

export const getBooksByTitle: GetBooksByTitle = (title, books) => {
    const booksFiltered = books.filter(
        (book) => title.toLowerCase().trim() === book.title.toLowerCase().trim(),
    );

    return booksFiltered.length > 0 ? booksFiltered : null;
};

export const compareBook = (firstBook: BookType, secondBook: BookType) => secondBook.id - firstBook.id;
