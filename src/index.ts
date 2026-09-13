import path from "node:path";
import FileWorker from "./files.js";

const SERVER_NAME = "Books Server";
const LOGS_DIR = path.resolve("logs");
const DEMO_DIR = path.join(LOGS_DIR, "fs-practice");
const SOURCE_FILE = path.join(DEMO_DIR, "demo.txt");
const COPY_FILE = path.join(DEMO_DIR, "demo-copy.txt");
const RENAMED_FILE = path.join(DEMO_DIR, "demo-renamed.txt");

console.log(SERVER_NAME);

await FileWorker.ensureDir(DEMO_DIR);
console.log("Directory created:", DEMO_DIR);

const dirItems = await FileWorker.listDir(LOGS_DIR);
console.log("Files in logs folder:", dirItems);

const isAvailable = await FileWorker.checkAccess(DEMO_DIR);
console.log("Access check:", isAvailable);

const stats = await FileWorker.getStats(DEMO_DIR);
console.log("Directory size and type:", { isDirectory: stats.isDirectory(), size: stats.size });

const userText = "This file was created with fs methods in the project.";
await FileWorker.writeToFile(SOURCE_FILE, userText);
console.log("Source file created.");

await FileWorker.copyFileSafe(SOURCE_FILE, COPY_FILE);
console.log("Copied file created:", COPY_FILE);

await FileWorker.renameFile(COPY_FILE, RENAMED_FILE);
console.log("File renamed:", RENAMED_FILE);

const realPath = await FileWorker.getRealPath(RENAMED_FILE);
console.log("Real path:", realPath);

const fileContent = await FileWorker.readFile(RENAMED_FILE);
console.log("Read result:", fileContent);

const watcher = FileWorker.watchFile(RENAMED_FILE, (eventType, filename) => {
    console.log(`Watcher event: ${eventType}, file: ${filename ?? "unknown"}`);
});

await FileWorker.writeToFile(RENAMED_FILE, "Updated by watcher demo.");
await new Promise((resolve) => setTimeout(resolve, 200));
watcher.close();

await FileWorker.removeFile(RENAMED_FILE);
console.log("Temporary renamed file removed.");

await FileWorker.removeDir(DEMO_DIR);
console.log("Demo directory removed.");

FileWorker.path = path.join("logs", "logs.txt");
console.log("Path set:", FileWorker.path);

const content = await FileWorker.getContent();
if (content.trim().length > 0) {
    await FileWorker.writeToFile(FileWorker.path, content);
}