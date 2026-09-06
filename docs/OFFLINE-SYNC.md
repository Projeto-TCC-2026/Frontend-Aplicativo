# Offline e Sincronização - Recupera Saúde Mobile

## Objetivo

O paciente deve conseguir registrar um check-in sem depender de conectividade contínua. A rede altera o estado de sincronização, não a possibilidade de registrar o dado.

## Estados locais

- `draft`: formulário em edição.
- `queued`: validado e pronto para sincronizar.
- `syncing`: envio em andamento.
- `synced`: aceito pelo Backend.
- `failed`: falha recuperável ou que exige ação do usuário.
- `conflict`: Backend recusou por conflito ou versão incompatível.

## Regras

- Gerar `idempotencyKey` por tentativa lógica de envio.
- Nunca criar duplicata ao repetir uma requisição após timeout.
- Persistir o payload e a configuração usada para montar o formulário.
- Fotos devem ter estado próprio de upload e não podem ser apagadas antes da confirmação.
- Sincronizar em foreground, ao recuperar conectividade e em tarefa de background quando a plataforma permitir.
- Backoff progressivo para falhas de rede.
- Não fazer retry automático infinito para erros de validação ou autorização.
- Um check-in agregado só pode ser marcado como `synced` quando o Backend aceitar os valores de todos os procedimentos incluídos.
- A janela de edição de uma hora deve usar o horário confiável do Backend, não apenas o relógio do dispositivo.

## Dados locais mínimos

- Sessão segura e metadados de expiração.
- Procedimentos/configurações em cache.
- Rascunhos de check-in.
- Fila de check-ins pendentes.
- Fila de fotos pendentes.
- Último erro de sincronização e timestamp.

## Decisões pendentes

- Biblioteca de persistência local.
- Política de expiração do cache de configuração.
- Resolução de conflito quando a configuração do médico mudar durante a janela de uma hora.
- Limite de armazenamento de fotos e política de limpeza.
