---
description: Complete state migration to Zustand with full persistence and cleanup
---
// turbo-all

# Migração Completa para Zustand

Execute TODOS os passos abaixo até conclusão, sem parar:

## Fase 1: Análise do useAppStore
1. Verifique a estrutura atual do `stores/useAppStore.js`
2. Compare com os dados mock em `mockData.js`
3. Identifique gaps entre o store e o que os componentes precisam

## Fase 2: Migrar Componentes (um por um)
Para CADA arquivo abaixo, faça:
- Remova useState com mock data
- Importe hooks do useAppStore (useRecipes, useIngredients, etc)
- Use as actions do store (addRecipe, updateRecipe, etc)
- Remova comentários "STATIC PROTOTYPE"
- Verifique que o build funciona após cada arquivo

Arquivos:
1. Inventory.jsx → useIngredients
2. Recipes.jsx → useRecipes  
3. Costs.jsx → useExpenses
4. Suppliers.jsx → useSuppliers
5. FichaTecnica.jsx → useRecipes + useIngredients
6. Production.jsx → useRecipes
7. Products.jsx → useProducts
8. AI.jsx → useIngredients + useSuppliers
9. Kanban.jsx → (verificar se precisa de store)

## Fase 3: Limpeza Final
1. Remova imports não utilizados de mockData
2. Remova arquivo mockData.js se não for mais usado (ou mova para seeds)
3. Verifique que não há código morto restante
4. Execute grep para encontrar "STATIC PROTOTYPE" - deve retornar 0 resultados

## Fase 4: Verificação
1. Teste o servidor (HTTP 200)
2. Abra o app no browser e:
   - Adicione um item no Inventory
   - Recarregue a página
   - Confirme que o item persiste
3. Capture screenshot de prova

## Fase 5: Documentação
1. Atualize walkthrough.md com resultados
2. Atualize task.md marcando itens como completos

IMPORTANTE: Só pare quando TODAS as fases estiverem 100% completas.
