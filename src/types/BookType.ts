export type BookType = {
    id: number;
    title: string;
    authorIds: number[];
    year: number;
    description: string;
    genre: string;
    quote: string;
    is_active: boolean;
    image?: string | null;
    price?: number | null;
};

export type BookCreateType = Omit<BookType, 'id'> & {
    author?: string;
};
