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

### 4.1 Contas

#### RF-AUT-001 — Cadastrar conta

A API deve permitir o cadastro público de uma conta por `POST /accounts`, mediante nome, e-mail e senha válidos. O e-mail deve ser normalizado antes da verificação de existência e da persistência, a senha deve ser verificada contra a política de comprometimento e apenas seu hash bcrypt deve ser armazenado. A conta criada recebe o papel `USER`; campos adicionais enviados pelo cliente não permitem autoatribuição de `ADMIN`.

Em uma criação válida, a API responde com HTTP `201` e sem representação da conta no corpo. Se o e-mail normalizado já estiver cadastrado, a resposta também é concluída sem revelar a existência da conta e mantém o comportamento HTTP `201`. Dados inválidos produzem HTTP `400`.

#### RF-AUT-002 — Atualizar a própria conta

A API deve permitir que uma conta autenticada altere seu nome, e-mail e/ou senha por `PUT /accounts`. Pelo menos um desses campos deve estar presente. Apenas a conta identificada pelo claim `sub` do token pode ser alterada; o endpoint não aceita mudança de papel.

Nome e e-mail são normalizados e revalidados. Uma nova senha passa pelas mesmas validações do cadastro e é novamente armazenada como hash bcrypt. A alteração válida responde com HTTP `204`. Corpo sem qualquer campo alterável ou dados inválidos produzem HTTP `400`; conta inexistente produz HTTP `404`; conflito de e-mail com outra conta produz HTTP `409`.

Uma mudança somente de nome ou e-mail mantém as sessões existentes. Uma mudança de senha atualiza a conta e, na mesma transação, grava o marco de revogação global e marca as sessões ainda ativas como revogadas.

#### RF-AUT-003 — Excluir a própria conta

A API deve permitir que uma conta autenticada solicite sua exclusão por `DELETE /accounts`. Em caso de sucesso, responde com HTTP `204`, as sessões relacionadas são removidas em cascata e permanece um tombstone em `RevokedTokenSubject` para invalidar tokens emitidos anteriormente. Conta inexistente produz HTTP `404`.

A exclusão continua sujeita às restrições referenciais descritas na seção 3: dados de produto ainda diretamente associados à conta podem impedir a operação no banco. Não há fluxo administrativo de exclusão de outra conta.

### 4.2 Autenticação e sessões

#### RF-AUT-004 — Autenticar com e-mail e senha

A API deve autenticar publicamente por `POST /sessions`. O e-mail recebido é aparado, convertido para minúsculas e validado como e-mail antes da busca. A senha é comparada ao hash bcrypt armazenado. Conta inexistente e senha incorreta resultam no mesmo HTTP `401`, sem indicar qual credencial falhou.

Se o custo do hash armazenado estiver abaixo do custo bcrypt configurado, a senha válida é recalculada e o hash é atualizado durante o login. Em caso de sucesso, a API cria uma sessão e responde com HTTP `201` e:

- `access_token`: JWT de acesso;
- `refresh_token`: token opaco de renovação;
- `refresh_expires_at`: expiração do refresh token em ISO 8601;
- `token_type`: valor `Bearer`.

#### RF-AUT-005 — Usar token de acesso

O token de acesso deve ser apresentado exclusivamente no cabeçalho `Authorization: Bearer`. Cookies não são usados como fonte do JWT. Em cada requisição protegida, a API deve validar assinatura, algoritmo, claims obrigatórios, emissor, audiência, expiração, revogação, atividade da sessão e existência atual da conta.

Tokens ausentes, inválidos, expirados ou ligados a sessão/conta inativa produzem HTTP `401` antes da execução do controlador protegido.

#### RF-AUT-006 — Renovar a sessão com rotação

A API deve renovar tokens publicamente por `POST /sessions/refresh`, recebendo `refresh_token` com comprimento entre 40 e 200 caracteres. O token deve identificar uma sessão existente, ativa e não expirada e deve corresponder, por comparação segura, ao hash atualmente armazenado.

Cada renovação bem-sucedida substitui o hash atual, atualiza `lastUsedAt`, registra o hash anterior em `SessionUsedToken` e devolve HTTP `201` com um novo par de tokens no mesmo formato do login. A expiração absoluta da sessão original é preservada; a rotação não amplia `expiresAt`.

Token malformado, desconhecido, expirado, revogado ou diferente do token corrente resulta em HTTP `401` com a mensagem `Invalid refresh token`.

#### RF-AUT-007 — Impedir reutilização de refresh token

Ao detectar que um refresh token já consumido é reapresentado para a mesma sessão, a API deve tratar o evento como replay, revogar a sessão inteira e rejeitar a tentativa com HTTP `401`. Como consequência, o refresh token mais novo emitido para essa sessão também deixa de ser aceito. Uma disputa de rotação concorrente que não consiga reivindicar atomicamente o token corrente recebe o mesmo tratamento de segurança.

#### RF-AUT-008 — Encerrar a sessão atual

A conta autenticada deve poder chamar `DELETE /sessions/current`. A API marca com `revokedAt` a sessão identificada pelos claims `sid` e `sub` do token e responde com HTTP `200` e `{ "revoked": true }`. Após a operação, nem o token de acesso nem o refresh token dessa sessão são aceitos.

#### RF-AUT-009 — Revogar todas as sessões da conta

A conta autenticada deve poder chamar `DELETE /sessions`. A API marca como revogadas todas as sessões ainda ativas que possuam o mesmo `accountId` e responde com HTTP `200` e `{ "revoked": true }`. Os refresh tokens dessas sessões e os tokens de acesso vinculados a elas deixam de ser aceitos.

#### RF-AUT-010 — Expirar e limpar sessões

Uma sessão deve ser considerada ativa somente enquanto não estiver revogada e `expiresAt` for posterior ao momento da validação. A aplicação executa periodicamente uma limpeza que exclui sessões já expiradas; o intervalo é configurável entre 1 e 1.440 minutos e tem padrão de 60 minutos. A validade do refresh token é configurável entre 1 e 90 dias, com padrão de 30 dias.

#### RF-AUT-011 — Registrar metadados mínimos da sessão

No login, a API pode persistir o cabeçalho `User-Agent`, limitado aos primeiros 200 caracteres, e um hash pseudonimizado do endereço IP. O IP somente é persistido quando `SESSION_IP_HASH_SECRET` está configurado; nesse caso é usado HMAC-SHA-256, não o endereço em texto claro. Ausência desses metadados não impede a criação da sessão.

Eventos de login, renovação, replay, logout e limitação de taxa são auditados sem registrar credenciais ou tokens. Identificadores e IPs enviados ao log de segurança são pseudonimizados com HMAC-SHA-256 e truncados para uso operacional.

### 4.3 Superfície pública e protegida

As rotas de autenticação explicitamente públicas são:

| Método e rota | Finalidade | Exige JWT |
| --- | --- | --- |
| `POST /accounts` | Cadastro de conta | Não |
| `POST /sessions` | Login e criação de sessão | Não |
| `POST /sessions/refresh` | Rotação do refresh token | Não |

As rotas de conta e sessão protegidas são:

| Método e rota | Finalidade | Exige JWT |
| --- | --- | --- |
| `PUT /accounts` | Atualização da própria conta | Sim |
| `DELETE /accounts` | Exclusão da própria conta | Sim |
| `DELETE /sessions/current` | Revogação da sessão atual | Sim |
| `DELETE /sessions` | Revogação de todas as sessões da conta | Sim |

O `JwtAuthGuard` é registrado globalmente. Assim, todo controlador exige JWT válido, exceto quando a classe ou o método está explicitamente marcado como público. A rota operacional pública de métricas não integra os fluxos de autenticação acima.

### 4.4 Funcionalidades de conta não implementadas

Não fazem parte do comportamento atual: recuperação ou redefinição de senha por fluxo de “esqueci minha senha”, verificação de endereço de e-mail, autenticação multifator, listagem de sessões/dispositivos, encerramento seletivo de outra sessão, login social e mudança de papel por endpoint.

### 4.5 Criação completa de pesquisa

#### RF-PES-001 — Criar pesquisa e estrutura aninhada

A conta autenticada deve poder criar uma pesquisa por `POST /surveys`, informando obrigatoriamente `title`, `location` e `type`. O corpo pode incluir `questions`; quando omitido, a pesquisa é criada sem perguntas. Quando presente, cada pergunta deve conter `questionTitle`, `questionNum` e um array `options`, que pode estar vazio. Cada opção deve conter `optionTitle` e `optionNum`. Cada pergunta pode ainda conter `conditionalRules`.

A operação cria pesquisa, perguntas, opções e regras condicionais em uma única transação. Qualquer falha de estrutura ou de persistência impede a gravação parcial do agregado. Em caso de sucesso, responde com HTTP `201`, mensagem `Pesquisa criada com sucesso.` e `surveyId`.

Na criação completa:

- título, local e tipo são aparados e não podem ficar vazios;
- título e número de cada pergunta são obrigatórios, e o número deve ser inteiro positivo;
- título e número de cada opção são obrigatórios, e o número deve ser inteiro positivo;
- números de perguntas não podem se repetir dentro do payload da pesquisa;
- números de opções não podem se repetir dentro de uma mesma pergunta;
- uma regra condicional deve apontar para uma pergunta existente no mesmo payload e para uma opção existente nessa pergunta;
- a pergunta não pode depender de si própria;
- dependências podem referenciar qualquer outra pergunta incluída no payload, pois toda a estrutura é resolvida antes da persistência.

Estrutura inválida retorna HTTP `400` sem persistência parcial. Conflitos de chave única ou de chave estrangeira detectados durante a transação retornam HTTP `409` com mensagem genérica de dados conflitantes.

#### RF-PES-002 — Representar regras condicionais

Uma regra condicional declara que a pergunta à qual está anexada depende de uma pergunta identificada por número e de uma opção identificada por número nessa pergunta, sempre no contexto da mesma pesquisa. No payload de criação completa, os campos externos são `questionNum` e `optionNum`; internamente, eles são convertidos para `dependsOnQuestionNumber` e `dependsOnOptionNumber` e resolvidos para os UUIDs correspondentes.

Regras condicionais não possuem endpoints dedicados de criação, consulta, edição ou exclusão. Elas são criadas junto da pesquisa completa ou junto da criação individual de uma pergunta, aparecem dentro do detalhe da pesquisa e são removidas como efeito da exclusão das perguntas ou opções relacionadas.

### 4.6 Gestão de pesquisas

#### RF-PES-003 — Listar pesquisas da conta

`GET /surveys` deve listar somente pesquisas da conta autenticada. O parâmetro `page` é convertido para número, deve ser no mínimo 1 e assume 1 quando omitido. A persistência usa páginas fixas de 10 registros. A resposta HTTP `200` é um array contendo apenas `id` e `title`; embora o repositório calcule o total, o controlador atual não o inclui na resposta.

Página não numérica ou menor que 1 retorna HTTP `400`. Erro de repositório é mapeado para HTTP `500`. Não há ordenação explícita na consulta, portanto a API não garante ordem estável entre pesquisas nem entre páginas.

#### RF-PES-004 — Obter detalhe de pesquisa

`GET /surveys/:id` deve aceitar UUID válido e localizar a pesquisa pela combinação de identificador e conta autenticada. A resposta HTTP `200` inclui os dados da pesquisa e sua estrutura aninhada: perguntas, opções e regras condicionais. No detalhe, cada regra é apresentada pelos números `questionNum` e `optionNum` da dependência.

UUID inválido retorna HTTP `400`. Pesquisa ausente ou pertencente a outra conta retorna HTTP `404`, sem expor dados do outro titular. A consulta não declara ordenação para perguntas, opções ou regras condicionais; clientes não devem inferir uma ordem garantida do detalhe.

#### RF-PES-005 — Atualizar pesquisa

`PUT /surveys/:id` deve permitir ao proprietário alterar `title`, `location` ou ambos. O endpoint não altera `type`, perguntas, opções nem regras condicionais. Pelo menos um valor truthy deve ser fornecido. Sucesso retorna HTTP `204`; corpo vazio, título vazio isolado ou local vazio isolado retorna HTTP `400`; pesquisa inexistente retorna HTTP `404`; pesquisa de outra conta retorna HTTP `403`.

O endpoint individual de atualização aceita strings sem aplicar `trim` ou os mínimos da criação completa. O `slug` da pesquisa não é recalculado quando o título é alterado.

#### RF-PES-006 — Excluir pesquisa

`DELETE /surveys/:id` deve permitir a exclusão apenas pelo proprietário. Sucesso retorna HTTP `204`; pesquisa inexistente retorna HTTP `404`; pesquisa de outra conta retorna HTTP `403`.

A chave estrangeira da pesquisa elimina perguntas e entrevistas em cascata; perguntas eliminam opções em cascata, e entrevistas eliminam respostas em cascata. Regras condicionais usam relações restritivas e não são removidas automaticamente por este caso de uso. Assim, uma pesquisa com regras condicionais persistidas pode ter a exclusão bloqueada até que essas regras sejam removidas pelos fluxos atualmente disponíveis, conforme detalhado nas seções 3.3.2 e 3.5.

