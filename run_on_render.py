#!/usr/bin/env python3
"""
Скрипт запуска бота на Render.com.
Создаёт credentials.json из переменной окружения CREDENTIALS_JSON и запускает bot.py.
В Render в Environment задайте CREDENTIALS_JSON = полное содержимое вашего credentials.json.
"""
import os
import sys

def main():
    creds_json = os.environ.get("CREDENTIALS_JSON")
    if creds_json:
        path = os.environ.get("GOOGLE_CREDENTIALS_PATH", "credentials.json")
        with open(path, "w", encoding="utf-8") as f:
            f.write(creds_json)
        print("credentials.json создан из CREDENTIALS_JSON", file=sys.stderr)
    else:
        print("CREDENTIALS_JSON не задан; ожидается файл credentials.json", file=sys.stderr)

    import bot
    bot.main()

if __name__ == "__main__":
    main()
