# Status de Integração com o Backend

## Resumo

O Backend já possui uma base utilizável para o aplicativo do paciente. A autenticação e a recuperação de senha podem ser integradas sem aguardar novas decisões. O check-in dinâmico existe, mas hoje é individual por procedimento e não atende à decisão de produto de um check-in agregado.

## Endpoints existentes e aproveitáveis

### Autenticação

| Método | Endpoint | Uso mobile |
|---|---|---|
| POST | `/auth/patient/login` | Login do paciente |
| POST | `/auth/refresh` | Renovação do access token |
| POST | `/auth/logout` | Encerramento da sessão |
| GET | `/auth/me` | Perfil do usuário autenticado |
| POST | `/forgot-password/request` | Solicitação de recuperação |
| POST | `/forgot-password/reset` | Definição da nova senha |

A resposta de login do paciente contém `accessToken`, `refreshToken`, `role`, `patientId`, `fullName` e `email`.

### Formulário dinâmico atual

| Método | Endpoint | Estado |
|---|---|---|
| GET | `/api/mobile/patient-procedures/{patientProcedureId}/checkin-form` | Existe; retorna o formulário de um procedimento |
| POST | `/api/mobile/patient-procedures/{patientProcedureId}/checkins` | Existe; cria check-in manual de um procedimento |
| POST | `/api/mobile/checkins` | Implementado nesta etapa; cria uma submissão agregada idempotente |

O formulário retorna `patientProcedureId`, resumo do procedimento e campos ordenados por `displayOrder`. Os tipos disponíveis são `INTEGER`, `DECIMAL`, `BOOLEAN`, `TEXT`, `SCALE` e `PHOTO`.

## Divergências em relação ao produto decidido

### 1. Check-in agregado

O modelo atual de `Checkin` possui uma única relação `patient_procedure_id`. O produto decidiu que vários procedimentos ativos devem aparecer em um formulário combinado e gerar um único envio agregado.

A evolução foi iniciada com uma submissão agregada que agrupa os check-ins individuais:

- a entidade `CheckinSubmission` representa a submissão do paciente;
- cada procedimento continua gerando um `Checkin` individual;
- todos os itens apontam para a mesma submissão;
- `idempotencyKey` é único por paciente;
- `editUntil` registra a janela de uma hora.

Essa opção preserva os endpoints individuais e permite que o app use uma única operação agregada.

### 2. Edição por uma hora

O modelo atual não possui `updatedAt`, versão, estado de edição ou endpoint de atualização. É necessário definir:

- se a edição atualiza o mesmo check-in ou cria uma nova versão;
- como o Backend calcula a janela de uma hora;
- se alertas anteriores são recalculados ou preservados;
- como a edição funciona quando o check-in foi salvo offline e sincronizado depois.

### 3. Idempotência offline

O modelo atual não recebe `idempotencyKey` no `ManualCheckinRequest`. O mobile precisa de uma chave estável para repetir o envio sem duplicar dados.

### 4. Versionamento da configuração

O formulário atual retorna os campos, mas não retorna uma versão da configuração. Para preservar o significado histórico de um check-in, o Backend deve retornar e aceitar uma versão ou snapshot da configuração usada.

## Próximas evoluções do Backend

1. Adicionar `configurationVersion` à resposta do formulário.
2. Adicionar endpoint de edição protegido por `editUntil`.
3. Definir se a edição atualiza os itens existentes ou cria uma nova submissão.
4. Definir uma resposta de histórico para o paciente, incluindo estado de sincronização e origem.
5. Manter os endpoints individuais temporariamente para compatibilidade, mas não usá-los no novo app.

## Ordem recomendada para o mobile

1. Implementar autenticação usando os endpoints existentes.
2. Criar adapters para perfil e procedimentos.
3. Implementar o adapter mobile para `POST /api/mobile/checkins`.
4. Desenvolver o renderer de campos com mocks baseados em `CheckinFormResponse`.