### 4.7 Gestão individual de perguntas

#### RF-PER-001 — Criar pergunta

`POST /questions` deve criar uma pergunta em pesquisa pertencente à conta autenticada. O corpo contém `questionTitle`, `questionNum`, `surveyId` e, opcionalmente, `conditionalRules` com `dependsOnQuestionNumber` e `dependsOnOptionNumber`. A pesquisa é localizada por `(surveyId, accountId)`; pesquisa inexistente ou de outra conta retorna HTTP `404`.

Para cada regra, a API procura, na mesma pesquisa e conta, uma pergunta com o número indicado e, nela, uma opção com o número indicado. Dependência ou opção ausente retorna HTTP `404`, e a nova pergunta não é persistida. Pergunta e regras válidas são gravadas em uma única transação. Sucesso retorna HTTP `201` e a representação da pergunta criada.

#### RF-PER-002 — Obter pergunta por identificador

`GET /questions/:id` deve retornar HTTP `200` com identificador, título, número, pesquisa, conta, slug e timestamps da pergunta. Pergunta inexistente retorna HTTP `404`; pergunta pertencente a outra conta retorna HTTP `403`.

#### RF-PER-003 — Listar perguntas de uma pesquisa

`GET /questions/survey/:id` deve primeiro confirmar que a pesquisa pertence à conta autenticada e então listar apenas suas perguntas. Pesquisa inexistente ou de outra conta retorna HTTP `404`. A resposta HTTP `200` é ordenada por `number` em ordem crescente e contém identificador, título, número, pesquisa e conta de cada pergunta. Uma pesquisa válida sem perguntas produz array vazio.

#### RF-PER-004 — Atualizar pergunta

`PUT /questions/:id` deve permitir ao proprietário alterar `title`, `num` ou ambos. Pelo menos um valor truthy deve ser fornecido. Sucesso retorna HTTP `204`; payload sem valor aceito retorna HTTP `400`; pergunta inexistente retorna HTTP `404`; pergunta de outra conta retorna HTTP `403`.

Ao alterar o título, a entidade recalcula o slug da pergunta. A atualização não altera nem revalida regras condicionais já persistidas que armazenam os números das dependências.

#### RF-PER-005 — Excluir pergunta

`DELETE /questions/:id` deve permitir a exclusão apenas pelo proprietário. Antes de remover a pergunta, o caso de uso exclui regras em que ela é a pergunta condicionada e regras em que ela é a pergunta de dependência. Sucesso retorna HTTP `204`; pergunta inexistente retorna HTTP `404`; pergunta de outra conta retorna HTTP `403`.

As opções da pergunta são eliminadas por cascata. Respostas existentes referenciam pergunta e opção com comportamento restritivo; por isso, uma pergunta já usada em respostas pode não ser removível enquanto essas respostas existirem.

### 4.8 Gestão individual de opções de resposta

#### RF-OPC-001 — Criar opção

`POST /option-answers` deve criar uma opção em pergunta pertencente à conta autenticada. O corpo contém `optionTitle`, `optionNum` e `questionId`, sendo este último um UUID válido. Pergunta inexistente ou pertencente a outra conta retorna HTTP `404`. Sucesso retorna HTTP `201`; o controlador atual não devolve a representação criada.

#### RF-OPC-002 — Obter opção por identificador

`GET /option-answers/:optionId` deve validar o identificador como UUID e localizar a opção em conjunto com a conta autenticada. Sucesso retorna HTTP `200` com identificador, título, número, pergunta, conta, slug e timestamps. UUID inválido retorna HTTP `400`; opção inexistente ou de outra conta retorna HTTP `404`.

#### RF-OPC-003 — Listar opções de uma pergunta

`GET /option-answers/question/:questionId` deve validar `questionId` como UUID e retornar somente opções que combinem a pergunta e a conta autenticada. A resposta HTTP `200` contém identificador, pergunta, título e número. A consulta não declara ordenação, portanto não garante ordem por `optionNum`.

O endpoint não confirma separadamente a existência ou a titularidade da pergunta: pergunta inexistente, pergunta de outra conta ou pergunta válida sem opções produz array vazio. UUID inválido retorna HTTP `400`.

#### RF-OPC-004 — Atualizar opção

`PUT /option-answers/:id` deve permitir ao proprietário alterar `title`, `num` ou ambos. Pelo menos um valor truthy deve ser fornecido. Sucesso retorna HTTP `204`; payload vazio retorna HTTP `400`; opção inexistente ou de outra conta retorna HTTP `404`.

O título e o número são atualizados sem recalcular o slug e sem atualizar regras condicionais que armazenem o número anterior da opção.

#### RF-OPC-005 — Excluir opção

`DELETE /option-answers/:id` deve localizar a opção em conjunto com a conta autenticada. Antes de removê-la, o caso de uso exclui regras condicionais que dependam dessa opção. Sucesso retorna HTTP `204`; opção inexistente ou de outra conta retorna HTTP `404`.

Respostas existentes referenciam a opção com exclusão restritiva. Portanto, uma opção já usada em respostas pode não ser removível enquanto essas respostas existirem.

### 4.9 Notas de implementação sobre rigor de validação

A criação completa e os endpoints individuais não aplicam a mesma política:

| Regra | `POST /surveys` completo | Endpoints individuais |
| --- | --- | --- |
| Textos de pesquisa/pergunta/opção | `trim` e rejeição de vazio | Em geral, apenas tipo `string`; updates usam verificação truthy |
| Números de pergunta/opção | Inteiros positivos | Apenas tipo `number`; não há teste geral de inteiro ou positividade |
| Número de pergunta duplicado | Rejeitado no payload | Não verificado e não restringido pelo schema |
| Número de opção duplicado na pergunta | Rejeitado no payload | Não verificado e não restringido pelo schema |
| Dependência ausente | HTTP `400`, transação não iniciada | HTTP `404`, pergunta não criada |
| Autodependência | Rejeitada explicitamente | Sem verificação explícita; a pergunta nova ainda não existe durante a resolução |
| Atomicidade | Todo o agregado em uma transação | Pergunta e suas regras em uma transação; opção é operação isolada |

No fluxo individual, uma pergunta nova normalmente não consegue depender de si mesma porque a resolução ocorre antes de sua persistência. Contudo, como números duplicados são permitidos nesse fluxo, uma regra com o mesmo número da nova pergunta pode resolver para uma pergunta preexistente com número duplicado; isso não equivale à validação explícita de autodependência existente na criação completa.

Também não há verificação de duplicidade entre regras condicionais idênticas. Os números armazenados em `ConditionalRule` coexistem com UUIDs resolvidos, e alterações posteriores nos números de perguntas ou opções não disparam sincronização automática dessas regras.

### 4.10 Entrevistas e coleta de respostas

#### RF-ENT-001 — Criar entrevista para uma pesquisa

A conta autenticada deve poder criar uma entrevista por `POST /interviews`. O corpo exige:

- `surveyId`: UUID da pesquisa;
- `answers`: array obrigatório, que pode estar vazio;
- para cada item de `answers`, `questionId` e `answerId` como UUIDs, sendo `answerId` o identificador da opção selecionada.

Antes de criar a entrevista, a API localiza a pesquisa pela combinação `(surveyId, accountId)`. Pesquisa inexistente ou de outra conta retorna HTTP `404` e nenhuma entrevista é criada. Payload ausente, identificadores malformados ou estrutura inválida retornam HTTP `400`. Em caso de sucesso, a API responde com HTTP `201` sem representação da entrevista no corpo.

A entrevista não contém dados identificadores do participante. Ela registra uma ocorrência de aplicação da pesquisa pertencente à conta autenticada.

#### RF-ENT-002 — Enviar múltiplas respostas com a entrevista

Após criar a entrevista, o controlador deve processar todos os itens de `answers`. Para cada item, cria uma `AnswerQuestion` que associa:

- a entrevista recém-criada;
- a pergunta informada em `questionId`;
- a opção selecionada informada em `answerId`;
- a pesquisa derivada da entrevista;
- a conta autenticada.

O array pode conter múltiplas respostas e elas são disparadas concorrentemente com `Promise.all`. Uma lista vazia cria uma entrevista sem respostas. A implementação não exige resposta para todas as perguntas e não impede uma entrevista incompleta.

Se entrevista, pergunta ou opção não for encontrada no escopo correto, o item falha com HTTP `404`. Outros erros reconhecidos pelo controlador seriam HTTP `400`; conflitos de persistência não convertidos para erro HTTP específico chegam ao tratamento global como HTTP `500`.

#### RF-ENT-003 — Obter entrevista por identificador

`GET /interviews/:interviewId` deve validar o parâmetro como UUID. Sucesso retorna HTTP `200` com `id`, `surveyId`, `accountId`, `createdAt` e `updatedAt`. UUID inválido retorna HTTP `400`; entrevista inexistente retorna HTTP `404`; entrevista pertencente a outra conta retorna HTTP `403`.

Esta consulta retorna os metadados da entrevista, sem incluir suas respostas. As respostas podem ser obtidas pelo endpoint específico ou pela listagem de entrevistas da pesquisa.

#### RF-ENT-004 — Listar entrevistas de uma pesquisa

`GET /interviews/survey/:surveyId` deve validar `surveyId` como UUID e aceitar:

- `page`: inteiro mínimo 1, padrão 1;
- `limit`: inteiro mínimo 1, padrão 10.

A consulta filtra simultaneamente `surveyId` e a conta autenticada. A resposta HTTP `200` contém `interviews`, `total`, `page` e `limit`. Cada entrevista contém identificador, pesquisa, timestamps e `answers`; cada resposta aninhada inclui seus dados de pergunta e opção. O caso de uso calcula `totalPages`, mas o controlador atual não o expõe.

As entrevistas são ordenadas por `createdAt` em ordem crescente. Dentro de cada entrevista listada, as respostas são ordenadas pelo número da pergunta em ordem crescente. Não há limite máximo de página ou de `limit` declarado nesse endpoint.

O endpoint não verifica a pesquisa separadamente. Pesquisa inexistente ou pertencente a outra conta resulta em HTTP `200` com `interviews` vazio e `total` zero. UUID ou paginação inválida retorna HTTP `400`.

#### RF-ENT-005 — Excluir entrevista

`DELETE /interviews/:id` deve permitir exclusão apenas pela conta proprietária. Sucesso retorna HTTP `204`; entrevista inexistente retorna HTTP `404`; entrevista de outra conta retorna HTTP `403`.

A exclusão da entrevista remove todas as suas `AnswerQuestion` em cascata. A entrevista também é eliminada em cascata quando sua pesquisa é excluída, observadas as demais restrições de exclusão da pesquisa.

### 4.11 Gestão individual de respostas

#### RF-RES-001 — Criar resposta individual

`POST /answer-questions` deve receber `interviewId`, `questionId` e `optionAnswerId`, todos UUIDs, e usar a conta autenticada como proprietária. Sucesso retorna HTTP `201` sem representação da resposta no corpo. Payload malformado retorna HTTP `400`.

Antes de persistir, o caso de uso deve confirmar cumulativamente que:

- a entrevista pertence à conta autenticada;
- a pergunta pertence à conta autenticada;
- a opção pertence à pergunta informada e à conta autenticada;
- a pergunta pertence à mesma pesquisa da entrevista.

Falha em qualquer uma dessas verificações retorna HTTP `404`, ocultando recursos incompatíveis ou de outra conta. O repositório deriva `surveyId` da entrevista ao persistir a resposta.

#### RF-RES-002 — Impedir resposta duplicada por pergunta

O banco impõe unicidade sobre `(interviewId, questionId)`. Portanto, uma entrevista pode conter no máximo uma resposta persistida para cada pergunta. Uma segunda inserção para a mesma combinação é rejeitada pela persistência, inclusive se tentar selecionar outra opção.

Não há tratamento de domínio ou mapeamento HTTP dedicado para esse conflito nos endpoints de resposta. Assim, a restrição impede a duplicidade no banco, mas o erro atualmente segue o tratamento global de falhas não mapeadas como HTTP `500`, em vez de uma resposta de conflito específica.

#### RF-RES-003 — Obter resposta por identificador

`GET /answer-questions/:answerId` deve validar o identificador como UUID. Sucesso retorna HTTP `200` com `id`, `interviewId`, `questionId`, `optionAnswerId`, `accountId` e timestamps. UUID inválido retorna HTTP `400`; resposta inexistente retorna HTTP `404`; resposta de outra conta retorna HTTP `403`.

#### RF-RES-004 — Listar respostas de uma entrevista

`GET /answer-questions/interview/:interviewId` deve validar o parâmetro como UUID e filtrar por `interviewId` e conta autenticada. Sucesso retorna HTTP `200` com um array de respostas contendo identificadores, conta e timestamps, ordenado por `createdAt` em ordem crescente.

