# Documentação do Recupera Saúde Mobile

Documentação de preparação do aplicativo do paciente.

## Ordem de leitura

1. [Produto](./PRODUCT.md)
2. [Domínio](./DOMAIN.md)
3. [Contrato de API](./API-CONTRACT.md)
4. [Navegação](./NAVIGATION.md)
5. [Offline e sincronização](./OFFLINE-SYNC.md)
6. [Arquitetura](./ARCHITECTURE.md)
7. [Design system](./DESIGN-SYSTEM.md)

## Estado

A documentação inicial está definida. Ainda não foram criadas telas de produto nem implementada a infraestrutura de dados.

Antes da primeira fatia vertical, o Backend precisa confirmar:

- contrato OpenAPI para o fluxo do paciente e check-in agregado;
- comportamento com múltiplos procedimentos ativos;
- modelo de check-in agregado para múltiplos procedimentos;
- versionamento da configuração do formulário;
- regra de edição de uma hora e idempotência do check-in;
- endpoints de push token, upload e sincronização.
