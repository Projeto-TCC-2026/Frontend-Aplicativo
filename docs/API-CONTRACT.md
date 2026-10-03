# Contrato de API - Recupera Saúde Mobile

Este documento separa o que está definido no domínio do que ainda precisa ser confirmado no Backend. Nenhuma rota deve ser codificada como contrato definitivo enquanto a resposta não estiver validada no OpenAPI.

## Endpoints já existentes

- `POST /auth/patient/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /forgot-password/request`
- `POST /forgot-password/reset`
- `GET /api/mobile/patient-procedures/{patientProcedureId}/checkin-form`
- `POST /api/mobile/patient-procedures/{patientProcedureId}/checkins`
- `POST /api/mobile/checkins`
- `POST /api/mobile/devices`
- `DELETE /api/mobile/devices?token={token}`

Os endpoints individuais permanecem para compatibilidade. O app deve usar `POST /api/mobile/checkins` para o fluxo agregado da primeira versão.

## Requisitos comuns

- Base URL configurável por ambiente.
- JWT com refresh seguro.
- Ao iniciar o app, renovar a sessão armazenada antes de liberar qualquer rota protegida.
- Os prazos do access token e do refresh token são definidos pelo Backend; este app não configura nem prolonga esses prazos. O valor atual precisa ser confirmado na configuração/contrato do Backend.
- Resposta de erro consistente, com código, mensagem e detalhes de validação.
- Datas em ISO-8601 com timezone explícito.
- IDs tratados como string no cliente para evitar acoplamento ao tipo numérico do Backend.
- Paginação e filtros definidos para histórico.

## Capacidades necessárias

| Capacidade | Estado |
|---|---|
| Login, refresh e logout | Existe parcialmente no ecossistema; confirmar contrato final |
| Perfil do paciente | Entidade existente; endpoint mobile precisa ser confirmado |
| Procedimentos ativos do paciente | Regra definida; endpoint ainda precisa ser consolidado |
| Configuração de campos dinâmicos | Regra definida; implementação/API está parcial |
| Criar check-in manual agregado | Necessário para o primeiro fluxo; deve aceitar valores de vários `PatientProcedure` |
| Upload de foto | Necessário para campos PHOTO; confirmar estratégia |
| Histórico de check-ins | Necessário; confirmar paginação e filtros |
| Leituras do smartwatch | Backend possui HealthReading/ReadingImport; confirmar ingestão mobile |
| Alertas do paciente | Regra definida; confirmar endpoint e payload |
| Registro de push token | Existe; `POST` e `DELETE /api/mobile/devices` |

## Payload conceitual do formulário agregado

```json
{
  "patientProcedureIds": ["string"],
  "configurationVersion": "string",
  "fields": [
    {
      "fieldId": "string",
      "value": "string | number | boolean | null",
      "photoId": "string | null"
    }
  ],
  "source": "MANUAL",
  "clientCreatedAt": "2026-09-06T12:00:00Z",
  "idempotencyKey": "string",
  "editOfCheckinId": "string | null"
}
```

O payload acima é uma proposta de trabalho, não um contrato aprovado. A primeira versão deve suportar um único check-in agregado para todos os procedimentos ativos e permitir edição até uma hora após o envio.

## Coleta e envio do smartwatch

No Android, o app lê frequência cardíaca, oxigenação no sangue e passos do Health Connect quando o paciente habilita a coleta. O agendamento atual usa uma tentativa mínima de 1 minuto para teste (o sistema operacional pode atrasá-la); antes da versão final, alterar `COLLECTION_INTERVAL_MINUTES` para 60 em `smartwatch-background-service.ts`.

Cada coleta com ao menos uma medida envia `POST` para a Function URL `IngestionUrl` da stack `AWS/monitoramento`. Configure essa URL em `EXPO_PUBLIC_MONITORAMENTO_INGESTION_URL`. O payload contém `patientId` salvo no login, `collectedAt` e `readings` com tipos `heartRate`, `spo2` e `steps`; a AWS valida o corpo e enfileira as medidas para o fluxo de processamento e análise de risco.

**Limitação atual: o envio à Function URL não significa que a leitura foi salva no banco.** `AWS/monitoramento/src/processor/services/persistence.service.mjs` ainda simula persistência e retorna um ID mock. O endpoint do Backend `POST /api/integration/alerts/evaluate` valida limites e cria alertas, mas sua implementação declara que não persiste a leitura. É necessário implementar a persistência no processador/Backend antes de considerar a gravação concluída. A Function URL está configurada com `AuthType: NONE`; não envie nela segredos ou dados além dos exigidos.

As permissões de leitura e `READ_HEALTH_DATA_IN_BACKGROUND` são configuradas em `app.json` e incluídas no `android/app/src/main/AndroidManifest.xml` pelo prebuild do Expo. Se o diretório Android já existir, execute `npx expo prebuild --platform android` antes de reconstruir e reinstalar o aplicativo; atualizar apenas o bundle JavaScript não atualiza o manifesto instalado.

## Registro de dispositivo para push

Ambos os endpoints exigem o JWT de paciente. O alvo desta etapa é Android apenas.

### `POST /api/mobile/devices`

Registra ou atualiza o token de push do dispositivo autenticado. Responde `200`.

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ANDROID",
  "deviceId": "string | opcional"
}
```

O cliente envia o token do Expo Push Service e persiste localmente o último token registrado, repetindo a chamada somente quando o token muda.

### `DELETE /api/mobile/devices?token={token}`

Remove o registro do token. Responde `200` em caso de sucesso e `404` quando o token não existe ou pertence a outro usuário.

O cliente chama este endpoint antes do `POST /auth/logout`, porque a remoção depende da sessão ainda válida. O `404` é tratado como sucesso: o objetivo é apenas garantir que o dispositivo deixe de receber notificações do paciente.

### Payload esperado na notificação

O toque na notificação abre a aba de alertas. Para abrir um alerta específico, o `data` deve conter o identificador:

```json
{
  "data": {
    "alertId": "string"
  }
}
```

O cliente aceita `alertId` e `alert_id`, e navega para a lista sem destaque quando o campo está ausente.

## Erros que o cliente precisa distinguir

- `401`: sessão expirada; tentar refresh uma vez e depois deslogar.
- `403`: usuário autenticado sem autorização para o recurso.
- `400/422`: erro de validação; mostrar no campo ou no formulário.
- `409`: conflito, duplicidade ou check-in já processado.
- `410`: janela de edição encerrada.
- `5xx` e rede: manter o item local e permitir nova sincronização.

## Próximo passo do Backend

Gerar ou revisar o OpenAPI específico do paciente e substituir todas as propostas deste documento por exemplos reais de request/response.