O endpoint não verifica separadamente se a entrevista existe ou pertence à conta. Entrevista inexistente, entrevista de outra conta ou entrevista sem respostas produz array vazio. UUID inválido retorna HTTP `400`.

#### RF-RES-005 — Atualizar resposta

`PUT /answer-questions/:id` deve permitir alterar a opção selecionada e, opcionalmente, a pergunta associada. O corpo aceita `questionId` opcional e exige, na prática, `optionAnswerId` truthy; a ausência de `optionAnswerId` retorna HTTP `400`. Esses dois campos são tipados como strings no controlador, sem validação UUID específica nesse endpoint.

Antes da atualização, a API localiza a resposta por identificador e conta e revalida a entrevista original, a pergunta resultante e a opção resultante. A opção deve pertencer à pergunta, e a pergunta deve pertencer à mesma pesquisa da entrevista, sempre na mesma conta. Resposta ou recurso incompatível, ausente ou de outra conta retorna HTTP `404`. Sucesso retorna HTTP `204`.

Se a mudança de pergunta produzir uma combinação `(interviewId, questionId)` já respondida, a restrição única do banco rejeita a atualização; não há mapeamento específico e o conflito chega ao tratamento global como HTTP `500`.

#### RF-RES-006 — Excluir resposta

`DELETE /answer-questions/:id` deve permitir exclusão apenas pela conta proprietária. Sucesso retorna HTTP `204`; resposta inexistente retorna HTTP `404`; resposta de outra conta retorna HTTP `403`. A exclusão individual não remove entrevista, pergunta ou opção.

### 4.12 Consistência, regras condicionais e limite transacional

#### Coerência entre conta, pesquisa, pergunta e opção

O caso de uso e as chaves estrangeiras compostas se complementam para impedir combinações cruzadas:

- `(interviewId, surveyId, userId)` vincula a resposta à entrevista da mesma pesquisa e conta;
- `(questionId, surveyId, userId)` vincula a resposta à pergunta da mesma pesquisa e conta;
- `(optionAnswerId, questionId, userId)` exige que a opção selecionada pertença à pergunta e conta informadas;
- `(interviewId, questionId)` único impede duas respostas para a mesma pergunta na mesma entrevista.

Essas regras rejeitam recursos de outra conta, perguntas de outra pesquisa e opções pertencentes a outra pergunta, mesmo quando todos os UUIDs existem separadamente.

#### Regras condicionais durante a coleta

A submissão de entrevista e a criação ou atualização de resposta não consultam `ConditionalRule`. Portanto, a implementação atual não avalia automaticamente visibilidade, obrigatoriedade ou aplicabilidade de perguntas condicionais durante a coleta. Ela também não rejeita resposta a uma pergunta cuja condição não tenha sido satisfeita. As regras condicionais permanecem parte da estrutura do questionário, não uma validação executada nesse fluxo.

#### Nota de implementação — atomicidade da criação

O controlador coordena a criação da entrevista e, depois, a criação das respostas em chamadas separadas. A entrevista é persistida antes do `Promise.all`, e cada resposta é inserida por sua própria operação de repositório; não há uma transação de banco única envolvendo a entrevista e todo o conjunto de respostas.

Como risco observável, se uma resposta falhar após a entrevista ser criada, a requisição pode retornar erro e ainda assim deixar a entrevista persistida. Como as respostas são processadas concorrentemente, algumas respostas válidas também podem ter sido persistidas antes ou ao mesmo tempo que outra falhou. A implementação não executa rollback compensatório desse estado parcial.

## 5. Regras de negócio

### 5.1 Normalização e validação de conta

- O nome é submetido a `trim` e deve possuir entre 2 e 100 caracteres após a normalização.
- O e-mail é submetido a `trim` e convertido para minúsculas antes de validação, consulta e persistência.
- O e-mail deve ter formato válido e é único globalmente no banco. Diferenças apenas de maiúsculas, minúsculas ou espaços externos não criam identidades distintas pelos fluxos implementados.
- A senha deve possuir entre 8 e 128 caracteres no valor recebido e não pode ser composta apenas por espaços.
- A senha deve ser rejeitada se o SHA-256 de seu valor estiver na lista local de senhas comprometidas. Essa lista combina hashes embutidos na aplicação com hashes adicionais configuráveis em `COMPROMISED_PASSWORD_SHA256`; não há consulta a serviço externo.
- Cadastro e atualização não aceitam `role` como campo alterável. Uma nova conta recebe `USER` por padrão.

### 5.2 Armazenamento e verificação de senha

- Senhas são transformadas com bcrypt antes da persistência; texto claro não deve ser armazenado.
- O custo bcrypt é configurável de 10 a 14 e tem padrão 10.
- O login compara a senha apresentada com o hash por bcrypt.
- Após autenticação válida, hashes com custo inferior ao configurado são recalculados de forma transparente.
- A alteração de senha revoga tokens e sessões existentes; a simples atualização do hash por aumento de custo durante login não executa essa revogação.

### 5.3 Identidade, papéis e efeito de alterações

- A identidade estável do token é o UUID da conta no claim `sub`, e não o e-mail.
- Alterar somente o e-mail não invalida sessões existentes, pois `sub` permanece inalterado.
- O modelo admite os papéis `USER` e `ADMIN`, e existe um guard capaz de aplicar metadados de papel.
- Nenhum controlador atualmente declara `@Roles(...)`; portanto, não há restrição de rota específica para `USER` ou `ADMIN` na superfície implementada.
- O papel não é confiado como claim persistente do JWT. A estratégia consulta a conta no banco em toda requisição autenticada e acrescenta o papel atual ao contexto da requisição. Uma alteração de papel feita na fonte de verdade tem efeito na próxima requisição, embora atualmente nenhuma rota diferencie os papéis.
- Após exclusão bem-sucedida da conta, o tombstone de revogação invalida tokens anteriores, as sessões deixam de existir e a estratégia também rejeita qualquer token cuja conta já não seja encontrada.

### 5.4 Regras de sessão e token

- Uma sessão é identificada por UUID e cada refresh token tem o formato lógico `sessionId.segredo`, com segredo aleatório de 32 bytes codificado em base64url.
- Apenas SHA-256 do refresh token corrente é persistido; o token em texto claro é devolvido ao cliente e não é recuperável do banco.
- A rotação é de uso único: o hash anterior é movido para o histórico de tokens usados.
- Rotação, registro do token anterior e atualização de `lastUsedAt` ocorrem em transação e usam atualização condicional para evitar dois sucessos concorrentes.
- Logout marca `revokedAt`; não depende de esperar a expiração natural.
- Um access token só é aceito se o `sid` corresponder a uma sessão não revogada e não expirada do mesmo `sub`.
- O marco `revokedBefore` invalida tokens cujo `iat` seja anterior ou igual ao corte, preservada a exceção implementada para sessão comprovadamente criada depois do instante exato de revogação dentro do mesmo segundo.

### 5.5 Regras de autoria e titularidade de pesquisas

- Toda operação de autoria exige JWT válido e usa `sub` como identificador da conta operadora.
- Pesquisa é criada com `userId` igual à conta autenticada; o cliente não fornece outro proprietário.
- Pergunta individual só pode ser criada em pesquisa localizada por `(surveyId, userId)`.
- Opção individual só pode ser criada em pergunta localizada por `(questionId, userId)`.
- A criação de resposta e as chaves compostas do banco reforçam que pergunta, opção e pesquisa pertencem ao mesmo titular, conforme a seção 3.
- Leituras de detalhe de pesquisa, listagem de perguntas e operações sobre opções filtram titularidade no repositório. O tratamento externo varia entre `403`, `404` e array vazio conforme documentado nos requisitos específicos; essa diferença é comportamento atual, não uma regra uniforme de ocultação.
- `title`, `location` e `type` caracterizam a pesquisa na criação. A atualização implementada altera somente título e local; não há endpoint para mudar o tipo.
- `questionNum` organiza perguntas e serve de referência para regras condicionais. `optionNum` identifica uma opção dentro da pergunta para a mesma finalidade.
- Na criação completa, números são únicos dentro de seus respectivos escopos lógicos. Nos endpoints individuais, essa unicidade não é aplicada pelo caso de uso nem pelo banco.
- A listagem específica de perguntas ordena por número crescente. Listagens de pesquisas, opções e estruturas aninhadas no detalhe não possuem `orderBy` e não oferecem garantia de ordenação.
- Regras condicionais só podem ser formadas a partir de dependências resolvidas na mesma pesquisa no fluxo completo ou na mesma combinação de pesquisa e conta no fluxo individual.
- Não existem endpoints próprios para manter `ConditionalRule`; correções exigem os fluxos estruturais disponíveis, e exclusões relacionadas executam as limpezas explicitamente implementadas.

### 5.6 Regras de entrevistas e respostas

- Uma entrevista pertence a exatamente uma pesquisa e à mesma conta proprietária dessa pesquisa.
- Criar entrevista exige pesquisa existente da conta autenticada; listar entrevistas apenas filtra pesquisa e conta, sem confirmar a existência da pesquisa.
- Uma entrevista pode ser criada sem respostas, e não há validação de que todas as perguntas tenham sido respondidas.
- Cada resposta representa uma única opção predefinida para uma pergunta dentro de uma entrevista.
- Entrevista e pergunta de uma resposta devem pertencer à mesma pesquisa e conta.
- A opção selecionada deve pertencer à pergunta e à mesma conta.
- A combinação entrevista/pergunta admite no máximo uma resposta persistida.
- Atualizar uma resposta pode trocar a pergunta e a opção, desde que a nova combinação continue coerente com a pesquisa da entrevista.
- Consultas individuais de entrevista e resposta distinguem recurso estrangeiro com HTTP `403`; listagens por pesquisa ou entrevista filtram por conta e podem retornar coleção vazia sem revelar a existência do recurso estrangeiro.
- Excluir entrevista elimina respostas em cascata; excluir resposta não afeta seus recursos pais.
- Regras condicionais não são avaliadas na criação ou atualização de respostas.
- A criação de entrevista com respostas não é atômica como conjunto e pode resultar em entrevista vazia ou parcialmente respondida quando um item falha.

## 6. Segurança

### 6.1 Access tokens JWT

Os access tokens são JWTs assinados assimetricamente com RS256. A aplicação valida na inicialização que as chaves privada e pública configuradas em base64 formam um par RSA correspondente com pelo menos 2.048 bits. A chave privada assina tokens; a chave pública valida requisições.

O payload exigido contém:

| Claim | Conteúdo |
| --- | --- |
| `sub` | UUID da conta |
| `sid` | UUID da sessão |
| `iat` | instante de emissão em segundos Unix |
| `exp` | instante de expiração em segundos Unix |
| `iss` | `sistema-de-pesquisa` |
| `aud` | `sistema-de-pesquisa` |

O algoritmo aceito é exclusivamente RS256, e emissor e audiência devem corresponder exatamente aos valores acima. A duração do token de acesso é configurada por `ACCESS_TOKEN_TTL_SECONDS`, entre 300 e 86.400 segundos, com padrão de 900 segundos. O papel é carregado do banco após a validação e não faz parte dos claims assinados emitidos pelo serviço de sessão.

### 6.2 Ordem de validação de uma requisição protegida

Para liberar uma rota protegida, a implementação exige cumulativamente:

1. token Bearer presente e assinatura RS256 válida;
2. `sub`, `sid`, `iss`, `aud`, `iat` e `exp` presentes e estruturalmente válidos;
3. emissor e audiência esperados e token não expirado;
4. token não abrangido pelo marco global de revogação da conta;
5. sessão correspondente ao par `sid`/`sub` existente, ativa e não expirada;
6. conta ainda existente;
7. carregamento do papel atual da conta;
8. eventual regra de papel declarada no controlador — atualmente nenhuma é declarada.

Falha de autenticação retorna HTTP `401`. O `RolesGuard` retornaria HTTP `403` com `Insufficient role` se uma rota declarasse um papel incompatível, mas esse cenário não está exposto por nenhum controlador atual.

### 6.3 Limites de taxa relacionados à autenticação

Os limites são configuráveis e usam, por padrão, armazenamento compartilhado no PostgreSQL. A memória do processo pode ser escolhida por configuração. Os valores padrão são:

| Operação | Chave de controle | Limite padrão | Janela/bloqueio padrão |
| --- | --- | ---: | ---: |
| Cadastro | Endereço IP | 5 requisições | 3.600 segundos |
| Login | Endereço IP | 20 requisições | 900 segundos |
| Login | Endereço IP + SHA-256 do e-mail normalizado | 5 requisições | 900 segundos |
| Renovação | Endereço IP | 30 requisições | 60 segundos |
| Renovação | SHA-256 do UUID de sessão extraído do token | 10 requisições | 60 segundos |

O cadastro aplica somente o limitador de cadastro por IP; o login aplica os dois limitadores de login; a renovação aplica os dois limitadores de refresh. Um identificador de sessão inválido é agrupado sob uma chave pseudonimizada comum. Ao exceder um limite, a API responde com HTTP `429`, mensagem `Too many requests. Please try again later.` e cabeçalho `Retry-After`.

