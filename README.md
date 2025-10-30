# Sistema de Controle de Estoque - Firebase

Sistema completo de controle de estoque desenvolvido em HTML, CSS, JavaScript com integração Firebase para comunicação em tempo real.

## 🚀 Funcionalidades

### ✨ Principais Características
- **Interface Responsiva**: Layout moderno e adaptável a diferentes dispositivos
- **Tempo Real**: Atualizações automáticas via Firebase Firestore
- **Autenticação**: Sistema completo de login/registro com Firebase Auth
- **Controle de Acesso**: Diferentes níveis de permissão (Admin, Editor, Usuário)

### 📋 Módulos do Sistema

1. **Dashboard**
   - Estatísticas em tempo real
   - Alertas de estoque baixo e produtos vencidos
   - Ações rápidas

2. **Gestão de Produtos**
   - Cadastro completo de produtos
   - Controle de perecibilidade
   - Preços e fornecedores
   - Busca e filtros avançados

3. **Movimentações**
   - Entradas e saídas de estoque
   - Controle de lotes e data de vencimento
   - Histórico completo

4. **Estoque**
   - Visualização em tempo real
   - Filtros por status (vencido, baixo, etc.)
   - Cálculo automático de saldos

5. **Beneficiamento**
   - Controle de processos de beneficiamento
   - Status tracking
   - Associação com produtos

6. **Localizações**
   - Gestão de locais de armazenamento
   - Informações de contato e responsáveis

7. **Projetos**
   - Controle de projetos ativos
   - Associação com movimentações

8. **Usuários** (Apenas Admin)
   - Gestão de usuários
   - Controle de permissões
   - Redefinição de senhas

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Conta no Firebase (gratuita)
- Navegador web moderno
- Servidor web local (opcional, para desenvolvimento)

### 1. Configuração do Firebase

1. **Criar projeto no Firebase**:
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Clique em "Criar um projeto"
   - Siga o assistente de criação

2. **Habilitar serviços necessários**:
   - **Authentication**: Vá em Authentication > Sign-in method e habilite "Email/Password"
   - **Firestore**: Vá em Firestore Database e crie um banco de dados

3. **Configurar regras de segurança**:

   **Para Firestore** (`firestore.rules`):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Usuários podem ler seus próprios dados
       match /usuarios/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Dados do sistema - requer autenticação
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   **Para Authentication** (regras padrão são suficientes):
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

### 2. Configuração do Código

1. **Obter configurações do Firebase**:
   - No Firebase Console, vá em Project Settings > General
   - Na seção "Your apps", clique em "Web" (ícone `</>`) se não tiver um app
   - Copie a configuração do `firebaseConfig`

2. **Atualizar configuração**:
   - Abra o arquivo `js/firebase-config.js`
   - Substitua os valores de exemplo pelas suas configurações:

   ```javascript
   const firebaseConfig = {
     apiKey: "sua-api-key-aqui",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto-id",
     storageBucket: "seu-projeto.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

### 3. Executar o Sistema

1. **Opção 1 - Servidor Local (Porta 5003)**:
   ```bash
   # Python 3
   python -m http.server 5003
   
   # Node.js (se tiver instalado)
   npx serve . -l 5003
   
   # PHP (se tiver instalado)
   php -S localhost:5003
   ```

2. **Opção 2 - Abertura Direta**:
   - Abra o arquivo `index.html` diretamente no navegador
   - ⚠️ **Nota**: Alguns recursos podem não funcionar devido a políticas CORS

3. **Acesso**:
   - Abra `http://localhost:5003` no navegador
   - O sistema estará disponível

### 4. Primeiro Uso

1. **Registrar usuário administrador**:
   - Como não há usuários cadastrados inicialmente, você pode:
   - Usar o Firebase Console para criar o primeiro usuário
   - Ou modificar temporariamente o código para permitir registro

2. **Configurar dados iniciais**:
   - Acesse como administrador
   - Cadastre localizações e projetos básicos
   - Cadastre alguns produtos para teste

## 📁 Estrutura de Arquivos

```
sistema-estoque-firebase/
│
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos principais
├── js/
│   ├── firebase-config.js  # Configuração do Firebase
│   ├── auth.js             # Sistema de autenticação
│   ├── utils.js            # Utilitários gerais
│   ├── database.js         # Gerenciador do banco de dados
│   ├── app.js              # Aplicação principal
│   └── pages/
│       ├── dashboard.js    # Página do dashboard
│       ├── produtos.js     # Gestão de produtos
│       ├── movimentacoes.js # Gestão de movimentações
│       ├── estoque.js      # Visualização de estoque
│       ├── beneficiamento.js # Gestão de beneficiamento
│       ├── localizacoes.js # Gestão de localizações
│       ├── projetos.js     # Gestão de projetos
│       └── usuarios.js     # Gestão de usuários
└── README.md              # Este arquivo
```

## 🔐 Níveis de Permissão

### Admin
- Acesso total ao sistema
- Gestão de usuários
- Todas as operações CRUD

### Editor
- Criar e editar registros
- Não pode administrar usuários
- Acesso a relatórios

### Usuário
- Apenas visualização
- Sem permissões de edição

## 🚨 Alertas e Notificações

O sistema monitora automaticamente:
- **Estoque baixo**: Produtos abaixo do mínimo configurado
- **Produtos vencidos**: Baseado na data de vencimento
- **Produtos vencendo**: Alertam 7 dias antes do vencimento

## 🔄 Tempo Real

O sistema utiliza Firebase Firestore para:
- Sincronização automática entre dispositivos
- Atualizações instantâneas
- Persistência offline (limitada)

## 🛡️ Segurança

- Autenticação obrigatória
- Controle de permissões por usuário
- Backup automático via Firebase
- Validação de dados no frontend e backend

## 📱 Responsividade

- Layout adaptável para desktop, tablet e mobile
- Menu lateral retrátil
- Tabelas com scroll horizontal quando necessário

## ⚡ Performance

- Carregamento assíncrono de dados
- Cache inteligente via Firebase
- Lazy loading de componentes

## 🔧 Manutenção

### Backup de Dados
O Firebase faz backup automático, mas você pode exportar dados via console.

### Atualizações
Para atualizar o sistema:
1. Faça backup dos dados importantes
2. Substitua os arquivos
3. Teste em ambiente de desenvolvimento primeiro

### Logs e Debug
- Abra as ferramentas de desenvolvedor (F12)
- Verifique o console para erros
- Logs detalhados para debugging

## 🆘 Suporte

### Problemas Comuns

1. **Erro de configuração do Firebase**:
   - Verifique se as configurações estão corretas
   - Confirme se os serviços estão habilitados

2. **Problemas de autenticação**:
   - Verifique se o Email/Password está habilitado
   - Confirme as regras de segurança

3. **Dados não aparecem**:
   - Verifique a conexão com internet
   - Confirme as regras do Firestore

### Contato
Para suporte técnico ou dúvidas sobre implementação.

---

## 📄 Licença

Este projeto foi desenvolvido como sistema de controle de estoque. Use conforme necessário para sua organização.

**Versão**: 1.0  
**Última atualização**: 2024
