# Resolver Problema 3: Prevenir Regras Condicionais Órfãs

## Passos para Implementação

1. **Adicionar métodos no repositório QuestionRepository para deletar regras condicionais em lote**
   - `deleteConditionalRulesByQuestionId(questionId: string): Promise<void>`
   - `deleteConditionalRulesByDependsOnQuestionId(dependsOnQuestionId: string): Promise<void>`

2. **Adicionar método no repositório OptionAnswerRepository**
   - `deleteConditionalRulesByDependsOnOptionId(dependsOnOptionId: string): Promise<void>`

3. **Modificar DeleteQuestionUseCase**
   - Antes de deletar a pergunta, deletar regras onde `questionId` ou `dependsOnQuestionId` é a pergunta sendo deletada.

4. **Modificar DeleteOptionAnswerUseCase**
   - Antes de deletar a opção, deletar regras onde `dependsOnOptionId` é a opção sendo deletada.

5. **Implementar os métodos no PrismaQuestionRepository e PrismaOptionAnswerRepository**
   - Usar `deleteMany` do Prisma para remover as regras.

6. **Testar as mudanças**
   - Verificar se ao deletar pergunta/opção, as regras relacionadas são removidas.