Os endereços IP usados como chave do limitador dependem da configuração segura de proxies confiáveis. E-mail, UUID de sessão e valores incluídos em auditoria são transformados antes do uso operacional indicado; senhas e tokens não são registrados.

### 6.4 Comportamentos de segurança deliberados

- Cadastro duplicado não confirma publicamente que o e-mail já existe.
- Login usa a mesma resposta de credencial incorreta para conta inexistente e senha inválida.
- Refresh tokens são opacos, armazenados apenas como hash e rotacionados a cada uso.
- Reutilização de token antigo revoga toda a sessão afetada.
- Mudança de senha revoga sessões e estabelece um corte temporal para tokens anteriores.
- Exclusão bem-sucedida mantém o corte de revogação mesmo sem a conta.
- Papel e existência da conta são consultados novamente em cada requisição protegida.
- Não existe recuperação de senha, verificação de e-mail, MFA ou listagem de sessões a ser protegida ou presumida nesta versão.

## 7. Relatórios

### 7.1 Visão geral

A API oferece relatórios simples e cruzados para pesquisas da conta autenticada. O relatório simples consolida a distribuição das opções observadas em cada pergunta. O relatório cruzado combina pares de perguntas e apresenta a distribuição conjunta de suas opções.

| Relatório | Endpoint | Formato |
| --- | --- | --- |
| Simples, dados | `GET /reports/simple/:surveyId` | JSON |
| Simples, download | `GET /reports/simple/:surveyId/download` | DOCX |
| Simples, download | `GET /reports/simple-pdf/:surveyId` | PDF |
| Cruzado, dados | `GET /reports/cross/:surveyId` | JSON |
| Cruzado, download | `GET /reports/cross/:surveyId/download` | DOCX |

Não existe relatório cruzado em PDF. Todos os endpoints exigem JWT válido e validam a pesquisa pela combinação de `surveyId` e conta autenticada antes de gerar o conteúdo.

### 7.2 Relatório simples em JSON

#### RF-REL-001 — Retornar distribuição simples

`GET /reports/simple/:surveyId` deve responder com HTTP `200` e um array de perguntas que tenham ao menos uma resposta observada nas entrevistas carregadas. Cada item contém:

- `questionId`, `questionNum` e `questionTitle`;
- `options`, com `num`, `answer` e `percentage`.

As respostas são agrupadas por identificador de pergunta e pelo texto da opção. A implementação mantém uma contagem interna por texto de opção, mas não expõe `count` no JSON. Se duas opções distintas tiverem o mesmo texto dentro da mesma pergunta, seus votos são agrupados sob esse texto e o número preservado é o da primeira ocorrência observada.

Perguntas são ordenadas por `questionNum` crescente. Dentro de cada pergunta, as opções observadas são ordenadas por `num` crescente. Opções definidas, mas nunca selecionadas, não aparecem no relatório simples.

#### Cálculo percentual

Para cada opção observada:

```text
percentage = arredondar_2_casas(contagem_da_opção / total_de_entrevistas × 100)
```

O arredondamento usa `toFixed(2)` seguido de conversão para número. Portanto, o JSON pode apresentar `50` em vez de `50.00`, mas a precisão de cálculo é de duas casas decimais.

O denominador é o total de entrevistas da pesquisa, não o total de respostas da pergunta. Uma entrevista sem resposta para determinada pergunta continua no denominador. Por isso, os percentuais de uma pergunta podem somar menos de 100%.

Se não houver entrevistas, a resposta é HTTP `200` com `[]`. Se existirem entrevistas, mas nenhuma resposta válida para uma pergunta, essa pergunta não aparece. Uma pergunta nunca respondida também não aparece.

### 7.3 Relatório simples em DOCX

#### RF-REL-002 — Baixar relatório simples em Word

`GET /reports/simple/:surveyId/download` deve gerar um documento Word com uma seção por pergunta observada e uma tabela com número, texto da opção e percentual. O download usa:

- `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
- `Content-Disposition: attachment`;
- nome lógico `relatorio-simples-{titulo-da-pesquisa}-{MM-AAAA}.docx`.

O título da pesquisa e a data local do processo são usados para formar o nome. O fallback ASCII remove diacríticos, substitui caracteres inseguros e espaços por hífens e evita CR/LF; quando necessário, o cabeçalho também inclui `filename*` codificado em UTF-8.

As opções são ordenadas por número crescente. As perguntas seguem a ordem em que seus identificadores são encontrados durante a leitura das entrevistas; não há ordenação final explícita por número neste gerador. Como as respostas de cada entrevista chegam ordenadas por número de pergunta, a ordem normalmente acompanha esse número, mas entrevistas incompletas podem fazer uma pergunta ser descoberta mais tarde. Essa ordem não deve ser tratada como garantia equivalente à do JSON.

O cálculo interno arredonda cada percentual para uma casa decimal, converte-o para número e depois o documento o apresenta com `toFixed(2)`. Assim, um valor calculado como `33.3` é exibido como `33.30%`: há duas casas visuais, mas somente uma casa de precisão antes da formatação.

As contagens não são exibidas. Se não houver entrevistas, o endpoint retorna HTTP `404`; se houver entrevista sem qualquer resposta aproveitável, pode ser gerado um documento contendo apenas o cabeçalho.

### 7.4 Relatório simples em PDF

#### RF-REL-003 — Baixar relatório simples em PDF

`GET /reports/simple-pdf/:surveyId` deve montar HTML local, renderizá-lo com Chromium/Puppeteer e devolver um PDF A4 com gráficos de barras e lista de opções. O download usa:

- `Content-Type: application/pdf`;
- `Content-Disposition: attachment`;
- nome lógico `relatorio-simples-{titulo-da-pesquisa}-{MM-AAAA}.pdf`.

As opções são ordenadas por número crescente. As perguntas são construídas na ordem de descoberta no conjunto agregado e não recebem ordenação final explícita por `questionNum`, compartilhando o mesmo limite de ordenação por encontro descrito para o DOCX simples.

O percentual é arredondado para uma casa decimal e convertido para número antes da construção do HTML. O HTML apresenta o valor numérico sem completar zeros: `33.3%` pode aparecer como tal, enquanto `50` pode aparecer como `50%`. Barras são limitadas visualmente ao intervalo de 0% a 100%. A lista inclui apenas opções observadas e exibe percentual, não contagem.

Se não houver entrevistas, retorna HTTP `404`. Se houver entrevistas sem respostas aproveitáveis, o renderer pode produzir um PDF válido sem seções de pergunta.

O HTML escapa títulos, textos e valores antes da interpolação. O renderer bloqueia recursos de rede, permitindo apenas `about:blank` e URLs `data:`, e fecha página e navegador ao concluir ou falhar.

### 7.5 Relatório cruzado em JSON

#### RF-REL-004 — Retornar cruzamentos de perguntas

`GET /reports/cross/:surveyId` deve formar todos os pares não repetidos de perguntas, depois de ordenar as perguntas por `questionNum` crescente. Para cada par elegível, a resposta contém:

- título, número e identificador da pergunta A;
- título, número e identificador da pergunta B;
- `answers`, contendo todas as combinações cartesianas das opções definidas para A e B, com números, textos e `percentage`.

Pares são ordenados por `questionANum` e depois `questionBNum`. As combinações são ordenadas por `numA` e depois `numB`. Se uma das duas perguntas não possuir opções, o par é omitido. Combinações válidas sem ocorrência são mantidas com percentual zero.

Uma entrevista incrementa uma combinação somente quando contém resposta para as duas perguntas do par. A contagem é interna e não é exposta no JSON. O percentual usa, ainda assim, todas as entrevistas como denominador:

```text
percentage = arredondar_2_casas(contagem_da_combinação / total_de_entrevistas × 100)
```

Entrevistas que responderam apenas uma das perguntas não incrementam combinação alguma, mas permanecem no denominador. Assim, a soma das combinações de um par pode ser inferior a 100%.

Sem entrevistas, retorna HTTP `200` com `[]`, antes de exigir duas perguntas. Com entrevistas e menos de duas perguntas, retorna HTTP `400` com `São necessárias pelo menos duas perguntas para gerar relatório cruzado`. Com duas ou mais perguntas, mas nenhum par em que ambos os lados tenham opções, pode retornar `[]`.

### 7.6 Relatório cruzado em DOCX

#### RF-REL-005 — Baixar cruzamento em Word

`GET /reports/cross/:surveyId/download` deve gerar um documento DOCX em orientação paisagem. Cada par elegível é apresentado como uma matriz: opções da pergunta A nas colunas, opções da pergunta B nas linhas e percentuais nas células.

O download usa:

- `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
- `Content-Disposition: attachment`;
- nome lógico `relatorio-cruzado-{titulo-da-pesquisa}-{MM-AAAA}.docx`.

Perguntas são ordenadas antes da geração dos pares; a iteração dos pares preserva ordem crescente de A e B. Números das opções A e B são ordenados de forma crescente na matriz.

O cálculo arredonda para uma casa decimal e a célula é exibida com exatamente uma casa por `toFixed(1)`, por exemplo `33.3%`. Contagens são mantidas apenas durante a geração e não aparecem no documento.

Sem entrevistas, retorna HTTP `404`. Com entrevistas e menos de duas perguntas, retorna HTTP `400`. Se nenhum par possuir opções nos dois lados, pode ser produzido um DOCX contendo apenas o título do relatório.

### 7.7 Perguntas não respondidas e regras condicionais

Os geradores não consultam `ConditionalRule` e não distinguem pergunta omitida, pergunta condicionalmente pulada ou outra causa de ausência de resposta.

- No relatório simples, uma pergunta só existe no resultado se alguma resposta para ela foi observada; apenas opções selecionadas aparecem.
- No relatório cruzado, as perguntas e opções são lidas da estrutura da pesquisa. Todos os pares elegíveis e combinações de opções são criados, inclusive combinações com zero ocorrência.
- Em ambos os relatórios, entrevistas sem a resposta necessária permanecem no denominador total.
- Não existe categoria “sem resposta”, “não se aplica” ou “pulada por condição”.

Consequentemente, ausência ou salto condicional reduz os percentuais acumulados, em vez de ser excluído do denominador ou contado separadamente.

### 7.8 Validação de propriedade

Antes de qualquer geração, o controlador consulta a pesquisa por `(surveyId, accountId)`. Pesquisa inexistente ou pertencente a outra conta retorna HTTP `404`. As consultas de entrevistas também filtram por `surveyId` e conta, e as consultas de opções do relatório cruzado filtram opções pela conta autenticada.

Os geradores cruzados consultam perguntas pelo identificador da pesquisa sem filtro de conta no método do repositório; a validação prévia de propriedade no controlador e a relação de titularidade da pesquisa formam a barreira implementada antes dessa chamada. Nenhum relatório deve incluir entrevistas ou opções de outra conta.

Os parâmetros `surveyId` dos endpoints de relatório não possuem validação UUID dedicada no controlador. Um identificador malformado que não localize pesquisa recebe o mesmo HTTP `404` de pesquisa inexistente.

### 7.9 Limites de volume e validação

Os limites são configuráveis na inicialização. Seus padrões e faixas aceitas são:

| Limite | Configuração | Padrão | Faixa aceita |
| --- | --- | ---: | ---: |
| Entrevistas por relatório | `REPORT_MAX_INTERVIEWS` | 1.000 | 1–100.000 |
| Perguntas | `REPORT_MAX_QUESTIONS` | 100 | 1–1.000 |
| Opções por pergunta | `REPORT_MAX_OPTIONS_PER_QUESTION` | 100 | 1–1.000 |
| Comprimento de texto | `REPORT_MAX_TEXT_LENGTH` | 5.000 caracteres | 1–100.000 |
| Documento gerado | `REPORT_MAX_DOCUMENT_BYTES` | 20 MiB | 1.024 bytes–1 GiB |
| Timeout de PDF | `REPORT_TIMEOUT_MS` | 30.000 ms | 1.000–300.000 ms |
| PDFs simultâneos por conta | `REPORT_PDF_USER_CONCURRENCY` | 1 | 1–8 |
| PDFs simultâneos globais | `REPORT_PDF_GLOBAL_CONCURRENCY` | 2 | 1–32 |

O limite por conta não pode exceder o limite global. Se o total real de entrevistas exceder o máximo, a geração é rejeitada; a API não entrega silenciosamente apenas a primeira página. A consulta carrega até o máximo configurado e compara esse recorte com o `total` retornado pelo repositório.

#### Diferenças no alcance da validação

