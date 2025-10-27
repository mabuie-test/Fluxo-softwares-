# Fluxo Softwares Portal

Aplicação web desenvolvida em Node.js e MongoDB para apresentar os serviços da Fluxo Softwares e fornecer uma área do
cliente com registo, login e gestão de solicitações.

## Funcionalidades

- Landing page com secções de serviços, metodologia, portefólio e chamada para acção.
- Área de contacto com formulário validado e armazenamento das mensagens no MongoDB.
- Registo e login de clientes com hashing de palavra-passe utilizando bcrypt.
- Painel do cliente com estatísticas, histórico de pedidos e formulário para novas solicitações.
- Sessões persistidas em MongoDB através de `connect-mongo`.
- Interface vibrante e responsiva inspirada em design futurista.

## Requisitos

- Node.js 18+
- MongoDB 6+

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um ficheiro `.env` com base em `.env.example`:

   ```env
   MONGODB_URI=mongodb://localhost:27017/fluxo_softwares
   SESSION_SECRET=uma-chave-super-secreta
   PORT=3000
   ```

3. Inicie a aplicação em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

   A aplicação estará disponível em `http://localhost:3000`.

## Scripts disponíveis

- `npm start` – executa o servidor em produção.
- `npm run dev` – executa o servidor com nodemon para recarregamento automático.

## Estrutura

```
public/        # Ficheiros estáticos (CSS, JS, imagens)
views/         # Templates EJS da aplicação
routes/        # Rotas Express (landing, auth, solicitações)
models/        # Modelos Mongoose
middleware/    # Middlewares personalizados
server.js      # Ponto de entrada do servidor Express
```

## Licença

MIT
