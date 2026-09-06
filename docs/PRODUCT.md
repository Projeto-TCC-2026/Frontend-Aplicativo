# Produto - Recupera Saúde Mobile

## Objetivo

O aplicativo oferece ao paciente uma forma simples e confiável de acompanhar seu tratamento e enviar dados ao profissional responsável. A experiência deve priorizar continuidade, clareza e baixo esforço diário.

## Usuário principal

Paciente em acompanhamento por um médico. O paciente não configura procedimentos nem faixas clínicas; ele executa o acompanhamento definido pelo médico.

## Fluxo principal

1. Paciente autentica.
2. App carrega o perfil e o(s) procedimento(s) de acompanhamento ativo(s).
3. App carrega a configuração dinâmica do check-in.
4. Paciente preenche os campos de todos os procedimentos ativos e envia um check-in agregado, mesmo que inicialmente sem conexão.
5. App sincroniza com o Backend.
6. Backend avalia os valores e pode gerar alertas.
7. Paciente acompanha o histórico e recebe notificações próprias.

## Escopo inicial

- Autenticação e sessão persistente.
- Perfil básico do paciente.
- Status do acompanhamento ativo.
- Check-in dinâmico com campos INTEGER, DECIMAL, BOOLEAN, TEXT, SCALE e PHOTO.
- Estado offline e sincronização posterior.
- Histórico de check-ins e leituras.
- Edição de um check-in por até uma hora após o envio, conforme política do Backend.
- Notificações push relacionadas ao próprio paciente.
- Configuração de permissões e integração de saúde, quando disponível na plataforma.

## Fora do escopo inicial

- Configuração de procedimentos ou thresholds.
- Dashboard de médicos.
- Avaliação clínica local.
- Comunicação direta paciente-médico em tempo real.
- Decisão local sobre severidade de alertas.
- Integração com smartwatch na primeira versão.

## Critérios de sucesso do primeiro fluxo

- Um paciente autenticado consegue visualizar o formulário correto.
- Campos obrigatórios são validados antes do envio.
- Um check-in pode ser salvo sem internet.
- O usuário consegue distinguir pendente, sincronizado e falho.
- O Backend recebe os valores sem que o app interprete thresholds.
- Um paciente pode ter vários procedimentos ativos, mas a primeira versão apresenta um formulário combinado e cria um único check-in agregado.
- Todos os campos obrigatórios de todos os procedimentos ativos devem estar preenchidos para concluir o envio.
- A autenticação inclui login, refresh, logout e recuperação de senha.