- Todos os formatos validam o total de entrevistas e os textos de perguntas e opções presentes nas respostas carregadas.
- Para relatório simples, quantidade de perguntas e opções é calculada a partir do que foi observado nas respostas: perguntas nunca respondidas e opções nunca selecionadas não entram nessa contagem.
- Para relatório cruzado, além da validação das respostas, todas as perguntas da pesquisa e todas as opções consultadas para cada pergunta são validadas. Assim, uma pergunta ou opção nunca respondida ainda pode fazer o cruzado exceder um limite.
- O limite de opções observado em respostas simples é baseado em textos distintos por pergunta, não necessariamente no número de registros `OptionAnswer`.
- O tamanho máximo de documento é verificado após a geração para DOCX e PDF. Ele não se aplica às respostas JSON.
- O timeout e os limites de concorrência aplicam-se somente ao PDF simples. JSON e DOCX não são envolvidos por `withPdfSlot` e não possuem timeout de relatório equivalente neste código.

Um excesso de entrevistas, perguntas, opções, texto ou bytes gera `InvalidRequestError`. Downloads e relatório cruzado JSON convertem esse erro em HTTP `400`. O endpoint de relatório simples JSON retorna diretamente a promise do caso de uso sem usar o mapeador de erros; nesse caminho, um `InvalidRequestError` chega ao filtro global como HTTP `500`. Essa diferença é comportamento atual.

### 7.10 Concorrência e leases distribuídos de PDF

Antes de gerar PDF, a API precisa adquirir um `PdfRenderLease`. A aquisição usa transação PostgreSQL e um advisory lock comum entre réplicas para executar atomicamente:

1. remoção de leases expirados;
2. contagem dos leases da conta;
3. contagem global;
4. criação de um novo lease, se houver capacidade.

O lease contém UUID, conta, criação e expiração. Sua validade é configurada como `REPORT_TIMEOUT_MS + 30.000 ms`, permitindo recuperação posterior se uma réplica cair sem liberar capacidade. Em conclusão, falha ou timeout normalmente tratado, o lease é liberado no bloco `finally`. Uma falha síncrona do renderer também libera o slot.

Quando o limite por conta está ocupado, o PDF retorna HTTP `429` com `Já existe uma geração de PDF em andamento para este usuário.` Quando a capacidade global está esgotada, retorna HTTP `503` com `A capacidade de geração de PDF está temporariamente esgotada.`

O timeout dispara aborto por `AbortSignal`, registra o evento e retorna HTTP `503` com `A geração do relatório excedeu o tempo limite.` A resposta de timeout não espera indefinidamente por uma operação que ignore cancelamento; a rejeição posterior é observada sem reter a resposta HTTP. O Chromium também recebe o timeout configurado para inicialização, navegação, conteúdo e geração do PDF.

### 7.11 Limitação de taxa

Todas as rotas sob `/reports` usam o limitador `report-user`, identificado pelo `sub` autenticado e, como fallback, pelo IP. O padrão é 10 requisições por 60 segundos, com bloqueio pela mesma janela; limite e janela são configuráveis entre 1 e 1.000 requisições e entre 1 e 86.400 segundos, respectivamente.

Ao exceder o limite, a API retorna HTTP `429`, mensagem `Too many requests. Please try again later.` e cabeçalho `Retry-After`. O armazenamento é PostgreSQL por padrão e usa incremento atômico com advisory lock, permitindo compartilhamento entre réplicas; armazenamento em memória pode ser escolhido por configuração.

**Nota de implementação.** Os controladores de relatório desabilitam explicitamente os limitadores de login e cadastro, mas não desabilitam os dois limitadores de refresh. Pela configuração atual do guard, requisições de relatório também passam pelos limites de refresh por IP e pela chave de sessão derivada; como não há `refresh_token` nessas requisições, essa segunda chave usa o agrupamento `invalid`. O limite padrão de refresh por sessão também é 10 por 60 segundos. Essa sobreposição não deve ser normalizada documentalmente como se apenas `report-user` fosse aplicado.

### 7.12 Matriz de erros

| Condição | JSON simples | DOCX simples | PDF simples | JSON cruzado | DOCX cruzado |
| --- | ---: | ---: | ---: | ---: | ---: |
| Pesquisa ausente ou de outra conta | `404` | `404` | `404` | `404` | `404` |
| Nenhuma entrevista | `200` + `[]` | `404` | `404` | `200` + `[]` | `404` |
| Menos de duas perguntas, havendo entrevistas | N/A | N/A | N/A | `400` | `400` |
| Limite de conteúdo/volume excedido | `500` atual | `400` | `400` | `400` | `400` |
| Documento maior que o limite | N/A | `400` | `400` | N/A | `400` |
| Capacidade PDF da conta excedida | N/A | N/A | `429` | N/A | N/A |
| Capacidade PDF global excedida | N/A | N/A | `503` | N/A | N/A |
| Timeout de relatório | N/A | N/A | `503` | N/A | N/A |
| Rate limit excedido | `429` | `429` | `429` | `429` | `429` |

Falhas inesperadas do renderer ou de infraestrutura que não correspondam aos erros mapeados chegam ao filtro global como HTTP `500`.

### 7.13 Diferenças de formato e precisão

| Aspecto | JSON simples | DOCX simples | PDF simples | JSON cruzado | DOCX cruzado |
| --- | --- | --- | --- | --- | --- |
| Precisão calculada | 2 casas | 1 casa | 1 casa | 2 casas | 1 casa |
| Exibição de zeros finais | Número JSON | 2 casas visuais | Número sem preenchimento | Número JSON | 1 casa visual |
| Contagem exposta | Não | Não | Não | Não | Não |
| Opções sem votos | Omitidas | Omitidas | Omitidas | Incluídas com 0% | Incluídas com 0% |
| Sem entrevistas | `[]` | `404` | `404` | `[]` | `404` |
| Ordem de perguntas | Numérica explícita | Ordem de descoberta | Ordem de descoberta | Numérica explícita | Numérica pela geração dos pares |
| Proteção de tamanho de documento | N/A | Sim | Sim | N/A | Sim |
| Timeout e capacidade PDF | N/A | N/A | Sim | N/A | N/A |

Essas diferenças refletem os caminhos implementados e não constituem uma regra unificada a ser inferida entre formatos.

## 8. Catálogo de APIs

### 8.1 Convenções do catálogo

Este catálogo resume os controladores registrados atualmente. Ele não substitui uma especificação OpenAPI nem repete todas as regras das seções anteriores.

- **Público:** dispensa JWT por uso explícito de `@Public()`.
- **JWT:** exige `Authorization: Bearer {access_token}` por aplicação do `JwtAuthGuard` global.
- Todas as rotas protegidas podem responder HTTP `401` quando o token ou a sessão é ausente, inválido, expirado, revogado ou pertence a conta inativa.
- Rotas sujeitas a rate limit podem responder HTTP `429` e `Retry-After`.
- Nenhum controlador declara restrição `@Roles(...)`; `USER` e `ADMIN` acessam a mesma superfície autenticada atual.
- Não há prefixo global nem versionamento de rota configurado.
- `—` significa que não há parâmetro ou corpo relevante.

### 8.2 Contas

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /accounts` | Público | Cadastrar conta | Corpo: `name`, `email`, `password` | `201`, sem corpo | `400` para nome, e-mail, senha ou senha comprometida inválidos; e-mail já existente mantém `201` sem revelar a conta; `429` por IP |
| `PUT /accounts` | JWT | Atualizar a própria conta | Corpo: ao menos um entre `name`, `email`, `password` | `204`, sem corpo | `400` para corpo vazio ou campo inválido; `404` se a conta não existir; `409` se o novo e-mail pertencer a outra conta |
| `DELETE /accounts` | JWT | Excluir a própria conta | — | `204`, sem corpo | `404` se a conta não existir; restrições referenciais de dados de produto podem impedir a exclusão |

### 8.3 Sessões

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /sessions` | Público | Autenticar e criar sessão | Corpo: `email`, `password`; cabeçalho opcional `User-Agent`; IP obtido da requisição | `201` com `access_token`, `refresh_token`, `refresh_expires_at`, `token_type` | `400` para payload inválido; `401` para e-mail inexistente ou senha incorreta; `429` por IP ou IP+e-mail |
| `POST /sessions/refresh` | Público | Rotacionar refresh token | Corpo: `refresh_token` | `201` com novo par de tokens e expiração | `400` para formato corporal inválido; `401` para token inválido, expirado, revogado ou reutilizado; `429` por IP ou sessão derivada |
| `DELETE /sessions/current` | JWT | Encerrar a sessão representada pelo token | Claims `sub` e `sid` | `200` com `{ "revoked": true }` | `401` se a sessão não estiver autenticada/ativa |
| `DELETE /sessions` | JWT | Revogar todas as sessões da conta | Claim `sub` | `200` com `{ "revoked": true }` | `401` se a sessão chamadora não estiver autenticada/ativa |

### 8.4 Pesquisas

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /surveys` | JWT | Criar pesquisa completa | Corpo: `title`, `location`, `type`; `questions[]` opcional com `questionTitle`, `questionNum`, `options[]` e `conditionalRules[]` opcionais (`questionNum`, `optionNum`) | `201` com mensagem e `surveyId` | `400` para estrutura inválida, dependência ausente, autodependência ou números duplicados; `409` para conflito de persistência |
| `GET /surveys` | JWT | Listar pesquisas próprias | Query: `page` numérico, mínimo 1, padrão 1 | `200` com array de `{ id, title }`, até 10 itens | `400` para página inválida; `500` para falha de repositório |
| `GET /surveys/:id` | JWT | Obter pesquisa e questionário detalhado | Path: `id` UUID | `200` com pesquisa, perguntas, opções e regras condicionais | `400` para UUID inválido; `404` para pesquisa ausente ou de outra conta |
| `PUT /surveys/:id` | JWT | Alterar título e/ou local | Path: `id`; corpo: `title` e/ou `location` | `204`, sem corpo | `400` sem valor truthy; `404` ausente; `403` de outra conta; não altera `type` |
| `DELETE /surveys/:id` | JWT | Excluir pesquisa própria | Path: `id` | `204`, sem corpo | `404` ausente; `403` de outra conta; regras condicionais restritivas podem bloquear a exclusão |

### 8.5 Perguntas

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /questions` | JWT | Criar pergunta individual | Corpo: `questionTitle`, `questionNum`, `surveyId`; `conditionalRules[]` opcional com `dependsOnQuestionNumber`, `dependsOnOptionNumber` | `201` com objeto `question` | `400` para forma inválida; `404` para pesquisa/dependência/opção ausente ou de outra conta |
| `GET /questions/:id` | JWT | Obter pergunta | Path: `id` | `200` com objeto `question` e metadados | `404` ausente; `403` de outra conta; o path não possui validação UUID dedicada |
| `GET /questions/survey/:id` | JWT | Listar perguntas de uma pesquisa | Path: `id` da pesquisa | `200` com array ordenado por número | `404` para pesquisa ausente ou de outra conta; o path não possui validação UUID dedicada |
| `PUT /questions/:id` | JWT | Alterar título e/ou número | Path: `id`; corpo: `title` e/ou `num` | `204`, sem corpo | `400` sem valor truthy ou forma inválida; `404` ausente; `403` de outra conta |
| `DELETE /questions/:id` | JWT | Excluir pergunta | Path: `id` | `204`, sem corpo | `404` ausente; `403` de outra conta; respostas existentes podem restringir exclusão |

### 8.6 Opções de resposta

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /option-answers` | JWT | Criar opção para uma pergunta | Corpo: `optionTitle`, `optionNum`, `questionId` UUID | `201`, sem corpo | `400` para forma/UUID inválido; `404` para pergunta ausente ou de outra conta |
| `GET /option-answers/:optionId` | JWT | Obter opção | Path: `optionId` UUID | `200` com objeto `option` e metadados | `400` para UUID inválido; `404` ausente ou de outra conta |
| `GET /option-answers/question/:questionId` | JWT | Listar opções de uma pergunta | Path: `questionId` UUID | `200` com array de opções | `400` para UUID inválido; pergunta ausente, estrangeira ou sem opções retorna `[]` |
| `PUT /option-answers/:id` | JWT | Alterar título e/ou número | Path: `id`; corpo: `title` e/ou `num` | `204`, sem corpo | `400` sem valor truthy ou forma inválida; `404` ausente ou de outra conta |
| `DELETE /option-answers/:id` | JWT | Excluir opção | Path: `id` | `204`, sem corpo | `404` ausente ou de outra conta; respostas existentes podem restringir exclusão |

### 8.7 Entrevistas

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /interviews` | JWT | Criar entrevista e enviar respostas | Corpo: `surveyId` UUID; `answers[]` obrigatório com `questionId` e `answerId` UUID | `201`, sem corpo | `400` para payload inválido; `404` para pesquisa, pergunta ou opção incompatível/ausente; falha em resposta pode deixar estado parcial |
| `GET /interviews/:interviewId` | JWT | Obter metadados da entrevista | Path: `interviewId` UUID | `200` com objeto `interview` | `400` para UUID inválido; `404` ausente; `403` de outra conta |
| `GET /interviews/survey/:surveyId` | JWT | Listar entrevistas e respostas da pesquisa | Path: `surveyId` UUID; query: `page` e `limit`, inteiros mínimos 1, padrões 1 e 10 | `200` com `interviews`, `total`, `page`, `limit` | `400` para path/paginação inválidos; pesquisa ausente ou estrangeira produz coleção vazia |
| `DELETE /interviews/:id` | JWT | Excluir entrevista | Path: `id` | `204`, sem corpo | `404` ausente; `403` de outra conta; respostas são excluídas em cascata |

