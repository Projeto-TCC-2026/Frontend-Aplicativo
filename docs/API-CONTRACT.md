# Contrato de API - Recupera Saúde Mobile

Este documento separa o que está definido no domínio do que ainda precisa ser confirmado no Backend. Nenhuma rota deve ser codificada como contrato definitivo enquanto a resposta não estiver validada no OpenAPI.

## Requisitos comuns

- Base URL configurável por ambiente.
- JWT com refresh seguro.
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
| Registro de push token | Necessário; endpoint ainda não documentado como contrato mobile |

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

## Erros que o cliente precisa distinguir

- `401`: sessão expirada; tentar refresh uma vez e depois deslogar.
- `403`: usuário autenticado sem autorização para o recurso.
- `400/422`: erro de validação; mostrar no campo ou no formulário.
- `409`: conflito, duplicidade ou check-in já processado.
- `410`: janela de edição encerrada.
- `5xx` e rede: manter o item local e permitir nova sincronização.

## Próximo passo do Backend

Gerar ou revisar o OpenAPI específico do paciente e substituir todas as propostas deste documento por exemplos reais de request/response.
