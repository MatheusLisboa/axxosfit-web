# AI_CONTEXT.md

# AxosFit

## Visão Geral

AxosFit é um SaaS para Personal Trainers.

O Personal Trainer é o cliente pagante da plataforma.

O aluno NÃO paga pelo sistema.

O Personal Trainer assina um plano e pode cadastrar seus alunos, criar treinos, avaliações físicas, acompanhar evolução e utilizar recursos de IA.

O sistema é Mobile First, pois a maior parte dos acessos após login acontece via smartphone.

---

# Público-Alvo

## Cliente Pagante

- Personal Trainers
- Assessorias esportivas
- Pequenos estúdios

## Usuário Final

- Alunos dos Personais

---

# Modelo de Negócio

## Trial

Todo novo Personal recebe:

- 14 dias grátis
- Plano Starter
- Sem cartão obrigatório

Ao criar a conta:

1. Conta é criada
2. Perfil do Trainer é criado
3. Assinatura Trial é criada
4. Login é realizado automaticamente
5. Usuário entra direto no painel

---

# Planos

## Starter

R$ 99,90/mês

Recursos:

- Até 10 alunos ativos
- Criação de treinos
- Aplicativo do aluno
- Suporte por e-mail

---

## Pro

R$ 149,90/mês

Tudo do Starter +

- Até 20 alunos ativos
- Avaliação física
- IA Assistente Básica
- Financeiro
- Suporte WhatsApp

---

## Studio

R$ 189,90/mês

Tudo do Pro +

- Alunos ilimitados

---

# Fluxo de Cadastro

## Personal Trainer

Cadastro:

- Nome
- E-mail
- Senha
- CPF
- CREF
- Telefone
- Data de nascimento
- CEP
- Endereço
- Nº
- Bairro
- Complemento
- Cidade
- UF

Após cadastro:

- Cria usuário no Supabase Auth
- Cria Profile
- Cria Trainer
- Cria Subscription Trial
- Faz Login automático

---

## Aluno

O aluno NÃO cria conta pública.

Conta é criada pelo Personal Trainer.

Aluno recebe acesso posteriormente.

Cadastro:

- Nome
- E-mail
- Telefone
- CPF
- Data de nascimento
- Mensalidade
- Data de vencimento
- CEP
- Endereço
- Nº
- Objetivo

Após cadastro:

- Cria usuário no Supabase Auth
- Cria Profile
- Cria Students

---

# Stack

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS

## Backend

- Express
- TypeScript

## Banco

- Supabase PostgreSQL

## Auth

- Supabase Auth

## IA

- Google Gemini

## Pagamentos

- Asaas

---

# Integração Asaas

Fluxo:

1. Personal inicia Trial
2. Trial expira
3. Sistema solicita assinatura
4. Backend cria cobrança recorrente no Asaas
5. Usuário realiza pagamento
6. Asaas envia Webhook
7. Subscription é atualizada
8. Plano é liberado

Nunca confiar apenas no frontend para validar pagamentos.

Sempre validar pelo Webhook.

---

# Estrutura Principal do Banco

## profiles

Informações gerais do usuário.

## trainers

Dados do Personal Trainer.

## students

Dados dos alunos.

## exercises

Biblioteca de exercícios.

## workouts

Treinos publicados.

## workout_days

Divisões A, B, C, D...

## workout_exercises

Exercícios vinculados ao treino.

Campos esperados:

- sets
- reps
- load
- rest_seconds
- observations

Essas informações pertencem ao treino e NÃO ao exercício.

---

## subscriptions

Controle de planos.

Status possíveis:

- trial
- active
- pending
- expired
- canceled

---

## payments

Histórico financeiro.

---

# Regra dos Exercícios

Exercício é apenas o modelo.

Exemplos:

- Supino Reto
- Agachamento Livre
- Leg Press

Não armazenar:

- carga
- séries
- repetições
- descanso

Essas informações pertencem ao treino.

---

# Regra dos Treinos

Um aluno pode possuir múltiplos treinos ativos.

Exemplo:

- Treino A
- Treino B
- Treino C

Os treinos NÃO devem se desativar mutuamente.

Cada treino possui:

- Nome
- Dia da semana
- Exercícios
- Séries
- Repetições
- Descanso
- Carga

---

# Avaliação Física

Deve ser separada da Anamnese.

## Anamnese

Coleta:

- Objetivo
- Histórico
- Lesões
- Restrições
- Medicamentos

## Avaliação Física

Coleta:

- Peso
- Altura
- IMC
- Percentual de gordura
- Braço
- Peitoral
- Cintura
- Abdômen
- Quadril
- Coxa
- Panturrilha

---

# IA

A IA deve:

- Auxiliar o Personal
- Nunca substituir o profissional
- Gerar sugestões
- Gerar observações
- Gerar insights

A IA não deve alterar dados automaticamente.

---

# Diretrizes de Desenvolvimento

Antes de alterar qualquer funcionalidade:

1. Ler AI_CONTEXT.md
2. Ler Banco.md
3. Ler Pagamentos.md

Regras:

- Não quebrar funcionalidades existentes
- Preservar compatibilidade mobile
- Evitar refatorações desnecessárias
- Seguir TypeScript strict
- Utilizar Supabase como fonte principal de dados
- Priorizar performance mobile

---

# Futuro

Produtos planejados:

## AxosFit

Gestão para Personal Trainers

## AxosNutri

Gestão para Nutricionistas

Integração prevista:

- Mesmo usuário
- Mesmo login
- Mesmo aluno/paciente
- Módulos independentes
- Cobrança modular

---

# Objetivo Final

Ser a principal plataforma brasileira para gestão integrada de:

- Personal Trainers
- Nutricionistas
- Assessorias esportivas
- Estúdios

Com foco em experiência mobile, automação e inteligência artificial.