### 8.8 Respostas de entrevistas

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `POST /answer-questions` | JWT | Criar resposta individual | Corpo: `interviewId`, `questionId`, `optionAnswerId`, todos UUID | `201`, sem corpo | `400` para forma inválida; `404` para recurso ausente, estrangeiro ou incompatível; duplicidade entrevista/pergunta é rejeitada pelo banco e atualmente chega como `500` |
| `GET /answer-questions/:answerId` | JWT | Obter resposta | Path: `answerId` UUID | `200` com objeto `answer` | `400` para UUID inválido; `404` ausente; `403` de outra conta |
| `GET /answer-questions/interview/:interviewId` | JWT | Listar respostas de uma entrevista | Path: `interviewId` UUID | `200` com array ordenado por criação | `400` para UUID inválido; entrevista ausente, estrangeira ou sem respostas retorna `[]` |
| `PUT /answer-questions/:id` | JWT | Alterar opção e, opcionalmente, pergunta | Path: `id`; corpo: `optionAnswerId` obrigatório na prática, `questionId` opcional | `204`, sem corpo | `400` sem `optionAnswerId`; `404` para resposta/recurso ausente, estrangeiro ou incompatível; conflito de duplicidade pode chegar como `500` |
| `DELETE /answer-questions/:id` | JWT | Excluir resposta | Path: `id` | `204`, sem corpo | `404` ausente; `403` de outra conta |

### 8.9 Relatórios

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `GET /reports/simple/:surveyId` | JWT | Obter relatório simples | Path: `surveyId` | `200` JSON; `[]` sem entrevistas | `404` para pesquisa ausente/estrangeira; limite de conteúdo atualmente pode chegar como `500`; `429` por rate limit |
| `GET /reports/simple/:surveyId/download` | JWT | Baixar relatório simples DOCX | Path: `surveyId` | `200` DOCX como attachment | `404` para pesquisa ausente/estrangeira ou sem entrevistas; `400` para limites/validação; `429` por rate limit |
| `GET /reports/simple-pdf/:surveyId` | JWT | Baixar relatório simples PDF | Path: `surveyId` | `200` PDF como attachment | `404` ausente/estrangeira ou sem entrevistas; `400` limites; `429` rate/capacidade da conta; `503` capacidade global ou timeout |
| `GET /reports/cross/:surveyId` | JWT | Obter relatório cruzado | Path: `surveyId` | `200` JSON; `[]` sem entrevistas | `404` pesquisa ausente/estrangeira; `400` limites ou menos de duas perguntas; `429` rate limit |
| `GET /reports/cross/:surveyId/download` | JWT | Baixar relatório cruzado DOCX | Path: `surveyId` | `200` DOCX como attachment | `404` ausente/estrangeira ou sem entrevistas; `400` limites ou menos de duas perguntas; `429` rate limit |

Os nomes, tipos MIME, precisão e diferenças de conteúdo entre formatos estão detalhados na seção 7.

### 8.10 Observabilidade

| Método e rota | Acesso | Finalidade | Parâmetros e corpo principais | Sucesso | Validação e erros importantes |
| --- | --- | --- | --- | --- | --- |
| `GET /metrics` | Público | Expor contadores operacionais e de segurança | — | `200`, texto Prometheus `text/plain; version=0.0.4; charset=utf-8` | Sem validação de entrada; falha inesperada segue o tratamento global `500` |

Os contadores expostos são `login_failures_total`, `http_401_total`, `http_403_total`, `http_429_total`, `refresh_replay_total`, `report_generation_total`, `report_timeout_total`, `ssrf_block_total` e `http_5xx_total`.

## 9. Requisitos não funcionais

### 9.1 Plataforma e dependências de execução

O produto é uma API HTTP de backend implementada em Node.js, NestJS e TypeScript. O manifesto do projeto fixa o motor Node.js em `20.19.4`, declara NestJS `11.2.1` como dependência principal e TypeScript `5.7` como dependência de desenvolvimento. A instalação e a execução dos scripts usam pnpm, com versão declarada `10.14.0`.

A persistência usa PostgreSQL e Prisma. O cliente e o CLI do Prisma estão na linha `6.19.3`, e o schema declara o provider `postgresql`. A aplicação abre a conexão no início do módulo e a encerra no desligamento; o cliente registra somente avisos e erros do Prisma. Não há, neste repositório, requisito implementado de réplica de leitura, failover, SLA de disponibilidade, política de backup ou configuração própria de pool de conexões.

Outras dependências operacionais relevantes incluem Express como plataforma HTTP do NestJS, `bcryptjs` para senhas, Passport/JWT para autenticação, `@nestjs/throttler` para limitação de taxa, Zod para validação de ambiente, `docx` para documentos e Puppeteer/Chromium para renderização de PDF. Essas versões descrevem o estado do manifesto e do lockfile, não uma promessa de compatibilidade com versões futuras.

### 9.2 Inicialização e validação de ambiente

A aplicação deve validar o ambiente antes de criar o servidor NestJS. Configuração ausente, fora da faixa ou incoerente impede a inicialização. Valores secretos devem ser injetados pelo ambiente de execução e não pertencem a este documento nem ao repositório.

#### Variáveis necessárias

| Variável | Requisito implementado |
| --- | --- |
| `DATABASE_URL` | URL de conexão PostgreSQL válida, com `sslmode` coerente com `DATABASE_TLS_MODE`. |
| `DATABASE_TLS_MODE` | Deve ser `require` ou `disable`; embora não conste na verificação preliminar de nomes, é obrigatória no schema final. |
| `JWT_PRIVATE_KEY` | Chave privada RSA em PEM codificado em Base64. |
| `JWT_PUBLIC_KEY` | Chave pública RSA em PEM codificado em Base64, correspondente à privada. |
| `CORS_ORIGIN` | Uma ou mais origens explícitas, separadas por vírgula, conforme as regras da seção 9.4. |

#### Variáveis importantes com padrão ou caráter opcional

| Variável | Padrão | Regra ou finalidade |
| --- | ---: | --- |
| `NODE_ENV` | `development` | Aceita `development`, `test` ou `production`; ativa validações adicionais em produção. |
| `PORT` | `3333` | Porta de escuta do servidor HTTP. |
| `TRUST_PROXY_HOPS` | `0` | Quantidade de proxies confiáveis, inteira de 0 a 10. |
| `REQUIRE_HTTPS` | `false` | Ativa rejeição de requisições que não sejam reconhecidas como seguras. |
| `BCRYPT_COST` | `10` | Custo do bcrypt, inteiro de 10 a 14. |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` | Validade do access token, de 300 a 86.400 segundos. |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Validade da sessão/refresh token, de 1 a 90 dias. |
| `SESSION_CLEANUP_INTERVAL_MINUTES` | `60` | Intervalo de limpeza de sessões, de 1 a 1.440 minutos. |
| `SESSION_IP_HASH_SECRET` | sem padrão seguro | Segredo Base64 com ao menos 32 bytes aleatórios; obrigatório em produção. |
| `COMPROMISED_PASSWORD_SHA256` | lista vazia | Lista configurável de hashes SHA-256 usada na rejeição de senhas comprometidas. |
| `RATE_LIMIT_STORE` | `database` | Aceita `database` ou `memory`; produção proíbe `memory`. |
| `LOG_PSEUDONYM_KEY` | não integra o schema validado | Chave opcional usada para pseudonimização de campos de log; na ausência, o logger reutiliza `SESSION_IP_HASH_SECRET` e possui fallback apenas local. |
| `CHROMIUM_EXECUTABLE_PATH` | `/usr/bin/chromium` | Caminho do executável usado pelo renderer de PDF; o teste de integração do renderer exige configuração explícita. |

As variáveis de limites de taxa e proteção de relatórios são detalhadas nas seções 9.7 e 9.10. Os valores apresentados são padrões do código, não valores reais de qualquer ambiente implantado.

### 9.3 Limites fixos do transporte HTTP

O bootstrap desativa o body parser padrão e instala limites explícitos:

- corpos JSON: no máximo `100kb` segundo a interpretação do parser do Express;
- corpos `application/x-www-form-urlencoded`: no máximo `50kb`, com objetos estendidos habilitados.

Esses dois valores são constantes de código e não são configuráveis por variável de ambiente. Uma carga acima do limite é rejeitada pelo parser antes do controlador. A implementação não declara suporte a upload multipart de arquivos.

O cabeçalho de identificação do framework `X-Powered-By` permanece desabilitado. Todas as respostas atravessam middleware que define:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: no-referrer`;
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`.

Esses cabeçalhos são limites fixos da implementação atual, não opções de ambiente.

### 9.4 CORS, proxies confiáveis e HTTPS

`CORS_ORIGIN` funciona como allowlist exata. Pode conter várias origens separadas por vírgula, mas não aceita curingas, entradas vazias, credenciais embutidas, caminhos ou valores que não sejam apenas uma origem. Em produção, todas as origens devem usar HTTPS. Em desenvolvimento e teste, HTTP é permitido somente para `localhost`, `127.0.0.1` e `[::1]`; HTTPS continua permitido. Requisições sem cabeçalho `Origin`, como clientes servidor a servidor, são aceitas pela função CORS.

O CORS permite os métodos `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, os cabeçalhos de requisição `Authorization`, `Content-Type` e `X-Request-ID`, expõe `X-Request-ID` ao cliente e habilita credenciais. Isso não cria autenticação por cookie: os endpoints protegidos continuam usando Bearer JWT conforme a seção 6.

`TRUST_PROXY_HOPS` configura diretamente o número de saltos confiáveis do Express. Esse valor influencia `request.ip` e a percepção de `request.secure`; portanto, deve corresponder à topologia real para que identificação por IP, logs e HTTPS não confiem em cabeçalhos enviados diretamente por clientes.

Quando `REQUIRE_HTTPS=true`, a configuração exige ao menos um proxy confiável. Requisições não reconhecidas como HTTPS retornam HTTP `426` com `HTTPS is required`. Requisições seguras recebem `Strict-Transport-Security: max-age=31536000; includeSubDomains`. Com o padrão `false`, a aplicação não força HTTPS nem emite esse HSTS por conta própria; a terminação e imposição de TLS podem ficar a cargo da infraestrutura.

### 9.5 Segurança da conexão de banco de dados

`DATABASE_TLS_MODE=require` exige que `DATABASE_URL` declare `sslmode=require`, `verify-ca` ou `verify-full`. `DATABASE_TLS_MODE=disable` exige `sslmode=disable` explícito. Em `NODE_ENV=production`, somente o modo `require` é aceito, de modo que a aplicação não inicializa com TLS de banco desativado.

O modo `require` garante a solicitação de transporte TLS conforme a URL fornecida; a validação da aplicação também admite os modos mais estritos `verify-ca` e `verify-full`. A escolha entre eles e o fornecimento de autoridades certificadoras pertencem à implantação. Credenciais e URLs reais não devem aparecer no PRD, em logs ou em imagens de contêiner.

### 9.6 Criptografia e parâmetros de autenticação

As duas chaves JWT devem ser chaves RSA correspondentes, em PEM codificado em Base64, com módulo de pelo menos 2.048 bits. A aplicação deriva a chave pública da privada e compara as duas durante a inicialização; pares inválidos ou incompatíveis impedem o processo de subir. Access tokens são assinados com RS256 e obedecem aos claims, emissor, audiência e expiração definidos na seção 6.1.

O custo de hash bcrypt é configurável por `BCRYPT_COST`, com padrão 10 e faixa rígida aceita de 10 a 14. A faixa é validação de inicialização; o padrão não deve ser confundido com limite imutável. As regras de senha comprometida, refresh token, sessão e pseudonimização de IP estão nas seções 4.1, 5.1 a 5.4 e 6.

### 9.7 Limitação de taxa

O armazenamento padrão dos buckets é PostgreSQL. Cada incremento ocorre em transação e usa advisory lock por chave, oferecendo decisão atômica e estado compartilhado entre réplicas da aplicação. `RATE_LIMIT_STORE=memory` seleciona o armazenamento em memória do framework, apropriado apenas para execução não produtiva: seus contadores são locais ao processo, desaparecem em reinícios e não coordenam réplicas. A validação proíbe essa opção em produção.

Os padrões configuráveis são:

| Fluxo e chave | Máximo padrão | Janela e bloqueio padrão | Faixas aceitas |
| --- | ---: | ---: | --- |
| Login por IP | 20 | 900 s | máximo 1–1.000; janela 1–86.400 s |
| Login por IP + hash do e-mail normalizado | 5 | 900 s | máximo 1–1.000; janela 1–86.400 s |
| Cadastro por IP | 5 | 3.600 s | máximo 1–1.000; janela 1–86.400 s |
| Refresh por IP | 30 | 60 s | máximo 1–1.000; janela 1–86.400 s |
| Refresh por hash do identificador de sessão extraído do token | 10 | 60 s | máximo 1–1.000; janela 1–86.400 s |
| Relatórios por `sub` autenticado, com fallback para IP | 10 | 60 s | máximo 1–1.000; janela 1–86.400 s |

