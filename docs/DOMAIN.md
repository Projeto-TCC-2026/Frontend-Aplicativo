# Domínio Mobile - Recupera Saúde

## Conceitos

### Patient
Perfil autenticado do paciente. O mobile só deve receber os dados necessários para a experiência do paciente.

### PatientProcedure
Vínculo de acompanhamento entre paciente e configuração de procedimento do médico. Determina qual formulário o app deve carregar.

### DynamicField
Definição de campo enviada pelo Backend. Propriedades esperadas: `id`, `name`, `dataType`, `unit`, `required`, `displayOrder`, `metricKey`, `active` e thresholds somente para exibição quando necessário.

### Checkin
Envio agregado dos valores dos procedimentos ativos do paciente. Possui origem `MANUAL` na primeira versão, data de criação, janela de edição e estado de sincronização local. O Backend precisa permitir que um check-in contenha valores de mais de um `PatientProcedure`.

### CheckinFieldValue
Valor de um campo do check-in. Pode ser escalar, texto, booleano ou referência a uma foto.

### HealthReading
Medição proveniente de HealthKit ou Health Connect. Pode ser persistida mesmo quando não houver campo configurado para casar com ela.

### Alert
Resultado produzido pelo Backend. O app exibe o conteúdo recebido e nunca recalcula sua severidade.

## Regras invariantes do mobile

- Não hardcodar campos clínicos específicos.
- Não hardcodar limites, cores ou nomes de severidade.
- Não enviar um valor para um campo inativo ou desconhecido.
- Preservar a ordem `displayOrder` recebida.
- Validar presença de campos obrigatórios antes de enfileirar o envio.
- Não concluir o check-in enquanto houver campo obrigatório pendente em qualquer procedimento ativo.
- Manter a origem do dado (`MANUAL` ou `SMARTWATCH`).
- Não descartar um check-in local apenas porque a rede está indisponível.

## Decisões pendentes

1. O Backend fornecerá uma versão imutável da configuração usada em cada check-in agregado?
2. A edição de até uma hora criará nova versão ou atualizará os valores do mesmo check-in?
3. O paciente visualizará o threshold completo ou apenas o resultado/alerta retornado?
4. Quais `metricKey` serão suportadas oficialmente quando o smartwatch entrar no escopo?
