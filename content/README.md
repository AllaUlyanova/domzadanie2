# Папка для учебников и заданий

## Структура

```
content/
  catalog.json          — список учебников (название, предмет, путь к файлу)
  tasks/
    example-tasks.json  — пример формата заданий
  textbooks/
    russian/            — PDF учебника по русскому
    math/
    ...
```

## Как добавить задания

1. Составьте файл `tasks.json` по образцу `tasks/example-tasks.json`.
2. На сайте: раздел **Учебники** → **Выбрать файл**.
3. Поле `date` в формате `YYYY-MM-DD` — задания только на этот день. Без `date` — шаблон на любой день.

## id предметов

`russian`, `reading`, `math`, `world`, `english`, `art`, `music`, `tech`, `pe`