Ao exceder um limite, o bloqueio dura a mesma janela, a API responde HTTP `429`, usa a mensagem comum de excesso de requisições e informa `Retry-After`. Os nomes das variáveis são `LOGIN_RATE_LIMIT_IP_MAX`, `LOGIN_RATE_LIMIT_IDENTIFIER_MAX`, `LOGIN_RATE_LIMIT_WINDOW_SECONDS`, `REGISTER_RATE_LIMIT_IP_MAX`, `REGISTER_RATE_LIMIT_WINDOW_SECONDS`, `REFRESH_RATE_LIMIT_IP_MAX`, `REFRESH_RATE_LIMIT_SESSION_MAX`, `REFRESH_RATE_LIMIT_WINDOW_SECONDS`, `REPORT_RATE_LIMIT_USER_MAX` e `REPORT_RATE_LIMIT_WINDOW_SECONDS`.

Os detalhes de aplicação às rotas de autenticação estão na seção 6.3. A sobreposição atualmente existente entre limitadores de relatório e refresh está registrada na seção 7.11 e não deve ser interpretada como um modelo idealizado distinto do código.

### 9.8 Correlação, eventos estruturados e métricas

Cada requisição recebe um identificador de correlação. Um `X-Request-ID` fornecido pelo cliente é preservado somente se tiver de 1 a 128 caracteres alfanuméricos ou `.`, `_` e `-`; caso contrário, a aplicação gera um UUID. O valor é devolvido em `X-Request-ID`, propagado no contexto assíncrono e incluído nos registros estruturados. A URL registrada exclui a query string.

Eventos operacionais e de auditoria são emitidos em stdout como uma linha JSON por evento. Os campos comuns incluem timestamp, categoria, código do evento, request ID, método, caminho e identificadores pseudonimizados quando disponíveis. A implementação registra conclusão e erro HTTP, sucessos e falhas de autenticação, throttling, rotação/reuso de refresh, logout e revogação, negações de autorização, alterações de conta e pesquisa, além do ciclo, timeout, falta de capacidade e bloqueios do renderer de relatórios.

O logger remove campos cujos nomes indiquem senha, tokens, autorização, cookies, chaves JWT ou URL do banco e redige padrões Bearer e credenciais PostgreSQL encontrados em textos. Identificadores pseudonimizados usam HMAC-SHA-256 truncado; isso reduz exposição direta, mas a gestão e rotação das chaves de pseudonimização continuam sendo responsabilidade da implantação.

As métricas de segurança implementadas são contadores no processo:

- `login_failures_total`;
- `http_401_total`, `http_403_total`, `http_429_total` e `http_5xx_total`;
- `refresh_replay_total`;
- `report_generation_total` e `report_timeout_total`;
- `ssrf_block_total`.

`GET /metrics` é público e responde no formato texto Prometheus `0.0.4`, conforme o catálogo da seção 8.10. Não há autenticação, allowlist própria ou agregação persistente nesse endpoint. Os contadores reiniciam com o processo e não são compartilhados entre réplicas. Quando a exposição pública direta não for desejada, a restrição de rede deve ser aplicada pela infraestrutura; tal restrição não está implementada nesta API.

### 9.9 Tratamento e observabilidade de erros HTTP

O interceptor global mede a duração das requisições, registra o status de conclusões e erros e incrementa os contadores de status relevantes. Falhas `401` e `403` geram ainda evento de auditoria de autorização; falhas de relatório geram evento específico. O filtro global cobre erros que escapem do interceptor e evita dupla contabilização quando o interceptor já os registrou.

Esses mecanismos fornecem rastreabilidade técnica, mas não constituem, por si sós, monitoramento externo, retenção de logs, alertas, tracing distribuído ou garantia de disponibilidade. O repositório não define backend de logs, scraper Prometheus, dashboards ou política de retenção.

### 9.10 Capacidade e proteção de relatórios

Os controles de relatório são configuráveis dentro de faixas rígidas aceitas na inicialização:

| Variável | Padrão | Faixa aceita |
| --- | ---: | ---: |
| `REPORT_MAX_INTERVIEWS` | 1.000 | 1–100.000 |
| `REPORT_MAX_QUESTIONS` | 100 | 1–1.000 |
| `REPORT_MAX_OPTIONS_PER_QUESTION` | 100 | 1–1.000 |
| `REPORT_MAX_TEXT_LENGTH` | 5.000 caracteres | 1–100.000 |
| `REPORT_MAX_DOCUMENT_BYTES` | 20 MiB | 1.024 bytes–1 GiB |
| `REPORT_TIMEOUT_MS` | 30.000 ms | 1.000–300.000 ms |
| `REPORT_PDF_USER_CONCURRENCY` | 1 | 1–8 |
| `REPORT_PDF_GLOBAL_CONCURRENCY` | 2 | 1–32 |

O limite de concorrência por conta não pode exceder o global. Leases de renderização persistidos no PostgreSQL e um advisory lock global coordenam capacidade de PDF entre réplicas; leases expirados são removidos durante uma nova tentativa de aquisição. O prazo do lease é o timeout configurado acrescido de 30 segundos. A operação libera o lease em sucesso ou falha tratada, e o timeout tenta abortar o Chromium sem atrasar indefinidamente a resposta.

O renderer bloqueia requisições de rede durante a produção de PDF e registra/incrementa evento e métrica quando ocorre tentativa bloqueada, reduzindo a superfície de SSRF. O caminho do Chromium é configurável como descrito na seção 9.2. Os efeitos exatos de limites, diferenças entre formatos, erros de capacidade e alcance do timeout estão nas seções 7.9 a 7.13; em especial, timeout e concorrência são aplicados atualmente somente ao PDF simples.

### 9.11 Comandos de qualidade, build, migração e segurança

Os scripts mantidos no manifesto são:

| Finalidade | Comando | Comportamento |
| --- | --- | --- |
| Lint | `pnpm lint` | Executa ESLint nos fontes e testes; `pnpm lint:fix` aplica correções. |
| Formatação | `pnpm format` | Reescreve arquivos TypeScript de `src` e `test` com Prettier. |
| Tipagem | `pnpm typecheck` | Executa `tsc --noEmit` para as configurações de build e testes. |
| Testes unitários | `pnpm test` | Executa Vitest uma vez; há variantes `test:watch` e `test:coverage`. |
| Testes E2E | `pnpm test:e2e` | Executa Vitest com a configuração E2E; há variante watch. |
| Integração do renderer | `pnpm test:renderer:integration` | Executa a suíte específica que depende de um Chromium configurado. |
| Build | `pnpm build` | Compila a aplicação com Nest CLI. |
| Execução de produção | `pnpm start:prod` | Executa `node dist/main` após o build. |
| Prisma | `pnpm prisma:generate` / `pnpm prisma:validate` | Gera o cliente ou valida o schema. |
| Migração | `pnpm prisma:migrate` | Executa `prisma migrate dev`; o repositório não declara script separado de deploy de migrações. |
| Auditoria | `pnpm security:audit` | Audita dependências de produção e falha a partir de severidade alta. |
| Pipeline de segurança | `pnpm security:ci` | Encadeia lint, type-check, build, testes unitários, validação Prisma e auditoria. |

Há ainda scripts de desenvolvimento para inicialização normal, watch e debug. O pipeline `security:ci` não inclui os testes E2E nem o teste de integração do renderer; sua execução deve ser planejada separadamente quando esses níveis de validação forem necessários.

### 9.12 Premissas de implantação observáveis no Docker

O repositório contém Compose para o PostgreSQL, mas não contém Dockerfile da aplicação. O serviço de banco usa imagem PostgreSQL 17.11 baseada em Bookworm, fixada também por digest, exige `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`, persiste dados no volume nomeado `postgres_data` e possui política `restart: unless-stopped`.

O Compose base não publica a porta do banco no host. O override de desenvolvimento publica a porta `5432` do contêiner somente em `127.0.0.1`, usando `POSTGRES_DEV_PORT` com padrão `5433`. Logo, a configuração fornecida assume acesso local restrito no desenvolvimento e não expõe PostgreSQL em todas as interfaces.

Como não há contêiner da API, proxy reverso, terminador TLS, coletor de métricas ou rotina de migração no Compose, a implantação desses componentes é externa ao artefato Docker atual. A execução deve fornecer Node.js/pnpm compatíveis, build da aplicação, `DATABASE_URL`, chaves e demais variáveis validadas, conectividade com PostgreSQL e Chromium quando PDF for usado. O Compose não implementa backup, health check, alta disponibilidade ou aplicação automática de migrações.

### 9.13 Padrões configuráveis versus limites fixos

Para evitar interpretar valores iniciais como garantias imutáveis:

- são **padrões configuráveis**: porta, custo bcrypt, TTLs, limpeza de sessão, número de proxies, imposição HTTPS, armazenamento e janelas/máximos de rate limiting, limites de volume de relatório, timeout e concorrência de PDF;
- são **faixas rígidas de configuração**: mínimos e máximos aceitos pelo schema para os itens anteriores, incluindo RSA de ao menos 2.048 bits e segredo de pseudonimização de IP com ao menos 32 bytes em produção;
- são **limites fixos no código**: corpo JSON de `100kb`, corpo URL-encoded de `50kb`, sintaxe e tamanho máximo de 128 caracteres do request ID, allowlist de métodos/cabeçalhos CORS, cabeçalhos defensivos, ausência de wildcard CORS e duração HSTS de um ano quando HTTPS é imposto;
- são **restrições obrigatórias de produção**: TLS para PostgreSQL, origens CORS HTTPS, `SESSION_IP_HASH_SECRET` válido e rate limiting compartilhado em banco;
- não há requisito implementado de tempo de resposta geral, throughput, uptime, retenção de logs, recuperação de desastre ou escalabilidade automática. O único timeout funcional explícito de relatório é o do PDF simples descrito anteriormente.

## 10. Limitações

Esta seção registra limitações e riscos deduzidos exclusivamente do comportamento observável no repositório. A coluna “Decisão futura” contém questões ou recomendações para avaliação e **não descreve requisito implementado, compromisso de roadmap nem funcionalidade aprovada**.

### 10.1 Registro de limitações e riscos de produto

