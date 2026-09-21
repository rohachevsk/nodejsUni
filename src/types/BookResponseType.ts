import type { BookType } from './BookType.js';

export type BookResponseType = {
    status: number;
    data: BookType[] | BookType | null;
    error: string | null;
};
