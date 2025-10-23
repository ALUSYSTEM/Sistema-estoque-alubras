# 📊 Formato da Planilha para Importação

## 📋 Importação de Movimentações

### Colunas Necessárias (14 colunas exatas):
| Coluna | Obrigatória | Descrição | Exemplo |
|--------|-------------|-----------|---------|
| **DATA** | ✅ | Data da movimentação | 2025-10-20 ou 20/10/2025 |
| **CÓDIGO** | ✅ | Código do produto no sistema | PROD001 |
| **DESCRIÇÃO** | ❌ | Descrição do produto (opcional) | Produto Exemplo |
| **VARIANTE** | ❌ | Variante do produto (opcional) | Cor Azul |
| **TAMANHO** | ❌ | Tamanho do produto (opcional) | Grande |
| **LOTE** | ❌ | Número do lote (opcional) | LOTE2025-001 |
| **DATA DE VENCIMENTO** | ❌ | Data de vencimento (opcional) | 2025-12-31 |
| **QUANTIDADE** | ✅ | Quantidade movimentada | 100.50 |
| **ENTRADA/SAÍDA** | ✅ | ENTRADA ou SAIDA | ENTRADA |
| **TIPO** | ❌ | Tipo de movimento (opcional) | Compra, Venda, Produção |
| **PROJETO** | ❌ | Código do projeto (opcional) | PROJ001 |
| **LOCALIZAÇÃO** | ✅ | Código da localização | LOC001 |
| **LIB** | ❌ | Liberado (Sim/Não) (opcional) | Sim |
| **DESTINO** | ❌ | Destino da movimentação (opcional) | Estoque Principal |

### Exemplo de Planilha:
```
DATA        | CÓDIGO  | DESCRIÇÃO        | VARIANTE  | TAMANHO | LOTE        | DATA DE VENCIMENTO | QUANTIDADE | ENTRADA/SAÍDA | TIPO     | PROJETO | LOCALIZAÇÃO | LIB | DESTINO
2025-10-20  | PROD001 | Produto Exemplo  | Cor Azul  | Grande  | LOTE001     | 2025-12-31        | 100.50     | ENTRADA       | Compra   | PROJ001 | LOC001      | Sim | Estoque Principal
2025-10-20  | PROD002 | Produto Exemplo2 | Cor Verm  | Médio   | LOTE002     | 2025-06-30        | 25.00      | SAIDA         | Produção | PROJ002 | LOC002      | Não | Linha de Produção
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
