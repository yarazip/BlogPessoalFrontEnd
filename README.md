# Blogify (front-end)

Front-end em **Angular 19** do Blog Pessoal: cadastro e login, postagens por usuário, feed público e dashboard.
O back-end (Spring Boot) fica em outro repositório: [BlogPessoal](https://github.com/yarazip/BlogPessoal).

Publicado no Netlify.

## Rodando localmente

Pré-requisitos: Node 22 e o back-end rodando em `http://localhost:8080` (veja o README dele).

```bash
npm ci
npm start          # http://localhost:4200
```

O endereço da API vem de `src/environments/`:

| Arquivo | Quando | `apiUrl` |
|---|---|---|
| `environment.ts` | `npm start` (desenvolvimento) | `http://localhost:8080/api` |
| `environment.prod.ts` | `npm run build` (produção) | URL da API publicada |

> O back-end só aceita requisições (CORS) das origens configuradas em `CORS_ALLOWED_ORIGINS`. Em
> desenvolvimento, `http://localhost:4200` já é permitida.

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | servidor de desenvolvimento |
| `npm run build` | build de produção em `dist/blogify` |
| `npm test` | testes no Chrome, em modo observação |
| `npm run test:ci` | testes uma vez, com Chrome sem interface (usado no CI) |

## Testes

Testes unitários com Jasmine + Karma, cobrindo serviços, interceptor, guard, formulários e segurança
(por exemplo, que HTML em uma postagem é exibido como texto e nunca executado).

```bash
npm run test:ci
```

No Windows, se o Chrome não for encontrado: `set CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe`.

## Como o app funciona

- **Sessão:** o login devolve um JWT, guardado no `localStorage` (sem o prefixo `Bearer`). O `authInterceptor`
  o envia **somente** para a API e nunca no login/cadastro. Uma resposta 401 a uma requisição autenticada
  encerra a sessão e leva ao login com um aviso. O `authGuard` também rejeita tokens expirados.
- **Erros da API** seguem o padrão RFC 7807 (`detail`, `errors` por campo, `requestId` nos erros 500);
  `mensagemDeErro()` os converte em texto para o usuário.
- **Validações** dos formulários espelham as da API (título 5–100, texto 10–1000, senha 8–72 caracteres).
  Se mudar um lado, mude o outro (`LIMITES_POSTAGEM` em `models/Postagem.ts`).
- **Tema claro/escuro:** `ThemeService` é a única fonte da preferência.
- **Conteúdo de usuário nunca vira HTML:** o texto das postagens é exibido por interpolação; as quebras de
  linha vêm de CSS (`.texto-postagem`). Não use `[innerHTML]` nem `bypassSecurityTrust*` com esse conteúdo.

## Deploy (Netlify)

O `netlify.toml` define o redirecionamento da SPA e os **cabeçalhos de segurança**, incluindo uma
Content-Security-Policy restrita. Ao mudar a URL da API em `environment.prod.ts`, atualize também o
`connect-src` da CSP. O build de produção desliga o "critical CSS inline" (`inlineCritical: false` em
`angular.json`) porque ele depende de um `onload` inline que a CSP bloqueia.

## Limitações conhecidas

- "Esqueci a senha" ainda não existe na API: a tela apenas informa que está em desenvolvimento.
- Não há tela para criar temas (hoje são criados pela API). Um banco novo começa sem temas.
- O token fica no `localStorage`, como é comum em SPAs com JWT; a CSP e a ausência de `innerHTML` com
  conteúdo de usuário reduzem o risco de XSS, mas não o eliminam por completo.
