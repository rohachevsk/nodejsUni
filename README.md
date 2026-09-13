# weapon-arena

Небольшой npm-пакет с моделями пользователя, игрока и оружия.

## Установка

```bash
npm install weapon-arena
```

## Использование

```js
import { Bow, Player, Sword, User } from "weapon-arena";

const user = new User("artem", "artem@example.com", 25);
console.log(user.getInfo());

const player = new Player("Vanya", 100, 0, new Sword());
const enemy = new Player("Artem", 100, 0, new Bow());
player.attack(enemy);
console.log(enemy.hp); // 75
```

## Проверка перед публикацией

```bash
npm run check
npm pack --dry-run
```
