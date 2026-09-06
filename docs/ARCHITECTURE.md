# Arquitetura Mobile - Recupera Saúde

## Camadas

```text
app/                  Presentation: rotas Expo Router
components/           Presentation: UI reutilizável e componentes de feature
src/domain/           Regras e contratos do domínio
src/application/      Casos de uso e orquestração
src/infrastructure/   API, storage, saúde, notificações e DI
```

## Regra de dependência

- `app` pode depender de `application` e `shared`.
- `application` depende de contratos de `domain`.
- `infrastructure` implementa contratos de `domain`.
- `domain` não depende de React Native, Expo, HTTP ou banco local.
- Componentes visuais não chamam API diretamente.
- Casos de uso retornam resultados explícitos e não escondem falhas de sincronização.

## Estrutura alvo

```text
src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── value-objects/
├── application/
│   ├── use-cases/
│   └── hooks/
├── infrastructure/
│   ├── api/
│   │   ├── api-client.ts          # HTTP, envelope ApiResponse e refresh 401
│   │   ├── api-config.ts           # cria cliente com EXPO_PUBLIC_API_URL
│   │   └── token-store.ts          # contrato de armazenamento de tokens
│   ├── storage/
│   ├── health/
│   ├── notifications/
│   └── di/
└── shared/
    ├── config/
    ├── types/
    └── utils/
```

## Módulos implementados

- `src/infrastructure/api/api-client.ts` centraliza requests JSON, autenticação Bearer, refresh concorrente em `401`, login do paciente, formulário dinâmico e submissão agregada.
- `src/infrastructure/api/secure-token-store.ts` persiste access e refresh tokens com `expo-secure-store`; ele é o `TokenStore` padrão do cliente.
- `src/application/checkin-api.ts` é o adapter específico do fluxo de check-in; telas e casos de uso não precisam conhecer URLs.
- `components/dynamic-field-renderer.tsx` renderiza `INTEGER`, `DECIMAL`, `BOOLEAN`, `TEXT`, `SCALE` e `PHOTO` a partir do contrato do Backend.
- `src/domain/checkin.ts` contém os tipos do formulário e do payload agregado.
- `app/index.tsx` demonstra a primeira fatia integrada: carrega formulários por procedimento, combina campos, valida obrigatórios e envia `POST /api/mobile/checkins`.

O `TokenStore` é uma interface deliberadamente injetável. `secureTokenStore` é usado em produção; `emptyTokenStore` existe apenas para composição e testes.

O botão de foto está preparado no renderer, mas a seleção e o upload ainda aguardam o contrato de mídia do Backend.

## Primeira fatia vertical

Implementar somente o caminho login -> procedimento ativo -> formulário dinâmico -> persistência local -> sincronização. Essa fatia deve provar os contratos antes da expansão visual.

## Configuração por ambiente

- `EXPO_PUBLIC_API_URL` para a URL pública da API.
- Nunca colocar tokens, senhas ou credenciais no bundle.
- URLs e chaves não secretas devem ser separadas por development, staging e production.
- Android emulator, iOS simulator e dispositivo físico precisam de instruções próprias para acessar o Backend local.

## Testes mínimos

- Casos de uso com repositórios fake.
- Validação por tipo de campo.
- Fila e idempotência de sincronização.
- Guards de sessão e rotas.
- Renderização dos estados loading, offline, vazio e erro.