| ID | Tema | Comportamento atual observável | Impacto de produto ou operacional | Decisão futura — não implementada |
| --- | --- | --- | --- | --- |
| LIM-01 | Backend sem frontend | O repositório contém uma API backend; não contém interface web ou móvel, páginas públicas, formulários ou construtor visual. | A experiência de criação, coleta e análise depende de um cliente externo. A API isoladamente não oferece uma jornada visual para operadores ou participantes. | Decidir se uma interface oficial fará parte do produto e, em caso positivo, definir seu escopo e repositório sem tratá-la como existente antes da implementação. |
| LIM-02 | Papéis sem políticas específicas | `USER` e `ADMIN` existem no modelo e o papel vigente é consultado durante a autenticação, mas nenhum controlador declara restrição específica com `@Roles(...)`. | Na superfície atual, possuir `ADMIN` não habilita fluxos adicionais e possuir `USER` não bloqueia uma rota por papel; a distinção pode sugerir uma capacidade administrativa inexistente. | Decidir se os papéis devem permanecer apenas como dado preparatório ou se haverá uma matriz explícita de autorização e endpoints administrativos. |
| LIM-03 | Gestão de regras condicionais | Não existem endpoints dedicados para criar, consultar, editar ou excluir `ConditionalRule`. Regras são criadas com a pesquisa completa ou com uma pergunta individual e aparecem no detalhe da pesquisa. | Correções isoladas em uma regra podem exigir alterar ou remover recursos relacionados; clientes não dispõem de um ciclo CRUD próprio para essa entidade. | Decidir se regras condicionais precisam de API dedicada ou se continuarão subordinadas ao ciclo de criação e exclusão de perguntas. |
| LIM-04 | Condições não executadas na coleta | Criação e atualização de entrevistas/respostas não consultam `ConditionalRule`; respostas são aceitas sem avaliar visibilidade ou satisfação da condição. | Um cliente pode gravar respostas para perguntas cuja condição não foi satisfeita. A coerência da navegação condicional depende integralmente do cliente externo. | Decidir se as condições serão apenas metadados de apresentação ou também regras de validação do backend, incluindo o tratamento de respostas já existentes. |
| LIM-05 | Criação parcial de entrevista | O controlador persiste a entrevista e depois cria as respostas concorrentes em operações separadas, sem uma transação única nem rollback compensatório. | Se uma resposta falhar, a requisição pode retornar erro deixando a entrevista e possivelmente parte das respostas persistidas. Repetir a chamada pode criar outra entrevista em vez de completar a anterior. | Avaliar uma transação atômica para entrevista e respostas, ou definir idempotência e recuperação explícita de estados parciais. |
| LIM-06 | Rigor de validação desigual | A criação completa aplica `trim`, rejeita textos vazios, exige inteiros positivos, impede números duplicados e autodependência. Endpoints individuais são menos estritos e, em alguns casos, validam apenas tipo ou valor truthy. | Dados aceitos por um caminho podem ser rejeitados por outro; números negativos, fracionários ou duplicados podem entrar por operações individuais e tornar ordenação e referências ambíguas. | Definir se a política de validação deve ser unificada e qual caminho representa a regra desejada para dados existentes e novos. |
| LIM-07 | Regras condicionais podem ficar dessincronizadas | `ConditionalRule` armazena UUIDs e também números de pergunta/opção. Alterar números posteriormente não atualiza nem revalida os números registrados nas regras; regras idênticas também não têm verificação de duplicidade. | O detalhe pode apresentar referências numéricas defasadas, especialmente após renumeração, e múltiplas regras equivalentes podem coexistir. | Decidir se os números devem ser derivados das relações, sincronizados transacionalmente ou mantidos imutáveis; avaliar também uma regra de unicidade para condições. |
| LIM-08 | Exclusões com relações restritivas | Regras condicionais usam exclusão restritiva. Os fluxos individuais limpam regras relacionadas, mas a exclusão da pesquisa não as remove explicitamente; opções usadas por respostas também são restritas. | A exclusão de uma pesquisa com regras, ou de uma opção já respondida, pode falhar no banco apesar de outras relações possuírem cascata. | Definir a política desejada de retenção e cascata e se a API deve limpar dependências, impedir a ação com erro de domínio explícito ou exigir uma etapa prévia. |
| LIM-09 | Mapeamento HTTP inconsistente | Recursos de outra conta podem resultar em `403`, `404` ou lista vazia conforme o endpoint. Duplicidade de resposta, conflito ao mover resposta e certos erros de persistência chegam como `500`. Limite excedido no relatório simples JSON também chega como `500`, enquanto outros relatórios retornam `400`. | Clientes precisam tratar condições conceitualmente semelhantes de formas diferentes; `500` pode sinalizar falsamente indisponibilidade para um conflito ou erro de entrada conhecido. | Definir uma política comum para ocultação de recursos, conflitos e validação e mapear erros de domínio/persistência de forma consistente. |
| LIM-10 | Listagens vazias ambíguas | A listagem de entrevistas por pesquisa e a listagem de respostas por entrevista não validam separadamente o recurso pai; pai inexistente, pertencente a outra conta ou simplesmente sem filhos pode produzir `200` vazio. | O cliente não consegue distinguir “não existe”, “sem acesso” e “sem resultados” apenas pela resposta da listagem. | Decidir se a ambiguidade é deliberada para ocultação de recursos ou se o pai deve ser validado com semântica uniforme. |
| LIM-11 | Entrevistas incompletas | Uma entrevista pode ser criada com `answers: []`; não há exigência de resposta para todas as perguntas nem categoria persistida para “sem resposta”. | A completude depende do cliente e resultados podem somar menos de 100%, pois todas as entrevistas permanecem no denominador. | Decidir se entrevistas precisam de estado de rascunho/conclusão, requisitos mínimos de resposta ou representação explícita de ausência. |
| LIM-12 | Sem entrevistas nos relatórios | Relatórios simples e cruzados em JSON retornam `200` com `[]`; downloads DOCX e o PDF simples retornam `404`. | O mesmo estado de dados tem semântica HTTP diferente conforme o formato, exigindo tratamento específico no cliente e podendo confundir “relatório vazio” com recurso ausente. | Escolher se todos os formatos devem retornar resultado vazio, erro de negócio uniforme ou manter a distinção atual de forma contratual. |
| LIM-13 | Precisão percentual por formato | JSON simples e cruzado calculam duas casas; DOCX e PDF simples e DOCX cruzado calculam uma. DOCX simples exibe duas casas apesar de ter arredondado para uma, e PDF não completa zeros. | O mesmo conjunto de respostas pode apresentar números ou aparência diferentes entre API, DOCX e PDF; comparações automáticas podem divergir por arredondamento. | Definir uma única precisão de cálculo e política de exibição, ou declarar formalmente a diferença como característica permanente de cada formato. |
| LIM-14 | Denominador e perguntas condicionais nos relatórios | Todos os relatórios usam o total de entrevistas como denominador e não distinguem pergunta não respondida, omitida ou pulada por condição. | Percentuais podem somar menos de 100% e não expressam taxa de resposta nem universo elegível da pergunta. | Decidir a semântica estatística desejada: todas as entrevistas, somente respostas válidas, população elegível pela condição ou categorias explícitas de ausência. |
| LIM-15 | Conteúdo e ordenação variam por formato | O simples mostra apenas perguntas/opções observadas; o cruzado inclui combinações sem ocorrência. JSON simples ordena perguntas por número, enquanto DOCX/PDF simples usam ordem de descoberta. Contagens não são expostas em nenhum formato. | Consumidores podem interpretar formatos como equivalentes quando o conteúdo e a ordem não são idênticos; auditoria do percentual sem contagem requer acesso aos dados brutos. | Definir se os formatos devem compartilhar um modelo canônico, uma ordenação comum e contagens explícitas. |
| LIM-16 | Limites de volume de relatório | Relatórios são rejeitados quando excedem limites configurados de entrevistas, perguntas, opções, texto ou documento. O tamanho do documento só é conhecido e validado depois da geração; JSON não tem limite de bytes equivalente. | Pesquisas grandes podem não gerar relatório, e DOCX/PDF podem consumir CPU e memória antes de serem rejeitados pelo tamanho final. | Definir dimensionamento suportado, estratégia para grandes volumes e eventual geração assíncrona, streaming ou pré-estimativa de tamanho. |
| LIM-17 | Capacidade e timeout de PDF | Apenas o PDF simples usa timeout e leases distribuídos. Os padrões permitem um PDF simultâneo por conta e dois globalmente; falta de capacidade retorna `429` ou `503`. DOCX e JSON não usam proteção equivalente. | Picos de renderização podem rejeitar downloads; operações DOCX/JSON custosas não têm o mesmo isolamento ou timeout explícito. A disponibilidade do PDF depende também do Chromium. | Validar limites por carga real e decidir se filas, processamento assíncrono ou proteções equivalentes devem abranger outros formatos. |
| LIM-18 | Sobreposição de rate limits de relatório | Rotas de relatório aplicam o limitador próprio, mas não desabilitam os limitadores de refresh. Na ausência de refresh token, requisições compartilham a chave derivada `invalid`. | Um relatório pode receber `429` por um bucket não correspondente à intenção aparente de “por usuário”, e tráfego distinto pode competir no bucket de refresh por sessão inválida. | Revisar quais throttlers devem atuar em cada rota e documentar ou eliminar deliberadamente a sobreposição. |
| LIM-19 | Métricas públicas e locais | `GET /metrics` é público, sem autenticação ou allowlist da aplicação. Os contadores vivem em memória, reiniciam com o processo e não são agregados entre réplicas. | A telemetria pode ser acessível a qualquer cliente que alcance a API; reinícios e múltiplas réplicas fragmentam a visão operacional. | Decidir se a exposição deve ser restringida na aplicação ou rede e se haverá coleta externa, agregação, persistência e retenção. |
| LIM-20 | Implantação incompleta no repositório | O Compose fornece somente PostgreSQL. Não há Dockerfile da API, proxy TLS, health check, rotina de backup, alta disponibilidade, coletor de métricas nem script separado de deploy de migrações. | Uma implantação produtiva exige decisões e componentes externos não padronizados neste repositório; `prisma:migrate` executa o fluxo de desenvolvimento. | Definir e versionar o modelo de implantação, health checks, migração de produção, backup, recuperação e observabilidade externa. |
| LIM-21 | Garantias operacionais não definidas | Não há requisito implementado de SLA, latência geral, throughput, retenção de logs, recuperação de desastre ou escalabilidade automática. | Capacidade e confiabilidade fora da proteção específica de relatórios não possuem metas verificáveis neste PRD. | Estabelecer SLOs e políticas operacionais somente após medição e decisão de produto/infraestrutura. |
| LIM-22 | Funcionalidades de identidade ausentes | Não existem recuperação de senha, verificação de e-mail, MFA nem listagem de sessões. | Uma pessoa que perde a senha não possui recuperação pela API; não há comprovação de posse do e-mail, segundo fator ou visão das sessões ativas. | Avaliar necessidade, prioridade e requisitos de segurança desses fluxos sem presumir que já estejam disponíveis. |
| LIM-23 | Participação e colaboração ausentes | Não há participação anônima, links públicos, identidade de participante, compartilhamento, equipes, convites ou transferência de propriedade. | Coleta e administração ficam restritas à conta autenticada proprietária e a clientes que operem suas credenciais; não há colaboração nativa. | Confirmar se o modelo de conta única continuará sendo a fronteira do produto ou se futuros casos de uso exigirão participantes e colaboração. |

### 10.2 Leitura dos riscos

Os itens acima não significam necessariamente defeitos: alguns podem ser escolhas deliberadas de escopo, segurança ou capacidade. Eles se tornam riscos quando consumidores presumem comportamento uniforme, atomicidade, recursos de interface ou garantias operacionais que a implementação não oferece. Até que uma decisão futura seja implementada e testada, prevalece o comportamento atual descrito na terceira coluna.

## 11. Questões em aberto

As questões abaixo consolidam decisões ainda não tomadas neste documento. Elas são referências para descoberta e priorização; **não são requisitos aprovados e não alteram o comportamento implementado**.

### 11.1 Produto e autorização

1. O produto permanecerá exclusivamente como API ou deverá possuir uma interface oficial para autoria, coleta e análise? (`LIM-01`)
2. `ADMIN` terá capacidades concretas distintas de `USER`? Em caso positivo, qual será a matriz de permissões e como evitar acesso cruzado indevido? (`LIM-02`)
3. Regras condicionais continuarão como metadados estruturais ou serão avaliadas pelo backend durante coleta e relatórios? (`LIM-03`, `LIM-04`, `LIM-14`)
4. O produto continuará limitado a uma conta proprietária ou precisará de participantes públicos, organizações, colaboração e transferência de propriedade? (`LIM-23`)
5. Recuperação de senha, verificação de e-mail, MFA e consulta de sessões são necessárias para o contexto de uso pretendido? (`LIM-22`)

### 11.2 Integridade e contratos da API

1. A criação de entrevista com respostas deve ser atômica, idempotente ou oferecer recuperação explícita de resultados parciais? (`LIM-05`)
2. Qual política única de validação deve valer para criação completa e endpoints individuais, inclusive para números duplicados, positivos e inteiros? (`LIM-06`)
3. Como manter coerência entre UUIDs e números armazenados em regras condicionais após renumeração, e regras idênticas devem ser proibidas? (`LIM-07`)
4. Qual deve ser a semântica de exclusão de pesquisa, pergunta e opção diante de regras condicionais e respostas existentes? (`LIM-08`)
5. A API deve padronizar `400`, `403`, `404`, `409` e `500` para validação, titularidade, ausência e conflitos? Listagens devem distinguir pai ausente de coleção vazia? (`LIM-09`, `LIM-10`)
6. Uma entrevista precisa representar estado de conclusão e exigir respostas mínimas, ou a incompletude continuará válida? (`LIM-11`)

### 11.3 Relatórios

1. O estado “sem entrevistas” deve ter a mesma resposta HTTP em JSON e downloads? (`LIM-12`)
2. Percentuais devem usar qual precisão, formatação e denominador? Ausências e saltos condicionais devem aparecer como categorias próprias? (`LIM-13`, `LIM-14`)
3. JSON, DOCX e PDF devem usar o mesmo conjunto e ordenação de perguntas/opções e expor contagens além dos percentuais? (`LIM-15`)
4. Quais volumes devem ser suportados e quais formatos precisam de timeout, concorrência, fila, streaming ou geração assíncrona? (`LIM-16`, `LIM-17`)
5. Os limitadores aplicados a relatórios devem ser isolados dos buckets de refresh? (`LIM-18`)

### 11.4 Operação e implantação

1. `/metrics` deve continuar público na aplicação, ser autenticado ou ficar acessível somente por controle de rede? Como agregar contadores de múltiplas réplicas e reinícios? (`LIM-19`)
2. Qual será o processo produtivo de empacotamento da API, execução de migrações, health checks, backup e recuperação? (`LIM-20`)
3. Quais SLOs de disponibilidade, latência, capacidade e recuperação devem ser medidos e adotados? (`LIM-21`)

Responder a uma questão não modifica o sistema automaticamente. Uma decisão só passa a constituir requisito implementado depois de refletida no código, no schema quando aplicável, nos testes e neste PRD.

## 12. Critérios de aceitação

> A preencher com critérios objetivos para validar os requisitos documentados contra o sistema atualmente implementado.
