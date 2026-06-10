# EscalaDI 📋

Sistema de gestão de escalas do **Departamento Infantil** da Igreja Verbo da Vida Casa Caiada.

> Acesse em produção: [https://escala-di.onrender.com](https://escala-di.onrender.com)

---

## 📌 Sobre o Projeto

O EscalaDI permite que líderes organizem as escalas mensais de voluntários (professores e monitores) por sala, evitando conflitos de agenda e facilitando a geração do PDF de escala mensal.

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Node.js + Express (ESM) |
| Banco de Dados | PostgreSQL (Supabase) |
| Autenticação | JWT customizado (HMAC SHA-256) |
| Frontend | HTML + CSS + JavaScript puro |
| PDF | jsPDF + html2canvas (client-side) |
| Deploy | Render (Web Service) |

---

## 📁 Estrutura do Projeto

```
escala-di/
├── index.js                  # Entry point
├── server.js                 # Express app + rotas + middlewares
├── package.json
├── .env.example
├── config/
│   └── db.js                 # Pool de conexão PostgreSQL
├── controllers/              # Lógica de negócio
│   ├── configController.js
│   ├── escalaController.js
│   ├── salaController.js
│   ├── userController.js
│   └── vinculoController.js
├── middleware/
│   └── authMiddleware.js     # validarToken, apenasLider
├── models/                   # Queries SQL
│   ├── configModel.js
│   ├── escalaModel.js
│   ├── salaModel.js
│   ├── userModel.js
│   └── vinculoModel.js
├── routes/                   # Definição das rotas
│   ├── configRoutes.js
│   ├── escalaRoutes.js
│   ├── salaRoutes.js
│   ├── userRoutes.js
│   └── vinculoRoutes.js
├── utils/
│   └── auth.js               # hashSenha, criarToken, verificarToken
├── scripts/
│   └── initUsers.mjs         # Seed inicial de usuários
└── public/                   # Arquivos estáticos
    ├── index.html            # Interface principal
    ├── login.html            # Tela de login
    ├── pdf.html              # Template do PDF
    ├── logo-esq.png          # Logo Verbo da Vida
    └── logo-dir.png          # Logo DI Crianças
```

---

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/escala-di.git
cd escala-di
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env
```

```env
PORT=3000
DATABASE_URL=postgres://USER:SENHA@HOST:5432/BANCO
JWT_SECRET=troque_essa_chave
PASSWORD_SALT=troque_esse_salt
NODE_ENV=development
```

### 4. Configure o banco de dados

Execute no Supabase (SQL Editor) para garantir o auto-increment das tabelas:

```sql
-- Tabela vinculos
CREATE SEQUENCE IF NOT EXISTS vinculos_id_seq OWNED BY vinculos.id;
ALTER TABLE vinculos ALTER COLUMN id SET DEFAULT nextval('vinculos_id_seq');
SELECT setval('vinculos_id_seq', COALESCE((SELECT MAX(id) FROM vinculos), 1));

-- Tabela escala
CREATE SEQUENCE IF NOT EXISTS escala_id_seq OWNED BY escala.id;
ALTER TABLE escala ALTER COLUMN id SET DEFAULT nextval('escala_id_seq');
SELECT setval('escala_id_seq', COALESCE((SELECT MAX(id) FROM escala), 1));
```

### 5. Rode em desenvolvimento

```bash
npm run dev
```

### 6. Acesse

```
http://localhost:3000
```

---

## 🌐 Rotas da Aplicação (Frontend)

| URL | Descrição |
|-----|-----------|
| `/` | Tela de login |
| `/login` | Tela de login |
| `/app` | Sistema principal (requer autenticação) |

---

## 🔌 API REST

### Autenticação — `/users`

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| POST | `/users/login` | Login, retorna token JWT | Pública |
| GET | `/users` | Lista voluntários com vínculos | Token |
| POST | `/users` | Cria voluntário | Líder/Admin |
| PUT | `/users/:email` | Atualiza voluntário e vínculos | Líder/Admin |
| DELETE | `/users/:email` | Remove voluntário | Líder/Admin |

### Escala — `/escala`

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/escala?mes=&sala=` | Lista escalas do mês/sala | Token |
| POST | `/escala` | Cria escala (valida conflitos) | Líder/Admin |
| PUT | `/escala/:id` | Atualiza escala | Líder/Admin |
| DELETE | `/escala/:id` | Remove escala | Líder/Admin |
| GET | `/escala/historico?pessoa_id=&mes=` | Histórico do voluntário | Token |

### Vínculos — `/vinculos`

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/vinculos?sala=` | Voluntários de uma sala | Token |
| GET | `/vinculos/pessoa/:email` | Vínculos de uma pessoa | Token |

### Salas — `/salas`

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/salas` | Lista todas as salas | Pública |

### Configurações — `/config`

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| GET | `/config` | Configuração atual | Pública |
| POST | `/config/travar` | Trava o mês | Líder/Admin |
| POST | `/config/destravar` | Destrava o mês | Líder/Admin |
| DELETE | `/config/limpar` | Limpa escala e destrava | Líder/Admin |

---

## 👥 Perfis de Acesso

| Perfil | eh_lider | is_admin | Permissões |
|--------|----------|----------|-----------|
| Voluntário | false | false | Ver escalas das salas vinculadas e próprio histórico |
| Líder | true | false | Gerenciar escalas, cadastrar integrantes, travar/limpar mês, gerar PDF |
| Administrador | true | true | Acesso total |

---

## 🗄️ Banco de Dados

### Tabelas

- **pessoas** — usuários do sistema (id, nome, email, eh_lider, is_admin, senha)
- **vinculos** — relação voluntário ↔ sala + função (id, pessoa_id, sala, funcao)
- **escala** — escalas mensais (id, mes, data, dia_semana, evento, sala, professor_id, monitor1-4_id)
- **salas** — salas disponíveis (id, nome)
- **configuracoes** — controle de travamento do mês (travado, mes_atual)

---

## 🔒 Segurança

- Senhas armazenadas com hash **SHA-256 + salt** (módulo nativo `crypto`)
- Autenticação via **JWT customizado** (HMAC SHA-256), sem bibliotecas externas
- Token com expiração de **8 horas**
- Rotas protegidas por middleware `validarToken` e `apenasLider`
- Voluntários só acessam salas às quais estão vinculados

---

## 📄 Deploy no Render

| Configuração | Valor |
|-------------|-------|
| Build Command | `npm install` |
| Start Command | `node index.js` |
| Node Version | 18+ |
| Variáveis de ambiente | Configurar no painel do Render |

---

## 📝 Observações

- O PDF é gerado **client-side** via `jsPDF + html2canvas` — não depende do servidor
- A dependência `puppeteer` pode ser removida do `package.json` pois não é mais utilizada
- As logos `logo-esq.png` e `logo-dir.png` devem estar na pasta `public/`

---

## 📞 Suporte

Dúvidas ou problemas: entre em contato com o líder do Departamento Infantil da Verbo da Vida Casa Caiada.

---

*EscalaDI v1.0 — Verbo da Vida Casa Caiada — 2026*
