# Tabela Profiles

| Campo | Tipo |
|---------|---------|
| id | uuid |
| name | text |
| email | text |
| role | text |

# Tabela Trainers

| Campo | Tipo |
|---------|---------|
| id | uuid |
| cref | text |
| whatsapp | text |

# Tabela Students

| Campo      | Tipo |
| ---------- | ---- |
| id         | uuid |
| trainer_id | uuid |
| objective  | text |