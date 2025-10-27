# Fluxo Softwares — Gestão de acessos

## Criar a conta de administrador
1. Defina uma chave forte na variável `ADMIN_SETUP_TOKEN` do ficheiro `.env` (consulte `.env.example`).
2. Inicie a aplicação (`npm start`) com a base de dados MongoDB conectada.
3. Faça um pedido `POST` autenticado pelo token para `https://<seu-dominio>/admin/registo` com os campos abaixo:
   - `token`: exactamente o valor configurado em `ADMIN_SETUP_TOKEN`.
   - `name`: nome completo do administrador.
   - `email`: e-mail institucional único.
   - `password`: palavra-passe com, no mínimo, 12 caracteres.
   - `phone` *(opcional)*: contacto directo.

### Exemplo com `curl`
```bash
curl -X POST https://seu-dominio/admin/registo \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_CONFIGURADO",
    "name": "Administrador Fluxo",
    "email": "admin@fluxo.soft",
    "password": "uma-senha-muito-segura",
    "phone": "+258800000000"
  }'
```

A resposta `201 Created` confirma que a conta foi registada com a permissão de administrador.

## Aceder ao painel como administrador
1. Abra `https://<seu-dominio>/login` no navegador.
2. Autentique-se com o e-mail e palavra-passe definidos para o administrador.
3. Após o login, será redireccionado para `/painel`, onde poderá gerir todas as solicitações dos clientes.

## Operações administrativas no painel
- Utilize o selector de estado na coluna "Acções" para promover cada solicitação entre as fases **Novo**, **Em análise**, **Em
  progresso** e **Concluído**.
- As alterações de estado são gravadas imediatamente e ficam registadas no histórico do cliente.
- Mensagens de confirmação ou erro aparecem no painel lateral, facilitando a conferência das últimas acções.
- Administradores mantêm a visibilidade de todos os pedidos, mas a criação de novas solicitações continua exclusiva dos clientes logados.
