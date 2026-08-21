FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Hugging Face Spaces раздаёт приложение на порту 7860
ENV PORT=7860
EXPOSE 7860
CMD ["python", "run_on_render.py"]
