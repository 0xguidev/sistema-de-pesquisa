# Documento de Requisitos do Produto (PRD)

| Campo | Valor |
| --- | --- |
| Versão | 0.1 |
| Status | Rascunho inicial |
| Última atualização | 30 de agosto de 2026 |

## Propósito do documento

Este Documento de Requisitos do Produto (PRD) descreve o sistema conforme ele está atualmente implementado. Seu objetivo é consolidar, de forma verificável, o comportamento existente do produto, seu escopo, suas regras e suas restrições, servindo de referência para análise, manutenção, validação e evolução.

Comportamentos não suportados pela implementação atual, hipóteses, propostas e funcionalidades futuras não devem ser apresentados como recursos existentes. Quando necessário, esses itens devem ser identificados explicitamente como limitações, questões em aberto ou possibilidades futuras.

## Fonte oficial de verdade

Este PRD é a fonte oficial de verdade documental sobre os requisitos e comportamentos do produto atualmente implementado. Em caso de divergência entre este documento e o comportamento verificável do sistema, a implementação em execução e seus testes constituem a evidência primária do estado atual; o PRD deve ser corrigido para refletir essa realidade. Nenhuma descrição neste documento deve antecipar ou presumir comportamento ainda não implementado.

## Sumário

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Escopo](#2-escopo)
3. [Modelo de domínio](#3-modelo-de-domínio)
4. [Requisitos funcionais](#4-requisitos-funcionais)
5. [Regras de negócio](#5-regras-de-negócio)
6. [Segurança](#6-segurança)
7. [Relatórios](#7-relatórios)
8. [Catálogo de APIs](#8-catálogo-de-apis)
9. [Requisitos não funcionais](#9-requisitos-não-funcionais)
10. [Limitações](#10-limitações)
11. [Questões em aberto](#11-questões-em-aberto)
12. [Critérios de aceitação](#12-critérios-de-aceitação)

## 1. Visão geral do produto

### 1.1 Resumo executivo

O Sistema de Pesquisa é uma API de backend para criar, conduzir e analisar pesquisas. Por meio de endpoints HTTP, uma pessoa autenticada pode estruturar uma pesquisa com perguntas e opções de resposta, registrar entrevistas e suas respostas e consultar ou exportar resultados consolidados.

Este repositório contém somente o backend do produto. Ele implementa regras de domínio, persistência, autenticação, autorização por titularidade, geração de relatórios e observabilidade, mas não contém interface web, aplicativo móvel ou qualquer outra experiência visual para usuários finais. O uso das capacidades descritas depende de um cliente de API externo, que não faz parte deste repositório.

### 1.2 Problema resolvido

O sistema centraliza o ciclo operacional de pesquisas estruturadas que usam perguntas com opções predefinidas. Ele resolve a necessidade de:

- manter a definição de cada pesquisa e de seu questionário;
- registrar aplicações da pesquisa na forma de entrevistas;
- associar a cada entrevista as opções selecionadas para suas perguntas;
- recuperar os dados registrados com isolamento entre contas;
- transformar as respostas coletadas em relatórios simples ou cruzados.

Sem presumir uma interface de operação, a API oferece os recursos de backend necessários para que um cliente autenticado organize questionários, faça a coleta estruturada e consuma os resultados.

### 1.3 Objetivos do produto

- Permitir a criação e a manutenção de pesquisas compostas por perguntas numeradas e opções de resposta numeradas.
- Permitir que pesquisas sejam criadas já com sua estrutura completa ou complementadas por operações específicas sobre perguntas e opções.
- Registrar entrevistas vinculadas a uma pesquisa e respostas vinculadas às respectivas perguntas e opções.
- Permitir a consulta dos dados pertencentes à conta autenticada, incluindo pesquisas, entrevistas e respostas.
- Produzir análises simples e cruzadas a partir das respostas registradas, com retorno de dados e opções de exportação implementadas.
- Proteger os dados de cada titular por autenticação, sessões e verificação de propriedade dos recursos.

### 1.4 Usuários-alvo

Os usuários diretamente representados pela implementação são:

- **Titular de conta:** pessoa registrada que autentica na API e possui suas próprias pesquisas e seus respectivos dados.
- **Operador autenticado:** uso funcional do mesmo titular de conta ao configurar questionários, registrar entrevistas e consultar resultados por meio de um cliente de API.
- **Sistema integrador:** aplicação externa que consome os endpoints da API em nome de uma conta autenticada.

Embora o modelo de dados preveja os papéis `USER` e `ADMIN`, não foram identificados fluxos administrativos específicos neste repositório. Portanto, administrador não é descrito neste PRD como uma persona com capacidades próprias.

### 1.5 Jornadas primárias

#### 1.5.1 Acessar a API de forma autenticada

1. A pessoa cria uma conta com nome, e-mail e senha.
2. Autentica-se e recebe tokens de acesso e renovação.
3. Usa o token de acesso para chamar os endpoints protegidos.
4. Quando necessário, renova a sessão, encerra a sessão atual ou revoga todas as suas sessões.

#### 1.5.2 Criar e estruturar uma pesquisa

1. A conta autenticada cria uma pesquisa informando título, local e tipo.
2. Na mesma operação, pode enviar perguntas, opções e referências de regras condicionais; alternativamente, pode manter perguntas e opções pelos endpoints específicos existentes.
3. A API persiste a estrutura sob a titularidade da conta autenticada.
4. A conta pode consultar, editar ou excluir os recursos que lhe pertencem.

#### 1.5.3 Conduzir uma pesquisa

1. Um cliente autenticado obtém a pesquisa e sua estrutura.
2. O cliente envia uma nova entrevista para a pesquisa, acompanhada das opções escolhidas para as perguntas respondidas.
3. A API registra a entrevista e as respostas sob a titularidade da conta autenticada.
4. A conta pode consultar entrevistas de uma pesquisa, consultar respostas e corrigir ou excluir respostas pelos endpoints implementados.

O participante da pesquisa não é uma identidade nem um ator autenticável no modelo atual. A condução é uma operação realizada pelo cliente autenticado da conta; não existe fluxo direto de participação anônima ou pública.

#### 1.5.4 Analisar resultados

1. A conta autenticada solicita um relatório de uma pesquisa própria.
2. A API consolida as respostas em relatório simples ou cruzado.
3. O resultado pode ser consumido como dados pela API ou, conforme o tipo de relatório, baixado em DOCX; o relatório simples também pode ser baixado em PDF.

## 2. Escopo

### 2.1 Natureza e limite do repositório

O escopo deste repositório é exclusivamente uma aplicação de backend exposta como API HTTP. A implementação utiliza NestJS, persiste dados em PostgreSQL por meio do Prisma e entrega respostas estruturadas ou arquivos gerados nos endpoints correspondentes.

Não há frontend neste repositório. Menus, páginas, formulários, visualizações gráficas interativas e experiências de navegação não devem ser inferidos a partir dos endpoints ou descritos como funcionalidades existentes. Da mesma forma, a presença de campos como `slug` não representa a existência de páginas ou links públicos.

### 2.2 Capacidades atualmente implementadas

#### Contas e sessões

- cadastro de conta com nome, e-mail e senha;
- autenticação por credenciais e emissão de token de acesso e token de renovação;
- rotação do token de renovação;
- encerramento da sessão atual e revogação de todas as sessões da conta;
- edição e exclusão da própria conta;
- proteção global dos endpoints, ressalvadas as rotas explicitamente públicas, como cadastro, autenticação, renovação e métricas.

#### Pesquisas e questionários

- criação de pesquisa com título, local e tipo;
- criação completa de pesquisa com perguntas, opções e regras condicionais no mesmo payload;
- listagem paginada das pesquisas da conta autenticada;
- consulta de pesquisa por identificador;
- edição e exclusão de pesquisa;
- criação, consulta, listagem por pesquisa, edição e exclusão de perguntas;
- criação, consulta, listagem por pergunta, edição e exclusão de opções de resposta;
- armazenamento de regras condicionais que referenciam uma pergunta e uma opção anteriores pelos respectivos números durante a montagem da pesquisa.

#### Coleta de respostas

- criação de entrevista vinculada a uma pesquisa da conta autenticada;
- envio de um conjunto de respostas junto à criação da entrevista;
- criação individual de resposta, associando entrevista, pergunta e opção de resposta;
- consulta individual de entrevista ou resposta;
- listagem paginada de entrevistas por pesquisa e listagem de respostas por entrevista;
- edição e exclusão de respostas;
- exclusão de entrevistas.

#### Análise e relatórios

- geração de relatório simples como dados retornados pela API;
- geração de relatório cruzado como dados retornados pela API;
- exportação de relatórios simples e cruzados em DOCX;
- exportação de relatório simples em PDF;
- limitação e proteção operacional das rotas de geração de relatórios.

#### Controles transversais

- validação de entradas nos controladores HTTP;
- autenticação com JWT e sessões persistidas;
- limitação de taxa para superfícies públicas e operações protegidas configuradas;
- isolamento dos recursos de pesquisa pela conta proprietária;
- registros e métricas de segurança e observabilidade;
- exclusão em cascata de dados dependentes em relações configuradas no banco de dados.

### 2.3 Itens explicitamente fora do escopo atual

Os itens abaixo não são capacidades existentes deste repositório:

- frontend web, aplicativo móvel ou qualquer interface gráfica;
- participação anônima em pesquisas;
- links públicos para preenchimento ou divulgação de pesquisas;
- identificação, cadastro ou autenticação do participante entrevistado;
- autopreenchimento direto pelo público sem uma conta autenticada operando a API;
- colaboração entre contas, equipes, organizações, convites, compartilhamento ou edição simultânea;
- transferência de propriedade de pesquisas ou acesso de uma conta aos recursos de outra;
- fluxos administrativos dedicados, como painel administrativo, gestão de usuários por administradores, moderação ou aprovação de pesquisas;
- publicação, agendamento, abertura ou encerramento de períodos de coleta;
- distribuição de pesquisas por e-mail, redes sociais ou outros canais;
- notificações e automações externas;
- construtor visual de questionários ou painel visual de análise;
- importação de participantes ou respostas por arquivo;
- exportação de dados brutos em CSV ou planilha;
- relatório cruzado em PDF;
- respostas em texto livre, múltipla escolha em uma mesma pergunta ou anexos, pois a resposta persistida referencia uma única opção predefinida;
- execução de comportamento futuro ou apenas proposto, ainda que o modelo contenha campos que possam vir a sustentá-lo.

### 2.4 Premissas documentais

- “Usuário” significa a conta autenticada que possui e opera os recursos, não a pessoa entrevistada.
- “Conduzir uma pesquisa” significa registrar, por um cliente autenticado, uma entrevista e suas respostas na API; não significa disponibilizar um formulário público.
- “Entrevista” representa uma aplicação da pesquisa e agrupa respostas, sem armazenar identidade ou perfil próprio do participante.
- “Resposta” representa a seleção de uma opção predefinida para uma pergunta dentro de uma entrevista.
- “Pesquisa própria” é aquela cujo identificador de proprietário corresponde à conta autenticada.
- Clientes externos são responsáveis pela apresentação da experiência ao operador e por transformar suas interações em chamadas válidas à API.
- A documentação considera implementada apenas a capacidade comprovável no código, no esquema de dados, nas migrações ou nos testes existentes.

### 2.5 Fronteiras da implementação

- A API é a fronteira de interação do produto neste repositório; qualquer interface consumidora é externa e não está especificada aqui.
- As operações de domínio, salvo as rotas marcadas como públicas, exigem uma sessão autenticada válida.
- A propriedade dos dados é vinculada a uma única conta. O escopo atual não define acesso compartilhado nem permissões por recurso entre contas.
- A estrutura de resposta é baseada em opções predefinidas. Não se deve inferir suporte a outros formatos de pergunta ou resposta.
- Regras condicionais fazem parte da estrutura persistida do questionário. Este documento não presume uma interface de exibição condicional nem afirma comportamento de navegação que não esteja implementado no backend.
- Os relatórios refletem os dados persistidos para a pesquisa solicitada e só podem ser gerados no âmbito da conta proprietária.
- PostgreSQL, Prisma, NestJS e os mecanismos de geração de DOCX/PDF são limites técnicos da implementação atual, não compromissos de compatibilidade com outros armazenamentos, frameworks ou formatos.
- Métricas e controles operacionais são recursos de infraestrutura da API; sua presença não constitui um fluxo administrativo de produto.

## 3. Modelo de domínio

### 3.1 Visão geral e classificação

O modelo persistido divide-se em dois grupos:

- **Entidades de produto:** `User` (representado no domínio como `Account`), `Survey`, `Question`, `OptionAnswer`, `ConditionalRule`, `Interview` e `AnswerQuestion`. Essas entidades representam contas, questionários, aplicações de pesquisas e respostas.
- **Entidades operacionais e de segurança:** `Session`, `SessionUsedToken`, `RevokedTokenSubject`, `RateLimitBucket` e `PdfRenderLease`. Elas sustentam autenticação, revogação, limitação de requisições e controle de capacidade; não são conteúdo de uma pesquisa.

Os nomes do domínio e da persistência nem sempre coincidem. A entidade de domínio `Account` é armazenada na tabela `users`, e `OptionAnswer` representa uma opção disponível para uma pergunta, não uma resposta registrada. A resposta efetivamente dada em uma entrevista é `AnswerQuestion`.

### 3.2 Hierarquia do produto

```text
Account/User
└── Survey
    ├── Question
    │   ├── OptionAnswer
    │   └── ConditionalRule
    │       ├── depende de outra Question
    │       └── depende de uma OptionAnswer dessa pergunta
    └── Interview
        └── AnswerQuestion
            ├── referencia uma Question da mesma Survey
            └── referencia uma OptionAnswer da mesma Question
```

Uma conta é titular de suas pesquisas e, de forma redundante e deliberada, também identifica a titularidade de perguntas, opções, entrevistas e respostas. Cada pesquisa possui dois ramos principais: a estrutura do questionário e as entrevistas realizadas. A estrutura é composta por perguntas, opções e regras condicionais. Cada entrevista agrupa respostas; cada resposta seleciona uma única opção pertencente à pergunta respondida.

As chaves estrangeiras compostas reforçam a coerência dessa hierarquia no banco. Elas impedem, por exemplo, que uma pergunta seja associada a uma pesquisa de outra conta, que uma entrevista pertença simultaneamente a outra pesquisa ou conta, ou que uma resposta combine entrevista, pergunta e opção de titulares ou estruturas incompatíveis.

### 3.3 Entidades de produto

#### 3.3.1 Account/User

**Propósito.** Representa a conta que se autentica, possui os dados de produto e opera a API. No código de domínio chama-se `Account`; no Prisma, `User`; a tabela física é `users`.

**Atributos principais.** `id` UUID; `email`; senha armazenada em `password`; `name`; `role`, com valores `USER` ou `ADMIN` e padrão `USER`; `slug`; `createdAt`; e `updatedAt` opcional. O mapper de domínio transporta nome, e-mail, senha e papel, enquanto os timestamps pertencem ao registro de persistência.

**Relacionamentos e titularidade.** Uma conta pode possuir muitas pesquisas, perguntas, opções, entrevistas, respostas e sessões. `userId`/`accountId` é a raiz de titularidade usada pelos repositórios para restringir consultas e mutações aos recursos da conta autenticada.

**Unicidade e índices.** `id` é chave primária UUID. `email` e `slug` são globalmente únicos. O papel existente no esquema não cria, por si só, um fluxo administrativo.

**Exclusão.** Sessões são excluídas em cascata com a conta. As relações diretas das entidades de produto com `users` usam comportamento restritivo, portanto registros de produto ainda vinculados podem impedir a exclusão da conta. O fluxo de exclusão grava ou atualiza um `RevokedTokenSubject` como tombstone de segurança, sem vínculo estrangeiro, para que a revogação sobreviva à remoção da conta.

**Ciclo de vida.** `createdAt` recebe o horário de criação no banco; `updatedAt` é atualizado automaticamente pelo Prisma quando o registro é alterado.

#### 3.3.2 Survey

**Propósito.** É a raiz agregadora de um questionário e de suas aplicações. Reúne a definição da pesquisa, suas perguntas, regras condicionais e entrevistas.

**Atributos principais.** `id` UUID; `title`; `location`; `type`; `slug`; `userId`; `createdAt`; e `updatedAt` opcional.

**Relacionamentos e titularidade.** Pertence a exatamente um `User` por `userId`; possui muitas `Question`, `Interview` e `ConditionalRule`. Os repositórios de leitura por identificador e de relatórios combinam `id` e `userId`, restringindo o acesso à conta proprietária.

**Unicidade e índices.** `id` é chave primária e `slug` é globalmente único. A combinação `(id, userId)` também é única e serve de destino às relações compostas de perguntas e entrevistas. Não existe restrição de unicidade para título, local ou tipo.

**Exclusão.** A exclusão da pesquisa propaga-se por cascata para perguntas e entrevistas. A cascata de perguntas alcança opções, e a cascata de entrevistas alcança respostas. Entretanto, `ConditionalRule` referencia pesquisa, pergunta e dependências com exclusão restritiva; uma pesquisa que ainda tenha regras condicionais pode exigir a remoção prévia dessas regras para que a exclusão seja aceita pelo banco.

**Ciclo de vida.** `createdAt` é definido na criação; `updatedAt` é opcional e mantido automaticamente pelo Prisma nas atualizações.

#### 3.3.3 Question

**Propósito.** Representa uma pergunta estruturada pertencente a uma pesquisa.

**Atributos principais.** `id` UUID; texto em `title` (exposto no domínio como `questionTitle`); posição ou referência numérica em `number` (`questionNum`); `surveyId`; `userId`; `slug`; `createdAt`; e `updatedAt` opcional.

**Relacionamentos e titularidade.** Pertence simultaneamente à pesquisa e à mesma conta proprietária por meio da chave estrangeira composta `(surveyId, userId)`. Possui opções e respostas e pode aparecer em uma regra condicional tanto como pergunta condicionada (`questionId`) quanto como pergunta da qual outra depende (`dependsOnQuestionId`).

**Unicidade e índices.** `id` e `slug` são globalmente únicos. Também são únicas as combinações `(id, userId)` e `(id, surveyId, userId)`, utilizadas pelas relações filhas. O índice `(surveyId, userId)` atende consultas das perguntas de uma pesquisa da conta. `number` não possui restrição única no banco, nem isoladamente nem dentro da pesquisa.

**Exclusão.** A exclusão de uma pesquisa elimina suas perguntas em cascata. A exclusão de uma pergunta elimina suas opções em cascata. O caso de uso de exclusão individual remove antes as regras em que a pergunta é o alvo ou a dependência. Respostas referenciam a pergunta com comportamento restritivo; portanto, uma pergunta já usada em respostas não é automaticamente removida por uma exclusão individual enquanto essas referências existirem.

**Ciclo de vida.** `createdAt` é definido na criação; `updatedAt` é opcional e atualizado pelo Prisma.

#### 3.3.4 OptionAnswer

**Propósito.** Representa uma opção de resposta predefinida de uma pergunta. Apesar do nome, não representa a escolha registrada em uma entrevista.

**Atributos principais.** `id` UUID; texto da opção em `option` (no domínio, `optionTitle`); número em `number` (`optionNum`); `questionId`; `userId`; `slug`; `createdAt`; e `updatedAt` opcional.

**Relacionamentos e titularidade.** Pertence a uma pergunta da mesma conta por meio da chave composta `(questionId, userId)`. Pode ser selecionada por muitas `AnswerQuestion` e pode ser a opção de dependência de muitas `ConditionalRule`.

**Unicidade e índices.** `id` e `slug` são globalmente únicos. Também são únicas as combinações `(id, userId)` e `(id, questionId, userId)`. O índice `(questionId, userId)` apoia a listagem das opções de uma pergunta pertencente à conta. `number` não é único no banco dentro da pergunta.

**Exclusão.** É excluída em cascata quando sua pergunta é removida. Na exclusão individual, o caso de uso remove previamente regras condicionais que dependem da opção. Respostas referenciam opções com exclusão restritiva; uma opção já selecionada em respostas não é removida automaticamente enquanto essas respostas existirem.

**Ciclo de vida.** A persistência possui `createdAt`, definido por padrão, e `updatedAt`, atualizado automaticamente. O objeto de domínio denomina o último campo `updateAt`, mas o mapper e o schema persistente usam `updatedAt`.

#### 3.3.5 ConditionalRule

**Propósito.** Registra que uma pergunta está condicionada à seleção de determinada opção de outra pergunta da mesma pesquisa. A entidade persiste a dependência estrutural; não implica, por si só, uma interface ou navegação condicional.

**Atributos principais.** `id` UUID; `questionId`, que identifica a pergunta condicionada; `dependsOnQuestionId` e `dependsOnQuestionNumber`, que identificam a pergunta de referência; `dependsOnOptionId` e `dependsOnOptionNumber`, que identificam a opção esperada; e `surveyId`.

**Relacionamentos e titularidade.** Pertence a uma pesquisa e referencia duas funções de `Question`: a pergunta condicionada e a pergunta de dependência. Também referencia a `OptionAnswer` de dependência. A tabela não possui `userId`; sua associação à conta é indireta, por meio da pesquisa e das perguntas referenciadas. A criação de estrutura completa resolve números para identificadores e persiste as regras na mesma transação da pesquisa, perguntas e opções.

**Unicidade e índices.** `id` é a chave primária UUID e também está declarado como único. Não há unicidade composta para impedir regras repetidas, nem índices adicionais declarados para pergunta, opção ou pesquisa.

**Exclusão.** Todas as relações de `ConditionalRule` usam exclusão restritiva. Os casos de uso de exclusão de pergunta e opção removem explicitamente as regras relacionadas antes de remover o recurso. Não há cascata automática a partir de pesquisa, pergunta ou opção.

**Ciclo de vida.** Não possui campos de criação ou atualização.

#### 3.3.6 Interview

**Propósito.** Representa uma aplicação ou ocorrência de coleta de uma pesquisa. Agrupa as respostas registradas, sem modelar a identidade do participante.

**Atributos principais.** `id` UUID; `surveyId`; `userId`; `createdAt`; e `updatedAt` opcional.

**Relacionamentos e titularidade.** Pertence à combinação `(surveyId, userId)`, garantindo que a pesquisa e a entrevista tenham o mesmo titular. Possui muitas `AnswerQuestion`. Consultas por pesquisa filtram simultaneamente `surveyId` e a conta autenticada.

**Unicidade e índices.** `id` é chave primária. As combinações `(id, userId)` e `(id, surveyId, userId)` são únicas e sustentam consultas e a relação composta das respostas. O índice `(surveyId, userId)` atende listagem e contagem de entrevistas da pesquisa por titular.

**Exclusão.** É excluída em cascata quando a pesquisa é removida. Ao excluir uma entrevista, todas as suas respostas são eliminadas em cascata pela relação composta da entrevista com `AnswerQuestion`.

**Ciclo de vida.** `createdAt` registra a criação; `updatedAt` é opcional e atualizado automaticamente pelo Prisma.

#### 3.3.7 AnswerQuestion

**Propósito.** Representa a resposta a uma pergunta dentro de uma entrevista, materializada pela seleção de uma `OptionAnswer`.

**Atributos principais.** `id` UUID; `interviewId`; `surveyId`; `questionId`; `optionAnswerId`; `userId`; `createdAt`; e `updatedAt` opcional. Ao persistir, o repositório obtém `surveyId` da entrevista, em vez de confiar em um valor independente fornecido pelo objeto de domínio.

**Relacionamentos e titularidade.** A relação composta `(interviewId, surveyId, userId)` exige que a resposta pertença à entrevista, pesquisa e conta coerentes. `(questionId, surveyId, userId)` exige que a pergunta pertença à mesma pesquisa e conta. `(optionAnswerId, questionId, userId)` exige que a opção pertença à pergunta e conta informadas. Há ainda uma relação direta com `User` por `userId`.

**Unicidade e índices.** `id` é chave primária. A combinação `(interviewId, questionId)` é única, limitando cada entrevista a no máximo uma resposta persistida por pergunta. Os índices `(interviewId, surveyId, userId)`, `(questionId, surveyId, userId)` e `(optionAnswerId, questionId, userId)` apoiam as relações, consultas por entrevista e validação estrutural.

**Exclusão.** É excluída em cascata com a entrevista. Suas referências a pergunta e opção são restritivas, evitando que elementos usados por respostas sejam removidos isoladamente. A remoção de conta também permanece sujeita à relação direta restritiva com `User` enquanto a resposta existir.

**Ciclo de vida.** `createdAt` registra a criação; `updatedAt` é opcional e atualizado automaticamente pelo Prisma.

### 3.4 Entidades operacionais e de segurança

#### 3.4.1 Session

**Propósito.** Mantém uma sessão autenticada e o estado necessário à emissão, rotação, expiração e revogação de tokens de renovação.

**Atributos principais.** `id` UUID; `accountId`; `tokenHash`, que armazena o hash do token de renovação atual; `createdAt`; `expiresAt`; `lastUsedAt`; `revokedAt` opcional; `userAgent` opcional limitado a 200 caracteres; e `ipHash` opcional limitado a 64 caracteres.

**Relacionamentos e titularidade.** Pertence a um `User` e possui muitos `SessionUsedToken`. É operacionalmente vinculada à conta por `accountId`, mas não contém dados de pesquisa.

**Unicidade e índices.** `id` é chave primária e `tokenHash` é único. O índice `(accountId, revokedAt)` apoia busca e revogação das sessões ativas da conta; o índice de `expiresAt` apoia identificação e limpeza das sessões expiradas.

**Exclusão.** É excluída em cascata com a conta. A limpeza periódica remove sessões expiradas. Ao excluir uma sessão, seus tokens usados são excluídos em cascata.

**Ciclo de vida.** `createdAt` e `lastUsedAt` começam no momento da criação. `lastUsedAt` muda quando o token é rotacionado; `revokedAt` marca revogação sem excluir imediatamente o registro; `expiresAt` determina o limite temporal da sessão.

#### 3.4.2 SessionUsedToken

**Propósito.** Registra hashes de tokens de renovação já consumidos para detectar reapresentação ou replay durante a rotação.

**Atributos principais.** `tokenHash`; `sessionId`; e `usedAt`.

**Relacionamentos e titularidade.** Pertence a uma única `Session`. A conta é identificável indiretamente pela sessão.

**Unicidade e índices.** `tokenHash` é a chave primária, logo cada token usado só pode ser registrado uma vez. `sessionId` possui índice para acesso e manutenção por sessão.

**Exclusão.** É excluído em cascata com a sessão e, indiretamente, com a conta.

**Ciclo de vida.** `usedAt` registra por padrão o momento em que o token anterior é consumido. Não possui timestamp de atualização.

#### 3.4.3 RevokedTokenSubject

**Propósito.** Funciona como marcador temporal de revogação global de tokens emitidos para uma conta, inclusive após a exclusão dela.

**Atributos principais.** `accountId` e `revokedBefore`.

**Relacionamentos e titularidade.** `accountId` identifica o sujeito revogado, mas não há chave estrangeira para `User`. Essa ausência é intencional para permitir que o registro sobreviva como tombstone de segurança depois da exclusão da conta.

**Unicidade e índices.** `accountId` é a chave primária; existe no máximo um marco de revogação global por identificador de conta.

**Exclusão.** Não há cascata associada à conta. O fluxo de exclusão da conta faz `upsert` deste registro em vez de removê-lo.

**Ciclo de vida.** `revokedBefore` recebe o horário atual por padrão e é substituído quando uma revogação global mais recente é registrada. Não há `createdAt` ou `updatedAt` separado.

#### 3.4.4 RateLimitBucket

**Propósito.** Compartilha entre instâncias da API o estado de limitação de taxa de requisições.

**Atributos principais.** `key`, composta operacionalmente pelo nome do limitador e pela chave do cliente; `totalHits`; `expiresAt`; e `blockedUntil` opcional.

**Relacionamentos e titularidade.** Não possui relação estrangeira com contas ou entidades de produto. Dependendo do limitador, a chave pode representar um contexto de requisição, mas isso não constitui titularidade de domínio.

**Unicidade e índices.** `key` é a chave primária. `expiresAt` possui índice para localizar janelas expiradas. Incrementos são serializados com bloqueio consultivo do PostgreSQL para manter a decisão consistente entre réplicas.

**Exclusão.** Não há cascatas ou vínculo de exclusão com entidades de produto. Janelas expiradas são reinicializadas por `upsert` quando a chave volta a ser usada; o modelo não define timestamps gerais de criação ou atualização.

**Ciclo de vida.** `expiresAt` delimita a janela corrente; `blockedUntil` delimita um bloqueio ativo; `totalHits` é reiniciado quando a janela ou o bloqueio expira.

#### 3.4.5 PdfRenderLease

**Propósito.** Representa uma reserva temporária de capacidade para geração de PDF e permite aplicar limites simultâneos globais e por conta entre diferentes instâncias da API.

**Atributos principais.** `id` UUID; `accountId`; `expiresAt`; e `createdAt`.

**Relacionamentos e titularidade.** `accountId` identifica a conta para contagem de capacidade, mas não possui chave estrangeira para `User`. A entidade é operacional e não integra a hierarquia de conteúdo da pesquisa.

**Unicidade e índices.** `id` é chave primária. O índice `(accountId, expiresAt)` apoia a contagem e expiração por conta; o índice de `expiresAt` apoia limpeza global de reservas vencidas. A aquisição usa bloqueio consultivo do PostgreSQL para tornar atômicas a limpeza, a verificação dos limites e a inserção.

**Exclusão.** A reserva é removida explicitamente ao liberar a capacidade; reservas expiradas são apagadas antes de uma nova aquisição. Não há cascata quando uma conta é excluída.

**Ciclo de vida.** `createdAt` registra a aquisição e `expiresAt` limita a validade da reserva. Não possui timestamp de atualização.

### 3.5 Resumo das regras de integridade e exclusão

- A titularidade de conteúdo começa em `User` e é propagada por `userId` nas principais entidades de produto.
- Chaves compostas garantem que perguntas e entrevistas pertençam à pesquisa da mesma conta e que respostas combinem entrevista, pesquisa, pergunta, opção e conta compatíveis.
- Uma entrevista admite no máximo uma resposta por pergunta por causa da unicidade de `(interviewId, questionId)`.
- Excluir uma entrevista elimina suas respostas; excluir uma pesquisa aciona cascatas para perguntas e entrevistas; excluir uma pergunta aciona cascata para opções.
- Respostas restringem a exclusão isolada das perguntas e opções que referenciam.
- Regras condicionais não são eliminadas automaticamente pelo banco. Os fluxos de exclusão individual de pergunta e opção fazem limpeza explícita, mas a exclusão direta da pesquisa continua sujeita às restrições existentes.
- Excluir uma conta elimina suas sessões, mas os vínculos diretos restritivos das entidades de produto exigem que não permaneçam dados associados. O tombstone de revogação e reservas operacionais sem chave estrangeira não são apagados em cascata.
- `slug` é único globalmente em `User`, `Survey`, `Question` e `OptionAnswer`; os números de perguntas e opções não possuem unicidade garantida pelo schema.

## 4. Requisitos funcionais

> A preencher com requisitos funcionais verificáveis e rastreáveis ao comportamento existente.

## 5. Regras de negócio

> A preencher com validações, condições, cálculos, restrições e fluxos de decisão implementados.

## 6. Segurança

> A preencher com mecanismos e requisitos de autenticação, autorização, proteção de dados, auditoria e demais controles atualmente implementados.

## 7. Relatórios

> A preencher com os relatórios, indicadores, filtros, formatos e regras de acesso disponíveis no sistema atual.

## 8. Catálogo de APIs

> A preencher com endpoints, métodos, parâmetros, respostas, autenticação e erros das APIs atualmente disponíveis.

## 9. Requisitos não funcionais

> A preencher com requisitos verificáveis de desempenho, disponibilidade, confiabilidade, observabilidade, acessibilidade, compatibilidade e manutenibilidade existentes.

## 10. Limitações

> A preencher com limitações conhecidas e comportamentos que não são suportados pela implementação atual.

## 11. Questões em aberto

> A preencher com dúvidas que dependem de investigação ou decisão. Itens desta seção não representam funcionalidades existentes ou aprovadas.

## 12. Critérios de aceitação

> A preencher com critérios objetivos para validar os requisitos documentados contra o sistema atualmente implementado.
