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

## Navegação atual

- `/` abre a Home dentro das tabs nativas do Expo Router.
- `/checkin` abre o formulário diário fora da barra de tabs.
- As tabs disponíveis são Home, Smartwatch, Notificações e Configurações.
- Configurações encerra a sessão por meio do logout do Backend e limpa os tokens seguros.
- A Home grava localmente a data do último check-in para desabilitar o botão no mesmo dia. Esse estado deverá ser substituído por um endpoint oficial de status diário quando o Backend o disponibilizar.
- A barra usa somente ícones. iOS e Android usam `createNativeBottomTabNavigator` para a integração nativa; iOS 26+ fornece Liquid Glass nativo. A Web usa um layout de tabs do Expo Router separado, porque o Native Bottom Tabs não suporta Web.
- As telas usam o componente `Screen`, baseado em `SafeAreaView`, para não ocupar a região do status bar ou ficar atrás da navegação do sistema.
- A navegação inferior usa `createNativeBottomTabNavigator` de `@react-navigation/bottom-tabs/unstable`, seguindo a documentação oficial. Esse navigator é nativo de iOS/Android, exige development build e não deve ser validado pelo Expo Go/Web.
- Como o Expo Router bloqueia imports externos de React Navigation a partir do SDK 56, o projeto define `EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1` para permitir esse navigator experimental escolhido conscientemente.

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
