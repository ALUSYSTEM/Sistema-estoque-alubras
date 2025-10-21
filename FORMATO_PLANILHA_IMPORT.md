# 📊 Formato da Planilha para Importação

## 📋 Importação de Movimentações

### Colunas Necessárias:
| Coluna | Obrigatória | Descrição | Exemplo |
|--------|-------------|-----------|---------|
| **Data** | ✅ | Data da movimentação | 2025-10-20 ou 20/10/2025 |
| **Tipo** | ✅ | ENTRADA ou SAIDA | ENTRADA |
| **Código do Produto** | ✅ | Código do produto no sistema | PROD001 |
| **Quantidade** | ✅ | Quantidade movimentada | 100.50 |
| **Localização** | ✅ | Código da localização | LOC001 |
| **Projeto** | ❌ | Código do projeto (opcional) | PROJ001 |
| **Lote** | ❌ | Número do lote (opcional) | LOTE2025-001 |
| **Observações** | ❌ | Observações (opcional) | Entrada de compra |

### Exemplo de Planilha:
```
Data        | Tipo    | Código do Produto | Quantidade | Localização | Projeto | Lote          | Observações
2025-10-20  | ENTRADA | PROD001          | 100.50     | LOC001      | PROJ001 | LOTE2025-001  | Entrada de compra
2025-10-20  | SAIDA   | PROD002          | 25.00      | LOC002      |         |               | Saída para produção
```

---

## 🔧 Importação de Beneficiamentos

### Colunas Necessárias:
| Coluna | Obrigatória | Descrição | Exemplo |
|--------|-------------|-----------|---------|
| **Data** | ✅ | Data do beneficiamento | 2025-10-20 ou 20/10/2025 |
| **Código do Produto** | ✅ | Código do produto no sistema | PROD001 |
| **Quantidade** | ✅ | Quantidade para beneficiamento | 50.00 |
| **Tipo de Beneficiamento** | ✅ | Tipo de processamento | Corte, Solda, Pintura |
| **Observações** | ❌ | Observações (opcional) | Beneficiamento urgente |

### Exemplo de Planilha:
```
Data        | Código do Produto | Quantidade | Tipo de Beneficiamento | Observações
2025-10-20  | PROD001          | 50.00      | Corte                  | Beneficiamento urgente
2025-10-20  | PROD002          | 25.00      | Solda                  | Peças para montagem
```

---

## ⚠️ **Importante:**

1. **Primeira linha** da planilha deve conter os cabeçalhos das colunas
2. **Códigos** de produtos, localizações e projetos devem existir no sistema
3. **Datas** podem estar em formato brasileiro (DD/MM/AAAA) ou ISO (AAAA-MM-DD)
4. **Quantidades** devem ser números (use ponto como separador decimal)
5. **Colunas opcionais** podem estar vazias

## 🚨 **Dicas:**

- Salve o arquivo como **Excel (.xlsx)** ou **Excel 97-2003 (.xls)**
- Use a primeira planilha (aba) do arquivo
- Evite células mescladas
- Certifique-se que os códigos existem no sistema antes de importar
