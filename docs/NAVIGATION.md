# Navegação - Recupera Saúde Mobile

## Princípios

- Rotas representam estados de produto, não detalhes de implementação.
- Rotas autenticadas não devem renderizar antes de a sessão ser resolvida.
- O usuário deve conseguir retomar um check-in pendente.
- Deep links de notificações devem abrir o contexto correto sem expor dados de outro paciente.

## Estrutura proposta

```text
app/
├── _layout.tsx
├── index.tsx                 # resolve sessão e encaminha
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── forgot-password.tsx
└── (app)/
    ├── _layout.tsx
    ├── index.tsx             # resumo do acompanhamento
    ├── checkin/
    │   ├── index.tsx
    │   └── [patientProcedureId].tsx
    ├── historico.tsx
    ├── alertas.tsx
    └── configuracoes.tsx
```

## Check-in agregado

Quando houver vários procedimentos ativos, a rota de check-in apresenta um único formulário combinado. Os campos permanecem agrupados visualmente por procedimento, mas o envio só é concluído quando todos os campos obrigatórios estiverem válidos.

## Estados globais de navegação

- `booting`: carregando sessão e migrações locais.
- `unauthenticated`: enviar para login.
- `authenticated`: carregar contexto do paciente.
- `offline`: manter o usuário no app com indicação não intrusiva.
- `blocked`: mostrar motivo quando não houver procedimento ativo ou quando uma permissão for necessária.

## Decisões pendentes

- Abas ou navegação por stack para o app autenticado.
- Rota inicial quando houver mais de um procedimento ativo.
- Acesso ao histórico antes do primeiro check-in.
- Rota de detalhe de alerta e comportamento de deep link.
