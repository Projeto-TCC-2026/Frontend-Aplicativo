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
│   ├── storage/
│   ├── health/
│   ├── notifications/
│   └── di/
└── shared/
    ├── config/
    ├── types/
    └── utils/
```

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
