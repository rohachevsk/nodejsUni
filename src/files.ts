import * as readline from "node:readline/promises";
import * as fs from "node:fs/promises";
import * as nodeFs from "node:fs";
import type { FSWatcher, Stats } from "node:fs";

export default class FileWorker {
    private static path_to_file: string = "";

    public static set path(path: string) {
        FileWorker.path_to_file = path;
    }

    public static get path(): string {
        return FileWorker.path_to_file;
    }

    // Запитує текст у користувача через консоль і повертає введений рядок.
    public static async getContent(): Promise<string> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        try {
            const content = await rl.question("Enter your content: ");
            return content;
        } catch (error) {
            console.log(`No data entered: ${String(error)}`);
            return "";
        } finally {
            rl.close();
        }
    }

    // Додає текст у файл, зберігаючи кожен запис з нового рядка.
    public static async writeToFile(filePath: string, content: string): Promise<void> {
        try {
            await fs.appendFile(filePath, `${content}\n`, "utf-8");
            console.log(`File successfully written to ${filePath}`);
        } catch (error) {
            console.error(`File was not saved: ${String(error)}`);
        }
    }

    // Читає вміст файлу у текстовому форматі і повертає його рядком.
    public static async readFile(filePath: string): Promise<string | undefined> {
        try {
            return await fs.readFile(filePath, "utf-8");
        } catch (error) {
            console.error(`My Error: ${String(error)}`);
            return undefined;
        }
    }

    // 1) mkdir - створює каталог, якщо його ще немає.
    public static async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
    }

    // 2) readdir - читає список елементів папки і повертає їхні імена.
    public static async listDir(dirPath: string): Promise<string[]> {
        return await fs.readdir(dirPath);
    }

    // 3) stat - отримує детальну інформацію про файл або каталог (розмір, тип, дата створення).
    public static async getStats(filePath: string): Promise<Stats> {
        return await fs.stat(filePath);
    }

    // 4) access - перевіряє, чи є доступ до файлу або папки для читання/запису.
    public static async checkAccess(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    // 5) copyFile - копіює файл в нове місце без зміни вихідного файлу.
    public static async copyFileSafe(source: string, destination: string): Promise<void> {
        await fs.copyFile(source, destination);
    }

    // 6) rename - перейменовує файл або переносить його в іншу директорію.
    public static async renameFile(oldPath: string, newPath: string): Promise<void> {
        await fs.rename(oldPath, newPath);
    }

    // 7) unlink - видаляє файл з диска.
    public static async removeFile(filePath: string): Promise<void> {
        await fs.unlink(filePath);
    }

    // 8) rm - видаляє каталог разом зі всім його вмістом.
    public static async removeDir(dirPath: string): Promise<void> {
        await fs.rm(dirPath, { recursive: true, force: true });
    }

    // 9) realpath - повертає повний канонічний шлях до файлу, враховуючи символьні посилання.
    public static async getRealPath(filePath: string): Promise<string> {
        return await fs.realpath(filePath);
    }

    // 10) watch - відстежує зміни в файлі або папці й викликає callback при події.
    public static watchFile(filePath: string, callback: (eventType: string, filename: string | null) => void): FSWatcher {
        return nodeFs.watch(filePath, { persistent: true }, callback);
    }
}

export { FileWorker };