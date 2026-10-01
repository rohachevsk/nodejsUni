import { Router, type NextFunction, type Request, type Response } from 'express';

const router = Router();

const renderLogin = (req: Request, res: Response, next: NextFunction, error: string | null) => {
    req.app.render('pages/login', { error }, (err, body) => {
        if (err) {
            next(err);
            return;
        }
        res.render('layouts/main', { title: 'Вхід | Litera', activePage: 'login', body });
    });
};

router.get('/login', (req: Request, res: Response, next: NextFunction) => {
    renderLogin(req, res, next, null);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    const username = String(req.body?.username ?? '').trim();
    if (!username) {
        res.status(400);
        renderLogin(req, res, next, 'Введіть імʼя');
        return;
    }
    res.cookie('username', username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.redirect('/');
});

router.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie('username');
    res.redirect('/');
});

export default router;
