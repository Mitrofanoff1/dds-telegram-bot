# Развёртывание бота: GitHub + Render.com

Пошаговая инструкция, чтобы бот работал 24/7 без вашего компьютера.

---

## Часть 1. Выложить код на GitHub

### 1.1. Установить Git (если ещё нет)

- **macOS:** откройте «Терминал» и выполните:  
  `xcode-select --install`  
  или установите Git с [git-scm.com](https://git-scm.com).
- Проверка: в терминале введите `git --version` — должна появиться версия.

### 1.2. Зарегистрироваться на GitHub

1. Зайдите на [github.com](https://github.com).
2. Нажмите **Sign up** и создайте аккаунт (логин, email, пароль).

### 1.3. Создать новый репозиторий на GitHub

1. Войдите в GitHub → справа вверху нажмите **+** → **New repository**.
2. **Repository name:** например `dds-telegram-bot`.
3. **Public**.
4. **НЕ** ставьте галочки «Add a README» / «Add .gitignore» — репозиторий создайте пустым.
5. Нажмите **Create repository**.

На следующей странице GitHub покажет команды — они понадобятся в шаге 1.5.

### 1.4. Открыть папку проекта в терминале

В Cursor откройте встроенный терминал (**Terminal → New Terminal**) или системный «Терминал» и перейдите в папку бота:

```bash
cd /Users/timofejmitrofanov/dds-telegram-bot
```

### 1.5. Инициализировать Git и отправить код на GitHub

Выполните по очереди (подставьте вместо `ВАШ_ЛОГИН` свой логин GitHub из шага 1.2):

```bash
git init
git add .
git status
```

В `git status` не должно быть файлов `.env` и `credentials.json` — они в `.gitignore`, в репозиторий не попадут (так и нужно).

Дальше:

```bash
git commit -m "Первый коммит: бот ДДС на Python"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/dds-telegram-bot.git
git push -u origin main
```

При первом `git push` браузер или терминал попросят войти в GitHub (логин и пароль или токен). Если просят **токен**: GitHub → Settings → Developer settings → Personal access tokens → создать токен с правом `repo` и вставить его вместо пароля.

После успешного `push` код будет на GitHub по адресу:  
`https://github.com/ВАШ_ЛОГИН/dds-telegram-bot`.

---

## Часть 2. Развернуть бота на Render.com

Бот работает в режиме **polling** (постоянно опрашивает Telegram). На Render для этого подходит тип сервиса **Background Worker**.

### 2.1. Регистрация на Render

1. Зайдите на [render.com](https://render.com).
2. Нажмите **Get Started for Free**.
3. Войдите через **GitHub** (удобно — Render получит доступ к вашим репозиториям).

### 2.2. Создать Background Worker

1. В личном кабинете Render нажмите **New +** → **Background Worker**.
2. В списке репозиториев выберите **dds-telegram-bot** (если его нет — нажмите **Configure account** и дайте Render доступ к нужному репо).
3. Заполните:
   - **Name:** например `dds-bot`.
   - **Region:** выберите ближайший (например Frankfurt).
   - **Branch:** `main`.
   - **Build Command:**  
     `pip install -r requirements.txt`
   - **Start Command:**  
     `python run_on_render.py`  
     (используем отдельный скрипт, который создаёт `credentials.json` из переменной окружения и запускает бота — см. ниже.)

### 2.3. Переменные окружения (Environment Variables)

В том же сервисе откройте вкладку **Environment** и добавьте переменные (кнопка **Add Environment Variable**):

| Key | Value |
|-----|--------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `GOOGLE_SHEET_ID` | ID вашей Google-таблицы |
| `GOOGLE_CREDENTIALS_PATH` | `credentials.json` |
| `CREDENTIALS_JSON` | **Весь текст** из вашего файла `credentials.json` (скопируйте от первой `{` до последней `}`). В Render можно вставить многострочное значение. |

Опционально:

- `TELEGRAM_ALLOWED_IDS` — ваш Telegram user id (число) или несколько через запятую, если нужно ограничить доступ.

**Как вставить CREDENTIALS_JSON:** откройте локальный `credentials.json`, скопируйте всё содержимое (одной строкой или с переносами — Render примет), вставьте в поле Value. Кавычки внутри JSON не удаляйте.

### 2.4. Сохранить и развернуть

1. Нажмите **Create Background Worker**.
2. Render начнёт сборку (Build), затем запустит **Start Command**. В логах (вкладка **Logs**) должно быть видно запуск бота без ошибок.

Если в логах есть ошибка про `credentials.json` или `CREDENTIALS_JSON` — проверьте, что переменная `CREDENTIALS_JSON` задана и содержит полный JSON (начинается с `{` и заканчивается на `}`).

### 2.5. Бесплатный план Render

- **Free** Background Worker может работать ограниченное количество часов в месяц (уточняйте на [render.com](https://render.com) в разделе планов).
- После неактивности сервис может «засыпать»; при следующем запросе к боту возможна задержка (пока сервис снова поднимется). Для круглосуточной работы без ограничений нужен платный план.

---

## Краткий чеклист

- [ ] Git установлен, репозиторий создан на GitHub, код запушен (`git push`).
- [ ] На Render создан Background Worker, подключён репозиторий `dds-telegram-bot`.
- [ ] Build: `pip install -r requirements.txt`, Start: `python run_on_render.py`.
- [ ] В Environment заданы: `TELEGRAM_BOT_TOKEN`, `GOOGLE_SHEET_ID`, `GOOGLE_CREDENTIALS_PATH=credentials.json`, `CREDENTIALS_JSON` (полный JSON ключа).
- [ ] В Logs нет ошибок, бот в Telegram отвечает на /start.

Если на каком-то шаге что-то не получается — напишите, на каком шаге и что именно видите (сообщение об ошибке или скрин).
