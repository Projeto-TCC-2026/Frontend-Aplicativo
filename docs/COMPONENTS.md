# Componentes Base - Recupera Saúde Mobile

Os componentes são React Native puros, independentes de API e navegação. Todos usam os tokens de `constants/design-tokens.ts`.

## Regra de estilização

NativeWind/Tailwind é a camada padrão de estilo do mobile. Use `className` nos elementos React Native e tokens definidos no `tailwind.config.js`. Não usar `StyleSheet`, `style={{ ... }}` ou estilos inline para novos componentes. Estados dinâmicos devem selecionar classes de mapas tipados, mantendo as classes completas no código para o NativeWind gerar o CSS corretamente.

## Button

Importe `components/ui/button`.

Props principais:

- `variant`: `primary`, `secondary`, `ghost`, `destructive` ou `success`.
- `size`: `sm`, `md` ou `lg`.
- `loading`, `loadingText`, `disabled` e `fullWidth`.
- `onPress`.

O componente mantém área de toque mínima de 44px e não dispara `onPress` quando está desabilitado ou carregando.

## TextField

Importe `components/ui/text-field`.

Props principais:

- `label`, `placeholder`, `value` e `onChangeText`.
- `type`: `text`, `email`, `password`, `number` ou `tel`.
- `state`: `default`, `error` ou `success`.
- `helperText`, `required`, `disabled` e `multiline`.

O foco usa a cor primária; erros usam `critico`; sucesso usa `sucesso`; placeholder usa `neutro-500`.

## Card

Importe `components/ui/card`.

Props:

- `title` e `subtitle` opcionais.
- `padding`: `none`, `sm`, `md` ou `lg`.
- `bordered` para controlar a borda da superfície.
- `children` para o conteúdo.

## LoadingState

Importe `components/ui/loading-state`.

Props:

- `size`: `sm`, `md` ou `lg`.
- `text` opcional.
- `fullPage` para ocupar a tela disponível.

## EmptyState

Importe `components/ui/empty-state`.

Props:

- `title` e `description`.
- `action` para renderizar uma ação abaixo da mensagem.

## ErrorState

Importe `components/ui/error-state`.

Props:

- `title`, `description` e `actionLabel`.
- `onRetry` para exibir o botão padrão de nova tentativa.
- `action` para fornecer uma ação customizada.

## StatusBadge

Importe `components/ui/status-badge`.

Props:

- `label` obrigatório.
- `tone`: `success`, `attention`, `critical`, `info` ou `disabled`.

O status sempre combina texto, ponto visual e cor. Nunca depende apenas da cor.

## OfflineBanner

Importe `components/ui/offline-banner`.

Props:

- `visible` obrigatório.
- `message` opcional.

É um componente presentacional: a detecção de conectividade deve ficar em um hook ou caso de uso, não dentro do banner.

## Vitrine

A rota `/components-demo` apresenta os componentes em conjunto. Ela serve para validação visual durante o desenvolvimento e não faz parte do fluxo clínico do paciente.
