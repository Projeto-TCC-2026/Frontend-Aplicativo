# Design System Mobile - Recupera Saúde

A implementação mobile deve compartilhar os mesmos significados visuais do Web, adaptando apenas a implementação React Native.

## Tokens de cor

- `aqua-claro`: `#99D5E0`
- `azul-primario`: `#0C4C8A`
- `azul-marinho`: `#1F375D`
- `aqua-suave`: `#AEDEDE`
- `azul-profundo`: `#142D54`
- `neutro-900`: `#142230`
- `neutro-700`: `#445468`
- `neutro-500`: `#7C8DA1`
- `neutro-300`: `#C3CDD6`
- `neutro-150`: `#E4E9ED`
- `neutro-100`: `#EEF2F5`
- `branco`: `#FFFFFF`
- `sucesso`: `#2F9E6E`
- `atencao`: `#E5A139`
- `critico`: `#D9484B`
- `info`: `#2E77B8`

A paleta azul/aqua é identidade e navegação. Status clínico usa somente cores semânticas recebidas ou mapeadas conforme o contrato do Backend.

## Tipografia

- Manrope: títulos e hierarquia.
- Inter: corpo, labels e controles.
- IBM Plex Mono: valores clínicos, unidades e timestamps.

As fontes devem ser carregadas antes de liberar a navegação principal.

## Componentes base antes das telas

- `Button`: primary, secondary, ghost, destructive, loading e disabled.
- `TextField`: default, foco, erro, sucesso e disabled.
- `Card`: superfície de conteúdo sem esconder estado clínico.
- `StatusBadge`: label e cor com texto, nunca apenas cor.
- `LoadingState`, `EmptyState`, `ErrorState` e `OfflineBanner`.
- `DynamicFieldRenderer`: renderiza o controle correto conforme `dataType`.

## Acessibilidade

- Contraste equivalente a WCAG AA sempre que aplicável.
- Status não pode ser comunicado somente por cor.
- Tamanho de toque confortável.
- Labels associados a todos os controles.
- Mensagens de erro compreensíveis e próximas do campo.
- Suporte a texto ampliado sem truncar valores essenciais.
